# Architecture Reference

> For the full architecture document, see [ARCHITECTURE.md](../ARCHITECTURE.md) in the repository root.
> This file is a condensed quick-reference version for browsing in the `docs/` folder.

---

## System Components

| Layer | Technology | Host |
|---|---|---|
| Frontend | React · Vite · TypeScript · Tailwind · TanStack Query | Vercel |
| Backend API | Express · TypeScript · Prisma · Zod · Claude API | Render Web Service |
| Mock Platforms | Express · TypeScript · in-memory store | Render Web Service |
| Shared Package | TypeScript · Zod | Built into api and web |
| Database | PostgreSQL | Render Managed PostgreSQL |
| Cron Job | Scheduled re-check | Render Cron Job |

---

## Key Data Flow

```
Profile (approved) → Listings (fetched) → Mismatches (detected)
  → Agent (investigates) → Proposals (pending_approval)
  → Owner (approves) → Updates (applied) → Verification (confirmed)
  → Report & Score
```

---

## Guardrails Summary

1. No listing write without an approved Proposal.
2. NEEDS_REVIEW mismatches are never auto-resolved.
3. Listings are only marked "verified" after re-read confirmation.
4. Platform permissions (blocked, read-only) are always respected.
5. All agent output is Zod-validated before saving.

---

For full details, see:
- [ARCHITECTURE.md](../ARCHITECTURE.md) — complete system design
- [api.md](./api.md) — endpoint reference
- [agent-design.md](./agent-design.md) — tools, guardrails, prompts
- [demo-script.md](./demo-script.md) — live demo guide
