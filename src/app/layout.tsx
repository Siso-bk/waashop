import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mystery Wallet",
  description: "Mystery boxes with transparent reward probabilities and a virtual wallet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 antialiased`}
      >
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
              <Link href="/" className="text-lg font-semibold text-indigo-600">
                Mystery Wallet
              </Link>
              <nav className="flex gap-4 text-sm text-slate-600">
                <Link href="/" className="hover:text-indigo-600">
                  Home
                </Link>
                <Link href="/wallet" className="hover:text-indigo-600">
                  Wallet
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
