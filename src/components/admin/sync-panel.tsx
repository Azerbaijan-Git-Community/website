"use client";

import { Button, toast } from "@heroui/react";
import { useState } from "react";
import { IconType } from "react-icons";
import {
  PiArrowsClockwise,
  PiCheckCircleBold,
  PiGithubLogoBold,
  PiNewspaperBold,
  PiRocketLaunchBold,
  PiXCircleBold,
} from "react-icons/pi";
import { type SyncTarget } from "@/lib/constants";

type SyncRow = {
  target: SyncTarget;
  title: string;
  method: string;
  endpoint: string;
  icon: IconType;
};

type RunState = { status: "ok" | "error"; message: string };

const ROWS: SyncRow[] = [
  {
    target: "github",
    title: "GitHub Stats",
    method: "POST",
    endpoint: "/api/cron/sync-github",
    icon: PiGithubLogoBold,
  },
  { target: "blog", title: "Blog", method: "POST", endpoint: "/api/webhooks/blog", icon: PiNewspaperBold },
  {
    target: "showcase",
    title: "Showcase",
    method: "POST",
    endpoint: "/api/webhooks/showcase",
    icon: PiRocketLaunchBold,
  },
];

export function SyncPanel() {
  const [running, setRunning] = useState<SyncTarget | null>(null);
  const [results, setResults] = useState<Partial<Record<SyncTarget, RunState>>>({});

  async function runSync(target: SyncTarget) {
    setRunning(target);
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };

      if (!res.ok) {
        let message = data.error;
        if (!message) {
          message = `Request failed (${res.status})`;
        }
        setResults((prev) => ({ ...prev, [target]: { status: "error", message } }));
        toast.danger(`${target} sync failed`, { description: message });
        return;
      }

      let message = data.message;
      if (!message) {
        message = "Done.";
      }
      setResults((prev) => ({ ...prev, [target]: { status: "ok", message } }));
      toast.success(`${target} sync complete`, { description: message });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setResults((prev) => ({ ...prev, [target]: { status: "error", message } }));
      toast.danger(`${target} sync failed`, { description: message });
    }
    setRunning(null);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-[rgba(13,17,23,0.6)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="font-mono text-xs font-semibold tracking-wider text-lo uppercase">Sync endpoints</h2>
        <span className="font-mono text-xs text-dim">{ROWS.length} jobs</span>
      </div>

      <ul>
        {ROWS.map((row) => {
          const Icon = row.icon;
          const isRunning = running === row.target;
          const result = results[row.target];
          return (
            <li
              key={row.target}
              className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4 last:border-0"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface">
                <Icon className="size-4 text-lo" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-outfit text-sm font-semibold text-hi">{row.title}</span>
                  {result && (
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                        result.status === "ok" ? "text-lime" : "text-icon-pink"
                      }`}
                    >
                      {result.status === "ok" ? (
                        <PiCheckCircleBold className="size-3" />
                      ) : (
                        <PiXCircleBold className="size-3" />
                      )}
                      {result.message}
                    </span>
                  )}
                </div>
                <code className="font-mono text-xs text-dim">
                  <span className="text-blue">{row.method}</span> {row.endpoint}
                </code>
              </div>

              <Button
                isDisabled={running !== null}
                onClick={() => runSync(row.target)}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-xs font-semibold text-hi transition-all hover:border-lo hover:bg-overlay disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PiArrowsClockwise className={`size-3.5 ${isRunning ? "animate-spin" : ""}`} />
                {isRunning ? "Running…" : "Run"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
