import { describe, expect, test } from "vitest";
import { GET } from "@/app/api/omicron/connect/route";
import { sessionHeadersFor } from "@test/auth";
import { createUser } from "@test/db";
import { request } from "@test/request";

describe("GET /api/omicron/connect", () => {
  test("signed-out visitors go back to the blog", async () => {
    const res = await GET(request("/api/omicron/connect"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/blog");
  });

  test("sends a member to Omicron's consent page and remembers the attempt in a private cookie", async () => {
    const user = await createUser();
    const res = await GET(request("/api/omicron/connect", { headers: await sessionHeadersFor(user.id) }));

    const location = new URL(res.headers.get("location") ?? "");
    expect(location.origin + location.pathname).toBe("https://omicron.example/oauth/authorize");
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");

    const cookie = res.cookies.get("omicron_oauth");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    const [state, verifier] = (cookie?.value ?? "").split(".");
    expect(location.searchParams.get("state")).toBe(state);
    // The verifier must stay here: only its hash may travel.
    expect(location.toString()).not.toContain(verifier);
  });

  test("two attempts never share a state", async () => {
    const user = await createUser();
    const headers = await sessionHeadersFor(user.id);
    const [a, b] = [await GET(request("/x", { headers })), await GET(request("/x", { headers }))];
    expect(a.cookies.get("omicron_oauth")?.value).not.toBe(b.cookies.get("omicron_oauth")?.value);
  });
});
