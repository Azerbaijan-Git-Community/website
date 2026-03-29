# CLAUDE.md

This file primarily provides guidance to Claude Code (claude.ai/code), but also serves as the single source of truth for other AI assistants (GitHub Copilot, Cursor, Gemini, Antigravity, and others) when working with code in this repository.

@AGENTS.md

**Your Next.js and HeroUI v3 knowledge is outdated.** AGENTS.md is the single source of truth — always read the relevant docs there before writing or editing any Next.js or HeroUI code. Next.js Cache Components (`cacheComponents`) is enabled; read the Next.js docs from `node_modules/next/dist/docs/` for correct `"use cache"` usage.

## Project Overview

Azerbaijan GitHub Community website — a Next.js 16 app with a landing page and a leaderboard tracking GitHub contributions. Users authenticate via GitHub OAuth, and a cron job syncs their GitHub stats (commits, PRs, repos, followers) into weekly/monthly/all-time snapshots.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — generate Prisma client + Next.js production build
- `pnpm lint` — run ESLint
- `pnpm format:check` / `pnpm format:fix` — check/fix Prettier formatting
- `pnpm checks` — run full PR check suite (tsc, prettier, eslint, next build)
- `pnpm prisma:generate` — regenerate Prisma client after schema changes

There are no tests in this project.

## Architecture

### Stack

- **Next.js 16** with React 19, React Compiler enabled, Cache Components enabled, typed routes
- **HeroUI v3** component library + **Tailwind CSS v4** (design tokens in `src/app/globals.css`)
- **Prisma 7** with PostgreSQL (via `@prisma/adapter-pg` for connection pooling)
- **Better-Auth** for GitHub OAuth authentication
- **Framer Motion** (`motion` package) for animations

### Key Directories

- `src/app/` — Next.js App Router pages and API routes
- `src/components/landing/` — landing page section components
- `src/components/leaderboard/` — leaderboard UI (podium, table, period/month selectors)
- `src/data/` — server-side data fetching functions with `"use cache"` and `cacheLife("hours")`
- `src/lib/` — auth config, Prisma client, env validation (Zod), fonts, action helpers
- `prisma/schema.prisma` — database schema
- `scripts/pr-checks.ts` — pre-publish CI check runner

### Data Flow

1. **Cron sync** (`POST /api/cron/sync-github`): fetches GitHub GraphQL API for all users, upserts `GithubStats` (all-time) and `GithubStatsSnapshot` (weekly/monthly), then revalidates cache tags `github-stats` and `leaderboard`.
2. **Leaderboard** (`src/data/leaderboard/get.ts`): server-cached queries return `AllTableData` (weekly, monthly, allTime arrays) and podium data (top 3 per month).
3. **Stats** (`src/data/stats/get.ts`): aggregated community totals shown on the landing page hero.

### Auth

Better-Auth with Prisma adapter. Config in `src/lib/auth.ts`, client in `src/lib/auth-client.ts`. GitHub OAuth maps `profile.login` to a custom `githubUsername` field on User. Sessions stored in DB with 30-day expiry.

### Environment Variables

All validated with Zod in `src/lib/env.server.ts` and `src/lib/env.client.ts`. See `.env.example` for the full list. Key vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GH_STATS_TOKEN`, `CRON_SECRET`.

### Caching Pattern

Data functions use Next.js `"use cache"` directive with `cacheLife("hours")` and `cacheTag()` for on-demand revalidation. The cron sync endpoint calls `revalidateTag()` after updating stats.

### Server Action Results

Use the `ok<T>()` / `err()` helpers from `src/lib/action-helpers.ts` returning a discriminated union `ActionResult<T>`.

## Conventions

- **TypeScript only** — all source files must be `.ts` or `.tsx`
- **HeroUI v3** is the primary UI library. Always consult AGENTS.md for docs before using any component. Never use v2 patterns.
- **Icons**: use `react-icons` library
- **Tailwind CSS v4** for all styling — avoid inline styles and external CSS except `globals.css`
- **Server-first data fetching**: always explore server-side rendering strategies first. Use `"use cache"` with `cacheLife("hours")` for ISR. SWR is available as a dependency but only use it when you truly need client-side fetching. Prefer Server Components and server-side data loading over client-side fetching.
- **State management**: prefer `useState` for local state. `nuqs` is installed for URL search param state if needed in the future — use it (not another package) when URL state is required.
- **Composition over configuration**: prefer compound components, context providers, and explicit variants over boolean prop proliferation
- **`cacheComponents`** and **React Compiler** are enabled in `next.config.ts` — follow `"use cache"` directive and compiler boundary rules, check AGENTS.md for nextjs docs.
- Prettier enforces 120-char line width, Tailwind class sorting, and organized imports (see `.prettierrc` for import order groups)
- Path alias: `@/*` maps to `./src/*`
- Dark theme by default (canvas background `#0d1117`)
- Run `pnpm checks` before commits

### Skill References

Read these before writing/editing components:
- `.agents/skills/next-cache-components/SKILL.md` — caching, partial prerendering
- `.agents/skills/heroui-react/SKILL.md` — HeroUI best practices
- `.agents/skills/vercel-composition-patterns/AGENTS.md` — composition patterns
- `.agents/skills/vercel-react-best-practices/AGENTS.md` — React performance
