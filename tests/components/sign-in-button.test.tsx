import { Toast } from "@heroui/react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { SignInButton } from "@/components/sign-in-button";
import { server } from "@test/msw";
import { renderWithRouter } from "@test/next-router";

function renderButton(search = "") {
  return renderWithRouter(
    <>
      <Toast.Provider />
      <SignInButton />
    </>,
    { search },
  );
}

describe("SignInButton", () => {
  // Keep first: HeroUI's toast queue is module-global and closed toasts never finish exiting in jsdom.
  test("shows no toast without an error", async () => {
    renderButton();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText(/banned|error occurred/i)).not.toBeInTheDocument();
  });

  test("starts GitHub sign-in and returns to the current page afterwards", async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post("http://localhost:3000/api/auth/sign-in/social", async ({ request }) => {
        body = await request.json();
        // `redirect: false` keeps jsdom from attempting a real navigation.
        return HttpResponse.json({ url: "https://github.com/login/oauth/authorize?client_id=x", redirect: false });
      }),
    );
    window.history.replaceState(null, "", "/leaderboard");
    renderButton();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await expect.poll(() => body).toEqual({ provider: "github", callbackURL: "/leaderboard" });
  });

  test("explains a ban when redirected back with error=banned", async () => {
    renderButton("?error=banned");
    expect(await screen.findByText("You have been banned")).toBeInTheDocument();
    expect(screen.getByText("We banned your account because we detected bot activity on GitHub")).toBeInTheDocument();
  });

  test("shows the provider's error description for other errors", async () => {
    renderButton("?error=access_denied&error_description=The+user+denied+access");
    expect(await screen.findByText("The user denied access")).toBeInTheDocument();
  });

  test("falls back to a generic message without a description", async () => {
    renderButton("?error=unknown");
    expect(await screen.findByText("An error occurred during sign-in. Please try again.")).toBeInTheDocument();
  });
});
