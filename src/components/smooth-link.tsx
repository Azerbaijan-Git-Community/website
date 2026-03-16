"use client";

import { Route } from "next";
import Link, { type LinkProps } from "next/link";
import { useLinkStatus } from "next/link";
import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

type SmoothLinkProps = LinkProps<Route> & ComponentPropsWithoutRef<"a"> & { scrollOffset?: number };

function ScrollAfterNav({ hash, offset }: { hash: string; offset: number }) {
  const { pending } = useLinkStatus();
  const didScroll = useRef(true); // true = skip first render

  useEffect(() => {
    if (!pending && !didScroll.current) {
      didScroll.current = true;
      const elem = document.getElementById(hash);
      if (elem) {
        const top = elem.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
    if (pending) didScroll.current = false;
  }, [pending, hash, offset]);

  return null;
}

export function SmoothLink({ href, onClick, scrollOffset = 70, ...props }: SmoothLinkProps) {
  const hrefStr = href.toString();
  const hashIndex = hrefStr.indexOf("#");
  const hash = hashIndex !== -1 ? hrefStr.substring(hashIndex + 1) : null;

  return (
    <Link
      href={href}
      onClick={(e) => {
        if (hash) {
          const pagePath = hrefStr.substring(0, hashIndex) || "/";
          if (window.location.pathname === pagePath) {
            e.preventDefault();
            const elem = document.getElementById(hash);
            if (elem) {
              const top = elem.getBoundingClientRect().top + window.scrollY - scrollOffset;
              window.scrollTo({ top, behavior: "smooth" });
            }
            window.history.pushState(null, "", hrefStr);
          }
          // different page — let Next.js navigate, ScrollAfterNav handles scroll
        }
        onClick?.(e);
      }}
      {...props}
    >
      {props.children}
      {hash && <ScrollAfterNav hash={hash} offset={scrollOffset} />}
    </Link>
  );
}
