// Compile-time drift guards: fail `tsc` when the Zod schemas in `./schemas` and the
// serialized data-layer output diverge. Kept out of `schemas.ts` (mirrored on the docs page).

import type { BlogPostItem, getBlogPost } from "@/data/blog/get";
import type { LeaderboardEntry } from "@/data/leaderboard/get";
import type { ShowcaseProject } from "@/data/showcase/get";
import type { BlogListItemDto, BlogPostDto, LeaderboardEntryDto, ShowcaseProjectDto } from "./schemas";

type BlogPostDetail = NonNullable<Awaited<ReturnType<typeof getBlogPost>>>;

/** Dates become ISO strings once a payload goes through `JSON.stringify`. */
type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};

// Errors unless `A` is assignable to `B`; used in both directions per pair to catch drift either way.
type Extends<A extends B, B> = A;

export type SchemaDriftGuards = [
  Extends<LeaderboardEntryDto, LeaderboardEntry>,
  Extends<LeaderboardEntry, LeaderboardEntryDto>,
  Extends<BlogListItemDto, Serialized<BlogPostItem>>,
  Extends<Serialized<BlogPostItem>, BlogListItemDto>,
  Extends<BlogPostDto, Serialized<BlogPostDetail>>,
  Extends<Serialized<BlogPostDetail>, BlogPostDto>,
  Extends<ShowcaseProjectDto, Serialized<ShowcaseProject>>,
  Extends<Serialized<ShowcaseProject>, ShowcaseProjectDto>,
];
