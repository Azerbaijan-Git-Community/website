import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { compileMdx } from "@/lib/compile-mdx";

async function render(source: string, slug = "my-post") {
  const Content = await compileMdx(source, slug);
  return renderToStaticMarkup(createElement(Content));
}

describe("compileMdx", () => {
  test("renders markdown to HTML", async () => {
    const html = await render("Some **bold** text.");
    expect(html).toBe("<p>Some <strong>bold</strong> text.</p>");
  });

  test("adds slug ids to headings and wraps them in self-links", async () => {
    const html = await render("## Getting Started");
    expect(html).toBe('<h2 id="getting-started"><a href="#getting-started">Getting Started</a></h2>');
  });

  test("supports GitHub-flavored markdown tables and task lists", async () => {
    const html = await render("| a | b |\n| - | - |\n| 1 | 2 |\n\n- [x] done");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>2</td>");
    expect(html).toContain('type="checkbox"');
  });

  test("rewrites relative images to the post's raw GitHub folder", async () => {
    const html = await render("![diagram](./images/diagram.png)", "intro-post");
    expect(html).toContain(
      'src="https://raw.githubusercontent.com/Azerbaijan-Git-Community/blog/main/posts/intro-post/images/diagram.png"',
    );
  });

  test("syntax-highlights fenced code with a title", async () => {
    const html = await render('```ts title="index.ts"\nconst x = 1;\n```');
    expect(html).toContain("data-rehype-pretty-code-figure");
    expect(html).toContain('data-rehype-pretty-code-title=""');
    expect(html).toContain("index.ts");
    expect(html).toContain('data-language="ts"');
    // keepBackground: false strips the theme background so the site's own styles apply.
    expect(html).not.toMatch(/background-color/);
  });

  test("passes custom components through", async () => {
    const Content = await compileMdx("[link](https://example.com)", "x");
    const html = renderToStaticMarkup(
      createElement(Content, { components: { a: (props: object) => createElement("span", props, "custom") } }),
    );
    expect(html).toBe('<p><span href="https://example.com">custom</span></p>');
  });

  test("rejects invalid MDX", async () => {
    await expect(compileMdx("<div>unclosed", "x")).rejects.toThrow("Expected a closing tag for `<div>`");
  });
});
