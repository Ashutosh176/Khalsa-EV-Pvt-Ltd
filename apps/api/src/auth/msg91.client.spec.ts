import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadGatewayException } from "@nestjs/common";
import { Msg91Client } from "./msg91.client";

describe("Msg91Client", () => {
  let client: Msg91Client;
  let fetchMock: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    process.env.MSG91_AUTH_KEY = "test-authkey";
    process.env.MSG91_OTP_TEMPLATE_ID = "test-template";
    fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    client = new Msg91Client();
  });

  function jsonResponse(body: unknown, ok = true) {
    return { ok, json: () => Promise.resolve(body) };
  }

  describe("sendOtp", () => {
    it("calls MSG91's send endpoint with the template id, mobile and authkey header", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "success", message: "req-1" }));

      await client.sendOtp("919876543210");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("template_id=test-template");
      expect(url).toContain("mobile=919876543210");
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>).authkey).toBe("test-authkey");
    });

    it("throws BadGatewayException when MSG91 reports an error", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "error", message: "Invalid mobile number" }));
      await expect(client.sendOtp("919876543210")).rejects.toThrow(BadGatewayException);
    });

    it("throws BadGatewayException when the network request fails", async () => {
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
      await expect(client.sendOtp("919876543210")).rejects.toThrow(BadGatewayException);
    });
  });

  describe("verifyOtp", () => {
    it("returns true when MSG91 reports success", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "success", message: "OTP verified" }));
      await expect(client.verifyOtp("919876543210", "1234")).resolves.toBe(true);
    });

    it("returns false (not a throw) when the OTP is simply wrong", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "error", message: "OTP not matched" }));
      await expect(client.verifyOtp("919876543210", "0000")).resolves.toBe(false);
    });

    it("throws BadGatewayException when MSG91's response is unreadable", async () => {
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.reject(new Error("bad json")) });
      await expect(client.verifyOtp("919876543210", "1234")).rejects.toThrow(BadGatewayException);
    });
  });
});
