"use client";

import Link, { type LinkProps } from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type SmoothLinkProps = LinkProps & ComponentPropsWithoutRef<"a">;

export function SmoothLink({ href, onClick, ...props }: SmoothLinkProps) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        const target = e.currentTarget.getAttribute("href");
        if (target?.startsWith("#")) {
          e.preventDefault();
          document.getElementById(target.substring(1))?.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", target);
        }
        onClick?.(e);
      }}
      {...props}
    />
  );
}
