// Compile-time drift guards between the hand-written Zod schemas in `./schemas` and what
// the data layer actually returns once serialized to JSON.
//
// Kept out of `schemas.ts` on purpose: that file's contents are mirrored on the public API
// docs page, so it stays free of internal machinery. Nothing here emits runtime code — the
// whole module erases at compile time, and it exists only to fail `tsc` when a Prisma
// column, a data-layer select, or a schema field changes without the other side following.

import type { BlogPostItem, getBlogPost } from "@/data/blog/get";
import type { LeaderboardEntry } from "@/data/leaderboard/get";
import type { ShowcaseProject } from "@/data/showcase/get";
import type { BlogListItemDto, BlogPostDto, LeaderboardEntryDto, ShowcaseProjectDto } from "./schemas";

type BlogPostDetail = NonNullable<Awaited<ReturnType<typeof getBlogPost>>>;

/** Dates become ISO strings once a payload goes through `JSON.stringify`. */
type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};

/**
 * Errors unless `A` is assignable to `B`. Each pair is listed in both directions, so
 * neither side can gain or lose a field without the other following. The constraint has to
 * be written out at each use site — routing it through a `SameShape<A, B>` alias makes the
 * generic unresolvable to the checker.
 */
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
