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

  // Mirror the DB row but drop the sync-bookkeeping `contentSha`.
  return apiSuccess({
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.description,
    tags: post.tags,
    coverImage: post.coverImage,
    userId: post.userId,
    contentMdx: post.contentMdx,
    readingTime: post.readingTime,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
  });
});

export const OPTIONS = () => handleOptions();
