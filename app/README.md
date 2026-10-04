# MyDay — new version (React + Vite + Tailwind + TypeScript)

This is MyDay being rebuilt in React, one milestone at a time. The current MyDay (`../index.html`) stays live
and unchanged until this version can do everything it does.

**The migration is complete: every section of the current MyDay — Today, Calendar, Pay, Health (Workout and Food)
and Study — works fully in the new app and saves, along with the shared controls (task lists, export/import,
animations, theme).** Ideas was only a placeholder in the current MyDay (never shown, nothing saved), so there's
nothing to move. Release 1.0.0 is published with GitHub Pages — how, how to check which release is loaded, and how
to go back: [`../deploy/README.md`](../deploy/README.md).

> This version saves to the **same data** as the current MyDay when both are opened at the same address (for
> example with Live Server). A change made in one shows in the other. To try things out, use disposable data or
> a backup, not your real plan.

**Cloud sync (from release 1.1.0):** task lists, the queue, daily plans and each day's context can sync between
devices through your own Supabase project. It's off unless the app is built with a Supabase URL and publishable key;
the published build has them (`app/.env.production`). Setting it up: [`../supabase/README.md`](../supabase/README.md).
How it works: "Cloud sync" below.

## Commands

You need Node.js 20.19+ or 22.12+ (checked with Node 24). From the `myday-site` folder:

```bash
cd app
npm install          # first time only (installs into app/node_modules)
npm run dev          # live-editing server, usually http://localhost:5173 (its saved data starts empty)
npm run build        # checks the types (tsc -b) and builds into app/dist/
npm run preview      # serves app/dist at http://localhost:4173, as it will be published (build first)
npm run lint         # checks the code for common mistakes
cd ..
tests/run.sh app-storage app-today app-calendar-pay app-study app-workout app-food app-final app-site   # builds, then checks in a throwaway Chrome profile
tests/run.sh sync-db app-sync   # cloud sync: the database (PGlite) and two devices end to end (a local Supabase stand-in)
deploy/preview-site.sh trial    # the website as GitHub Pages will publish it, at http://localhost:8080/myday/
```

To use the built app beside the current MyDay (sharing its saved data), run `npm run build`, then open
`http://127.0.0.1:5500/myday-site/app/dist/index.html` with VS Code's Live Server. The built copy doesn't update by
itself: build again after a change. While Live Server is running, run the checks as `MYDAY_LS_PORT=5599 tests/run.sh …`.

## What has moved

| Section | In the new app |
|---|---|
| **Today** | Everything: energy (1–5) with its task limits, Build my day with a proposal you confirm (edit, shorten, leave for later), rest days, the queue and Roll to tomorrow, the evening check-in (including yesterday's), Review my plan, Swap for a rest day, Start today over, the nudge, the focus timer, the rolling 7-day learning count, the learning garden, sleep / work / appointments / prep-time context, Today at a glance, editing task lists, export and import, animations on/off. |
| **Calendar** | Everything: your repeating pattern (e.g. 4 days → 4 off → 4 nights → 4 off) with versions that start from a chosen date (earlier dates never change), one-date changes stored apart from the pattern, what actually happened (worked different hours, sick, annual leave, cancelled, off instead, custom), overtime and unauthorised absence as separate entries, appointments, overlap warnings, bank holidays from gov.uk with the region choice, configurable colours with text labels, month and agenda views. |
| **Finance** (was Pay) | Work pay for each pay month: shifts worked (and still planned), gross pay, Income Tax, National Insurance and student loan, and take-home, all estimates labelled with the tax year and gov.uk as the source. Worked out from the Calendar with the same rules as the current MyDay's Pay (overtime, cancelled shifts, bank holidays, annual leave, sick pay, the clock changes), so it changes by itself when the Calendar does. Plus money owed (both ways, with "Settled"), monthly expenses, and what's left over (take-home minus expenses). Your rates are folded away under "Rates". See "Finance" below. |
| **Study** | Everything: a dashboard focused on starting (current focus and course, the next task with its path and estimate, a suggested length that fits your energy and free time, Start learning, "Just 15 minutes", course completion, a revision preview with its own Start revision button); the editable roadmap (stage → course → module → section → task, resource links, archive, focus); learning sessions you can pause, resume, finish or discard, with an optional clock that survives a reload; the optional check-in (task complete, concepts covered, how clear it felt, takeaway, question, Obsidian note); concepts with written or multiple-choice revision questions; revision one question at a time with the answer hidden until you ask, self-assessment, hints, notes, and spaced review dates; progress and history (learning days, completion, practical work, clarity, recall by week, what might need practice); Study settings; and the Study card on Today. |
| **Health → Workout** | Everything: workout templates (create, rename, reorder, archive and restore) with your own or common exercises; strength (reps and kg), bodyweight (reps, with added weight or assistance in kg, kept apart) and cardio (minutes and km); planned sets, reps, weights, durations, distances and rest; scheduling by weekday or as a repeating sequence; proposed dates fitted around shifts and appointments, saved only when you confirm; one-off plans on a date; the latest missed session to Move, Skip or Continue (no backlog); logging a workout with the plan and last time's result beside each exercise, big Done buttons, values prefilled from last time or the plan, the optional rest timer, leave-and-resume, and a kindly named shorter session; history with corrections; exercise history with charts per measure; and the Health card on Today. |
| App shell | Header with the date, the five-section navigation (on wide screens, beside the theme button), Light / Dark / Match device themes. |
| **Health → Food** | Everything: recipe ideas from TheMealDB (three at a time, "Show more"), search with suggestions while you type (your saved recipes at once, TheMealDB after a pause), favourites, recently cooked and your own recipes; preferences (leave out, dislikes, time, batch cooking) with a plain allergen caution; recipe pages with ingredients, servings that scale the quantities (or "as written" when they can't), the method split only on its own lines with the original text kept, nutrition (only your own figures, labelled as yours — never estimated) and the source and links; Want to cook (servings, tick what you have, add the rest); the shopping list grouped by aisle, combining only compatible items, with editing, manual items, Undo and ticking off; the step-by-step cooking view with timers named in a step, saved position and resume; and the cooking and shopping reminders on Today. |

Today's Health card shows a workout to resume, decide about or start, a recipe being cooked, and the shopping list.
Nothing from Health is added to the day's task list.

Every section ends with the shared controls, as in the current MyDay: Edit task lists (it opens Today's list
editor), Export my data, Import my data, Animations on/off, and whether saving works in this browser. The theme
button (Dark → Light → Match device) is in the header on every screen.

### Ideas

The current MyDay lists Ideas only as a planned section (`ready: false`): it's never shown, has no screen and saves
nothing. So nothing was migrated, and the new app doesn't show it either (`#ideas` opens Today). If saved data ever
contains an `ideas` section, both apps keep it exactly as it is.

### Finance (it replaced Pay)

Finance shows only what's needed day to day: the pay month, shifts worked, gross pay with Income Tax, National
Insurance and student loan, take-home, then **Left over** (take-home minus monthly expenses), **Monthly expenses**,
**Money owed** (I owe / owed to me) and, folded away, **Rates**. Pay's other figures (scheduled hours, premiums, sick
pay rules) and its settings card are gone from the screen; the rules behind them haven't changed (`src/data/pay.ts`).

- **Your rates** (£13.85 an hour, overtime at the normal rate, bank holidays ×2, tax code 1241T, NI category A,
  Plan 2, calendar months) are saved into the pay settings the first time Finance opens, replacing what was there
  (`setYourRates` in `src/data/finance.ts`; `finance.ratesSetOn` makes sure it happens once). Change them under
  "Rates": hourly rate, overtime, bank holidays, tax code, NI, student loan and the day a pay month starts.
- **Saved data:** a new `finance` section in `myday.data.v4` (money owed and expenses), checked when loaded like every
  other section (bad entries are counted and reported, unknown fields kept). The current MyDay doesn't show it, and
  keeps it exactly as it is (checked by `tests/app-finance.test.js`). No change to the saved data's shape was needed
  in the current MyDay: it keeps sections it doesn't know.
- **The current MyDay** keeps its full Pay screen, using the same pay settings.
- If the tax code is one MyDay can't work out (e.g. a K code), Finance shows "—" for Income Tax and take-home rather
  than a figure without tax (the current MyDay leaves tax out instead).
- Finance stays on each device for now (it isn't synced yet).

### Calendar and Pay: differences from the current MyDay

- Same rules, records and calculations. The checks compare the two apps side by side with the same data: the
  saved rota, pay settings and bank holidays, every calendar day, and Finance's gross pay, deductions and
  take-home against the current MyDay's Pay.
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

### Food: differences from the current MyDay

- Same provider (TheMealDB with its free test key), records, rules and wording. The checks compare the two apps side by
  side: the saved Food data (including messy data), Today's Health card, a recipe's ingredients and scaled
  quantities, the method, the shopping list and its aisles, what Want to cook adds, and the cooking view.
- **Search replies in order:** each search (and each round of suggestions while typing) is numbered, and a reply for
  an older one is ignored, so a slow answer can never replace newer results. (The current MyDay already does this for
  suggestions, but not for a full search.)
- **Your own recipe's ranges:** an ingredient line like "1-2 cloves garlic" keeps "1-2" together as the quantity, so
  the shopping list keeps it as written. (The current MyDay reads it as "1" of "-2 cloves garlic".)
- Each recipe being loaded has its own "loading" or "couldn't load" state, so one recipe's error never shows on another.
- The recipe page says what Favourite, Want to cook and Start cooking each do, and that none of them records what you
  eat. The cooking view shows the step number large, in a circle, beside "Step 2 of 4".
- A recipe without a photo shows a pot icon (the current MyDay shows an emoji).
- "Are you sure?" questions (delete a recipe, stop cooking, start another recipe while cooking, clear ticked items)
  are asked in the page.
- Export and import are on Today (the current MyDay shows them at the bottom of every section).

## Saved data

- Same key and format as the current MyDay: `myday.data.v4`, `schemaVersion` 4. No migration is needed.
- `src/data/storage.ts` is the only code that reads or writes it. It loads and checks the data before anything can be saved.
  If the data can't be read, or came from a newer MyDay, saving stops and the saved copy is left exactly as it was
  (you can download it, import a backup, or start fresh).
- Rota, pay, bank holidays, Study, Workout and Food are checked when loaded exactly as the current MyDay checks them: every
  valid record is kept, and anything damaged is dropped the same way (the checks prove both apps save identical
  results). As in the current MyDay, Study keeps only one session in progress (any other is marked finished), and
  Study, Workout and Food don't keep unknown fields *inside* their records.
- Anything else stored under Health, and any unknown top-level sections, are kept exactly as saved and included in
  exports.
- **Another tab:** before every save it checks whether another tab (or the current MyDay) saved since; if so, it shows
  that newer data and says your last change wasn't saved, rather than overwriting it. Tabs also update each other.
- **Saving at the same moment:** localStorage has no locking, so if two tabs save within the same instant, the later
  write wins. This can't be prevented; it is *detected*: the tab whose change was replaced says so. (Same as the
  current MyDay; both apps sign their saves the same way, so this works between them too.)
- Data from older MyDay versions (`myday.data.v3`, `v2`, version 1) is moved to the current format by the current
  MyDay. Until that has happened, the new app explains this and saves nothing.
- If the browser blocks storage, the app still works but says changes won't be kept after closing.
- **Cloud sync doesn't change the saved data's shape.** Its own notes are kept apart, in `myday.sync.v1` (read and
  written only by `src/sync/state.ts`), and the sign-in session in `myday.sync.auth` (kept by the Supabase library).
  Records arriving from the cloud are saved through `storage.ts` (`updateSaved`) after the same checks as a backup
  (`normalize`). Neither key is part of an export, which still holds all of the MyDay data.
- **Nothing unreadable is left out silently.** Like the current MyDay, entries that can't be read (and whole sections
  damaged into the wrong kind of value) are left out when the app starts, and they'd be gone after the next save.
  The new app says so on every screen, with how many, and offers "Download a copy" of the saved data exactly as it
  was before anything is saved over it. (The current MyDay leaves them out without saying.)

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
| `src/data/finance.ts` | Finance: a month's work pay (from `pay.ts`), your rates (set once), checking saved money-owed and expense entries, totals. |
| `src/data/bankHolidays.ts`, `bankHolidayFetch.ts` | Bank holidays (checking, looking up a date) and loading them from gov.uk. |
| `src/data/util.ts` | Small shared helpers (number checks, ids, copying). |
| `src/data/food/` | Food's data and rules, ported from the current MyDay: `normalize.ts` (checking saved Food data), `words.ts` (ingredient words for preferences and shopping aisles), `quantities.ts` (reading and scaling quantities), `shopping.ts` (making and combining shopping items), `recipes.ts` (preferences, steps, timers, what's listed), `mealdb.ts` (TheMealDB requests, kept in memory for the visit). |
| `src/data/workout/` | Workout's data and rules, ported from the current MyDay: `normalize.ts` (checking saved Health data), `common.ts` (labels, units and wording), `plans.ts` (which workout is planned when, missed sessions, the sequence, Today's blocks), `propose.ts` (proposed dates around shifts), `sessions.ts` (logging, finishing, prefilling, the rest timer), `history.ts` (exercise history and chart measures). |
| `src/data/study/` | Study's data and rules, ported from the current MyDay: `normalize.ts` (checking saved Study data), `roadmap.ts` (the outline, completion, setup, editing), `sessions.ts` (sessions, suggested length, check-ins, learning days), `revision.ts` (due concepts, review scheduling, cautious labels), `progress.ts` (progress and history), `common.ts` (labels, limits, Obsidian links). |
| `src/components/` | Shared pieces with their styling in one place: `Button`, `Card`, `Banner`, `Field` (inputs, including ones saved as you type), `Dialog` (confirmations), `Toast`, `CategoryChip`, `EnergyMeter`, and `parts` (links, rows, chips and labels used by the section screens). |
| `src/today/` | The Today section's cards and `TodayScreen`, which puts them together. |
| `src/calendar/` | The Calendar: `CalendarScreen`, the month grid, agenda, selected-day panel, pattern editor and side cards. |
| `src/ai/` | "Help me adjust today": `context.ts` (what's sent), `validate.ts` (the rules), `apply.ts` (saving, stale check, undo) and `AdjustCard.tsx` (the card on Today). "Add what's on my mind": `mind.ts` (what's sent, the checks, adding and undo) and `MindCard.tsx`. Both: `request.ts` (the Edge Function or practice mode). |
| `../ai-eval/` | The evaluation of AI models on 20 synthetic days and 12 synthetic brain dumps (see its README). |
| `src/finance/` | The Finance screen: `FinanceScreen` (with Left over), `WorkPayCard`, `ExpensesCard`, `OwedCard`, `RatesCard` (folded away), and `actions.ts` (what each button saves). |
| `src/data/patterns/`, `src/patterns/` | What MyDay has noticed: `notice.ts` (finding patterns in your history), `saved.ts` (your preferences and answers, the `patterns` section), `adapt.ts` (using preferences in Build my day and the room on today's plan); the screen `NoticedScreen.tsx` (`#noticed`, and the quiet line on Today). `src/components/Why.tsx`: a note with a "Why?". `src/tasks/StuckCard.tsx`: "What's getting in the way?". |
| `src/tasks/`, `src/data/tasks.ts` | Inbox → Tasks: `TasksScreen` (adding, the groups, lists as chips, search), `TaskEditor`, `ListsView`, `route.ts` (`#inbox/tasks`, `#inbox/tasks/<id>`, `#inbox/tasks/list/<id>`, `#inbox/tasks/lists`); the data and rules (groups, due today, room on today's plan, the link to the plan) in `src/data/tasks.ts`. Today's "Due today" card: `src/today/DueTodayCard.tsx`. |
| `src/inbox/`, `src/notes/`, `src/capture/` | The Inbox section (`InboxScreen`, with the Tasks and Notes tabs), Notes (`NotesScreen`: search, Inbox, collections; `NoteEditor`; `CategoriesView`; `route.ts` — `#inbox/notes`, `#inbox/notes/<id>`, `#inbox/notes/in/<id>`, `#inbox/notes/collections`, and older `#notes…` links), and Capture (`parse.ts`, `save.ts`, `CaptureSheet.tsx`). The notes data: `src/data/notes.ts`. |
| `src/health/food/` | The Food screens: `FoodScreen` (picks the screen from the address, e.g. `#health/food/shopping`), `FoodHome`, `RecipeCard`, `SearchBox` (with suggestions), `SearchView`, `RecipeView`, `WantView`, `ShoppingView`, `CookView`, `PrefsView`, `RecipeForm`; `actions.ts` (what each button saves) and `visit.ts` (what's kept in memory for the visit: ideas, search results, suggestions, drafts). |
| `src/health/` | The Health screens: `HealthScreen` (the Workout and Food tabs; picks the screen from the address, e.g. `#health/workout/schedule`), `WorkoutHome`, `TemplateEditor`, `SessionView` (a workout in progress, and correcting a logged one), `SetFields` (the number boxes for a set), `HistoryViews` (history, exercises, exercise history), `Chart`, `ScheduleView` and `HealthTodayCard`; `actions.ts` (what each button saves). |
| `src/study/` | The Study screens: `StudyScreen` (picks the screen from the address, e.g. `#study/roadmap`), `Dashboard`, `Roadmap`, `CourseDetails`, `TaskDetails`, `SessionView`, `CheckinView`, `RevisionView`, `ConceptsView`, `ConceptView`, `ProgressView`, `StudySettings` and `StudyTodayCard`; `actions.ts` (what each button saves), `round.ts` (the revision round, kept in memory), `parts.tsx` (small shared pieces). |
| `src/commitments/` | Work shifts and appointments: the form and list used by both Today and Calendar. |
| `src/shell/` | Navigation, the theme button, the shared footer (`AppFooter`), the "couldn't be read" notice (`LoadIssue`) and the screens for unreadable or older data. |
| `public/icon.svg` | The tab icon. |
| `src/version.ts` | The release identifier (version, commit, build date), filled in when building (`vite.config.ts`). |
| `src/sync/` | Optional cloud sync (see "Cloud sync"): `config.ts` (is it set up?), `records.ts` (which parts of the saved data are records, fingerprints, descriptions), `state.ts` (sync's notes, `myday.sync.v1`), `client.ts` (Supabase: sign-in and the two sync functions), `engine.ts` (sending, receiving, conflicts, reviews, the status), and the screens: `SyncBadge` (the status at the top), `SyncScreen` (`#sync`), `ReviewPanel` (what would change), `Compare` (two versions side by side). |
| `../supabase/` | The database changes for sync (`migrations/`, version-controlled SQL) and the set-up guide. |
| `../deploy/` | Publishing: building the website (`build-site.sh`), previewing it (`preview-site.sh`), committing it to `main` (`publish-main.sh`) and the guide. |
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

## Cloud sync

Optional, and off unless the app is built with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (set-up:
[`../supabase/README.md`](../supabase/README.md)). Without them, nothing about sync is shown and the Supabase library
is never downloaded.

**What syncs (this first part):** the three task lists (one record each, in order), the queue (one record), each
day's plan (one record per date) and each day's context, energy and sleep (one per date). These go together because
building a day's plan picks tasks from the lists and moves tasks to and from the queue in the same step.
**Stays on the device:** Calendar and Finance, Health (Workout and Food), Study, appointments, settings, the timer, and
anything else. Study's links to a learning task or a day's task are just references, and MyDay already copes when
the item they point to isn't there.

**How it works** (details at the top of `src/sync/engine.ts`):
- Local first: every change is saved on the device as before; sync never makes you wait.
- Sync remembers each record's cloud version and a fingerprint of its content. Anything that differs was changed on
  this device (here, in another tab or in the classic MyDay), so changes waiting to be sent survive reloads and
  being offline without a separate queue.
- Each change is sent with the version it was based on and its own id. The database (`sync_push`) applies it only
  if that's still the latest version. Otherwise it's a **conflict**: nothing is overwritten, and the sync screen shows
  both versions for you to choose. A retried change (same id) is never applied twice.
- Then it fetches what changed since the last time, by the account's own change numbers (never device clocks).
  Deleted day plans arrive as deletions (the database keeps a marker), so they don't come back.
- Before a device first syncs with an account, after restoring a backup, or when more than 30 records change at once,
  sync pauses for a **review**: what would be saved here, what would be sent, and what's different on each (you
  choose). Nothing changes until you confirm. Any version of this device's that gets replaced is kept and can be
  downloaded.
- The status at the top of every screen: **Saved locally**, **Syncing**, **Synced** or **Needs attention**.
  Tap it for the sync screen (`#sync`).
- One account per device. Another account signed in sends and fetches nothing, and the database refuses requests
  naming a different account from the one signed in. Each account can read only its own rows (Row Level Security),
  and nobody can write to the tables directly.

**Limitations:** a list (or the queue) changed on two devices before they sync is a conflict, even if different tasks
changed. No live updates: the other device's changes arrive when you come back to MyDay, every 5 minutes while
it's open, or with "Sync now". Changes made in the classic MyDay are sent the next time the new app is open.
Checked against a local stand-in for Supabase (the real migrations in PostgreSQL, `tests/run.sh sync-db app-sync`), and
against the real project with two disposable test accounts (`tests/sync-live-check.js`: 21/21; the app on two browser
profiles: 16/16, 3 Oct 2026). Not yet checked in Safari or on a real phone before release 1.1.0.

## Study topics

Study holds more than one subject: **Topic → stage → course → module → section → task**. A bar of topics sits above
the roadmap (always visible, with "Add a topic"); choosing one shows its stages. Data without topics is one roadmap,
shown as one topic ("Cybersecurity" when it's built from the starter stages) — nothing is saved until you add a topic.
- Adding the first topic makes your roadmap the first topic: its stages get that topic's id; their contents are
  untouched. A new topic starts with a stage, "Start here", so you can add a course straight away.
- "Add a course" asks for its name, a usual session and **Also suggest it on Today** (ticked): then it's also added
  to the end of your Learning list ("<course> — one section"), linked to the course like the ones you set up first.
- In Edit: rename, move or remove the chosen topic (removing says what goes with it, and the only topic can't be
  removed; its Learning list entries stay); "Add a stage" adds to the chosen topic; moving a stage stays within its
  topic.
- Saved as `study.topics` (`[{ id, title }]`) and a `topicId` on each stage — additions only, in **both** versions'
  `normalizeStudy` (the classic MyDay keeps them and shows every stage, whatever its topic). A stage without a topic
  (e.g. added in the classic MyDay) shows under the first. Code: `src/data/study/topics.ts`, `src/study/TopicsBar.tsx`,
  `src/study/CourseForm.tsx`.

## Health → Goal

A third Health tab: choose a goal (lose weight, build muscle, both at once, maintain, or get fitter and healthier),
answer a few questions one at a time (about you — in kg/cm or stone/feet —, how active your days are with shift
examples, training experience, days and equipment, pace, and a few health questions), and get a plan:
- **Calories** (a range): Mifflin–St Jeor × an activity factor; losing about 300 (gentle) or 550 (steady) kcal a day
  under that (NHS: 0.5–1 kg a week from about 600 kcal less), never starting below your body's own needs or
  1,200 kcal (women) / 1,500 (men); building muscle 200 or 350 over; both at once 250 under; maintain about level.
- **Protein**: 1.2–2.2 g/kg depending on the goal (ISSN 2017; Morton et al. 2018), using a healthy weight for your
  height above a BMI of 30. **Fats** 25–35% of calories; **carbs** the rest ("carbs aren't the enemy").
- **Training**: strength sessions a week (never more than the days you have; full-body for beginners, upper/lower
  for more), cardio (NHS: 150 minutes of moderate activity a week), progress, checking in, and tips for shifts.
- **Safety**: no calorie or protein targets when pregnant or breastfeeding, after an eating disorder (or if you'd
  rather not say), or with diabetes, a kidney or heart condition — kind words and where to turn (midwife, GP, BEAT,
  a dietitian) instead; under-18s are stopped with the NHS's advice for young people; it never suggests losing
  weight below a healthy BMI.
- **Connected**: "Suggest a workout schedule" sets Workout's in-order schedule to about that many sessions a week
  (you confirm); recipes with your own nutrition figures show how they fit the goal (e.g. "High in protein — good for
  your goal", "Higher in calories for your goal — try a smaller portion" — never "good" or "bad"); Today's Health card
  shows "This week: 1 of 3 workouts".
- Labelled as estimates from public guidance, not medical advice, with the sources. Saved as a top-level `fitness`
  section (added by the new app, like Finance and Notes; the classic MyDay keeps it unread), on this device only.
  Code: `src/data/goals.ts` (the figures), `src/health/GoalView.tsx`.

## Inbox and Capture

**Inbox** is the sixth section in the bar (Today, Calendar, Inbox, Finance, Health, Study), with two tabs: **Tasks**
(it opens on these) and **Notes**. Ideas gets its own tab when it's ready (it isn't shown before).
- **Tasks** holds every one-off task in one place, separate from Today's repeating Learning / Admin / Health lists
  (which stay as they are). Type a task in your own words and its date and time are read from them, as in Capture
  ("pay rent by Friday" is due Friday; "call GP tomorrow at 10am" is due tomorrow at 10:00). Tasks are grouped
  **From earlier** (said gently: no rush), **Today**, **Coming up**, **Any time** and **Done** (folded away), earliest
  first. Each task has its words, an optional date and time, a length, a kind (Learning, Admin or Health — what it
  counts as on Today's plan), notes, and an optional **list** of your own ("Moving house", "Car": add, rename,
  reorder; removing a list keeps its tasks). Search appears once there are more than four tasks. Rolling a task to
  tomorrow in the evening check-in sends it to the queue like any plan task; it then shows under "Also on your plate".
- **Due today on Today:** tasks due today, or still to do from before, are listed on Today with **Add to plan** — one
  tap adds the task to today's plan (at its time, if it has one), but only while there's room for your energy (1, 2
  or 3 tasks, the same limit as Build my day). Nothing is added by itself. Before the day is built, and on a rest day,
  the card says so instead. A task on the plan is linked, not copied: ticking it off on the plan ticks it off in
  Tasks, and the other way round.
- Saved as the `tasks` section (`{ lists, items }`; a task points at its plan copy with `plannedOn` and `planUid`).
  Added in 1.5.0; the classic MyDay keeps it unread (a task added to today's plan is an ordinary plan task there).
  Tasks stay on this device (not synced) and are in "Export my data".
- **Notes** is an Inbox you can dump anything into — nothing has to be filed. Each note in the Inbox shows a one-tap
  suggestion from its words ("File in Business ideas") and a "File it…" menu; **collections** (Lifestyle, Business
  ideas, Health & fitness, Money, Study & career, Personal — rename, reorder, add or remove) each have their own list;
  **search** looks in every note. Removing a collection puts its notes back in the Inbox; nothing is deleted. A note
  is saved as you type (after a short pause), when you leave a box and when you switch away; a new note left empty
  isn't kept; deleting asks first.
- Saved as the `notes` section (`{ categories, items }`; a note with no collection, or one whose collection has gone,
  is in the Inbox). Notes filed in 1.3.0 stay filed. The classic MyDay keeps the section unread. Notes stay on this
  device (not synced) and are in "Export my data".

**Capture** (the **+** button: bottom-right above the bar on phones, beside the theme button on wide screens, on every
screen): type anything and MyDay suggests what it looks like — and does only what you tap.
- A time ("call GP tomorrow at 10am", "meeting with Jo next Tuesday 2-3pm") → **Add to Calendar** (an appointment,
  30 minutes unless an end is given). An action ("renew passport", "need to email the landlord") → **Add as a task**
  (to Tasks, with the date and time it mentions, as the kind of task you pick; a task due today then shows on Today). An
  idea ("app idea: …", "what if…") → **Save in Business ideas**. Anything else → **Save to Notes inbox**. The other
  choices are always there too.
- Worked out on the device, nothing sent: dates and times with [chrono-node](https://github.com/wanasit/chrono)
  (MIT; UK date order, and "the 14th" read as this month or the next), grammar and people's names with
  [compromise](https://github.com/spencermountain/compromise) (MIT), and plain rules for action words, appointment
  words, ideas, lists and collections (`src/capture/parse.ts`). Both libraries load only when Capture first opens.
  Saving: `src/capture/save.ts`; the sheet: `src/capture/CaptureSheet.tsx`.
- Wide screens: below 1440 px the bar shows icons only (with names for screen readers and on hover), so six
  sections, Capture and the theme button never run into a long date.

## What MyDay has noticed (learning your patterns)

MyDay learns how you actually work — patterns, not judgements — so it can fit itself to you rather than the other
way round. **What MyDay has noticed** (`#noticed`, from the footer on every screen; Today shows one quiet line only
when there's something new) lists what it found, each with a **Why?** (the evidence, in numbers), and asks "Does this
sound right?".

- **Worked out on the device, from what's already saved** — no new log of what you do, no AI, nothing sent anywhere:
  day plans (what was planned, how long, what got ticked off), Study sessions (planned and actual length, when they
  started), energy and sleep, and work days from the Calendar. Patterns aren't saved; they're worked out afresh each
  time from the last 8 weeks, so they follow how you work now. `src/data/patterns/notice.ts`.
- **Careful with small numbers:** a pattern needs a minimum of examples before it's shown (an "early sign", or a
  "clear pattern" from 20), only days you used MyDay count (something ticked off, or the evening check-in — a task you
  did but didn't tick off would otherwise count as not done), and the evidence is given as counts ("7 of 9"), not
  percentages.
- **What it looks for:** shorter tasks of a kind getting done more often (comparing lengths of 15–45 min); study
  sessions ending much sooner (or running much longer) than planned; when you usually study; energy after short
  nights and on work days; finishing everything more often with fewer tasks; one kind of task being left for another
  day much more often; and what usually gets in the way of stuck tasks.
- **Your answers:** "Yes — do that" (for a pattern MyDay can use: it becomes one of your preferences, with its evidence
  kept as the "Why?"), "Yes, but change nothing" / "That's right", or "Not really" (hidden until there's clearly more
  evidence: half as many examples again, at least 5). "Forget my answer" undoes one. A pattern you agreed with that
  fades is shown as "less clear lately", not hidden.
- **Your preferences come first** (`src/data/patterns/saved.ts`): the longest task of each kind when building your
  day, and the most tasks in a day (never more than your energy allows). Build my day applies them in the open — "25
  min (shortened from 60)" with "Shortened to 25 min — your length for learning tasks." and a **Why?**; "1 task today,
  as you chose (your energy allows 3)." — and nothing is saved until you apply the plan, as before. "Review my plan"
  and "Due today" keep to the same most. Without preferences, plans are exactly as before (`src/data/patterns/adapt.ts`).
  Your energy rating is never changed by a pattern.
- **Tasks that keep moving** (Inbox → Tasks): a task moved later 3 times, or a week past its date, asks **What's
  getting in the way?** (also on any task, from "Something in the way?"). Each answer changes the task so it's easier
  to start, rather than "try again": too big / don't know where to start → you write the first step, which becomes a
  10-minute task for today (the whole task waits under Any time); boring → a 10-minute version today; too tired → your
  next day off from the Calendar (or the weekend); missing something → noted, Any time; doesn't matter any more → **let
  go** (under Done, and unticking brings it back); something else → noted. Answers are kept on the task and looked at
  for a pattern.
- Saved: the `patterns` section (`{ prefs, answers }`, new in 1.6.0) and three fields on each task (`postponed`,
  `blockers`, `letGoOn`). The classic MyDay keeps them unread. On this device only, and in "Export my data".
- Not yet: using patterns to suggest times (e.g. studying in the evening), and giving AI help your confirmed patterns
  and preferences (both planned as later steps, the second only if you choose to).

## AI help: "Help me adjust today" (prototype)

Off unless the app is built with `VITE_AI` (`mock` = practice mode, rules not AI, nothing sent; `edge` = the
`ai-plan` Supabase Edge Function, for signed-in accounts). Set-up: [`../supabase/README.md`](../supabase/README.md),
"AI planning prototype". Evaluation: [`../ai-eval/README.md`](../ai-eval/README.md).

- A secondary button on Today's plan opens a card: an optional short note, then **one** request.
- `src/ai/context.ts` gathers what's sent, with MyDay's own rules (the energy limit counting what's done, the
  calendar's busy blocks and free time — overnight shifts and clock changes included). Appointment names, Finance,
  Health records and Study notes are not sent.
- `src/ai/validate.ts` checks every reply before you see it: only today's open tasks by id, energy 1–2 (or not
  recorded) one small task (≤ 20 min), 3 two, 4–5 three (minus what's done), never longer than the task's usual
  length, times only inside free time, rest always allowed, missing information named (energy, sleep), short and
  gentle wording (pushy or guilt-tripping explanations are replaced). Anything else is dropped or reduced to fit,
  and listed under "Adjusted to fit MyDay's rules".
- `src/ai/apply.ts` saves only after **Use this plan**, through "Review my plan"'s save path: only today's copy of
  each task changes (minutes and time); task lists, other days, finished tasks and the energy rating never change;
  tasks left out wait in the queue. A suggestion made before the plan, energy, sleep, shifts, appointments or settings
  changed is refused. One step of **Undo** right after (until the plan changes, or you leave).
- `src/ai/request.ts` talks only to the Edge Function (or the practice planner). The app never holds an AI key.
- No saved-data changes: suggestions live in memory; the server keeps only counts (requests, tokens, budget).

### "Add what's on my mind"

A second secondary button, on Today before and after the day is built. You write whatever is on your mind; one request
returns up to 8 small tasks; you tick the ones to add.
- **Sent**: only what you write and today's date — not your lists, queue or plan (`src/ai/mind.ts`,
  `buildTasksContext`). The shared contract, instructions and practice version are in
  `supabase/functions/_shared/ai/tasks.ts`.
- **Checked** (`checkTasksReply`): at most 8 tasks (more are listed back, not dropped), names cleaned and at most 80
  characters, a list MyDay has (otherwise Admin), 5–120 minutes, one-off unless said otherwise, the same task twice
  kept once, gentle wording; anything not turned into a task is listed back under "Not turned into tasks". Tasks
  already on a list or in the queue (in any wording) are marked and start unticked.
- **Added** (`applyMind`) only after **Add**: a one-off to the **queue** (no list of its own — MyDay fits it into a
  coming day, oldest first, within the day's energy rule, and once done it's gone); a repeating one to the end of its
  **list**. Only additions; nothing else changes. One step of **Undo** takes back exactly what was added, except a
  task you've changed since or one already on a day's plan.
- Saved data keeps its shape (a queue item with no list, `taskId: null`, as the classic MyDay already allows), so
  both versions and sync read it as they are.

## Milestones

1. **Done:** project set-up, design, shell and navigation, themes, the shared storage layer, and a fully working Today.
2. **Done:** Calendar and Pay (Pay became Finance after release 1.1.0).
3. **Done:** Study, with its card on Today.
4. **Done:** Workout (the first half of Health), with its card on Today.
5. **Done:** Food (the rest of Health), with the cooking and shopping reminders on Today.
6. **Done:** final checks: the shared controls on every section, a whole-app comparison with the current MyDay,
   representative backups, unreadable data never left out silently, keyboard, phones, themes, development mode and the
   production preview. Ideas was only a placeholder, so there was nothing to move.
7. **Release 1.0.0:** published with GitHub Pages — the new app at the main address, the classic MyDay kept at
   `/myday/classic/`. The release identifier ("MyDay 1.0.0 · commit · build date") is at the bottom of every screen.
   See [`../deploy/README.md`](../deploy/README.md).
8. **Cloud sync, first part — release 1.1.0:** sign-in, and syncing task lists, the queue, daily plans and day
   context through Supabase, with reviews, conflicts and deletions handled. Checked with a local stand-in and against
   the real project with disposable test accounts.
9. **Release 1.2.0:** Finance replaces Pay (work pay from the Calendar, money owed, monthly expenses, what's left
   over), and AI help on Today for signed-in accounts — "Help me adjust today" and "Add what's on my mind" — through
   the `ai-plan` Edge Function (GLM-5.3-Flash, after evaluations on synthetic days and brain dumps; see
   [`../ai-eval/README.md`](../ai-eval/README.md)). Built with `VITE_AI=edge` in `.env.production`.
10. **Release 1.3.0:** Notes (your own categories, from a card on Today), Study topics (more than one subject, each
    with its own roadmap; new courses can be suggested on Today), and Health → Goal (a goal, a few questions and a plan
    from public guidance, connected to Workout, recipes and Today). Notes and Goal are new sections the classic MyDay
    keeps unread; Study topics are kept by both versions.
11. **Release 1.4.0:** Inbox (a sixth section) with Notes as an Inbox, optional collections and search, and Capture
    on every screen — suggestions from what you type (Calendar, a task, an idea, a note), worked out on the device.
    Part 1 of 3: Tasks and Ideas follow.
12. **Release 1.5.0:** Tasks in the Inbox (part 2 of 3): every task in one place with dates and times, your own lists,
    "Due today" on Today with one tap to add a task to the plan (within your energy's limit), and Capture's tasks
    going there with their dates. Ideas (part 3) follows.
13. **Release 1.6.0:** What MyDay has noticed — patterns in how you actually work, from your own history on the
    device, each with a "Why?" and only used once you say so; your preferences (task length, most tasks a day) used by
    Build my day in the open; and "What's getting in the way?" for tasks that keep moving.
