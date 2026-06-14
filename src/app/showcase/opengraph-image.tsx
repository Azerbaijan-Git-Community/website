import { ImageResponse } from "next/og";
import { PiGitPullRequest, PiGithubLogo, PiGlobeSimple, PiScales, PiStar, PiWarningCircle } from "react-icons/pi";
import { getShowcaseProjects } from "@/data/showcase/get";
import { getOgFonts } from "@/lib/og-fonts";

export const alt = "Open Source Showcase — Azerbaijan GitHub Community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default async function Image() {
  const [fonts, allProjects] = await Promise.all([getOgFonts(), getShowcaseProjects()]);

  const projects = allProjects.slice(0, 3);

  return new ImageResponse(
    <div
      tw="flex size-full flex-col items-center bg-canvas py-10"
      style={{
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(137,87,229,0.15), transparent 50%), " +
          "radial-gradient(circle at 20% 80%, rgba(46,160,67,0.1), transparent 50%)",
      }}
    >
      {/* Heading */}
      <div tw="mb-1 flex items-center">
        <div tw="mr-4 font-outfit text-[48px] font-bold text-hi">Open Source</div>
        <div tw="bg-linear-[135deg] from-[#58a6ff] to-[#8957e5] bg-clip-text font-outfit text-[48px] font-bold text-transparent">
          Showcase
        </div>
      </div>

      <div tw="mb-8 font-inter text-[20px] text-lo">
        {`${allProjects.length} project${allProjects.length === 1 ? "" : "s"} by Azerbaijan GitHub Community`}
      </div>

      {/* Project cards */}
      {projects.length > 0 ? (
        <div tw="flex items-stretch justify-center gap-6">
          {projects.map((project) => {
            const [owner, repoName] = project.repo.split("/");
            const ogFallback = `https://opengraph.githubassets.com/1/${project.repo}`;

            return (
              <div
                key={project.repo}
                tw="flex w-87.5 flex-col rounded-4xl border border-solid border-[rgba(240,246,252,0.1)] bg-[rgba(22,27,34,0.8)]"
              >
                {/* Banner — 350×175 keeps ~2:1 aspect ratio of GitHub OG images */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.banner ?? ogFallback}
                  alt={project.repo}
                  width={350}
                  height={175}
                  tw="rounded-t-4xl"
                />

                {/* Body */}
                <div tw="flex flex-col gap-3.5 px-5 pt-4 pb-4">
                  {/* Repo name */}
                  <div tw="flex flex-col">
                    <div tw="font-inter text-[13px] text-dim">{`${owner} /`}</div>
                    <div tw="font-outfit text-[19px] font-bold text-hi">{repoName}</div>
                  </div>

                  {/* Language + Stats row */}
                  <div tw="flex items-center justify-between">
                    {/* Language */}
                    {project.language ? (
                      <div tw="flex items-center">
                        <div
                          tw="mr-2 size-3 rounded-[50%]"
                          style={{ backgroundColor: project.languageColor ?? "#8b949e" }}
                        />
                        <div tw="font-inter text-[13px] text-dim">{project.language}</div>
                      </div>
                    ) : (
                      <div />
                    )}

                    {/* Stats */}
                    <div tw="flex items-center gap-3">
                      <div tw="flex items-center gap-1">
                        <PiStar size={14} color="#d29922" />
                        <div tw="font-inter text-[13px] text-dim">{formatCount(project.stars)}</div>
                      </div>
                      <div tw="flex items-center gap-1">
                        <PiWarningCircle size={14} color="#3fb950" />
                        <div tw="font-inter text-[13px] text-dim">{formatCount(project.openIssues)}</div>
                      </div>
                      <div tw="flex items-center gap-1">
                        <PiGitPullRequest size={14} color="#8957e5" />
                        <div tw="font-inter text-[13px] text-dim">{formatCount(project.openPRs)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer separator */}
                  <div tw="h-px w-full bg-line" />

                  {/* Footer: License + Links */}
                  <div tw="flex items-center justify-between">
                    <div tw="flex items-center">
                      {project.license ? (
                        <>
                          <PiScales size={14} color="#8b949e" />
                          <div tw="ml-1 font-inter text-[12px] text-dim">{project.license}</div>
                        </>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div tw="flex items-center gap-2.5">
                      <PiGithubLogo size={16} color="#8b949e" />
                      {project.website && <PiGlobeSimple size={16} color="#8b949e" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div tw="font-inter text-[24px] text-lo">No projects yet.</div>
      )}
    </div>,
    { ...size, fonts },
  );
}
