import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import AuthErrorPage, { metadata } from "@/app/auth/error/page";
import { renderServer } from "@test/render-server";

function renderWith(params: { error?: string | string[]; error_description?: string | string[] }) {
  return renderServer(<AuthErrorPage searchParams={Promise.resolve(params)} />);
}

describe("AuthErrorPage", () => {
  test.for([
    ["access_denied", "Sign-in was cancelled", "authorization was declined"],
    ["unable_to_create_user", "We couldn't set up your account", "could not create your account"],
    ["account_not_linked", "This account isn't linked", "email already linked to another account"],
    ["state_mismatch", "Your sign-in session expired", "session state did not match"],
    ["invalid_state", "Your sign-in session expired", "session state was invalid"],
    ["please_restart_the_process", "Let's restart your sign-in", "the flow needs to restart"],
  ])("explains %s", async ([error, title, reason]) => {
    await renderWith({ error });
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(title);
    expect(screen.getByText(reason, { exact: false })).toBeInTheDocument();
  });

  test("matches error codes case-insensitively", async () => {
    await renderWith({ error: "ACCESS_DENIED" });
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sign-in was cancelled");
  });

  test("uses the first value when a param repeats", async () => {
    await renderWith({
      error: ["state_mismatch", "access_denied"],
      error_description: ["first hint", "second hint"],
    });
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Your sign-in session expired");
    expect(screen.getByText("first hint", { exact: false })).toBeInTheDocument();
  });

  test.for([{}, { error: "something_new" }])("falls back to a generic explanation for %o", async (params) => {
    await renderWith(params);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Something went wrong signing you in");
  });

  test("shows the provider's description as a hint, escaped", async () => {
    const { container } = await renderWith({
      error: "access_denied",
      error_description: "<img src=x onerror=alert(1)>",
    });
    expect(screen.getByText("hint:").parentElement).toHaveTextContent("hint: <img src=x onerror=alert(1)>");
    expect(container.querySelector("img")).toBeNull();
  });

  test("omits the hint without a description", async () => {
    await renderWith({ error: "access_denied" });
    expect(screen.queryByText("hint:")).not.toBeInTheDocument();
  });

  test("offers a way home and a way to report the problem", async () => {
    await renderWith({});
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Open an Issue on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/Azerbaijan-Git-Community/website/issues/new",
    );
  });

  test("is not indexed", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
