# Demo Script: Business Listing Consistency Agent

> Step-by-step walkthrough for a live demo. Estimated duration: **8–10 minutes**.
>
> Prerequisites: all services running (`npm run dev`), mock platforms at seed state.

---

## Before You Start

1. Open three tabs in your browser:
   - `http://localhost:5173` — the frontend
   - `http://localhost:4000/health` — confirm the API is up
   - `http://localhost:4101/health` — confirm mockMapsA is up

2. Reset the mock platforms to their seed state:
   ```bash
   curl -X POST http://localhost:4101/reset
   curl -X POST http://localhost:4102/reset
   curl -X POST http://localhost:4103/reset
   ```

3. Optional: open the browser DevTools Network tab to show API calls live.

---

## Step 1 — Login (30 seconds)

**What to say:** "The system has a single owner account protecting all actions."

1. Navigate to `http://localhost:5173/login`.
2. Enter:
   - Email: `owner@bizlisting.dev`
   - Password: `demo1234`
3. Click **Sign In**.
4. You land on the Dashboard.

---

## Step 2 — Approved Profile (1 minute)

**What to say:** "This is the single source of truth — the owner's approved profile.
Every listing on every platform will be compared to this."

1. Click **Profile** in the sidebar.
2. Show the current values: name, address, phone (E.164 format), regular hours.
3. Point out the holiday hours section.
4. Optionally update the phone to `+15550102234` and click **Save**.
5. Show the success toast notification.

**Talk track:** "Every change here is recorded in the audit log — we can always see
who changed what and when."

---

## Step 3 — Refresh Listings (1 minute)

**What to say:** "The agent fetches listings from three simulated platforms.
Each one has its own quirks."

1. Click **Dashboard**.
2. Click **Refresh Listings**.
3. Three listing cards appear — mockMapsA, mockMapsB, mockDirectoryC.
4. Show the raw values returned by each platform.

**Talk track:** "Notice how each platform stores the data slightly differently —
different phone formats, abbreviated addresses, inconsistent hours.
This is the normalization problem the agent solves."

---

## Step 4 — Mismatch Dashboard (1 minute)

**What to say:** "The system automatically detects every discrepancy
using normalization rules — no manual comparison needed."

1. Show the mismatch badges on each listing card.
2. Point out the different kinds:
   - 🔴 **Missing** — field not present on the platform
   - 🟡 **Outdated** — listing has an old value
   - 🟠 **Conflicting** — platforms disagree with each other
   - 🔵 **Needs Review** — no clear winner; needs human judgment

**Talk track:** "Needs-review mismatches are the most important guardrail —
the AI will never auto-pick a value when sources disagree.
It always escalates to the owner."

---

## Step 5 — Agent Investigation (2 minutes)

**What to say:** "The AI agent investigates each mismatch and creates correction proposals."

1. Click **Run Agent** (or navigate to the Approvals page and note it's empty).
2. Wait for the agent to complete (~5–15 seconds depending on Claude latency).
3. Navigate to **Approvals**.
4. Show the pending proposals — one per mismatch per platform.
5. Expand a proposal to show:
   - What the current (wrong) value is
   - What the proposed (correct) value is
   - The AI's explanation of why this matters

**Talk track:** "The agent explains the *business impact* of each mismatch —
not just that values differ, but why consistency matters for search rankings
and customer trust."

---

## Step 6 — Owner Approval (1 minute)

**What to say:** "No listing update happens without the owner's explicit approval.
This is enforced in code — the agent literally cannot bypass it."

1. Show the **What-if Simulator** for one proposal (click the preview icon).
2. Show how the change would appear on the listing.
3. Click **Approve** on one or more proposals.
4. Optionally **Reject** one to show the reject flow.

**Talk track:** "Approved status is a database flag that unlocks the update step.
The guardrail is checked at the service layer — not just in the UI."

---

## Step 7 — Updates and Verification (1 minute)

**What to say:** "Now the system pushes the approved changes to the platforms."

1. Click **Apply Updates** (or trigger via the API).
2. Show the results:
   - ✅ **mockMapsA** — update succeeds (read-write platform)
   - 🚫 **mockMapsB** — blocked (read-only platform)
   - ✅ or 🚫 **mockDirectoryC** — depends on date

3. Click **Verify** — the system re-reads mockMapsA to confirm the value changed.
4. Show the **verified** badge appear.

**Talk track:** "The system never assumes an update succeeded.
It re-reads the listing and only marks it 'verified' after confirming the value."

---

## Step 8 — Report and Score (1 minute)

**What to say:** "Finally, the report gives a complete before-and-after picture
and a consistency score."

1. Navigate to **Report**.
2. Show before/after values for each field/platform combination.
3. Navigate to **Score**.
4. Show the percentage score and the field-by-field breakdown.

**Talk track:** "The score only counts fields the platform actually supports.
If mockMapsB doesn't have a holiday hours field, it's excluded from the denominator —
so the score is always fair and meaningful."

---

## Bonus — Audit Log (30 seconds)

1. Navigate to **Audit**.
2. Show the chronological log of all actions.
3. Point out that both owner actions and agent tool calls are recorded.

**Talk track:** "Every action — human or AI — is permanently logged.
This is critical for trust and compliance."

---

## Bonus — Alerts (30 seconds)

1. Navigate to **Alerts**.
2. Show unresolved mismatches, pending approvals, and blocked listings.

**Talk track:** "The alerts page is where the owner goes every morning.
It surfaces everything that still needs attention."

---

## Common Questions

**Q: What if Claude is slow or times out?**
A: The agent has a timeout; if it fails, the event is logged and no partial data is saved.
   The owner can retry from the Approvals page.

**Q: What prevents the agent from hallucinating a wrong value?**
A: Every proposal is validated with Zod against the approved profile value.
   The agent can only propose the profile's value — it cannot invent a new one.

**Q: Can the system handle real listing platforms?**
A: The mock platforms are a drop-in demo layer.
   Replacing `mockPlatform.client.ts` with real platform API adapters
   is the main production integration task.
