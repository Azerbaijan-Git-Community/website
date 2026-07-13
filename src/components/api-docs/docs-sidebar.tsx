"use client";

import { type MouseEvent, useEffect, useState } from "react";
import { ALL_SECTION_IDS, DOC_NAV } from "./endpoints";

const SCROLL_OFFSET = 100; // clears the fixed h-20 navbar plus breathing room.

export function DocsSidebar() {
  const [active, setActive] = useState(ALL_SECTION_IDS[0]);

  useEffect(() => {
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        const current = ALL_SECTION_IDS.find((id) => visible.get(id));
        if (current) setActive(current);
      },
      { rootMargin: "-100px 0px -70% 0px" },
    );

    for (const id of ALL_SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function handleClick(e: MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
    window.history.pushState(null, "", `#${id}`);
    setActive(id);
  }

  return (
    <nav className="flex flex-col gap-6">
      {DOC_NAV.map((group) => (
        <div key={group.group}>
          <p className="mb-2 text-xs font-semibold tracking-wider text-dim uppercase">{group.group}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active === item.id ? "bg-surface font-medium text-blue" : "text-lo hover:text-hi"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
