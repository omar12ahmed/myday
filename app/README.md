# MyDay — new version (React + Vite + Tailwind + TypeScript)

This is MyDay being rebuilt in React, one milestone at a time. The current MyDay (`../index.html`) stays live
and unchanged until this version can do everything it does.

**Milestones 1–4 are done: Today, Calendar, Pay, Study and Workout work fully and save.** The app shell, navigation,
themes and the shared storage layer are in place. Food (the other half of Health) has **not** moved yet (see
[What has moved](#what-has-moved)).

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
tests/run.sh app-storage app-today app-calendar-pay app-study app-workout   # builds the app, then runs its checks in a throwaway Chrome profile
```

To use the built app beside the current MyDay (sharing its saved data), run `npm run build`, then open
`http://127.0.0.1:5500/myday-site/app/dist/index.html` with VS Code's Live Server. The built copy doesn't update by
itself: build again after a change. While Live Server is running, run the checks as `MYDAY_LS_PORT=5599 tests/run.sh …`.

## What has moved

| Section | In the new app |
|---|---|
| **Today** | Everything: energy (1–5) with its task limits, Build my day with a proposal you confirm (edit, shorten, leave for later), rest days, the queue and Roll to tomorrow, the evening check-in (including yesterday's), Review my plan, Swap for a rest day, Start today over, the nudge, the focus timer, the rolling 7-day learning count, the learning garden, sleep / work / appointments / prep-time context, Today at a glance, editing task lists, export and import, animations on/off. |
| **Calendar** | Everything: your repeating pattern (e.g. 4 days → 4 off → 4 nights → 4 off) with versions that start from a chosen date (earlier dates never change), one-date changes stored apart from the pattern, what actually happened (worked different hours, sick, annual leave, cancelled, off instead, custom), overtime and unauthorised absence as separate entries, appointments, overlap warnings, bank holidays from gov.uk with the region choice, configurable colours with text labels, month and agenda views. |
| **Pay** | Everything: scheduled vs actual hours and pay for each pay period (weekly, fortnightly, 4-weekly or monthly), night/overtime/bank-holiday rates, annual leave, cancelled shifts, sick pay (SSP before and after the April 2026 reform, company sick pay), and estimated Income Tax, National Insurance and student loans, labelled as estimates with the tax year used. |
| **Study** | Everything: a dashboard focused on starting (current focus and course, the next task with its path and estimate, a suggested length that fits your energy and free time, Start learning, "Just 15 minutes", course completion, a revision preview with its own Start revision button); the editable roadmap (stage → course → module → section → task, resource links, archive, focus); learning sessions you can pause, resume, finish or discard, with an optional clock that survives a reload; the optional check-in (task complete, concepts covered, how clear it felt, takeaway, question, Obsidian note); concepts with written or multiple-choice revision questions; revision one question at a time with the answer hidden until you ask, self-assessment, hints, notes, and spaced review dates; progress and history (learning days, completion, practical work, clarity, recall by week, what might need practice); Study settings; and the Study card on Today. |
| **Health → Workout** | Everything: workout templates (create, rename, reorder, archive and restore) with your own or common exercises; strength (reps and kg), bodyweight (reps, with added weight or assistance in kg, kept apart) and cardio (minutes and km); planned sets, reps, weights, durations, distances and rest; scheduling by weekday or as a repeating sequence; proposed dates fitted around shifts and appointments, saved only when you confirm; one-off plans on a date; the latest missed session to Move, Skip or Continue (no backlog); logging a workout with the plan and last time's result beside each exercise, big Done buttons, values prefilled from last time or the plan, the optional rest timer, leave-and-resume, and a kindly named shorter session; history with corrections; exercise history with charts per measure; and the Health card on Today. |
| App shell | Header with the date, the five-section navigation, Light / Dark / Match device themes. |
| Health → Food | **Not yet.** The navigation marks Health as partly moved; the Food tab says so and links to the current MyDay. Food's saved records are kept exactly as they are. |

What the new Today doesn't show yet: the cooking and shopping-list reminders the current MyDay shows on Today. When
there is one to show, Today says so.

### Calendar and Pay: differences from the current MyDay

- Same rules, records and calculations. The checks compare the two apps side by side with the same data: the
  saved rota, pay settings and bank holidays, every calendar day, and every pay figure and note.
- The selected day's details sit beside the month on wide screens, and directly below it on phones (choosing a date
  moves focus there). Adding an appointment, overtime or an absence are three separate buttons; changing one date
  ("This date only") and changing the repeating pattern are separate, clearly named places.
- "Are you sure?" questions are asked in the page rather than with the browser's pop-up.
- The new app doesn't run when opened as a local file (`file://`): browsers block its JavaScript modules there. Use
  Live Server or `npm run dev`. (The current MyDay still works as a local file.)

### Study: differences from the current MyDay

- Same records, rules and wording. Scheduling is unchanged (first review: Again → tomorrow, Hard → 2 days, Good →
  4 days; then × 1.2 or × 2.5, at least a day longer, at most 180 days), rounds are still 5 questions, and an answer is
  only saved when you choose when it comes back. The checks compare the two apps side by side: the saved Study data
  (including messy data), the dashboard, revision preview, concept labels, progress and Today's learning count.
- Study only ever *suggests* a session length. It never adds tasks to Today or changes shifts and appointments; the
  one thing it changes on Today is ticking the matching learning task, and only when you press "Also tick … on today's
  plan" in the check-in.
- On wide screens the dashboard has two columns (what to start on the left; revision and links on the right).
- "Are you sure?" questions (removing part of the roadmap or a concept, discarding a session) are asked in the page.
- The check-in shows an "Open in Obsidian" link under its note path (the current MyDay only stores the path). The
  settings text now says note links appear on concepts and check-ins (tasks have no note field in either app).
- Export and import are on Today (the current MyDay shows them at the bottom of every section).

### Workout: differences from the current MyDay

- Same records, rules and wording. The checks compare the two apps side by side: the saved workout data (including
  messy data), Today's Health card and timeline, the next-step card, templates, history, exercise history, a logged
  workout's plan and last results, and proposed dates.
- **Changing one planned session** (its date, time or workout) has its own "Change" button under Planned sessions. It
  never changes the template or the repeating schedule. (The current MyDay only lets you remove a plan and add it
  again.) Templates are edited separately, and that says they apply from your next session.
- **Overlap warnings:** planning or changing a session with a time warns about shifts, appointments (and their prep
  time), sleep and your task window, using the same check as Today, before anything is saved. It also says when a
  plan replaces one already on that date, or the weekday schedule's workout for that day only.
- The box for a bodyweight exercise's extra kilograms is labelled "kg added" or "kg assist" (the current MyDay says
  "kg" for both), so the two are never confused.
- "Are you sure?" questions (finishing early, cancelling, removing a done set, deleting from history) are asked in
  the page.
- The rest countdown is checked while the workout screen is open. If it ends while you're elsewhere, the screen
  says "Rest done" when you come back (the current MyDay notices it on any screen).
- Export and import are on Today (the current MyDay shows them at the bottom of every section).

## Saved data

- Same key and format as the current MyDay: `myday.data.v4`, `schemaVersion` 4. No migration is needed.
- `src/data/storage.ts` is the only code that reads or writes it. It loads and checks the data before anything can be saved.
  If the data can't be read, or came from a newer MyDay, saving stops and the saved copy is left exactly as it was
  (you can download it, import a backup, or start fresh).
- Rota, pay, bank holidays, Study and Workout are checked when loaded exactly as the current MyDay checks them: every
  valid record is kept, and anything damaged is dropped the same way (the checks prove both apps save identical
  results). As in the current MyDay, Study keeps only one session in progress (any other is marked finished), and
  neither Study nor Workout keeps unknown fields *inside* their records.
- Food (not in the new app yet), anything else stored under Health, and any unknown top-level sections are kept
  exactly as saved, and included in exports. With no Food data at all, Food starts empty, as in the current MyDay.
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
| `src/data/rota.ts` | The shift rota: pattern versions, one-date changes, what happened, overtime/absence, overlaps, colours. |
| `src/data/pay.ts` | Pay periods and the pay estimate: hours, rates, bank holidays, sick pay (SSP), tax, NI and student loans. |
| `src/data/bankHolidays.ts`, `bankHolidayFetch.ts` | Bank holidays (checking, looking up a date) and loading them from gov.uk. |
| `src/data/util.ts` | Small shared helpers (number checks, ids, copying). |
| `src/data/workout/` | Workout's data and rules, ported from the current MyDay: `normalize.ts` (checking saved Health data; Food is kept as saved), `common.ts` (labels, units and wording), `plans.ts` (which workout is planned when, missed sessions, the sequence, Today's blocks), `propose.ts` (proposed dates around shifts), `sessions.ts` (logging, finishing, prefilling, the rest timer), `history.ts` (exercise history and chart measures). |
| `src/data/study/` | Study's data and rules, ported from the current MyDay: `normalize.ts` (checking saved Study data), `roadmap.ts` (the outline, completion, setup, editing), `sessions.ts` (sessions, suggested length, check-ins, learning days), `revision.ts` (due concepts, review scheduling, cautious labels), `progress.ts` (progress and history), `common.ts` (labels, limits, Obsidian links). |
| `src/components/` | Shared pieces with their styling in one place: `Button`, `Card`, `Banner`, `Field` (inputs, including ones saved as you type), `Dialog` (confirmations), `Toast`, `CategoryChip`, `EnergyMeter`, and `parts` (links, rows, chips and labels used by the section screens). |
| `src/today/` | The Today section's cards and `TodayScreen`, which puts them together. |
| `src/calendar/` | The Calendar: `CalendarScreen`, the month grid, agenda, selected-day panel, pattern editor and side cards. |
| `src/pay/` | The Pay screen and its settings card. |
| `src/health/` | The Health screens: `HealthScreen` (the Workout and Food tabs; picks the screen from the address, e.g. `#health/workout/schedule`), `WorkoutHome`, `TemplateEditor`, `SessionView` (a workout in progress, and correcting a logged one), `SetFields` (the number boxes for a set), `HistoryViews` (history, exercises, exercise history), `Chart`, `ScheduleView` and `HealthTodayCard`; `actions.ts` (what each button saves). |
| `src/study/` | The Study screens: `StudyScreen` (picks the screen from the address, e.g. `#study/roadmap`), `Dashboard`, `Roadmap`, `CourseDetails`, `TaskDetails`, `SessionView`, `CheckinView`, `RevisionView`, `ConceptsView`, `ConceptView`, `ProgressView`, `StudySettings` and `StudyTodayCard`; `actions.ts` (what each button saves), `round.ts` (the revision round, kept in memory), `parts.tsx` (small shared pieces). |
| `src/commitments/` | Work shifts and appointments: the form and list used by both Today and Calendar. |
| `src/shell/` | Navigation, the theme button and the screens for unreadable or older data. |
| `src/styles/tokens.css` | Colours for dark and light themes (the same as the current MyDay). |
| `src/index.css` | Gives the colours Tailwind names (e.g. `bg-surface`, `text-fg-2`), sets the font, the navigation bar and the animations. |
| `../tests/app-*.test.js` | The checks for this app (adapted from the current MyDay's checks). |

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
2. **Done:** Calendar and Pay.
3. **Done:** Study, with its card on Today.
4. **Done:** Workout (the first half of Health), with its card on Today.
5. **Food** (the rest of Health, with its checks), plus the cooking and shopping reminders on Today.
6. **Ideas** (planned in the current MyDay but not built yet).
7. **Switch over:** publish this version at the main address, keeping the current one as a fallback.
