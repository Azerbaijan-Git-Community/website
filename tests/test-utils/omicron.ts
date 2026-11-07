import { createHmac } from "node:crypto";
import { http, HttpResponse } from "msw";
import { server } from "./msw";

export const OMICRON = "https://omicron.example";

/** A post as Omicron's public API returns it. */
export function omicronPost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    title: "Hello",
    slug: "hello",
    contentHtml: "<p>Hello there, reader.</p>",
    contentJson: null,
    remote: false,
    aiAssisted: false,
    status: "published",
    summary: "A greeting",
    bannerUrl: "/api/uploads/cover.png",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    author: { id: "a", username: "ada", displayName: "Ada", avatarUrl: null, remote: false },
    tags: [{ slug: "go", name: "Go" }],
    ...overrides,
  };
}

/** Serves posts by id: an entry is the post, or a status to fail with. Missing ids are 404. */
export function fakeOmicronPosts(posts: Record<string, object | number>) {
  server.use(
    http.get(`${OMICRON}/api/posts/:id`, ({ params }) => {
      const post = posts[String(params.id)];
      if (post === undefined) return HttpResponse.json({ error: "Not found" }, { status: 404 });
      if (typeof post === "number") return HttpResponse.json({ error: "Failed" }, { status: post });
      return HttpResponse.json({ post });
    }),
  );
}

/** Serves one author's listing, in pages. A number fails with that status. */
export function fakeOmicronListing(username: string, pages: object[][] | number) {
  const requested: (string | null)[] = [];
  server.use(
    http.get(`${OMICRON}/api/users/${username}/posts`, ({ request }) => {
      if (typeof pages === "number") return HttpResponse.json({ error: "Failed" }, { status: pages });
      const cursor = new URL(request.url).searchParams.get("cursor");
      requested.push(cursor);
      const index = cursor ? Number(cursor) : 0;
      return HttpResponse.json({
        items: pages[index] ?? [],
        nextCursor: index + 1 < pages.length ? String(index + 1) : null,
      });
    }),
  );
  return { requested };
}

/** What Omicron's sweeper sends: an HMAC-SHA256 of `<t>.<body>`. */
export function signOmicronBody(secret: string, body: string, at = Date.now()) {
  const t = Math.floor(at / 1000);
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
}
