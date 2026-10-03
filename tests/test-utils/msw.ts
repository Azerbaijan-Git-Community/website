import { setupServer } from "msw/node";

/** Shared MSW server: intercepts outgoing `fetch` so real HTTP clients run against fake backends. */
export const server = setupServer();
