import type { Components } from "hast-util-to-jsx-runtime";
import { MdxCodeTitle } from "./mdx-code-title";
import { MdxImage } from "./mdx-image";
import { MdxLink } from "./mdx-link";
import { MdxParagraph } from "./mdx-paragraph";
import { MdxPre } from "./mdx-pre";

export const mdxComponents: Partial<Components> = {
  img: MdxImage,
  a: MdxLink,
  p: MdxParagraph,
  pre: MdxPre,
  figcaption: MdxCodeTitle,
};
