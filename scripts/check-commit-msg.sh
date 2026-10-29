#!/usr/bin/env bash
# Rejects commit messages that do not follow <type>(<scope>): <what changed>.
set -euo pipefail
message_file="${1:?commit message file missing}"
first_line=$(head -n1 "$message_file")

# merges and reverts are allowed verbatim
case "$first_line" in
  "Merge "*|"Revert "*|"fixup! "*|"squash! "*) exit 0 ;;
esac

pattern='^(feat|fix|chore|refactor|docs|test|perf|build|ci)(\([a-z0-9-]+\))?: [a-z0-9].*[^.]$'
if ! printf '%s' "$first_line" | grep -Eq "$pattern"; then
  cat >&2 <<'MSG'
Commit message rejected.

Expected: <type>(<scope>): <what changed>
Types: feat fix chore refactor docs test perf build ci
Example: fix(streak): refill the restore quota in a new month

No trailing full stop, lower case after the colon, imperative mood.
MSG
  exit 1
fi
