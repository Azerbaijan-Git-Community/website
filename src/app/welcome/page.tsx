import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { Suspense } from "react";
import { WelcomeFlow } from "@/components/welcome/welcome-flow";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

async function WelcomeForMember() {
  "use cache: private";
  cacheLife("default");

  const session = await auth.api.getSession({ headers: await headers() });
  return <WelcomeFlow image={session?.user.image ?? null} />;
}

// New members land here after their first GitHub sign-in (Better Auth's newUserCallbackURL).
export default function WelcomePage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 pt-26 pb-16">
      <Suspense fallback={null}>
        <WelcomeForMember />
      </Suspense>
    </div>
  );
}
