import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { FLAT_SHIPPING_FEE_PAISE, FREE_SHIPPING_THRESHOLD_PAISE } from "../common/constants";
import { generateOrderNumber } from "../common/order-number";
import { ShippingService } from "../shipping/shipping.service";
import type { UpdateShipmentDto } from "../shipping/dto/update-shipment.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { PaymentsService } from "../payments/payments.service";
import {
  ALLOWED_ORDER_TRANSITIONS,
  notificationTypeForOrderStatus,
  ORDER_STATUS_LABELS,
  STOCK_DEDUCTED_AT_OR_AFTER,
} from "./order-status";
import { CreateOrderDto } from "./dto/create-order.dto";
import { ListOrdersQuery } from "./dto/list-orders.query";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";

const ORDER_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { createdAt: Prisma.SortOrder.asc } },
  shippingAddress: true,
  billingAddress: true,
  payment: true,
  shipment: true,
} satisfies Prisma.OrderInclude;

const ADMIN_LIST_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  items: true,
} satisfies Prisma.OrderInclude;

const ADMIN_DETAIL_INCLUDE = {
  ...ORDER_INCLUDE,
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

type OrderItemLike = { productId: string; variantId: string | null; quantity: number };
type TxClient = Prisma.TransactionClient;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingService: ShippingService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto) {
    const shippingAddress = await this.requireOwnedAddress(userId, dto.shippingAddressId);
    const billingAddress = dto.billingAddressId
      ? await this.requireOwnedAddress(userId, dto.billingAddressId)
      : shippingAddress;

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { savedForLater: false },
          include: { product: true, variant: true },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Your cart is empty");
    }

    for (const item of cart.items) {
      if (item.product.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException(`"${item.product.name}" is no longer available`);
      }
    }

    // Never trust anything cached on the cart item - price is read fresh
    // from Product/ProductVariant here, same as CartService (Section 11).
    const lineItems = cart.items.map((item) => {
      const unitPrice = item.product.price + (item.variant?.priceDelta ?? 0);
      const lineTotal = unitPrice * item.quantity;
      const gstPercent = Number(item.product.gstPercent);
      // Prices are GST-inclusive (Section 9's product page already says
      // "Inclusive of X% GST"), so tax is the portion already inside the
      // price, not added on top - reverse-GST extraction for reporting.
      const taxPortion = gstPercent > 0 ? Math.round((lineTotal * gstPercent) / (100 + gstPercent)) : 0;
      return { item, unitPrice, lineTotal, taxPortion };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const taxAmount = lineItems.reduce((sum, li) => sum + li.taxPortion, 0);
    const discountAmount = 0; // no coupon system wired up yet
    const shippingAmount = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : FLAT_SHIPPING_FEE_PAISE;
    const totalAmount = subtotal - discountAmount + shippingAmount;

    const orderId = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          totalAmount,
          shippingAddressId: shippingAddress.id,
          billingAddressId: billingAddress.id,
        },
      });

      for (const { item, unitPrice, lineTotal } of lineItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            productNameSnapshot: item.product.name,
            skuSnapshot: item.variant?.sku ?? item.product.sku,
            quantity: item.quantity,
            unitPrice,
            mrp: item.product.mrp,
            totalAmount: lineTotal,
          },
        });

        const inventory = await tx.inventory.findFirst({
          where: item.variantId ? { variantId: item.variantId } : { productId: item.productId },
        });
        if (!inventory) {
          throw new ConflictException(`No inventory record for "${item.product.name}"`);
        }

        // Atomic conditional reservation: the availability check and the
        // increment happen in one statement, so two concurrent orders for
        // the last unit can't both succeed (Section 16 / Section 39).
        const reserved = await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reservedStock" = "reservedStock" + ${item.quantity}
          WHERE id = ${inventory.id}
            AND ("currentStock" - "reservedStock") >= ${item.quantity}
        `;
        if (reserved === 0) {
          throw new ConflictException(`Insufficient stock for "${item.product.name}"`);
        }

        await tx.stockMovement.create({
          data: {
            inventoryId: inventory.id,
            type: "RESERVE",
            quantity: item.quantity,
            referenceType: "Order",
            referenceId: order.id,
            reason: "Order placed, awaiting payment",
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "PENDING", note: "Order placed, awaiting payment" },
      });

      return order.id;
    });

    // Cart is intentionally left untouched here: this order isn't paid
    // for yet. Clearing the cart happens once payment is verified, in
    // PaymentsService.markPaid - see docs/payment.md.
    return this.findOne(userId, orderId);
  }

  // Creates (or reuses, on retry) the Razorpay order backing this order's
  // payment, for the frontend to open Razorpay Checkout with.
  async initiatePayment(userId: string, orderId: string) {
    const order = await this.findOne(userId, orderId);
    return this.paymentsService.createRazorpayOrderForOrder(order);
  }

  // Verifies the signature from Razorpay Checkout's success handler and,
  // if valid, confirms the order (Section 13 - never trust the frontend's
  // word alone that payment succeeded).
  async verifyPayment(userId: string, orderId: string, dto: VerifyPaymentDto) {
    const order = await this.findOne(userId, orderId);
    await this.paymentsService.confirmCheckoutPayment(order, dto);
    return this.findOne(userId, orderId);
  }

  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async cancel(userId: string, orderId: string, reason?: string) {
    const order = await this.findOne(userId, orderId);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException("Only pending orders can be cancelled this way");
    }

    await this.prisma.$transaction(async (tx) => {
      await this.releaseReservedStock(tx, order.id, order.items, reason ?? "Order cancelled by customer");
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date(), cancellationReason: reason },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.CANCELLED, note: reason ?? "Cancelled by customer" },
      });
    });

    await this.notificationsService.create(
      userId,
      notificationTypeForOrderStatus(OrderStatus.CANCELLED),
      `Order ${order.orderNumber} cancelled`,
      `Your order ${order.orderNumber} has been cancelled.`,
    );

    return this.findOne(userId, orderId);
  }

  // --- Admin ---

  async findAllAdmin(query: ListOrdersQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { user: { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
              { user: { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ADMIN_LIST_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOneAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: ADMIN_DETAIL_INCLUDE });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async updateStatusAdmin(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOneAdmin(orderId);

    if (!ALLOWED_ORDER_TRANSITIONS[order.status].includes(dto.status)) {
      throw new BadRequestException(`Cannot transition an order from ${order.status} to ${dto.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.status === OrderStatus.PACKED) {
        await this.deductStockForFulfillment(tx, order.id, order.items);
      } else if (dto.status === OrderStatus.CANCELLED) {
        if (STOCK_DEDUCTED_AT_OR_AFTER.includes(order.status)) {
          await this.restockItems(tx, order.id, order.items, dto.note ?? "Order cancelled after fulfillment began");
        } else {
          await this.releaseReservedStock(tx, order.id, order.items, dto.note ?? "Order cancelled by admin");
        }
      } else if (dto.status === OrderStatus.RETURNED) {
        await this.restockItems(tx, order.id, order.items, dto.note ?? "Customer return");
      }

      const timestamps: Prisma.OrderUpdateInput = {};
      if (dto.status === OrderStatus.CONFIRMED) timestamps.confirmedAt = new Date();
      if (dto.status === OrderStatus.DELIVERED) timestamps.deliveredAt = new Date();
      if (dto.status === OrderStatus.CANCELLED) {
        timestamps.cancelledAt = new Date();
        timestamps.cancellationReason = dto.note;
      }

      await tx.order.update({ where: { id: order.id }, data: { status: dto.status, ...timestamps } });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: dto.status, note: dto.note },
      });
      await this.shippingService.syncStatus(tx, order.id, dto.status);
    });

    await this.notificationsService.create(
      order.userId,
      notificationTypeForOrderStatus(dto.status),
      `Order ${order.orderNumber} ${ORDER_STATUS_LABELS[dto.status]}`,
      `Your order ${order.orderNumber} is now ${ORDER_STATUS_LABELS[dto.status]}.`,
    );

    return this.findOneAdmin(orderId);
  }

  async updateShipmentAdmin(orderId: string, dto: UpdateShipmentDto) {
    await this.findOneAdmin(orderId); // 404s if the order doesn't exist
    await this.shippingService.updateTracking(orderId, dto);
    return this.findOneAdmin(orderId);
  }

  // --- Inventory side-effects, shared by customer cancel and admin status updates ---

  private async releaseReservedStock(tx: TxClient, orderId: string, items: OrderItemLike[], reason: string) {
    for (const item of items) {
      const inventory = await tx.inventory.findFirst({
        where: item.variantId ? { variantId: item.variantId } : { productId: item.productId },
      });
      if (!inventory) continue;

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reservedStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "RELEASE",
          quantity: item.quantity,
          referenceType: "Order",
          referenceId: orderId,
          reason,
        },
      });
    }
  }

  private async deductStockForFulfillment(tx: TxClient, orderId: string, items: OrderItemLike[]) {
    for (const item of items) {
      const inventory = await tx.inventory.findFirst({
        where: item.variantId ? { variantId: item.variantId } : { productId: item.productId },
      });
      if (!inventory) continue;

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { currentStock: { decrement: item.quantity }, reservedStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "DEDUCT",
          quantity: item.quantity,
          referenceType: "Order",
          referenceId: orderId,
          reason: "Packed for shipping",
        },
      });
    }
  }

  private async restockItems(tx: TxClient, orderId: string, items: OrderItemLike[], reason: string) {
    for (const item of items) {
      const inventory = await tx.inventory.findFirst({
        where: item.variantId ? { variantId: item.variantId } : { productId: item.productId },
      });
      if (!inventory) continue;

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { currentStock: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "RESTOCK",
          quantity: item.quantity,
          referenceType: "Order",
          referenceId: orderId,
          reason,
        },
      });
    }
  }

  private async requireOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      throw new BadRequestException("Address does not belong to you");
    }
    return address;
  }
}
