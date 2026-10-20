import { useState, useMemo } from "react";
import { Check, X, Sparkles, CheckCircle2, Eye, Lock } from "lucide-react";
import { Tabs } from "@animate-ui/react/primitives/base-ui/tabs";
import { cn } from "../lib/cn";
import { focus, muted } from "../lib/styles";
import { getStoredUser } from "../lib/api";


export type ProposalItem = {
  id: string;
  platform: string;
  field: string;
  oldValue: string;
  newValue: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  confidence: number;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  createdAt: string;
};

const INITIAL_PROPOSALS: ProposalItem[] = [
  {
    id: "prop-1",
    platform: "mockMapsA",
    field: "phone",
    oldValue: "(555) 010-2234",
    newValue: "+15550102234",
    status: "PENDING_APPROVAL",
    confidence: 99,
    reason: "Standardize formatting to E.164 canonical telephone protocol.",
    riskLevel: "low",
    createdAt: "10 mins ago",
  },
  {
    id: "prop-2",
    platform: "mockMapsB",
    field: "hours",
    oldValue: "Mon–Sat 7–5",
    newValue: "Mon–Fri 07:00-18:00, Sat 08:00-20:00, Sun 09:00-16:00",
    status: "PENDING_APPROVAL",
    confidence: 96,
    reason: "Saturday and Sunday operating schedules contradict approved hours.",
    riskLevel: "medium",
    createdAt: "22 mins ago",
  },
  {
    id: "prop-3",
    platform: "mockDirectoryC",
    field: "name",
    oldValue: "Bella Cucina (Downtown)",
    newValue: "Bella Cucina Ristorante",
    status: "PENDING_APPROVAL",
    confidence: 92,
    reason: "Removes unauthorized location qualifier to align with legal branding.",
    riskLevel: "high",
    createdAt: "1 hour ago",
  },
  {
    id: "prop-4",
    platform: "mockMapsA",
    field: "holidayHours",
    oldValue: "Open Dec 25",
    newValue: "closed",
    status: "APPROVED",
    confidence: 98,
    reason: "Store is marked closed on Christmas Day in canonical profile.",
    riskLevel: "low",
    createdAt: "3 hours ago",
  },
  {
    id: "prop-5",
    platform: "mockDirectoryC",
    field: "address",
    oldValue: "42 Maple St Suite B",
    newValue: "42 Maple Street, Springfield, IL 62701",
    status: "REJECTED",
    confidence: 84,
    reason: "Suite unit discrepancy flagged as unsafe without human verification.",
    riskLevel: "high",
    createdAt: "Yesterday",
  },
];

export default function Approvals() {
  const [proposals, setProposals] = useState<ProposalItem[]>(INITIAL_PROPOSALS);
  const [filter, setFilter] = useState("all");
  const [batchActionRunning, setBatchActionRunning] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return proposals;
    if (filter === "pending") return proposals.filter((p) => p.status === "PENDING_APPROVAL");
    if (filter === "approved") return proposals.filter((p) => p.status === "APPROVED");
    if (filter === "rejected") return proposals.filter((p) => p.status === "REJECTED");
    return proposals;
  }, [filter, proposals]);

  const pendingCount = proposals.filter((p) => p.status === "PENDING_APPROVAL").length;

  const handleApprove = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" as const } : p))
    );
  };

  const handleReject = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "REJECTED" as const } : p))
    );
  };

  const user = getStoredUser();
  const isViewer = user?.role === "VIEWER";

  const handleApproveAllPending = async () => {
    if (isViewer) return;
    setBatchActionRunning(true);
    await new Promise((r) => setTimeout(r, 600));
    setProposals((prev) =>
      prev.map((p) => (p.status === "PENDING_APPROVAL" ? { ...p, status: "APPROVED" as const } : p))
    );
    setBatchActionRunning(false);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Agent Approvals</h1>
          <p className={`mt-1 max-w-[52ch] text-sm md:text-base ${muted}`}>
            ListoraAI prepares diff-based proposals. Nothing touches live external directories until you approve it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && !isViewer && (
            <button
              type="button"
              disabled={batchActionRunning}
              onClick={handleApproveAllPending}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:brightness-110 disabled:opacity-60",
                focus
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {batchActionRunning ? "Approving…" : `Approve all pending (${pendingCount})`}
            </button>
          )}
        </div>
      </div>

      {isViewer && (
        <div className="flex items-center gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-300">
          <Eye className="h-4 w-4 shrink-0 text-blue-400" />
          <span>
            <strong>Viewer Role (Read-Only):</strong> You can inspect all proposed diffs, risk calculations, and agent rationales. Approval and rejection actions require an <strong>Operator</strong> or <strong>Admin</strong> role.
          </span>
        </div>
      )}


      {/* Tabs Filter */}
      <Tabs.Root value={filter} onValueChange={setFilter} className="flex flex-col gap-4">
        <Tabs.List className="inline-flex gap-1 rounded-lg border border-[var(--border)] bg-black/40 p-1 self-start">
          <Tabs.Tab
            value="all"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === "all" ? "bg-white/10 text-[var(--foreground)]" : muted,
              focus
            )}
          >
            All ({proposals.length})
          </Tabs.Tab>
          <Tabs.Tab
            value="pending"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === "pending" ? "bg-white/10 text-[var(--foreground)]" : muted,
              focus
            )}
          >
            Pending ({pendingCount})
          </Tabs.Tab>
          <Tabs.Tab
            value="approved"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === "approved" ? "bg-white/10 text-[var(--foreground)]" : muted,
              focus
            )}
          >
            Approved ({proposals.filter((p) => p.status === "APPROVED").length})
          </Tabs.Tab>
          <Tabs.Tab
            value="rejected"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === "rejected" ? "bg-white/10 text-[var(--foreground)]" : muted,
              focus
            )}
          >
            Rejected ({proposals.filter((p) => p.status === "REJECTED").length})
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>

      {/* Proposal Cards List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[#0d0d0d]/80 p-8 text-center">
            <p className={muted}>No proposals match the current filter.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--border)] bg-[#0d0d0d]/80 p-4 sm:p-5 transition-colors hover:border-white/20"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-neutral-300">
                      {item.platform}
                    </span>
                    <span className="text-[var(--border)]">•</span>
                    <span className="capitalize font-medium text-neutral-400">
                      Field: <span className="text-neutral-200">{item.field}</span>
                    </span>
                    <span className="text-[var(--border)]">•</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                        item.riskLevel === "low" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                        item.riskLevel === "medium" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                        item.riskLevel === "high" && "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      )}
                    >
                      {item.riskLevel} risk
                    </span>
                    <span className="ml-auto text-neutral-500 md:ml-0">{item.createdAt}</span>
                  </div>

                  {/* Diff View */}
                  <div className="grid gap-2 sm:grid-cols-2 rounded-lg border border-[var(--border)] bg-black/40 p-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-rose-400/80 mb-1">
                        Current Listing Value
                      </p>
                      <p className="text-xs font-mono text-neutral-300 break-all bg-rose-950/20 p-2 rounded border border-rose-900/30">
                        {item.oldValue || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/80 mb-1">
                        Proposed Replacement
                      </p>
                      <p className="text-xs font-mono text-emerald-300 break-all bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                        {item.newValue}
                      </p>
                    </div>
                  </div>

                  <p className={`text-xs ${muted}`}>
                    <Sparkles className="inline-block h-3 w-3 mr-1 text-neutral-400" />
                    <span className="text-neutral-300 font-medium">Agent rationale:</span> {item.reason}
                  </p>
                </div>

                {/* Status or Action Buttons */}
                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-2 md:pt-0">
                  {item.status === "PENDING_APPROVAL" ? (
                    isViewer ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                        <Lock className="h-3 w-3" /> Read-Only
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25",
                            focus
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(item.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800",
                            focus
                          )}
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )
                  ) : item.status === "APPROVED" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                      <Check className="h-3 w-3" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-400">
                      <X className="h-3 w-3" /> Rejected
                    </span>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
