#!/usr/bin/env bash
# Extract the Keep a Changelog section for the version matching the git tag (strip leading v).
# Usage: changelog-extract.sh CHANGELOG.md v1.2.3 > release-notes.md
set -euo pipefail
changelog="${1:?}"
tag="${2:?}"
ver="${tag#v}"
out="$(mktemp)"
trap 'rm -f "$out"' EXIT

awk -v ver="$ver" '
  BEGIN { found = 0 }
  /^## \[/ {
    line = $0
    sub(/^## \[/, "", line)
    sub(/\].*$/, "", line)
    if (line == ver) { found = 1; next }
    if (found) { exit }
    next
  }
  found { print }
' "$changelog" >"$out"

if [[ ! -s "$out" ]]; then
  {
    echo "No matching section for \`## [$ver]\` in CHANGELOG.md (tag: $tag)."
    echo
    echo "See [CHANGELOG.md](https://github.com/${GITHUB_REPOSITORY:-heapoftrash/filetree}/blob/main/CHANGELOG.md) for the full history."
  } >"$out"
fi

cat "$out"
