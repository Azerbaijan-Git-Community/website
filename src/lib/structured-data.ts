import { clientEnv } from "@/lib/env.client";

const baseUrl = clientEnv.NEXT_PUBLIC_BASE_URL;

const ORG_NAME = "Azerbaijan GitHub Community";
const ORG_DESCRIPTION =
  "National open source & innovation growth program uniting Azerbaijan's developers and tracking GitHub contributions.";
const ORG_GITHUB = "https://github.com/Azerbaijan-Git-Community";

/** Reusable publisher/organization node for embedding in other schemas. */
const organizationNode = {
  "@type": "Organization",
  name: ORG_NAME,
  url: baseUrl,
  logo: {
    "@type": "ImageObject",
    url: `${baseUrl}/logo.png`,
  },
} as const;

/** Site-wide Organization schema. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: baseUrl,
    description: ORG_DESCRIPTION,
    logo: `${baseUrl}/logo.png`,
    sameAs: [ORG_GITHUB],
  };
}

type BlogPostingInput = {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author: { name: string; githubUsername: string | null };
};

/** Article/BlogPosting schema for an individual blog post. */
export function blogPostingSchema(post: BlogPostingInput) {
  const url = `${baseUrl}/blog/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.coverImage,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    keywords: post.tags.join(", "),
    author: {
      "@type": "Person",
      name: post.author.name,
      ...(post.author.githubUsername ? { url: `https://github.com/${post.author.githubUsername}` } : {}),
    },
    publisher: organizationNode,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
  };
}

/** BreadcrumbList schema from an ordered list of { name, path } crumbs. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}
