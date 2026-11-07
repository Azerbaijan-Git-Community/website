import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, test } from "vitest";
import { UserAvatar } from "@/components/user-avatar";
import { server } from "@test/msw";
import { renderWithRouter } from "@test/next-router";

const CONNECTION = "http://localhost:3000/api/omicron/connection";

function fakeConnection(respond: () => Response | Promise<Response>) {
  let requests = 0;
  server.use(
    http.get(CONNECTION, () => {
      requests += 1;
      return respond();
    }),
  );
  return { requests: () => requests };
}

beforeEach(() => {
  fakeConnection(() => HttpResponse.json({ connected: false }));
});

describe("UserAvatar", () => {
  test("asks for nothing until the user reaches for the menu", async () => {
    const connection = fakeConnection(() => HttpResponse.json({ connected: false }));
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);
    await screen.findByText("A");
    expect(connection.requests()).toBe(0);
  });

  test("asks once, however many ways the user reaches for it", async () => {
    const user = userEvent.setup();
    const connection = fakeConnection(() => HttpResponse.json({ connected: false }));
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);
    const trigger = screen.getByRole("button", { name: "User menu" });

    await user.hover(trigger);
    await user.click(trigger);
    await user.click(trigger);
    await user.click(trigger);

    await screen.findByRole("menuitem", { name: "Connect Omicron" });
    expect(connection.requests()).toBe(1);
  });

  test("the menu opens straight away, with sign-out ready, while the answer is on its way", async () => {
    const user = userEvent.setup();
    fakeConnection(async () => {
      await delay(100);
      return HttpResponse.json({ connected: true });
    });
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);

    await user.click(screen.getByRole("button", { name: "User menu" }));

    expect(screen.getByTestId("menu-item-skeleton")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveFocus();
    expect(await screen.findByRole("menuitem", { name: "My blog posts" })).toHaveFocus();
    expect(screen.queryByTestId("menu-item-skeleton")).not.toBeInTheDocument();
  });

  test.each([
    ["a server error", () => HttpResponse.json({ error: "Failed" }, { status: 500 })],
    ["a network failure", () => HttpResponse.error()],
  ])("after %s, falls back to the page that works either way", async (_label, respond) => {
    const user = userEvent.setup();
    fakeConnection(respond);
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);
    await user.click(screen.getByRole("button", { name: "User menu" }));
    expect(await screen.findByRole("menuitem", { name: "My blog posts" })).toHaveAttribute("href", "/account/blog");
  });

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

  test("offers to connect Omicron, as a plain link that's never prefetched", async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);
    await user.click(screen.getByRole("button", { name: "User menu" }));
    expect(await screen.findByRole("menuitem", { name: "Connect Omicron" })).toHaveAttribute(
      "href",
      "/api/omicron/connect",
    );
    expect(screen.queryByRole("menuitem", { name: "My blog posts" })).not.toBeInTheDocument();
  });

  test("links a connected member to their posts instead", async () => {
    const user = userEvent.setup();
    fakeConnection(() => HttpResponse.json({ connected: true }));
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);
    await user.click(screen.getByRole("button", { name: "User menu" }));
    expect(await screen.findByRole("menuitem", { name: "My blog posts" })).toHaveAttribute("href", "/account/blog");
    expect(screen.queryByRole("menuitem", { name: "Connect Omicron" })).not.toBeInTheDocument();
  });

  test("opens the menu with the first item focused", async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);
    const trigger = screen.getByRole("button", { name: "User menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByRole("menuitem", { name: "Connect Omicron" })).toHaveFocus();
  });

  test("closes on Escape and returns focus to the avatar", async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);
    const trigger = screen.getByRole("button", { name: "User menu" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  test("closes when clicking outside", async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserAvatar name="Aysel" image={null} />);

    await user.click(screen.getByRole("button", { name: "User menu" }));
    await user.click(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
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
