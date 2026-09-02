import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { computeAvailableStock } from "../common/stock";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

const ITEM_INCLUDE = {
  product: {
    include: {
      images: { orderBy: { sortOrder: Prisma.SortOrder.asc }, take: 1 },
      inventory: true,
    },
  },
  variant: true,
} satisfies Prisma.CartItemInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: { items: { include: typeof ITEM_INCLUDE } } }>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.present(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException("productId does not reference an available product");
    }

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } });
      if (!variant || variant.productId !== dto.productId) {
        throw new BadRequestException("variantId does not belong to the given product");
      }
    }

    const cart = await this.getOrCreateCart(userId);
    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: dto.productId, variantId: dto.variantId ?? null },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity, savedForLater: false },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    await this.requireOwnedItem(userId, itemId);
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity, savedForLater: dto.savedForLater },
    });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    await this.requireOwnedItem(userId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  private async requireOwnedItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException(`Cart item ${itemId} not found`);
    }
    return item;
  }

  private async getOrCreateCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: ITEM_INCLUDE, orderBy: { createdAt: "asc" } } },
    });
    if (existing) return existing;

    return this.prisma.cart.create({
      data: { userId },
      include: { items: { include: ITEM_INCLUDE, orderBy: { createdAt: "asc" } } },
    });
  }

  // Never trust client-calculated totals (Section 11) - every price
  // here is read fresh from Product on each request, not cached on
  // the cart item.
  private present(cart: CartWithItems) {
    const items = cart.items.map((item) => {
      const unitPrice = item.product.price + (item.variant?.priceDelta ?? 0);
      const availableStock = computeAvailableStock(item.product.inventory);
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        savedForLater: item.savedForLater,
        unitPrice,
        mrp: item.product.mrp,
        lineTotal: unitPrice * item.quantity,
        inStock: availableStock >= item.quantity,
        product: {
          name: item.product.name,
          slug: item.product.slug,
          sku: item.product.sku,
          imageUrl: item.product.images[0]?.url,
        },
        variant: item.variant ? { color: item.variant.color } : null,
      };
    });

    const activeItems = items.filter((item) => !item.savedForLater);
    const subtotal = activeItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalMrp = activeItems.reduce((sum, item) => sum + item.mrp * item.quantity, 0);

    return {
      items,
      itemCount: activeItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      totalMrp,
      totalSavings: totalMrp - subtotal,
    };
  }
}
