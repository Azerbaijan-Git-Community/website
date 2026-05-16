"use client";

import { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PiList, PiX } from "react-icons/pi";

const links: { href: Route; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/showcase", label: "Showcase" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center text-hi transition-colors hover:text-blue"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <PiX size={24} /> : <PiList size={24} />}
      </button>

      {/* Drawer */}
      <div
        className={`fixed top-20 right-0 z-50 flex h-[calc(100dvh-80px)] w-64 flex-col border-l border-line bg-canvas transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-4 py-3 font-outfit font-medium transition-colors hover:bg-surface hover:text-blue ${pathname === link.href ? "text-blue" : "text-hi"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
