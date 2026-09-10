import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { isUniqueConstraintError } from "../common/prisma-error";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ListAdminReviewsQuery } from "./dto/list-admin-reviews.query";

const ADMIN_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ReviewInclude;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    // A review is a claim about a real experience with the product, so
    // it's gated the same way a return request is (Section 23-adjacent):
    // only a customer with a DELIVERED order containing this product may
    // leave one.
    const purchased = await this.prisma.orderItem.findFirst({
      where: { productId: dto.productId, order: { userId, status: OrderStatus.DELIVERED } },
    });
    if (!purchased) {
      throw new BadRequestException("You can only review products from a delivered order");
    }

    try {
      // isApproved defaults to false (schema) - held for moderation before
      // it's visible to other customers; the author can still see it via
      // findMineForProduct/findAllMine below.
      return await this.prisma.review.create({
        data: { userId, productId: dto.productId, rating: dto.rating, title: dto.title, comment: dto.comment },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException("You have already reviewed this product");
      }
      throw error;
    }
  }

  async findApprovedForProduct(productId: string) {
    const [items, aggregate] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { productId, isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      items,
      averageRating: aggregate._avg.rating ?? 0,
      totalCount: aggregate._count,
    };
  }

  findAllMine(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findAllAdmin(query: ListAdminReviewsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ReviewWhereInput = query.isApproved === undefined ? {} : { isApproved: query.isApproved };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: ADMIN_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async approve(id: string) {
    const review = await this.requireReview(id);
    const updated = await this.prisma.review.update({ where: { id }, data: { isApproved: true } });

    await this.notificationsService.create(
      review.userId,
      NotificationType.SYSTEM,
      "Your review was published",
      "Thanks for your feedback - your review is now visible on the product page.",
    );

    return updated;
  }

  // No "rejected" state exists on the model (isApproved is a plain
  // boolean) - an admin rejecting a review removes it outright rather
  // than leaving it in permanent limbo.
  async remove(id: string) {
    await this.requireReview(id);
    return this.prisma.review.delete({ where: { id } });
  }

  private async requireReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return review;
  }
}
