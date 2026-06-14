import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

const BLOG_OWNER = "Azerbaijan-Git-Community";
const BLOG_REPO = "blog";
const RAW_BASE = `https://raw.githubusercontent.com/${BLOG_OWNER}/${BLOG_REPO}/main/posts`;

interface GitHubDirEntry {
  name: string;
  sha: string;
  type: "dir" | "file";
}

interface BlogFrontmatter {
  title: string;
  description: string;
  tags: string[];
  author: number;
}

/**
 * Parse frontmatter from raw MDX content.
 * Expects `---` delimited YAML block at the top of the file.
 */
function parseFrontmatter(raw: string): { frontmatter: BlogFrontmatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error("Missing frontmatter block");

  const block = match[1];
  const content = raw.slice(match[0].length).trim();

  const get = (key: string): string | undefined => {
    const line = block.split("\n").find((l) => l.startsWith(`${key}:`));
    if (!line) return undefined;
    return line
      .slice(key.length + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  };

  const title = get("title");
  const description = get("description");
  const authorStr = get("author");

  if (!title || !description || !authorStr) {
    throw new Error(
      `Missing required frontmatter fields. Got: title=${title}, description=${description}, author=${authorStr}`,
    );
  }

  // Parse tags: [tag1, tag2, tag3]
  const tagsMatch = block.match(/tags:\s*\[([^\]]*)\]/);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").flatMap((t) => {
        const tag = t.trim().replace(/^["']|["']$/g, "");
        return tag ? [tag] : [];
      })
    : [];

  return {
    frontmatter: {
      title,
      description,
      tags,
      author: parseInt(authorStr, 10),
    },
    content,
  };
}

/** Calculate reading time in minutes from content (excluding frontmatter). */
function calculateReadingTime(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const COVER_EXTS = ["png", "jpg", "jpeg", "webp", "svg"];

/** Fetch the images directory and return the raw URL of the cover image. */
async function fetchCoverImageUrl(slug: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${BLOG_OWNER}/${BLOG_REPO}/contents/posts/${slug}/images`, {
    headers: {
      Authorization: `Bearer ${process.env.GH_STATS_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch images directory for "${slug}": ${res.status}`);

  const entries = (await res.json()) as GitHubDirEntry[];
  const cover = entries.find((e) => e.type === "file" && COVER_EXTS.some((ext) => e.name === `cover.${ext}`));

  if (!cover) throw new Error(`No cover image found in posts/${slug}/images/`);
  return `${RAW_BASE}/${slug}/images/${cover.name}?sha=${cover.sha}`;
}

/** Fetch the posts directory listing from the blog repo. */
async function fetchPostDirs(): Promise<GitHubDirEntry[]> {
  const res = await fetch(`https://api.github.com/repos/${BLOG_OWNER}/${BLOG_REPO}/contents/posts`, {
    headers: {
      Authorization: `Bearer ${process.env.GH_STATS_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch blog posts directory: ${res.status}`);

  const entries = (await res.json()) as GitHubDirEntry[];
  return entries.filter((e) => e.type === "dir");
}

/** Fetch the raw index.mdx content for a given post slug. */
async function fetchPostContent(slug: string): Promise<string> {
  const res = await fetch(`${RAW_BASE}/${slug}/index.mdx`, {
    headers: { Authorization: `Bearer ${process.env.GH_STATS_TOKEN}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch post content for ${slug}: ${res.status}`);
  return res.text();
}

/**
 * Incrementally sync blog posts from the blog GitHub repo into the database.
 *
 * Uses Git tree SHA comparison to only fetch and upsert posts that have actually
 * changed, avoiding unnecessary API calls and preventing `updatedAt` from being
 * modified on unchanged posts.
 */
export async function syncBlog(): Promise<{ synced: number; skipped: number; failed: string[] }> {
  // 1. Fetch directory listing with SHAs
  // 2. Get existing posts from DB for SHA comparison
  const [dirs, existing] = await Promise.all([
    fetchPostDirs(),
    prisma.blogPost.findMany({ select: { slug: true, contentSha: true } }),
  ]);

  const existingMap = new Map(existing.map((p) => [p.slug, p.contentSha]));

  // 3. Determine which posts need updating
  const toSync: Array<{ slug: string; sha: string }> = [];

  for (const dir of dirs) {
    const existingSha = existingMap.get(dir.name);
    if (existingSha !== dir.sha) {
      toSync.push({ slug: dir.name, sha: dir.sha });
    }
  }

  const skipped = dirs.length - toSync.length;

  // 4. Fetch and upsert only changed/new posts
  const failed: string[] = [];

  await Promise.all(
    toSync.map(async ({ slug, sha }) => {
      try {
        const raw = await fetchPostContent(slug);
        const { frontmatter, content } = parseFrontmatter(raw);

        const user = await prisma.user.findUnique({
          where: { githubId: frontmatter.author },
          select: { id: true },
        });

        if (!user) {
          console.warn(`Skipping post "${slug}": no user found with githubId ${frontmatter.author}`);
          failed.push(slug);
          return;
        }

        const data = {
          title: frontmatter.title,
          description: frontmatter.description,
          tags: frontmatter.tags,
          coverImage: await fetchCoverImageUrl(slug),
          userId: user.id,
          contentMdx: content,
          readingTime: calculateReadingTime(content),
          contentSha: sha,
        };

        await prisma.blogPost.upsert({
          where: { slug },
          create: { slug, ...data },
          update: data,
        });
      } catch (err) {
        console.error(`Failed to sync post "${slug}":`, err);
        failed.push(slug);
      }
    }),
  );

  // 5. Invalidate cache
  revalidateTag("blog", { expire: 0 });

  return { synced: toSync.length - failed.length, skipped, failed };
}
