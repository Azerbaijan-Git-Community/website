import { describe, expect, test } from "vitest";
import {
  fetchOmicronAuthorPosts,
  fetchOmicronPost,
  isValidOmicronSignature,
  OmicronRequestError,
  omicronAuthorizeUrl,
} from "@/lib/omicron";
import { fakeOmicronListing, fakeOmicronPosts, OMICRON, omicronPost, signOmicronBody } from "@test/omicron";

describe("isValidOmicronSignature", () => {
  const now = Date.parse("2026-03-01T12:00:00Z");
  const body = '{"event":"post.updated"}';

  test("accepts what Omicron signs", () => {
    expect(isValidOmicronSignature("secret", signOmicronBody("secret", body, now), body, now)).toBe(true);
  });

  test("rejects the wrong secret", () => {
    expect(isValidOmicronSignature("secret", signOmicronBody("other", body, now), body, now)).toBe(false);
  });

  test("rejects a changed body", () => {
    expect(isValidOmicronSignature("secret", signOmicronBody("secret", body, now), `${body} `, now)).toBe(false);
  });

  test("rejects a replay from outside the five-minute window, in either direction", () => {
    const signedAt = (offset: number) => signOmicronBody("secret", body, now + offset);
    expect(isValidOmicronSignature("secret", signedAt(-299_000), body, now)).toBe(true);
    expect(isValidOmicronSignature("secret", signedAt(-301_000), body, now)).toBe(false);
    expect(isValidOmicronSignature("secret", signedAt(301_000), body, now)).toBe(false);
  });

  test.each([[null], ["garbage"], ["t=1,v1=abc"], [`t=abc,v1=${"0".repeat(64)}`]])(
    "rejects a malformed header: %s",
    (header) => {
      expect(isValidOmicronSignature("secret", header, body, now)).toBe(false);
    },
  );
});

test("the authorize URL asks for exactly the two permissions this site needs, with PKCE", () => {
  const url = new URL(omicronAuthorizeUrl("the-state", "the-challenge"));
  expect(url.origin + url.pathname).toBe(`${OMICRON}/oauth/authorize`);
  expect(Object.fromEntries(url.searchParams)).toEqual({
    client_id: "test-omicron-client",
    redirect_uri: "http://localhost:3000/api/omicron/callback",
    response_type: "code",
    scope: "read:accounts webhooks:posts",
    state: "the-state",
    code_challenge: "the-challenge",
    code_challenge_method: "S256",
  });
});

describe("reading posts", () => {
  test("parses a post and gives null for a 404", async () => {
    fakeOmicronPosts({ "post-1": omicronPost() });
    await expect(fetchOmicronPost(OMICRON, "post-1")).resolves.toMatchObject({ id: "post-1", title: "Hello" });
    await expect(fetchOmicronPost(OMICRON, "gone")).resolves.toBeNull();
  });

  test("anything else is an error, not a missing post", async () => {
    fakeOmicronPosts({ broken: 503 });
    await expect(fetchOmicronPost(OMICRON, "broken")).rejects.toBeInstanceOf(OmicronRequestError);
  });

  test("a response without the expected fields fails loudly", async () => {
    fakeOmicronPosts({ odd: { id: "odd" } });
    await expect(fetchOmicronPost(OMICRON, "odd")).rejects.toThrow("expected");
  });

  test("passes the cursor through when paging an author", async () => {
    const { requested } = fakeOmicronListing("ada", [[omicronPost()], [omicronPost({ id: "post-2" })]]);
    const first = await fetchOmicronAuthorPosts(OMICRON, "ada", null);
    expect(first?.nextCursor).toBe("1");
    const second = await fetchOmicronAuthorPosts(OMICRON, "ada", "1");
    expect(second?.items[0].id).toBe("post-2");
    expect(requested).toEqual([null, "1"]);
  });
});
