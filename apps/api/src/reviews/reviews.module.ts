import { Module } from "@nestjs/common";
import { ReviewsController } from "./reviews.controller";
import { AdminReviewsController } from "./admin-reviews.controller";
import { ReviewsService } from "./reviews.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
