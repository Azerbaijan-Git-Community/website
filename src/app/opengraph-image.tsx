import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PiGithubLogoBold } from "react-icons/pi";
import { getGithubStats } from "@/data/stats/get";
import { getOgFonts } from "@/lib/og-fonts";

export const alt = "Azerbaijan GitHub Community — National 5-Year Target";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const GOAL = 5_000_000;

export default async function Image() {
  const [fonts, stats, logoBuffer] = await Promise.all([
    getOgFonts(),
    getGithubStats(),
    readFile(join(process.cwd(), "public", "logo.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  const totalCommits = stats.totalCommits;
  const calculatedPercentage = Math.min((totalCommits / GOAL) * 100, 100);
  const percentage = Math.max(calculatedPercentage, 1);

  return new ImageResponse(
    <div
      tw="flex h-full w-full flex-col px-16 pt-6 pb-10"
      style={{
        backgroundColor: "#0d1117",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(137,87,229,0.15), transparent 50%), " +
          "radial-gradient(circle at 20% 80%, rgba(46,160,67,0.1), transparent 50%)",
      }}
    >
      {/* Navbar */}
      <div tw="mb-6 flex w-full items-center justify-between">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Logo" height={36} style={{ filter: "invert(1)" }} />

        {/* Nav links */}
        <div tw="flex items-center" style={{ gap: 32 }}>
          <div tw="text-[16px] font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
            Home
          </div>
          <div tw="text-[16px] font-bold" style={{ fontFamily: "Outfit", color: "#8b949e" }}>
            Leaderboard
          </div>
          <div tw="text-[16px] font-bold" style={{ fontFamily: "Outfit", color: "#8b949e" }}>
            Showcase
          </div>
        </div>

        {/* Sign in button */}
        <div
          tw="flex items-center px-4 py-2"
          style={{
            border: "1px solid #30363d",
            borderRadius: 10,
            background: "#161b22",
            gap: 8,
          }}
        >
          <PiGithubLogoBold size={16} color="#f0f6fc" />
          <div tw="text-[14px] font-bold" style={{ fontFamily: "Inter", color: "#f0f6fc" }}>
            Sign in
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div tw="flex flex-1 items-center">
        {/* Left: Hero text */}
        <div tw="flex flex-col" style={{ width: 540 }}>
          <div tw="text-[52px] leading-tight font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
            Push the future of
          </div>
          <div
            tw="text-[52px] leading-tight font-bold"
            style={{
              fontFamily: "Outfit",
              backgroundImage: "linear-gradient(135deg, #58a6ff 0%, #8957e5 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Azerbaijan
          </div>
          <div tw="mt-4 text-[18px] leading-relaxed" style={{ fontFamily: "Inter", color: "#8b949e" }}>
            Uniting talent, expanding open-source, and building national innovation metrics.
          </div>
        </div>

        {/* Right: HeroVisual card */}
        <div
          tw="ml-auto flex flex-col"
          style={{
            width: 500,
            background: "rgba(22, 27, 34, 0.8)",
            border: "1px solid rgba(240, 246, 252, 0.1)",
            borderRadius: 16,
            padding: "32px 36px",
          }}
        >
          <div tw="mb-1 text-[24px] font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
            National 5-Year Target
          </div>
          <div tw="mb-6 text-[15px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
            Growing GitHub Activity
          </div>

          {/* Current vs Goal */}
          <div tw="mb-4 flex items-end justify-between">
            <div tw="flex flex-col">
              <div tw="mb-1 text-[11px] tracking-widest uppercase" style={{ fontFamily: "Inter", color: "#8b949e" }}>
                CURRENT
              </div>
              <div tw="text-[36px] leading-none font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
                {totalCommits.toLocaleString()}
              </div>
            </div>
            <div tw="flex flex-col items-end">
              <div tw="mb-1 text-[11px] tracking-widest uppercase" style={{ fontFamily: "Inter", color: "#8b949e" }}>
                GOAL
              </div>
              <div
                tw="text-[36px] leading-none font-bold"
                style={{
                  fontFamily: "Outfit",
                  backgroundImage: "linear-gradient(135deg, #58a6ff 0%, #8957e5 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {GOAL.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div tw="flex h-4 w-full overflow-hidden" style={{ backgroundColor: "#21262d", borderRadius: 9999 }}>
            <div
              tw="flex h-full"
              style={{
                width: `${percentage}%`,
                background: "linear-gradient(135deg, #2ea043, #3fb950)",
                borderRadius: 9999,
              }}
            />
          </div>

          <div tw="mt-4 text-[13px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
            Increasing GitHub activity directly increases national innovation output.
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
