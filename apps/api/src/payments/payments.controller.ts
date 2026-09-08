import { BadRequestException, Controller, Headers, Post, Req } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Public (no auth) - Razorpay calls this server-to-server. Trust comes
  // entirely from the x-razorpay-signature check inside handleWebhook,
  // computed over the raw body (enabled via NestFactory's rawBody
  // option in main.ts), never the parsed JSON.
  @Post("webhook")
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers("x-razorpay-signature") signature?: string) {
    if (!signature || !req.rawBody) {
      throw new BadRequestException("Missing webhook signature");
    }
    await this.paymentsService.handleWebhook(req.rawBody, signature);
    return { status: "ok" };
  }
}
