import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { prepareImportedHtml, renderPostHtml } from "@/lib/render-post-html";

const render = async (html: string) => renderToStaticMarkup(await renderPostHtml(html));
const prepare = (html: string) => prepareImportedHtml(html, "https://omicron.example");

describe("renderPostHtml keeps the blog's look", () => {
  test("renders paragraphs and inline formatting", async () => {
    expect(await render("<p>Some <strong>bold</strong> text.</p>")).toBe("<p>Some <strong>bold</strong> text.</p>");
  });

  test("adds slug ids to headings and wraps them in self-links", async () => {
    expect(await render("<h2>Getting Started</h2>")).toBe(
      '<h2 id="getting-started"><a href="#getting-started">Getting Started</a></h2>',
    );
  });

  test("regenerates heading ids instead of keeping Omicron's prefixed ones", async () => {
    const html = await render('<h2 id="omicron-content-intro">Intro</h2>');
    expect(html).toContain('id="intro"');
    expect(html).not.toContain("omicron-content");
  });

  test("syntax-highlights a declared language without a background", async () => {
    const html = await render('<pre><code class="language-ts">const x = 1;</code></pre>');
    expect(html).toContain("data-rehype-pretty-code-figure");
    expect(html).toContain('data-language="ts"');
    expect(html).toMatch(/style="color:/);
    expect(html).not.toMatch(/background-color/);
  });

  test("a block with no language still gets the styled code surface", async () => {
    const html = await render("<pre><code>plain text</code></pre>");
    expect(html).toContain("data-rehype-pretty-code-figure");
    expect(html).toContain('data-language="plaintext"');
  });

  test("inline code stays plain", async () => {
    expect(await render("<p>Run <code>ls</code> now</p>")).toBe("<p>Run <code>ls</code> now</p>");
  });

  test("turns Omicron's data-title into the code block's title bar", async () => {
    const html = await render('<pre data-title="index.ts"><code class="language-ts">const x = 1;</code></pre>');
    expect(html).toContain('data-rehype-pretty-code-title=""');
    expect(html).toContain("index.ts");
    expect(html).not.toContain("data-title");
  });

  test("a title with quotes can't break out of the code block's meta", async () => {
    const html = await render('<pre data-title="a&quot; onclick=&quot;x"><code>y</code></pre>');
    expect(html).not.toMatch(/<[^>]*\sonclick=/);
  });

  test("an unknown language doesn't take the page down", async () => {
    const html = await render('<pre><code class="language-not-a-real-language">x</code></pre>');
    expect(html).toContain("x");
  });

  test("uses the blog's image and link components", async () => {
    const html = await render('<p><img src="https://omicron.example/a.png" alt="A"></p><a href="https://x.dev">x</a>');
    expect(html).toContain("<figure");
    expect(html).not.toMatch(/<p>\s*<figure/);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  test("keeps tables, disclosure and math", async () => {
    const html = await render(
      '<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table><details><summary>More</summary><p>Hidden</p></details><math display="block"><mi>x</mi></math>',
    );
    expect(html).toContain("<td>1</td>");
    expect(html).toContain("<summary>More</summary>");
    expect(html).toContain("<mi>x</mi>");
  });
});

describe.each([
  ["at import", async (html: string) => (await prepare(html)).html],
  ["at render", render],
])("sanitizing %s", (_label, run) => {
  test.each([
    ["a script", "<p>a</p><script>alert(1)</script>", /<script|alert\(1\)/],
    ["an event handler", '<img src="https://x.dev/a.png" onerror="alert(1)">', /onerror/],
    ["a javascript: link", '<a href="javascript:alert(1)">x</a>', /javascript:/],
    ["an iframe", '<iframe src="https://evil.example"></iframe>', /iframe/],
    ["inline style", '<p style="position:fixed">x</p>', /position:fixed/],
    ["a form", '<form action="https://evil.example"><input name="password"></form>', /<form|password/],
    ["an SVG payload", "<svg onload=alert(1)><script>alert(1)</script></svg>", /onload|<script/],
    ["JSX-looking text", "<p>{process.exit(1)}</p>", /<script/],
  ])("strips %s", async (_name, input, forbidden) => {
    expect(await run(input)).not.toMatch(forbidden);
  });
});

describe("prepareImportedHtml", () => {
  test("makes Omicron's root-relative images and links absolute", async () => {
    const { html } = await prepare('<img src="/api/uploads/a.png"><a href="/@ada">Ada</a>');
    expect(html).toContain('src="https://omicron.example/api/uploads/a.png"');
    expect(html).toContain('href="https://omicron.example/@ada"');
  });

  test("leaves absolute and protocol-relative URLs on their own host", async () => {
    const { html } = await prepare('<img src="https://cdn.example/a.png"><img src="//evil.example/b.png">');
    expect(html).toContain("https://cdn.example/a.png");
    expect(html).not.toContain("omicron.example");
  });

  test("returns the text, spaced between blocks, for the description and reading time", async () => {
    const { text } = await prepare("<h1>Title</h1><p>First  line</p><p>Second</p>");
    expect(text).toBe("Title First line Second");
  });

  test("takes the preview from the first paragraph, not a heading or code", async () => {
    const { excerpt } = await prepare(
      "<h2>Title</h2><pre><code>const x = 1;</code></pre><p></p><p>The first words.</p>",
    );
    expect(excerpt).toBe("The first words.");
  });

  test("falls back to all the text when there are no paragraphs", async () => {
    expect((await prepare("<ul><li>Only a list</li></ul>")).excerpt).toBe("Only a list");
  });
});
