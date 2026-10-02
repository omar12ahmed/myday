# MyDay checks

Automated checks that open MyDay in a headless Chrome and use it the way you would: tapping
buttons, filling in fields, reloading, exporting and importing. Each check prints `PASS` or `FAIL`
with a plain description.

Your own saved data is never touched. The checks use a temporary Chrome profile, which is deleted
afterwards. They also set the page's clock to fixed dates, so results don't depend on today's date.

## Run them

From the `myday-site` folder:

```sh
tests/run.sh                  # everything (about 9–11 minutes)
tests/run.sh storage          # one suite (under a minute)
tests/run.sh storage today    # several suites
tests/run.sh app-storage app-today app-calendar-pay app-study app-workout app-food app-final app-site   # the new app only (builds it first)
```

You need Google Chrome, Node.js 22 or newer, and Python 3. If Chrome is somewhere unusual, set
`CHROME=/path/to/chrome`. If the default ports are in use, set `MYDAY_CDP_PORT`, `MYDAY_HTTP_PORT` or
`MYDAY_LS_PORT`.

A few checks need the internet: one real gov.uk bank-holiday request, one real TheMealDB request, and
`npx live-server` for the Live Server check. Everything else uses made-up responses, so offline those
few will fail and the rest still run.

## The suites

| Suite | What it covers |
|---|---|
| `storage` | One copy of MyDay never silently saves over another tab's newer data. This includes two tabs saving at the same moment: the second write still wins, because localStorage has no locking, but the tab that lost its change says so. It also covers newer-version data, unknown saved fields, and normal saving. |
| `today` | Saved plans, local dates, energy limits, the queue and rest days, the nudge, the proposal and review flow, timeline, focus timer, export/import (including from older versions), damaged data, themes, contrast and layout. |
| `calendar-pay` | The shift pattern and pattern changes, per-date changes, overtime and absence, bank holidays (cached; offline), pay estimates (tax, NI, student loans, SSP), daylight-saving changes and navigation. |
| `health` | Workout templates, logging, scheduling and charts; recipe ideas and search (with suggestions as you type); preferences; the shopping list; the cooking view. |
| `study` | The roadmap and completion, learning sessions and check-ins, concepts and revision (answers stay hidden until revealed, spaced reviews), progress and history, the Today card, and export/import. |
| `app-storage` | The new app (`app/`): nothing is saved before the data is checked; never saving over another tab's newer data; saves at the same moment are reported, not silent; unknown sections stay byte-for-byte the same; and the new app and the current MyDay reading and updating each other's saves. |
| `app-calendar-pay` | The new app's Calendar and Pay: the `calendar-pay` checks adapted (the shift pattern across months and years, pattern changes from a date, one-date changes, statuses, overtime and absence, colours, appointments and overlaps, bank holidays from gov.uk including offline, pay periods, sick pay, bank holiday pay, daylight-saving nights, tax codes), plus side-by-side checks that the new app and the current MyDay save the same rota/pay data and show the same calendar and pay figures, export/import with every section, phone layout, focus and all three themes. |
| `app-study` | The new app's Study: the `study` checks adapted (setup, the roadmap and completion, sessions that survive a reload, pause and resume, the check-in, concepts, revision with answers hidden until revealed, spaced review dates, saved attempts, progress and history, the Today card, Obsidian links, daylight saving, export/import), plus no duplicate sessions or double-counted learning days after double taps, reloads and redraws, phone layout and tap sizes, all three themes, and side-by-side checks that the new app saves Study data and shows the dashboard, revision preview, concept labels, progress and learning count exactly as the current MyDay does. |
| `app-workout` | The new app's Workout: the workout checks from `health` adapted (templates and exercises, logging with the plan and last result, per-set results saved as you type, leave and resume, the rest timer, shorter sessions, template edits that leave history alone, corrections, charts, weekday and sequence schedules, missed sessions without a backlog, proposals around shifts, Today's card and timeline), plus units and assistance kept apart, changing one planned session (with overlap warnings), no duplicate sessions, sets or plans after double taps, reloads and redraws, Food kept byte-for-byte, export/import with every section, phone layout and tap sizes, all three themes, and side-by-side checks against the current MyDay (saved workout data and what the screens show). |
| `app-food` | The new app's Food: the food checks from `health` adapted (ideas, preferences, recipes and scaling, favourites and your own recipes, failed requests, search and suggestions while typing, Want to cook and the shopping list, the cooking view and timers, Today's card, export/import), plus an older search reply never replacing a newer one, failed requests leaving saved data untouched, items combining only when compatible (ranges and sized amounts kept as written and editable), no duplicates after double taps, reloads and redraws, phone layout and tap sizes, all three themes, and side-by-side checks against the current MyDay (saved Food data, recipes, quantities, the shopping list and the cooking view). TheMealDB is replaced by a fake for repeatable checks. |
| `app-final` | The whole new app together: the shared controls on every section; a representative backup with records from every section through import → export → import, opened and saved by the current MyDay and reopened; both apps saving the same messy, every-section data identically; unreadable data reported with a copy to download, never left out silently; blocked storage; Ideas and unknown sections kept; navigation, Back and deep links; keyboard (Tab order, Enter, space, Escape, focus outline); a small phone; all three themes on every section; a change in every section kept after a reload. |
| `app-site` | The website as GitHub Pages will publish it (`deploy/build-site.sh`), served from a sub-folder like `/myday/`: in both layouts every file loads, `#addresses` and deep links work, both apps share saved data, and data from an older MyDay links to the current MyDay. |
| `app-today` | The new app's Today: the `today` checks adapted (energy limits, the queue, rest days, the rolling count, the nudge, export/import, damaged data, context and timeline, proposals and review, themes, layout and tap sizes, animations, the timer), plus the sections that haven't moved yet. |

The `app-*` suites build the new app (`npm run build` in `app/`, so run `npm install` there once first) and serve it
beside the current MyDay, the way Live Server does, so the two share saved data as they do for real.
If Live Server is running, use `MYDAY_LS_PORT=5599 tests/run.sh …` so the `today` suite's Live Server check doesn't clash with it.

`fixtures/` holds two earlier versions of MyDay (as `.fixture` files, so the website doesn't serve
them as pages). The migration checks load them to make sure older saved data still comes across.

## Adding checks

Each suite is a plain script built on `cdp.js`, a small helper that drives Chrome.

- **Before fixing a bug,** add a check that fails because of it.
- **After the fix,** confirm the check passes, and that it fails if the fix is taken out.
