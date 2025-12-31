import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { TelegramViewport } from "@/components/TelegramViewport";

export const metadata: Metadata = {
  title: "Waashop",
  description: "Waashop ecommerce mini app with transparent rewards, instant wallet sync, and verified vendors.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#f5f5f2] text-[#0b0b0b] antialiased">
        <div className="min-h-screen">
          <TelegramViewport />
          <header className="border-b border-black/10 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-black">
                <span className="inline-flex h-2 w-8 rounded-full bg-black" aria-hidden />
                Waashop
              </Link>
              <nav className="flex items-center gap-5 text-sm text-gray-600">
                <Link href="/" className="hover:text-black">
                  Drops
                </Link>
                <Link href="/wallet" className="hover:text-black">
                  Wallet
                </Link>
                <Link href="/login" className="hidden rounded-full border border-black px-3 py-1 text-black transition hover:bg-black hover:text-white sm:inline-flex">
                  Sign in
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
