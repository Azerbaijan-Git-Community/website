"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { PiNewspaperBold, PiSignOutBold } from "react-icons/pi";
import * as z from "zod/mini";
import { OmicronLogo } from "@/components/omicron-logo";
import { authClient } from "@/lib/auth-client";
import { sizedGithubAvatar } from "@/lib/utils.client";

type UserAvatarProps = {
  name: string | null;
  image: string | null;
};

const ConnectionSchema = z.object({ connected: z.boolean() });

const MENU_LINK =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-lo transition-colors hover:bg-overlay hover:text-hi focus-visible:bg-overlay focus-visible:text-hi focus-visible:outline-none";

export function UserAvatar({ name, image }: UserAvatarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [omicronConnected, setOmicronConnected] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Only the menu needs this, so the avatar never waits for it, and it's ready before the menu opens.
  useEffect(() => {
    let ignore = false;
    async function loadConnection() {
      try {
        const res = await fetch("/api/omicron/connection");
        const { connected } = ConnectionSchema.parse(await res.json());
        if (ignore) return;
        setOmicronConnected(connected);
        // The link only exists while the menu is open, which is too late to get ahead of the click.
        if (connected) router.prefetch("/account/blog");
      } catch {
        // "My blog posts" is the safe guess: that page offers to connect when there's no connection.
        if (!ignore) setOmicronConnected(true);
      }
    }
    void loadConnection();
    return () => {
      ignore = true;
    };
  }, [router]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && !rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await authClient.signOut();
    router.refresh();
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-14 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-surface font-semibold text-hi ring-2 ring-line transition-shadow hover:ring-blue focus-visible:ring-blue focus-visible:outline-none aria-expanded:ring-blue"
      >
        <span aria-hidden={image ? true : undefined}>{name?.[0]?.toUpperCase() ?? "U"}</span>
        {/* Server-rendered so a cached avatar paints before hydration; 2x of the 56px size */}
        {image && (
          <Image
            src={sizedGithubAvatar(image, 112)}
            alt={`${name ?? "User"} avatar`}
            width={56}
            height={56}
            className="absolute inset-0 size-full object-cover"
            unoptimized
            loading="eager"
          />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="User menu"
          className="absolute top-full left-1/2 mt-2 w-48 -translate-x-1/2 animate-in rounded-lg border border-line bg-surface p-1 shadow-[0_8px_32px_rgba(0,0,0,0.3)] duration-150 fade-in-0 zoom-in-95"
        >
          {omicronConnected === null && (
            <div
              aria-hidden="true"
              data-testid="menu-item-skeleton"
              className="h-9 animate-pulse rounded-md bg-overlay"
            />
          )}
          {omicronConnected === true && (
            <Link
              ref={(el) => el?.focus()}
              href="/account/blog"
              role="menuitem"
              className={MENU_LINK}
              onClick={() => setOpen(false)}
            >
              <PiNewspaperBold className="size-5" />
              My blog posts
            </Link>
          )}
          {omicronConnected === false && (
            // oxlint-disable-next-line next/no-html-link-for-pages -- this route redirects off-site, so it must never be prefetched
            <a ref={(el) => el?.focus()} href="/api/omicron/connect" role="menuitem" className={MENU_LINK}>
              <OmicronLogo />
              Connect Omicron
            </a>
          )}
          {/* Muted until hovered, then red: a permanently red item feels alarming (GitHub's pattern) */}
          <button
            ref={omicronConnected === null ? (el) => el?.focus() : undefined}
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-lo transition-colors hover:bg-danger/10 hover:text-danger focus-visible:bg-danger/10 focus-visible:text-danger focus-visible:outline-none"
          >
            <PiSignOutBold className="size-5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
