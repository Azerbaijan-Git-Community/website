import { getShowcaseProjects } from "@/data/showcase/get";
import { apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";

export const GET = withApi(async () => {
  const projects = await getShowcaseProjects();

  // Mirror the DB rows but drop the sync-bookkeeping `fileSha`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = projects.map(({ fileSha, ...p }) => p);

  return apiSuccess(data, { count: data.length });
});

export const OPTIONS = () => handleOptions();
