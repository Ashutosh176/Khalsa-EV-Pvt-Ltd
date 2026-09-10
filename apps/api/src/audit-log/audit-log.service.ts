import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListAuditLogQuery } from "./dto/list-audit-log.query";

export type AuditLogEntry = {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  // Always the parsed JSON request body (or a redacted copy of it) - safe
  // to hand to Prisma's Json column as-is.
  metadata?: Record<string, unknown>;
};

const ADMIN_INCLUDE = {
  adminUser: { select: { id: true, name: true, email: true } },
} satisfies Prisma.AdminAuditLogInclude;

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Called from AuditLogInterceptor after every successful admin mutation
  // - best-effort by design (Section 21's accountability trail is a
  // record of what happened, not a critical-path check), so a logging
  // failure must never surface as a 500 on the action it's describing.
  async log(entry: AuditLogEntry) {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminUserId: entry.adminUserId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to write audit log entry: ${(error as Error).message}`);
    }
  }

  async findAll(query: ListAuditLogQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(query.adminUserId ? { adminUserId: query.adminUserId } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        include: ADMIN_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
