import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khalsa EV | Genuine EV Spare Parts",
  description: "Find compatible electric vehicle spare parts and accessories.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-brand-ink antialiased">{children}</body>
    </html>
  );
}
