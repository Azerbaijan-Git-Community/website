import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { BlogModeration } from "@/components/admin/blog-moderation";
import { Toaster } from "@/components/toaster";
import type { ModerationPost } from "@/data/blog/manage";
import { server } from "@test/msw";
import { renderWithRouter } from "@test/next-router";

const post = (
  overrides: Partial<ModerationPost> = {},
  author: Partial<ModerationPost["author"]> = {},
): ModerationPost => ({
  id: "p1",
  slug: "hello",
  title: "Hello",
  createdAt: new Date("2026-03-05T12:00:00Z"),
  sourceUrl: "https://omicron.example/@ada/hello",
  removedByAdminAt: null,
  removedByAuthorAt: null,
  ...overrides,
  author: {
    id: "u1",
    name: "Ada",
    githubUsername: "ada",
    role: "user",
    banned: false,
    blogBanned: false,
    ...author,
  },
});

function renderPanel(posts: ModerationPost[]) {
  return renderWithRouter(
    <>
      <Toaster />
      <BlogModeration posts={posts} />
    </>,
  );
}

function endpoint(path: string, message = "Done.") {
  const bodies: unknown[] = [];
  server.use(
    http.patch(`http://localhost:3000${path}`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ message });
    }),
  );
  return bodies;
}

describe("BlogModeration", () => {
  test("says so when there's nothing to moderate", () => {
    renderPanel([]);
    expect(screen.getByText("No blog posts yet.")).toBeInTheDocument();
  });

  test("removes one post", async () => {
    const user = userEvent.setup();
    const bodies = endpoint("/api/admin/blog/posts/p1", "Post removed from the blog.");
    renderPanel([post()]);
    await user.click(screen.getByRole("button", { name: "Remove post" }));
    expect(await screen.findByText("Post removed from the blog.")).toBeInTheDocument();
    expect(bodies).toEqual([{ removed: true }]);
  });

  test("restores a removed post, and shows why it's down", async () => {
    const user = userEvent.setup();
    const bodies = endpoint("/api/admin/blog/posts/p1", "Post restored.");
    renderPanel([post({ removedByAdminAt: new Date() })]);
    expect(screen.getByText(/removed by admin/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore post" }));
    await screen.findByText("Post restored.");
    expect(bodies).toEqual([{ removed: false }]);
  });

  test("bans from the blog with the typed reason", async () => {
    const user = userEvent.setup();
    const bodies = endpoint("/api/admin/blog/users/u1", "Blog ban saved.");
    renderPanel([post()]);
    await user.type(screen.getByLabelText("Ban reason"), "Spam");
    await user.click(screen.getByRole("button", { name: "Ban from blog" }));
    await screen.findByText("Blog ban saved.");
    expect(bodies).toEqual([{ action: "blog-ban", reason: "Spam" }]);
  });

  test("a full ban takes a second click", async () => {
    const user = userEvent.setup();
    const bodies = endpoint("/api/admin/blog/users/u1", "Ban saved.");
    renderPanel([post()]);
    await user.click(screen.getByRole("button", { name: "Ban user" }));
    expect(bodies).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Click again to ban" }));
    await screen.findByText("Ban saved.");
    expect(bodies).toEqual([{ action: "ban" }]);
  });

  test("offers the reverse of each ban", async () => {
    const user = userEvent.setup();
    const bodies = endpoint("/api/admin/blog/users/u1", "Unban saved.");
    renderPanel([post({}, { banned: true, blogBanned: true })]);
    await user.click(screen.getByRole("button", { name: "Allow on blog" }));
    await expect.poll(() => bodies).toEqual([{ action: "blog-unban" }]);
    await screen.findAllByText("Unban saved.");
    await user.click(screen.getByRole("button", { name: "Unban user" }));
    await expect.poll(() => bodies).toEqual([{ action: "blog-unban" }, { action: "unban" }]);
  });

  test("admins' posts can be removed, but the admins can't be banned", () => {
    renderPanel([post({}, { role: "admin" })]);
    expect(screen.getByRole("button", { name: "Remove post" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ban user" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ban from blog" })).not.toBeInTheDocument();
  });
});
