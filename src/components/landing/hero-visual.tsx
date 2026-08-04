import { cacheLife, cacheTag } from "next/cache";
import { HeroCounter } from "@/components/landing/hero-counter";
import { getGithubStats } from "@/data/stats/get";

const GOAL = 5_000_000;

export async function HeroVisual() {
  "use cache";
  cacheLife("max");
  cacheTag("github-stats");

  const data = await getGithubStats();
  const current = data?.totalCommits ?? 0;
  const calculatedPercentage = Number(Math.min((current / GOAL) * 100, 100).toFixed(1));
  const progressPercentage = calculatedPercentage < 1 ? 1 : calculatedPercentage;

  return (
    <div
      className="hero-visual glass rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
      style={
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        {
          "--progress": `${progressPercentage}%`,
        } as React.CSSProperties
      }
    >
      <div className="mb-6">
        <h2 className="mb-1 font-outfit text-xl font-bold">National 5-Year Target</h2>
        <p className="text-sm text-lo">Growing GitHub Activity</p>
      </div>

      <div className="mb-3 flex justify-between">
        <div className="flex flex-col">
          <span className="mb-1 text-xs tracking-widest text-lo uppercase">Current</span>
          <HeroCounter target={current} />
        </div>
        <div className="flex flex-col text-right">
          <span className="mb-1 text-xs tracking-widest text-lo uppercase">Goal</span>
          <span className="text-gradient font-outfit text-3xl leading-none font-extrabold">
            {GOAL.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-overlay">
        <div className="progress relative h-full rounded-full bg-linear-135 from-green to-lime">
          <div className="absolute top-0 right-0 bottom-0 w-5 bg-white opacity-50 blur-sm" />
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-lo">
        Increasing GitHub activity directly increases national innovation output.
      </p>
    </div>
  );
}
