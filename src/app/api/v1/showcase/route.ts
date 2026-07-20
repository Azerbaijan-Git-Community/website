import { getShowcaseProjects } from "@/data/showcase/get";
import { apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";

export const GET = withApi(async () => {
  const projects = await getShowcaseProjects();
  return apiSuccess(projects, { count: projects.length });
});

export { handleOptions as OPTIONS };
