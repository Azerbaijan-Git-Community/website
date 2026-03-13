import Image from "next/image";
import Link from "next/link";

const community = [
  { href: "#", label: "About" },
  { href: "#", label: "Regional Chapters" },
  { href: "#", label: "Events Calendar" },
];

const resources = [
  { href: "#", label: "Learning Portal" },
  { href: "#", label: "Perks & Benefits" },
  { href: "#", label: "Open Data API" },
];

const connect = [
  {
    href: "https://www.linkedin.com/company/github-azerbaijan/",
    label: "LinkedIn",
  },
  {
    href: "https://www.instagram.com/azerbaijan_github_community/",
    label: "Instagram",
  },
  { href: "https://t.me/github_azerbaijan", label: "Telegram" },
];

const linkGroups = [
  { title: "Community", links: community },
  { title: "Resources", links: resources },
  { title: "Connect", links: connect },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas pt-12 pb-12">
      <div className="mx-auto max-w-300 px-8">
        <div className="mb-8 grid grid-cols-1 items-center gap-12 md:grid-cols-[2fr_3fr]">
          {/* Brand */}
          <div className="flex flex-col items-start gap-4">
            <Image
              src="/logo.png"
              alt="GitHub Azerbaijan"
              width={160}
              height={60}
              className="h-25 w-auto object-contain invert"
            />
            <p className="max-w-sm text-sm leading-relaxed text-lo">
              A national movement to unite talent, open-source, innovation, and digital transformation.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-4 font-outfit text-lg font-semibold text-hi">{group.title}</h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-lo transition-colors hover:text-blue">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-line pt-6 text-center">
          <p className="text-sm text-dim">© 2026 Azerbaijan GitHub Community. Push the future.</p>
        </div>
      </div>
    </footer>
  );
}
