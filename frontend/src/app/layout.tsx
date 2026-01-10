import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { TelegramViewport } from "@/components/TelegramViewport";
import { MobileNav } from "@/components/MobileNav";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { NavigationProgress } from "@/components/NavigationProgress";

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
      <body className="theme-body antialiased">
        <div className="min-h-[var(--tg-viewport-stable-height,100vh)]">
          <ThemeInitializer />
          <TelegramViewport />
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-8 sm:pb-10 sm:pt-10">
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
