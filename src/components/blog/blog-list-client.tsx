"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBlogPosts, type BlogPostsResponse } from "@/data/blog/get";
import { BlogPostCard } from "./blog-card";

interface BlogListClientProps {
  blogPosts: BlogPostsResponse;
}

export function BlogListClient({ blogPosts }: BlogListClientProps) {
  const [posts, setPosts] = useState(blogPosts.items);
  const [cursor, setCursor] = useState(blogPosts.nextCursor);
  const [hasMore, setHasMore] = useState(blogPosts.hasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return;
    setIsLoading(true);

    try {
      const data = await getBlogPosts(cursor);

      setPosts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to load more blog posts:", error);
    }

    setIsLoading(false);
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
          return <BlogPostCard key={post.id} post={post} />;
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
