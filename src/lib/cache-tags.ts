export const cacheTags = {
  // `blog` covers the "all posts" views (list page, sitemap); `blogPost(slug)`
  // is a single post's page so one post can be busted without the others.
  blog: "blog",
  blogPost: (slug: string) => `blog-${slug}`,
  showcase: "showcase",
  leaderboard: "leaderboard",
} as const;
