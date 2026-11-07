import type { Element, Root, RootContent } from "hast";
import { toHtml } from "hast-util-to-html";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeParse from "rehype-parse";
import { rehypePrettyCode } from "rehype-pretty-code";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { mdxComponents } from "@/components/blog/mdx-components";

declare module "hast" {
  interface ElementData {
    meta?: string;
  }
}

const MATHML_TAGS = [
  "math",
  "semantics",
  "annotation",
  "mrow",
  "mi",
  "mn",
  "mo",
  "ms",
  "mtext",
  "mspace",
  "mfrac",
  "msqrt",
  "mroot",
  "msub",
  "msup",
  "msubsup",
  "munder",
  "mover",
  "munderover",
  "mmultiscripts",
  "mprescripts",
  "none",
  "mstyle",
  "mpadded",
  "mphantom",
  "menclose",
  "merror",
  "mtable",
  "mtr",
  "mtd",
  "mlabeledtr",
];

// Ids would clash with this page's own and rehype-slug regenerates them. MdxLink decides `target` and `rel`.
const DROPPED_ATTRIBUTES = new Set(["id", "name", "target", "rel"]);
const dropAttributes = (attributes: NonNullable<typeof defaultSchema.attributes>[string]) =>
  attributes.filter((attribute) => !DROPPED_ATTRIBUTES.has(Array.isArray(attribute) ? attribute[0] : attribute));

const POST_SCHEMA: typeof defaultSchema = {
  ...defaultSchema,
  clobber: [],
  tagNames: [...(defaultSchema.tagNames ?? []), "figure", "figcaption", "mark", "u", ...MATHML_TAGS],
  attributes: {
    ...Object.fromEntries(
      Object.entries(defaultSchema.attributes ?? {}).map(([tag, attributes]) => [tag, dropAttributes(attributes)]),
    ),
    pre: [...(defaultSchema.attributes?.pre ?? []), "dataTitle"],
    math: ["display"],
    annotation: ["encoding"],
  },
};

function rehypeAbsoluteUrls(origin: string) {
  const absolute = (value: string) =>
    value.startsWith("/") && !value.startsWith("//") ? new URL(value, origin).toString() : value;
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const { src, href } = node.properties;
      if (node.tagName === "img" && typeof src === "string") node.properties.src = absolute(src);
      if (node.tagName === "a" && typeof href === "string") node.properties.href = absolute(href);
    });
  };
}

function textOf(node: Root | RootContent): string {
  if (node.type === "text") return node.value;
  return "children" in node ? node.children.map(textOf).join(" ") : "";
}

const cleanTextOf = (node: Root | RootContent) => textOf(node).replace(/\s+/g, " ").trim();

/** Readies a post body for storage: sanitized, so API readers get safe HTML too, with absolute URLs. */
export async function prepareImportedHtml(html: string, origin: string) {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeAbsoluteUrls, origin)
    .use(rehypeSanitize, POST_SCHEMA);
  const tree = await processor.run(processor.parse(html));
  // A preview reads better from prose than from a heading or a code block.
  const paragraphs = tree.children.filter((node) => node.type === "element" && node.tagName === "p");
  const excerpt = paragraphs.map(cleanTextOf).find(Boolean) ?? cleanTextOf(tree);
  return { html: toHtml(tree), text: cleanTextOf(tree), excerpt };
}

// rehype-pretty-code reads a title from the fence's meta string, which HTML has no place for.
function rehypeCodeTitles() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const title = node.tagName === "pre" ? node.properties.dataTitle : undefined;
      const code = node.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "code",
      );
      if (typeof title !== "string" || !code) return;
      Object.assign(code, { data: { ...code.data, meta: `title="${title.replaceAll('"', "'")}"` } });
      delete node.properties.dataTitle;
    });
  };
}

/** Renders a stored post body with the same plugins and components the blog has always used. */
export async function renderPostHtml(html: string): Promise<ReactNode> {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, POST_SCHEMA)
    .use(rehypeCodeTitles)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypePrettyCode, { theme: "github-dark", keepBackground: false, defaultLang: { block: "plaintext" } });
  const tree = await processor.run(processor.parse(html));
  return toJsxRuntime(tree, { Fragment, jsx, jsxs, components: mdxComponents });
}
