#!/bin/bash
# Runs MyDay's automated checks in a throwaway headless Chrome.
# Your own saved data is never touched: Chrome runs with a temporary profile that is deleted afterwards.
#
# Usage:  tests/run.sh                 run every suite
#         tests/run.sh storage today   run only the suites named
# Suites for the current MyDay (index.html): storage, today, calendar-pay, health, study
# Suites for the new app (app/, built first): app-storage, app-today, app-calendar-pay, app-finance, app-inbox, app-tasks (Inbox → Tasks and Today's "Due today"), app-study, app-topics, app-workout, app-food, app-goals, goals-rules (Goal's figures, no browser), capture-rules (what Capture spots, no browser), patterns-rules (What MyDay has noticed: the pattern engine, no browser), sync-records (what syncs and how, every record's round trip, no browser), app-patterns (its screen, Build my day's "Why?", tasks that keep moving),
#   app-final (every section together), app-site (the website layouts from deploy/build-site.sh)
# Cloud sync: sync-db (the database migrations, in PostgreSQL via PGlite — no browser), app-sync (two devices end to
#   end, against a local stand-in for Supabase; see supabase-standin.js). Neither uses a real Supabase project.
# AI planner: ai-rules (the rules, on the app's own code — no browser), ai-server (the Edge Function and its limits),
#   app-ai (in the browser: practice mode, and an account against the stand-in). No real model is called.
#   Opt-in (not run by default): ai-concurrency — the AI limits under simultaneous requests, in a real PostgreSQL
#   (needs one; see the top of tests/ai-concurrency.test.js); ai-deno — the Edge Function's real entry (index.ts)
#   under Deno with mocked requests (needs Deno; see the top of tests/ai-deno.test.js).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
SUITES=("$@")
[ ${#SUITES[@]} -eq 0 ] && SUITES=(storage today calendar-pay health study app-storage app-today app-calendar-pay app-finance app-inbox app-tasks app-study app-topics app-workout app-food app-goals goals-rules capture-rules patterns-rules app-patterns app-final app-site sync-db sync-records app-sync ai-rules ai-server app-ai)

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
export MYDAY_SUPA_PORT="${MYDAY_SUPA_PORT:-54329}" MYDAY_ROOT="$ROOT"

# ---- A temporary copy: the app, two older versions (for migration checks) and the tests ----
WORK="$(mktemp -d "${TMPDIR:-/tmp}/myday-tests.XXXXXX")"
mkdir -p "$WORK/srv" "$WORK/dl"
cp "$ROOT/index.html" "$WORK/srv/index.html"
cp -R "$ROOT/fonts" "$WORK/srv/fonts" # so text is measured in the real font (layout checks)
# The new app is built and served beside the current MyDay (srv/app/dist/), as with Live Server,
# so both share saved data the way they do for real.
if printf '%s\n' "${SUITES[@]}" | grep -q '^app-'; then
  [ -d "$ROOT/app/node_modules" ] || { echo "The new app's packages aren't installed yet. Run: cd app && npm install"; exit 2; }
  # Built without cloud sync, even if app/.env.production sets it up for publishing (settings already in the
  # environment win over .env files), so these suites always check MyDay as it works without sync.
  (cd "$ROOT/app" && VITE_SUPABASE_URL= VITE_SUPABASE_PUBLISHABLE_KEY= VITE_AI= npm run build >"$WORK/app-build.log" 2>&1) || { echo "The new app didn't build:"; tail -20 "$WORK/app-build.log"; exit 1; }
  mkdir -p "$WORK/srv/app" && cp -R "$ROOT/app/dist" "$WORK/srv/app/dist"
fi
# A copy of the new app with cloud sync and AI help switched on, pointing at the local Supabase stand-in (app-sync, app-ai).
if printf '%s\n' "${SUITES[@]}" | grep -qE '^app-(sync|ai)$'; then
  (cd "$ROOT/app" && VITE_SUPABASE_URL="http://127.0.0.1:$MYDAY_SUPA_PORT" VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_standin_test_key_0000000000" VITE_AI=edge \
    npx vite build --outDir "$WORK/srv/sync" --emptyOutDir >"$WORK/sync-build.log" 2>&1) || { echo "The sync test copy of the app didn't build:"; tail -20 "$WORK/sync-build.log"; exit 1; }
fi
# A copy in AI practice mode (rules instead of AI, no account), for app-ai.
if printf '%s\n' "${SUITES[@]}" | grep -q '^app-ai$'; then
  (cd "$ROOT/app" && VITE_SUPABASE_URL= VITE_SUPABASE_PUBLISHABLE_KEY= VITE_AI=mock npx vite build --outDir "$WORK/srv/aimock" --emptyOutDir >"$WORK/aimock-build.log" 2>&1) || { echo "The AI practice copy of the app didn't build:"; tail -20 "$WORK/aimock-build.log"; exit 1; }
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
cp "$HERE"/*.js "$WORK/" # the tests and their helpers (cdp.js, cdp-devices.js, supabase-standin.js)

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
