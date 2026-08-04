import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ShowcaseProject = Awaited<ReturnType<typeof getShowcaseProjects>>[number];

export async function getShowcaseProjects() {
  "use cache";
  cacheLife("max");
  cacheTag("showcase");

  return prisma.showcaseProject.findMany({
    omit: { fileSha: true },
    orderBy: { createdAt: "desc" },
  });
}
