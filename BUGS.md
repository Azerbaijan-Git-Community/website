# Known bugs

Found while writing the test suite. None of them are fixed yet. Each one has a matching **expected-to-fail** test
(`test.fails(...)` / `{ fails: true }`) named with its ID, which asserts the _correct_ behavior. When a bug is fixed, its
test starts "unexpectedly passing" and Vitest fails the run, so flip that `test.fails` back to `test`.

Find a bug's tests with: `grep -rn "BUG-07" tests/`

| ID     | Severity | Area           | Summary                                                                           |
| ------ | -------- | -------------- | --------------------------------------------------------------------------------- |
| BUG-01 | Medium   | Leaderboard    | Week keys use the server's local time, while week ranges use UTC                  |
| BUG-02 | Medium   | Config         | Upstash is documented as optional, but the app won't boot without it              |
| BUG-03 | Low      | Showcase       | Link icons match on a substring of the whole URL instead of the host              |
| BUG-04 | High     | Open Data API  | An Upstash outage takes down every public API and MCP request                     |
| BUG-05 | Medium   | Blog sync      | Posts deleted from the blog repo are never removed from the database              |
| BUG-06 | High     | Showcase sync  | A repo GitHub can't resolve gets its stars/forks/etc. overwritten with 0          |
| BUG-07 | High     | Showcase sync  | A typo in a project's YAML silently deletes the project                           |
| BUG-08 | Low      | Showcase sync  | `repo` isn't validated as `owner/name`                                            |
| BUG-09 | Low      | Stats          | `GithubStats.contributions` is never written, so `totalContributions` is always 0 |
| BUG-10 | Medium   | Admin console  | One failed sync leaves every Run button disabled until reload                     |
| BUG-11 | Low      | Blog API       | `validate-author` crashes (500) for numeric ids above the 32-bit range            |
| BUG-12 | Low      | Showcase UI    | Counts near a million render as `1000k`                                           |
| BUG-13 | Low      | Auth           | The GitHub OAuth URL requests every scope twice                                   |
| BUG-14 | Medium   | Blog UI        | Language icons in code block titles never render                                  |
| BUG-15 | Medium   | Leaderboard UI | Choosing an empty period hides the period tabs, so visitors are stuck             |

---

## BUG-01: Week keys use local time; week ranges use UTC

- **Where:** `src/lib/utils.server.ts:16` (`getWeekKey`). It also affects `src/lib/sync/sync-leaderboard.ts:193` and
  `src/data/leaderboard/get.ts:37`.
- **What:** `getWeekKey` builds its date from `getFullYear()/getMonth()/getDate()` (local time). `getMonthKey` and
  `getWeekRange` both use UTC. On a server outside UTC (e.g. `Asia/Baku`, UTC+4), Sunday 22:00 UTC is already Monday locally.
  The sync then queries GitHub for last week's UTC range but files the numbers under _next_ week's key. The leaderboard
  page reads the wrong week too.
- **Impact:** Vercel runs in UTC today, so production is unaffected. Local dev and any non-UTC host get wrong weekly
  data near week boundaries.
- **Fix:** Use `getUTCFullYear()/getUTCMonth()/getUTCDate()`.
- **Tests:** `tests/lib/utils.server.test.ts`, `tests/lib/sync/sync-leaderboard.test.ts`

## BUG-02: Upstash is documented as optional but required at boot

- **Where:** `src/lib/env.server.ts:20-23`, `src/lib/api/rate-limit.ts:21-27`, `.env.example:41-45`
- **What:** `.env.example` and both code comments say that without `UPSTASH_REDIS_REST_*` "the API fails open (no rate
  limiting)". In fact the env schema requires both variables, so `env.server.ts` throws at import and the whole app
  refuses to start. `getLimiters()` can never return `null`, so its fail-open branch is dead code.
- **Fix:** Make both variables `.optional()` and return `null` from `getLimiters()` when either is missing. Or, if they
  are truly required, update the comments and `.env.example`.
- **Tests:** `tests/lib/env.server.test.ts`

## BUG-03: Link icons match a substring of the whole URL

- **Where:** `src/lib/link-icons.ts:79`
- **What:** `url.includes(domain)` matches anywhere in the URL. `https://github.com/someone/npmjs.com-mirror` gets the
  npm icon and label, and look-alike hosts such as `notpypi.org.evil.example` get the PyPI one.
- **Fix:** Compare against `new URL(url).hostname`: equal to the domain, or ending with `.${domain}`.
- **Tests:** `tests/lib/link-icons.test.ts`

## BUG-04: An Upstash outage takes down the whole public API

- **Where:** `src/lib/api/with-api.ts:13`, `src/app/api/mcp/[transport]/route.ts:222`
- **What:** `checkRateLimit()` runs outside the handler's `try/catch`. When Upstash errors, the rejection escapes
  `withApi`, so every `/api/v1/*` route fails with an unhandled error instead of the JSON envelope. The same happens on
  every MCP request. The surrounding comments state an intent to fail open.
- **Fix:** Catch rate-limiter errors, log them, and continue without rate-limit headers (fail open). Alternatively,
  return a proper `apiError(503, …)`.
- **Tests:** `tests/lib/api/with-api.test.ts`

## BUG-05: Deleted blog posts are never removed

- **Where:** `src/lib/sync/sync-blog.ts:103-181`
- **What:** `syncBlog` only creates or updates posts whose tree SHA changed. A post folder deleted from the blog repo
  stays in the database forever, and keeps showing on `/blog`, in the sitemap and in the API. `syncShowcase` does prune
  removed entries, so this looks like an oversight.
- **Fix:** After listing `posts/`, delete DB rows whose slug isn't in the listing. Keep an empty-listing guard like the
  showcase sync has, and revalidate `blog` plus each `blog-<slug>`.
- **Tests:** `tests/lib/sync/sync-blog.test.ts`

## BUG-06: Missing GitHub data overwrites showcase stats with zeros

- **Where:** `src/lib/sync/sync-showcase.ts:109-121` (`githubFields`), used at `:172` and `:218`
- **What:** GitHub returns `null` for a repo it can't resolve right now (renamed, made private, transient error, or a
  `data: null` envelope). `githubFields(undefined)` then yields `stars: 0, forks: 0, license: null, …`, and
  `syncShowcaseData` writes that over the last known good values for every affected project.
- **Fix:** Skip the update (or keep existing values) when there's no GitHub payload for a repo, and log it.
- **Tests:** `tests/lib/sync/sync-showcase.test.ts`

## BUG-07: An invalid project YAML deletes the project

- **Where:** `src/lib/sync/sync-showcase.ts:39-51` (filtering) and `:135-142` (pruning)
- **What:** `fetchRegistry` drops YAML files that fail schema validation, and the pruning step deletes every DB row whose
  repo isn't in that filtered list. A single typo in a project file (e.g. `submitedBy:`) silently removes that project
  from the site. The existing "registry came back empty" guard shows deletions are meant to be conservative.
- **Fix:** Prune based on the files that _exist_ in `projects/`, not only those that parsed. Report invalid files instead
  of treating them as deleted.
- **Tests:** `tests/lib/sync/sync-showcase.test.ts`

## BUG-08: `repo` isn't validated as `owner/name`

- **Where:** `src/lib/sync/sync-showcase.ts:14` and `:152` / `:209`
- **What:** The YAML schema accepts any string. A value like `just-a-name` is queried as
  `repository(owner: "just-a-name", name: "undefined")` and stored as a project. The value is also interpolated
  unescaped into the GraphQL query, so a `"` in it breaks the whole batch.
- **Fix:** Validate with a regex such as `/^[\w.-]+\/[\w.-]+$/` in `showcaseYamlSchema`.
- **Tests:** `tests/lib/sync/sync-showcase.test.ts`

## BUG-09: `contributions` is never populated

- **Where:** `src/data/stats/get.ts:14,21`, `src/lib/sync/sync-leaderboard.ts:154-180` (`persistUser`)
- **What:** `getGithubStats()` sums `GithubStats.contributions` into `totalContributions`, but no code ever writes that
  column (it keeps its default of 0). `totalContributions` is therefore always 0.
- **Fix:** Fetch and store a contributions total in the sync (e.g. `contributionCalendar.totalContributions`), or drop
  the column and the field.
- **Tests:** `tests/lib/sync/sync-leaderboard.test.ts`

## BUG-10: A failed admin sync locks the panel

- **Where:** `src/components/admin/sync-panel.tsx:68-76,89`
- **What:** The `!res.ok` branch `return`s inside the `try` before `setRunning(null)` runs. After any non-2xx response,
  every Run button stays disabled until the page is reloaded.
- **Fix:** Reset `running` in a `finally` block.
- **Tests:** `tests/components/admin/sync-panel.test.tsx`

## BUG-11: `validate-author` crashes on large ids

- **Where:** `src/app/api/blog/validate-author/route.ts:14-19`
- **What:** `/^\d+$/` accepts any digit string, but `githubId` is an INT4 column. A value such as `99999999999` makes
  Prisma throw ("Unable to fit integer value … into an INT4"), so the route returns a 500 instead of a 404 or 400.
- **Fix:** Reject values above `2_147_483_647` with a 400, or treat them as "not found".
- **Tests:** `tests/app/api/blog/validate-author/route.test.ts`

## BUG-12: Counts near a million show as `1000k`

- **Where:** `src/components/showcase/showcase-card.tsx:15-18` (`formatCount`)
- **What:** `(999_999 / 1000).toFixed(1)` is `"1000.0"`, so the card shows `1000k`. There's no `M` tier either:
  1,500,000 shows as `1500k`.
- **Fix:** Add a million tier and round before choosing the unit, or use `Intl.NumberFormat` with `notation: "compact"`.
- **Tests:** `tests/components/showcase/showcase-card.test.tsx`

## BUG-13: OAuth scopes are requested twice

- **Where:** `src/lib/auth.ts:58`
- **What:** Better Auth's GitHub provider already requests `read:user user:email`, and the `scope` option _appends_ to
  those defaults. The authorize URL therefore carries `scope=read:user user:email read:user user:email`. GitHub tolerates
  it, but the option is redundant.
- **Fix:** Remove the `scope` option, or set `disableDefaultScope: true` if the explicit list should be authoritative.
- **Tests:** `tests/app/api/auth/[...all]/route.test.ts`

## BUG-14: Code block title icons never render

- **Where:** `src/components/blog/mdx-code-title.tsx:63-64`
- **What:** rehype-pretty-code emits `<figcaption data-rehype-pretty-code-title="">index.ts</figcaption>`, so the
  attribute is always empty and the filename is in `children`. The component derives the extension from the attribute,
  so `EXT_MAP` never matches and no language icon is ever shown.
- **Fix:** Derive the filename from `children` (they're plain text here).
- **Tests:** `tests/components/blog/mdx-code-title.test.tsx`

## BUG-15: An empty period hides the leaderboard tabs

- **Where:** `src/components/leaderboard/table-client.tsx:46`
- **What:** When the selected period has no entries, the component returns `<EmptyState />` _instead of_ the whole UI,
  `PeriodSelector` included. Clicking "This Week" early on a Monday (before the first sync) leaves visitors no way to
  switch back. If the current month is empty, the weekly and last-year tables can't be reached at all.
- **Fix:** Always render `PeriodSelector`, and show `EmptyState` in place of the table only.
- **Tests:** `tests/components/leaderboard/table-client.test.tsx`

---

## Documentation inconsistencies (no test)

- `.env.example:41` says the rate limit is "10/min + 5000/month". The code (`rate-limit.ts`), the OpenAPI document and
  the API docs page all say **20/min + 500/day**.
- `src/app/api-docs/page.tsx:183` describes a 429 as exceeding "the per-minute or **monthly** limit". The second limit
  is daily.
- `CLAUDE.md` mentions `scripts/pr-checks.ts`, which doesn't exist.
