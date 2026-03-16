// smooth-link.tsx
"use client";

import { Route } from "next";
import Link, { type LinkProps } from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type SmoothLinkProps = LinkProps<Route> & ComponentPropsWithoutRef<"a"> & { scrollOffset?: number };

export function SmoothLink({ href, onClick, scrollOffset = 100, ...props }: SmoothLinkProps) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        const hrefStr = href.toString();
        const hashIndex = hrefStr.indexOf("#");
        if (hashIndex !== -1) {
          e.preventDefault();
          const hash = hrefStr.substring(hashIndex + 1);
          const elem = document.getElementById(hash);
          if (elem) {
            const top = elem.getBoundingClientRect().top + window.scrollY - scrollOffset;
            window.scrollTo({ top, behavior: "smooth" });
          }
          window.history.pushState(null, "", hrefStr);
        }
        onClick?.(e);
      }}
      {...props}
    />
  );
}
