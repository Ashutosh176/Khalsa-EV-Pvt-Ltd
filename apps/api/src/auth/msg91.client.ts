import { BadGatewayException, Injectable } from "@nestjs/common";
import { requireEnv } from "../common/env";

// MSG91 OTP REST API v5 (https://docs.msg91.com/otp). MSG91 generates,
// stores and expires the OTP itself - we never see or store the code,
// only whether their /verify call reports success for a given mobile.
const MSG91_OTP_BASE_URL = "https://control.msg91.com/api/v5/otp";

type Msg91Response = { type: "success" | "error"; message: string };

@Injectable()
export class Msg91Client {
  async sendOtp(mobile: string): Promise<void> {
    const url = `${MSG91_OTP_BASE_URL}?template_id=${encodeURIComponent(this.templateId())}&mobile=${mobile}`;
    const body = await this.request(url, "POST");
    if (body.type !== "success") {
      throw new BadGatewayException(body.message || "MSG91 failed to send the OTP");
    }
  }

  // Returns false for a simple "wrong code" (an expected, common user
  // error) rather than throwing - only an unreachable/malformed MSG91
  // response is treated as a system-level failure.
  async verifyOtp(mobile: string, otp: string): Promise<boolean> {
    const url = `${MSG91_OTP_BASE_URL}/verify?mobile=${mobile}&otp=${encodeURIComponent(otp)}`;
    const body = await this.request(url, "GET");
    return body.type === "success";
  }

  private templateId(): string {
    return requireEnv("MSG91_OTP_TEMPLATE_ID");
  }

  private async request(url: string, method: "GET" | "POST"): Promise<Msg91Response> {
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: { authkey: requireEnv("MSG91_AUTH_KEY"), "Content-Type": "application/json" },
      });
    } catch (error) {
      throw new BadGatewayException(`Could not reach MSG91: ${(error as Error).message}`);
    }

    const body = (await response.json().catch(() => null)) as Msg91Response | null;
    if (!body) {
      throw new BadGatewayException("MSG91 returned an unreadable response");
    }
    return body;
  }
}
