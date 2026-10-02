#!/bin/bash
# Builds the website (see build-site.sh) and serves it at http://localhost:8080/myday/ — the same folder
# as on GitHub Pages — so you can check it before publishing. Your saved data there is separate from Live
# Server's (a different address), so it starts empty: import a backup to try it with real data.
# Usage: deploy/preview-site.sh trial   or   deploy/preview-site.sh switch       (Ctrl+C to stop)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/myday-site.XXXXXX")"
"$HERE/build-site.sh" "${1:-}" "$TMP/myday"
echo "Open http://localhost:${PORT:-8080}/myday/"
python3 -m http.server "${PORT:-8080}" --bind 127.0.0.1 --directory "$TMP"
