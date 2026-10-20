import { z } from 'zod';

// ---- Business Profile ----
export interface BusinessProfile {
  id: string;
  name: string;
  address: string;
  phone: string; // E.164
  regularHours: Record<string, string>;
  holidayHours: Record<string, string>;
  updatedAt: string;
}

// ---- Listing ----
export interface Listing {
  id: string;
  platform: string;
  externalId: string;
  values: Record<string, unknown>;
  fetchedAt: string;
}

// ---- Mismatch ----
export type { MismatchKind } from '../constants/statuses';

export interface Mismatch {
  id: string;
  listingId: string;
  field: string;
  profileValue: unknown;
  listingValue?: unknown;
  kind: import('../constants/statuses').MismatchKind;
  explanation?: string;
  createdAt: string;
}

// ---- Proposal ----
export type { ProposalStatus } from '../constants/statuses';

export interface Proposal {
  id: string;
  mismatchId: string;
  platform: string;
  field: string;
  oldValue?: unknown;
  newValue: unknown;
  status: import('../constants/statuses').ProposalStatus;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
}

// ---- UpdateResult ----
export type { UpdateOutcome } from '../constants/statuses';

export interface UpdateResult {
  id: string;
  proposalId: string;
  outcome: import('../constants/statuses').UpdateOutcome;
  response?: unknown;
  createdAt: string;
}

// ---- Verification ----
export type { VerificationStatus } from '../constants/statuses';

export interface Verification {
  id: string;
  proposalId: string;
  observedValue?: unknown;
  status: import('../constants/statuses').VerificationStatus;
  checkedAt: string;
}

// ---- AuditLog ----
export interface AuditLog {
  id: string;
  eventType: string;
  actor: string;
  payload: unknown;
  createdAt: string;
}

// ---- Shared Zod schemas ----
export const RegularHoursSchema = z.record(z.string(), z.string());
export const HolidayHoursSchema = z.record(z.string(), z.string());

export const BusinessProfileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  regularHours: RegularHoursSchema.optional(),
  holidayHours: HolidayHoursSchema.optional(),
});

// ---- Multi-user Roles & Auth ----
export type { UserRole } from '../constants/statuses';

export interface UserSummary {
  id: string;
  email: string;
  name?: string | null;
  role: import('../constants/statuses').UserRole;
  createdAt: string;
}

