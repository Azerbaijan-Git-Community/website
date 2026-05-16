"use client";

import Image from "next/image";
import Link from "next/link";
import { PiClock } from "react-icons/pi";
import { BlogPostListItem } from "@/data/blog/get";
import { formatDate } from "@/lib/utils.client";

export function BlogPostCard({ post }: { post: BlogPostListItem }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass flex flex-col overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-transform duration-150 ease-out hover:-translate-y-1.5"
    >
      {/* Cover image */}
      <div className="relative h-44 w-full overflow-hidden bg-overlay">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 font-outfit text-xl font-bold text-hi">{post.title}</h3>
        <p className="line-clamp-2 text-sm text-lo">{post.description}</p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <Image
              src={post.author.image}
              alt={post.author.name}
              width={24}
              height={24}
              className="rounded-full"
              unoptimized
            />
            <span className="text-xs text-dim">{post.author.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs text-dim">
              <PiClock size={14} />
              {post.readingTime} min read
            </span>
            <span className="text-xs text-dim">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
