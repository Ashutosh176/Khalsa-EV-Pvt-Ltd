"use client";

import Script from "next/script";
import { MSG91_WIDGET_READY_EVENT } from "../lib/msg91-widget";

// Split out from the (Server Component) root layout because next/script's
// onLoad is a function prop, which can't cross the server/client boundary.
export function Msg91WidgetLoader({ widgetId, tokenAuth }: { widgetId: string; tokenAuth: string }) {
  return (
    <Script
      src="https://verify.msg91.com/otp-provider.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.initSendOTP?.({
          widgetId,
          tokenAuth,
          exposeMethods: true,
          success: () => {},
          failure: () => {},
        });
        window.dispatchEvent(new Event(MSG91_WIDGET_READY_EVENT));
      }}
    />
  );
}
