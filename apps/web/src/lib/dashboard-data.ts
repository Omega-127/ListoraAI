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
  const profileName = profile.name || "The Bombay Roastery & Café";
  const profilePhone = profile.phone || "+918041234567";
  const formattedProfileHours = profile.regularHours?.monday ? `Mon-Fri ${profile.regularHours.monday}` : "Mon–Sat 07:00-22:00";
  const holidayEntry = Object.entries(profile.holidayHours || {})[0];
  const profileHoliday = holidayEntry ? `${holidayEntry[1] === "closed" ? "Closed" : "Open"} ${holidayEntry[0]}` : "Closed Jan 26";

  const mismatches: MismatchRow[] = [
    {
      id: "mm-1",
      listingId: "lst-a",
      platform: "Google Maps (India)",
      field: "Hours",
      profileValue: formattedProfileHours,
      listingValue: "Mon–Fri 8–20",
      kind: "outdated",
      explanation: `Listing hours differ from approved profile (${formattedProfileHours}). Customers visiting in Indiranagar will see incorrect open hours.`,
    },
    {
      id: "mm-2",
      listingId: "lst-a",
      platform: "Google Maps (India)",
      field: "Holiday",
      profileValue: profileHoliday,
      listingValue: "Open Jan 26",
      kind: "conflicting",
      explanation: `Holiday hours contradict canonical profile target (${profileHoliday}). Search engines penalize temporary Republic Day hours drift.`,
    },
    {
      id: "mm-3",
      listingId: "lst-b",
      platform: "Mappls (MapmyIndia)",
      field: "Phone",
      profileValue: profilePhone,
      listingValue: "080 4123 4567",
      kind: "outdated",
      explanation: `Listed number lacks international E.164 prefix (+91). Mappls is read-only for public API tier, so changes require a partner block record.`,
    },
    {
      id: "mm-4",
      listingId: "lst-b",
      platform: "Mappls (MapmyIndia)",
      field: "Name",
      profileValue: profileName,
      listingValue: "Bombay Roastery",
      kind: "needs_review",
      explanation: `Short trade name vs registered legal trade name (${profileName}) — human verification recommended before submission.`,
    },
    {
      id: "mm-5",
      listingId: "lst-c",
      platform: "Justdial (India)",
      field: "Holiday",
      profileValue: profileHoliday,
      listingValue: "Open Jan 26",
      kind: "missing",
      explanation: `Justdial still advertises open hours for Republic Day that contradict your closed schedule (${profileHoliday}).`,
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
        platform: "googleMaps",
        label: "Google Maps (India)",
        writable: true,
        values: {
          name: profileName,
          phone: "080 4123 4567",
          hours: "Mon–Fri 8–20",
          holiday: "Open Jan 26",
        },
        mismatchCount: 2,
      },
      {
        id: "lst-b",
        platform: "mappls",
        label: "Mappls (MapmyIndia)",
        writable: false,
        values: {
          name: "Bombay Roastery",
          phone: "080 4123 4567",
          hours: "Mon–Sat 07:00-20:00",
          holiday: "—",
        },
        mismatchCount: 2,
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
          holiday: "Open Jan 26",
        },
        mismatchCount: 1,
      },
    ],
    mismatches,
    alerts: [
      { id: "a1", tone: "warn", text: `${mismatchCount} mismatches detected against ${profileName}.` },
      { id: "a2", tone: "blocked", text: "Mappls (MapmyIndia) is read-only — phone changes will be logged as blocked." },
      { id: "a3", tone: "info", text: "3 sync proposals are waiting for your approval." },
    ],
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
