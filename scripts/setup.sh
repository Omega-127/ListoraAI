#!/usr/bin/env bash
# setup.sh — First-time local setup for the Business Listing Consistency Agent
# Run from the repository root: bash scripts/setup.sh

set -euo pipefail

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Business Listing Consistency Agent — Local Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Check Node version ────────────────────────────────────
echo "▶ Checking Node.js version..."
REQUIRED_NODE_MAJOR=20
CURRENT_NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if [ "$CURRENT_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  echo "✗ Node.js $REQUIRED_NODE_MAJOR+ is required. Found: $(node --version)"
  echo "  Install it from https://nodejs.org or via nvm: nvm install 20"
  exit 1
fi
echo "✓ Node.js $(node --version)"

# ── 2. Install dependencies ──────────────────────────────────
echo ""
echo "▶ Installing workspace dependencies..."
npm install
echo "✓ Dependencies installed"

# ── 3. Copy .env.example files ───────────────────────────────
echo ""
echo "▶ Copying .env.example files..."

copy_env() {
  local src="$1/.env.example"
  local dst="$1/.env"
  if [ -f "$src" ] && [ ! -f "$dst" ]; then
    cp "$src" "$dst"
    echo "  ✓ Created $dst"
  elif [ -f "$dst" ]; then
    echo "  ↷ Skipped $dst (already exists)"
  fi
}

copy_env "apps/api"
copy_env "apps/mock-platforms"
copy_env "apps/web"

echo ""
echo "⚠  IMPORTANT: Edit apps/api/.env and fill in:"
echo "   DATABASE_URL, ANTHROPIC_API_KEY, SESSION_SECRET,"
echo "   OWNER_EMAIL, OWNER_PASSWORD_HASH, MOCK_PLATFORM_URLS"

# ── 4. Build shared package ──────────────────────────────────
echo ""
echo "▶ Building shared package..."
npm run build --workspace=packages/shared
echo "✓ Shared package built"

# ── 5. Database setup ────────────────────────────────────────
echo ""
echo "▶ Running Prisma migrations..."
if [ -f "apps/api/.env" ]; then
  cd apps/api
  npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy
  echo "✓ Database migrated"

  echo ""
  echo "▶ Seeding database..."
  npx prisma db seed 2>/dev/null && echo "✓ Database seeded" || echo "↷ Seed skipped (no seed script or already seeded)"
  cd ../..
else
  echo "↷ Skipping migrations — apps/api/.env not found."
  echo "   Fill in DATABASE_URL and re-run this script."
fi

# ── 6. Install Playwright browsers ──────────────────────────
echo ""
echo "▶ Installing Playwright browsers..."
cd apps/e2e
npx playwright install --with-deps chromium firefox 2>/dev/null || npx playwright install chromium
cd ../..
echo "✓ Playwright browsers installed"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete! Next steps:"
echo ""
echo "  1. Edit apps/api/.env with your credentials"
echo "  2. Start all services:  npm run dev"
echo "  3. Open the app:        http://localhost:5173"
echo "  4. Run E2E tests:       npm run test:e2e"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
