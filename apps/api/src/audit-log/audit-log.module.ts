import { Module } from "@nestjs/common";
import { AdminAuditLogController } from "./admin-audit-log.controller";
import { AuditLogService } from "./audit-log.service";
import { AuditLogInterceptor } from "./audit-log.interceptor";

@Module({
  controllers: [AdminAuditLogController],
  providers: [AuditLogService, AuditLogInterceptor],
  exports: [AuditLogInterceptor],
})
export class AuditLogModule {}
