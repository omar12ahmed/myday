# MyDay — new version (React + Vite + Tailwind + TypeScript)

This is MyDay being rebuilt in React, one milestone at a time. The current MyDay (`../index.html`) stays live
and unchanged until this version can do everything it does.

**Milestone 1 is done: Today works fully and saves.** The app shell, navigation, themes and the shared storage
layer are in place. Calendar, Pay, Health and Study have **not** moved yet (see [What has moved](#what-has-moved)).

> This version saves to the **same data** as the current MyDay when both are opened at the same address (for
> example with Live Server). A change made in one shows in the other. To try things out, use disposable data or
> a backup, not your real plan.

## Commands

You need Node.js 20.19+ or 22.12+ (checked with Node 24). From the `myday-site` folder:

```bash
cd app
npm install          # first time only (installs into app/node_modules)
npm run dev          # live-editing server, usually http://localhost:5173 (its saved data starts empty)
npm run build        # checks the types and builds into app/dist/
npm run lint         # checks the code for common mistakes
cd ..
tests/run.sh app-storage app-today   # builds the app, then runs its checks in a throwaway Chrome profile
```

To use the built app beside the current MyDay (sharing its saved data), run `npm run build`, then open
`http://127.0.0.1:5500/myday-site/app/dist/index.html` with VS Code's Live Server. The built copy doesn't update by
itself: build again after a change. While Live Server is running, run the checks as `MYDAY_LS_PORT=5599 tests/run.sh …`.

## What has moved

| Section | In the new app |
|---|---|
| **Today** | Everything: energy (1–5) with its task limits, Build my day with a proposal you confirm (edit, shorten, leave for later), rest days, the queue and Roll to tomorrow, the evening check-in (including yesterday's), Review my plan, Swap for a rest day, Start today over, the nudge, the focus timer, the rolling 7-day learning count, the learning garden, sleep / work / appointments / prep-time context, Today at a glance, editing task lists, export and import, animations on/off. |
| App shell | Header with the date, the five-section navigation, Light / Dark / Match device themes. |
| Calendar, Pay, Health, Study | **Not yet.** The navigation marks them; each opens a page that says so and links to the current MyDay. Their saved records are kept exactly as they are. |

Today *reads* (never changes) three things from sections that haven't moved, so it behaves exactly as before:
shifts from the rota (tasks aren't suggested during work), planned workouts with a time, and finished Study
sessions (they count as learning days and grow the garden). What the new Today doesn't show yet: the workout,
cooking and shopping reminders and the Study card that the current MyDay shows on Today. It says so on the screen.

## Saved data

- Same key and format as the current MyDay: `myday.data.v4`, `schemaVersion` 4. No migration is needed.
- `src/data/storage.ts` is the only code that reads or writes it. It loads and checks the data before anything can be saved.
  If the data can't be read, or came from a newer MyDay, saving stops and the saved copy is left exactly as it was
  (you can download it, import a backup, or start fresh).
- Sections the new app doesn't handle yet (rota, pay, bank holidays, health, study) and any unknown fields are kept
  exactly as saved, and included in exports.
- **Another tab:** before every save it checks whether another tab (or the current MyDay) saved since; if so, it shows
  that newer data and says your last change wasn't saved, rather than overwriting it. Tabs also update each other.
- **Saving at the same moment:** localStorage has no locking, so if two tabs save within the same instant, the later
  write wins. This can't be prevented; it is *detected*: the tab whose change was replaced says so. (Same as the
  current MyDay; both apps sign their saves the same way, so this works between them too.)
- Data from older MyDay versions (`myday.data.v3`, `v2`, version 1) is moved to the current format by the current
  MyDay. Until that has happened, the new app explains this and saves nothing.
- If the browser blocks storage, the app still works but says changes won't be kept after closing.

## Where things are

| Folder / file | What it holds |
|---|---|
| `src/data/types.ts` | The shape of the saved data, as TypeScript types. Must match the current MyDay exactly. |
| `src/data/normalize.ts` | Checks saved data and fills in anything missing (a copy of `normalize()` in the current MyDay). |
| `src/data/storage.ts` | The store: loading, saving with the other-tab protections, export and import. |
| `src/data/useMyDay.ts` | Lets components read the saved data and redraw when it changes. |
| `src/data/plan.ts` | Choosing tasks within the energy limit, the queue, rest days, ticking off. |
| `src/data/schedule.ts` | Sleep, commitments, shifts, workouts, prep time and free time; overlap warnings. |
| `src/data/proposal.ts` | Build my day / Review my plan proposals, saved only when applied. |
| `src/data/progress.ts` | The rolling learning count, the nudge and the garden's numbers. |
| `src/data/timer.ts`, `dates.ts`, `today.ts` | The focus timer, date helpers, and the wording for a day's plan. |
| `src/data/rota.ts`, `workouts.ts`, `studySessions.ts` | Read-only views of sections that haven't moved, for Today's planning. |
| `src/components/` | Shared pieces with their styling in one place: `Button`, `Card`, `Banner`, `Field` (inputs), `Dialog` (confirmations), `Toast`, `CategoryChip`, `EnergyMeter`. |
| `src/today/` | The Today section's cards and `TodayScreen`, which puts them together. |
| `src/shell/` | Navigation, the theme button, the "not moved yet" page and the screens for unreadable or older data. |
| `src/styles/tokens.css` | Colours for dark and light themes (the same as the current MyDay). |
| `src/index.css` | Gives the colours Tailwind names (e.g. `bg-surface`, `text-fg-2`), sets the font, the navigation bar and the animations. |
| `../tests/app-*.test.js` | The checks for this app (adapted from the current MyDay's Today and storage checks). |

## Design

The current MyDay (`../index.html`) has the same look: the same colours, font and task timeline (its font files are in
`../fonts/`). A visual change belongs in both.

- **Colours** are the current MyDay's calm sage palette, unchanged. Every text colour pair meets WCAG AA contrast in both themes.
- **Font:** Plus Jakarta Sans, a friendly, rounded sans-serif. It's bundled with the app (`@fontsource-variable/plus-jakarta-sans`),
  so it works offline. Times use `tabular-nums` so their digits line up.
- **Icons:** [Lucide](https://lucide.dev) (`lucide-react`), always with a text label beside them, never emoji.
- **Tap targets:** every button and link is at least 44 × 44 px; main buttons are 52 px tall.
- **A day's plan** is a timeline: tasks with a time are joined by a line in time order, with "any time today" tasks below.
  The round marker beside each task shows a tick once it's done; tapping anywhere on a task ticks it off. Each fact
  appears once: the time on top, then the title, then the category and length.
- **Up next:** one task is marked "Up next", so there's always an obvious place to start. It uses the current MyDay's
  rule (`nextTask()` in `today.ts`).
- **Progress note:** nothing until the first task is done, so an untouched list doesn't feel like a score; then
  "1 done so far", and "That's the whole plan — lovely." once everything is done.
- **Morning:** energy and Build my day share the top card, so building your day is the first thing you see.
- **Confirmations** ("Start today over?", "Replace your saved data?") are asked in the page with a dialog, never the
  browser's pop-up.
- **Motion** stays small (a tick, a soft burst when the whole plan is done, a gentle fade between screens) and switches
  off with the Animations button or when the device asks for reduced motion.

The direction came from the ui-ux-pro-max design skill (minimal style, Plus Jakarta Sans, subtle motion), and the
timeline layout is adapted from the "Process Timeline" component on [21st.dev](https://21st.dev).

## Milestones

1. **Done:** project set-up, design, shell and navigation, themes, the shared storage layer, and a fully working Today.
2. **Calendar & Pay**, then **Health**, then **Study**, one at a time (each with its checks), plus the Today reminders that come with them.
3. **Ideas** (planned in the current MyDay but not built yet).
4. **Switch over:** publish this version at the main address, keeping the current one as a fallback.
