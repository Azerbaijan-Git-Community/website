import { Toast } from "@heroui/react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { SyncPanel } from "@/components/admin/sync-panel";
import { server } from "@test/msw";

function renderPanel() {
  return render(
    <>
      <Toast.Provider />
      <SyncPanel />
    </>,
  );
}

function row(title: string) {
  return screen.getByText(title, { selector: "span" }).closest("li")!;
}

function syncEndpoint(respond: (target: string) => Response | Promise<Response>) {
  const targets: string[] = [];
  server.use(
    http.post<never, { target: string }>("http://localhost:3000/api/admin/sync", async ({ request }) => {
      const { target } = await request.json();
      targets.push(target);
      return respond(target);
    }),
  );
  return targets;
}

describe("SyncPanel", () => {
  test("lists the four sync jobs with their endpoints", () => {
    renderPanel();

    expect(screen.getByText("4 jobs")).toBeInTheDocument();
    for (const [title, endpoint] of [
      ["GitHub Stats", "/api/webhooks/leaderboard"],
      ["Blog", "/api/webhooks/blog"],
      ["Showcase", "/api/webhooks/showcase"],
      ["Showcase Data", "/api/admin/sync"],
    ]) {
      expect(within(row(title)).getByText(endpoint, { exact: false })).toBeInTheDocument();
    }
  });

  test("runs a job, disables every button while it runs, then shows the result", async () => {
    const user = userEvent.setup();
    const targets = syncEndpoint(async () => {
      await delay(50);
      return HttpResponse.json({ message: "Synced 3, skipped 1, failed 0" });
    });
    renderPanel();

    await user.click(within(row("Blog")).getByRole("button", { name: "Run" }));

    expect(within(row("Blog")).getByRole("button", { name: "Running…" })).toBeDisabled();
    expect(within(row("Showcase")).getByRole("button", { name: "Run" })).toBeDisabled();

    expect(await within(row("Blog")).findByText("Synced 3, skipped 1, failed 0")).toBeInTheDocument();
    expect(targets).toEqual(["blog"]);
    expect(await screen.findByText("blog sync complete")).toBeInTheDocument();
    for (const button of screen.getAllByRole("button", { name: "Run" })) expect(button).toBeEnabled();
  });

  test("falls back to 'Done.' when the job returns no message", async () => {
    const user = userEvent.setup();
    syncEndpoint(() => HttpResponse.json({}));
    renderPanel();

    await user.click(within(row("Showcase Data")).getByRole("button", { name: "Run" }));

    expect(await within(row("Showcase Data")).findByText("Done.")).toBeInTheDocument();
  });

  test("shows the server's error message when a job fails", async () => {
    const user = userEvent.setup();
    syncEndpoint(() => HttpResponse.json({ error: "Forbidden" }, { status: 403 }));
    renderPanel();

    await user.click(within(row("GitHub Stats")).getByRole("button", { name: "Run" }));

    expect(await within(row("GitHub Stats")).findByText("Forbidden")).toBeInTheDocument();
    expect(await screen.findByText("github sync failed")).toBeInTheDocument();
  });

  test("describes failures that carry no error message", async () => {
    const user = userEvent.setup();
    syncEndpoint(() => new HttpResponse("<html>502</html>", { status: 502 }));
    renderPanel();

    await user.click(within(row("Blog")).getByRole("button", { name: "Run" }));

    expect(await within(row("Blog")).findByText("Request failed (502)")).toBeInTheDocument();
  });

  test("reports network errors", async () => {
    const user = userEvent.setup();
    syncEndpoint(() => HttpResponse.error());
    renderPanel();

    await user.click(within(row("Blog")).getByRole("button", { name: "Run" }));

    expect(await within(row("Blog")).findByText("Failed to fetch")).toBeInTheDocument();
    expect(within(row("Blog")).getByRole("button", { name: "Run" })).toBeEnabled();
  });

  // The `!res.ok` branch returns before `setRunning(null)`, so one failed job locks the whole panel.
  test.fails("BUG-10: re-enables the buttons after a job fails", async () => {
    const user = userEvent.setup();
    syncEndpoint(() => HttpResponse.json({ error: "Forbidden" }, { status: 403 }));
    renderPanel();

    await user.click(within(row("Blog")).getByRole("button", { name: "Run" }));
    await within(row("Blog")).findByText("Forbidden");

    for (const button of screen.getAllByRole("button", { name: "Run" })) expect(button).toBeEnabled();
  });
});
