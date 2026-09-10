import { createHmac, timingSafeEqual } from "node:crypto";
import { BadGatewayException, Injectable } from "@nestjs/common";
import { requireEnv } from "../common/env";

// Talks to Razorpay's REST API directly with fetch + Basic Auth, same
// pattern as Msg91Client - no SDK dependency needed for the handful of
// calls this makes.
const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

type RazorpayRefundResponse = {
  id: string;
  payment_id: string;
  amount: number;
  status: string; // "pending" | "processed" | "failed"
};

@Injectable()
export class RazorpayClient {
  async createOrder(amountPaise: number, receipt: string): Promise<RazorpayOrderResponse> {
    const keyId = requireEnv("RAZORPAY_KEY_ID");
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    let response: Response;
    try {
      response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        // payment_capture: 1 - auto-capture on success, so a successful
        // checkout is immediately "captured" rather than sitting
        // "authorized" awaiting a separate capture call we don't make.
        body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, payment_capture: 1 }),
      });
    } catch (error) {
      throw new BadGatewayException(`Could not reach Razorpay: ${(error as Error).message}`);
    }

    const body = (await response.json().catch(() => null)) as
      | RazorpayOrderResponse
      | { error?: { description?: string } }
      | null;
    if (!response.ok || !body || !("id" in body)) {
      const description = body && "error" in body ? body.error?.description : undefined;
      throw new BadGatewayException(`Razorpay order creation failed: ${description ?? response.statusText}`);
    }
    return body;
  }

  // Issues a refund against a captured payment. amountPaise < the original
  // payment amount is a partial refund (used for a single-item return);
  // passing the full amount refunds it all. Razorpay settles instantly for
  // most methods (status comes back "processed" already) but can also
  // return "pending" and settle later via the refund.processed webhook -
  // callers must handle both.
  async createRefund(razorpayPaymentId: string, amountPaise: number, notes?: Record<string, string>): Promise<RazorpayRefundResponse> {
    const keyId = requireEnv("RAZORPAY_KEY_ID");
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    let response: Response;
    try {
      response = await fetch(`${RAZORPAY_API_BASE}/payments/${razorpayPaymentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({ amount: amountPaise, notes }),
      });
    } catch (error) {
      throw new BadGatewayException(`Could not reach Razorpay: ${(error as Error).message}`);
    }

    const body = (await response.json().catch(() => null)) as
      | RazorpayRefundResponse
      | { error?: { description?: string } }
      | null;
    if (!response.ok || !body || !("id" in body)) {
      const description = body && "error" in body ? body.error?.description : undefined;
      throw new BadGatewayException(`Razorpay refund failed: ${description ?? response.statusText}`);
    }
    return body;
  }

  // Razorpay Checkout's success callback verification - per their docs:
  // hmac_sha256(razorpay_order_id + "|" + razorpay_payment_id, key_secret).
  // This is the only thing standing between "the browser said it worked"
  // and actually marking an order paid, so it must run server-side before
  // any Payment/Order status changes.
  verifyCheckoutSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean {
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
    const expected = createHmac("sha256", keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
    return safeEqualHex(expected, signature);
  }

  // Webhook signature - a separate scheme from the checkout callback
  // above, keyed by RAZORPAY_WEBHOOK_SECRET and computed over the exact
  // raw request body: hmac_sha256(rawBody, webhook_secret).
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const webhookSecret = requireEnv("RAZORPAY_WEBHOOK_SECRET");
    const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    return safeEqualHex(expected, signature);
  }
}

function safeEqualHex(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
