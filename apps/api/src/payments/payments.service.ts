import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { NotificationType, OrderStatus, Payment, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { requireEnv } from "../common/env";
import { RazorpayClient } from "./razorpay.client";
import { VerifyPaymentDto } from "../orders/dto/verify-payment.dto";

type OrderForPayment = {
  id: string;
  userId: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  payment: Payment | null;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayClient,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Creates (or, on retry - e.g. the customer refreshed the checkout
  // page - reuses) the Razorpay order backing this Order's payment.
  async createRazorpayOrderForOrder(order: OrderForPayment) {
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException("This order is not awaiting payment");
    }
    if (order.payment?.status === PaymentStatus.PAID) {
      throw new BadRequestException("This order has already been paid");
    }

    if (order.payment?.razorpayOrderId) {
      return {
        razorpayOrderId: order.payment.razorpayOrderId,
        amount: order.payment.amount,
        currency: order.payment.currency,
        keyId: requireEnv("RAZORPAY_KEY_ID"),
      };
    }

    const razorpayOrder = await this.razorpay.createOrder(order.totalAmount, order.orderNumber);

    if (order.payment) {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { razorpayOrderId: razorpayOrder.id, amount: order.totalAmount },
      });
    } else {
      await this.prisma.payment.create({
        data: { orderId: order.id, amount: order.totalAmount, razorpayOrderId: razorpayOrder.id },
      });
    }

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      currency: razorpayOrder.currency,
      keyId: requireEnv("RAZORPAY_KEY_ID"),
    };
  }

  // Verifies the signature Razorpay Checkout's success handler hands
  // back to the frontend, then confirms the order - per Section 13, a
  // frontend "payment successful" message is never trusted on its own.
  async confirmCheckoutPayment(order: OrderForPayment, dto: VerifyPaymentDto) {
    if (!order.payment || order.payment.razorpayOrderId !== dto.razorpayOrderId) {
      throw new BadRequestException("Payment does not match this order");
    }
    if (order.payment.status === PaymentStatus.PAID) {
      return; // Already confirmed - e.g. the webhook won the race with this callback.
    }

    const valid = this.razorpay.verifyCheckoutSignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
    if (!valid) {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: PaymentStatus.FAILED, failureReason: "Signature verification failed" },
      });
      throw new BadRequestException("Payment verification failed");
    }

    await this.markPaid(order.id, order.payment.id, dto.razorpayPaymentId, dto.razorpaySignature);
  }

  // Razorpay webhook (payment.captured / payment.failed) - a separate,
  // server-to-server confirmation path independent of whether the
  // customer's browser ever called confirmCheckoutPayment above (closed
  // tab, network drop, etc.). Idempotent against both duplicate webhook
  // delivery and a race with the checkout callback.
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException("Invalid webhook signature");
    }

    const event = JSON.parse(rawBody.toString("utf8")) as {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string; error_description?: string } } };
    };
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity?.order_id) return;

    const payment = await this.prisma.payment.findFirst({ where: { razorpayOrderId: paymentEntity.order_id } });
    if (!payment) {
      this.logger.warn(`Webhook for unknown Razorpay order ${paymentEntity.order_id}`);
      return;
    }

    if (event.event === "payment.captured") {
      if (payment.status !== PaymentStatus.PAID && paymentEntity.id) {
        await this.markPaid(payment.orderId, payment.id, paymentEntity.id, null);
      }
    } else if (event.event === "payment.failed") {
      if (payment.status === PaymentStatus.PENDING) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED, failureReason: paymentEntity.error_description ?? "Payment failed" },
        });
      }
    }
  }

  private async markPaid(
    orderId: string,
    paymentId: string,
    razorpayPaymentId: string,
    razorpaySignature: string | null,
  ) {
    const order = await this.prisma.$transaction(async (tx) => {
      // Re-read status inside the transaction: the checkout callback and
      // the webhook can both reach here for the same payment.
      const current = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
      if (current.status === PaymentStatus.PAID) return null;

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          razorpayPaymentId,
          razorpaySignature: razorpaySignature ?? undefined,
          paidAt: new Date(),
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED, confirmedAt: new Date() },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status: OrderStatus.CONFIRMED, note: "Payment received via Razorpay" },
      });

      // The order was built from the active cart (Section 11) - now that
      // it's actually paid for, those lines are done; saved-for-later
      // items are untouched.
      await tx.cartItem.deleteMany({ where: { cart: { userId: updatedOrder.userId }, savedForLater: false } });

      return updatedOrder;
    });

    if (!order) return;

    await this.notificationsService.create(
      order.userId,
      NotificationType.PAYMENT,
      `Payment received for order ${order.orderNumber}`,
      `Your payment for order ${order.orderNumber} was successful and the order is now confirmed.`,
    );
  }
}
