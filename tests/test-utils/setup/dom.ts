import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { sentinelIdentifyHandlers } from "../better-auth-infra";
import { resetDb, testPrisma } from "../db";
import { FakeIntersectionObserver } from "../intersection-observer";
import { server } from "../msw";
import "./shared";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
(globalThis as unknown as { prisma: typeof testPrisma }).prisma = testPrisma;

// Worker threads share the CPU, so give exit animations and async renders more than the 1s default.
configure({ asyncUtilTimeout: 3000 });

// Baseline handlers that survive resetHandlers() between tests.
server.resetHandlers(...sentinelIdentifyHandlers);

globalThis.IntersectionObserver = FakeIntersectionObserver;

// jsdom lacks matchMedia (used by HeroUI/React Aria); report "no match" like a default desktop browser.
window.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

// jsdom has no layout, so nothing ever resizes.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom has no fetch, so Node's (already patched by MSW) is used; resolve relative URLs like a browser would.
const interceptedFetch = globalThis.fetch;
globalThis.fetch = (input, init) =>
  interceptedFetch(
    typeof input === "string" && input.startsWith("/") ? new URL(input, window.location.href) : input,
    init,
  );

beforeEach(() => resetDb());

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  FakeIntersectionObserver.instances = [];
});
