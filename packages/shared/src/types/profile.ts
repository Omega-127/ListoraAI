/**
 * BusinessProfile — the single source of truth for a business's approved information.
 * Stored in PostgreSQL; every update is audited.
 */
export interface BusinessProfile {
  /** UUID primary key */
  id: string;

  /** Legal / display name of the business */
  name: string;

  /** Full street address (single-line or structured) */
  address: string;

  /** Phone number stored in E.164 format, e.g. +15550102234 */
  phone: string;

  /** Regular opening hours keyed by weekday */
  regularHours: RegularHours;

  /** Holiday or special-schedule overrides */
  holidayHours: HolidayHours[];

  /** Timestamp of the last owner-approved update */
  updatedAt: string; // ISO 8601
}

/** Opening hours for a single day */
export interface DayHours {
  /** Whether the business is open on this day */
  open: boolean;
  /** Opening time in HH:mm 24-hour format, e.g. "09:00" */
  openTime?: string;
  /** Closing time in HH:mm 24-hour format, e.g. "17:30" */
  closeTime?: string;
}

/** Regular weekly hours indexed by day name */
export type RegularHours = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

/** A single holiday or special-schedule entry */
export interface HolidayHours {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Human-readable label, e.g. "Christmas Day" */
  label: string;
  /** Whether the business is closed on this date */
  closed: boolean;
  /** Optional custom hours if not fully closed */
  openTime?: string;
  closeTime?: string;
}
