import Link from "next/link";
import { HeroVisual } from "./hero-visual";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-44 pb-32 overflow-hidden"
    >
      {/* Content */}
      <div className="relative z-10 w-full max-w-300 mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full border border-line text-sm font-medium text-lo bg-[rgba(48,54,61,0.5)] mb-6">
            National Open Source Program
          </span>
          <h1 className="font-outfit text-[clamp(3rem,5vw,4.5rem)] font-bold leading-[1.2] tracking-tight mb-6">
            Push the future of <span className="text-gradient">Azerbaijan</span>
          </h1>
          <p className="text-xl text-lo mb-10 max-w-125">
            Uniting talent, expanding open-source, and building national
            innovation metrics.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#join"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-md text-white bg-green hover:bg-lime hover:shadow-[0_0_15px_rgba(46,160,67,0.4)] transition-all hover:-translate-y-0.5"
            >
              Start Contributing
            </Link>
            <Link
              href="#about"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-md border border-line text-hi hover:border-lo hover:bg-overlay transition-all hover:-translate-y-0.5"
            >
              View Our Goal
            </Link>
          </div>
        </div>

        {/* Progress Visual — client island for animation */}
        <HeroVisual />
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="blob"
          style={{
            top: "-10%",
            right: "-5%",
            width: "50vw",
            height: "50vw",
            background:
              "radial-gradient(circle, rgba(137,87,229,0.3) 0%, rgba(137,87,229,0) 70%)",
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
            background:
              "radial-gradient(circle, rgba(46,160,67,0.2) 0%, rgba(46,160,67,0) 70%)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
      </div>
    </section>
  );
}
