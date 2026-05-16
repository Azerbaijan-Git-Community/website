"use client";

import { useEffect, useRef, useState } from "react";
import { PiCheck, PiCopy } from "react-icons/pi";

export function MdxPre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [hasTitle, setHasTitle] = useState(false);

  useEffect(() => {
    const prev = ref.current?.parentElement?.previousElementSibling;
    setHasTitle(prev?.hasAttribute("data-rehype-pretty-code-title") ?? false);
  }, []);

  async function copy() {
    const text = ref.current?.innerText ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative">
      <pre ref={ref} {...props}>
        {children}
      </pre>
      {!hasTitle && (
        <button
          onClick={copy}
          aria-label="Copy code"
          className="absolute top-3 right-3 rounded-md border border-white/10 bg-white/5 p-1.5 text-dim transition-colors hover:text-hi"
        >
          {copied ? <PiCheck size={14} /> : <PiCopy size={14} />}
        </button>
      )}
    </div>
  );
}
