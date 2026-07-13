"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockProps = {
  code: string;
  /** Prism language name, e.g. "bash", "json", "typescript". */
  language: string;
  /** Optional max height (CSS value); enables vertical scrolling when set. */
  maxHeight?: string;
};

// One Dark theme (purple keywords / green strings / blue functions) matches the GitHub-dark
// palette. We drop its opaque background so code sits directly on the terminal surface.
export function CodeBlock({ code, language, maxHeight }: CodeBlockProps) {
  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      customStyle={{
        background: "transparent",
        margin: 0,
        padding: "1rem",
        fontSize: "0.8125rem",
        lineHeight: 1.65,
        ...(maxHeight ? { maxHeight } : {}),
      }}
      codeTagProps={{
        style: {
          background: "transparent",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          textShadow: "none",
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
