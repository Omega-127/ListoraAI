import type { AlertItem } from "../../lib/dashboard-data";
import { cn } from "../../lib/cn";

const TONE: Record<AlertItem["tone"], string> = {
  warn: "border-[#fbbf24]/25 bg-[#fbbf24]/5 text-[#fbbf24]",
  blocked: "border-white/15 bg-white/5 text-[var(--muted-foreground)]",
  info: "border-[#60a5fa]/25 bg-[#60a5fa]/5 text-[#60a5fa]",
};

export function AlertsRail({ alerts }: { alerts: AlertItem[] }) {
  return (
    <ul className="grid gap-2 md:grid-cols-3">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            TONE[alert.tone],
          )}
        >
          {alert.text}
        </li>
      ))}
    </ul>
  );
}
