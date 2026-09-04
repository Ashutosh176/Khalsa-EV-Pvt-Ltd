import { BadGatewayException, Injectable } from "@nestjs/common";
import { requireEnv } from "../common/env";

// MSG91 OTP Widget (https://docs.msg91.com/otp-widget). The widget's
// client-side JS SDK owns the actual send/verify/retry UI and OTP
// generation entirely - our backend never talks to MSG91 to send or
// check a code. Our only server-side job is to redeem the JWT
// access-token the widget hands back after a successful client-side
// verification, via MSG91's own verifyAccessToken endpoint, so a
// forged/absent token can't be used to fake a verified phone.
const MSG91_VERIFY_ACCESS_TOKEN_URL = "https://control.msg91.com/api/v5/widget/verifyAccessToken";

type Msg91VerifyResponse = { type: "success" | "error"; message: unknown };

@Injectable()
export class Msg91Client {
  // Returns the verified mobile number MSG91 associates with this
  // access-token, or null if MSG91 rejects the token (expired, already
  // consumed, or never issued) - a rejected token is an expected
  // outcome, not a system failure, so this returns null rather than
  // throwing.
  async verifyWidgetAccessToken(accessToken: string): Promise<string | null> {
    let response: Response;
    try {
      response = await fetch(MSG91_VERIFY_ACCESS_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authkey: requireEnv("MSG91_AUTH_KEY"), "access-token": accessToken }),
      });
    } catch (error) {
      throw new BadGatewayException(`Could not reach MSG91: ${(error as Error).message}`);
    }

    const body = (await response.json().catch(() => null)) as Msg91VerifyResponse | null;
    if (!body) {
      throw new BadGatewayException("MSG91 returned an unreadable response");
    }
    if (body.type !== "success") {
      return null;
    }
    return extractMobile(body.message);
  }
}

// MSG91's documented response shape for a successful verifyAccessToken
// call isn't pinned down publicly - `message` has been seen as either
// the verified identifier directly, or an object wrapping it under a
// field like `mobile`/`identifier`/`number`. Handling all three keeps
// this working regardless of which shape the live account returns,
// without ever guessing/fabricating a phone number that MSG91 didn't
// actually report.
function extractMobile(message: unknown): string | null {
  if (typeof message === "string") {
    return message;
  }
  if (message && typeof message === "object") {
    const candidate = message as Record<string, unknown>;
    for (const key of ["mobile", "identifier", "number"]) {
      const value = candidate[key];
      if (typeof value === "string") {
        return value;
      }
    }
  }
  return null;
}
