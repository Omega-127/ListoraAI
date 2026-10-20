import { Link, useLocation } from "react-router-dom";
import { focus, muted } from "../lib/styles";

const TITLES: Record<string, { title: string; blurb: string }> = {
  "/dashboard/profile": {
    title: "Profile",
    blurb: "Your approved business name, address, phone, hours, and holiday schedule.",
  },
  "/dashboard/approvals": {
    title: "Approvals",
    blurb: "Review agent proposals, preview what-if changes, then approve or reject.",
  },
  "/dashboard/report": {
    title: "Report",
    blurb: "Before-and-after values for every field and platform after updates run.",
  },
  "/dashboard/score": {
    title: "Score",
    blurb: "Field-by-field consistency breakdown across eligible platforms.",
  },
  "/dashboard/audit": {
    title: "Audit",
    blurb: "Chronological log of owner actions and agent tool calls.",
  },
  "/dashboard/alerts": {
    title: "Alerts",
    blurb: "Unresolved mismatches, pending approvals, blocked listings, and failed updates.",
  },
};

export default function DashboardPlaceholder() {
  const { pathname } = useLocation();
  const meta = TITLES[pathname] ?? {
    title: "Coming soon",
    blurb: "This section of the owner workspace is next.",
  };

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <p className={`text-xs font-medium uppercase tracking-wider ${muted}`}>Next up</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{meta.title}</h1>
      <p className={`mx-auto mt-3 max-w-[42ch] text-base ${muted}`}>{meta.blurb}</p>
      <Link
        to="/dashboard"
        className={`mt-8 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-white/5 ${focus}`}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
