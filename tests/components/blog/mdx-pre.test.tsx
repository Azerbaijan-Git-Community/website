import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { MdxPre } from "@/components/blog/mdx-pre";

describe("MdxPre", () => {
  test("renders the code block and a copy button when the block has no title", async () => {
    render(
      <figure>
        <MdxPre data-language="ts">
          <code>const x = 1;</code>
        </MdxPre>
      </figure>,
    );

    expect(screen.getByText("const x = 1;").closest("pre")).toHaveAttribute("data-language", "ts");
    expect(await screen.findByRole("button", { name: "Copy code" })).toBeInTheDocument();
  });

  test("hides its own copy button when a title bar (which has one) precedes it", async () => {
    render(
      <figure>
        <figcaption data-rehype-pretty-code-title="">index.ts</figcaption>
        <MdxPre>
          <code>code</code>
        </MdxPre>
      </figure>,
    );

    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(screen.queryByRole("button", { name: "Copy code" })).not.toBeInTheDocument();
  });

  test("copies the code and confirms with a check icon", async () => {
    const user = userEvent.setup();
    render(
      <figure>
        <MdxPre>
          <code>npm i</code>
        </MdxPre>
      </figure>,
    );
    const pre = screen.getByText("npm i").closest("pre")!;
    // jsdom has no layout engine, so innerText (what the component copies) must be provided.
    Object.defineProperty(pre, "innerText", { value: "npm i" });

    await user.click(await screen.findByRole("button", { name: "Copy code" }));

    await expect(navigator.clipboard.readText()).resolves.toBe("npm i");
  });
});
