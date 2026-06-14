import { AnchorHTMLAttributes } from "react";

export function MdxLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href?.startsWith("http");

  return (
    <a href={href} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}
