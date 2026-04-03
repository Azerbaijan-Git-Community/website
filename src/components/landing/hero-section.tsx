import { cacheLife, cacheTag } from "next/cache";
import { getGithubStats } from "@/data/stats/get";
import { SmoothLink } from "../smooth-link";
import { HeroVisual } from "./hero-visual";

export async function HeroSection() {
  "use cache";
  cacheLife("days");
  cacheTag("github-stats");

  const data = await getGithubStats();

  return (
    <section id="hero" className="relative flex min-h-screen items-center overflow-hidden pt-44 pb-32">
      <div className="relative z-10 mx-auto grid w-full max-w-300 grid-cols-1 items-center gap-16 px-8 lg:grid-cols-2">
        <div>
          <span className="mb-6 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
            National Open Source Program
          </span>
          <h1 className="mb-6 font-outfit text-[clamp(3rem,5vw,4.5rem)] leading-[1.2] font-bold tracking-tight">
            Push the future of <span className="text-gradient">Azerbaijan</span>
          </h1>
          <p className="mb-10 max-w-125 text-xl text-lo">
            Uniting talent, expanding open-source, and building national innovation metrics.
          </p>
          <div className="flex flex-wrap gap-4">
            <SmoothLink
              href="#join"
              className="inline-flex items-center justify-center rounded-md bg-green px-8 py-4 text-lg font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-lime hover:shadow-[0_0_15px_rgba(46,160,67,0.4)]"
            >
              Start Contributing
            </SmoothLink>
            <SmoothLink
              href="#about"
              className="inline-flex items-center justify-center rounded-md border border-line px-8 py-4 text-lg font-semibold text-hi transition-all hover:-translate-y-0.5 hover:border-lo hover:bg-overlay"
            >
              View Our Goal
            </SmoothLink>
          </div>
        </div>

        <HeroVisual data={data} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Purple blob */}
        <div className="blob blob-purple absolute -top-[10%] -right-[5%] h-[50vw] w-[50vw]" />
        {/* Green blob */}
        <div className="blob blob-green absolute -bottom-[20%] -left-[10%] h-[60vw] w-[60vw] [animation-delay:-10s]" />
        {/* Grid overlay */}
        <div className="grid-overlay absolute inset-0" />
      </div>
    </section>
  );
}
