import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Square, AlertCircle, CheckCircle2, Loader2, X, Terminal, Play } from "lucide-react";

import { listRuns, streamRun, cancelRun, type RunSummary } from "@/lib/api";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { LogView } from "@/components/LogView";
import { Pagination } from "@/components/Pagination";
import { RunKpiCard } from "@/components/RunKpiCard";
import { PageHeader } from "@/components/PageHeader";
import { StatKpi } from "@/components/StatKpi";
import { cn } from "@/lib/cn";

export function RunsPage() {
  const runs = useQuery({ queryKey: ["runs"], queryFn: listRuns, refetchInterval: 3_000 });
  const [params, setParams] = useSearchParams();
  const selected = params.get("run");

  // Sort newest-first so the highlights surface the freshest runs.
  const ordered = useMemo(
    () => [...(runs.data ?? [])].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    ),
    [runs.data],
  );

  const HIGHLIGHTS_LIMIT = 6;
  const highlights = ordered.slice(0, HIGHLIGHTS_LIMIT);
  const showTable = ordered.length > HIGHLIGHTS_LIMIT;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = ordered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Status rollup for the summary KPI row.
  const summary = useMemo(() => {
    let running = 0;
    let done = 0;
    let failed = 0;
    for (const r of ordered) {
      if (!r.finished) running++;
      else if (r.return_code === 0) done++;
      else failed++;
    }
    return { running, done, failed };
  }, [ordered]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Runs"
        title="Emitter & runner tasks."
        lede="Every CLI subprocess invoked from this UI — generate, provision, kg-publish, live-tail. Each shells out to proj-clarion with the same arguments and logs you'd get from a terminal."
      />

      {ordered.length > 0 && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatKpi label="Runs" value={ordered.length} hint="this session" icon={Terminal} tone="accent" />
          <StatKpi label="Running" value={summary.running} hint="in flight" icon={Play} tone="live" />
          <StatKpi label="Done" value={summary.done} hint="exit 0" icon={CheckCircle2} tone="success" />
          <StatKpi label="Failed" value={summary.failed} hint="non-zero exit" icon={AlertCircle} tone="danger" />
        </div>
      )}

      {ordered.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-[var(--color-text-muted)] text-sm">
            No runs in this session. Start one from a plan's actions panel, or via ⌘K → "generate".
          </div>
        </Card>
      ) : (
        <>
          {/* Highlights — top 6 newest runs as compact KPI cards. */}
          <section aria-label="Recent runs">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Recent
              </h2>
              <span className="text-[11px] text-[var(--color-text-faint)] font-mono tabular-nums">
                {highlights.length} of {ordered.length}
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((r) => (
                <RunKpiCard
                  key={r.run_id}
                  run={r}
                  compact
                  selected={selected === r.run_id}
                  onClick={() => setParams(r.run_id === selected ? {} : { run: r.run_id })}
                />
              ))}
            </div>
          </section>

          {/* Paginated table */}
          {showTable && (
            <section aria-label="All runs">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                  All runs
                </h2>
                <span className="text-[11px] text-[var(--color-text-faint)] font-mono tabular-nums">
                  {ordered.length} total
                </span>
              </div>
              <Card className="p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-xs text-[var(--color-text-faint)] uppercase tracking-wider border-b border-[var(--color-border)]">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Kind</th>
                      <th className="text-left font-medium px-4 py-3">Plan</th>
                      <th className="text-left font-medium px-4 py-3">Status</th>
                      <th className="text-right font-medium px-4 py-3">Lines</th>
                      <th className="text-right font-medium px-4 py-3">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr
                        key={r.run_id}
                        onClick={() => setParams(r.run_id === selected ? {} : { run: r.run_id })}
                        className={cn(
                          "border-b border-[var(--color-border)] last:border-0 cursor-pointer transition-colors",
                          selected === r.run_id
                            ? "bg-[var(--color-accent-bg)]/40"
                            : "hover:bg-white/[0.02]",
                        )}
                      >
                        <td className="px-4 py-3 font-medium">{r.kind}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">
                          {r.plan_id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <RunStatus run={r} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs">
                          {r.line_count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                          {new Date(r.started_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  total={ordered.length}
                  onPageChange={setPage}
                  onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                />
              </Card>
            </section>
          )}
        </>
      )}

      {/* Streaming log viewer — appears below the list/table when a
          run is selected. Same pattern as Pipelines: list above,
          inspection below. */}
      {selected && (
        <section aria-label="Run inspection">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Streaming log
              <span className="ml-2 font-mono text-[10px] tracking-normal normal-case text-[var(--color-text-faint)]">
                {selected.slice(0, 8)}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setParams({})}
              className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] inline-flex items-center gap-1"
            >
              <X size={12} /> Close
            </button>
          </div>
          <RunDetail
            runId={selected}
            run={ordered.find((r) => r.run_id === selected)}
          />
        </section>
      )}
    </div>
  );
}

function RunStatus({ run }: { run: RunSummary }) {
  if (!run.finished) return <Badge tone="info"><Loader2 size={10} className="animate-spin" /> running</Badge>;
  if (run.return_code === 0) return <Badge tone="success"><CheckCircle2 size={10} /> done</Badge>;
  return <Badge tone="danger"><AlertCircle size={10} /> exit {run.return_code}</Badge>;
}

function RunDetail({ runId, run }: { runId: string; run?: RunSummary }) {
  const [lines, setLines] = useState<string[]>([]);
  const [exitCode, setExitCode] = useState<number | null>(null);

  useEffect(() => {
    setLines([]);
    setExitCode(null);
    const stop = streamRun(runId, (e) => {
      if (e.type === "log") setLines((prev) => [...prev, e.line]);
      else setExitCode(e.code);
    });
    return stop;
  }, [runId]);

  // Auto-scroll handled by LogView's tail-aware scroll behaviour.

  const finished = exitCode !== null || run?.finished === true;

  return (
    <Card className="flex flex-col h-[700px]">
      <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-sm">{run?.kind ?? "run"} · <span className="font-mono text-xs">{run?.plan_id.slice(0, 8)}</span></div>
          <div className="text-xs text-[var(--color-text-faint)]">{runId}</div>
        </div>
        <div className="flex items-center gap-2">
          {run && <RunStatus run={run} />}
          {!finished && (
            <Button size="sm" variant="danger" onClick={() => void cancelRun(runId)}>
              <Square size={12} /> Cancel
            </Button>
          )}
        </div>
      </div>
      <LogView
        lines={lines}
        emptyText="Waiting for output…"
        maxHeight="100%"
        className="flex-1"
      />
      {finished && exitCode !== null && (
        <div className={cn(
          "px-5 py-2 text-xs border-t border-[var(--color-border)]",
          exitCode === 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]",
        )}>
          exit {exitCode}
        </div>
      )}
    </Card>
  );
}
