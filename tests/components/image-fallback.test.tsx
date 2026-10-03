import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ImageFallback } from "@/components/image-fallback";

const FALLBACK = "https://opengraph.githubassets.com/1/acme/rocket";

function renderImage(src: string) {
  render(<ImageFallback src={src} fallback={FALLBACK} alt="banner" width={400} height={200} />);
  return screen.getByRole("img", { name: "banner" });
}

const resolvedSrc = (img: HTMLElement) => new URL(img.getAttribute("src")!, window.location.href);

const isOptimized = (img: HTMLElement) => resolvedSrc(img).pathname === "/_next/image";

/** The URL the image ultimately loads: unwraps the /_next/image optimizer, resolves relative paths. */
function originalUrl(img: HTMLElement) {
  return isOptimized(img) ? resolvedSrc(img).searchParams.get("url") : resolvedSrc(img).href;
}

describe("ImageFallback", () => {
  test("optimizes images from hosts configured in next.config", () => {
    const img = renderImage("https://raw.githubusercontent.com/acme/rocket/main/banner.png");
    expect(isOptimized(img)).toBe(true);
    expect(originalUrl(img)).toBe("https://raw.githubusercontent.com/acme/rocket/main/banner.png");
  });

  test.for(["https://i.imgur.com/banner.png", "/local/banner.png", "not-a-url"])("serves %s unoptimized", (src) => {
    const img = renderImage(src);
    expect(isOptimized(img)).toBe(false);
    expect(originalUrl(img)).toBe(new URL(src, window.location.href).href);
  });

  test("retries a broken image three times with cache-busting params, then falls back", () => {
    const img = renderImage("https://i.imgur.com/banner.png");

    fireEvent.error(img);
    expect(originalUrl(img)).toBe("https://i.imgur.com/banner.png?_retry=1");
    fireEvent.error(img);
    expect(originalUrl(img)).toBe("https://i.imgur.com/banner.png?_retry=2");
    fireEvent.error(img);
    expect(originalUrl(img)).toBe("https://i.imgur.com/banner.png?_retry=3");
    fireEvent.error(img);
    expect(originalUrl(img)).toBe(FALLBACK);
    expect(isOptimized(img)).toBe(true);
  });

  test("appends the retry param to an existing query string", () => {
    const img = renderImage("https://i.imgur.com/banner.png?size=large");
    fireEvent.error(img);
    expect(originalUrl(img)).toBe("https://i.imgur.com/banner.png?size=large&_retry=1");
  });

  test("stops once the fallback itself fails", () => {
    const img = renderImage(FALLBACK);
    fireEvent.error(img);
    fireEvent.error(img);
    expect(originalUrl(img)).toBe(FALLBACK);
  });
});
