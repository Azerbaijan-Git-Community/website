import type { Metadata } from "next";
import { WelcomeFlow } from "@/components/welcome/welcome-flow";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

// New members land here after their first GitHub sign-in (Better Auth's newUserCallbackURL).
export default function WelcomePage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 pt-26 pb-16">
      <WelcomeFlow />
    </div>
  );
}
