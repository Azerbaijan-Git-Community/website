"use client";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import swift from "react-syntax-highlighter/dist/esm/languages/prism/swift";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// The full Prism build bundles ~300 languages (~270 KB gzipped); register only what the docs use.
const LANGUAGES = { bash, c, csharp, go, java, javascript, json, php, python, ruby, rust, swift, typescript };
for (const [name, language] of Object.entries(LANGUAGES)) SyntaxHighlighter.registerLanguage(name, language);

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
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          textShadow: "none",
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
