import "@/lib/env.server";
import { Toast } from "@heroui/react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { inter, outfit } from "@/lib/fonts";
import { organizationSchema } from "@/lib/structured-data";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Azerbaijan GitHub Community | 500,000 Commits",
    template: "%s | Azerbaijan GitHub Community",
  },
  description:
    "Push the future of Azerbaijan. National open source & innovation growth program aiming for 500,000 GitHub pushes.",
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
        <JsonLd data={organizationSchema()} />
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
