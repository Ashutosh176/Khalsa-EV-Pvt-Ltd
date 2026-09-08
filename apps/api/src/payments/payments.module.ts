import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayClient } from "./razorpay.client";

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayClient],
  exports: [PaymentsService],
})
export class PaymentsModule {}
