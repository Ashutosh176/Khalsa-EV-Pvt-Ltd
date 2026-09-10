import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Coupon, CouponType, Prisma } from "@prisma/client";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { PrismaService } from "../prisma/prisma.service";
import { isUniqueConstraintError } from "../common/prisma-error";
import { CartService } from "../cart/cart.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { computeCouponDiscount } from "./coupon-discount";

type TxClient = Prisma.TransactionClient;

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  findAllAdmin() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(dto: CreateCouponDto) {
    this.assertValidValue(dto.type, dto.value);
    const code = dto.code.trim().toUpperCase();

    try {
      return await this.prisma.coupon.create({
        data: {
          code,
          type: dto.type,
          value: dto.value,
          minOrderAmount: dto.minOrderAmount ?? 0,
          maxDiscountAmount: dto.maxDiscountAmount,
          usageLimit: dto.usageLimit,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error, "code")) {
        throw new ConflictException(`A coupon with code "${code}" already exists`);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCouponDto) {
    const current = await this.requireCoupon(id);
    const nextType = dto.type ?? current.type;
    const nextValue = dto.value ?? current.value;
    this.assertValidValue(nextType, nextValue);

    try {
      return await this.prisma.coupon.update({
        where: { id },
        data: {
          code: dto.code?.trim().toUpperCase(),
          type: dto.type,
          value: dto.value,
          minOrderAmount: dto.minOrderAmount,
          maxDiscountAmount: dto.maxDiscountAmount,
          usageLimit: dto.usageLimit,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
          isActive: dto.isActive,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error, "code")) {
        throw new ConflictException(`A coupon with code "${dto.code}" already exists`);
      }
      throw error;
    }
  }

  // Soft delete: an order can reference a coupon (Order.couponId), so a
  // coupon that has ever been used is hidden from new checkouts rather
  // than removed, same rationale as product/category/brand archiving.
  async archive(id: string) {
    await this.requireCoupon(id);
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }

  // Customer-facing preview: validates against the caller's own current
  // cart subtotal (never a client-submitted number) so the amount shown
  // before checkout matches what applyToOrder will actually charge.
  async previewForCart(userId: string, code: string) {
    const cart = await this.cartService.getCart(userId);
    if (cart.subtotal <= 0) {
      throw new BadRequestException("Your cart is empty");
    }

    const coupon = await this.validate(this.prisma, code, cart.subtotal);
    const discountAmount = computeCouponDiscount(coupon, cart.subtotal);
    return { code: coupon.code, discountAmount };
  }

  // Called from inside OrdersService.createFromCart's transaction, against
  // the authoritative subtotal computed there. Re-validates rather than
  // trusting the preview above (the cart, or the coupon itself, could have
  // changed in between) and atomically claims one use so two concurrent
  // orders can't both slip in under a usageLimit - the same conditional-
  // update trick OrdersService already uses for inventory reservation.
  async applyToOrder(tx: TxClient, code: string, subtotal: number) {
    const coupon = await this.validate(tx, code, subtotal);
    const discountAmount = computeCouponDiscount(coupon, subtotal);

    const claimed = await tx.$executeRaw`
      UPDATE "Coupon"
      SET "usedCount" = "usedCount" + 1
      WHERE id = ${coupon.id} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
    `;
    if (claimed === 0) {
      throw new BadRequestException("This coupon has just reached its usage limit");
    }

    return { couponId: coupon.id, discountAmount };
  }

  private async validate(client: PrismaService | TxClient, code: string, subtotal: number): Promise<Coupon> {
    const coupon = await client.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException("Invalid coupon code");
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException("This coupon is not active yet");
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      throw new BadRequestException("This coupon has expired");
    }
    if (subtotal < coupon.minOrderAmount) {
      throw new BadRequestException(`This coupon requires a minimum order of ${formatIndianRupees(coupon.minOrderAmount)}`);
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException("This coupon has reached its usage limit");
    }

    return coupon;
  }

  private assertValidValue(type: CouponType, value: number) {
    if (type === CouponType.PERCENTAGE && (value < 1 || value > 100)) {
      throw new BadRequestException("A percentage coupon's value must be between 1 and 100");
    }
  }

  private async requireCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon ${id} not found`);
    }
    return coupon;
  }
}
