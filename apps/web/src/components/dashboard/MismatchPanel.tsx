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
  { value: "outdated", label: "Outdated" },
  { value: "conflicting", label: "Conflicting" },
  { value: "missing", label: "Missing" },
  { value: "needs_review", label: "Needs review" },
];

type MismatchPanelProps = {
  mismatches: MismatchRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
};

function rowsFor(filter: string, mismatches: MismatchRow[]) {
  return filter === "all" ? mismatches : mismatches.filter((m) => m.kind === filter);
}

export function MismatchPanel({ mismatches, selected, onToggle }: MismatchPanelProps) {
  const [filter, setFilter] = useState("all");
  const shown = useMemo(() => rowsFor(filter, mismatches), [filter, mismatches]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#0d0d0d]/80 p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Mismatches</h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Select what to send to approvals. Nothing updates until you apply.
          </p>
        </div>
        <p className={`text-sm tabular-nums ${muted}`}>
          {selected.size} selected · {shown.length} shown
        </p>
      </div>

      <Tabs.Root value={filter} onValueChange={setFilter} className="mt-5">
        <Tabs.List className="relative flex flex-wrap gap-1 rounded-lg bg-white/5 p-1">
          {FILTERS.map((f) => (
            <Tabs.Tab
              key={f.value}
              value={f.value}
              className={cn(
                "relative z-10 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                "data-[active]:bg-white/10 data-[active]:text-[var(--foreground)]",
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
                            className={cn(
                              "relative flex h-4 w-4 items-center justify-center rounded border border-white/25 bg-transparent transition-colors data-[checked]:border-transparent data-[checked]:bg-[var(--primary)] data-[checked]:text-[var(--primary-foreground)]",
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
                              <span className="truncate">
                                {row.platform} · {row.field}
                              </span>
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
                                <span className="text-[var(--foreground)]">Profile:</span>{" "}
                                <span className="tabular-nums">{row.profileValue}</span>
                              </p>
                              <p className="mt-1">
                                <span className="text-[var(--foreground)]">Listing:</span>{" "}
                                <span className="tabular-nums line-through decoration-white/30">
                                  {row.listingValue ?? "—"}
                                </span>
                              </p>
                              <p className="mt-2">{row.explanation}</p>
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
