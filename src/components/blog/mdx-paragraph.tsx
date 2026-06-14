import { Children, HTMLAttributes, isValidElement } from "react";
import { MdxImage } from "./mdx-image";

export function MdxParagraph({ children }: HTMLAttributes<HTMLParagraphElement>) {
  const hasImage = Children.toArray(children).some((child) => isValidElement(child) && child.type === MdxImage);
  if (hasImage) return <>{children}</>;
  return <p>{children}</p>;
}
