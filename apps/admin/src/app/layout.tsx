import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Khalsa EV Admin" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
