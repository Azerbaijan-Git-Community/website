"use client";

import { useState } from "react";
import { PiCircleNotch, PiPlay } from "react-icons/pi";
import { CodeTerminal } from "./code-terminal";
import { type EndpointDoc, fillPath } from "./endpoints";
import { highlightJson } from "./highlight";
import { buildSnippets } from "./snippets";

type RunResult = {
  status: number;
  ok: boolean;
  body: string;
  timeMs: number | null;
  live: boolean;
};

export function EndpointCard({ endpoint, baseUrl }: { endpoint: EndpointDoc; baseUrl: string }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((endpoint.params ?? []).map((p) => [p.name, p.example])),
  );
  const [result, setResult] = useState<RunResult>({
    status: 200,
    ok: true,
    body: endpoint.example,
    timeMs: null,
    live: false,
  });
  const [loading, setLoading] = useState(false);

  const path = fillPath(endpoint.path, values);
  const snippets = buildSnippets(`${baseUrl}${path}`);

  async function run() {
    setLoading(true);
    const start = performance.now();
    try {
      // `no-store` ensures every click re-hits the endpoint instead of the browser reusing
      // the short-lived (max-age=60) cached response.
      const res = await fetch(path, { headers: { Accept: "application/json" }, cache: "no-store" });
      const text = await res.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Non-JSON response; show raw text.
      }
      setResult({ status: res.status, ok: res.ok, body, timeMs: Math.round(performance.now() - start), live: true });
    } catch (error) {
      setResult({
        status: 0,
        ok: false,
        body: error instanceof Error ? error.message : String(error),
        timeMs: Math.round(performance.now() - start),
        live: true,
      });
    }
    setLoading(false);
  }

  return (
    <section id={endpoint.id} data-doc-section className="scroll-mt-28">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-md border border-[rgba(88,166,255,0.3)] bg-[rgba(88,166,255,0.1)] px-2 py-1 font-mono text-xs font-bold text-blue">
          {endpoint.method}
        </span>
        <code className="font-mono text-sm break-all text-hi">{endpoint.path}</code>
      </div>

      <h3 className="mb-2 font-outfit text-2xl font-bold">{endpoint.title}</h3>
      <p className="mb-6 max-w-2xl text-lo">{endpoint.summary}</p>

      {endpoint.params && (
        <div className="mb-6 space-y-3">
          {endpoint.params.map((p) => (
            <div key={p.name} className="flex flex-col gap-1">
              <label htmlFor={p.name} className="text-sm font-medium text-hi">
                {p.name} <span className="font-normal text-lo">: {p.description}</span>
              </label>
              <input
                id={p.name}
                value={values[p.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                aria-label="Path parameter value"
                spellCheck={false}
                className="w-full max-w-xs rounded-md border border-line bg-canvas px-3 py-2 font-mono text-sm text-hi transition-colors outline-none focus:border-blue"
              />
            </div>
          ))}
        </div>
      )}

      <CodeTerminal
        snippets={snippets}
        headerAction={
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-green px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-lime disabled:opacity-60"
          >
            {loading ? <PiCircleNotch className="animate-spin" /> : <PiPlay />}
            {loading ? "Running…" : "Try it"}
          </button>
        }
      />

      <div className="glass mt-4 overflow-hidden rounded-xl">
        <div className="flex items-center gap-3 border-b border-line bg-[rgba(48,54,61,0.5)] px-4 py-2">
          {result.live ? (
            <>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                  result.ok ? "bg-[rgba(63,185,80,0.15)] text-lime" : "bg-[rgba(248,81,73,0.15)] text-[#f85149]"
                }`}
              >
                {result.status || "ERR"}
              </span>
              {result.timeMs !== null && <span className="text-xs text-lo">{result.timeMs} ms</span>}
            </>
          ) : (
            <span className="text-xs font-medium tracking-wider text-dim uppercase">Example response</span>
          )}
        </div>
        <pre className="max-h-96 overflow-auto bg-overlay p-4 text-sm leading-relaxed">
          <code className="font-mono text-hi" dangerouslySetInnerHTML={{ __html: highlightJson(result.body) }} />
        </pre>
      </div>
    </section>
  );
}
