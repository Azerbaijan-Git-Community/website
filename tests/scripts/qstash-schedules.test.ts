import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { server } from "@test/msw";

const QSTASH = "https://qstash-eu-central-1.upstash.io";

type ScheduleRequest = { url: string; headers: Headers };

function fakeQstash(status = 201) {
  const requests: ScheduleRequest[] = [];
  server.use(
    http.post(`${QSTASH}/v2/schedules/*`, ({ request }) => {
      requests.push({ url: request.url, headers: request.headers });
      return status < 400
        ? HttpResponse.json({ scheduleId: request.headers.get("upstash-schedule-id") }, { status })
        : HttpResponse.json({ error: "invalid token" }, { status });
    }),
  );
  return requests;
}

/** The script runs `main()` on import without awaiting it, so wait for its final log line. */
async function runScript() {
  vi.resetModules();
  await import("../../scripts/qstash-schedules");
}

let log: ReturnType<typeof vi.spyOn>;
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log = vi.spyOn(console, "log").mockImplementation(() => {});
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubEnv("QSTASH_TOKEN", "qstash-token");
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://githubcommunity.az");
});

afterEach(() => {
  vi.resetModules();
});

describe("qstash-schedules script", () => {
  test("registers the hourly leaderboard sync against the production URL", async () => {
    const requests = fakeQstash();

    await runScript();
    await expect
      .poll(() => log.mock.calls.flat())
      .toContain("[qstash] leaderboard-sync: 0 * * * * -> https://githubcommunity.az/api/webhooks/leaderboard");

    expect(requests).toHaveLength(1);
    const [{ url, headers }] = requests;
    expect(decodeURIComponent(new URL(url).pathname)).toBe(
      "/v2/schedules/https://githubcommunity.az/api/webhooks/leaderboard",
    );
    expect(headers.get("authorization")).toBe("Bearer qstash-token");
    expect(headers.get("upstash-schedule-id")).toBe("leaderboard-sync");
    expect(headers.get("upstash-cron")).toBe("0 * * * *");
    expect(headers.get("upstash-method")).toBe("POST");
    expect(headers.get("upstash-retries")).toBe("2");
    expect(headers.get("upstash-forward-authorization")).toBe("Bearer test-cron-secret");
    // The cron secret must not show up in QStash's logs.
    expect(headers.get("upstash-redact-fields")).toBe("header[Authorization]");
  });

  test("skips without a QStash token", async () => {
    vi.stubEnv("QSTASH_TOKEN", undefined);
    const requests = fakeQstash();

    await runScript();

    await expect.poll(() => log.mock.calls.flat()).toContain("[qstash] QSTASH_TOKEN not set, skipping schedule sync");
    expect(requests).toHaveLength(0);
  });

  test.for(["preview", "development"])("skips %s builds", async (env) => {
    vi.stubEnv("VERCEL_ENV", env);
    const requests = fakeQstash();

    await runScript();

    await expect.poll(() => log.mock.calls.flat()).toContain(`[qstash] ${env} build, skipping`);
    expect(requests).toHaveLength(0);
  });

  test("runs outside Vercel (e.g. a self-hosted production build)", async () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    const requests = fakeQstash();

    await runScript();

    await expect.poll(() => requests).toHaveLength(1);
  });

  test.for(["http://localhost:3000", "http://127.0.0.1:3000"])("skips local URL %s", async (url) => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", url);
    const requests = fakeQstash();

    await runScript();

    await expect.poll(() => log.mock.calls.flat()).toContain("[qstash] local URL, skipping");
    expect(requests).toHaveLength(0);
  });

  test("warns instead of failing the build when QStash rejects the request", async () => {
    fakeQstash(401);

    await runScript();

    await expect.poll(() => warn.mock.calls[0]?.[0]).toBe("[qstash] schedule sync failed:");
  });
});
