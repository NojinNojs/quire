#!/usr/bin/env bash
# Builds CHANGELOG.md from conventional commits. Never hand written.
set -euo pipefail
cd "$(dirname "$0")/.."

range="${1:-}"
if [ -z "$range" ]; then
  last_tag=$(git describe --tags --abbrev=0 2>/dev/null || true)
  range="${last_tag:+$last_tag..}HEAD"
fi

section() {
  local kind="$1" title="$2"
  local lines
  lines=$(git log $range --no-merges --pretty=format:'%s' | grep -E "^$kind(\([a-z0-9-]+\))?: " || true)
  if [ -n "$lines" ]; then
    printf '\n### %s\n\n' "$title"
    printf '%s\n' "$lines" | sed -E 's/^[a-z]+(\([a-z0-9-]+\))?: /- /'
  fi
}

{
  printf '# Changelog\n\nGenerated from conventional commits by `scripts/changelog.sh`.\n'
  printf '\n## Unreleased\n'
  section feat 'Added'
  section fix 'Fixed'
  section perf 'Performance'
  section refactor 'Changed'
  section docs 'Documentation'
  section chore 'Maintenance'
} > CHANGELOG.md

echo "CHANGELOG.md written for $range"
