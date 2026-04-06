import { ImageResponse } from "next/og";
import { PiCalendar, PiClock } from "react-icons/pi";
import { getBlogPosts } from "@/data/blog/get";
import { getOgFonts } from "@/lib/og-fonts";

export const alt = "Developer Blog — Azerbaijan GitHub Community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function Image() {
  const [fonts, data] = await Promise.all([getOgFonts(), getBlogPosts(undefined, 3)]);
  const posts = data.items;

  return new ImageResponse(
    <div
      tw="flex h-full w-full flex-col items-center pt-10 pb-10"
      style={{
        backgroundColor: "#0d1117",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(137,87,229,0.15), transparent 50%), " +
          "radial-gradient(circle at 20% 80%, rgba(46,160,67,0.1), transparent 50%)",
      }}
    >
      {/* Heading */}
      <div tw="mb-1 flex items-center">
        <div tw="mr-4 text-[48px] font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
          Developer
        </div>
        <div
          tw="text-[48px] font-bold"
          style={{
            fontFamily: "Outfit",
            backgroundImage: "linear-gradient(135deg, #58a6ff 0%, #8957e5 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Blog
        </div>
      </div>

      <div tw="mb-8 text-[20px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
        Articles and tutorials from Azerbaijan GitHub Community
      </div>

      {/* Post cards */}
      {posts.length > 0 ? (
        <div tw="flex items-stretch justify-center" style={{ gap: 24 }}>
          {posts.map((post) => (
            <div
              key={post.slug}
              tw="flex flex-col"
              style={{
                background: "rgba(22, 27, 34, 0.8)",
                border: "1px solid rgba(240, 246, 252, 0.1)",
                borderRadius: 16,
                width: 350,
              }}
            >
              {/* Cover image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.title}
                width={350}
                height={175}
                style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, objectFit: "cover" }}
              />

              {/* Body */}
              <div tw="flex flex-col px-5 pt-4 pb-4" style={{ gap: 10 }}>
                <div tw="text-[17px] font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
                  {post.title.length > 50 ? `${post.title.slice(0, 50)}...` : post.title}
                </div>

                <div tw="text-[13px]" style={{ fontFamily: "Inter", color: "#848d97", lineClamp: 2 }}>
                  {post.description.length > 80 ? `${post.description.slice(0, 80)}...` : post.description}
                </div>

                <div tw="h-px w-full" style={{ backgroundColor: "#30363d" }} />

                <div tw="flex items-center justify-between">
                  <div tw="flex items-center" style={{ gap: 4 }}>
                    <PiClock size={12} color="#848d97" />
                    <div tw="text-[12px]" style={{ fontFamily: "Inter", color: "#848d97" }}>
                      {post.readingTime} min read
                    </div>
                  </div>
                  <div tw="flex items-center" style={{ gap: 4 }}>
                    <PiCalendar size={12} color="#848d97" />
                    <div tw="text-[12px]" style={{ fontFamily: "Inter", color: "#848d97" }}>
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div tw="text-[24px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
          No posts yet.
        </div>
      )}
    </div>,
    { ...size, fonts },
  );
}
