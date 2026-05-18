"use client";

import { Button, toast } from "@heroui/react";
import { PiGithubLogoBold } from "react-icons/pi";
import { authClient } from "@/lib/auth-client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function SignInButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    if (error === "banned") {
      toast.danger("You have been banned", {
        description: "We banned your account because we detected bot activity on GitHub",
      });
    } else if (error) {
      toast.danger(errorDescription || "An error occurred during sign-in. Please try again.");
    }
  }, [searchParams]);

  return (
    <Button
      onClick={() => authClient.signIn.social({ provider: "github", callbackURL: pathname })}
      className="inline-flex h-full w-26 items-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold text-hi transition-all hover:-translate-y-0.5 hover:border-lo hover:bg-overlay"
    >
      <PiGithubLogoBold className="size-4" />
      Sign in
    </Button>
  );
}
