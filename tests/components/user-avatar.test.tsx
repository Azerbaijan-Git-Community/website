import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { UserAvatar } from "@/components/user-avatar";
import { server } from "@test/msw";
import { renderWithRouter } from "@test/next-router";

describe("UserAvatar", () => {
  test("shows the user's initial until the avatar loads", async () => {
    renderWithRouter(<UserAvatar name="aysel" image={null} />);
    expect(await screen.findByText("A")).toBeInTheDocument();
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
