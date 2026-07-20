import { getBlogPost } from "@/data/blog/get";
import { apiError, apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = withApi<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const post = await getBlogPost(slug);

  if (!post) {
    return apiError(404, "not_found", `No blog post with slug "${slug}".`);
  }

  return apiSuccess(post);
});

export { handleOptions as OPTIONS };
