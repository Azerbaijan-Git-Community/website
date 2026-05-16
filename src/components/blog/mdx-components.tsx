import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

function MdxImage({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src || typeof src !== "string") return null;

  return (
    <figure className="my-8 flex justify-center">
      <Image
        src={src}
        alt={alt ?? ""}
        width={800}
        height={450}
        className="rounded-lg"
        sizes="(max-width: 768px) 100vw, 800px"
        loading="lazy"
        unoptimized
      />
    </figure>
  );
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
};
