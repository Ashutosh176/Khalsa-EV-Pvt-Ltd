import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadGatewayException } from "@nestjs/common";
import { Msg91Client } from "./msg91.client";

describe("Msg91Client", () => {
  let client: Msg91Client;
  let fetchMock: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    process.env.MSG91_AUTH_KEY = "test-authkey";
    fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    client = new Msg91Client();
  });

  function jsonResponse(body: unknown, ok = true) {
    return { ok, json: () => Promise.resolve(body) };
  }

  describe("verifyWidgetAccessToken", () => {
    it("posts the authkey and access-token as a JSON body to the widget verify endpoint", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "success", message: "919876543210" }));

      await client.verifyWidgetAccessToken("jwt-token-1");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://control.msg91.com/api/v5/widget/verifyAccessToken");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({ authkey: "test-authkey", "access-token": "jwt-token-1" });
    });

    it("returns the verified mobile when message is a plain string", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "success", message: "919876543210" }));
      await expect(client.verifyWidgetAccessToken("jwt-token-1")).resolves.toBe("919876543210");
    });

    it("returns the verified mobile when message is an object with a mobile field", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "success", message: { mobile: "919876543210" } }));
      await expect(client.verifyWidgetAccessToken("jwt-token-1")).resolves.toBe("919876543210");
    });

    it("returns the verified mobile when message is an object with an identifier field", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "success", message: { identifier: "919876543210" } }));
      await expect(client.verifyWidgetAccessToken("jwt-token-1")).resolves.toBe("919876543210");
    });

    it("returns null (not a throw) when MSG91 rejects the token", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ type: "error", message: "Invalid access-token" }));
      await expect(client.verifyWidgetAccessToken("bad-token")).resolves.toBeNull();
    });

    it("throws BadGatewayException when the network request fails", async () => {
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
      await expect(client.verifyWidgetAccessToken("jwt-token-1")).rejects.toThrow(BadGatewayException);
    });

    it("throws BadGatewayException when MSG91's response is unreadable", async () => {
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.reject(new Error("bad json")) });
      await expect(client.verifyWidgetAccessToken("jwt-token-1")).rejects.toThrow(BadGatewayException);
    });
  });
});
