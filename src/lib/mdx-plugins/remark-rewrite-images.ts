import { visit } from "unist-util-visit";

const BASE_URL = "https://raw.githubusercontent.com/Azerbaijan-Git-Community/blog/main/posts";

/**
 * Remark plugin that rewrites relative image paths (e.g. `./images/cover.png`)
 * to absolute raw.githubusercontent.com URLs so Next.js image optimization can
 * proxy and cache them.
 */
export function remarkRewriteImages({ slug }: { slug: string }) {
  return function transformer(tree: Parameters<typeof visit>[0]) {
    visit(tree, "image", (node: { url?: string }) => {
      if (node.url && node.url.startsWith("./")) {
        node.url = `${BASE_URL}/${slug}/${node.url.slice(2)}`;
      }
    });
  };
}
