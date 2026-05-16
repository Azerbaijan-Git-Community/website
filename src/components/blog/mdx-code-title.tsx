"use client";

import { type HTMLAttributes, useRef, useState } from "react";
import { FaReact } from "react-icons/fa";
import { PiCheck, PiCopy, PiDatabase, PiTerminal } from "react-icons/pi";
import {
  SiCss,
  SiDocker,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiMarkdown,
  SiPrisma,
  SiPython,
  SiRust,
  SiSvelte,
  SiTypescript,
  SiYaml,
} from "react-icons/si";

const EXT_MAP: Record<string, React.ReactNode> = {
  ts: <SiTypescript />,
  tsx: <FaReact />,
  js: <SiJavascript />,
  jsx: <FaReact />,
  py: <SiPython />,
  go: <SiGo />,
  rs: <SiRust />,
  css: <SiCss />,
  html: <SiHtml5 />,
  json: <SiJson />,
  yaml: <SiYaml />,
  yml: <SiYaml />,
  md: <SiMarkdown />,
  mdx: <SiMarkdown />,
  sql: <PiDatabase />,
  sh: <PiTerminal />,
  bash: <PiTerminal />,
  zsh: <PiTerminal />,
  prisma: <SiPrisma />,
  svelte: <SiSvelte />,
  dockerfile: <SiDocker />,
};

type Props = HTMLAttributes<HTMLElement> & { "data-rehype-pretty-code-title"?: string };

export function MdxCodeTitle({ children, ...props }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const isCodeTitle = props["data-rehype-pretty-code-title"] !== undefined;

  async function copy() {
    const pre = ref.current?.nextElementSibling?.querySelector("pre");
    const text = pre?.innerText ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isCodeTitle) return <figcaption {...props}>{children}</figcaption>;

  const filename = typeof children === "string" ? children : "";
  const ext = filename.includes(".") ? (filename.split(".").pop()?.toLowerCase() ?? "") : filename.toLowerCase();
  const icon = EXT_MAP[ext];

  return (
    <figcaption ref={ref} {...props}>
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          {icon && <span className="flex items-center text-lg">{icon}</span>}
          {children}
        </span>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="rounded-md border border-white/10 bg-white/5 p-1.5 text-dim transition-colors hover:text-hi"
        >
          {copied ? <PiCheck size={14} /> : <PiCopy size={14} />}
        </button>
      </span>
    </figcaption>
  );
}
