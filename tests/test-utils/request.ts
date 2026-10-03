import { NextRequest } from "next/server";

const ORIGIN = "http://localhost:3000";

/** Build a NextRequest against the local origin, as the App Router passes it to route handlers. */
export function request(path: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) {
  return new NextRequest(`${ORIGIN}${path}`, init);
}

/** Route-handler context with already-resolved dynamic params. */
export function routeContext<T extends Record<string, string | string[]>>(params: T) {
  return { params: Promise.resolve(params) };
}
