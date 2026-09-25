import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Arka — دستیار هوش مصنوعی",
    template: "%s — Arka",
  },
  description:
    "ارکا محیط چت و تولید تصویر با هوش مصنوعی است؛ هر پروایدری که بخواهی وصل کن، بقیه‌اش با ما.",
};

export const viewport: Viewport = {
  themeColor: "#02040a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
