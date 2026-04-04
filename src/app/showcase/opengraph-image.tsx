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
      tw="flex h-full w-full flex-col items-center pt-10 pb-10"
      style={{
        backgroundColor: "#0d1117",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(137,87,229,0.15), transparent 50%), " +
          "radial-gradient(circle at 20% 80%, rgba(46,160,67,0.1), transparent 50%)",
      }}
    >
      {/* Heading */}
      <div tw="mb-1 flex items-center">
        <div tw="mr-4 text-[48px] font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
          Open Source
        </div>
        <div
          tw="text-[48px] font-bold"
          style={{
            fontFamily: "Outfit",
            backgroundImage: "linear-gradient(135deg, #58a6ff 0%, #8957e5 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Showcase
        </div>
      </div>

      <div tw="mb-8 text-[20px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
        {`${allProjects.length} project${allProjects.length === 1 ? "" : "s"} by Azerbaijan GitHub Community`}
      </div>

      {/* Project cards */}
      {projects.length > 0 ? (
        <div tw="flex items-stretch justify-center" style={{ gap: 24 }}>
          {projects.map((project) => {
            const [owner, repoName] = project.repo.split("/");
            const ogFallback = `https://opengraph.githubassets.com/1/${project.repo}`;

            return (
              <div
                key={project.repo}
                tw="flex flex-col"
                style={{
                  background: "rgba(22, 27, 34, 0.8)",
                  border: "1px solid rgba(240, 246, 252, 0.1)",
                  borderRadius: 16,
                  width: 350,
                }}
              >
                {/* Banner — 350×175 keeps ~2:1 aspect ratio of GitHub OG images */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.banner ?? ogFallback}
                  alt={project.repo}
                  width={350}
                  height={175}
                  style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                />

                {/* Body */}
                <div tw="flex flex-col px-5 pt-4 pb-4" style={{ gap: 14 }}>
                  {/* Repo name */}
                  <div tw="flex flex-col">
                    <div tw="text-[13px]" style={{ fontFamily: "Inter", color: "#848d97" }}>
                      {`${owner} /`}
                    </div>
                    <div tw="text-[19px] font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
                      {repoName}
                    </div>
                  </div>

                  {/* Language + Stats row */}
                  <div tw="flex items-center justify-between">
                    {/* Language */}
                    {project.language ? (
                      <div tw="flex items-center">
                        <div
                          tw="mr-2 h-3 w-3"
                          style={{
                            backgroundColor: project.languageColor ?? "#8b949e",
                            borderRadius: "50%",
                          }}
                        />
                        <div tw="text-[13px]" style={{ fontFamily: "Inter", color: "#848d97" }}>
                          {project.language}
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}

                    {/* Stats */}
                    <div tw="flex items-center" style={{ gap: 12 }}>
                      <div tw="flex items-center" style={{ gap: 4 }}>
                        <PiStar size={14} color="#d29922" />
                        <div tw="text-[13px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
                          {formatCount(project.stars)}
                        </div>
                      </div>
                      <div tw="flex items-center" style={{ gap: 4 }}>
                        <PiWarningCircle size={14} color="#3fb950" />
                        <div tw="text-[13px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
                          {formatCount(project.openIssues)}
                        </div>
                      </div>
                      <div tw="flex items-center" style={{ gap: 4 }}>
                        <PiGitPullRequest size={14} color="#8957e5" />
                        <div tw="text-[13px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
                          {formatCount(project.openPRs)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer separator */}
                  <div tw="h-px w-full" style={{ backgroundColor: "#30363d" }} />

                  {/* Footer: License + Links */}
                  <div tw="flex items-center justify-between">
                    <div tw="flex items-center">
                      {project.license ? (
                        <>
                          <PiScales size={14} color="#8b949e" />
                          <div tw="ml-1 text-[12px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
                            {project.license}
                          </div>
                        </>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div tw="flex items-center" style={{ gap: 10 }}>
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
        <div tw="text-[24px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
          No projects yet.
        </div>
      )}
    </div>,
    { ...size, fonts },
  );
}
