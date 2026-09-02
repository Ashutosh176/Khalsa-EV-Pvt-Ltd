import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReturnDto } from "./dto/create-return.dto";

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReturnDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException("Only delivered orders are eligible for a return");
    }

    if (dto.orderItemId && !order.items.some((item) => item.id === dto.orderItemId)) {
      throw new BadRequestException("This item does not belong to the specified order");
    }

    return this.prisma.return.create({
      data: {
        orderId: order.id,
        orderItemId: dto.orderItemId,
        userId,
        reason: dto.reason,
      },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.return.findMany({
      where: { userId },
      include: {
        order: { select: { id: true, orderNumber: true } },
        refund: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
