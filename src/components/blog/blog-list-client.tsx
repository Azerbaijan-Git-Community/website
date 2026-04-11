"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PiClock } from "react-icons/pi";
import type { BlogPostListItem, BlogPostListResponse } from "@/data/blog/get";

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BlogCardClient({
  post,
  authorName,
  authorAvatar,
}: {
  post: BlogPostListItem;
  authorName: string;
  authorAvatar: string;
}) {
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
            <Image src={authorAvatar} alt={authorName} width={24} height={24} className="rounded-full" />
            <span className="text-xs text-dim">{authorName}</span>
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

interface BlogListClientProps {
  initialData: BlogPostListResponse;
  authorMap: Record<number, { name: string; avatar: string }>;
}

export function BlogListClient({ initialData, authorMap }: BlogListClientProps) {
  const [posts, setPosts] = useState(initialData.items);
  const [cursor, setCursor] = useState(initialData.nextCursor);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/blog?cursor=${cursor}`);
      const data = (await res.json()) as BlogPostListResponse;

      setPosts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasMore, isLoading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const getAuthor = (authorId: number) => {
    const author = authorMap[authorId];
    return {
      name: author?.name ?? "Community Member",
      avatar: author?.avatar ?? `https://avatars.githubusercontent.com/u/${authorId}`,
    };
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-lo">No blog posts yet. Be the first to contribute!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const { name, avatar } = getAuthor(post.authorId);
          return <BlogCardClient key={post.id} post={post} authorName={name} authorAvatar={avatar} />;
        })}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-12">
          {isLoading && <div className="size-6 animate-spin rounded-full border-2 border-line border-t-blue" />}
        </div>
      )}
    </>
  );
}
