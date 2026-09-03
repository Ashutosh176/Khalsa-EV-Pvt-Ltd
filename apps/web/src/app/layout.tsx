import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Khalsa EV | Genuine EV Spare Parts",
  description: "Find compatible electric vehicle spare parts and accessories.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-50 text-brand-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
