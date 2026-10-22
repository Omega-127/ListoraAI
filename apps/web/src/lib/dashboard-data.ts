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
  listings: ListingSnapshot[];
  mismatches: MismatchRow[];
  alerts: AlertItem[];
  recheckProgress: number;
};

export function buildDashboardSnapshot(profile: {
  name: string;
  address: string;
  phone: string;
  regularHours: Record<string, string>;
  holidayHours: Record<string, string>;
}): DashboardSnapshot {
  const profileName = profile.name || "Brew & Bloom Café";
  const profilePhone = profile.phone || "+15550102234";
  const formattedProfileHours = profile.regularHours?.monday ? `Mon-Fri ${profile.regularHours.monday}` : "Mon–Sat 7–5";
  const holidayEntry = Object.entries(profile.holidayHours || {})[0];
  const profileHoliday = holidayEntry ? `${holidayEntry[1] === "closed" ? "Closed" : "Open"} ${holidayEntry[0]}` : "Closed Dec 25";

  const mismatches: MismatchRow[] = [
    {
      id: "mm-1",
      listingId: "lst-a",
      platform: "Maps A",
      field: "Hours",
      profileValue: formattedProfileHours,
      listingValue: "Mon–Fri 8–4",
      kind: "outdated",
      explanation: `Listing hours differ from approved profile (${formattedProfileHours}). Customers will see incorrect open hours.`,
    },
    {
      id: "mm-2",
      listingId: "lst-a",
      platform: "Maps A",
      field: "Holiday",
      profileValue: profileHoliday,
      listingValue: "Open Dec 25",
      kind: "conflicting",
      explanation: `Holiday hours contradict canonical profile target (${profileHoliday}). Search engines penalize temporary hours drift.`,
    },
    {
      id: "mm-3",
      listingId: "lst-b",
      platform: "Maps B",
      field: "Phone",
      profileValue: profilePhone,
      listingValue: "555 0124",
      kind: "outdated",
      explanation: `Listed number rings elsewhere instead of canonical (${profilePhone}). Maps B is read-only, so changes require a manual block record.`,
    },
    {
      id: "mm-4",
      listingId: "lst-b",
      platform: "Maps B",
      field: "Name",
      profileValue: profileName,
      listingValue: profileName.includes(" ") ? profileName.split(" ").slice(0, 2).join(" ") : profileName,
      kind: "needs_review",
      explanation: `Short trade name vs registered legal name (${profileName}) — human verification recommended before submission.`,
    },
    {
      id: "mm-5",
      listingId: "lst-c",
      platform: "Directory C",
      field: "Holiday",
      profileValue: profileHoliday,
      listingValue: "Open Dec 25",
      kind: "missing",
      explanation: `Directory C still advertises outdated holiday hours that no longer match the kitchen schedule (${profileHoliday}).`,
    },
  ];

  const totalEligible = 9;
  const mismatchCount = mismatches.length;
  const matching = Math.max(1, totalEligible - mismatchCount + 2);
  const score = Math.round((matching / totalEligible) * 100);

  return {
    score,
    matching,
    eligible: totalEligible,
    pendingApprovals: 3,
    recheckProgress: 0,
    listings: [
      {
        id: "lst-a",
        platform: "mockMapsA",
        label: "Maps A",
        writable: true,
        values: {
          name: profileName,
          phone: "(555) 010-2234",
          hours: "Mon–Fri 8–4",
          holiday: "Open Dec 25",
        },
        mismatchCount: 2,
      },
      {
        id: "lst-b",
        platform: "mockMapsB",
        label: "Maps B",
        writable: false,
        values: {
          name: profileName.includes(" ") ? profileName.split(" ").slice(0, -1).join(" ") || profileName : profileName,
          phone: "555 0124",
          hours: "Mon–Sat 7–5",
          holiday: "—",
        },
        mismatchCount: 2,
      },
      {
        id: "lst-c",
        platform: "mockDirectoryC",
        label: "Directory C",
        writable: true,
        values: {
          name: profileName,
          phone: profilePhone,
          hours: formattedProfileHours,
          holiday: "Open Dec 25",
        },
        mismatchCount: 1,
      },
    ],
    mismatches,
    alerts: [
      { id: "a1", tone: "warn", text: `${mismatchCount} mismatches detected against ${profileName}.` },
      { id: "a2", tone: "blocked", text: "Maps B is read-only — phone changes will be blocked." },
      { id: "a3", tone: "info", text: "3 sync proposals are waiting for your approval." },
    ],
  };
}

export const DEMO_DASHBOARD: DashboardSnapshot = buildDashboardSnapshot({
  name: "Brew & Bloom Café",
  address: "42 Maple Street, Springfield, IL 62701",
  phone: "+15550102234",
  regularHours: {
    monday: "07:00-18:00",
  },
  holidayHours: {
    "2026-12-25": "closed",
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
