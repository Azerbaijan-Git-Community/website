import Link from "next/link";
import { HeroVisual } from "./hero-visual";

export function HeroSection() {
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
            <Link
              href="#join"
              className="inline-flex items-center justify-center rounded-md bg-green px-8 py-4 text-lg font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-lime hover:shadow-[0_0_15px_rgba(46,160,67,0.4)]"
            >
              Start Contributing
            </Link>
            <Link
              href="#about"
              className="inline-flex items-center justify-center rounded-md border border-line px-8 py-4 text-lg font-semibold text-hi transition-all hover:-translate-y-0.5 hover:border-lo hover:bg-overlay"
            >
              View Our Goal
            </Link>
          </div>
        </div>

        <HeroVisual />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="blob"
          style={{
            top: "-10%",
            right: "-5%",
            width: "50vw",
            height: "50vw",
            background: "radial-gradient(circle, rgba(137,87,229,0.3) 0%, rgba(137,87,229,0) 70%)",
          }}
        />
        <div
          className="blob"
          style={{
            bottom: "-20%",
            left: "-10%",
            width: "60vw",
            height: "60vw",
            animationDelay: "-10s",
            background: "radial-gradient(circle, rgba(46,160,67,0.2) 0%, rgba(46,160,67,0) 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
      </div>
    </section>
  );
}
