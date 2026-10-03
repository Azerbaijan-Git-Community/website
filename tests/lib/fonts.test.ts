import { describe, expect, test, vi } from "vitest";

// next/font is compiled away by Next's SWC plugin; record the options the app passes to it.
const { fontCalls, font } = vi.hoisted(() => {
  const calls: { family: string; options: unknown }[] = [];
  return {
    fontCalls: calls,
    font: (family: string) => (options: unknown) => {
      calls.push({ family, options });
      return { className: family, style: { fontFamily: family }, variable: family };
    },
  };
});
vi.mock(import("next/font/google"), () => ({ Inter: font("Inter"), Outfit: font("Outfit") }));

describe("fonts", () => {
  test("loads Inter and Outfit as swappable CSS variables", async () => {
    const { inter, outfit } = await import("@/lib/fonts");

    expect(fontCalls).toEqual([
      { family: "Inter", options: { subsets: ["latin"], variable: "--font-inter", display: "swap" } },
      { family: "Outfit", options: { subsets: ["latin"], variable: "--font-outfit", display: "swap" } },
    ]);
    expect(inter.variable).toBe("Inter");
    expect(outfit.variable).toBe("Outfit");
  });
});
