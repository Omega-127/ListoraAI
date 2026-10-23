import type { AlertItem } from "../../lib/dashboard-data";
import { cn } from "../../lib/cn";

const TONE: Record<AlertItem["tone"], string> = {
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-[#fbbf24]",
  blocked: "border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 text-[var(--foreground)]",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-[#60a5fa]",
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
