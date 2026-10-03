import { prerender } from "react-dom/static";
import { describe, expect, test, vi } from "vitest";
import RootLayout, { metadata } from "@/app/layout";
import { NextRouterProvider } from "@test/next-router";

// next/font is compiled away by Next's SWC plugin; at runtime it only exposes the generated class names.
vi.mock(import("next/font/google"), () => ({
  Inter: () => ({ className: "inter", variable: "font-inter-var", style: { fontFamily: "Inter" } }),
  Outfit: () => ({ className: "outfit", variable: "font-outfit-var", style: { fontFamily: "Outfit" } }),
}));
vi.mock(import("next/headers"), async (importOriginal) =>
  (await import("@test/next-headers")).mockNextHeaders(importOriginal),
);

async function renderDocument() {
  const { prelude } = await prerender(
    <NextRouterProvider>
      <RootLayout>
        <p>page content</p>
      </RootLayout>
    </NextRouterProvider>,
  );
  return new DOMParser().parseFromString(await new Response(prelude).text(), "text/html");
}

describe("RootLayout", () => {
  test("renders an English document in the dark theme with both font variables", async () => {
    const doc = await renderDocument();
    expect(doc.documentElement.lang).toBe("en");
    expect(doc.body.className.split(" ")).toEqual(
      expect.arrayContaining(["font-inter-var", "font-outfit-var", "dark", "antialiased"]),
    );
  });

  test("wraps the page in the navbar, main and footer", async () => {
    const doc = await renderDocument();
    expect(doc.querySelector("body > nav")).not.toBeNull();
    expect(doc.querySelector("main")?.textContent).toBe("page content");
    expect(doc.querySelector("footer")).not.toBeNull();
  });

  test("embeds site-wide Organization and WebSite structured data", async () => {
    const doc = await renderDocument();
    const schemas = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent);
    expect(schemas.map((s: { "@type": string }) => s["@type"])).toEqual(["Organization", "WebSite"]);
  });
});

describe("metadata", () => {
  test("resolves relative URLs against the site and templates page titles", () => {
    expect(String(metadata.metadataBase)).toBe("http://localhost:3000/");
    expect(metadata.title).toEqual({
      default: "Azerbaijan GitHub Community | 500,000 Commits",
      template: "%s | Azerbaijan GitHub Community",
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
