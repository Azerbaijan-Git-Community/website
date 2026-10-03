import type { ReactNode } from "react";
import { prerender } from "react-dom/static";
import { NextRouterProvider } from "./next-router";

/**
 * Render a Server Component tree (async components included) to static HTML, like Next's prerender,
 * and mount it into the document; query it with `screen`. The markup is not hydrated.
 */
export async function renderServer(ui: ReactNode, { pathname = "/" }: { pathname?: string } = {}) {
  const { prelude } = await prerender(<NextRouterProvider pathname={pathname}>{ui}</NextRouterProvider>);
  const container = document.createElement("div");
  container.innerHTML = await new Response(prelude).text();
  document.body.append(container);
  return { container };
}
