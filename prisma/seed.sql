-- Sample data for CI (Lighthouse) and throwaway databases. Safe to run more than once.
-- Run with: pnpm prisma db execute --file prisma/seed.sql

INSERT INTO "user" ("id", "name", "email", "emailVerified", "githubUsername", "githubId", "image", "role", "updatedAt")
SELECT
  'seed-user-' || n,
  'Seed User ' || n,
  'seed' || n || '@example.com',
  true,
  'seed-user-' || n,
  900000 + n,
  'https://avatars.githubusercontent.com/u/9919?v=4',
  'user',
  now()
FROM generate_series(1, 12) AS n
ON CONFLICT DO NOTHING;

INSERT INTO "github_stats" ("id", "userId", "commits", "pullRequests", "issues", "reviews", "repositories", "contributions", "followers", "updatedAt")
SELECT 'seed-stats-' || n, 'seed-user-' || n, 2000 - n * 120, 300 - n * 20, 80 - n * 5, 150 - n * 10, 40 - n, 2600 - n * 150, 500 - n * 30, now()
FROM generate_series(1, 12) AS n
ON CONFLICT DO NOTHING;

-- Keys match getWeekKey/getMonthKey (ISO week, UTC), so the current periods have data.
INSERT INTO "github_stats_snapshot" ("id", "userId", "period", "periodKey", "commits", "pullRequests", "issues", "reviews", "updatedAt")
SELECT 'seed-week-' || n, 'seed-user-' || n, 'WEEKLY'::"SnapshotPeriod", to_char(now() AT TIME ZONE 'UTC', 'IYYY-"W"IW'), 60 - n * 4, 10 - (n / 2), 3, 5, now()
FROM generate_series(1, 12) AS n
UNION ALL
SELECT 'seed-month-' || n, 'seed-user-' || n, 'MONTHLY'::"SnapshotPeriod", to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'), 250 - n * 15, 40 - n * 2, 10, 20, now()
FROM generate_series(1, 12) AS n
ON CONFLICT DO NOTHING;

INSERT INTO "showcase_project" ("id", "repo", "submittedBy", "links", "stars", "forks", "openIssues", "openPRs", "description", "language", "languageColor", "fileSha", "updatedAt")
VALUES (
  'seed-showcase-1',
  'Azerbaijan-Git-Community/website',
  'seed-user-1',
  '{}',
  42, 7, 3, 1,
  'Azerbaijan GitHub Community website.',
  'TypeScript', '#3178c6',
  'seed',
  now()
)
ON CONFLICT DO NOTHING;

-- Lighthouse audits /blog/hello-world.
INSERT INTO "blog_post" ("id", "slug", "title", "description", "tags", "coverImage", "userId", "contentHtml", "readingTime", "sourceOrigin", "sourcePostId", "sourceUrl", "sourceUpdatedAt", "updatedAt")
VALUES (
  'seed-post-1',
  'hello-world',
  'Hello, world',
  'A sample post for local and CI databases.',
  '{sample,community}',
  'https://opengraph.githubassets.com/1/Azerbaijan-Git-Community/website',
  'seed-user-1',
  '<h2>Hello</h2><p>This is a sample post with a <a href="https://github.com">link</a> and some <code>code</code>.</p><pre><code>console.log("hello");</code></pre>',
  1,
  'https://omicron.example',
  'seed-post-1',
  'https://omicron.example/@seed-user-1/hello-world',
  now(),
  now()
)
ON CONFLICT DO NOTHING;
