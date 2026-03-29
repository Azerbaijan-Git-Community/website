import * as motion from "motion/react-client";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { MonthSelector } from "@/components/leaderboard/month-selector";
import { PodiumClient } from "@/components/leaderboard/podium-client";
import { TableClient } from "@/components/leaderboard/table-client";
import { LeaderboardTabs } from "@/components/leaderboard/tabs";
import { getAvailableMonths, getMonthlyLeaderboard } from "@/data/leaderboard/get";

export default async function LeaderboardPage() {
  "use cache";
  cacheLife("hours");

  const now = new Date();
  const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const availableMonths = await getAvailableMonths();
  const initialData = await getMonthlyLeaderboard(currentMonthKey);

  const podiumData = initialData.slice(0, 3);
  const tableData = initialData;

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-300 px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
            Community Rankings
          </span>
          <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Monthly <span className="text-gradient">Leaderboard</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-lo">
            Celebrating our top contributors pushing Azerbaijan&apos;s open-source future forward.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <Suspense fallback={<div className="mx-auto h-13 max-w-xs animate-pulse rounded-lg bg-surface" />}>
            <MonthSelector months={availableMonths} currentMonthKey={currentMonthKey} />
          </Suspense>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-surface" />}>
            <PodiumClient initialData={podiumData} currentMonthKey={currentMonthKey} />
          </Suspense>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense
            fallback={
              <div className="mb-8 flex justify-center">
                <div className="h-13 w-75 animate-pulse rounded-lg bg-surface" />
              </div>
            }
          >
            <LeaderboardTabs />
          </Suspense>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<div className="h-110 animate-pulse rounded-xl bg-surface" />}>
            <TableClient initialData={tableData} currentMonthKey={currentMonthKey} />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
