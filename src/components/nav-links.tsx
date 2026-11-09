"use client";

import { MotionConfig, motion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigationLinks } from "@/lib/constants";

function linkForPath(pathname: string): Route | undefined {
  return navigationLinks.find(({ href }) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`),
  )?.href;
}

export function NavLinks() {
  const pathname = usePathname();
  // Moves the underline on click instead of waiting for the route; ignored once the pathname changes
  const [clicked, setClicked] = useState<{ href: Route; from: string } | null>(null);
  const activeHref = clicked?.from === pathname ? clicked.href : linkForPath(pathname);

  return (
    <MotionConfig reducedMotion="user">
      <div className="hidden h-full gap-4 md:flex">
        {navigationLinks.map((link) => {
          const active = link.href === activeHref;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                setClicked({ href: link.href, from: pathname });
              }}
              className={`group relative flex h-full items-center px-3 font-outfit font-medium transition-colors outline-none ${active ? "text-hi" : "text-lo hover:text-hi"}`}
            >
              <span className="rounded-md group-focus-visible:ring-2 group-focus-visible:ring-blue group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-canvas">
                {link.label}
              </span>
              {active && (
                // Sits on the navbar's bottom border, like GitHub's underline nav
                <motion.span
                  layoutId="nav-active-underline"
                  aria-hidden
                  className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-linear-to-r from-blue to-purple"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </MotionConfig>
  );
}
