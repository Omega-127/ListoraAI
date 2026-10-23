import { useState } from "react";
import { Play, CheckCircle2, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Progress } from "@animate-ui/react/primitives/base-ui/progress";
import { cn } from "../lib/cn";
import { focus, muted } from "../lib/styles";

export type ReportRow = {
  id: string;
  platform: string;
  field: string;
  beforeValue: string;
  afterValue: string;
  appliedAt: string;
  verificationStatus: "VERIFIED" | "PENDING" | "FAILED";
  apiLatencyMs: number;
};

export function formatPlatformName(platform: string): string {
  const map: Record<string, string> = {
    mockMapsA: "Google Maps (India)",
    googleMaps: "Google Maps (India)",
    "google-maps-india": "Google Maps (India)",
    mockMapsB: "Apple Maps (India)",
    appleMaps: "Apple Maps (India)",
    "apple-maps": "Apple Maps (India)",
    "apple-maps-india": "Apple Maps (India)",
    mappls: "Apple Maps (India)",
    "mappls-india": "Apple Maps (India)",
    mockDirectoryC: "Justdial (India)",
    justdial: "Justdial (India)",
    "justdial-india": "Justdial (India)",
  };
  return map[platform] || platform;
}

const INITIAL_REPORT_DATA: ReportRow[] = [
  {
    id: "rep-1",
    platform: "Google Maps (India)",
    field: "phone",
    beforeValue: "080 4123 4567",
    afterValue: "+918041234567",
    appliedAt: "Today, 14:32",
    verificationStatus: "VERIFIED",
    apiLatencyMs: 142,
  },
  {
    id: "rep-2",
    platform: "Google Maps (India)",
    field: "holidayHours",
    beforeValue: "Open Jan 26",
    afterValue: "closed",
    appliedAt: "Today, 14:32",
    verificationStatus: "VERIFIED",
    apiLatencyMs: 189,
  },
  {
    id: "rep-3",
    platform: "Apple Maps (India)",
    field: "hours",
    beforeValue: "Mon–Fri 8–20",
    afterValue: "Mon–Fri 07:00-22:00, Sat 08:00-23:00, Sun 08:00-22:00",
    appliedAt: "Today, 11:15",
    verificationStatus: "PENDING",
    apiLatencyMs: 230,
  },
  {
    id: "rep-4",
    platform: "Justdial (India)",
    field: "name",
    beforeValue: "The Bombay Roastery (Indiranagar)",
    afterValue: "The Bombay Roastery & Café",
    appliedAt: "Yesterday, 16:45",
    verificationStatus: "VERIFIED",
    apiLatencyMs: 310,
  },
  {
    id: "rep-5",
    platform: "Google Maps (India)",
    field: "address",
    beforeValue: "Plot 742, 12th Main Rd, HAL 2nd Stage, Bangalore",
    afterValue: "Plot 742, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
    appliedAt: "2 days ago",
    verificationStatus: "VERIFIED",
    apiLatencyMs: 195,
  },
];

export default function Report() {
  const [reports, setReports] = useState<ReportRow[]>(INITIAL_REPORT_DATA);
  const [isApplying, setIsApplying] = useState(false);
  const [progressVal, setProgressVal] = useState(0);

  const totalApplied = reports.length;
  const verifiedCount = reports.filter((r) => r.verificationStatus === "VERIFIED").length;
  const pendingVerificationCount = reports.filter((r) => r.verificationStatus === "PENDING").length;

  const handleApplyPendingUpdates = async () => {
    setIsApplying(true);
    setProgressVal(15);
    await new Promise((r) => setTimeout(r, 400));
    setProgressVal(55);
    await new Promise((r) => setTimeout(r, 400));
    setProgressVal(90);
    await new Promise((r) => setTimeout(r, 300));
    setProgressVal(100);

    let phone = "+918041234567";
    try {
      const stored = localStorage.getItem("listora_canonical_business_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.phone) phone = parsed.phone;
      }
    } catch {
      // ignore
    }

    const newEntry: ReportRow = {
      id: `rep-${Date.now()}`,
      platform: "Google Maps (India)",
      field: "phone",
      beforeValue: "080 4123 4567",
      afterValue: phone,
      appliedAt: "Just now",
      verificationStatus: "VERIFIED",
      apiLatencyMs: 145,
    };
    setReports((prev) => [newEntry, ...prev]);
    setIsApplying(false);
    setProgressVal(0);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Update & Verification Report</h1>
          <p className={`mt-1 max-w-[50ch] text-sm md:text-base ${muted}`}>
            Audit trail of approved changes dispatched to platforms and verified via read-after-write probes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleApplyPendingUpdates}
          disabled={isApplying}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:brightness-110 disabled:opacity-60",
            focus
          )}
        >
          {isApplying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isApplying ? "Dispatching Updates…" : "Apply Approved Updates"}
        </button>
      </div>

      {isApplying && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-[var(--foreground)]">Syncing updates with platform endpoints…</span>
            <span className="font-mono text-[var(--muted-foreground)]">{progressVal}%</span>
          </div>
          <Progress.Root value={progressVal} className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-neutral-800">
            <Progress.Track className="h-full w-full">
              <Progress.Indicator
                className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
                style={{ width: `${progressVal}%` }}
              />
            </Progress.Track>
          </Progress.Root>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className={`text-xs font-medium uppercase tracking-wider ${muted}`}>Total Dispatched</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-[var(--foreground)]">{totalApplied}</p>
          <p className={`mt-1 text-xs ${muted}`}>Successful write executions</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className={`text-xs font-medium uppercase tracking-wider ${muted}`}>Read-Back Verified</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
            {verifiedCount}
          </p>
          <p className={`mt-1 text-xs ${muted}`}>Confirmed live on destination platform</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className={`text-xs font-medium uppercase tracking-wider ${muted}`}>Pending Recheck</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
            {pendingVerificationCount}
          </p>
          <p className={`mt-1 text-xs ${muted}`}>Awaiting directory cache invalidation</p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Recent Synchronization Logs</h2>
          <p className={`text-xs ${muted}`}>Before and after state inspection across connected providers.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-50 dark:bg-black/40 text-[var(--muted-foreground)]">
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Platform / Field</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Before Value</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Applied Value</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Verification</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Latency</th>
                <th className="py-3 px-4 font-medium uppercase tracking-wider">Dispatched</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {reports.map((row) => (
                <tr key={row.id} className="hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-medium text-[var(--foreground)]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold uppercase tracking-wider text-[var(--foreground)]">
                        {formatPlatformName(row.platform)}
                      </span>
                      <span className="text-[var(--border)]">•</span>
                      <span className="capitalize text-[var(--muted-foreground)]">{row.field}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-600 dark:text-rose-300/80 max-w-[180px] truncate">
                    {row.beforeValue}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-700 dark:text-emerald-300 max-w-[200px] truncate">
                    {row.afterValue}
                  </td>
                  <td className="py-3.5 px-4">
                    {row.verificationStatus === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : row.verificationStatus === "PENDING" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                        <Clock className="h-3.5 w-3.5" /> Rechecking
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> Mismatch
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400">{row.apiLatencyMs}ms</td>
                  <td className="py-3.5 px-4 text-neutral-400">{row.appliedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
