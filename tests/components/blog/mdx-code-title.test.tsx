import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { MdxCodeTitle } from "@/components/blog/mdx-code-title";
import { mdxComponents } from "@/components/blog/mdx-components";
import { compileMdx } from "@/lib/compile-mdx";

/** Render a titled code fence through the real MDX pipeline, as the blog post page does. */
async function renderCodeBlock(title: string) {
  const Content = await compileMdx(`\`\`\`sh title="${title}"\necho hi\n\`\`\``, "post");
  return render(<Content components={mdxComponents} />);
}

describe("MdxCodeTitle", () => {
  test("renders ordinary figcaptions untouched", () => {
    const { container } = render(<MdxCodeTitle className="caption">A caption</MdxCodeTitle>);
    expect(container.innerHTML).toBe('<figcaption class="caption">A caption</figcaption>');
  });

  test("turns a code block title into a header with the filename and a copy button", async () => {
    await renderCodeBlock("hello.sh");
    expect(screen.getByText("hello.sh").closest("figcaption")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Copy code" })).toHaveLength(1);
  });

  test("shows no language icon for unknown extensions", async () => {
    const { container } = await renderCodeBlock("notes.xyz");
    // Only the copy button's icon.
    expect(container.querySelectorAll("figcaption svg")).toHaveLength(1);
  });

  test("copies the following code block's text", async () => {
    const user = userEvent.setup();
    const { container } = await renderCodeBlock("hello.sh");
    // jsdom has no layout engine, so innerText (what the component copies) must be provided.
    Object.defineProperty(container.querySelector("pre")!, "innerText", { value: "echo hi" });

    await user.click(screen.getByRole("button", { name: "Copy code" }));

    await expect(navigator.clipboard.readText()).resolves.toBe("echo hi");
  });

  test.for(["index.ts", "App.TSX", "schema.prisma", "Dockerfile", "run.sh"])(
    "BUG-14: shows a language icon for %s",
    async (title) => {
      const { container } = await renderCodeBlock(title);
      // One icon for the language, one inside the copy button.
      expect(container.querySelectorAll("figcaption svg")).toHaveLength(2);
    },
  );
});
