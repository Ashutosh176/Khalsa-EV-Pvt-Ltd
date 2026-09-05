// Types for the globals MSG91's Widget SDK (otp-provider.js) attaches
// to window once loaded and initialized with exposeMethods: true -
// see apps/web/src/app/layout.tsx for the script/init.
declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
    sendOtp?: (identifier: string, success?: (data: unknown) => void, failure?: (error: unknown) => void) => void;
    verifyOtp?: (
      otp: string | number,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void,
      reqId?: string,
    ) => void;
    retryOtp?: (
      // Required, despite MSG91's own typings marking it optional - an
      // omitted/null channel throws synchronously instead of calling
      // `failure`. "11" is SMS, the only channel this flow uses.
      channel: string,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void,
      reqId?: string,
    ) => void;
  }
}

export const MSG91_WIDGET_READY_EVENT = "msg91-widget-ready";

export function isMsg91WidgetReady(): boolean {
  return typeof window !== "undefined" && typeof window.sendOtp === "function";
}

// MSG91's success/failure callback payloads aren't a fixed documented
// shape - both a plain string and a `{ type, message }` object (their
// convention on every other v5 endpoint) have been observed. Extracting
// defensively here means a same-shaped-but-differently-nested response
// still works instead of silently reading `undefined`.
export function extractWidgetMessage(payload: unknown): string | null {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") {
    const message = (payload as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return null;
}
