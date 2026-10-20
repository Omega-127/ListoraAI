import { useState } from "react";
import { Link } from "react-router-dom";
import { Progress } from "@animate-ui/react/primitives/base-ui/progress";
import { AlertsRail } from "../components/dashboard/AlertsRail";
import { ListingsGrid } from "../components/dashboard/ListingsGrid";
import { MismatchPanel } from "../components/dashboard/MismatchPanel";
import { ScoreHero } from "../components/dashboard/ScoreHero";
import { RefreshCw } from "../components/animate-ui/icons/refresh-cw";
import { DEMO_DASHBOARD } from "../lib/dashboard-data";
import { cn } from "../lib/cn";
import { ease, focus, muted } from "../lib/styles";

export default function Dashboard() {
  const [data, setData] = useState(DEMO_DASHBOARD);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(["mm-1", "mm-2"]));
  const [refreshing, setRefreshing] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function refreshListings() {
    setRefreshing(true);
    setData((d) => ({ ...d, recheckProgress: 8 }));
    // Demo pulse — swap for POST /api/v1/listings/refresh when the API is live.
    const steps = [28, 52, 74, 100];
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 280));
      setData((d) => ({ ...d, recheckProgress: step }));
    }
    setData((d) => ({
      ...d,
      score: 67,
      recheckProgress: 100,
    }));
    setRefreshing(false);
  }

  async function runAgent() {
    setAgentRunning(true);
    await new Promise((r) => setTimeout(r, 900));
    setAgentRunning(false);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
          <p className={`mt-1 max-w-[48ch] text-sm md:text-base ${muted}`}>
            Compare listings to your approved profile, then approve only the corrections you want.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshListings}
            disabled={refreshing}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium hover:bg-white/5 disabled:opacity-60",
              focus,
              ease,
            )}
          >
            <RefreshCw size={16} animate={refreshing ? "rotate" : false} animateOnHover="default" />
            {refreshing ? "Refreshing…" : "Refresh listings"}
          </button>
          <button
            type="button"
            onClick={runAgent}
            disabled={agentRunning}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60",
              focus,
              ease,
            )}
          >
            {agentRunning ? "Running agent…" : "Run agent"}
          </button>
        </div>
      </div>

      <AlertsRail alerts={data.alerts} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,17rem)_1fr]">
        <ScoreHero score={data.score} matching={data.matching} eligible={data.eligible} />
        <div className="rounded-xl border border-[var(--border)] bg-[#0d0d0d]/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wider ${muted}`}>Queue</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {data.pendingApprovals}{" "}
                <span className={`text-base font-medium ${muted}`}>pending approvals</span>
              </p>
            </div>
            <Link
              to="/dashboard/approvals"
              className={cn(
                "rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-white/5",
                focus,
              )}
            >
              Open approvals
            </Link>
          </div>
          <Progress.Root
            value={data.recheckProgress || null}
            className="mt-6 grid gap-2"
            aria-label="Listing refresh progress"
          >
            <div className="flex items-center justify-between text-xs">
              <Progress.Label className={muted}>
                {refreshing ? "Re-checking listings" : data.recheckProgress === 100 ? "Last refresh complete" : "Idle"}
              </Progress.Label>
              <Progress.Value className="tabular-nums" />
            </div>
            <Progress.Track className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <Progress.Indicator className="h-full rounded-full bg-[var(--primary)]" />
            </Progress.Track>
          </Progress.Root>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Listings</h2>
            <p className={`mt-1 text-sm ${muted}`}>Latest snapshots from each connected platform.</p>
          </div>
        </div>
        <ListingsGrid listings={data.listings} />
      </section>

      <MismatchPanel mismatches={data.mismatches} selected={selected} onToggle={toggle} />
    </div>
  );
}
