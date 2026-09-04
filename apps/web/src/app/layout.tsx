import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";
import { Msg91WidgetLoader } from "../components/Msg91WidgetLoader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Khalsa EV | Genuine EV Spare Parts",
  description: "Find compatible electric vehicle spare parts and accessories.",
};

const MSG91_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
const MSG91_WIDGET_TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-50 text-brand-ink antialiased">
        <Providers>{children}</Providers>
        {MSG91_WIDGET_ID && MSG91_WIDGET_TOKEN_AUTH ? (
          <Msg91WidgetLoader widgetId={MSG91_WIDGET_ID} tokenAuth={MSG91_WIDGET_TOKEN_AUTH} />
        ) : null}
      </body>
    </html>
  );
}
