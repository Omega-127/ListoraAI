import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Progress } from "@animate-ui/react/primitives/base-ui/progress";
import { cn } from "../lib/cn";
import { muted } from "../lib/styles";

type FieldScore = {
  field: string;
  label: string;
  score: number;
  matching: number;
  eligible: number;
  description: string;
};

type PlatformScore = {
  platform: string;
  name: string;
  score: number;
  writable: boolean;
  status: "healthy" | "needs_attention" | "critical";
  lastVerified: string;
};

const FIELD_SCORES: FieldScore[] = [
  {
    field: "phone",
    label: "Phone Number",
    score: 67,
    matching: 2,
    eligible: 3,
    description: "Evaluated using E.164 canonical normalization across mock platforms.",
  },
  {
    field: "name",
    label: "Business Name",
    score: 67,
    matching: 2,
    eligible: 3,
    description: "Evaluates exact match against legal registered canonical name.",
  },
  {
    field: "hours",
    label: "Regular Hours",
    score: 33,
    matching: 1,
    eligible: 3,
    description: "Checks weekday and weekend operating schedules in 24h normalized time.",
  },
  {
    field: "holidayHours",
    label: "Holiday Hours",
    score: 100,
    matching: 2,
    eligible: 2,
    description: "Validates scheduled holiday closures and temporary override dates.",
  },
  {
    field: "address",
    label: "Physical Address",
    score: 100,
    matching: 3,
    eligible: 3,
    description: "Evaluates street number, street name, city, state, and postal code accuracy.",
  },
];

const PLATFORM_SCORES: PlatformScore[] = [
  {
    platform: "googleMaps",
    name: "Google Maps (India)",
    score: 85,
    writable: true,
    status: "needs_attention",
    lastVerified: "14 mins ago",
  },
  {
    platform: "mappls",
    name: "Mappls (MapmyIndia)",
    score: 67,
    writable: false,
    status: "needs_attention",
    lastVerified: "28 mins ago",
  },
  {
    platform: "justdial",
    name: "Justdial (India)",
    score: 100,
    writable: true,
    status: "healthy",
    lastVerified: "1 hour ago",
  },
];

export default function Score() {
  const [fieldScores] = useState<FieldScore[]>(FIELD_SCORES);
  const [platformScores] = useState<PlatformScore[]>(PLATFORM_SCORES);

  // Overall calculations
  const totalEligible = fieldScores.reduce((sum, f) => sum + f.eligible, 0);
  const totalMatching = fieldScores.reduce((sum, f) => sum + f.matching, 0);
  const overallScore = Math.round((totalMatching / totalEligible) * 100);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Consistency Score</h1>
          <p className={`mt-1 max-w-[50ch] text-sm md:text-base ${muted}`}>
            Quantified metric of NAP consistency across your connected listing network.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            +12% from last cycle
          </span>
        </div>
      </div>

      {/* Hero Score Card */}
      <div className="grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:grid-cols-3 md:items-center shadow-sm">
        <div className="flex flex-col items-start md:border-r md:border-[var(--border)] md:pr-6">
          <span className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>
            Overall Consistency Score
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
              {overallScore}%
            </span>
            <span className={`text-sm font-medium ${muted}`}>
              ({totalMatching}/{totalEligible} matching)
            </span>
          </div>
          <p className={`mt-2 text-xs ${muted}`}>
            Computed over {fieldScores.length} monitored schema dimensions across {platformScores.length} active platforms.
          </p>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--foreground)]">Composite Health Index</span>
            <span className={`font-mono ${muted}`}>{overallScore}%</span>
          </div>
          <Progress.Root value={overallScore} className="h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-neutral-800">
            <Progress.Track className="h-full w-full">
              <Progress.Indicator
                className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
                style={{ width: `${overallScore}%` }}
              />
            </Progress.Track>
          </Progress.Root>
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="rounded-lg bg-slate-50 dark:bg-black/40 p-2 border border-[var(--border)]">
              <p className={`text-[10px] uppercase font-medium ${muted}`}>Matching</p>
              <p className="mt-0.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{totalMatching}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-black/40 p-2 border border-[var(--border)]">
              <p className={`text-[10px] uppercase font-medium ${muted}`}>Mismatches</p>
              <p className="mt-0.5 font-mono text-rose-600 dark:text-rose-400 font-semibold">{totalEligible - totalMatching}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-black/40 p-2 border border-[var(--border)]">
              <p className={`text-[10px] uppercase font-medium ${muted}`}>Eligible</p>
              <p className="mt-0.5 font-mono text-[var(--foreground)] font-semibold">{totalEligible}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Field-by-Field Breakdown */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight">Field Breakdown</h2>
        <p className={`text-xs mt-0.5 ${muted}`}>
          Normalized comparison score calculated per attribute.
        </p>

        <div className="mt-6 space-y-5">
          {fieldScores.map((item) => (
            <div key={item.field} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-[var(--foreground)]">{item.label}</span>
                  <span className={`ml-2 text-xs ${muted}`}>({item.description})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">
                    {item.matching}/{item.eligible} verified
                  </span>
                  <span className="w-10 text-right font-mono text-xs font-semibold tabular-nums text-[var(--foreground)]">
                    {item.score}%
                  </span>
                </div>
              </div>
              <Progress.Root value={item.score} className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-neutral-800">
                <Progress.Track className="h-full w-full">
                  <Progress.Indicator
                    className={cn(
                      "h-full transition-all duration-300 ease-out",
                      item.score === 100
                        ? "bg-emerald-500"
                        : item.score >= 60
                        ? "bg-[var(--primary)]"
                        : "bg-rose-500"
                    )}
                    style={{ width: `${item.score}%` }}
                  />
                </Progress.Track>
              </Progress.Root>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight">Platform Alignment</h2>
        <p className={`text-xs mt-0.5 ${muted}`}>
          Directory compliance rate and API write capability.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {platformScores.map((platform) => (
            <div
              key={platform.platform}
              className="rounded-lg border border-[var(--border)] bg-slate-50 dark:bg-black/40 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {platform.platform}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    platform.writable
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-black/5 dark:bg-neutral-800 text-[var(--muted-foreground)] border border-[var(--border)]"
                  )}
                >
                  {platform.writable ? "Writable" : "Read-only"}
                </span>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">{platform.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
                    {platform.score}%
                  </span>
                  <span className={`text-xs ${muted}`}>consistency</span>
                </div>
              </div>
              <div className="border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted-foreground)]">
                Last checked: {platform.lastVerified}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
