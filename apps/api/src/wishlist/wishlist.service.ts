import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { computeAvailableStock } from "../common/stock";
import { CartService } from "../cart/cart.service";
import { AddWishlistItemDto } from "./dto/add-wishlist-item.dto";

const ITEM_INCLUDE = {
  product: {
    include: {
      images: { orderBy: { sortOrder: Prisma.SortOrder.asc }, take: 1 },
      inventory: true,
    },
  },
} satisfies Prisma.WishlistItemInclude;

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async getWishlist(userId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    return this.present(wishlist.items);
  }

  async addItem(userId: string, dto: AddWishlistItemDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException("productId does not reference an available product");
    }

    const wishlist = await this.getOrCreateWishlist(userId);
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId: dto.productId } },
    });
    if (!existing) {
      await this.prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId: dto.productId } });
    }

    return this.getWishlist(userId);
  }

  async removeItem(userId: string, itemId: string) {
    await this.requireOwnedItem(userId, itemId);
    await this.prisma.wishlistItem.delete({ where: { id: itemId } });
    return this.getWishlist(userId);
  }

  async moveToCart(userId: string, itemId: string) {
    const item = await this.requireOwnedItem(userId, itemId);
    const cart = await this.cartService.addItem(userId, { productId: item.productId, quantity: 1 });
    await this.prisma.wishlistItem.delete({ where: { id: itemId } });
    return { wishlist: await this.getWishlist(userId), cart };
  }

  private async requireOwnedItem(userId: string, itemId: string) {
    const item = await this.prisma.wishlistItem.findUnique({ where: { id: itemId }, include: { wishlist: true } });
    if (!item || item.wishlist.userId !== userId) {
      throw new NotFoundException(`Wishlist item ${itemId} not found`);
    }
    return item;
  }

  private async getOrCreateWishlist(userId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: { items: { include: ITEM_INCLUDE, orderBy: { createdAt: "desc" } } },
    });
    if (existing) return existing;

    return this.prisma.wishlist.create({
      data: { userId },
      include: { items: { include: ITEM_INCLUDE, orderBy: { createdAt: "desc" } } },
    });
  }

  private present(
    items: Prisma.WishlistItemGetPayload<{ include: typeof ITEM_INCLUDE }>[],
  ) {
    return items.map((item) => {
      const availableStock = computeAvailableStock(item.product.inventory);
      return {
        id: item.id,
        productId: item.productId,
        product: {
          name: item.product.name,
          slug: item.product.slug,
          sku: item.product.sku,
          price: item.product.price,
          mrp: item.product.mrp,
          imageUrl: item.product.images[0]?.url,
          inStock: availableStock > 0,
        },
      };
    });
  }
}
