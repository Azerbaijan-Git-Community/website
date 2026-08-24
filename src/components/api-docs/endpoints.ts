// Single source of truth for the Open Data API docs page: drives the endpoint sections,
// the code samples, the interactive runner, and the sidebar table of contents.

export type EndpointParam = {
  name: string;
  example: string;
  description: string;
};

export type EndpointDoc = {
  id: string;
  category: "Stats" | "Leaderboard" | "Blog" | "Showcase";
  method: "GET";
  /** Path template with `{param}` tokens, e.g. `/api/v1/leaderboard/{year}/{month}`. */
  path: string;
  title: string;
  summary: string;
  params?: EndpointParam[];
};

export const ENDPOINTS: EndpointDoc[] = [
  {
    id: "stats",
    category: "Stats",
    method: "GET",
    path: "/api/v1/stats",
    title: "Community stats",
    summary: "Aggregated community totals, the same numbers shown on the home page hero.",
  },
  {
    id: "leaderboard-current",
    category: "Leaderboard",
    method: "GET",
    path: "/api/v1/leaderboard",
    title: "Current month",
    summary: "Top 50 contributors for the current month, ranked by commits.",
  },
  {
    id: "leaderboard-all-time",
    category: "Leaderboard",
    method: "GET",
    path: "/api/v1/leaderboard/all-time",
    title: "All-time",
    summary:
      "Top 50 contributors by commits in the current calendar year. Note: GitHub's contribution window is capped at one year, so this counts the current year only (Jan 1 → Dec 31) and resets every January; the site labels this tab with the year (e.g. “2026”).",
  },
  {
    id: "leaderboard-month",
    category: "Leaderboard",
    method: "GET",
    path: "/api/v1/leaderboard/{year}/{month}",
    title: "Specific month",
    summary: "Top 50 contributors for a past month. Returns 404 if no data exists for that month.",
    params: [
      { name: "year", example: "2026", description: "Four-digit year (2026–2100)." },
      { name: "month", example: "07", description: "Month number, 1–12 (zero-padding optional)." },
    ],
  },
  {
    id: "blog-list",
    category: "Blog",
    method: "GET",
    path: "/api/v1/blog",
    title: "List posts",
    summary: "All blog posts (metadata only, without the MDX body), newest first.",
  },
  {
    id: "blog-single",
    category: "Blog",
    method: "GET",
    path: "/api/v1/blog/{slug}",
    title: "Single post",
    summary: "A single blog post including its raw MDX body. Returns 404 for an unknown slug.",
    params: [{ name: "slug", example: "hello-world", description: "The post's URL slug." }],
  },
  {
    id: "showcase",
    category: "Showcase",
    method: "GET",
    path: "/api/v1/showcase",
    title: "List projects",
    summary: "Community showcase projects with live GitHub repo stats, newest first.",
  },
];

/** Path without the `/api/v1` prefix, for compact sidebar labels. */
function shortPath(path: string): string {
  return path.replace("/api/v1", "") || "/";
}

/** Replace `{token}` segments in a path template with encoded values. */
export function fillPath(path: string, values: Record<string, string>): string {
  return path.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(values[key] ?? `{${key}}`));
}

const KB_SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "base-url", label: "Base URL" },
  { id: "authentication", label: "Authentication" },
  { id: "rate-limits", label: "Rate limits" },
  { id: "caching", label: "Caching" },
  { id: "errors", label: "Errors" },
  { id: "versioning", label: "Versioning" },
  { id: "mcp", label: "MCP server" },
] as const;

export type NavItem = { id: string; label: string };
export type NavGroup = { group: string; items: NavItem[] };

export const DOC_NAV: NavGroup[] = [
  { group: "Guide", items: KB_SECTIONS.map((s) => ({ id: s.id, label: s.label })) },
  { group: "Endpoints", items: ENDPOINTS.map((e) => ({ id: e.id, label: shortPath(e.path) })) },
  { group: "Reference", items: [{ id: "schemas", label: "Schemas & OpenAPI" }] },
];

export const ALL_SECTION_IDS: string[] = [...KB_SECTIONS.map((s) => s.id), ...ENDPOINTS.map((e) => e.id), "schemas"];
