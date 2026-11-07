import { headers } from "next/headers";
import { OmicronLogo } from "@/components/omicron-logo";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Only for a signed-in member with no connection. Everyone else sees nothing here. */
export async function BlogConnectCta() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const connection = await prisma.omicronConnection.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (connection) return null;

  return (
    // oxlint-disable-next-line next/no-html-link-for-pages -- this route redirects off-site, so it must never be prefetched
    <a
      href="/api/omicron/connect"
      className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 font-outfit text-sm font-semibold text-hi transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:border-lo hover:bg-overlay focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
    >
      <OmicronLogo />
      Connect Omicron
    </a>
  );
}
