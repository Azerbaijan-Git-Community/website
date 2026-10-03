import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { inject } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";

// Real Postgres (WASM) per test file, so queries, constraints and relation filters behave like production.
const pglite = new PGlite({ loadDataDir: new Blob([readFileSync(inject("dbSnapshotPath"))]) });

export const testPrisma = new PrismaClient({ adapter: new PrismaPGlite(pglite) });

export async function resetDb() {
  const { rows } = await pglite.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  if (rows.length === 0) return;
  await pglite.exec(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} CASCADE`);
}

let seq = 0;

type UserInput = Partial<{
  name: string;
  githubUsername: string;
  githubId: number;
  image: string;
  role: string;
  banned: boolean;
  banReason: string | null;
}>;

export function createUser(input: UserInput = {}) {
  seq += 1;
  const githubUsername = input.githubUsername ?? `user${seq}`;
  return testPrisma.user.create({
    data: {
      name: input.name ?? `User ${seq}`,
      email: `${githubUsername}@example.com`,
      githubUsername,
      githubId: input.githubId ?? 1000 + seq,
      image: input.image ?? `https://avatars.githubusercontent.com/u/${1000 + seq}`,
      role: input.role ?? "user",
      banned: input.banned ?? false,
      banReason: input.banReason ?? null,
    },
  });
}

type Counts = Partial<{ commits: number; pullRequests: number; issues: number; reviews: number }>;

export function createAllTimeStats(userId: string, counts: Counts & { updatedAt?: Date } = {}) {
  return testPrisma.githubStats.create({ data: { userId, ...counts } });
}

export function createSnapshot(userId: string, period: "WEEKLY" | "MONTHLY", periodKey: string, counts: Counts = {}) {
  return testPrisma.githubStatsSnapshot.create({ data: { userId, period, periodKey, ...counts } });
}

type PostInput = Partial<{
  slug: string;
  title: string;
  description: string;
  tags: string[];
  contentMdx: string;
  contentSha: string;
  readingTime: number;
  createdAt: Date;
}>;

export function createBlogPost(userId: string, input: PostInput = {}) {
  seq += 1;
  const slug = input.slug ?? `post-${seq}`;
  return testPrisma.blogPost.create({
    data: {
      slug,
      title: input.title ?? `Post ${seq}`,
      description: input.description ?? `Description ${seq}`,
      tags: input.tags ?? ["test"],
      coverImage: `https://raw.githubusercontent.com/Azerbaijan-Git-Community/blog/main/posts/${slug}/images/cover.png`,
      userId,
      contentMdx: input.contentMdx ?? "# Hello",
      contentSha: input.contentSha ?? `sha-${slug}`,
      readingTime: input.readingTime ?? 1,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    },
  });
}

type ProjectInput = Partial<{
  repo: string;
  submittedBy: string;
  fileSha: string;
  stars: number;
  links: string[];
  createdAt: Date;
}>;

export function createShowcaseProject(input: ProjectInput = {}) {
  seq += 1;
  return testPrisma.showcaseProject.create({
    data: {
      repo: input.repo ?? `owner/repo-${seq}`,
      submittedBy: input.submittedBy ?? "someone",
      fileSha: input.fileSha ?? `file-sha-${seq}`,
      stars: input.stars ?? 0,
      links: input.links ?? [],
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    },
  });
}
