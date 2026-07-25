import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Metadata } from "next";
import { type ReactNode } from "react";
import { PiClockCountdown, PiGaugeBold, PiLockOpen, PiPlugsConnected } from "react-icons/pi";
import { CodeTerminal } from "@/components/api-docs/code-terminal";
import { DocsSidebar } from "@/components/api-docs/docs-sidebar";
import { EndpointCard } from "@/components/api-docs/endpoint-card";
import { ENDPOINTS } from "@/components/api-docs/endpoints";
import { clientEnv } from "@/lib/env.client";

export const metadata: Metadata = {
  title: "API",
  description:
    "Open Data API for the Azerbaijan GitHub Community. Public, key-less, read-only access to contribution stats, the leaderboard, blog posts, and showcase projects. Build TUIs, bots, and dashboards on our data.",
  keywords: [
    "Azerbaijan GitHub Community API",
    "open data API",
    "developer API",
    "leaderboard API",
    "GitHub stats API Azerbaijan",
    "REST API",
  ],
};

const CATEGORIES = ["Stats", "Leaderboard", "Blog", "Showcase"] as const;

function DocSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} data-doc-section className="scroll-mt-28">
      <h2 className="mb-4 font-outfit text-3xl font-bold">{title}</h2>
      <div className="space-y-4 leading-relaxed text-lo">{children}</div>
    </section>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-line bg-overlay px-1.5 py-0.5 font-mono text-sm text-hi">{children}</code>
  );
}

function getSchemasSource() {
  const schemaSource = readFileSync(join(process.cwd(), "src/lib/api/schemas.ts"), "utf8");
  return schemaSource;
}

export default function ApiDocsPage() {
  const baseUrl = clientEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  const apiBase = `${baseUrl}/api/v1`;
  const schemaSource = getSchemasSource();

  const highlights = [
    { Icon: PiLockOpen, title: "No API key", body: "Fully public, read-only open data. Just make the request." },
    { Icon: PiGaugeBold, title: "Rate limited", body: "20 requests/min and 500/day per IP, fair for everyone." },
    { Icon: PiClockCountdown, title: "Heavily cached", body: "Served from cache and refreshed on every data sync." },
    { Icon: PiPlugsConnected, title: "OpenAPI + Zod", body: "Typed schemas and a spec you can generate clients from." },
  ];

  return (
    <div className="min-h-svh pt-32 pb-24">
      <div className="mx-auto max-w-300 px-8">
        {/* Hero */}
        <header className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
            Open Data API
          </span>
          <h1 className="mb-4 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Build on our <span className="text-gradient">data</span>
          </h1>
          <h2 className="mx-auto max-w-2xl text-xl text-lo">
            A public, key-less REST API for the community&apos;s contribution stats, leaderboard, blog, and showcase.
            Wire it into your TUI, bot, or dashboard.
          </h2>
        </header>

        {/* Highlights */}
        <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <div key={h.title} className="glass rounded-xl p-5">
              <h.Icon className="mb-3 text-2xl text-blue" />
              <h3 className="mb-1 font-outfit font-bold">{h.title}</h3>
              <p className="text-sm text-lo">{h.body}</p>
            </div>
          ))}
        </div>

        {/* Layout: sidebar + content */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <DocsSidebar />
            </div>
          </aside>

          <main className="min-w-0 space-y-16">
            <DocSection id="introduction" title="Introduction">
              <p>
                The Open Data API exposes the same data that powers this website so you can build your own tools on top
                of it. Everything is read-only, returns JSON, and requires no authentication.
              </p>
              <p>
                Every successful response is wrapped in an envelope: the payload lives under{" "}
                <InlineCode>data</InlineCode>, with optional <InlineCode>meta</InlineCode> (such as{" "}
                <InlineCode>count</InlineCode>, <InlineCode>month</InlineCode>, or <InlineCode>lastSyncedAt</InlineCode>
                ). Errors return <InlineCode>{`{ "error": { "code", "message" } }`}</InlineCode>.
              </p>
            </DocSection>

            <DocSection id="base-url" title="Base URL">
              <p>
                All endpoints are versioned under a single base URL: <InlineCode>{apiBase}</InlineCode>
              </p>
              <p>
                Paths in this documentation are shown relative to it, e.g. <InlineCode>/stats</InlineCode> means{" "}
                <InlineCode>{`${apiBase}/stats`}</InlineCode>.
              </p>
            </DocSection>

            <DocSection id="authentication" title="Authentication">
              <p>
                None. This is open data, so there are no API keys, tokens, or sign-up. Just send a{" "}
                <InlineCode>GET</InlineCode> request. Requests are attributed to your IP for rate limiting only.
              </p>
            </DocSection>

            <DocSection id="rate-limits" title="Rate limits">
              <p>
                Limits are applied per IP address: <strong className="text-hi">20 requests per minute</strong> and{" "}
                <strong className="text-hi">500 requests per day</strong>. Exceeding either returns{" "}
                <InlineCode>429 Too Many Requests</InlineCode> with a <InlineCode>Retry-After</InlineCode> header.
              </p>
              <p>Every response includes these headers:</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-lg border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-hi">
                      <th className="py-2 pr-4 font-semibold">Header</th>
                      <th className="py-2 font-semibold">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="text-lo">
                    {[
                      ["X-RateLimit-Limit", "Per-minute request cap (20)."],
                      ["X-RateLimit-Remaining", "Requests left in the current minute."],
                      ["X-RateLimit-Reset", "Unix seconds when the minute window resets."],
                      ["X-RateLimit-Limit-Daily", "Per-day request cap (500)."],
                      ["X-RateLimit-Remaining-Daily", "Requests left today."],
                      ["Retry-After", "Seconds to wait after a 429 response."],
                    ].map(([h, m]) => (
                      <tr key={h} className="border-b border-line/50">
                        <td className="py-2 pr-4 align-top">
                          <InlineCode>{h}</InlineCode>
                        </td>
                        <td className="py-2 align-top">{m}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DocSection>

            <DocSection id="caching" title="Caching">
              <p>
                Responses are served from a server-side cache and refreshed automatically whenever the underlying data
                is synced, so you always get fresh numbers without hammering the database. Each response also carries{" "}
                <InlineCode>Cache-Control: public, max-age=60</InlineCode>, so your own client may reuse it for up to a
                minute. Please cache on your side rather than polling in a tight loop.
              </p>
            </DocSection>

            <DocSection id="errors" title="Errors">
              <p>
                Errors use standard HTTP status codes and a consistent body:{" "}
                <InlineCode>{`{ "error": { "code", "message" } }`}</InlineCode>.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-lg border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-hi">
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 pr-4 font-semibold">Code</th>
                      <th className="py-2 font-semibold">When</th>
                    </tr>
                  </thead>
                  <tbody className="text-lo">
                    {[
                      ["400", "invalid_params", "A path parameter is malformed (e.g. bad year/month)."],
                      ["404", "not_found", "No resource for that slug or month."],
                      ["429", "rate_limited", "You exceeded the per-minute or monthly limit."],
                      ["500", "internal_error", "Something went wrong on our side."],
                    ].map(([s, c, w]) => (
                      <tr key={c} className="border-b border-line/50">
                        <td className="py-2 pr-4 align-top">
                          <InlineCode>{s}</InlineCode>
                        </td>
                        <td className="py-2 pr-4 align-top">
                          <InlineCode>{c}</InlineCode>
                        </td>
                        <td className="py-2 align-top">{w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DocSection>

            <DocSection id="versioning" title="Versioning">
              <p>
                The API is versioned in the path (<InlineCode>/api/v1</InlineCode>). Additive changes (new endpoints or
                fields) ship within <InlineCode>v1</InlineCode>; any breaking change would land under a new version.
              </p>
            </DocSection>

            <DocSection id="mcp" title="MCP server">
              <p>
                For AI assistants (Claude, Cursor, and other Model Context Protocol clients) the same data is available
                as an <strong className="text-hi">MCP server</strong>, so a chatbot can query the community directly. It
                needs no key.
              </p>
              <p>
                Endpoint: <InlineCode>{`${baseUrl}/api/mcp/mcp`}</InlineCode>. Add it to your client&apos;s config:
              </p>
              <div className="not-prose">
                <CodeTerminal
                  singleTab
                  snippets={[
                    {
                      id: "mcp-config",
                      label: "mcp.json",
                      lang: "json",
                      code: `{
  "mcpServers": {
    "azerbaijan-github-community": {
      "url": "${baseUrl}/api/mcp/mcp"
    }
  }
}`,
                    },
                  ]}
                />
              </div>
              <p className="pt-2">
                Tools: <InlineCode>get_stats</InlineCode>, <InlineCode>get_leaderboard</InlineCode>,{" "}
                <InlineCode>get_all_time_leaderboard</InlineCode>, <InlineCode>get_blog_posts</InlineCode>,{" "}
                <InlineCode>get_blog_post</InlineCode>, and <InlineCode>get_showcase_projects</InlineCode>.
              </p>
            </DocSection>

            {/* Endpoints */}
            <div className="space-y-4 border-t border-line pt-16">
              <h2 className="font-outfit text-3xl font-bold">Endpoints</h2>
              <p className="text-lo">
                Every endpoint below has copy-pasteable snippets in 12 languages and a live “Run” button.
              </p>
            </div>

            {CATEGORIES.map((category) => (
              <div key={category}>
                <h3 className="mb-6 font-outfit text-sm font-semibold tracking-wider text-dim uppercase">{category}</h3>
                <div className="space-y-12">
                  {ENDPOINTS.map(
                    (endpoint) =>
                      endpoint.category === category && (
                        <EndpointCard key={endpoint.id} endpoint={endpoint} baseUrl={baseUrl} />
                      ),
                  )}
                </div>
              </div>
            ))}

            {/* Schemas */}
            <DocSection id="schemas" title="Schemas & OpenAPI">
              <p>
                A machine-readable <strong className="text-hi">OpenAPI 3.1</strong> spec is available. Generate a typed
                client in your language of choice, or import it into Postman/Insomnia:
              </p>
              <div className="not-prose">
                <a
                  href="/api/v1/openapi.json"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 font-outfit font-semibold text-hi transition-colors hover:border-blue hover:text-blue"
                >
                  View openapi.json
                </a>
              </div>
              <p className="pt-2">
                Using TypeScript? Drop these <strong className="text-hi">Zod</strong> schemas in to validate and type
                every response:
              </p>
              <div className="not-prose">
                <CodeTerminal
                  singleTab
                  snippets={[{ id: "zod", label: "schemas.ts", lang: "typescript", code: schemaSource }]}
                />
              </div>
            </DocSection>
          </main>
        </div>
      </div>
    </div>
  );
}
