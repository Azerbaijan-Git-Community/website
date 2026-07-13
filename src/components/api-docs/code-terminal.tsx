"use client";

import { type ReactNode, useState } from "react";
import { PiCheck, PiCopy } from "react-icons/pi";
import { CodeBlock } from "./code-block";
import type { Snippet } from "./snippets";

type CodeTerminalProps = {
  snippets: Snippet[];
  /** Hides the language tab bar (used for single-snippet blocks like the Zod source). */
  singleTab?: boolean;
  /** Optional control rendered in the header, left of the Copy button (e.g. a "Try it" button). */
  headerAction?: ReactNode;
};

export function CodeTerminal({ snippets, singleTab = false, headerAction }: CodeTerminalProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const current = snippets.find((s) => s.id === activeId) ?? snippets[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable; ignore.
    }
  }

  return (
    <div className="glass overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-line bg-[rgba(48,54,61,0.5)] px-4 py-3">
        <div className="flex gap-2">
          <span className="size-3 rounded-full bg-[#ff5f56]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-lo transition-colors hover:text-hi"
          >
            {copied ? <PiCheck className="text-lime" /> : <PiCopy />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {!singleTab && (
        <div className="flex gap-1 overflow-x-auto border-b border-line bg-overlay px-2 py-2">
          {snippets.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(s.id)}
              className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                current.id === s.id ? "bg-surface text-hi" : "text-lo hover:text-hi"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto bg-overlay">
        <CodeBlock code={current.code} language={current.lang} />
      </div>
    </div>
  );
}
