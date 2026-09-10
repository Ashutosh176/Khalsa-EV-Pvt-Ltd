import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { Observable, tap } from "rxjs";
import type { JwtPayload } from "../auth/auth.types";
import { AuditLogService } from "./audit-log.service";

// Fields that must never end up in metadata, no matter which endpoint
// happens to accept them - a superset across every admin DTO in the app
// so this interceptor stays correct without having to track every module.
const REDACTED_KEYS = new Set([
  "password",
  "newPassword",
  "currentPassword",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
]);

const AUDITED_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function redact(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;
  const entries = Object.entries(body as Record<string, unknown>).map(([key, value]) => [
    key,
    REDACTED_KEYS.has(key) ? "[redacted]" : value,
  ]);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

// Global (registered once in main.ts, not per-controller) so every
// current AND future admin-guarded mutation gets an audit trail entry for
// free - Section 21's AdminAuditLog model existed since the schema was
// written but nothing ever wrote to it. Scoped to admin actions only via
// user.role: AdminAuthGuard refuses to set request.user at all unless the
// token's role is non-null, while JwtAuthGuard (customer routes) sets
// role: null - so this never logs a customer placing an order or writing
// a review, only genuine admin-authenticated requests.
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();

    if (!AUDITED_METHODS.has(request.method) || !request.user?.role) {
      return next.handle();
    }

    const adminUserId = request.user.sub;
    const controllerName = context.getClass().name.replace(/Controller$/, "");
    const handlerName = context.getHandler().name;
    const entityId = typeof request.params?.id === "string" ? request.params.id : undefined;
    const metadata = redact(request.body);

    return next.handle().pipe(
      tap(() => {
        void this.auditLogService.log({
          adminUserId,
          action: `${controllerName}.${handlerName}`,
          entityType: controllerName,
          entityId,
          metadata,
        });
      }),
    );
  }
}
