import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { NotFoundException } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  notification: {
    create: AsyncMock<Row>;
    findMany: AsyncMock<Row[]>;
    updateMany: AsyncMock<{ count: number }>;
  };
};

describe("NotificationsService", () => {
  let service: NotificationsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "notif-1" }),
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([]),
        updateMany: jest.fn<AsyncFn<{ count: number }>>().mockResolvedValue({ count: 1 }),
      },
    };
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it("creates a notification for the given user", async () => {
    await service.create("user-1", "ORDER", "Title", "Message");
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: "user-1", type: "ORDER", title: "Title", message: "Message" },
    });
  });

  it("lists notifications scoped to the requesting user, newest first", async () => {
    await service.findAllForUser("user-1");
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  describe("markRead", () => {
    it("marks a notification read when it belongs to the user", async () => {
      await service.markRead("user-1", "notif-1");
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: "notif-1", userId: "user-1" },
        data: { isRead: true },
      });
    });

    it("throws NotFoundException when the notification doesn't belong to the user (or doesn't exist)", async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.markRead("user-1", "notif-999")).rejects.toThrow(NotFoundException);
    });
  });

  it("marks every unread notification for the user as read", async () => {
    await service.markAllRead("user-1");
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isRead: false },
      data: { isRead: true },
    });
  });
});
