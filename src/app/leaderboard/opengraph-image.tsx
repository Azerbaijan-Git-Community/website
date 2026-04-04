import { ImageResponse } from "next/og";
import { getCurrentMonthKey, getPodiumData } from "@/data/leaderboard/get";
import { getOgFonts } from "@/lib/og-fonts";

export const alt = "Monthly Leaderboard — Azerbaijan GitHub Community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const PODIUM_ORDER = [1, 0, 2] as const;

const MEDAL_CONFIG = [
  { ring: "#FFD700", label: "Champion", avatarSize: 110, isFirst: true },
  { ring: "#C0C0C0", label: "2nd Place", avatarSize: 90, isFirst: false },
  { ring: "#CD7F32", label: "3rd Place", avatarSize: 90, isFirst: false },
] as const;

function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function Image() {
  const [fonts, podiumData, currentMonth] = await Promise.all([getOgFonts(), getPodiumData(), getCurrentMonthKey()]);

  const months = Object.keys(podiumData).sort().reverse();
  const month = podiumData[currentMonth]?.length
    ? currentMonth
    : (months.find((m) => m < currentMonth) ?? months[0] ?? currentMonth);
  const entries = podiumData[month] ?? [];

  return new ImageResponse(
    <div
      tw="flex h-full w-full flex-col items-center justify-center"
      style={{
        backgroundColor: "#0d1117",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(137,87,229,0.15), transparent 50%), " +
          "radial-gradient(circle at 20% 80%, rgba(46,160,67,0.1), transparent 50%)",
      }}
    >
      {/* Heading */}
      <div tw="mb-1 flex items-center">
        <div tw="mr-4 text-[56px] font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
          Monthly
        </div>
        <div
          tw="text-[56px] font-bold"
          style={{
            fontFamily: "Outfit",
            backgroundImage: "linear-gradient(135deg, #58a6ff 0%, #8957e5 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Leaderboard
        </div>
      </div>

      <div tw="mb-8 text-[22px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
        {formatMonth(month)}
      </div>

      {/* Podium cards */}
      {entries.length >= 3 ? (
        <div tw="flex items-end justify-center" style={{ gap: 28 }}>
          {PODIUM_ORDER.map((idx) => {
            const entry = entries[idx];
            const config = MEDAL_CONFIG[idx];
            return (
              <div
                key={entry.username}
                tw="flex flex-col items-center px-10 py-7"
                style={{
                  background: "rgba(22, 27, 34, 0.8)",
                  border: "1px solid rgba(240, 246, 252, 0.1)",
                  borderRadius: 16,
                  width: config.isFirst ? 340 : 300,
                  marginBottom: config.isFirst ? 0 : 24,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Gold top accent bar */}
                {config.isFirst && (
                  <div
                    tw="absolute top-0 right-0 left-0 h-1"
                    style={{ background: "linear-gradient(90deg, #58a6ff, #8957e5)" }}
                  />
                )}

                {/* Avatar */}
                <div
                  tw="mb-4 flex"
                  style={{
                    borderRadius: "50%",
                    border: `4px solid ${config.ring}`,
                    overflow: "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.image ?? `https://github.com/${entry.username}.png?size=200`}
                    alt={entry.username}
                    width={config.avatarSize}
                    height={config.avatarSize}
                    style={{ borderRadius: "50%" }}
                  />
                </div>

                {/* Username */}
                <div
                  tw={`mb-1 font-bold ${config.isFirst ? "text-[24px]" : "text-[20px]"}`}
                  style={{ fontFamily: "Outfit", color: "#f0f6fc" }}
                >
                  {entry.username}
                </div>

                {/* Medal label */}
                <div
                  tw="mb-4 text-[15px]"
                  style={{
                    fontFamily: "Inter",
                    ...(config.isFirst
                      ? {
                          backgroundImage: "linear-gradient(135deg, #58a6ff 0%, #8957e5 100%)",
                          backgroundClip: "text",
                          color: "transparent",
                        }
                      : { color: "#8b949e" }),
                  }}
                >
                  {config.label}
                </div>

                {/* Commits box */}
                <div
                  tw="flex w-full flex-col items-center px-5 py-3"
                  style={{
                    background: "rgba(13, 17, 23, 0.5)",
                    border: "1px solid #30363d",
                    borderRadius: 12,
                  }}
                >
                  <div tw="mb-1 text-[12px] tracking-wider uppercase" style={{ fontFamily: "Inter", color: "#8b949e" }}>
                    COMMITS
                  </div>
                  <div
                    tw={`font-bold ${config.isFirst ? "text-[36px]" : "text-[28px]"}`}
                    style={{ fontFamily: "Outfit", color: "#3fb950" }}
                  >
                    {entry.commits.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div tw="text-[24px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
          No leaderboard data yet.
        </div>
      )}
    </div>,
    { ...size, fonts },
  );
}
