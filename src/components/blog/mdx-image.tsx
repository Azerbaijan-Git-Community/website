import Image from "next/image";
import { ImgHTMLAttributes } from "react";

export function MdxImage({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) {
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
