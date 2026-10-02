#!/bin/bash
# Builds the website exactly as GitHub Pages will publish it, into a folder (default: site/).
#
# Usage:  deploy/build-site.sh trial  [out-dir]   the current MyDay stays at the main address;
#                                                 the new app is published beside it at next/
#         deploy/build-site.sh switch [out-dir]   the new app is at the main address;
#                                                 the current MyDay stays available at classic/
#
# Both apps end up on the same website (https://omar12ahmed.github.io/myday/), so they share the same
# saved data in your browser. The new app uses relative paths and #addresses, so it works from any folder.
set -euo pipefail

LAYOUT="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
OUT="${2:-$ROOT/site}"
case "$LAYOUT" in
  trial)  APP_DIR="next";  CLASSIC_DIR="";         CLASSIC_URL="../" ;;
  switch) APP_DIR="";      CLASSIC_DIR="classic";  CLASSIC_URL="./classic/" ;;
  *) echo "Say which layout: deploy/build-site.sh trial   or   deploy/build-site.sh switch"; exit 2 ;;
esac

rm -rf "$OUT"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
# The new app: Vite's production output, built straight into the site (app/dist is left as it is).
# VITE_CLASSIC_URL tells it where the current MyDay is (it sends data from older versions there).
(cd "$ROOT/app" && VITE_CLASSIC_URL="$CLASSIC_URL" npm run build -- --outDir "$OUT/${APP_DIR:-.}" --emptyOutDir >/dev/null)
# The current MyDay: index.html and its fonts, unchanged.
mkdir -p "$OUT/${CLASSIC_DIR:-.}"
cp "$ROOT/index.html" "$OUT/${CLASSIC_DIR:-.}/index.html"
cp -R "$ROOT/fonts" "$OUT/${CLASSIC_DIR:-.}/fonts"
# Serve the files as they are (no Jekyll processing on GitHub Pages).
touch "$OUT/.nojekyll"
echo "Built the '$LAYOUT' layout in $OUT"
