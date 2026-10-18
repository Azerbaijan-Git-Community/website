"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { PiGithubLogoBold } from "react-icons/pi";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function SignInButton() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    if (error === "banned") {
      toast.error("You have been banned", {
        description: "We banned your account because we detected bot activity on GitHub",
      });
    } else if (error) {
      toast.error(errorDescription || "An error occurred during sign-in. Please try again.");
    }
  }, [searchParams]);

  return (
    <button
      type="button"
      onClick={async () => {
        const pathname = window.location.pathname;
        await authClient.signIn.social({ provider: "github", callbackURL: pathname });
      }}
      className="inline-flex h-10 w-26 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 font-outfit text-sm font-semibold text-hi transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:border-lo hover:bg-overlay focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
    >
      <PiGithubLogoBold className="size-4" />
      Sign in
    </button>
  );
}
