# Contributing to Business Listing Consistency Agent

Thank you for taking the time to contribute!

---

## Getting Started

1. Clone the repository and run first-time setup:
   ```bash
   git clone <repo-url>
   cd business-listing-consistency-agent
   bash scripts/setup.sh
   ```

2. Validate your environment variables:
   ```bash
   npm run check-env
   ```

3. Start all services in development mode:
   ```bash
   npm run dev
   ```

---

## Project Structure

| Directory | Owned by | Description |
|---|---|---|
| `apps/api/` | Backend dev | Express API, agent, services, normalization |
| `apps/web/` | Frontend dev | React dashboard |
| `apps/e2e/` | Shared | Playwright end-to-end tests |
| `apps/mock-platforms/` | Shared | Mock listing platform servers |
| `packages/shared/` | Shared | Types, Zod schemas, constants |
| `docs/` | Shared | Architecture and API documentation |
| `scripts/` | Shared | Setup and env validation scripts |

---

## Development Workflow

### Branches
- `main` — production-ready code
- `develop` — integration branch
- Feature branches: `feat/<short-description>`
- Bug fixes: `fix/<short-description>`

### Commits
Use [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add holiday hours comparison to mismatch detection
fix: normalize phone numbers before E.164 check
docs: update agent-design.md with new guardrail
test: add E2E step for rejected proposals
```

### Pull Requests
1. Open a PR against `develop`.
2. Link the related issue if one exists.
3. Ensure CI passes (lint + build + tests).
4. Request a review from at least one team member.

---

## Code Standards

- **TypeScript**: strict mode. No `any` without a comment explaining why.
- **Formatting**: Prettier (runs automatically on save with the provided `.prettierrc`).
- **Linting**: ESLint — run `npm run lint` before pushing.
- **Tests**: Add unit tests for any new normalization logic or service function.

---

## Shared Package Changes

If you change types or schemas in `packages/shared/`:
1. Rebuild the package: `npm run build --workspace=packages/shared`
2. Check that `apps/api` and `apps/web` still compile.
3. Update `packages/shared/src/index.ts` if you added new exports.

---

## Mock Platform Changes

If you update seed data (`data.json`) in any mock platform:
- Make sure the E2E tests in `apps/e2e/demo-flow.spec.ts` still pass.
- Reset the platform before running tests: `curl -X POST http://localhost:4101/reset`

---

## Documentation

- Keep `docs/api.md` updated when adding or changing API endpoints.
- Keep `docs/agent-design.md` updated when modifying tools, guardrails, or prompts.
- Bump the version comment in prompt files when modifying any prompt.

---

## Questions?

Open a GitHub Discussion or file an issue using the provided templates.
