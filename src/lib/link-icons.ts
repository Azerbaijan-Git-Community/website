import type { IconType } from "react-icons";
import { FaDocker, FaNpm, FaPython } from "react-icons/fa";
import { PiArrowSquareOut, PiBookOpenText, PiGithubLogo } from "react-icons/pi";
import {
  SiAnaconda,
  SiApachemaven,
  SiArchlinux,
  SiCocoapods,
  SiDart,
  SiDeno,
  SiElixir,
  SiFirefox,
  SiFlathub,
  SiGo,
  SiGooglechrome,
  SiHomebrew,
  SiJetbrains,
  SiNixos,
  SiNuget,
  SiPhp,
  SiRubygems,
  SiRust,
  SiSnapcraft,
} from "react-icons/si";
import { VscExtensions, VscVscode } from "react-icons/vsc";

// ── URL → icon rules ──────────────────────────────────────────────
// Add an entry to support a new icon. Rules are checked in order and the first match wins.
export type LinkIconDef = { icon: IconType; hoverClass: string; label: string };

/** Every condition set on a rule must match. */
type LinkIconRule = LinkIconDef & {
  /** Host equals this domain or is a subdomain of it, e.g. `npmjs.com` matches `www.npmjs.com`. */
  domain?: string;
  /** Host starts with this label, e.g. `docs` matches `docs.example.com`. */
  subdomain?: string;
  /** First path segment (case-insensitive), e.g. `docs` matches `example.com/docs/intro`. */
  path?: string;
};

const DOCS: LinkIconDef = { icon: PiBookOpenText, hoverClass: "hover:text-hi", label: "Documentation" };

const LINK_ICON_RULES: LinkIconRule[] = [
  { domain: "npmjs.com", icon: FaNpm, hoverClass: "hover:text-[#CB3837]", label: "npm" },
  { domain: "pypi.org", icon: FaPython, hoverClass: "hover:text-[#3776AB]", label: "PyPI" },
  {
    domain: "marketplace.visualstudio.com",
    icon: VscVscode,
    hoverClass: "hover:text-[#0078D4]",
    label: "VSCode Marketplace",
  },
  { domain: "open-vsx.org", icon: VscExtensions, hoverClass: "hover:text-[#C160EF]", label: "Open VSX" },
  { domain: "crates.io", icon: SiRust, hoverClass: "hover:text-[#DEA584]", label: "crates.io" },
  { domain: "rubygems.org", icon: SiRubygems, hoverClass: "hover:text-[#E9573F]", label: "RubyGems" },
  { domain: "nuget.org", icon: SiNuget, hoverClass: "hover:text-[#004880]", label: "NuGet" },
  { domain: "hub.docker.com", icon: FaDocker, hoverClass: "hover:text-[#1D63ED]", label: "Docker Hub" },
  { domain: "pub.dev", icon: SiDart, hoverClass: "hover:text-[#0175C2]", label: "pub.dev" },
  { domain: "pkg.go.dev", icon: SiGo, hoverClass: "hover:text-[#00ACD7]", label: "pkg.go.dev" },
  { domain: "hex.pm", icon: SiElixir, hoverClass: "hover:text-[#4B275F]", label: "hex.pm" },
  { domain: "packagist.org", icon: SiPhp, hoverClass: "hover:text-[#8892BF]", label: "Packagist" },
  { domain: "anaconda.org", icon: SiAnaconda, hoverClass: "hover:text-[#44A833]", label: "Anaconda" },
  { domain: "mvnrepository.com", icon: SiApachemaven, hoverClass: "hover:text-[#C71A36]", label: "Maven" },
  { domain: "cocoapods.org", icon: SiCocoapods, hoverClass: "hover:text-[#EE3322]", label: "CocoaPods" },
  { domain: "jsr.io", icon: SiDeno, hoverClass: "hover:text-[#070707]", label: "JSR" },
  {
    domain: "plugins.jetbrains.com",
    icon: SiJetbrains,
    hoverClass: "hover:text-[#FF318C]",
    label: "JetBrains Marketplace",
  },
  {
    domain: "chromewebstore.google.com",
    icon: SiGooglechrome,
    hoverClass: "hover:text-[#4285F4]",
    label: "Chrome Web Store",
  },
  { domain: "addons.mozilla.org", icon: SiFirefox, hoverClass: "hover:text-[#FF7139]", label: "Firefox Add-ons" },
  { domain: "aur.archlinux.org", icon: SiArchlinux, hoverClass: "hover:text-[#1793D1]", label: "AUR" },
  { domain: "snapcraft.io", icon: SiSnapcraft, hoverClass: "hover:text-[#E95420]", label: "Snap Store" },
  { domain: "flathub.org", icon: SiFlathub, hoverClass: "hover:text-[#4A86CF]", label: "Flathub" },
  { domain: "search.nixos.org", icon: SiNixos, hoverClass: "hover:text-[#5277C3]", label: "NixOS" },
  { domain: "formulae.brew.sh", icon: SiHomebrew, hoverClass: "hover:text-[#FBB040]", label: "Homebrew" },
  { domain: "ghcr.io", icon: PiGithubLogo, hoverClass: "hover:text-hi", label: "GitHub Container Registry" },
  // Generic patterns go last so a registry's own `/docs` page keeps the registry icon.
  { domain: "readthedocs.io", ...DOCS },
  { subdomain: "docs", ...DOCS },
  { subdomain: "doc", ...DOCS },
  { path: "docs", ...DOCS },
  { path: "doc", ...DOCS },
  { path: "documentation", ...DOCS },
];

const FALLBACK_LINK_ICON: LinkIconDef = { icon: PiArrowSquareOut, hoverClass: "hover:text-hi", label: "Link" };

function matches(rule: LinkIconRule, url: URL): boolean {
  const host = url.hostname;
  if (rule.domain && host !== rule.domain && !host.endsWith(`.${rule.domain}`)) return false;
  if (rule.subdomain && !host.startsWith(`${rule.subdomain}.`)) return false;
  if (rule.path && url.pathname.split("/")[1]?.toLowerCase() !== rule.path) return false;
  return true;
}

export function getLinkIcon(url: string): LinkIconDef {
  const parsed = URL.parse(url);
  if (!parsed) return FALLBACK_LINK_ICON;
  return LINK_ICON_RULES.find((rule) => matches(rule, parsed)) ?? FALLBACK_LINK_ICON;
}
