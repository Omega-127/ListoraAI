# ListoraAI


# 🔎 Business Listing Consistency Agent

**AI-Powered Listing Sync for Business Information Across Online Platforms**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Claude](https://img.shields.io/badge/Claude-AI%20Agent-D97757?style=flat)](https://www.anthropic.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=flat&logo=postgresql&logoColor=white)](https://www.prisma.io/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat)](https://render.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

*An AI agent that compares business listings against an owner-approved profile, explains mismatches, proposes corrections, waits for approval, and verifies every update before reporting it as complete.*


</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Demo Flow](#-demo-flow)
- [Principles](#-principles)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔭 Overview

Business information such as address, phone number, opening hours, and holiday hours often differs across online listing platforms. Customers get confused, calls and visits are missed, and owners spend time fixing the same problems by hand.

This project is an AI agent that keeps those listings consistent. It:

1. Compares each listing against an **owner-approved business profile**.
2. Detects **missing, outdated, or conflicting** information, after normalizing phone formats and text so that harmless differences do not raise alerts.
3. Uses Claude to **explain why each mismatch matters** and recommend a correction.
4. Shows proposed changes and waits for **owner approval**.
5. Updates only the listings that permit changes, then **re-checks** each one.
6. Reports **before-and-after values** with an honest status: verified, pending, failed, or blocked.

The hackathon prototype runs against mock listing platforms.

---

## ✨ Key Features

### Core (Must-Have)

| Feature | Description |
|---|---|
| **Business Profile Management** | Stores the owner-approved name, address, phone number, regular hours, and holiday hours. |
| **Multi-Platform Comparison** | Collects and compares details from several mock listing platforms. |
| **Smart Mismatch Detection** | Flags missing, outdated, or conflicting values. Normalizes phone numbers and text to avoid false alerts. |
| **Human Approval System** | Every proposed correction needs owner approval before any change is made. |
| **Correction and Verification** | Updates permitted listings, reloads them, and confirms the approved values were applied. |
| **Before-and-After Report** | Shows old and intended values with the status verified, pending, failed, or blocked. |

### Differentiators

| Feature | Description |
|---|---|
| **AI Listing Conflict Investigator** | Explains why a mismatch matters and recommends a correction based on the approved profile and available evidence. |
| **Holiday and Temporary-Hours Agent** | Detects conflicts involving holidays, special schedules, and temporary closures. |
| **What-If Correction Simulator** | Previews how proposed changes would appear across affected listings before approval. |
| **Business Consistency Score** | Shows the share of checked, eligible fields that match the approved profile, with the calculation visible. |
| **Change History and Audit Log** | Records old and new values, approvals, timestamps, update results, and verification outcomes. |
| **Smart Alerts and Reminders** | Highlights unresolved mismatches, pending approvals, blocked listings, and failed updates. |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose | Hosting |
|---|---|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, TanStack Query | Owner dashboard and approval workflow | Vercel |
| **Backend API** | Node.js 20, Express, TypeScript, Zod | REST endpoints and business logic | Render (Web Service) |
| **AI Agent** | Claude API via Anthropic SDK (tool use) | Investigation, holiday reasoning, correction proposals | Called from the backend |
| **Database** | PostgreSQL with Prisma ORM | Profiles, listings, mismatches, proposals, audit log | Render (Managed PostgreSQL) |
| **Mock Platforms** | Express with seeded JSON data | Simulated listing sites with their own permission rules | Render (Web Service) |
| **Scheduled Re-checks** | Node script | Periodic listing re-checks | Render (Cron Job) |
| **Phone Normalization** | libphonenumber-js | E.164 phone matching | Backend library |

---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        OWNER (Browser)                               │
└─────────────────────────────┬────────────────────────────────────────┘
                              │  HTTPS
┌─────────────────────────────▼────────────────────────────────────────┐
│                 FRONTEND · Vercel                                    │
│        React · TypeScript · Vite · Tailwind · TanStack Query         │
└─────────────────────────────┬────────────────────────────────────────┘
                              │  REST with cookies
┌─────────────────────────────▼────────────────────────────────────────┐
│                 BACKEND API · Render                                 │
│        Express · Zod · Auth · CORS · Services                        │
│                                                                      │
│   Profile · Listings · Mismatch · Proposals · Updates · Verify       │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐     │
│   │  AI Agent Layer · Claude API · tool use · guardrails       │     │
│   └────────────────────────────────────────────────────────────┘     │
└──────────┬───────────────────────────────────────────┬───────────────┘
           │  Prisma                                   │  HTTP
┌──────────▼────────────────────────┐   ┌──────────────▼────────────────┐
│  PostgreSQL · Render              │   │  MOCK PLATFORMS · Render      │
│  Profiles · Listings · Audit      │   │  mock-maps-a  (read-write)    │
│  Proposals · Updates · Verify     │   │  mock-maps-b  (read-only)     │
└───────────────────────────────────┘   │  mock-directory-c (holidays)  │
                                        └───────────────────────────────┘
```

For the full architecture, data flow, and per-module details, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later
- **PostgreSQL** 15 or later (a local instance, or a Render database URL)
- An **Anthropic API key**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/business-listing-consistency-agent.git
cd business-listing-consistency-agent

# 2. Install all workspace dependencies
npm install

# 3. Create environment files from the templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mock-platforms/.env.example apps/mock-platforms/.env
```

### Environment Variables

**Backend (`apps/api/.env`)**

```env
# --- Database ---
DATABASE_URL=postgresql://bizlisting:bizlisting_dev@localhost:5432/bizlisting

# --- AI ---
ANTHROPIC_API_KEY=your-anthropic-api-key

# --- Owner login (single owner for the prototype) ---
SESSION_SECRET=replace-with-a-long-random-string
OWNER_EMAIL=owner@example.com
OWNER_PASSWORD_HASH=bcrypt-hash-of-your-password

# --- CORS: comma-separated frontend origins ---
CORS_ORIGINS=http://localhost:5173

# --- Mock listing platforms ---
MOCK_PLATFORM_URLS=http://localhost:4100

NODE_ENV=development
```

**Frontend (`apps/web/.env`)**

```env
VITE_API_BASE_URL=http://localhost:4000
```

**Mock platforms (`apps/mock-platforms/.env`)**

```env
NODE_ENV=development
```

> **Note:** Never commit `.env` files. Use `.env.example` to document new variables.

### Running Locally

**1. Start PostgreSQL**

Use any local PostgreSQL 15+ instance, or start one with Docker:

```bash
docker run --name bizlisting-db -e POSTGRES_USER=bizlisting \
  -e POSTGRES_PASSWORD=bizlisting_dev -e POSTGRES_DB=bizlisting \
  -p 5432:5432 -d postgres:15
```

**2. Apply migrations and seed sample data**

```bash
npm run db:migrate --workspace apps/api
npm run db:seed --workspace apps/api
```

**3. Start all apps**

```bash
npm run dev
```

This starts three services:

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| Mock platforms | http://localhost:4100 |

Check that the API is running at http://localhost:4000/health.

---

## 📁 Project Structure

```
business-listing-consistency-agent/
├── apps/
│   ├── web/                # React frontend (deployed to Vercel)
│   ├── api/                # Express backend and AI agent (deployed to Render)
│   └── mock-platforms/     # Mock listing sites (deployed to Render)
├── packages/
│   └── shared/             # Shared types, Zod schemas, status constants
├── docs/                   # Architecture, API reference, demo script
├── scripts/                # Setup and environment check scripts
├── README.md
├── CONTRIBUTING.md
└── ARCHITECTURE.md
```

The full directory tree and per-module breakdowns are in [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## ☁️ Deployment

| Service | Platform | Root Directory | Build Command | Start Command |
|---|---|---|---|---|
| Frontend | Vercel | `apps/web` | `vite build` | Static |
| Backend API | Render Web Service | `apps/api` | `npm install && npx prisma migrate deploy && npm run build` | `npm start` |
| Mock platforms | Render Web Service | `apps/mock-platforms` | `npm install && npm run build` | `npm start` |
| Re-check job | Render Cron Job | `apps/api` | Same as API | `npm run job:recheck` |
| Database | Render Managed PostgreSQL | n/a | n/a | n/a |

**Production environment variables**

- **Vercel:** `VITE_API_BASE_URL` set to the Render API URL.
- **Render API:** all backend variables above, with `CORS_ORIGINS` set to your exact Vercel domain and `NODE_ENV=production`.
- **Render database:** use the internal connection string for `DATABASE_URL`.

> **Cross-domain cookies:** The frontend and backend are on different domains, so the session cookie uses `SameSite=None; Secure`. Both sides must use HTTPS, and `CORS_ORIGINS` must list the exact frontend origin.

> **Note:** Render's free tier sleeps after inactivity. Warm up the API and mock platforms before a live demo.

---

## 📡 API Reference

All endpoints except `/health` and `/auth/*` require a logged-in owner session.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/login` | Owner login; sets the session cookie |
| `POST` | `/auth/logout` | Clears the session cookie |
| `GET` | `/auth/me` | Returns the current owner |
| `GET` | `/api/v1/profile` | Get the approved business profile |
| `PUT` | `/api/v1/profile` | Update the approved business profile |
| `GET` | `/api/v1/listings` | List collected listings across platforms |
| `POST` | `/api/v1/listings/refresh` | Fetch fresh listing data from mock platforms |
| `GET` | `/api/v1/mismatches` | List detected mismatches with AI explanations |
| `GET` | `/api/v1/proposals` | List correction proposals |
| `POST` | `/api/v1/proposals/:id/approve` | Approve a proposal |
| `POST` | `/api/v1/proposals/:id/reject` | Reject a proposal |
| `POST` | `/api/v1/updates` | Apply approved proposals to permitted listings |
| `POST` | `/api/v1/verify` | Re-check listings and set verification status |
| `GET` | `/api/v1/score` | Consistency score and calculation breakdown |
| `GET` | `/api/v1/audit` | Paginated change history |
| `GET` | `/api/v1/alerts` | Unresolved mismatches, pending approvals, blocked and failed updates |

**Mock platform endpoints** (same on every platform)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/listing/:id` | Returns the listing's current values |
| `PATCH` | `/listing/:id` | Updates permitted fields, or returns `403` with a reason |

---

## 🎬 Demo Flow

1. Log in and review the approved business profile.
2. Refresh listings to pull data from the three mock platforms.
3. Review detected mismatches and the AI explanations.
4. Open the what-if simulator to preview a proposed change.
5. Approve or reject each proposal.
6. Run updates. Permitted listings are changed; blocked listings stay as they are.
7. Run verification and open the before-and-after report, consistency score, and audit log.

The seeded data is set up so each status appears at least once: verified (on `mock-maps-a`), blocked (on `mock-maps-b` and during holiday dates on `mock-directory-c`), and needs review (where sources conflict).

---

## 🧭 Principles

- The agent never guesses a value when sources conflict. It marks the item for review.
- No listing changes without owner approval.
- The agent does not bypass platform permissions.
- An update is reported as successful only after a re-check confirms it.

---

## 🗺 Roadmap

- [x] Owner-approved profile and multi-platform comparison
- [x] Smart mismatch detection with phone and text normalization
- [x] Approval workflow with correction and verification
- [x] Before-and-after report with honest status
- [x] AI listing conflict investigator
- [x] Holiday and temporary-hours agent
- [x] What-if correction simulator
- [ ] Consistency score with full breakdown
- [ ] Change history and audit log
- [ ] Smart alerts and reminders
- [ ] Multi-user roles (viewer, operator, admin)
- [ ] Real platform integrations, where permitted and authorized
- [ ] Live updates over WebSockets

---

## 🤝 Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request.

Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for coding standards, commit conventions, and the pull request process.

---

## 📄 License

This project is licensed under the MIT License. See the [`LICENSE`](./LICENSE) file for details.

---

<div align="center">
Built with 🔎 for accurate, consistent business listings.
</div>

