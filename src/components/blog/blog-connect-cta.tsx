import { headers } from "next/headers";
import Link from "next/link";
import { PiNewspaperBold } from "react-icons/pi";
import { OmicronLogo } from "@/components/omicron-logo";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BUTTON =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 font-outfit text-sm font-semibold text-hi transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:border-lo hover:bg-overlay focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";

/** Holds the button's place while the server works out which one to show. */
export function BlogConnectCtaFallback() {
  return (
    <div aria-hidden="true" data-testid="connect-skeleton" className="h-10 w-44 animate-pulse rounded-md bg-surface" />
  );
}

export async function BlogConnectCta() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const connection = await prisma.omicronConnection.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  return connection ? (
    <Link href="/account/blog" className={BUTTON}>
      <PiNewspaperBold className="size-4" />
      Manage my posts
    </Link>
  ) : (
    // oxlint-disable-next-line next/no-html-link-for-pages -- this route redirects off-site, so it must never be prefetched
    <a href="/api/omicron/connect" className={BUTTON}>
      <OmicronLogo />
      Connect Omicron
    </a>
  );
}
