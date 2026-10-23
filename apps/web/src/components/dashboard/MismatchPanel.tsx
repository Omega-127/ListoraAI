import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Tabs } from "@animate-ui/react/primitives/base-ui/tabs";
import { Accordion } from "@animate-ui/react/primitives/base-ui/accordion";
import { Checkbox } from "@animate-ui/react/primitives/base-ui/checkbox";
import {
  KIND_LABEL,
  KIND_TONE,
  type MismatchKind,
  type MismatchRow,
} from "../../lib/dashboard-data";
import { cn } from "../../lib/cn";
import { focus, muted } from "../../lib/styles";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "outdated", label: "Outdated" },
  { value: "conflicting", label: "Conflicting" },
  { value: "missing", label: "Missing" },
  { value: "needs_review", label: "Needs review" },
];

type MismatchPanelProps = {
  mismatches: MismatchRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onApproveMismatch?: (id: string) => void;
};

function rowsFor(filter: string, mismatches: MismatchRow[]) {
  if (filter === "all") return mismatches;
  if (filter === "pending") return mismatches.filter((m) => m.status === "pending");
  if (filter === "approved") return mismatches.filter((m) => m.status === "approved" || m.status === "applied");
  return mismatches.filter((m) => m.kind === filter);
}

export function MismatchPanel({ mismatches, selected, onToggle, onApproveMismatch }: MismatchPanelProps) {
  const [filter, setFilter] = useState("all");
  const shown = useMemo(() => rowsFor(filter, mismatches), [filter, mismatches]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Mismatches & Proposals</h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Approve changes to apply verified profile data directly to live listings.
          </p>
        </div>
        <p className={`text-sm tabular-nums ${muted}`}>
          {selected.size} selected · {shown.length} shown
        </p>
      </div>

      <Tabs.Root value={filter} onValueChange={setFilter} className="mt-5">
        <Tabs.List className="relative flex flex-wrap gap-1 rounded-lg bg-black/5 dark:bg-white/5 p-1">
          {FILTERS.map((f) => (
            <Tabs.Tab
              key={f.value}
              value={f.value}
              className={cn(
                "relative z-10 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                "data-[active]:bg-white dark:data-[active]:bg-white/10 data-[active]:text-[var(--foreground)] data-[active]:shadow-sm",
                muted,
                focus,
              )}
            >
              {f.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {FILTERS.map((f) => {
          const rows = rowsFor(f.value, mismatches);
          return (
            <Tabs.Panel key={f.value} value={f.value} className="mt-4 outline-none">
              <Accordion.Root className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
                {rows.length === 0 ? (
                  <p className={`px-4 py-8 text-center text-sm ${muted}`}>
                    No mismatches in this filter.
                  </p>
                ) : (
                  rows.map((row) => (
                    <Accordion.Item key={row.id} value={row.id} className="px-3">
                      <div className="flex items-start gap-3 py-3">
                        <label className="mt-0.5 flex cursor-pointer items-center">
                          <Checkbox.Root
                            checked={selected.has(row.id)}
                            onCheckedChange={() => onToggle(row.id)}
                            disabled={row.status === "approved" || row.status === "applied"}
                            className={cn(
                              "relative flex h-4 w-4 items-center justify-center rounded border border-[var(--border)] dark:border-white/25 bg-transparent transition-colors data-[checked]:border-transparent data-[checked]:bg-[var(--primary)] data-[checked]:text-[var(--primary-foreground)] disabled:opacity-40",
                              "before:absolute before:-inset-px before:rounded before:bg-[var(--primary)] before:opacity-0 before:transition-[opacity,transform] before:duration-300 data-[checked]:before:scale-100 data-[checked]:before:opacity-100 before:scale-[0.7]",
                              focus,
                            )}
                            aria-label={`Select ${row.platform} ${row.field}`}
                          >
                            <Checkbox.Indicator className="relative text-current">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </Checkbox.Indicator>
                          </Checkbox.Root>
                        </label>

                        <div className="min-w-0 flex-1">
                          <Accordion.Header>
                            <Accordion.Trigger
                              className={cn(
                                "flex w-full items-center justify-between gap-3 text-left text-sm font-medium",
                                focus,
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="truncate">
                                  {row.platform} · {row.field}
                                </span>
                                {(row.status === "approved" || row.status === "applied") && (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <Check className="h-3 w-3" /> Approved
                                  </span>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  KIND_TONE[row.kind as MismatchKind],
                                )}
                              >
                                {KIND_LABEL[row.kind as MismatchKind]}
                              </span>
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Panel className="overflow-hidden text-sm">
                            <div className={`pb-3 pt-2 ${muted}`}>
                              <p>
                                <span className="text-[var(--foreground)] font-medium">Profile Target:</span>{" "}
                                <span className="tabular-nums font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                  {row.profileValue}
                                </span>
                              </p>
                              <p className="mt-1">
                                <span className="text-[var(--foreground)] font-medium">Listing Value:</span>{" "}
                                <span className={cn("tabular-nums font-mono", row.status === "approved" || row.status === "applied" ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "line-through decoration-rose-500/50 text-rose-600 dark:text-rose-400")}>
                                  {row.listingValue ?? "—"}
                                </span>
                              </p>
                              <p className="mt-2 text-xs">{row.explanation}</p>

                              {row.status === "pending" && onApproveMismatch && (
                                <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between">
                                  <span className="text-xs text-[var(--muted-foreground)]">
                                    Approved changes update the dashboard and connected directories.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onApproveMismatch(row.id)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Approve & Sync
                                  </button>
                                </div>
                              )}
                              {(row.status === "approved" || row.status === "applied") && (
                                <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approved — Value applied to listing above</span>
                                </div>
                              )}
                            </div>
                          </Accordion.Panel>
                        </div>
                      </div>
                    </Accordion.Item>
                  ))
                )}
              </Accordion.Root>
            </Tabs.Panel>
          );
        })}
      </Tabs.Root>
    </div>
  );
}
