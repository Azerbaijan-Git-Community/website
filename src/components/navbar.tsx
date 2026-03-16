import { Route } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { SignInButton } from "./sign-in-button";
import { SmoothLink } from "./smooth-link";
import { UserAvatar } from "./user-avatar";

const links: { href: Route; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#impact", label: "Impact" },
  { href: "/#perks", label: "Perks" },
  { href: "/#roadmap", label: "Roadmap" },
  { href: "/leaderboard", label: "Leaderboard" },
];

async function NavAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    return <UserAvatar name={session.user.name ?? null} image={session.user.image ?? null} />;
  }

  return <SignInButton />;
}

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 z-50 flex h-20 w-full items-center border-b border-line bg-[rgba(13,17,23,0.8)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-300 items-center justify-between px-8">
        {/* Logo */}
        <Link href="/" className="flex w-30 items-center">
          <Image
            src="/logo.png"
            alt="GitHub Azerbaijan"
            width={120}
            height={40}
            unoptimized
            className="h-auto max-h-17.5 w-auto py-3 invert"
            priority
          />
        </Link>

        {/* Nav links — hidden on mobile */}
        <div className="hidden gap-8 md:flex">
          {links.map((link) => (
            <SmoothLink
              key={link.href}
              href={link.href}
              className="font-outfit font-medium text-hi transition-colors hover:text-blue"
            >
              {link.label}
            </SmoothLink>
          ))}
        </div>

        <div className="flex w-26 flex-row items-center justify-center">
          <Suspense fallback={<div className="size-14 animate-pulse rounded-full bg-surface" />}>
            <NavAuth />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
