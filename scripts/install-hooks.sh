#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .git/hooks

cat > .git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
npx --no-install @biomejs/biome check . || exit 1
npx --no-install vitest run --passWithNoTests || exit 1
HOOK

cat > .git/hooks/pre-push <<'HOOK'
#!/usr/bin/env bash
exec bash "$(git rev-parse --show-toplevel)/scripts/gate.sh"
HOOK

chmod +x .git/hooks/pre-commit .git/hooks/pre-push
echo "pre-commit (biome + tests) and pre-push (full gate) installed"
