import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Mitr } from "next/font/google";
import "./globals.css";

const body = IBM_Plex_Sans_Thai({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

const display = Mitr({
  variable: "--font-display",
  subsets: ["thai", "latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "โพลารอยด์ 888 — จองคิวถ่ายรูป",
  description: "พรีออเดอร์ถ่ายรูปในมอ ไม่จำกัดจำนวนรูป 30–45 นาที แถมลอตเตอรี่ 3 ใบ",
};

export const viewport: Viewport = {
  themeColor: "#c8102e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
