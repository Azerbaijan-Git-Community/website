import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PiShieldCheckBold } from "react-icons/pi";
import { SyncPanel } from "@/components/admin/sync-panel";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Console",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.role || session?.user?.role !== "admin") notFound();

  return (
    <div className="min-h-svh pt-28 pb-24">
      <div className="mx-auto max-w-4xl px-6">
        {/* Console header */}
        <header className="mb-8 rounded-xl border border-line bg-[rgba(13,17,23,0.6)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border border-line bg-surface">
                <PiShieldCheckBold className="size-5 text-lime" />
              </div>
              <div>
                <h1 className="font-mono text-lg font-semibold tracking-tight text-hi">Admin Console</h1>
                <p className="font-mono text-xs text-dim">Internal operations · restricted access</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
              <span className="size-2 rounded-full bg-lime shadow-[0_0_8px_var(--color-lime)]" />
              <span className="font-mono text-xs text-lo">{session.user.email}</span>
            </div>
          </div>
        </header>

        <SyncPanel />
      </div>
    </div>
  );
}
