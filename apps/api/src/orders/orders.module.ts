import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { OrdersService } from "./orders.service";
import { ShippingModule } from "../shipping/shipping.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [ShippingModule, NotificationsModule, PaymentsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
