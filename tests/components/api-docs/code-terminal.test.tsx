import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { CodeTerminal } from "@/components/api-docs/code-terminal";

const snippets = [
  { id: "curl", label: "cURL", lang: "bash", code: "curl -s https://example.com" },
  { id: "python", label: "Python", lang: "python", code: "requests.get('https://example.com')" },
];

// Prism splits code into token spans, so assert on the whole block's text.
const shownCode = () => document.querySelector("pre code")?.textContent;

afterEach(() => {
  vi.useRealTimers();
});

describe("CodeTerminal", () => {
  test("shows the first snippet by default", () => {
    render(<CodeTerminal snippets={snippets} />);
    expect(shownCode()).toBe("curl -s https://example.com");
  });

  test("switches snippets with the language tabs", async () => {
    const user = userEvent.setup();
    render(<CodeTerminal snippets={snippets} />);

    await user.click(screen.getByRole("button", { name: "Python" }));

    expect(shownCode()).toBe("requests.get('https://example.com')");
    expect(screen.getByRole("button", { name: "Python" })).toHaveClass("bg-surface");
    expect(screen.getByRole("button", { name: "cURL" })).not.toHaveClass("bg-surface");
  });

  test("copies the active snippet and briefly confirms", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CodeTerminal snippets={snippets} />);

    await user.click(screen.getByRole("button", { name: "Python" }));
    await user.click(screen.getByRole("button", { name: "Copy" }));

    await expect(navigator.clipboard.readText()).resolves.toBe("requests.get('https://example.com')");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();

    await act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  test("stays quiet when the clipboard is unavailable", async () => {
    const user = userEvent.setup();
    render(<CodeTerminal snippets={snippets} />);
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  test("hides the tab bar for single-snippet blocks and renders a header action", () => {
    render(
      <CodeTerminal singleTab snippets={snippets.slice(0, 1)} headerAction={<button type="button">Try it</button>} />,
    );
    expect(screen.queryByRole("button", { name: "cURL" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try it" })).toBeInTheDocument();
  });
});
