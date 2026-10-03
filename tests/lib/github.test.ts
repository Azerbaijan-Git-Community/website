import { http, HttpResponse } from "msw";
import { describe, expect, test, vi } from "vitest";
import { ghBlobText, ghGraphQL, ghJson, ghRawContent, ghText, GithubRequestError } from "@/lib/github";
import { server } from "@test/msw";

const API = "https://api.github.com";

describe("ghJson", () => {
  test("GETs an API path with the stats token and JSON accept header", async () => {
    let seen: Headers | undefined;
    server.use(
      http.get(`${API}/repos/org/repo/contents/posts`, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json([{ name: "hello", type: "dir" }]);
      }),
    );

    await expect(ghJson("/repos/org/repo/contents/posts")).resolves.toEqual([{ name: "hello", type: "dir" }]);
    expect(seen?.get("authorization")).toBe("Bearer test-gh-token");
    expect(seen?.get("accept")).toBe("application/vnd.github+json");
  });
});

describe("ghText", () => {
  test("GETs an absolute URL as text without a custom accept header", async () => {
    let accept: string | null = "unset";
    server.use(
      http.get("https://raw.githubusercontent.com/org/repo/main/file.md", ({ request }) => {
        accept = request.headers.get("accept");
        return HttpResponse.text("# raw");
      }),
    );

    await expect(ghText("https://raw.githubusercontent.com/org/repo/main/file.md")).resolves.toBe("# raw");
    expect(accept).not.toBe("application/vnd.github+json");
  });
});

describe("ghBlobText", () => {
  test("fetches a blob by SHA as raw content", async () => {
    server.use(
      http.get(`${API}/repos/org/showcase/git/blobs/abc123`, ({ request }) =>
        request.headers.get("accept") === "application/vnd.github.raw"
          ? HttpResponse.text("repo: a/b")
          : new HttpResponse(null, { status: 415 }),
      ),
    );

    await expect(ghBlobText("org", "showcase", "abc123")).resolves.toBe("repo: a/b");
  });
});

describe("ghRawContent", () => {
  test("fetches a contents path as raw text", async () => {
    server.use(
      http.get(`${API}/repos/org/blog/contents/posts/x/index.mdx`, ({ request }) =>
        request.headers.get("accept") === "application/vnd.github.raw"
          ? HttpResponse.text("---\ntitle: x\n---")
          : new HttpResponse(null, { status: 415 }),
      ),
    );

    await expect(ghRawContent("/repos/org/blog/contents/posts/x/index.mdx")).resolves.toBe("---\ntitle: x\n---");
  });
});

async function failWith(response: HttpResponse<string> | HttpResponse<null>) {
  server.use(http.get(`${API}/thing`, () => response));
  const error = await ghJson("/thing").then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof GithubRequestError)) throw new Error("expected a GithubRequestError");
  return error;
}

describe("request failures", () => {
  test("throw a GithubRequestError describing the request", async () => {
    const error = await failWith(
      new HttpResponse("Not Found", {
        status: 404,
        headers: { "x-ratelimit-remaining": "4999", "x-ratelimit-reset": "1700000000" },
      }),
    );

    expect(error).toBeInstanceOf(GithubRequestError);
    expect(error).toMatchObject({ name: "GithubRequestError", status: 404, retryAfterMs: null });
    expect(error.secondaryRateLimit).toBe(false);
    expect(error.message).toContain("api.github.com/thing -> 404");
    expect(error.message).toContain("body: Not Found");
    expect(error.message).toContain("ratelimit-remaining: 4999");
    expect(error.message).toContain("ratelimit-reset: 1700000000");
  });

  test("truncate long bodies to 500 characters", async () => {
    const error = await failWith(new HttpResponse("x".repeat(2000), { status: 500 }));
    expect(error.message).toContain(`body: ${"x".repeat(500)}`);
    expect(error.message).not.toContain("x".repeat(501));
  });

  test("detect a secondary rate limit from the body", async () => {
    const error = await failWith(new HttpResponse("You have exceeded a secondary rate limit.", { status: 403 }));
    expect(error).toMatchObject({ status: 403, secondaryRateLimit: true, retryAfterMs: null });
  });

  test("detect a secondary rate limit from retry-after and parse it to ms", async () => {
    const error = await failWith(new HttpResponse("slow down", { status: 429, headers: { "retry-after": "30" } }));
    expect(error).toMatchObject({ status: 429, secondaryRateLimit: true, retryAfterMs: 30_000 });
    expect(error.message).toContain("retry-after: 30s");
  });

  test("ignore an unparseable retry-after", async () => {
    const error = await failWith(new HttpResponse(null, { status: 403, headers: { "retry-after": "soon" } }));
    expect(error.retryAfterMs).toBeNull();
  });

  test("treat a plain 403 (e.g. bad token scope) as not rate limited", async () => {
    const error = await failWith(new HttpResponse("Resource not accessible", { status: 403 }));
    expect(error.secondaryRateLimit).toBe(false);
  });

  test("redden the message outside production only", async () => {
    const devError = await failWith(new HttpResponse(null, { status: 500 }));
    expect(devError.message).toBe("\x1b[31mapi.github.com/thing -> 500\x1b[0m");

    vi.stubEnv("NODE_ENV", "production");
    const prodError = await failWith(new HttpResponse(null, { status: 500 }));
    expect(prodError.message).toBe("api.github.com/thing -> 500");
  });
});

describe("ghGraphQL", () => {
  test("POSTs the query and returns the envelope including partial errors", async () => {
    let body: unknown;
    let headers: Headers | undefined;
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        body = await request.json();
        headers = request.headers;
        return HttpResponse.json({ data: { u0: null }, errors: [{ path: ["u0"], message: "Not found" }] });
      }),
    );

    await expect(ghGraphQL("query { viewer { login } }")).resolves.toEqual({
      data: { u0: null },
      errors: [{ path: ["u0"], message: "Not found" }],
    });
    expect(body).toEqual({ query: "query { viewer { login } }" });
    expect(headers?.get("authorization")).toBe("Bearer test-gh-token");
    expect(headers?.get("content-type")).toBe("application/json");
  });

  test("throws on transport failures instead of returning an empty envelope", async () => {
    server.use(http.post(`${API}/graphql`, () => new HttpResponse("Bad credentials", { status: 401 })));
    await expect(ghGraphQL("query { x }")).rejects.toMatchObject({ name: "GithubRequestError", status: 401 });
  });
});
