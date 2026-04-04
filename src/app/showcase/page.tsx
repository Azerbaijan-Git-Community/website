import type { Metadata } from "next";
import { cacheTag } from "next/cache";
import { cacheLife } from "next/cache";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import { getShowcaseProjects } from "@/data/showcase/get";

export const metadata: Metadata = {
  title: "Showcase | Azerbaijan GitHub Community",
  description:
    "Open-source projects built by Azerbaijan GitHub Community members. Browse tools, libraries, and websites created by our developers.",
  keywords: [
    "Azerbaijan open source projects",
    "GitHub Azerbaijan showcase",
    "Azerbaijan developer projects",
    "open source Azerbaijan",
  ],
  openGraph: {
    title: "Open Source Showcase | Azerbaijan GitHub Community",
    description: "Discover open-source projects built by Azerbaijan GitHub Community members.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Source Showcase | Azerbaijan GitHub Community",
    description: "Discover open-source projects built by Azerbaijan GitHub Community members.",
  },
};

export default async function ShowcasePage() {
  "use cache";
  cacheLife("weeks");
  cacheTag("showcase");

  const projects = await getShowcaseProjects();

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-300 px-8">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
            Community Projects
          </span>
          <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Open Source <span className="text-gradient">Showcase</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-lo">
            {projects.length > 0
              ? `${projects.length} project${projects.length === 1 ? "" : "s"} built by Azerbaijan GitHub Community members.`
              : "Projects built by Azerbaijan GitHub Community members will appear here."}{" "}
            <a
              href="https://github.com/Azerbaijan-Git-Community/showcase#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue transition-colors hover:text-lime"
            >
              Submit your project
            </a>
          </p>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <ShowcaseCard key={project.repo} project={project} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass mx-auto max-w-md rounded-xl p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <p className="text-lg text-lo">No projects yet.</p>
            <a
              href="https://github.com/Azerbaijan-Git-Community/showcase"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-blue transition-colors hover:text-lime"
            >
              Submit your project
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
