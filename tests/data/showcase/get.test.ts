import { cacheTag } from "next/cache";
import { describe, expect, test } from "vitest";
import { getShowcaseProjects } from "@/data/showcase/get";
import { createShowcaseProject } from "@test/db";

describe("getShowcaseProjects", () => {
  test("lists projects newest first", async () => {
    await createShowcaseProject({ repo: "a/old", createdAt: new Date("2026-01-01T00:00:00Z") });
    await createShowcaseProject({ repo: "a/new", createdAt: new Date("2026-03-01T00:00:00Z") });
    await createShowcaseProject({ repo: "a/mid", createdAt: new Date("2026-02-01T00:00:00Z") });

    const projects = await getShowcaseProjects();

    expect(projects.map((p) => p.repo)).toEqual(["a/new", "a/mid", "a/old"]);
  });

  test("breaks createdAt ties deterministically by id", async () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const first = await createShowcaseProject({ repo: "a/one", createdAt });
    const second = await createShowcaseProject({ repo: "a/two", createdAt });

    const ids = (await getShowcaseProjects()).map((p) => p.id);

    expect(ids).toEqual([first.id, second.id].toSorted().toReversed());
  });

  test("hides the registry file SHA", async () => {
    await createShowcaseProject({ links: ["https://npmjs.com/x"] });

    const [project] = await getShowcaseProjects();

    expect(project).not.toHaveProperty("fileSha");
    expect(project.links).toEqual(["https://npmjs.com/x"]);
  });

  test("is cached under the showcase tag", async () => {
    await getShowcaseProjects();
    expect(cacheTag).toHaveBeenCalledWith("showcase");
  });
});
