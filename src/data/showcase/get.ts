"use server";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ShowcaseProject as PrismaShowcaseProject } from "@/generated/prisma/client";

export type ShowcaseProject = PrismaShowcaseProject;

export async function getShowcaseProjects(): Promise<ShowcaseProject[]> {
  "use cache";
  cacheLife("weeks");
  cacheTag("showcase");

  return prisma.showcaseProject.findMany({
    orderBy: { addedAt: "desc" },
  });
}
