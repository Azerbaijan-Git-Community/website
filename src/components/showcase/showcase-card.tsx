import * as motion from "motion/react-client";
import { FaNpm } from "react-icons/fa";
import { PiGitPullRequest, PiGithubLogo, PiGlobeSimple, PiScales, PiStar, PiWarningCircle } from "react-icons/pi";
import type { ShowcaseProject } from "@/data/showcase/get";
import { ImageFallback } from "../image-fallback";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function ShowcaseCard({ project, index }: { project: ShowcaseProject; index: number }) {
  const [owner, repoName] = project.repo.split("/");
  const ogFallback = `https://opengraph.githubassets.com/1/${project.repo}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -5 }}
      className="glass flex flex-col overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
    >
      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-overlay">
        <ImageFallback
          src={project.banner ?? ogFallback}
          fallback={ogFallback}
          alt={`${project.repo} banner`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          loading="lazy"
          unoptimized
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Repo name */}
        <div className="min-w-0">
          <span className="truncate text-sm text-dim">{owner} /</span>
          <h3 className="truncate font-outfit text-xl font-bold text-hi">{repoName}</h3>
        </div>

        <div className="flex flex-row items-center justify-between">
          {/* Language */}
          {project.language && (
            <div className="flex items-center gap-1.5 text-sm text-dim">
              <span
                className="inline-block size-3 shrink-0 rounded-full"
                style={{ backgroundColor: project.languageColor ?? "#8b949e" }}
              />
              {project.language}
            </div>
          )}

          {/* Stats */}
          <div className="mt-auto flex items-center gap-4 text-sm text-lo">
            <span className="flex items-center gap-1.5">
              <PiStar className="text-icon-orange" size={16} />
              {formatCount(project.stars)}
            </span>
            <span className="flex items-center gap-1.5">
              <PiWarningCircle className="text-icon-green" size={16} />
              {formatCount(project.openIssues)}
            </span>
            <span className="flex items-center gap-1.5">
              <PiGitPullRequest className="text-icon-purple" size={16} />
              {formatCount(project.openPRs)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
          <span className="flex items-center gap-1 text-xs text-dim">
            {project.license && (
              <>
                <PiScales size={14} />
                {project.license}
              </>
            )}
          </span>

          <div className="flex items-center gap-3">
            <a
              href={`https://github.com/${project.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lo transition-colors hover:text-hi"
              aria-label="View on GitHub"
            >
              <PiGithubLogo size={18} />
            </a>
            {project.npm && (
              <a
                href={`https://www.npmjs.com/package/${project.npm}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lo transition-colors hover:text-[#CB3837]"
                aria-label="View on npm"
              >
                <FaNpm size={20} />
              </a>
            )}
            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lo transition-colors hover:text-hi"
                aria-label="Visit website"
              >
                <PiGlobeSimple size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
