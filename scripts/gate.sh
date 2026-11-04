#!/usr/bin/env bash
# Local gate: run before every push. No CI, by choice (keeps inbox quiet).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== biome"
npx @biomejs/biome check . || exit 1

echo "== typecheck"
npx tsc --noEmit || exit 1

echo "== tests"
npm test -- --passWithNoTests || exit 1

echo "== build"
npx vite build >/dev/null || exit 1

echo "== database smoke (skipped when supabase is down)"
bash scripts/db-smoke.sh || exit 1

echo "== docs present"
for f in docs/product/PRD.md docs/engineering/TRD.md docs/product/APP_FLOW.md docs/design/DESIGN_BRIEF.md docs/engineering/SCHEMA.md docs/engineering/IMPLEMENTATION_PLAN.md docs/design/DESIGN_SYSTEM.md; do
  [ -f "$f" ] || { echo "missing $f"; exit 1; }
done

echo "== end to end smoke (skipped when supabase or system Chromium is unavailable)"
if ! supabase status >/dev/null 2>&1; then
  echo "supabase not running, skipping end to end smoke"
elif [ ! -x "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-/run/current-system/sw/bin/brave}" ]; then
  echo "system Chromium missing or not executable; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH; no browser downloaded"
else
  npm run test:e2e || exit 1
fi

echo "gate ok"
