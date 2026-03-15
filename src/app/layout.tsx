import "@/lib/env.server";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { inter, outfit } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Azerbaijan GitHub Community | 5,000,000 Pushes",
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
    title: "Azerbaijan GitHub Community | 5,000,000 Pushes",
    description: "Uniting talent, expanding open-source, and building national innovation metrics.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Azerbaijan GitHub Community | 5,000,000 Pushes",
    description: "Uniting talent, expanding open-source, and building national innovation metrics.",
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
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
