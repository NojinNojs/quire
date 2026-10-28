#!/usr/bin/env bash
# Local CD: verify, build, tag, push the tag. No hosted runner, no card.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "usage: scripts/release.sh 0.2.0" >&2
  exit 1
fi
if ! printf '%s' "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "version must look like 0.2.0" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "working tree is dirty; commit first" >&2
  exit 1
fi

bash scripts/gate.sh
npm version "$VERSION" --no-git-tag-version >/dev/null
npm run build >/dev/null

git add package.json package-lock.json
git commit -m "chore: release $VERSION"
git tag -a "v$VERSION" -m "v$VERSION"
git push origin HEAD --follow-tags

echo "released v$VERSION"
