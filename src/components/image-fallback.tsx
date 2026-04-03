"use client";

import Image, { type ImageProps } from "next/image";
import { useRef, useState } from "react";

type ImageFallbackProps = ImageProps & {
  fallback: string;
};

export function ImageFallback({ fallback, src, alt, ...props }: ImageFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const didFallback = useRef(false);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (!didFallback.current) {
          didFallback.current = true;
          setImgSrc(fallback);
        }
      }}
    />
  );
}
