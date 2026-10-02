#!/bin/bash
# Prepares a release for the way MyDay is hosted now: GitHub Pages publishes the `main` branch as it is
# (Settings → Pages: "Deploy from a branch: main, /"). So `main` holds the built website, nothing else.
#
# Usage:  deploy/publish-main.sh [trial|switch]      (default: switch — the new app at the main address)
#
# It builds the website from the current commit (which must be committed and clean), then, in a temporary
# checkout, replaces what's on `main` with it and commits. It does NOT push: check the commit, then publish
# with   git push origin main   (Pages updates within a few minutes).
# Going back: see "Going back" in deploy/README.md.
set -euo pipefail
LAYOUT="${1:-switch}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
cd "$ROOT"
[ -z "$(git status --porcelain)" ] || { echo "Commit (or set aside) your changes first, so the release matches a commit."; exit 1; }
SRC="$(git rev-parse --short HEAD)"
VERSION="$(node -p "require('./app/package.json').version")"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/myday-publish.XXXXXX")"
trap 'git worktree remove --force "$TMP/main" >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT

"$HERE/build-site.sh" "$LAYOUT" "$TMP/site" 2>&1 | grep -v "chunk\|import()\|codeSplitting\|chunkSizeWarningLimit\|vite-reporter\|^$" || true
git fetch -q origin main
git worktree add -q "$TMP/main" main
git -C "$TMP/main" merge -q --ff-only origin/main
# Replace the published files with the new website (git keeps the old ones in history).
git -C "$TMP/main" rm -q -r --ignore-unmatch .
cp -R "$TMP/site/." "$TMP/main/"
git -C "$TMP/main" add -A
git -C "$TMP/main" commit -q -m "Publish MyDay $VERSION ($LAYOUT layout, built from $SRC on react-rebuild)" \
  -m "Built by deploy/build-site.sh $LAYOUT. The new app's source is on the react-rebuild branch (commit $SRC)."
echo "Committed to main: $(git -C "$TMP/main" log -1 --format='%h %s')"
echo "Files published:"; git -C "$TMP/main" ls-files | sed 's/^/  /'
echo "To publish it: git push origin main"
