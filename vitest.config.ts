import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const emptyModule = fileURLToPath(new URL("./tests/test-utils/empty-module.ts", import.meta.url));

// Same values as the CI workflow; `env.server.ts` validates these at import time.
const testEnv = {
  NODE_ENV: "test" as const,
  TZ: "UTC",
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
  NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL: "https://kv.better-auth.com/projects/test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DIRECT_URL: "postgresql://test:test@localhost:5432/test",
  BETTER_AUTH_SECRET_V1: "test-secret-v1-abcdefghijklmnopqrstuvwxyz",
  BETTER_AUTH_SECRET_V2: "test-secret-v2-abcdefghijklmnopqrstuvwxyz",
  BETTER_AUTH_URL: "http://localhost:3000",
  GH_STATS_TOKEN: "test-gh-token",
  CRON_SECRET: "test-cron-secret",
  GITHUB_CLIENT_ID: "test-client-id",
  GITHUB_CLIENT_SECRET: "test-client-secret",
  SHOWCASE_WEBHOOK_SECRET: "test-showcase-secret",
  BLOG_WEBHOOK_SECRET: "test-blog-secret",
  AUTHOR_VALIDATE_SECRET: "test-author-secret",
  UPSTASH_REDIS_REST_URL: "https://upstash.test",
  UPSTASH_REDIS_REST_TOKEN: "test-upstash-token",
};

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside the react-server condition; Next strips it at build time.
    alias: { "server-only": emptyModule },
  },
  test: {
    env: testEnv,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    globalSetup: ["./tests/test-utils/global-setup.ts"],
    // Node 25+ exposes a half-configured global localStorage that warns on access; jsdom provides its own.
    execArgv: ["--no-experimental-webstorage"],
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/**/opengraph-image.test.ts"],
          setupFiles: ["./tests/test-utils/setup/server.ts"],
        },
      },
      {
        // Next renders OG images under the `react-server` condition (e.g. react-icons skips its context wrapper there).
        extends: true,
        ssr: {
          resolve: {
            conditions: ["react-server", "module", "node", "development|production"],
            externalConditions: ["react-server"],
          },
        },
        test: {
          name: "og",
          environment: "node",
          include: ["tests/**/opengraph-image.test.ts"],
          setupFiles: ["./tests/test-utils/setup/server.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          environmentOptions: { jsdom: { url: "http://localhost:3000/" } },
          include: ["tests/**/*.test.tsx"],
          setupFiles: ["./tests/test-utils/setup/dom.ts"],
          // Every file runs in a fresh worker; pre-bundling these many-file packages halves per-file import time.
          deps: {
            optimizer: {
              client: {
                enabled: true,
                include: [
                  "@heroui/react",
                  "@testing-library/jest-dom/vitest",
                  "@testing-library/react",
                  "@testing-library/user-event",
                ],
              },
            },
          },
        },
      },
    ],
  },
});
