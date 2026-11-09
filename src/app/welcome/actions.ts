"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { getUserRanks } from "@/data/leaderboard/get";
import { err, ok } from "@/lib/action-helpers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync/sync-leaderboard";

/**
 * Sync the signed-in member if they've never been synced, so they're on the leaderboard before the
 * hourly run. Anyone already synced just gets their current ranks; GitHub isn't called again.
 */
export async function syncMyStats() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return ok({ signedIn: false as const });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        id: true,
        githubUsername: true,
        banned: true,
        githubStats: { select: { id: true } },
        omicronConnection: { select: { username: true, subscriptionId: true } },
      },
    });
    if (user.banned) return err("Your account is banned from the leaderboard.");

    // A connection without a subscription was ended on Omicron, so it's offered again
    const { omicronConnection } = user;
    const omicronUsername = omicronConnection?.subscriptionId ? omicronConnection.username : null;

    if (!user.githubStats) {
      // ranks: null means the sync failed; the flow still goes on to Omicron
      const synced = await syncUser(user).catch((error: unknown) => {
        console.error("[welcome] first sync failed:", error);
        return false;
      });
      if (!synced) return ok({ signedIn: true as const, ranks: null, omicronUsername });
      // updateTag, not revalidateTag: the next leaderboard visit must already include this member
      updateTag(cacheTags.leaderboard);
    }

    return ok({ signedIn: true as const, ranks: await getUserRanks(user.id), omicronUsername });
  } catch (error) {
    return err(error);
  }
}
