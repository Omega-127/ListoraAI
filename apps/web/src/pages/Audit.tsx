import { useState, useEffect } from "react";
import { Search, User, Bot, Server, ChevronRight } from "lucide-react";
import { Accordion } from "@animate-ui/react/primitives/base-ui/accordion";
import { cn } from "../lib/cn";
import { focus, muted } from "../lib/styles";
import { fetchAuditLogs } from "../lib/api";

export type AuditEvent = {
  id: string;
  eventType: string;
  actor: "owner" | "agent" | "system";
  actorEmail?: string;
  timestamp: string;
  summary: string;
  payload: Record<string, any>;
};

const INITIAL_LOGS: AuditEvent[] = [
  {
    id: "aud-001",
    eventType: "PROPOSAL_APPROVED",
    actor: "owner",
    actorEmail: "sarvesh@listora.ai",
    timestamp: "2026-10-23 18:45:12",
    summary: "Approved update proposal for phone number on Google Maps (India)",
    payload: {
      proposalId: "prop-1",
      platform: "Google Maps (India)",
      connectionMode: "DEMO",
      field: "phone",
      value: "+918041234567",
      requiresManualAction: false,
    },
  },
  {
    id: "aud-002",
    eventType: "UPDATE_BLOCKED",
    actor: "system",
    timestamp: "2026-10-23 18:32:10",
    summary: "Mappls (MapmyIndia) listing sync blocked: Public API is read-only",
    payload: {
      platform: "Mappls (MapmyIndia)",
      connectionMode: "LIVE",
      field: "hours",
      outcome: "BLOCKED",
      reason: "Official Mappls public REST tier does not support automated listing edits. Manual business portal sync required.",
      requiresManualAction: true,
    },
  },
  {
    id: "aud-003",
    eventType: "AGENT_TOOL_CALL",
    actor: "agent",
    timestamp: "2026-10-23 18:30:04",
    summary: "Agent executed compareFields tool across Google Maps, Mappls, and Justdial",
    payload: {
      tool: "compareFields",
      platforms: ["Google Maps (India)", "Mappls (MapmyIndia)", "Justdial (India)"],
      fieldsChecked: ["name", "address", "phone", "regularHours", "holidayHours"],
      mismatchesFound: 3,
      model: "grok-beta",
    },
  },
  {
    id: "aud-004",
    eventType: "POLICY_RESTRICTION",
    actor: "system",
    timestamp: "2026-10-23 18:15:20",
    summary: "Justdial (India) holiday hours update flagged for merchant verification",
    payload: {
      platform: "Justdial (India)",
      connectionMode: "LIVE",
      field: "holidayHours",
      outcome: "BLOCKED",
      policy: "Public holiday operating schedule policy lock prevents automated edits without verified merchant PIN confirmation.",
      requiresManualAction: true,
    },
  },
  {
    id: "aud-005",
    eventType: "UPDATE_APPLIED",
    actor: "agent",
    timestamp: "2026-10-23 18:00:29",
    summary: "Dispatched API update for holiday hours on Google Maps (India)",
    payload: {
      platform: "Google Maps (India)",
      connectionMode: "DEMO",
      endpoint: "PATCH /api/v1/mock/google-maps-india/listing_001",
      statusCode: 200,
      latencyMs: 142,
      verificationResult: "VERIFIED",
    },
  },
  {
    id: "aud-006",
    eventType: "PROFILE_UPDATED",
    actor: "owner",
    actorEmail: "sarvesh@listora.ai",
    timestamp: "2026-10-23 16:12:00",
    summary: "Updated canonical operating schedule for Indiranagar location",
    payload: {
      previous: "08:00-22:00",
      next: "07:00-22:00",
    },
  },
];

export default function Audit() {
  const [logs, setLogs] = useState<AuditEvent[]>(INITIAL_LOGS);
  const [filterActor, setFilterActor] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadLogs() {
      try {
        const fresh = await fetchAuditLogs();
        if (!cancelled && Array.isArray(fresh) && fresh.length > 0) {
          setLogs((prev) => {
            const seen = new Set(prev.map((l) => l.id));
            const newEntries = fresh.filter((f) => !seen.has(f.id));
            return [...newEntries, ...prev];
          });
        }
      } catch {
        // ignore
      }
    }
    loadLogs();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = logs.filter((log) => {
    if (filterActor !== "all" && log.actor !== filterActor) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        log.eventType.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getActorBadge = (actor: AuditEvent["actor"]) => {
    switch (actor) {
      case "owner":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <User className="h-3 w-3" /> Owner
          </span>
        );
      case "agent":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <Bot className="h-3 w-3" /> Agent
          </span>
        );
      case "system":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-black/5 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-[var(--foreground)] border border-[var(--border)]">
            <Server className="h-3 w-3" /> System
          </span>
        );
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Audit Trail</h1>
          <p className={`mt-1 max-w-[50ch] text-sm md:text-base ${muted}`}>
            Immutable chronological record of owner overrides, agent tool calls, and platform synchronization events.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search events or emails…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-neutral-400 shadow-sm",
              focus
            )}
          />
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterActor("all")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors border border-[var(--border)]",
              filterActor === "all"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            All Actors
          </button>
          <button
            type="button"
            onClick={() => setFilterActor("owner")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors border border-[var(--border)]",
              filterActor === "owner"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            Owner
          </button>
          <button
            type="button"
            onClick={() => setFilterActor("agent")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors border border-[var(--border)]",
              filterActor === "agent"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            Agent
          </button>
          <button
            type="button"
            onClick={() => setFilterActor("system")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors border border-[var(--border)]",
              filterActor === "system"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            System
          </button>
        </div>
      </div>

      {/* Accordion Audit Entries */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <Accordion.Root defaultValue={["aud-001"]} className="divide-y divide-[var(--border)]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
              No audit entries matched your query.
            </div>
          ) : (
            filtered.map((log) => (
              <Accordion.Item key={log.id} value={log.id} className="group">
                <Accordion.Header>
                  <Accordion.Trigger
                    className={cn(
                      "flex w-full items-center justify-between p-4 text-left hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors",
                      focus
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getActorBadge(log.actor)}
                        <span className="font-mono text-xs font-semibold text-[var(--foreground)]">
                          {log.eventType}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--foreground)]">{log.summary}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] text-[var(--muted-foreground)]">{log.timestamp}</span>
                      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className="bg-slate-50 dark:bg-black/40 px-4 pb-4 pt-1">
                  <div className="rounded-lg border border-[var(--border)] bg-white dark:bg-black/60 p-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)] text-[11px] text-[var(--muted-foreground)]">
                      <span>Event Payload (JSON Schema)</span>
                      {log.actorEmail && <span>Initiator: {log.actorEmail}</span>}
                    </div>
                    <pre className="font-mono text-[11px] text-[var(--foreground)] overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            ))
          )}
        </Accordion.Root>
      </div>
    </div>
  );
}
