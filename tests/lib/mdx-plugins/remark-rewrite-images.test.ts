import { describe, expect, test } from "vitest";
import { remarkRewriteImages } from "@/lib/mdx-plugins/remark-rewrite-images";

const BASE = "https://raw.githubusercontent.com/Azerbaijan-Git-Community/blog/main/posts";

function treeWithImages(...urls: string[]) {
  return {
    type: "root",
    children: [{ type: "paragraph", children: urls.map((url) => ({ type: "image", url, alt: "" })) }],
  };
}

function imageUrls(tree: ReturnType<typeof treeWithImages>) {
  return tree.children[0].children.map((node) => node.url);
}

describe("remarkRewriteImages", () => {
  test("rewrites ./relative image paths to the post's raw GitHub folder", () => {
    const tree = treeWithImages("./images/diagram.png", "./cover.jpg");
    remarkRewriteImages({ slug: "my-post" })(tree);
    expect(imageUrls(tree)).toEqual([`${BASE}/my-post/images/diagram.png`, `${BASE}/my-post/cover.jpg`]);
  });

  test("leaves absolute and root-relative URLs untouched", () => {
    const urls = ["https://example.com/a.png", "/public/b.png", "data:image/png;base64,AAAA"];
    const tree = treeWithImages(...urls);
    remarkRewriteImages({ slug: "my-post" })(tree);
    expect(imageUrls(tree)).toEqual(urls);
  });

  test("ignores non-image nodes that happen to have a relative url", () => {
    const tree = {
      type: "root",
      children: [{ type: "link", url: "./other-post", children: [] }],
    };
    remarkRewriteImages({ slug: "my-post" })(tree);
    expect(tree.children[0].url).toBe("./other-post");
  });
});
