import { describe, expect, test } from "vitest";
import { MdxCodeTitle } from "@/components/blog/mdx-code-title";
import { mdxComponents } from "@/components/blog/mdx-components";
import { MdxImage } from "@/components/blog/mdx-image";
import { MdxLink } from "@/components/blog/mdx-link";
import { MdxParagraph } from "@/components/blog/mdx-paragraph";
import { MdxPre } from "@/components/blog/mdx-pre";

describe("mdxComponents", () => {
  test("maps MDX elements to the blog's custom components", () => {
    expect(mdxComponents).toEqual({
      img: MdxImage,
      a: MdxLink,
      p: MdxParagraph,
      pre: MdxPre,
      figcaption: MdxCodeTitle,
    });
  });
});
