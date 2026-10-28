#!/usr/bin/env bash
# Local gate: run before every push. No CI, by choice (keeps inbox quiet).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== biome"
npx @biomejs/biome check . || exit 1

echo "== typecheck"
npx tsc --noEmit || exit 1

echo "== tests"
npx vitest run --passWithNoTests || exit 1

echo "== build"
npx vite build >/dev/null || exit 1

echo "== docs present"
for f in docs/PRD.md docs/TRD.md docs/APP_FLOW.md docs/DESIGN_BRIEF.md docs/SCHEMA.md docs/IMPLEMENTATION_PLAN.md docs/DESIGN_SYSTEM.md; do
  [ -f "$f" ] || { echo "missing $f"; exit 1; }
done

echo "gate ok"
