import { render, type RenderOptions } from "@testing-library/react";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { ReactNode } from "react";
import { vi } from "vitest";

export function createTestRouter() {
  return {
    back: vi.fn<AppRouterInstance["back"]>(),
    forward: vi.fn<AppRouterInstance["forward"]>(),
    refresh: vi.fn<AppRouterInstance["refresh"]>(),
    push: vi.fn<AppRouterInstance["push"]>(),
    replace: vi.fn<AppRouterInstance["replace"]>(),
    prefetch: vi.fn<AppRouterInstance["prefetch"]>(),
    bfcacheId: "test",
  } satisfies AppRouterInstance;
}

type RouterOptions = { pathname?: string; search?: string; router?: AppRouterInstance };

/** Provide the App Router contexts that `usePathname`, `useSearchParams` and `useRouter` read from. */
export function NextRouterProvider({
  pathname = "/",
  search = "",
  router = createTestRouter(),
  children,
}: RouterOptions & { children: ReactNode }) {
  return (
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={pathname}>
        <SearchParamsContext.Provider value={new URLSearchParams(search)}>{children}</SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}

export function renderWithRouter(ui: ReactNode, options: RouterOptions & Omit<RenderOptions, "wrapper"> = {}) {
  const { pathname, search, router = createTestRouter(), ...renderOptions } = options;
  const result = render(ui, {
    ...renderOptions,
    wrapper: ({ children }) => (
      <NextRouterProvider pathname={pathname} search={search} router={router}>
        {children}
      </NextRouterProvider>
    ),
  });
  return { ...result, router };
}
