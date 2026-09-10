import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { of, firstValueFrom } from "rxjs";
import { AuditLogInterceptor } from "./audit-log.interceptor";
import type { AuditLogService } from "./audit-log.service";

class FakeController {}

function makeContext(overrides: {
  method: string;
  user?: { sub: string; role: string | null };
  params?: Record<string, string>;
  body?: unknown;
}): ExecutionContext {
  const request = { method: overrides.method, user: overrides.user, params: overrides.params ?? {}, body: overrides.body };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getClass: () => FakeController,
    getHandler: () => function create() {},
  } as unknown as ExecutionContext;
}

function makeHandler(): CallHandler {
  return { handle: () => of({ id: "result-1" }) };
}

describe("AuditLogInterceptor", () => {
  let auditLogService: { log: ReturnType<typeof jest.fn> };
  let interceptor: AuditLogInterceptor;

  beforeEach(() => {
    auditLogService = { log: jest.fn(() => Promise.resolve()) };
    interceptor = new AuditLogInterceptor(auditLogService as unknown as AuditLogService);
  });

  it("does not log a GET request", async () => {
    const context = makeContext({ method: "GET", user: { sub: "admin-1", role: "SUPER_ADMIN" } });
    await firstValueFrom(interceptor.intercept(context, makeHandler()));
    expect(auditLogService.log).not.toHaveBeenCalled();
  });

  it("does not log a customer-authenticated mutation (role: null)", async () => {
    const context = makeContext({ method: "POST", user: { sub: "user-1", role: null } });
    await firstValueFrom(interceptor.intercept(context, makeHandler()));
    expect(auditLogService.log).not.toHaveBeenCalled();
  });

  it("does not log an unauthenticated request", async () => {
    const context = makeContext({ method: "POST" });
    await firstValueFrom(interceptor.intercept(context, makeHandler()));
    expect(auditLogService.log).not.toHaveBeenCalled();
  });

  it("logs an admin POST with the controller/handler name and entityId from params", async () => {
    const context = makeContext({
      method: "PATCH",
      user: { sub: "admin-1", role: "SUPER_ADMIN" },
      params: { id: "coupon-1" },
      body: { title: "New title" },
    });
    await firstValueFrom(interceptor.intercept(context, makeHandler()));

    expect(auditLogService.log).toHaveBeenCalledWith({
      adminUserId: "admin-1",
      action: "Fake.create",
      entityType: "Fake",
      entityId: "coupon-1",
      metadata: { title: "New title" },
    });
  });

  it("redacts a password field in the request body", async () => {
    const context = makeContext({
      method: "POST",
      user: { sub: "admin-1", role: "SUPER_ADMIN" },
      body: { email: "a@b.com", password: "hunter2" },
    });
    await firstValueFrom(interceptor.intercept(context, makeHandler()));

    const call = auditLogService.log.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> };
    expect(call.metadata).toEqual({ email: "a@b.com", password: "[redacted]" });
  });
});
