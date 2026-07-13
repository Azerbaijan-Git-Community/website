import { getBlogPosts } from "@/data/blog/get";
import { apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";

export const GET = withApi(async () => {
  const posts = await getBlogPosts();
  return apiSuccess(posts, { count: posts.length });
});

export const OPTIONS = () => handleOptions();
