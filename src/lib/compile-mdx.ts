import { evaluate } from "@mdx-js/mdx";
import type { MDXModule } from "mdx/types";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import * as jsxRuntime from "react/jsx-runtime";
import { remarkRewriteImages } from "./mdx-plugins/remark-rewrite-images";

/**
 * Compiles a raw MDX string into a React component at runtime.
 *
 * This runs server-side and the result is cached for weeks via `"use cache"` on
 * the blog post page, so the compilation cost is paid only once per revalidation.
 */
export async function compileMdx(source: string, slug: string): Promise<MDXModule["default"]> {
  const { default: MDXContent } = await evaluate(source, {
    ...(jsxRuntime as Parameters<typeof evaluate>[1]),
    remarkPlugins: [remarkGfm, [remarkRewriteImages, { slug }]],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
      [rehypePrettyCode, { theme: "github-dark", keepBackground: false }],
    ],
  });

  return MDXContent;
}
