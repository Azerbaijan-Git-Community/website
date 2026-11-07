import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { BlogPostsManager } from "@/components/account/blog-posts-manager";
import { Toaster } from "@/components/toaster";
import type { MemberBlogPost } from "@/data/blog/manage";
import { server } from "@test/msw";
import { renderWithRouter } from "@test/next-router";

const post = (id: string, overrides: Partial<MemberBlogPost> = {}): MemberBlogPost => ({
  id,
  slug: id,
  title: `Post ${id}`,
  createdAt: new Date("2026-03-05T12:00:00Z"),
  sourceUrl: `https://omicron.example/@ada/${id}`,
  removedByAuthorAt: null,
  removedByAdminAt: null,
  sourceMissingAt: null,
  ...overrides,
});

function renderManager(posts: MemberBlogPost[], reviewed = true, canDisconnect = true) {
  return renderWithRouter(
    <>
      <Toaster />
      <BlogPostsManager
        posts={posts}
        reviewed={reviewed}
        canDisconnect={canDisconnect}
        omicronUrl="https://omicron.example/@ada"
      />
    </>,
  );
}

describe("BlogPostsManager once reviewed", () => {
  test("hides a visible post", async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.patch("http://localhost:3000/api/account/blog/posts/a", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: "Post hidden from the blog." });
      }),
    );
    renderManager([post("a")]);

    await user.click(screen.getByRole("button", { name: "Hide from blog" }));

    expect(await screen.findByText("Post hidden from the blog.")).toBeInTheDocument();
    expect(body).toEqual({ visible: false });
  });

  test("offers to show a hidden post", () => {
    renderManager([post("a", { removedByAuthorAt: new Date() })]);
    expect(screen.getByRole("button", { name: "Show on blog" })).toBeInTheDocument();
  });

  test.each([
    ["removed by an admin", { removedByAdminAt: new Date() }, "An admin removed this post"],
    ["gone from Omicron", { sourceMissingAt: new Date() }, "No longer public on Omicron"],
  ])("a post %s can't be toggled, and says why", (_label, overrides, message) => {
    renderManager([post("a", overrides)]);
    expect(screen.getByText(message, { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /blog$/ })).not.toBeInTheDocument();
  });

  test("shows the server's error", async () => {
    const user = userEvent.setup();
    server.use(
      http.patch("http://localhost:3000/api/account/blog/posts/a", () =>
        HttpResponse.json({ error: "An admin removed this post from the blog." }, { status: 403 }),
      ),
    );
    renderManager([post("a")]);
    await user.click(screen.getByRole("button", { name: "Hide from blog" }));
    expect(await screen.findByText("An admin removed this post from the blog.")).toBeInTheDocument();
  });

  test("disconnecting takes a second click", async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.delete("http://localhost:3000/api/omicron/connection", () => {
        calls += 1;
        return HttpResponse.json({ message: "Disconnected." });
      }),
    );
    renderManager([post("a")]);

    await user.click(screen.getByRole("button", { name: "Disconnect Omicron" }));
    expect(calls).toBe(0);
    await user.click(screen.getByRole("button", { name: /Click again/ }));
    expect(await screen.findByText("Disconnected.")).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  test("a banned member isn't offered Disconnect", () => {
    renderManager([post("a")], true, false);
    expect(screen.queryByRole("button", { name: "Disconnect Omicron" })).not.toBeInTheDocument();
  });

  test("points to Omicron when there's nothing yet", () => {
    renderManager([]);
    expect(screen.getByRole("link", { name: /Write your first one/ })).toHaveAttribute(
      "href",
      "https://omicron.example/@ada",
    );
  });
});

describe("BlogPostsManager during the first review", () => {
  test("starts with everything ticked, and publishes only what stays ticked", async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post("http://localhost:3000/api/account/blog/review", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: "1 posts are now on the blog." });
      }),
    );
    const hidden = { removedByAuthorAt: new Date() };
    renderManager([post("a", hidden), post("b", hidden)], false);

    expect(screen.getByRole("checkbox", { name: 'Show "Post a" on the blog' })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: 'Show "Post b" on the blog' }));
    await user.click(screen.getByRole("button", { name: "Confirm and publish 1 of 2" }));

    expect(await screen.findByText("1 posts are now on the blog.")).toBeInTheDocument();
    expect(body).toEqual({ visibleIds: ["a"] });
  });

  test("an admin-removed post can't be ticked", () => {
    renderManager([post("a", { removedByAdminAt: new Date() })], false);
    const box = screen.getByRole("checkbox");
    expect(box).toBeDisabled();
    expect(box).not.toBeChecked();
  });
});
