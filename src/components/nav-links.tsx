"use client";

import { MotionConfig, motion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { navigationLinks } from "@/lib/constants";

type Underline = { x: number; width: number; instant: boolean };

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [underline, setUnderline] = useState<Underline | null>(null);

  // One underline positioned from offsetLeft: unlike layoutId, it ignores page scroll during navigation
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const measure = () => {
      const link = activeHref ? container.querySelector<HTMLElement>(`a[href="${activeHref}"]`) : null;
      setUnderline((prev) =>
        link ? { x: link.offsetLeft + 4, width: link.offsetWidth - 8, instant: prev === null } : null,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeHref]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={containerRef} className="relative hidden h-full gap-4 md:flex">
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
              className={`group flex h-full items-center px-3 font-outfit font-medium transition-colors outline-none ${active ? "text-hi" : "text-lo hover:text-hi"}`}
            >
              <span className="rounded-md group-focus-visible:ring-2 group-focus-visible:ring-blue group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-canvas">
                {link.label}
              </span>
            </Link>
          );
        })}
        {/* Sits on the navbar's bottom border, like GitHub's underline nav */}
        <motion.span
          aria-hidden
          data-nav-underline
          className="pointer-events-none absolute -bottom-px left-0 h-0.5 rounded-full bg-linear-to-r from-blue to-purple"
          initial={false}
          animate={underline ? { x: underline.x, width: underline.width, opacity: 1 } : { opacity: 0 }}
          transition={underline?.instant ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </MotionConfig>
  );
}
