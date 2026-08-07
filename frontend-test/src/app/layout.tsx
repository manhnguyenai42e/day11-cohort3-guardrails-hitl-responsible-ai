import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Day 11 · Guardrails Testing Playground",
  description: "Interactive playground cho các demo AI Guardrails.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}