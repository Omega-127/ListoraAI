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
          className="rounded-xl border border-[var(--border)] bg-[#0d0d0d]/80 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium">{listing.label}</h3>
              <p className={`mt-0.5 text-xs ${muted}`}>{listing.platform}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                listing.writable
                  ? "bg-[#10b981]/10 text-[#10b981]"
                  : "bg-white/10 text-[var(--muted-foreground)]",
              )}
            >
              {listing.writable ? "Writable" : "Read-only"}
            </span>
          </div>

          <dl className="mt-4 space-y-2 text-xs">
            {(
              [
                ["Phone", listing.values.phone],
                ["Hours", listing.values.hours],
                ["Holiday", listing.values.holiday],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-t border-[var(--border)] pt-2 first:border-t-0 first:pt-0">
                <dt className={muted}>{label}</dt>
                <dd className="truncate tabular-nums text-right">{value}</dd>
              </div>
            ))}
          </dl>

          <p className={`mt-4 text-xs ${listing.mismatchCount ? "text-[#fbbf24]" : muted}`}>
            {listing.mismatchCount
              ? `${listing.mismatchCount} mismatch${listing.mismatchCount === 1 ? "" : "es"}`
              : "All checked fields match"}
          </p>
        </article>
      ))}
    </div>
  );
}
