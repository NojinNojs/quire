#!/usr/bin/env bash
# Database smoke test against the local Supabase stack.
# Skips cleanly when Supabase is not running, so the gate still works offline.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! supabase status >/dev/null 2>&1; then
  echo "supabase not running, skipping database smoke test"
  exit 0
fi

python3 scripts/db_smoke.py
