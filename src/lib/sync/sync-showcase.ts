import { JSON_SCHEMA as yamlJSON_SCHEMA, load as yamlLoad } from "js-yaml";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { cacheTags } from "@/lib/cache-tags";
import { GITHUB_ORG } from "@/lib/constants";
import { type GhContentEntry, ghBlobText, ghGraphQL, ghJson } from "@/lib/github";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 50;
const SHOWCASE_REPO = "showcase";
const CREATED_AT_STEP_MS = 10 * 60 * 1000;

const showcaseYamlSchema = z.object({
  // `owner/name` only, which also keeps it safe to interpolate into the GraphQL query.
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "Expected owner/name"),
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

type InvalidFile = {
  name: string;
  /** The `repo` the file still names, if any — that project must not be pruned. */
  repo: string | null;
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

function loadYaml(content: string): unknown {
  try {
    return yamlLoad(content, { schema: yamlJSON_SCHEMA });
  } catch {
    return undefined;
  }
}

async function fetchRegistry(): Promise<{ files: ShowcaseFile[]; invalid: InvalidFile[] }> {
  const entries = await ghJson<GhContentEntry[]>(`/repos/${GITHUB_ORG}/${SHOWCASE_REPO}/contents/projects`);
  const yamlFiles = entries.filter((f) => f.name.endsWith(".yaml"));

  const results = await Promise.all(
    yamlFiles.map(async (file) => {
      const raw = loadYaml(await ghBlobText(GITHUB_ORG, SHOWCASE_REPO, file.sha));
      const parsed = showcaseYamlSchema.safeParse(raw);
      if (parsed.success) return { file: { yaml: parsed.data, sha: file.sha } };

      console.warn(`Invalid showcase file "${file.name}": ${z.prettifyError(parsed.error)}`);
      const named = z.object({ repo: z.string() }).safeParse(raw);
      return { invalid: { name: file.name, repo: named.success ? named.data.repo : null } };
    }),
  );

  return {
    files: results.flatMap((r) => (r.file ? [r.file] : [])),
    invalid: results.flatMap((r) => (r.invalid ? [r.invalid] : [])),
  };
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
function githubFields(ghData: RepoGqlData) {
  return {
    stars: ghData.stargazerCount,
    forks: ghData.forkCount,
    openIssues: ghData.issues.totalCount,
    openPRs: ghData.pullRequests.totalCount,
    description: ghData.description,
    homepageUrl: ghData.homepageUrl,
    license: ghData.licenseInfo?.spdxId ?? null,
    language: ghData.primaryLanguage?.name ?? null,
    languageColor: ghData.primaryLanguage?.color ?? null,
  };
}

export async function syncShowcase(): Promise<{ synced: number; skipped: number; deleted: number; invalid: string[] }> {
  const [{ files: allFiles, invalid }, existing] = await Promise.all([
    fetchRegistry(),
    // Load existing SHA map from DB
    prisma.showcaseProject.findMany({ select: { repo: true, fileSha: true } }),
  ]);

  const shaByRepo = new Map(existing.map((p) => [p.repo, p.fileSha]));

  // Prune DB rows whose YAML no longer exists in the registry (files deleted upstream).
  // An invalid file still protects the repo it names; if it names none, what's gone is unknown, so skip pruning.
  // Guard against wiping everything if the registry came back empty (e.g. API hiccup).
  let deleted = 0;
  if (allFiles.length > 0 && invalid.every((f) => f.repo !== null)) {
    const registryRepos = new Set([...allFiles.map((f) => f.yaml.repo), ...invalid.map((f) => f.repo)]);
    const removedRepos = existing.map((p) => p.repo).filter((repo) => !registryRepos.has(repo));
    if (removedRepos.length > 0) {
      const result = await prisma.showcaseProject.deleteMany({ where: { repo: { in: removedRepos } } });
      deleted = result.count;
    }
  }

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

    const now = Date.now();
    const createdAtByRepo = new Map(
      changedFiles
        .filter((f) => !shaByRepo.has(f.yaml.repo))
        .map((f, i) => [f.yaml.repo, new Date(now - i * CREATED_AT_STEP_MS)] as const),
    );

    await Promise.all(
      changedFiles.map(async (file, index) => {
        const project = file.yaml;
        const ghData = allGqlData[`r${index}`];
        const shared = {
          submittedBy: project.submittedBy,
          banner: project.banner ?? null,
          links: project.links ?? [],
          website: project.website ?? null,
          // Without GitHub data, keep the last known stats (new projects get the schema defaults).
          ...(ghData ? githubFields(ghData) : {}),
          fileSha: file.sha,
        };

        const createdAt = createdAtByRepo.get(project.repo);

        return prisma.showcaseProject.upsert({
          where: { repo: project.repo },
          create: { repo: project.repo, ...(createdAt ? { createdAt } : {}), ...shared },
          update: { ...shared },
        });
      }),
    );
  }

  // Refresh the cache when anything changed — upserts or deletions.
  if (changedFiles.length > 0 || deleted > 0) {
    revalidateTag(cacheTags.showcase, "max");
  }

  return { synced: changedFiles.length, skipped, deleted, invalid: invalid.map((f) => f.name) };
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

  // A repo GitHub can't resolve right now (renamed, private, transient error) keeps its last known stats.
  const resolved = projects.flatMap(({ repo }, index) => {
    const ghData = allGqlData[`r${index}`];
    if (!ghData) console.warn(`No GitHub data for showcase repo "${repo}", keeping existing stats`);
    return ghData ? [{ repo, ghData }] : [];
  });

  await Promise.all(
    resolved.map(({ repo, ghData }) => prisma.showcaseProject.update({ where: { repo }, data: githubFields(ghData) })),
  );

  revalidateTag(cacheTags.showcase, "max");

  return { synced: resolved.length };
}
