import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healtie",
  description: "Multi-tenant virtual care platform built with Next.js and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
