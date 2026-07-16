import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ShowcaseProject as PrismaShowcaseProject } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ShowcaseProject = PrismaShowcaseProject;

export async function getShowcaseProjects(): Promise<ShowcaseProject[]> {
  "use cache";
  cacheLife("weeks");
  cacheTag("showcase");

  return prisma.showcaseProject.findMany({
    orderBy: { createdAt: "desc" },
  });
}
