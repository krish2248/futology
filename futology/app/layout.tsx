import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FUTOLOGY · Every Goal. Every Emotion. Every Insight.",
    template: "%s · FUTOLOGY",
  },
  description:
    "The definitive football intelligence platform — live scores, ML-powered match prediction, player clusters, sentiment, tactics, transfer values, and fantasy optimization.",
  applicationName: "FUTOLOGY",
  manifest: "/manifest.json",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "FUTOLOGY",
    description: "Every Goal. Every Emotion. Every Insight.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-bg-primary font-sans text-text-primary antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-bg-elevated focus:px-3 focus:py-2 focus:text-sm focus:text-text-primary"
        >
          Skip to content
        </a>
        <Providers>
          <Navbar />
          <main id="main" className="container-page pb-24 pt-4 md:pb-12 md:pt-8">
            {children}
          </main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
