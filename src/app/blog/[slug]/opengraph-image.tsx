import { ImageResponse } from "next/og";
import { PiCalendar, PiClock } from "react-icons/pi";
import { getBlogAuthor, getBlogPost } from "@/data/blog/get";
import { getOgFonts } from "@/lib/og-fonts";

export const alt = "Blog Post — Azerbaijan GitHub Community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;

type Params = Promise<{ slug: string }>;

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function Image({ params }: { params: Params }) {
  const { slug } = await params;
  const [fonts, post] = await Promise.all([getOgFonts(), getBlogPost(slug)]);

  if (!post) {
    return new ImageResponse(
      <div tw="flex h-full w-full items-center justify-center" style={{ backgroundColor: "#0d1117" }}>
        <div tw="text-[48px] font-bold" style={{ fontFamily: "Outfit", color: "#f0f6fc" }}>
          Post not found
        </div>
      </div>,
      { ...size, fonts },
    );
  }

  const author = await getBlogAuthor(post.authorId);
  const authorName = author?.name ?? "Community Member";
  const authorAvatar = author?.image ?? `https://avatars.githubusercontent.com/u/${post.authorId}`;

  return new ImageResponse(
    <div
      tw="flex h-full w-full flex-col justify-between px-16 pt-12 pb-10"
      style={{
        backgroundColor: "#0d1117",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(137,87,229,0.15), transparent 50%), " +
          "radial-gradient(circle at 20% 80%, rgba(46,160,67,0.1), transparent 50%)",
      }}
    >
      {/* Top: community label */}
      <div tw="flex items-center">
        <div
          tw="rounded-full px-4 py-1.5 text-[14px]"
          style={{
            fontFamily: "Inter",
            color: "#8b949e",
            background: "rgba(48, 54, 61, 0.5)",
            border: "1px solid #30363d",
          }}
        >
          Azerbaijan GitHub Community Blog
        </div>
      </div>

      {/* Middle: title */}
      <div tw="flex flex-col" style={{ gap: 16 }}>
        <div
          tw="text-[52px] font-bold leading-tight"
          style={{ fontFamily: "Outfit", color: "#f0f6fc" }}
        >
          {post.title.length > 70 ? `${post.title.slice(0, 70)}...` : post.title}
        </div>

        <div tw="text-[20px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
          {post.description.length > 120 ? `${post.description.slice(0, 120)}...` : post.description}
        </div>
      </div>

      {/* Bottom: author + meta */}
      <div tw="flex items-center justify-between">
        <div tw="flex items-center" style={{ gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={authorAvatar}
            alt={authorName}
            width={44}
            height={44}
            style={{ borderRadius: "50%" }}
          />
          <div tw="text-[18px] font-bold" style={{ fontFamily: "Inter", color: "#f0f6fc" }}>
            {authorName}
          </div>
        </div>

        <div tw="flex items-center" style={{ gap: 24 }}>
          <div tw="flex items-center" style={{ gap: 6 }}>
            <PiCalendar size={18} color="#8b949e" />
            <div tw="text-[16px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
              {formatDate(post.createdAt)}
            </div>
          </div>
          <div tw="flex items-center" style={{ gap: 6 }}>
            <PiClock size={18} color="#8b949e" />
            <div tw="text-[16px]" style={{ fontFamily: "Inter", color: "#8b949e" }}>
              {post.readingTime} min read
            </div>
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
