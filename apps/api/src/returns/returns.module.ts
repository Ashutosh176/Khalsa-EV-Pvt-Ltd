import { Module } from "@nestjs/common";
import { ReturnsController } from "./returns.controller";
import { AdminReturnsController } from "./admin-returns.controller";
import { ReturnsService } from "./returns.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
