# API Reference

> Base URL: `http://localhost:4000` (local) / your Render URL (production)
>
> All endpoints except `/health` and `/auth/*` require a valid session cookie (set by `POST /auth/login`).
> The frontend sends `credentials: "include"` on every request.

---

## Authentication

### `POST /auth/login`

Log in as the business owner.

**Request body**
```json
{
  "email": "owner@bizlisting.dev",
  "password": "demo1234"
}
```

**Response `200`**
```json
{ "message": "Logged in." }
```
Sets an `HttpOnly; Secure; SameSite=None` session cookie valid for 8 hours.

**Response `401`** — invalid credentials.

---

### `POST /auth/logout`

Clears the session cookie.

**Response `200`**
```json
{ "message": "Logged out." }
```

---

### `GET /auth/me`

Returns the currently authenticated owner.

**Response `200`**
```json
{ "email": "owner@bizlisting.dev" }
```

**Response `401`** — not authenticated.

---

## Profile

### `GET /api/v1/profile`

Returns the current approved business profile.

**Response `200`**
```json
{
  "id": "uuid",
  "name": "Bella Cucina Ristorante",
  "address": "742 Evergreen Terrace, Springfield, IL 62701",
  "phone": "+15550102234",
  "regularHours": { "monday": { "open": true, "openTime": "11:00", "closeTime": "22:00" }, "..." : "..." },
  "holidayHours": [],
  "updatedAt": "2026-10-20T08:00:00.000Z"
}
```

---

### `PUT /api/v1/profile`

Updates the approved profile. Every write is recorded in the audit log.

**Request body** — partial or full `UpdateProfileSchema`
```json
{
  "name": "Bella Cucina Ristorante",
  "address": "742 Evergreen Terrace, Springfield, IL 62701",
  "phone": "+15550102234",
  "regularHours": { "...": "..." },
  "holidayHours": []
}
```

**Response `200`** — updated profile object.
**Response `400`** — Zod validation errors.

---

## Listings

### `GET /api/v1/listings`

Returns all stored listing snapshots with their current values.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "platform": "mockMapsA",
    "externalId": "listing-001",
    "values": { "name": "...", "phone": "...", "..." : "..." },
    "fetchedAt": "2026-10-20T08:00:00.000Z"
  }
]
```

---

### `POST /api/v1/listings/refresh`

Fetches fresh snapshots from all mock platforms and stores them.
Also re-runs mismatch detection against the current approved profile.

**Response `200`**
```json
{ "refreshed": 3, "mismatches": 5 }
```

---

## Mismatches

### `GET /api/v1/mismatches`

Returns all active mismatches.

**Query params**
- `kind` — filter by `missing | outdated | conflicting | needs_review`
- `listingId` — filter by listing UUID

**Response `200`**
```json
[
  {
    "id": "uuid",
    "listingId": "uuid",
    "field": "phone",
    "profileValue": "+15550102234",
    "listingValue": "(555) 010-2234",
    "kind": "outdated",
    "explanation": "The phone number format differs ...",
    "createdAt": "2026-10-20T08:00:00.000Z"
  }
]
```

---

### `GET /api/v1/mismatches/:id`

Returns a single mismatch with its AI explanation (if generated).

---

## Proposals

### `GET /api/v1/proposals`

Returns all proposals.

**Query params**
- `status` — filter by `pending_approval | approved | rejected`

**Response `200`** — array of Proposal objects.

---

### `POST /api/v1/proposals/:id/approve`

Owner approves a proposal. Sets `status = approved`, records `approvedAt` and `approvedBy`.

**Response `200`** — updated proposal.
**Response `400`** — proposal is not in `pending_approval` state.

---

### `POST /api/v1/proposals/:id/reject`

Owner rejects a proposal. Sets `status = rejected`.

**Response `200`** — updated proposal.

---

## Updates

### `POST /api/v1/updates`

Applies all approved proposals by sending `PATCH /listing/:id` to the relevant mock platforms.
Only proposals with `status = approved` are processed.

**Response `200`**
```json
[
  {
    "proposalId": "uuid",
    "platform": "mockMapsA",
    "outcome": "success"
  },
  {
    "proposalId": "uuid",
    "platform": "mockMapsB",
    "outcome": "blocked",
    "reason": "read_only"
  }
]
```

---

## Verify

### `POST /api/v1/verify`

Re-reads listings for all recently updated proposals and confirms the new values match the approved profile.

**Response `200`**
```json
[
  {
    "proposalId": "uuid",
    "status": "verified",
    "observedValue": "+15550102234"
  }
]
```

---

## Score

### `GET /api/v1/score`

Calculates the consistency score across all eligible fields and platforms.

**Response `200`**
```json
{
  "score": 73,
  "eligible": 9,
  "matching": 6,
  "breakdown": [
    { "platform": "mockMapsA", "field": "phone", "status": "verified" },
    { "platform": "mockMapsB", "field": "phone", "status": "blocked" }
  ]
}
```

Score = `matching / eligible × 100`. Unsupported fields are excluded from both numerator and denominator.

---

## Audit

### `GET /api/v1/audit`

Returns a paginated, filterable audit log.

**Query params**
- `page` — page number (default: 1)
- `limit` — records per page (default: 50, max: 200)
- `actor` — filter by `owner | agent | system`
- `eventType` — filter by event type string

**Response `200`**
```json
{
  "total": 42,
  "page": 1,
  "records": [
    {
      "id": "uuid",
      "eventType": "proposal.approved",
      "actor": "owner",
      "payload": { "proposalId": "uuid", "field": "phone" },
      "createdAt": "2026-10-20T08:00:00.000Z"
    }
  ]
}
```

---

## Alerts

### `GET /api/v1/alerts`

Returns actionable alerts grouped by category.

**Response `200`**
```json
{
  "unresolvedMismatches": 3,
  "pendingApprovals": 2,
  "blockedListings": 1,
  "failedUpdates": 0,
  "items": [
    {
      "type": "unresolved_mismatch",
      "message": "mockMapsB · phone is outdated",
      "severity": "warning"
    }
  ]
}
```

---

## Health

### `GET /health`

No auth required. Used by Render as the health check endpoint.

**Response `200`**
```json
{ "status": "ok", "uptime": 3600 }
```
