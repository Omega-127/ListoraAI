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

export const DEMO_DASHBOARD: DashboardSnapshot = {
  score: 67,
  matching: 6,
  eligible: 9,
  pendingApprovals: 3,
  recheckProgress: 0,
  listings: [
    {
      id: "lst-a",
      platform: "mockMapsA",
      label: "Maps A",
      writable: true,
      values: {
        name: "Bella Cucina Ristorante",
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
        name: "Bella Cucina",
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
        name: "Bella Cucina Ristorante",
        phone: "+1 555 010 2234",
        hours: "Mon–Sat 7–5",
        holiday: "Open Dec 25",
      },
      mismatchCount: 1,
    },
  ],
  mismatches: [
    {
      id: "mm-1",
      listingId: "lst-a",
      platform: "Maps A",
      field: "Hours",
      profileValue: "Mon–Sat 7–5",
      listingValue: "Mon–Fri 8–4",
      kind: "outdated",
      explanation: "Customers searching weekday evenings will see a closed listing even though you are open.",
    },
    {
      id: "mm-2",
      listingId: "lst-a",
      platform: "Maps A",
      field: "Holiday",
      profileValue: "Closed Dec 25",
      listingValue: "Open Dec 25",
      kind: "conflicting",
      explanation: "Holiday hours disagree with your approved profile. Search rankings punish temporary-hours drift.",
    },
    {
      id: "mm-3",
      listingId: "lst-b",
      platform: "Maps B",
      field: "Phone",
      profileValue: "+15550102234",
      listingValue: "555 0124",
      kind: "outdated",
      explanation: "The listed number rings elsewhere. Maps B is read-only, so this needs a manual block status.",
    },
    {
      id: "mm-4",
      listingId: "lst-b",
      platform: "Maps B",
      field: "Name",
      profileValue: "Bella Cucina Ristorante",
      listingValue: "Bella Cucina",
      kind: "needs_review",
      explanation: "Short vs full legal name — the agent will not choose without you.",
    },
    {
      id: "mm-5",
      listingId: "lst-c",
      platform: "Directory C",
      field: "Holiday",
      profileValue: "Closed Dec 25",
      listingValue: "Open Dec 25",
      kind: "missing",
      explanation: "Directory C still advertises Christmas hours that no longer match the kitchen schedule.",
    },
  ],
  alerts: [
    { id: "a1", tone: "warn", text: "5 mismatches need review before any update is sent." },
    { id: "a2", tone: "blocked", text: "Maps B is read-only — phone changes will be blocked." },
    { id: "a3", tone: "info", text: "3 proposals are waiting for your approval." },
  ],
};

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
