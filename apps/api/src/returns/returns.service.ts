import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, OrderStatus, Prisma, ReturnStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PaymentsService } from "../payments/payments.service";
import { CreateReturnDto } from "./dto/create-return.dto";
import { ListReturnsQuery } from "./dto/list-returns.query";
import { UpdateReturnStatusDto } from "./dto/update-return-status.dto";
import { ALLOWED_RETURN_TRANSITIONS, RETURN_STATUS_LABELS } from "./return-status";

const ADMIN_INCLUDE = {
  order: { select: { id: true, orderNumber: true } },
  user: { select: { id: true, name: true, email: true } },
  refund: true,
} satisfies Prisma.ReturnInclude;

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
  ) {}

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

  async findAllAdmin(query: ListReturnsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ReturnWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { order: { orderNumber: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
              { user: { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
              { user: { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.return.findMany({
        where,
        include: ADMIN_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.return.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOneAdmin(id: string) {
    const returnRequest = await this.prisma.return.findUnique({ where: { id }, include: ADMIN_INCLUDE });
    if (!returnRequest) {
      throw new NotFoundException(`Return ${id} not found`);
    }
    return returnRequest;
  }

  async updateStatusAdmin(id: string, dto: UpdateReturnStatusDto) {
    const returnRequest = await this.findOneAdmin(id);

    if (!ALLOWED_RETURN_TRANSITIONS[returnRequest.status].includes(dto.status)) {
      throw new BadRequestException(`Cannot transition a return from ${returnRequest.status} to ${dto.status}`);
    }

    // Trigger the refund before flipping the status, not after: if
    // Razorpay rejects it, the return stays in its current status (e.g.
    // RECEIVED) instead of showing COMPLETED with no refund behind it, and
    // the admin can just retry the same "Mark as COMPLETED" action -
    // refundForReturn is idempotent against a Refund already existing.
    if (dto.status === ReturnStatus.COMPLETED) {
      const amount = returnRequest.orderItemId
        ? (await this.prisma.orderItem.findUniqueOrThrow({ where: { id: returnRequest.orderItemId } })).totalAmount
        : (await this.prisma.order.findUniqueOrThrow({ where: { id: returnRequest.orderId } })).totalAmount;

      await this.paymentsService.refundForReturn(returnRequest.id, returnRequest.orderId, amount);
    }

    await this.prisma.return.update({
      where: { id },
      data: { status: dto.status, adminNote: dto.adminNote ?? returnRequest.adminNote },
    });

    await this.notificationsService.create(
      returnRequest.userId,
      NotificationType.RETURN,
      `Return request ${RETURN_STATUS_LABELS[dto.status]}`,
      dto.status === ReturnStatus.COMPLETED
        ? `Your return request for order ${returnRequest.order.orderNumber} is complete. Your refund has been initiated and will reflect in your original payment method shortly.`
        : `Your return request for order ${returnRequest.order.orderNumber} is now ${RETURN_STATUS_LABELS[dto.status]}.`,
    );

    return this.findOneAdmin(id);
  }
}
