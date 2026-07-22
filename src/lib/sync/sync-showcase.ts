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
    const repoSlugs = changedFiles.map((f) => {
      const [owner, name] = f.yaml.repo.split("/");
      return { owner, name };
    });

    const allGqlData: Record<string, RepoGqlData> = {};
    const batches = [];
    for (let i = 0; i < repoSlugs.length; i += BATCH_SIZE) {
      const batch = repoSlugs.slice(i, i + BATCH_SIZE);
      batches.push({ batch, offset: i });
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
