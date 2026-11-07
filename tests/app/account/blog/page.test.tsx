import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AccountBlogPage, { metadata } from "@/app/account/blog/page";
import { AccountBlogContent, AccountBlogSkeleton } from "@/components/account/account-blog-content";
import { sessionHeadersFor } from "@test/auth";
import { createBlogPost, createOmicronConnection, createUser } from "@test/db";
import { incomingRequest } from "@test/next-headers";
import { renderServer } from "@test/render-server";

vi.mock(import("next/headers"), async (importOriginal) =>
  (await import("@test/next-headers")).mockNextHeaders(importOriginal),
);

const props = (search: Record<string, string> = {}) => ({
  params: Promise.resolve({}),
  searchParams: Promise.resolve(search),
});

async function signIn(input: Parameters<typeof createUser>[0] = {}) {
  const user = await createUser(input);
  incomingRequest.headers = await sessionHeadersFor(user.id);
  return user;
}

beforeEach(() => {
  incomingRequest.headers = new Headers();
});

describe("AccountBlogPage", () => {
  test("sends visitors to the blog", async () => {
    await expect(renderServer(<AccountBlogContent />)).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });
  });

  test("offers the connection to a member without one", async () => {
    await signIn();
    await renderServer(<AccountBlogPage {...props()} />);
    expect(screen.getByRole("link", { name: "Connect Omicron" })).toHaveAttribute("href", "/api/omicron/connect");
  });

  test("lists a connected member's posts, and only theirs", async () => {
    const user = await signIn();
    await createOmicronConnection(user.id, { username: "ada" });
    await createBlogPost(user.id, { title: "Mine" });
    await createBlogPost((await createUser()).id, { title: "Someone else's" });

    await renderServer(<AccountBlogPage {...props()} />);

    expect(screen.getByText(/Posts from @ada on Omicron/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mine" })).toBeInTheDocument();
    expect(screen.queryByText("Someone else's")).not.toBeInTheDocument();
  });

  test("shows the review list until it's confirmed", async () => {
    const user = await signIn();
    await createOmicronConnection(user.id, { reviewedAt: null });
    await createBlogPost(user.id, { removedByAuthorAt: new Date() });
    await renderServer(<AccountBlogPage {...props()} />);
    expect(screen.getByText(/Nothing is on the blog yet/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  test.each([
    ["taken", "That Omicron account is already connected to another member."],
    ["denied", "Omicron didn't connect because the request wasn't approved."],
    ["failed", "Something went wrong while connecting to Omicron. Please try again."],
  ])("explains the %s connection error", async (error, message) => {
    await signIn();
    await renderServer(<AccountBlogPage {...props({ error })} />);
    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  test("ignores an error code it doesn't know", async () => {
    await signIn();
    await renderServer(<AccountBlogPage {...props({ error: "<script>" })} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("tells a blog-banned member, without offering Disconnect", async () => {
    const user = await signIn({ blogBanned: true });
    await createOmicronConnection(user.id);
    await renderServer(<AccountBlogPage {...props()} />);
    expect(screen.getByRole("status")).toHaveTextContent("An admin banned you from the blog");
    expect(screen.queryByRole("button", { name: "Disconnect Omicron" })).not.toBeInTheDocument();
  });

  test("offers a reconnect when the connection was ended on Omicron", async () => {
    const user = await signIn({ blogBanned: true });
    await createOmicronConnection(user.id, { subscriptionId: null, webhookSecret: null });
    await renderServer(<AccountBlogPage {...props()} />);
    expect(screen.getByText("This connection was ended on Omicron.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Connect Omicron" })).toBeInTheDocument();
  });

  test("its shell needs nothing from the database, so it can show before the posts arrive", async () => {
    await renderServer(<AccountBlogSkeleton />);
    const skeleton = screen.getByTestId("account-blog-skeleton");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });

  test("is not indexed", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
