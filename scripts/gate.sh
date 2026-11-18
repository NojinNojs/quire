#!/usr/bin/env bash
# Local gate: run before every push. No CI, by choice (keeps inbox quiet).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== biome"
bun run lint || exit 1

echo "== typecheck"
bun run typecheck || exit 1

echo "== tests"
bun run test --passWithNoTests || exit 1

echo "== database smoke lifecycle regression"
bun run test:smoke || exit 1

echo "== build"
bun run build >/dev/null || exit 1

echo "== database smoke (skipped when supabase is down)"
bash scripts/db-smoke.sh || exit 1

echo "== end to end smoke (skipped when supabase or system Chromium is unavailable)"
if ! supabase status >/dev/null 2>&1; then
  echo "supabase not running, skipping end to end smoke"
elif [ ! -x "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-/run/current-system/sw/bin/brave}" ]; then
  echo "system Chromium missing or not executable; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH; no browser downloaded"
else
  bun run test:e2e || exit 1
fi

echo "gate ok"
