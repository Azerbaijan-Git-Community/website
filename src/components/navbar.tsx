import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "#about", label: "About" },
  { href: "#impact", label: "Impact" },
  { href: "#perks", label: "Perks" },
  { href: "#roadmap", label: "Roadmap" },
];

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full h-20 z-50 flex items-center border-b border-line bg-[rgba(13,17,23,0.8)] backdrop-blur-md">
      <div className="w-full max-w-300 mx-auto px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="GitHub Azerbaijan"
            width={120}
            height={40}
            className="h-auto max-h-17.5 w-auto py-3 invert"
            priority
          />
        </Link>

        {/* Nav links — hidden on mobile */}
        <div className="hidden md:flex gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium font-outfit text-hi hover:text-blue transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="#join"
          className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold text-white bg-green hover:bg-lime hover:shadow-[0_0_15px_rgba(46,160,67,0.4)] transition-all hover:-translate-y-0.5"
        >
          Join the Movement
        </Link>
      </div>
    </nav>
  );
}
