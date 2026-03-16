"use client";

import { Button } from "@heroui/react";
import { PiGithubLogoBold } from "react-icons/pi";
import { authClient } from "@/lib/auth-client";

export function SignInButton() {
  return (
    <Button
      onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/" })}
      className="inline-flex h-full w-26 items-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold text-hi transition-all hover:-translate-y-0.5 hover:border-lo hover:bg-overlay"
    >
      <PiGithubLogoBold className="size-4" />
      Sign in
    </Button>
  );
}
