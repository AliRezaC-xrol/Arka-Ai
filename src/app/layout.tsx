/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Sora } from "next/font/google";
import "./globals.css";

/* Self-hosted Vazirmatn (SPEC §1: local font file, not Google Fonts).
   Note: `npx vibefarsi init` added src/app/fonts.ts with next/font/google;
   it was removed because SPEC §1 mandates the self-hosted woff2 files and
   the Google import collided with this localFont declaration (TS2440).
   The `--font-vazirmatn` variable vibefarsi's theme block expects is kept.
   Latin glyphs are handled by the system stack declared in globals.css;
   Vazirmatn covers Persian and any glyph the system stack lacks. */
const vazirmatn = localFont({
  src: [
    { path: "../fonts/Vazirmatn-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Vazirmatn-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Vazirmatn-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Vazirmatn-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/Vazirmatn-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

/* Latin display face (apmix-style headings / wordmark). next/font
   downloads it at build time and self-hosts it — no runtime request. */
const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-sora", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Arka — دستیار هوش مصنوعی",
    template: "%s — Arka",
  },
  description:
    "ارکا محیط چت و تولید تصویر با هوش مصنوعی است؛ هر پروایدری که بخواهی وصل کن، بقیه‌اش با ما.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  /* Shrink the layout (dvh) when the on-screen keyboard opens, so the
     composer — and the message just sent — stay visible above it. */
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${sora.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <noscript>
          <style>{".reveal{opacity:1!important;transform:none!important;filter:none!important}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
