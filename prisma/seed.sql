-- Sample data for CI (Lighthouse) and throwaway databases. Safe to run more than once.
-- Run with: pnpm prisma db execute --file prisma/seed.sql

INSERT INTO "user" ("id", "name", "email", "emailVerified", "githubUsername", "githubId", "image", "role", "updatedAt")
SELECT
  'seed-user-' || n,
  'Seed User ' || n,
  'seed' || n || '@example.com',
  true,
  'seed-user-' || n,
  900000 + n,
  'https://avatars.githubusercontent.com/u/9919?v=4',
  'user',
  now()
FROM generate_series(1, 12) AS n
ON CONFLICT DO NOTHING;

INSERT INTO "github_stats" ("id", "userId", "commits", "pullRequests", "issues", "reviews", "repositories", "contributions", "followers", "updatedAt")
SELECT 'seed-stats-' || n, 'seed-user-' || n, 2000 - n * 120, 300 - n * 20, 80 - n * 5, 150 - n * 10, 40 - n, 2600 - n * 150, 500 - n * 30, now()
FROM generate_series(1, 12) AS n
ON CONFLICT DO NOTHING;

-- Keys match getWeekKey/getMonthKey (ISO week, UTC), so the current periods have data.
INSERT INTO "github_stats_snapshot" ("id", "userId", "period", "periodKey", "commits", "pullRequests", "issues", "reviews", "updatedAt")
SELECT 'seed-week-' || n, 'seed-user-' || n, 'WEEKLY'::"SnapshotPeriod", to_char(now() AT TIME ZONE 'UTC', 'IYYY-"W"IW'), 60 - n * 4, 10 - (n / 2), 3, 5, now()
FROM generate_series(1, 12) AS n
UNION ALL
SELECT 'seed-month-' || n, 'seed-user-' || n, 'MONTHLY'::"SnapshotPeriod", to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'), 250 - n * 15, 40 - n * 2, 10, 20, now()
FROM generate_series(1, 12) AS n
ON CONFLICT DO NOTHING;

INSERT INTO "showcase_project" ("id", "repo", "submittedBy", "links", "stars", "forks", "openIssues", "openPRs", "description", "language", "languageColor", "fileSha", "updatedAt")
VALUES (
  'seed-showcase-1',
  'Azerbaijan-Git-Community/website',
  'seed-user-1',
  '{}',
  42, 7, 3, 1,
  'Azerbaijan GitHub Community website.',
  'TypeScript', '#3178c6',
  'seed',
  now()
)
ON CONFLICT DO NOTHING;

-- A real post (from githubcommunity.az), so Lighthouse audits realistic content. Lighthouse audits /blog/yusifaliyevpro-nextjs-app-router-rendering-strategies-csr-ssr-ssg-isr-ppr.
INSERT INTO "user" ("id", "name", "email", "emailVerified", "githubUsername", "githubId", "image", "role", "updatedAt")
VALUES ('nmDjDW2fGHH2xuGCeVNs0TACB4AdCvFl', 'Yusif Aliyev', 'seed-author@example.com', true, 'yusifaliyevpro', 114253515, 'https://avatars.githubusercontent.com/u/114253515?v=4', 'user', now())
ON CONFLICT DO NOTHING;

INSERT INTO "blog_post" ("id", "slug", "title", "description", "tags", "coverImage", "userId", "contentHtml", "readingTime", "aiAssisted", "sourceOrigin", "sourcePostId", "sourceUrl", "sourceUpdatedAt", "createdAt", "updatedAt")
VALUES (
  '01a1b646-e6f4-70d1-9fd2-68106fd5dfce',
  'yusifaliyevpro-nextjs-app-router-rendering-strategies-csr-ssr-ssg-isr-ppr',
  'NextJS App Router Rendering Strategies: CSR, SSR, SSG, ISR & PPR',
  'In this post, I walk you through all the main rendering strategies in the Next.js App Router: CSR, SSR, SSG, ISR, and even the experimental PPR. We will look at when to use each one, with real examples and simple code you can try yourself. I will also share my experiences and best practices along the way.',
  '{"approuter","csr","nextjs","renderingstrategies","ssr"}',
  'https://cdn.sanity.io/images/jl0ycvey/production/5b268f6f1491730a501f80932674bfdc716c7f7e-1200x630.svg',
  'nmDjDW2fGHH2xuGCeVNs0TACB4AdCvFl',
  $post$<p>This post is synced from <a href="https://yusifaliyevpro.com/blog/nextjs-app-router-rendering-strategies">my website</a> using webhooks.</p>
<h2>1. Full Page Client Side Rendering (CSR)</h2>
<p>This one is very similar to how we used to build classic React apps before frameworks like NextJS.</p>
<p>When you use full <strong>Client Side Rendering</strong>, Next.js sends an almost empty HTML page. Then the browser runs JavaScript, fetches the data, and builds the page on the client. So the browser does all the work. The server just gives it the basic tools.</p>
<p>You might choose CSR when:</p>
<ul>
<li>You don’t need SEO (for example, in dashboards or admin panels),</li>
<li>The page is very interactive,</li>
<li>The content is personalized for the logged-in user.</li>
</ul>
<pre data-title="@/app/csr-example/page.tsx"><code class="language-tsx">"use client";

import { Post } from "@/lib/types";
import { useEffect, useState } from "react";

export default function Page() {
  const [post, setPost] = useState&#x3C;Post | null>(null);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts/1")
      .then((res) => res.json())
      .then(setPost);
  }, []);

  if (!post) return &#x3C;div>Loading…&#x3C;/div>;

  return (
      &#x3C;div className="flex w-150 flex-col gap-y-5">
        &#x3C;h2 className="text-2xl font-bold">{post.title}&#x3C;/h2>
        &#x3C;p>{post.body}&#x3C;/p>
      &#x3C;/div>
  );
}
</code></pre>
<p>One downside of CSR is that the user might see a loading spinner for a while, especially on slower networks. Also, SEO bots usually can’t read JavaScript, so these pages don’t work well for search engines.</p>
<p>Maybe your page is very heavy has a lots of data manipulation, re-renders, and first-build. It can be good to do it in a server.</p>
<p>But for dynamic apps with lots of interaction, CSR is a good choice. And of course, you can always mix CSR with other strategies.</p>
<h2>2. Server-Side Rendering (SSR)</h2>
<p>With SSR, Next.js runs your code on the server and sends back a fully rendered HTML page. It fetches data on every request and includes everything in the HTML, including dynamic metadata.</p>
<p>This is useful for SEO and when your data changes often.</p>
<pre data-title="@/app/ssr-example/page.tsx"><code class="language-tsx">import { Post } from "@/lib/types";

export default async function Page() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", { cache: "no-store" });
  const items = ((await res.json()) as Post[]).slice(0, 10);
  return (
      &#x3C;ul className="list-decimal">
        {items.map((item) => (
          &#x3C;li key={item.id}>{item.title}&#x3C;/li>
        ))}
      &#x3C;/ul>
  );
}
</code></pre>
<p>Here, the <code>{ cache: 'no-store' }</code> tells Next.js to fetch fresh data every time. This keeps the content up to date.</p>
<p>Just a quick tip: when using <strong>Server Components</strong> like this, you can't use hooks like <code>useState</code>, <code>useEffect</code>, or anything that depends on the browser (like accessing <code>window</code> or <code>navigator</code>). If you need those, you’ll need to use a Client Component. I’ll write more about workarounds for that in a future post, so feel free to subscribe if you’re interested.</p>
<h2>3. SSR + CSR Components</h2>
<p>Many pages need both good SEO and some interactive features. For example, maybe you want to show a blog post (static content) but also allow users to like it (interactive).</p>
<p>In Next.js, you can mix Server Components (for data fetching and layout) with Client Components (for interactivity). This is a really powerful combo.</p>
<pre data-title="@/app/ssr-csr-example/page.tsx"><code class="language-tsx">import { LikeButton } from "@/components/LikeButton";
import { Post } from "@/lib/types";

export default async function Page() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts/1", { cache: "force-cache" });
  let post = (await res.json()) satisfies Post;
  post = { ...post, likes: 0 };
  
  return (
      &#x3C;article className="flex flex-col items-center">
        &#x3C;h1>{post.title}&#x3C;/h1>
        &#x3C;LikeButton initialLikes={post.likes} />
      &#x3C;/article>
  );
}
</code></pre>
<pre data-title="@/app/components/LikeButton.tsx"><code class="language-tsx">// LikeButton.tsx (Client Component)
'use client' // Don't forget to add
import { useState } from 'react'

export default function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes)

  return (
    &#x3C;button onClick={() => setLikes(likes + 1)}>
      ❤️ {likes}
    &#x3C;/button>
  )
}
</code></pre>
<p>The server renders the page with fresh data, and the client handles the like button’s interactivity.</p>
<h2>4. Static Site Generation (SSG)</h2>
<p>If your page doesn’t change often, and doesn’t use dynamic data — go with <strong>SSG</strong>.</p>
<p>Think of simple pages like Home Pages , About pages, Pricing tables, Static blog content.</p>
<p>Next.js will generate these pages at <strong>build time</strong> and serve them as <strong>pure HTML</strong>. This makes them <strong>super fast</strong> and <strong>great for SEO</strong>.</p>
<p>It also means <strong>zero* server cost,</strong> the server just returns the same file again and again, like a CDN.</p>
<pre data-title="@/app/ssg-example/page.tsx"><code class="language-tsx">// No fetch, no revalidate, no dynamic params or searchParams. Just plain static content.
export default function Page() {
  return &#x3C;div>This is a fully static page&#x3C;/div>
}
</code></pre>
<p>But what if you still need to fetch some data, like a list of features or testimonials, but that data rarely changes?</p>
<p>You can use <code>cache: "force-cache"</code> in a <strong>Server Component</strong>. This tells Next.js to fetch the data <strong>at build time</strong> and reuse the result on every request — just like classic SSG.</p>
<pre data-title="@/app/ssg-fetch-example/page.tsx"><code class="language-tsx">import { Post } from "@/lib/types";

// A static page that fetches data at build time
export default async function Page() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", { cache: "force-cache" });

  const data = ((await res.json()) as Post[]).slice(0, 10);

  return (
      &#x3C;ul>
        {data.map((post) => (
          &#x3C;li key={post.id}>{post.title}&#x3C;/li>
        ))}
      &#x3C;/ul>
  );
}
</code></pre>
<p>✅ This fetch only runs <strong>once</strong> during the build.<br>
✅ Great for rarely-changing content.<br>
❌ You need to rebuild your app to see updated data.</p>
<p>If you want the same fast speed but want to update the content automatically after a while, check out <strong>ISR</strong> below 👇</p>
<h2>5. Incremental Static Regeneration (ISR)</h2>
<p><strong>ISR</strong> is one of the best features of Next.js. It gives you the speed of static pages <strong>and</strong> the ability to update them without rebuilding your whole site.</p>
<p>Normally, if you use <strong>SSG (Static Site Generation)</strong>, your page is built <strong>once</strong> when you deploy. If something changes in your data, you'd have to rebuild and redeploy your whole app to see the updates.</p>
<p>Here’s how it works:</p>
<ul>
<li>The page is built and cached at build time (just like SSG).</li>
<li>You can set a <code>revalidate</code> time, like every 60 seconds.</li>
<li>While the cached version is served to users, Next.js checks if it’s time to update.</li>
<li>If it's time, the <strong>next user</strong> who visits the page will trigger a rebuild <strong>in the background</strong>.</li>
<li>That user still sees the old page, but the next one gets the updated version.</li>
</ul>
<p>So, the page is <em>regenerated</em> quietly while your site stays online and fast.</p>
<pre data-title="@/app/isr-example/page.tsx"><code class="language-tsx">import { Post } from "@/lib/types";

export default async function Page() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    next: { revalidate: 60 },
  });

  const data = ((await res.json()) as Post[]).slice(0, 10);

  return (
      &#x3C;ul>
        {data.map((post) => (
          &#x3C;li key={post.id}>{post.title}&#x3C;/li>
        ))}
      &#x3C;/ul>
  );
}
</code></pre>
<h4>When to use ISR</h4>
<ul>
<li>Pages that change <em>sometimes</em> (like product listings, articles, events)</li>
<li>You want the <strong>performance of static</strong> and the <strong>freshness of dynamic</strong></li>
<li>Great when rebuilding the site every time is too expensive</li>
</ul>
<p>ISR is what makes <strong>scalable content</strong> possible, especially if you have hundreds or thousands of pages. You don’t need to rebuild the whole site. Just let Next.js handle it automatically in the background.</p>
<h2>6. Partial Prerendering (PPR)</h2>
<p>This one’s still <strong>experimental</strong>, but super interesting.</p>
<p>Imagine your page loads <strong>instantly</strong> with static HTML for the layout, header, footer, product info, but the personalized parts (like a shopping cart or profile info) or "how many product left?" sections can be <strong>loaded afterwards</strong>, with a loading spinner.</p>
<p>You can do that with <strong>PPR</strong>, using <strong><code>&#x3C;Suspense></code></strong>, <strong>Client Components</strong>, and <strong>React streaming</strong>.</p>
<ul>
<li>The static parts load instantly</li>
<li>The dynamic part (ProductList) loads <strong>when ready</strong></li>
<li>Great for <strong>performance + personalization</strong></li>
</ul>
<pre data-title="@/app/ppr-example/page.tsx"><code class="language-tsx">// app/ppr-example/page.tsx
import { Suspense } from "react";

export const experimental_ppr = true;

export default function Page() {
  return (
    &#x3C;>
      &#x3C;header>
        &#x3C;h1>This will be prerendered&#x3C;/h1>
      &#x3C;/header>
      &#x3C;main>
        &#x3C;Suspense fallback={&#x3C;div>Loading...&#x3C;/div>}>
          &#x3C;ProductList />
        &#x3C;/Suspense>
      &#x3C;/main>
    &#x3C;/>
  );
}

// components/ProductList.tsx
import { Post } from "@/lib/types";
export async function ProductList() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    next: { revalidate: 60 },
  });

  const data = ((await res.json()) as Post[]).slice(0, 10);

  return (
    &#x3C;ul>
      {data.map((post) => (
        &#x3C;li key={post.id}>{post.title}&#x3C;/li>
      ))}
    &#x3C;/ul>
  );
}
</code></pre>
<p><img src="https://cdn.sanity.io/images/jl0ycvey/production/81c3ba98368a6d1449cdef939bc11dbaba6e70c1-1600x785.png" alt=""></p>
<p><img src="https://cdn.sanity.io/images/jl0ycvey/production/072b17487c3a7c7432f5031a5b6e96989a886911-1600x525.png" alt=""></p>$post$,
  7,
  false,
  'https://omicron.blog',
  '01a1b646-e6f4-70d1-9fd2-68106fd5dfce',
  'https://omicron.blog/@yusifaliyevpro/nextjs-app-router-rendering-strategies-csr-ssr-ssg-isr-ppr',
  '2026-11-07T14:05:32.926Z',
  '2026-08-03T13:29:01.282Z',
  '2026-11-07T14:05:32.926Z'
)
ON CONFLICT DO NOTHING;
