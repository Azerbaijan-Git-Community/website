"use client";

import Image, { type ImageProps } from "next/image";
import { useRef, useState } from "react";
import nextConfig from "@/../next.config";

type ImageFallbackProps = ImageProps & {
  src: string;
  fallback: string;
};

const OPTIMIZED_HOSTS = nextConfig.images?.remotePatterns?.map((pattern) => pattern.hostname) ?? [];

function shouldOptimize(src: ImageProps["src"]): boolean {
  // Static imports are bundled locally, so they're always safe to optimize.
  if (typeof src !== "string") return true;
  try {
    return OPTIMIZED_HOSTS.includes(new URL(src).hostname);
  } catch {
    // Relative/malformed src: not a remote host we can vouch for.
    return false;
  }
}

export function ImageFallback({ fallback, src, alt, ...props }: ImageFallbackProps) {
  const [currentImgSrc, setCurrentImgSrc] = useState(() => src);
  const retryCount = useRef(0);
  const originalSrc = useRef(src);
  const isFinal = useRef(false);

  return (
    <Image
      {...props}
      src={currentImgSrc}
      alt={alt}
      unoptimized={!shouldOptimize(currentImgSrc)}
      onError={() => {
        if (isFinal.current || currentImgSrc === fallback) return;
        if (retryCount.current < 3) {
          retryCount.current += 1;
          const base = originalSrc.current;
          const sep = base.includes("?") ? "&" : "?";
          setCurrentImgSrc(`${base}${sep}_retry=${retryCount.current}`);
        } else {
          isFinal.current = true;
          setCurrentImgSrc(fallback);
        }
      }}
    />
  );
}
