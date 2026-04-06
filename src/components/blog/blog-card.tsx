import * as motion from "motion/react-client";
import Image from "next/image";
import Link from "next/link";
import { getBlogAuthor } from "@/data/blog/get";
import { ReadingTimeBadge } from "./reading-time-badge";

interface BlogCardProps {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  authorId: number;
  readingTime: number;
  createdAt: string | Date;
  index: number;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function BlogCard({ slug, title, description, coverImage, authorId, readingTime, createdAt, index }: BlogCardProps) {
  const author = await getBlogAuthor(authorId);
  const authorName = author?.name ?? "Community Member";
  const authorAvatar = author?.image ?? `https://avatars.githubusercontent.com/u/${authorId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] } }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.15, delay: 0, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.1, delay: 0, ease: "easeOut" } }}
      className="glass flex flex-col overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
    >
      <Link href={`/blog/${slug}`} className="flex flex-1 flex-col">
        {/* Cover image */}
        <div className="relative h-44 w-full overflow-hidden bg-overlay">
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
          />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="line-clamp-2 font-outfit text-xl font-bold text-hi">{title}</h3>
          <p className="line-clamp-2 text-sm text-lo">{description}</p>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
            <div className="flex items-center gap-2">
              <Image
                src={authorAvatar}
                alt={authorName}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-xs text-dim">{authorName}</span>
            </div>

            <div className="flex items-center gap-3">
              <ReadingTimeBadge minutes={readingTime} />
              <span className="text-xs text-dim">{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
