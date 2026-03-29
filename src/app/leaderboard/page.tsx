import { cacheLife } from "next/cache";
import { PodiumClient } from "@/components/leaderboard/podium-client";
import { TableClient } from "@/components/leaderboard/table-client";
import { getAvailableMonths, getCurrentMonthKey, getPodiumData, getTableData } from "@/data/leaderboard/get";

export default async function LeaderboardPage() {
  "use cache";
  cacheLife("hours");

  const [currentMonthKey, availableMonths, tableData, podiumData] = await Promise.all([
    getCurrentMonthKey(),
    getAvailableMonths(),
    getTableData(),
    getPodiumData(),
  ]);

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-300 px-8">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
            Community Rankings
          </span>
          <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Monthly <span className="text-gradient">Leaderboard</span>
          </h1>
          <h2 className="mx-auto mb-8 max-w-2xl text-xl text-lo">
            Celebrating our top contributors pushing Azerbaijan&apos;s open-source future forward.
          </h2>
        </div>

        <div className="mb-16">
          <PodiumClient allData={podiumData} currentMonthKey={currentMonthKey} availableMonths={availableMonths} />
        </div>

        <TableClient allData={tableData} currentMonthKey={currentMonthKey} />
      </div>
    </div>
  );
}
