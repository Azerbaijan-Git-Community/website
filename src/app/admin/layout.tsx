import { Suspense } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-svh"></div>}>{children}</Suspense>;
}
