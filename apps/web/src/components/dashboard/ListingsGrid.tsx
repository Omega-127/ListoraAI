import type { ListingSnapshot } from "../../lib/dashboard-data";
import { muted } from "../../lib/styles";
import { cn } from "../../lib/cn";

type ListingsGridProps = {
  listings: ListingSnapshot[];
};

export function ListingsGrid({ listings }: ListingsGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {listings.map((listing) => (
        <article
          key={listing.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-[var(--foreground)]">{listing.label}</h3>
                <p className={`mt-0.5 text-xs ${muted}`}>{listing.platform}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                    listing.connectionMode === "LIVE"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
                  )}
                >
                  {listing.connectionMode === "LIVE" ? "Live API" : "Demo Mode"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    listing.writable
                      ? "text-sky-500/90"
                      : "text-[var(--muted-foreground)]",
                  )}
                >
                  {listing.writable ? "Writable" : "Read-only"}
                </span>
              </div>
            </div>

            <dl className="mt-4 space-y-2 text-xs">
              {(
                [
                  ["Name", listing.values.name, listing.fieldStatuses?.name],
                  ["Address", listing.values.address, listing.fieldStatuses?.address],
                  ["Phone", listing.values.phone, listing.fieldStatuses?.phone],
                  ["Hours", listing.values.hours, listing.fieldStatuses?.hours],
                  ["Holiday", listing.values.holiday, listing.fieldStatuses?.holiday],
                ] as const
              ).map(([label, value, status]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-2 border-t border-[var(--border)] pt-2 first:border-t-0 first:pt-0"
                >
                  <dt className={`shrink-0 ${muted}`}>{label}</dt>
                  <dd className="flex items-center gap-1.5 min-w-0 text-right font-mono">
                    <span className="truncate max-w-[150px] text-right" title={value || "—"}>
                      {value || "—"}
                    </span>
                    {status === "missing" && (
                      <span className="shrink-0 text-[10px] font-sans px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        Missing
                      </span>
                    )}
                    {status === "difference" && (
                      <span className="shrink-0 text-[10px] font-sans px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Diff
                      </span>
                    )}
                    {status === "ok" && (
                      <span className="shrink-0 text-[10px] font-sans px-1 py-0.2 rounded text-emerald-400">
                        ✓
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-4 pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <p className={`text-xs ${listing.mismatchCount ? "text-[#fbbf24]" : muted}`}>
              {listing.mismatchCount
                ? `${listing.mismatchCount} mismatch${listing.mismatchCount === 1 ? "" : "es"}`
                : "All checked fields match"}
            </p>
            {listing.writable ? (
              <span className="text-[10px] text-emerald-400">Sync ready</span>
            ) : (
              <span className="text-[10px] text-[var(--muted-foreground)]">Manual Portal Sync</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
