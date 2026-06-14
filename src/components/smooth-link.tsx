"use client";

import { Route } from "next";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ComponentPropsWithoutRef } from "react";

type SmoothLinkProps = LinkProps<Route> & ComponentPropsWithoutRef<"a"> & { scrollOffset?: number };

function useSmoothHashScroll(offset: number) {
  const pathname = usePathname();
  const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";

  useEffect(() => {
    if (!hash) return;

    const el = document.getElementById(hash);
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: "smooth" });
  }, [pathname, hash, offset]);
}

export function SmoothLink({ href, onClick, scrollOffset = 70, ...props }: SmoothLinkProps) {
  const hrefStr = href.toString();
  const hashIndex = hrefStr.indexOf("#");
  const hash = hashIndex !== -1 ? hrefStr.substring(hashIndex + 1) : null;

  useSmoothHashScroll(scrollOffset);

  return (
    <Link
      href={href}
      onClick={(e) => {
        const currentPath = window.location.pathname;
        const targetPath = hash ? hrefStr.substring(0, hashIndex) || "/" : hrefStr;

        // Same page — scroll to top or to hash smoothly
        if (currentPath === targetPath) {
          e.preventDefault();
          if (hash) {
            const elem = document.getElementById(hash);
            if (elem) {
              const top = elem.getBoundingClientRect().top + window.scrollY - scrollOffset;
              window.scrollTo({ top, behavior: "smooth" });
            }
            window.history.pushState(null, "", hrefStr);
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          onClick?.(e);
          return;
        }

        // Different page with hash — navigate, ScrollAfterNav handles scroll
        onClick?.(e);
      }}
      {...props}
    >
      {props.children}
    </Link>
  );
}
