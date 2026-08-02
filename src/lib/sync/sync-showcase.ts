import { JSON_SCHEMA as yamlJSON_SCHEMA, load as yamlLoad } from "js-yaml";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { GITHUB_ORG } from "@/lib/constants";
import { type GhContentEntry, ghGraphQL, ghText, ghJson } from "@/lib/github";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 50;
const SHOWCASE_REPO = "showcase";

const showcaseYamlSchema = z.object({
  repo: z.string(),
  submittedBy: z.string(),
  banner: z.string().optional(),
  links: z.array(z.string()).optional(),
  website: z.string().optional(),
});

type ShowcaseYaml = z.infer<typeof showcaseYamlSchema>;

type ShowcaseFile = {
  yaml: ShowcaseYaml;
  sha: string;
};

type RepoGqlData = {
  stargazerCount: number;
  forkCount: number;
  issues: { totalCount: number };
  pullRequests: { totalCount: number };
  description: string | null;
  homepageUrl: string | null;
  licenseInfo: { spdxId: string } | null;
  primaryLanguage: { name: string; color: string } | null;
};

async function fetchRegistry(): Promise<ShowcaseFile[]> {
  const files = await ghJson<GhContentEntry[]>(`/repos/${GITHUB_ORG}/${SHOWCASE_REPO}/contents/projects`);
  const yamlFiles = files.filter((f) => f.name.endsWith(".yaml"));

  const results = await Promise.all(
    yamlFiles.map(async (file) => {
      const content = await ghText(file.download_url);
      const parsed = showcaseYamlSchema.safeParse(yamlLoad(content, { schema: yamlJSON_SCHEMA }));
      return parsed.success && parsed.data.repo ? { yaml: parsed.data, sha: file.sha } : null;
    }),
  );

  return results.filter((r): r is ShowcaseFile => r !== null);
}

function buildBatchQuery(repos: Array<{ owner: string; name: string }>): string {
  const aliases = repos
    .map(
      ({ owner, name }, i) => `
    r${i}: repository(owner: "${owner}", name: "${name}") {
      stargazerCount
      forkCount
      issues(states: OPEN) { totalCount }
      pullRequests(states: OPEN) { totalCount }
      description
      homepageUrl
      licenseInfo { spdxId }
      primaryLanguage { name color }
    }`,
    )
    .join("\n");
  return `query { ${aliases} }`;
}

async function fetchRepoBatch(repos: Array<{ owner: string; name: string }>): Promise<Record<string, RepoGqlData>> {
  const json = await ghGraphQL<Record<string, RepoGqlData>>(buildBatchQuery(repos));
  return json.data ?? {};
}

type RepoSlug = { owner: string; name: string };

/**
 * Fetches GitHub data for every repo across as many batched GraphQL queries as
 * needed, keyed by `r${globalIndex}` so callers can align results with their
 * input list by position.
 */
async function fetchRepoDataMap(repoSlugs: RepoSlug[]): Promise<Record<string, RepoGqlData>> {
  const allGqlData: Record<string, RepoGqlData> = {};
  const batches: Array<{ batch: RepoSlug[]; offset: number }> = [];
  for (let i = 0; i < repoSlugs.length; i += BATCH_SIZE) {
    batches.push({ batch: repoSlugs.slice(i, i + BATCH_SIZE), offset: i });
  }

  const results = await Promise.all(
    batches.map(async ({ batch, offset }) => {
      const batchData = await fetchRepoBatch(batch);
      return { batchData, offset };
    }),
  );

  for (const { batchData, offset } of results) {
    for (let j = 0; j < Object.keys(batchData).length; j++) {
      allGqlData[`r${offset + j}`] = batchData[`r${j}`];
    }
  }

  return allGqlData;
}

/** GitHub-derived fields for a showcase project, extracted from a GraphQL repo payload. */
function githubFields(ghData: RepoGqlData | undefined) {
  return {
    stars: ghData?.stargazerCount ?? 0,
    forks: ghData?.forkCount ?? 0,
    openIssues: ghData?.issues?.totalCount ?? 0,
    openPRs: ghData?.pullRequests?.totalCount ?? 0,
    description: ghData?.description ?? null,
    homepageUrl: ghData?.homepageUrl ?? null,
    license: ghData?.licenseInfo?.spdxId ?? null,
    language: ghData?.primaryLanguage?.name ?? null,
    languageColor: ghData?.primaryLanguage?.color ?? null,
  };
}

export async function syncShowcase(): Promise<{ synced: number; skipped: number }> {
  const [allFiles, existing] = await Promise.all([
    fetchRegistry(),
    // Load existing SHA map from DB
    prisma.showcaseProject.findMany({ select: { repo: true, fileSha: true } }),
  ]);

  const shaByRepo = new Map(existing.map((p) => [p.repo, p.fileSha]));

  // Only process files whose SHA has changed (or are new)
  const changedFiles = allFiles.filter((f) => shaByRepo.get(f.yaml.repo) !== f.sha);
  const skipped = allFiles.length - changedFiles.length;

  if (changedFiles.length > 0) {
    // Batch GraphQL queries only for changed files
    const allGqlData = await fetchRepoDataMap(
      changedFiles.map((f) => {
        const [owner, name] = f.yaml.repo.split("/");
        return { owner, name };
      }),
    );

    await Promise.all(
      changedFiles.map(async (file, index) => {
        const project = file.yaml;
        const shared = {
          submittedBy: project.submittedBy,
          banner: project.banner ?? null,
          links: project.links ?? [],
          website: project.website ?? null,
          ...githubFields(allGqlData[`r${index}`]),
          fileSha: file.sha,
        };

        return prisma.showcaseProject.upsert({
          where: { repo: project.repo },
          create: { repo: project.repo, ...shared },
          update: { ...shared },
        });
      }),
    );

    revalidateTag("showcase", { expire: 0 });
  }

  return { synced: changedFiles.length, skipped };
}

/**
 * Refreshes GitHub-derived data (stars, forks, open issues/PRs, license,
 * language, description, homepage) for every showcase project already in the
 * database — regardless of whether its registry YAML changed. Registry-owned
 * fields (submittedBy, banner, links, website, fileSha) are left untouched.
 */
export async function syncShowcaseData(): Promise<{ synced: number }> {
  const projects = await prisma.showcaseProject.findMany({ select: { repo: true } });
  if (projects.length === 0) {
    return { synced: 0 };
  }

  const allGqlData = await fetchRepoDataMap(
    projects.map((p) => {
      const [owner, name] = p.repo.split("/");
      return { owner, name };
    }),
  );

  await Promise.all(
    projects.map(async (project, index) =>
      prisma.showcaseProject.update({
        where: { repo: project.repo },
        data: githubFields(allGqlData[`r${index}`]),
      }),
    ),
  );

  revalidateTag("showcase", { expire: 0 });

  return { synced: projects.length };
}
