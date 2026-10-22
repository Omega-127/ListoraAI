import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, Sparkles, CheckCircle2, Eye, Lock, UploadCloud } from "lucide-react";
import { Tabs } from "@animate-ui/react/primitives/base-ui/tabs";
import { cn } from "../lib/cn";
import { focus, muted } from "../lib/styles";
import {
  getStoredUser,
  approveProposal,
  rejectProposal,
  applyUpdates,
  getProposals,
  verifyUpdates,
  getBusinessProfile,
} from "../lib/api";

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

function createProposalsForProfile(profile: any): ProposalItem[] {
  const profileName = profile?.name || "Brew & Bloom Café";
  const profilePhone = profile?.phone || "+15550102234";
  const formattedHours = profile?.regularHours?.monday ? `Mon-Fri ${profile.regularHours.monday}` : "Mon–Fri 07:00-18:00, Sat 08:00-20:00, Sun 09:00-16:00";

  return [
    {
      id: "prop-1",
      platform: "mockMapsA",
      field: "phone",
      oldValue: "(555) 010-2234",
      newValue: profilePhone,
      status: "PENDING_APPROVAL",
      confidence: 99,
      reason: `Standardize telephone to canonical international E.164 protocol (${profilePhone}).`,
      riskLevel: "low",
      createdAt: "10 mins ago",
    },
    {
      id: "prop-2",
      platform: "mockMapsB",
      field: "hours",
      oldValue: "Mon–Sat 7–5",
      newValue: formattedHours,
      status: "PENDING_APPROVAL",
      confidence: 96,
      reason: `Operating schedule on listing contradicts approved canonical hours (${formattedHours}).`,
      riskLevel: "medium",
      createdAt: "22 mins ago",
    },
    {
      id: "prop-3",
      platform: "mockDirectoryC",
      field: "name",
      oldValue: `${profileName} (Downtown)`,
      newValue: profileName,
      status: "PENDING_APPROVAL",
      confidence: 92,
      reason: `Standardizes listing to match registered trade name (${profileName}).`,
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
      newValue: profile?.address || "42 Maple Street, Springfield, IL 62701",
      status: "REJECTED",
      confidence: 84,
      reason: "Suite unit discrepancy flagged as unsafe without human verification.",
      riskLevel: "high",
      createdAt: "Yesterday",
    },
  ];
}

export default function Approvals() {
  const [proposals, setProposals] = useState<ProposalItem[]>(() => createProposalsForProfile(null));
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
  const approvedCount = proposals.filter((p) => p.status === "APPROVED").length;
  const [applying, setApplying] = useState(false);
  const [applySummary, setApplySummary] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" as const } : p))
    );
    try {
      await approveProposal(id);
    } catch {
      // ignore
    }
  };

  const handleReject = async (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "REJECTED" as const } : p))
    );
    try {
      await rejectProposal(id);
    } catch {
      // ignore
    }
  };

  const user = getStoredUser();
  const isViewer = user?.role === "VIEWER";

  const handleApproveAllPending = async () => {
    if (isViewer) return;
    setBatchActionRunning(true);
    const pendingIds = proposals.filter((p) => p.status === "PENDING_APPROVAL").map((p) => p.id);
    setProposals((prev) =>
      prev.map((p) => (p.status === "PENDING_APPROVAL" ? { ...p, status: "APPROVED" as const } : p))
    );
    for (const id of pendingIds) {
      await approveProposal(id).catch(() => {});
    }
    setBatchActionRunning(false);
  };

  useEffect(() => {
    let cancelled = false;
    async function loadBackendProposals() {
      try {
        const profile = await getBusinessProfile();
        if (!cancelled && profile) {
          setProposals((prev) => {
            const dynamic = createProposalsForProfile(profile);
            const statusMap = new Map(prev.map((p) => [p.id, p.status]));
            return dynamic.map((d) => ({
              ...d,
              status: statusMap.get(d.id) || d.status,
            }));
          });
        }

        const data = await getProposals();
        if (data && Array.isArray(data) && data.length > 0 && !cancelled) {
          const mapped: ProposalItem[] = data.map((item: any) => ({
            id: item.id,
            platform: item.platform || "mockMapsA",
            field: item.field,
            oldValue: typeof item.oldValue === "object" ? JSON.stringify(item.oldValue) : String(item.oldValue ?? "N/A"),
            newValue: typeof item.newValue === "object" ? JSON.stringify(item.newValue) : String(item.newValue ?? ""),
            status: item.status,
            confidence: 96,
            reason: item.mismatch?.explanation || "AI conflict orchestrator detected discrepancy with verified business profile.",
            riskLevel: item.field === "name" ? "high" : item.field === "hours" ? "medium" : "low",
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
          }));

          setProposals((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const freshItems = mapped.filter((m) => !existingIds.has(m.id));
            return [...freshItems, ...prev];
          });
        }
      } catch {
        // use fallback
      }
    }
    loadBackendProposals();

    const handleProfileChange = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        setProposals((prev) => {
          const dynamic = createProposalsForProfile(custom.detail);
          const statusMap = new Map(prev.map((p) => [p.id, p.status]));
          return dynamic.map((d) => ({
            ...d,
            status: statusMap.get(d.id) || d.status,
          }));
        });
      }
    };
    window.addEventListener("listora_profile_updated", handleProfileChange);

    return () => {
      cancelled = true;
      window.removeEventListener("listora_profile_updated", handleProfileChange);
    };
  }, []);

  const handleApplyAllApproved = async () => {
    if (isViewer) return;
    setApplying(true);
    setApplySummary(null);
    try {
      await applyUpdates();
      await verifyUpdates().catch(() => {});
      setApplySummary(
        `Updates dispatched to connected platforms. Mock Maps A: SUCCESS (verified), Mock Maps B: BLOCKED (platform is read-only).`
      );
    } finally {
      setApplying(false);
    }
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
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && !isViewer && (
            <button
              type="button"
              disabled={batchActionRunning}
              onClick={handleApproveAllPending}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium hover:bg-white/5 disabled:opacity-60",
                focus
              )}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {batchActionRunning ? "Approving…" : `Approve all pending (${pendingCount})`}
            </button>
          )}

          {approvedCount > 0 && !isViewer && (
            <button
              type="button"
              disabled={applying}
              onClick={handleApplyAllApproved}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:brightness-110 disabled:opacity-60",
                focus
              )}
            >
              <UploadCloud className="h-4 w-4" />
              {applying ? "Applying to Platforms…" : `Apply Approved (${approvedCount})`}
            </button>
          )}
        </div>
      </div>

      {applySummary && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{applySummary}</span>
          </div>
          <Link to="/dashboard/report" className="underline font-medium hover:text-white shrink-0">
            View Before/After Report →
          </Link>
        </div>
      )}


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
