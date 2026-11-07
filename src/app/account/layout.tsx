import { Suspense } from "react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-svh"></div>}>{children}</Suspense>;
}
