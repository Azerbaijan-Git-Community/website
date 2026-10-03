import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { EndpointCard } from "@/components/api-docs/endpoint-card";
import { ENDPOINTS } from "@/components/api-docs/endpoints";
import { server } from "@test/msw";

const BASE = "https://githubcommunity.az";
const monthEndpoint = ENDPOINTS.find((e) => e.id === "leaderboard-month")!;
const statsEndpoint = ENDPOINTS.find((e) => e.id === "stats")!;

// Prism splits code into token spans, so assert on whole blocks' text.
const snippetText = () => document.querySelector("pre code")?.textContent;
const responseCode = () => document.querySelector("pre.max-h-96 code");

describe("EndpointCard", () => {
  test("documents the endpoint with an anchor for the sidebar", () => {
    const { container } = render(<EndpointCard endpoint={statsEndpoint} baseUrl={BASE} />);

    expect(container.querySelector("section")).toHaveAttribute("id", "stats");
    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/stats")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Community stats" })).toBeInTheDocument();
    expect(snippetText()).toBe('curl -s "https://githubcommunity.az/api/v1/stats"');
  });

  test("prefills path parameters with examples and updates the snippet as they change", async () => {
    const user = userEvent.setup();
    render(<EndpointCard endpoint={monthEndpoint} baseUrl={BASE} />);

    const year = screen.getByLabelText(/^year/);
    const month = screen.getByLabelText(/^month/);
    expect(year).toHaveValue("2026");
    expect(month).toHaveValue("07");
    expect(snippetText()).toBe('curl -s "https://githubcommunity.az/api/v1/leaderboard/2026/07"');

    await user.clear(month);
    await user.type(month, "12");

    expect(snippetText()).toBe('curl -s "https://githubcommunity.az/api/v1/leaderboard/2026/12"');
  });

  test("runs the request and shows the pretty-printed, highlighted response", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("http://localhost:3000/api/v1/leaderboard/2026/07", () =>
        HttpResponse.json({ data: [], meta: { count: 0 } }),
      ),
    );
    render(<EndpointCard endpoint={monthEndpoint} baseUrl={BASE} />);

    await user.click(screen.getByRole("button", { name: "Try it" }));

    expect(await screen.findByText("200")).toHaveClass("text-lime");
    expect(screen.getByText(/^\d+ ms$/)).toBeInTheDocument();
    expect(responseCode()?.textContent).toBe(JSON.stringify({ data: [], meta: { count: 0 } }, null, 2));
    expect(responseCode()?.querySelector(".text-blue")).toHaveTextContent('"data":');
  });

  test("shows error statuses in red", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("http://localhost:3000/api/v1/stats", () =>
        HttpResponse.json({ error: { code: "rate_limited", message: "Slow down" } }, { status: 429 }),
      ),
    );
    render(<EndpointCard endpoint={statsEndpoint} baseUrl={BASE} />);

    await user.click(screen.getByRole("button", { name: "Try it" }));

    expect(await screen.findByText("429")).toHaveClass("text-[#f85149]");
  });

  test("shows non-JSON bodies verbatim", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("http://localhost:3000/api/v1/stats", () => HttpResponse.text("upstream timeout", { status: 504 })),
    );
    render(<EndpointCard endpoint={statsEndpoint} baseUrl={BASE} />);

    await user.click(screen.getByRole("button", { name: "Try it" }));

    expect(await screen.findByText("upstream timeout")).toBeInTheDocument();
  });

  test("reports network failures as ERR", async () => {
    const user = userEvent.setup();
    server.use(http.get("http://localhost:3000/api/v1/stats", () => HttpResponse.error()));
    render(<EndpointCard endpoint={statsEndpoint} baseUrl={BASE} />);

    await user.click(screen.getByRole("button", { name: "Try it" }));

    expect(await screen.findByText("ERR")).toBeInTheDocument();
    expect(responseCode()).toHaveTextContent("Failed to fetch");
  });
});
