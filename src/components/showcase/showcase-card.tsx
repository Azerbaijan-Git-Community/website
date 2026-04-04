import * as motion from "motion/react-client";
import { PiGitPullRequest, PiGithubLogo, PiGlobeSimple, PiScales, PiStar, PiWarningCircle } from "react-icons/pi";
import type { ShowcaseProject } from "@/data/showcase/get";
import { getLinkIcon } from "@/lib/link-icons";
import { ImageFallback } from "../image-fallback";

function hexToRgba(hex: string | null | undefined, alpha: number): string {
  if (!hex || hex.length < 7) return `rgba(139,148,158,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

// ── Domain → icon registry ────────────────────────────────────────
// Add a new entry here to support a new registry or marketplace.
// The icon is picked automatically from the link URL — no user input needed.
type LinkIconDef = { icon: IconType; hoverClass: string; label: string };

const DOMAIN_ICONS: Array<{ pattern: RegExp } & LinkIconDef> = [
  { pattern: /npmjs\.com/, icon: FaNpm, hoverClass: "hover:text-[#CB3837]", label: "npm" },
  { pattern: /pypi\.org/, icon: FaPython, hoverClass: "hover:text-[#3776AB]", label: "PyPI" },
  {
    pattern: /marketplace\.visualstudio\.com/,
    icon: VscExtensions,
    hoverClass: "hover:text-[#0078D4]",
    label: "VS Code Marketplace",
  },
  { pattern: /crates\.io/, icon: SiRust, hoverClass: "hover:text-[#DEA584]", label: "crates.io" },
  { pattern: /rubygems\.org/, icon: SiRubygems, hoverClass: "hover:text-[#E9573F]", label: "RubyGems" },
  { pattern: /nuget\.org/, icon: SiNuget, hoverClass: "hover:text-[#004880]", label: "NuGet" },
  { pattern: /hub\.docker\.com/, icon: FaDocker, hoverClass: "hover:text-[#1D63ED]", label: "Docker Hub" },
];

const FALLBACK_LINK_ICON: LinkIconDef = { icon: PiArrowSquareOut, hoverClass: "hover:text-hi", label: "Link" };

function getLinkIcon(url: string): LinkIconDef {
  return DOMAIN_ICONS.find(({ pattern }) => pattern.test(url)) ?? FALLBACK_LINK_ICON;
}

export function ShowcaseCard({ project, index }: { project: ShowcaseProject; index: number }) {
  const [owner, repoName] = project.repo.split("/");
  const ogFallback = `https://opengraph.githubassets.com/1/${project.repo}`;
  const links = project.links ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] } }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.15, delay: 0, ease: "easeOut" }}
      whileHover={{
        y: -5,
        boxShadow: `0 8px 32px rgba(0,0,0,0.2), 0 0 24px ${hexToRgba(project.languageColor, 0.3)}`,
        transition: { duration: 0.1, delay: 0, ease: "easeOut" },
      }}
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

            {links.map((url) => {
              const { icon: Icon, hoverClass, label } = getLinkIcon(url);
              return (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-lo transition-colors ${hoverClass}`}
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              );
            })}

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
