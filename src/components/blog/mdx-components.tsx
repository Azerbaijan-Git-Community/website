import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import {
  type AnchorHTMLAttributes,
  Children,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  isValidElement,
} from "react";
import { MdxCodeTitle } from "./mdx-code-title";
import { MdxPre } from "./mdx-pre";

function MdxImage({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src || typeof src !== "string") return null;

  return (
    <figure className="my-8 flex justify-center">
      <Image
        src={src}
        alt={alt ?? ""}
        width={800}
        height={600}
        unoptimized
        className="max-w-full rounded-lg"
        style={{ width: "auto", height: "auto" }}
      />
    </figure>
  );
}

function MdxParagraph({ children }: HTMLAttributes<HTMLParagraphElement>) {
  const hasImage = Children.toArray(children).some((child) => isValidElement(child) && child.type === MdxImage);
  if (hasImage) return <>{children}</>;
  return <p>{children}</p>;
}

function MdxLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href?.startsWith("http");

  return (
    <a href={href} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}

export const mdxComponents: MDXComponents = {
  img: MdxImage,
  a: MdxLink,
  p: MdxParagraph,
  pre: MdxPre,
  figcaption: MdxCodeTitle,
};
