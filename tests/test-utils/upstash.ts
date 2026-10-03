import { http, HttpResponse } from "msw";
import { server } from "./msw";

type Command = [string, ...(string | number)[]];

const UPSTASH_URL = "https://upstash.test";

/**
 * In-memory emulation of the Upstash Redis REST API, implementing just the two Lua scripts
 * `@upstash/ratelimit` runs (sliding + fixed window). The real Ratelimit/Redis clients talk to it over `fetch`.
 */
class FakeUpstash {
  readonly counts = new Map<string, number>();
  /** When set, every request fails with this HTTP status (simulates an Upstash outage). */
  failWith: number | null = null;

  reset() {
    this.counts.clear();
    this.failWith = null;
  }

  /** Pre-fill a counter so the next request for `ip` lands at a given usage. */
  setUsage(prefix: "odapi:min" | "odapi:day", ip: string, used: number) {
    const windowMs = prefix === "odapi:min" ? 60_000 : 86_400_000;
    this.counts.set(`${prefix}:${ip}:${Math.floor(Date.now() / windowMs)}`, used);
  }

  private exec([name, ...rest]: Command): unknown {
    const cmd = name.toLowerCase();
    if (cmd !== "evalsha" && cmd !== "eval") throw new Error(`FakeUpstash: unsupported command ${name}`);

    const [, numKeys, ...params] = rest;
    const keys = params.slice(0, Number(numKeys)).map(String);
    const args = params.slice(Number(numKeys)).map(Number);

    if (keys.length >= 2) {
      // Sliding window: ARGV = [tokens, now, window, incrementBy] -> [remaining | -1, limit]
      const [tokens, , , incrementBy] = args;
      const used = this.counts.get(keys[0]) ?? 0;
      if (used + incrementBy > tokens) return [-1, tokens];
      this.counts.set(keys[0], used + incrementBy);
      return [tokens - used - incrementBy, tokens];
    }

    // Fixed window: ARGV = [tokens, window, incrementBy] -> [usedAfterUpdate, limit]
    const [tokens, , incrementBy] = args;
    const used = (this.counts.get(keys[0]) ?? 0) + incrementBy;
    this.counts.set(keys[0], used);
    return [used, tokens];
  }

  handlers() {
    return [
      http.post<never, Command[]>(`${UPSTASH_URL}/pipeline`, async ({ request }) => {
        if (this.failWith) return new HttpResponse(null, { status: this.failWith });
        const commands = await request.json();
        return HttpResponse.json(commands.map((c) => ({ result: this.exec(c) })));
      }),
      http.post<never, Command>(UPSTASH_URL, async ({ request }) => {
        if (this.failWith) return new HttpResponse(null, { status: this.failWith });
        return HttpResponse.json({ result: this.exec(await request.json()) });
      }),
    ];
  }
}

export const upstash = new FakeUpstash();

/** Install the fake Upstash backend for the current test (call from `beforeEach`). */
export function useFakeUpstash() {
  upstash.reset();
  server.use(...upstash.handlers());
}
