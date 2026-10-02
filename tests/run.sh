#!/bin/bash
# Runs MyDay's automated checks in a throwaway headless Chrome.
# Your own saved data is never touched: Chrome runs with a temporary profile that is deleted afterwards.
#
# Usage:  tests/run.sh                 run every suite
#         tests/run.sh storage today   run only the suites named
# Suites for the current MyDay (index.html): storage, today, calendar-pay, health, study
# Suites for the new app (app/, built first): app-storage, app-today, app-calendar-pay, app-study, app-workout, app-food,
#   app-final (every section together), app-site (the website layouts from deploy/build-site.sh)
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
SUITES=("$@")
[ ${#SUITES[@]} -eq 0 ] && SUITES=(storage today calendar-pay health study app-storage app-today app-calendar-pay app-study app-workout app-food app-final app-site)

# ---- What's needed ----
CHROME="${CHROME:-}"
if [ -z "$CHROME" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "$(command -v google-chrome || true)" "$(command -v chromium || true)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then CHROME="$c"; break; fi
  done
fi
[ -n "$CHROME" ] || { echo "Google Chrome wasn't found. Set CHROME=/path/to/chrome and try again."; exit 2; }
node -e 'process.exit(typeof WebSocket === "function" ? 0 : 1)' 2>/dev/null || { echo "Node.js 22 or newer is needed (for its built-in WebSocket)."; exit 2; }
command -v python3 >/dev/null || { echo "Python 3 is needed (for a small local web server)."; exit 2; }

export MYDAY_CDP_PORT="${MYDAY_CDP_PORT:-9333}" MYDAY_HTTP_PORT="${MYDAY_HTTP_PORT:-8765}" MYDAY_LS_PORT="${MYDAY_LS_PORT:-5500}"

# ---- A temporary copy: the app, two older versions (for migration checks) and the tests ----
WORK="$(mktemp -d "${TMPDIR:-/tmp}/myday-tests.XXXXXX")"
mkdir -p "$WORK/srv" "$WORK/dl"
cp "$ROOT/index.html" "$WORK/srv/index.html"
cp -R "$ROOT/fonts" "$WORK/srv/fonts" # so text is measured in the real font (layout checks)
# The new app is built and served beside the current MyDay (srv/app/dist/), as with Live Server,
# so both share saved data the way they do for real.
if printf '%s\n' "${SUITES[@]}" | grep -q '^app-'; then
  [ -d "$ROOT/app/node_modules" ] || { echo "The new app's packages aren't installed yet. Run: cd app && npm install"; exit 2; }
  (cd "$ROOT/app" && npm run build >"$WORK/app-build.log" 2>&1) || { echo "The new app didn't build:"; tail -20 "$WORK/app-build.log"; exit 1; }
  mkdir -p "$WORK/srv/app" && cp -R "$ROOT/app/dist" "$WORK/srv/app/dist"
fi
# The website layouts, built as GitHub Pages will publish them, under a sub-folder like /myday/.
if printf '%s\n' "${SUITES[@]}" | grep -q '^app-site$'; then
  for L in trial switch; do
    "$ROOT/deploy/build-site.sh" "$L" "$WORK/srv/pages-$L/myday" >"$WORK/site-$L.log" 2>&1 || { echo "The '$L' website didn't build:"; tail -20 "$WORK/site-$L.log"; exit 1; }
  done
fi
cp "$HERE/fixtures/myday-v2.html.fixture" "$WORK/srv/v2.html"
cp "$HERE/fixtures/myday-v3.html.fixture" "$WORK/srv/v3.html"
cp "$HERE/fixtures/myday-release-2026-10-02.html.fixture" "$WORK/srv/prev.html" # the release published before the new app
cp "$HERE/cdp.js" "$HERE"/*.test.js "$WORK/"

python3 -m http.server "$MYDAY_HTTP_PORT" --bind 127.0.0.1 --directory "$WORK/srv" >/dev/null 2>&1 &
SERVER=$!
"$CHROME" --headless=new --remote-debugging-port="$MYDAY_CDP_PORT" --user-data-dir="$WORK/profile" \
  --no-first-run --no-default-browser-check about:blank >/dev/null 2>&1 &
BROWSER=$!
stop() { kill "$BROWSER" "$SERVER" 2>/dev/null; wait "$BROWSER" "$SERVER" 2>/dev/null; }
trap stop EXIT

for _ in $(seq 1 40); do
  curl -sf "http://localhost:$MYDAY_CDP_PORT/json" >/dev/null && curl -sf "http://localhost:$MYDAY_HTTP_PORT/index.html" -o /dev/null && break
  sleep 0.5
done

# ---- Run ----
FAILED=0
for s in "${SUITES[@]}"; do
  if [ ! -f "$WORK/$s.test.js" ]; then echo "Unknown suite: $s"; FAILED=1; continue; fi
  (cd "$WORK" && node "$s.test.js" > "$WORK/$s.log" 2>&1)
  code=$?
  result="$(grep -E 'passed, [0-9]+ failed' "$WORK/$s.log" | tail -1)"
  printf '%-18s %s\n' "$s" "${result:-stopped early (exit $code)}"
  if [ $code -ne 0 ]; then
    FAILED=1
    grep -E '^\s+FAIL|HARNESS' "$WORK/$s.log" | head -20
  fi
done

stop; trap - EXIT
if [ $FAILED -ne 0 ]; then
  echo "Some checks failed. Full logs: $WORK"
  exit 1
fi
rm -rf "$WORK"
echo "All checks passed."
