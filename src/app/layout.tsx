import "@/lib/env.server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Toast } from "@heroui/react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { inter, outfit } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Azerbaijan GitHub Community | 5,000,000 Commits",
    template: "%s | Azerbaijan GitHub Community",
  },
  description:
    "Push the future of Azerbaijan. National open source & innovation growth program aiming for 5,000,000 GitHub pushes.",
  keywords: [
    "GitHub Azerbaijan",
    "open source Azerbaijan",
    "Azerbaijan developer community",
    "GitHub Community",
    "AZ tech",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} dark antialiased`}>
        <Toast.Provider placement="bottom end" />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
