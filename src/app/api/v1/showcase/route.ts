import { getShowcaseProjects } from "@/data/showcase/get";
import { apiSuccess, handleOptions } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";

export const GET = withApi(async () => {
  const projects = await getShowcaseProjects();

  // Mirror the DB rows but drop the sync-bookkeeping `fileSha`.
  const data = projects.map((p) => ({
    id: p.id,
    repo: p.repo,
    submittedBy: p.submittedBy,
    banner: p.banner,
    links: p.links,
    website: p.website,
    createdAt: p.createdAt,
    stars: p.stars,
    forks: p.forks,
    openIssues: p.openIssues,
    openPRs: p.openPRs,
    description: p.description,
    homepageUrl: p.homepageUrl,
    license: p.license,
    language: p.language,
    languageColor: p.languageColor,
    updatedAt: p.updatedAt,
  }));

  return apiSuccess(data, { count: data.length });
});

export const OPTIONS = () => handleOptions();
