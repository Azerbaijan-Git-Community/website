"use client";

import Image, { type ImageProps } from "next/image";
import { useRef, useState } from "react";

type ImageFallbackProps = ImageProps & {
  fallback: string;
};

export function ImageFallback({ fallback, src, alt, ...props }: ImageFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const retryCount = useRef(0);
  const originalSrc = useRef(src);
  const isFinal = useRef(false);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (isFinal.current) return;
        if (retryCount.current < 3) {
          retryCount.current += 1;
          const base = String(originalSrc.current);
          const sep = base.includes("?") ? "&" : "?";
          setImgSrc(`${base}${sep}_retry=${retryCount.current}`);
        } else {
          isFinal.current = true;
          setImgSrc(fallback);
        }
      }}
    />
  );
}
