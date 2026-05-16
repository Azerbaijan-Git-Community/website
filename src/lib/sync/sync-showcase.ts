import yaml from "js-yaml";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const BATCH_SIZE = 50;
const SHOWCASE_OWNER = "Azerbaijan-Git-Community";
const SHOWCASE_REPO = "showcase";

interface ShowcaseYaml {
  repo: string;
  submittedBy: string;
  banner?: string;
  links?: string[];
  website?: string;
}

interface ShowcaseFile {
  yaml: ShowcaseYaml;
  sha: string;
}

interface RepoGqlData {
  stargazerCount: number;
  forkCount: number;
  issues: { totalCount: number };
  pullRequests: { totalCount: number };
  description: string | null;
  homepageUrl: string | null;
  licenseInfo: { spdxId: string } | null;
  primaryLanguage: { name: string; color: string } | null;
}

async function fetchRegistry(): Promise<ShowcaseFile[]> {
  const res = await fetch(`https://api.github.com/repos/${SHOWCASE_OWNER}/${SHOWCASE_REPO}/contents/projects`, {
    headers: {
      Authorization: `Bearer ${process.env.GH_STATS_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch showcase registry: ${res.status}`);

  const files = (await res.json()) as Array<{ name: string; sha: string; download_url: string }>;
  const yamlFiles = files.filter((f) => f.name.endsWith(".yaml"));

  const results = await Promise.all(
    yamlFiles.map(async (file) => {
      const content = await fetch(file.download_url, {
        headers: { Authorization: `Bearer ${process.env.GH_STATS_TOKEN}` },
      }).then((r) => r.text());
      const parsed = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as ShowcaseYaml;
      return parsed?.repo ? { yaml: parsed, sha: file.sha } : null;
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
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GH_STATS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: buildBatchQuery(repos) }),
  });
  const json = await res.json();
  return json?.data ?? {};
}

export async function syncShowcase(): Promise<{ synced: number; skipped: number }> {
  const allFiles = await fetchRegistry();

  // Load existing SHA map from DB
  const existing = await prisma.showcaseProject.findMany({ select: { repo: true, fileSha: true } });
  const shaByRepo = new Map(existing.map((p) => [p.repo, p.fileSha]));

  // Only process files whose SHA has changed (or are new)
  const changedFiles = allFiles.filter((f) => shaByRepo.get(f.yaml.repo) !== f.sha);
  const skipped = allFiles.length - changedFiles.length;

  if (changedFiles.length > 0) {
    // Batch GraphQL queries only for changed files
    const repoSlugs = changedFiles.map((f) => {
      const [owner, name] = f.yaml.repo.split("/");
      return { owner, name };
    });

    const allGqlData: Record<string, RepoGqlData> = {};
    for (let i = 0; i < repoSlugs.length; i += BATCH_SIZE) {
      const batch = repoSlugs.slice(i, i + BATCH_SIZE);
      const batchData = await fetchRepoBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        allGqlData[`r${i + j}`] = batchData[`r${j}`];
      }
    }

    await Promise.all(
      changedFiles.map(async (file, index) => {
        const project = file.yaml;
        const ghData = allGqlData[`r${index}`];
        const shared = {
          submittedBy: project.submittedBy,
          banner: project.banner ?? null,
          links: project.links ?? [],
          website: project.website ?? null,
          stars: ghData?.stargazerCount ?? 0,
          forks: ghData?.forkCount ?? 0,
          openIssues: ghData?.issues?.totalCount ?? 0,
          openPRs: ghData?.pullRequests?.totalCount ?? 0,
          description: ghData?.description ?? null,
          homepageUrl: ghData?.homepageUrl ?? null,
          license: ghData?.licenseInfo?.spdxId ?? null,
          language: ghData?.primaryLanguage?.name ?? null,
          languageColor: ghData?.primaryLanguage?.color ?? null,
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
