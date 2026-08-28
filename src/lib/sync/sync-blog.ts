import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { GITHUB_ORG } from "@/lib/constants";
import { type GhContentEntry, ghJson, ghRawContent } from "@/lib/github";
import { prisma } from "@/lib/prisma";

const BLOG_REPO = "blog";
const CONTENTS_BASE = `/repos/${GITHUB_ORG}/${BLOG_REPO}/contents/posts`;
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_ORG}/${BLOG_REPO}/main/posts`;

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
  const entries = await ghJson<GhContentEntry[]>(`${CONTENTS_BASE}/${slug}/images`);
  const cover = entries.find((e) => e.type === "file" && COVER_EXTS.some((ext) => e.name === `cover.${ext}`));

  if (!cover) throw new Error(`No cover image found in posts/${slug}/images/`);
  return `${RAW_BASE}/${slug}/images/${cover.name}?sha=${cover.sha}`;
}

/** Fetch the posts directory listing from the blog repo. */
async function fetchPostDirs(): Promise<GhContentEntry[]> {
  const entries = await ghJson<GhContentEntry[]>(CONTENTS_BASE);
  return entries.filter((e) => e.type === "dir");
}

/** Fetch a post's index.mdx via the contents API — fresh, unlike the ~5 min CDN-cached raw host. */
function fetchPostContent(slug: string): Promise<string> {
  return ghRawContent(`${CONTENTS_BASE}/${slug}/index.mdx`);
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

  // 5. Invalidate cache — only the posts that actually changed (each its own
  //    page), plus the list views (blog page + sitemap) when at least one synced.
  const failedSet = new Set(failed);
  const syncedSlugs = toSync.filter(({ slug }) => !failedSet.has(slug));

  for (const { slug } of syncedSlugs) {
    revalidateTag(cacheTags.blogPost(slug), "max");
  }
  if (syncedSlugs.length > 0) {
    revalidateTag(cacheTags.blog, "max");
  }

  return { synced: syncedSlugs.length, skipped, failed };
}
