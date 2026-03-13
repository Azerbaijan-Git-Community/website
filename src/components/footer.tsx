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
      <div className="max-w-300 mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-12 mb-8 items-center">
          {/* Brand */}
          <div className="flex items-start flex-col gap-4">
            <Image
              src="/logo.png"
              alt="GitHub Azerbaijan"
              width={160}
              height={60}
              className="h-25 w-auto object-contain invert"
            />
            <p className="text-lo max-w-sm text-sm leading-relaxed">
              A national movement to unite talent, open-source, innovation, and
              digital transformation.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h4 className="font-outfit text-hi mb-4 text-lg font-semibold">
                  {group.title}
                </h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-lo text-sm hover:text-blue transition-colors"
                      >
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
          <p className="text-sm text-dim">
            © 2026 Azerbaijan GitHub Community. Push the future.
          </p>
        </div>
      </div>
    </footer>
  );
}
