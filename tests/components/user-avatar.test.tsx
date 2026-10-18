import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { UserAvatar } from "@/components/user-avatar";
import { server } from "@test/msw";
import { renderWithRouter } from "@test/next-router";

describe("UserAvatar", () => {
  test("shows the user's initial without an avatar", async () => {
    renderWithRouter(<UserAvatar name="aysel" image={null} />);
    expect(await screen.findByText("A")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("renders the sized avatar image on first render", () => {
    renderWithRouter(<UserAvatar name="Aysel" image="https://avatars.githubusercontent.com/u/1?v=4" />);
    expect(screen.getByRole("img", { name: "Aysel avatar" })).toHaveAttribute(
      "src",
      "https://avatars.githubusercontent.com/u/1?v=4&s=112",
    );
  });

  test("falls back to 'U' without a name", async () => {
    renderWithRouter(<UserAvatar name={null} image={null} />);
    expect(await screen.findByText("U")).toBeInTheDocument();
  });

  test("signs out from the menu and refreshes the page", async () => {
    const user = userEvent.setup();
    let signedOut = false;
    server.use(
      http.post("http://localhost:3000/api/auth/sign-out", () => {
        signedOut = true;
        return HttpResponse.json({ success: true });
      }),
    );
    const { router } = renderWithRouter(<UserAvatar name="Aysel" image="https://avatars.githubusercontent.com/u/1" />);

    await user.click(screen.getByRole("button", { name: "User menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
    expect(signedOut).toBe(true);
  });
});
