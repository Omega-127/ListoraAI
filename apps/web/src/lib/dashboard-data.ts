import { getStoredProposalStatuses, type ProposalStatus } from "./proposals-store";

export type MismatchKind = "missing" | "outdated" | "conflicting" | "needs_review";

export type ListingSnapshot = {
  id: string;
  platform: string;
  label: string;
  writable: boolean;
  values: {
    name: string;
    phone: string;
    hours: string;
    holiday: string;
  };
  updatedFields?: string[];
  mismatchCount: number;
};

export type MismatchRow = {
  id: string;
  listingId: string;
  platform: string;
  field: string;
  profileValue: string;
  listingValue: string | null;
  kind: MismatchKind;
  explanation: string;
  status: "pending" | "approved" | "rejected" | "applied";
  proposalId?: string;
};

export type AlertItem = {
  id: string;
  tone: "warn" | "blocked" | "info";
  text: string;
};

export type DashboardSnapshot = {
  score: number;
  matching: number;
  eligible: number;
  pendingApprovals: number;
  approvedCount: number;
  listings: ListingSnapshot[];
  mismatches: MismatchRow[];
  alerts: AlertItem[];
  recheckProgress: number;
};

export function buildDashboardSnapshot(
  profile: {
    name: string;
    address: string;
    phone: string;
    regularHours: Record<string, string>;
    holidayHours: Record<string, string>;
  },
  statusesOverride?: Record<string, ProposalStatus>
): DashboardSnapshot {
  const statuses = statusesOverride || getStoredProposalStatuses();

  const isApproved = (id: string) => statuses[id] === "APPROVED" || statuses[id] === "APPLIED";
  const isRejected = (id: string) => statuses[id] === "REJECTED";

  const profileName = profile.name || "The Bombay Roastery & Café";
  const profilePhone = profile.phone || "+918041234567";
  const formattedProfileHours = profile.regularHours?.monday
    ? `Mon-Fri ${profile.regularHours.monday}`
    : "Mon–Sat 07:00-22:00";
  const holidayEntry = Object.entries(profile.holidayHours || {})[0];
  const profileHoliday = holidayEntry
    ? `${holidayEntry[1] === "closed" ? "Closed" : "Open"} ${holidayEntry[0]}`
    : "Closed Jan 26";

  // Check status for each known conflict
  const mm1Approved = isApproved("mm-1") || isApproved("prop-2");
  const mm2Approved = isApproved("mm-2") || isApproved("prop-4");
  const mm3Approved = isApproved("mm-3") || isApproved("prop-1");
  const mm4Approved = isApproved("mm-4") || isApproved("prop-3");
  const mm5Approved = isApproved("mm-5");

  const mismatches: MismatchRow[] = [
    {
      id: "mm-1",
      listingId: "lst-a",
      platform: "Google Maps (India)",
      field: "Hours",
      profileValue: formattedProfileHours,
      listingValue: mm1Approved ? formattedProfileHours : "Mon–Fri 8–20",
      kind: "outdated",
      status: mm1Approved ? "approved" : isRejected("mm-1") ? "rejected" : "pending",
      proposalId: "prop-2",
      explanation: mm1Approved
        ? "✓ Approved change: Operating hours synchronized with canonical profile."
        : `Listing hours differ from approved profile (${formattedProfileHours}). Customers visiting in Indiranagar will see incorrect open hours.`,
    },
    {
      id: "mm-2",
      listingId: "lst-a",
      platform: "Google Maps (India)",
      field: "Holiday",
      profileValue: profileHoliday,
      listingValue: mm2Approved ? profileHoliday : "Open Jan 26",
      kind: "conflicting",
      status: mm2Approved ? "approved" : isRejected("mm-2") ? "rejected" : "pending",
      proposalId: "prop-4",
      explanation: mm2Approved
        ? "✓ Approved change: Store marked closed on Republic Day."
        : `Holiday hours contradict canonical profile target (${profileHoliday}). Search engines penalize temporary Republic Day hours drift.`,
    },
    {
      id: "mm-3",
      listingId: "lst-b",
      platform: "Mappls (MapmyIndia)",
      field: "Phone",
      profileValue: profilePhone,
      listingValue: mm3Approved ? profilePhone : "080 4123 4567",
      kind: "outdated",
      status: mm3Approved ? "approved" : isRejected("mm-3") ? "rejected" : "pending",
      proposalId: "prop-1",
      explanation: mm3Approved
        ? "✓ Approved change: Standardized to international E.164 (+91) format."
        : `Listed number lacks international E.164 prefix (+91). Mappls is read-only for public API tier, so changes require a partner block record.`,
    },
    {
      id: "mm-4",
      listingId: "lst-b",
      platform: "Mappls (MapmyIndia)",
      field: "Name",
      profileValue: profileName,
      listingValue: mm4Approved ? profileName : "Bombay Roastery",
      kind: "needs_review",
      status: mm4Approved ? "approved" : isRejected("mm-4") ? "rejected" : "pending",
      proposalId: "prop-3",
      explanation: mm4Approved
        ? "✓ Approved change: Brand trade name aligned with registered legal trade name."
        : `Short trade name vs registered legal trade name (${profileName}) — human verification recommended before submission.`,
    },
    {
      id: "mm-5",
      listingId: "lst-c",
      platform: "Justdial (India)",
      field: "Holiday",
      profileValue: profileHoliday,
      listingValue: mm5Approved ? profileHoliday : "Open Jan 26",
      kind: "missing",
      status: mm5Approved ? "approved" : isRejected("mm-5") ? "rejected" : "pending",
      proposalId: "prop-4",
      explanation: mm5Approved
        ? "✓ Approved change: Justdial schedule aligned to closed for Republic Day."
        : `Justdial still advertises open hours for Republic Day that contradict your closed schedule (${profileHoliday}).`,
    },
  ];

  const activeMismatches = mismatches.filter((m) => m.status === "pending");
  const approvedMismatches = mismatches.filter((m) => m.status === "approved" || m.status === "applied");

  // Track updated fields on each listing
  const lstAUpdatedFields: string[] = [];
  if (mm1Approved) lstAUpdatedFields.push("Hours");
  if (mm2Approved) lstAUpdatedFields.push("Holiday");

  const lstBUpdatedFields: string[] = [];
  if (mm3Approved) lstBUpdatedFields.push("Phone");
  if (mm4Approved) lstBUpdatedFields.push("Name");

  const lstCUpdatedFields: string[] = [];
  if (mm5Approved) lstCUpdatedFields.push("Holiday");

  const lstAMismatches = [!mm1Approved, !mm2Approved].filter(Boolean).length;
  const lstBMismatches = [!mm3Approved, !mm4Approved].filter(Boolean).length;
  const lstCMismatches = [!mm5Approved].filter(Boolean).length;

  const totalEligible = 9;
  const activeCount = activeMismatches.length;
  const matching = Math.max(1, totalEligible - activeCount);
  const score = Math.min(100, Math.round((matching / totalEligible) * 100));

  const pendingApprovals = activeCount;
  const approvedCount = approvedMismatches.length;

  const alerts: AlertItem[] = [];
  if (approvedCount > 0) {
    alerts.push({
      id: "a-approved",
      tone: "info",
      text: `${approvedCount} proposal${approvedCount > 1 ? "s" : ""} approved — listing data updated on dashboard and ready for dispatch.`,
    });
  }
  if (activeCount > 0) {
    alerts.push({
      id: "a1",
      tone: "warn",
      text: `${activeCount} active mismatch${activeCount > 1 ? "es" : ""} awaiting review against ${profileName}.`,
    });
  }
  alerts.push({
    id: "a2",
    tone: "blocked",
    text: "Mappls (MapmyIndia) is read-only — approved updates require partner export.",
  });

  return {
    score,
    matching,
    eligible: totalEligible,
    pendingApprovals,
    approvedCount,
    recheckProgress: 0,
    listings: [
      {
        id: "lst-a",
        platform: "googleMaps",
        label: "Google Maps (India)",
        writable: true,
        values: {
          name: profileName,
          phone: "+918041234567",
          hours: mm1Approved ? formattedProfileHours : "Mon–Fri 8–20",
          holiday: mm2Approved ? profileHoliday : "Open Jan 26",
        },
        updatedFields: lstAUpdatedFields,
        mismatchCount: lstAMismatches,
      },
      {
        id: "lst-b",
        platform: "mappls",
        label: "Mappls (MapmyIndia)",
        writable: false,
        values: {
          name: mm4Approved ? profileName : "Bombay Roastery",
          phone: mm3Approved ? profilePhone : "080 4123 4567",
          hours: mm1Approved ? formattedProfileHours : "Mon–Sat 07:00-20:00",
          holiday: "—",
        },
        updatedFields: lstBUpdatedFields,
        mismatchCount: lstBMismatches,
      },
      {
        id: "lst-c",
        platform: "justdial",
        label: "Justdial (India)",
        writable: true,
        values: {
          name: profileName,
          phone: profilePhone,
          hours: formattedProfileHours,
          holiday: mm5Approved ? profileHoliday : "Open Jan 26",
        },
        updatedFields: lstCUpdatedFields,
        mismatchCount: lstCMismatches,
      },
    ],
    mismatches,
    alerts,
  };
}

export const DEMO_DASHBOARD: DashboardSnapshot = buildDashboardSnapshot({
  name: "The Bombay Roastery & Café",
  address: "Plot 742, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
  phone: "+918041234567",
  regularHours: {
    monday: "07:00-22:00",
    tuesday: "07:00-22:00",
    wednesday: "07:00-22:00",
    thursday: "07:00-22:00",
    friday: "07:00-23:00",
    saturday: "08:00-23:00",
    sunday: "08:00-22:00",
  },
  holidayHours: {
    "2026-01-26": "closed",
    "2026-08-15": "closed",
  },
});

export const KIND_LABEL: Record<MismatchKind, string> = {
  missing: "Missing",
  outdated: "Outdated",
  conflicting: "Conflicting",
  needs_review: "Needs review",
};

export const KIND_TONE: Record<MismatchKind, string> = {
  missing: "text-[#f87171] bg-[#f87171]/10",
  outdated: "text-[#fbbf24] bg-[#fbbf24]/10",
  conflicting: "text-[#fb923c] bg-[#fb923c]/10",
  needs_review: "text-[#60a5fa] bg-[#60a5fa]/10",
};
