import type { MDXComponents } from "mdx/types";
import { MdxCodeTitle } from "./mdx-code-title";
import { MdxPre } from "./mdx-pre";
import { MdxLink } from "./mdx-link";
import { MdxImage } from "./mdx-image";
import { MdxParagraph } from "./mdx-paragraph";

export const mdxComponents: MDXComponents = {
  img: MdxImage,
  a: MdxLink,
  p: MdxParagraph,
  pre: MdxPre,
  figcaption: MdxCodeTitle,
};
