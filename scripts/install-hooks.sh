#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .git/hooks

pre_commit=.git/hooks/pre-commit
commit_msg=.git/hooks/commit-msg
pre_push=.git/hooks/pre-push
for hook in pre-commit commit-msg pre-push; do
  if [ -f ".git/hooks/$hook" ] && grep -Fq "hooks/$hook.local" ".git/hooks/$hook"; then
    case "$hook" in
      pre-commit) pre_commit=.git/hooks/pre-commit.local ;;
      commit-msg) commit_msg=.git/hooks/commit-msg.local ;;
      pre-push) pre_push=.git/hooks/pre-push.local ;;
    esac
  fi
done

cat > "$pre_commit" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
bun run lint || exit 1
bun run test --passWithNoTests || exit 1
HOOK

cat > "$commit_msg" <<'HOOK'
#!/usr/bin/env bash
exec bash "$(git rev-parse --show-toplevel)/scripts/check-commit-msg.sh" "$1"
HOOK

cat > "$pre_push" <<'HOOK'
#!/usr/bin/env bash
exec bash "$(git rev-parse --show-toplevel)/scripts/gate.sh"
HOOK

chmod +x "$pre_commit" "$commit_msg" "$pre_push"
echo "hooks installed: pre-commit (biome + unit), commit-msg (convention), pre-push (full gate)"
