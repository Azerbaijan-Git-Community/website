"use client";

import type { AllTableData } from "@/data/leaderboard/get";
import { authClient } from "@/lib/auth-client";
import { TableClient } from "./table-client";

// The page is cached for everyone, so the viewer is only known on the client.
export function LeaderboardTable({ allData }: { allData: AllTableData }) {
  const { data } = authClient.useSession();
  return <TableClient allData={allData} currentUserId={data?.user.id} />;
}
