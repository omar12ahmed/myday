# MyDay — new version (React + Vite + Tailwind + TypeScript)

Cybersecurity curriculum integration (local development): Study now includes the supplied 27-module package,
path import, lesson/lab/project pages, evidence notebook and optional AI explanations. See
[`../CYBERSECURITY_INTEGRATION.md`](../CYBERSECURITY_INTEGRATION.md) for the architecture review, scope,
data model, validation and required backend deployment order. Builds validate the canonical package with
Python 3 before generating the catalogue. This does not implement verified mastery or automatic advancement.
The Practice shelf adds 12 free-first external assignments (including specific TryHackMe rooms and Academy
labs) and three local interactives. Each records resumable attempts through the existing notebook; no API
keys or MCP connection are required. Provider completion is self-reported. The separate activities JSON
is validated at build time, including lesson mappings, allowed provider URLs and free alternatives.

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
- **Focus mode** (1.11.0) is a choice for one device, kept in `myday.focus` ("1" when on, read and written only by
  `src/shell/focusMode.ts`): not part of the MyDay data, not synced, not exported.
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
| `src/today/` | The Today section's cards and `TodayScreen`, which puts them together — including the dashboard's `GreetingCard` (greeting, scene, calendar), `DashboardCards` (the ring and this week's bars, counted by `src/data/dashboard.ts`), `QuickAdd`, `FocusCard` and `FocusView` (Focus mode). |
| `src/calendar/` | The Calendar: `CalendarScreen`, the month grid, agenda, selected-day panel, pattern editor and side cards. |
| `src/ai/` | "Help me adjust today": `context.ts` (what's sent), `validate.ts` (the rules), `apply.ts` (saving, stale check, undo) and `AdjustCard.tsx` (the card on Today). "Add what's on my mind": `mind.ts` (what's sent, the checks, adding and undo) and `MindCard.tsx`. Both: `request.ts` (the Edge Function or practice mode). |
| `../ai-eval/` | The evaluation of AI models on 20 synthetic days and 12 synthetic brain dumps (see its README). |
| `src/finance/` | The Finance screen: `FinanceScreen` (with Left over), `WorkPayCard`, `ExpensesCard`, `OwedCard`, `RatesCard` (folded away), and `actions.ts` (what each button saves). |
| `src/data/patterns/`, `src/patterns/` | What MyDay has noticed: `notice.ts` (finding patterns in your history), `saved.ts` (your preferences and answers, the `patterns` section), `adapt.ts` (using preferences in Build my day and the room on today's plan); the screen `NoticedScreen.tsx` (`#noticed`, and the quiet line on Today). `src/components/Why.tsx`: a note with a "Why?". `src/tasks/StuckCard.tsx`: "What's getting in the way?". |
| `src/projects/`, `src/data/projects.ts` | Projects (1.12.0): `ProjectsScreen` (the Projects and Notes tabs, "Start a project", project cards), `ProjectView` (one project: what it is, the progression, the next step, tasks, notes, coming up, how it's going, pause / done / delete), `parts.tsx` (the progression steps, the project picker used by notes and tasks); the data, the next step and what's coming up in `src/data/projects.ts`. Today's "From your projects" and "Your tasks": `src/today/ProjectCards.tsx`. Older `#inbox…`/`#notes…` links: `src/shell/legacyLinks.ts`. |
| `src/tasks/`, `src/data/tasks.ts` | Tasks (under Today since 1.12.0): `TasksScreen` (adding, the groups, lists as chips, search), `TaskEditor`, `ListsView`, `route.ts` (`#today/tasks`, `#today/tasks/<id>`, `#today/tasks/list/<id>`, `#today/tasks/lists`); the data and rules (groups, due today, room on today's plan, the link to the plan) in `src/data/tasks.ts`. Today's "Due today" card: `src/today/DueTodayCard.tsx`. |
| `src/data/understand.ts`, `src/shell/autoConnect.ts`, `src/notes/ConnectedCard.tsx` | Understanding notes on the device (1.13.0): the words that count, which project a note clearly belongs to, related notes, Undo / Keep (`understand.ts`); connecting a moment after changes (`autoConnect.ts`); "MyDay connected these" (`ConnectedCard.tsx`). |
| `src/notes/`, `src/capture/` | Notes, in the Projects section (`NotesScreen`: search, Inbox, collections; `NoteEditor`; `CategoriesView`; `route.ts` — `#projects/notes`, `#projects/notes/<id>`, `#projects/notes/in/<id>`, `#projects/notes/collections`), and Capture (`parse.ts`, `save.ts`, `CaptureSheet.tsx`). The notes data: `src/data/notes.ts`. |
| `src/health/food/` | The Food screens: `FoodScreen` (picks the screen from the address, e.g. `#health/food/shopping`), `FoodHome`, `RecipeCard`, `SearchBox` (with suggestions), `SearchView`, `RecipeView`, `WantView`, `ShoppingView`, `CookView`, `PrefsView`, `RecipeForm`; `actions.ts` (what each button saves) and `visit.ts` (what's kept in memory for the visit: ideas, search results, suggestions, drafts). |
| `src/health/` | The Health screens: `HealthScreen` (the Workout and Food tabs; picks the screen from the address, e.g. `#health/workout/schedule`), `WorkoutHome`, `TemplateEditor`, `SessionView` (a workout in progress, and correcting a logged one), `SetFields` (the number boxes for a set), `HistoryViews` (history, exercises, exercise history), `Chart`, `ScheduleView` and `HealthTodayCard`; `actions.ts` (what each button saves). |
| `src/study/` | The Study screens: `StudyScreen` (picks the screen from the address, e.g. `#study/roadmap`), `Dashboard`, `Roadmap`, `CourseDetails`, `TaskDetails`, `SessionView`, `CheckinView`, `RevisionView`, `ConceptsView`, `ConceptView`, `ProgressView`, `StudySettings` and `StudyTodayCard`; `actions.ts` (what each button saves), `round.ts` (the revision round, kept in memory), `parts.tsx` (small shared pieces). |
| `src/commitments/` | Work shifts and appointments: the form and list used by both Today and Calendar. |
| `src/shell/` | Navigation, the top bar's parts (`TopBar`: the Focus mode switch and your account; `focusMode.ts`, the device-only `myday.focus`), the theme button, the shared footer (`AppFooter`), the "couldn't be read" notice (`LoadIssue`) and the screens for unreadable or older data. |
| `public/icon.svg` | The tab icon. |
| `src/version.ts` | The release identifier (version, commit, build date), filled in when building (`vite.config.ts`). |
| `src/sync/` | Optional cloud sync (see "Cloud sync"): `config.ts` (is it set up?), `records.ts` (which parts of the saved data are records, fingerprints, descriptions), `state.ts` (sync's notes, `myday.sync.v1`), `client.ts` (Supabase: sign-in and the two sync functions), `engine.ts` (sending, receiving, conflicts, reviews, the status), and the screens: `SyncBadge` (the status at the top), `SyncScreen` (`#sync`), `ReviewPanel` (what would change), `Compare` (two versions side by side). |
| `../supabase/` | The database changes for sync (`migrations/`, version-controlled SQL) and the set-up guide. |
| `../deploy/` | Publishing: building the website (`build-site.sh`), previewing it (`preview-site.sh`), committing it to `main` (`publish-main.sh`) and the guide. |
| `src/styles/tokens.css` | Colours for dark and light themes (the same as the current MyDay). |
| `src/index.css` | Gives the colours Tailwind names (e.g. `bg-surface`, `text-fg-2`), sets the font, the navigation bar and the animations. |
| `../tests/app-*.test.js` | The checks for this app (adapted from the current MyDay's checks). |

## Design

From 1.11.0 the new app has its own **warm look** (chosen from a reference design, 4 Oct 2026, and asked to "feel
expensive across the app"); the classic MyDay (`../index.html`) keeps its calm green look, because it's the fallback and
stays unchanged unless asked. They still share the font and the task timeline (font files in `../fonts/`), and saved
data — only the look differs.

- **Colours** (`src/styles/tokens.css`): a soft peach page with gentle orange and pink glows, white cards, orange
  (`primary`, #c2410c light / #fdba74 dark) for buttons, highlights and links, **green** (`done`) for things that are
  done — ticks, finished workout sets, progress bars — and the category colours as before. Light by default
  (`settings.theme` defaults to `light` in the new app); the warm dark palette is a deep brown. Every text colour pair
  meets WCAG AA contrast in both themes (the lowest is 4.8:1 in light, 5.9:1 in dark).
- **Feeling expensive** comes from restraint, not decoration: soft, layered, warm-tinted shadows (`--shadow`); the one
  main button on a card in a deeper orange gradient with a soft glow beneath it (`primary` → `primary-2`,
  `--shadow-cta`), lifting slightly under the pointer; every button giving a small press when tapped; fields that glow
  softly in orange when you type in them; roomier cards on wide screens; and the tools at the bottom of every screen
  (task lists, backups, animations) as small quiet pills instead of five full-width bars.
- **Navigation:** on phones, a frosted bar floating just above the bottom edge; on wide screens (64rem and up), a
  rounded orange rail down the left side with the MyDay logo at the top (a link to Today) and every section's icon
  and name (the current one on a white pill), and the page beside it.
- **Top bar:** the section's name above the date; on Today, the Focus mode switch (a round icon button on phones);
  your account (initials, and on wide screens your name and email) when signed in; + Capture; the theme button. On
  wide screens it's a white card above the page.
- **App icon:** the circle-and-tick on an orange gradient (`public/icon.svg`, `public/icon-maskable.svg`; sizes made by
  `scripts/make-icons.mjs`).
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
- **Morning:** energy and Build my day share a card, just under the greeting; on phones the greeting stays compact so
  Build my day is visible without scrolling (checked by `tests/app-today`).
- **Today's dashboard** (1.11.0): a greeting across the top ("Good morning, Sam!" — your name is asked for quietly,
  with a link, and can be changed under Your preferences) over a calm drawn scene that follows the time of day, with
  this month's calendar on wide screens (this week on phones) and a dot on days with a shift or appointment. Then the
  plan, with "Add a task for today" under it (a task due today, added to the plan if it has room for your energy —
  the same rules as Due today), and beside it the focus timer (pick a task and a length, then MyDay's own timer runs),
  today's progress as a ring ("2 of 3 done") and this week as green bars — plain counts, never scores or percentages.
- **Focus mode** (the switch in the top bar, on Today): shows only what's next — the task up next with Start focus,
  Just start and Tick it off, or the running timer — and nothing else. "Show everything" (or the switch) brings the
  rest back. It's remembered on this device only (`myday.focus`).
- **Confirmations** ("Start today over?", "Replace your saved data?") are asked in the page with a dialog, never the
  browser's pop-up.
- **Motion** stays small (a tick, a soft burst when the whole plan is done, a gentle fade between screens) and switches
  off with the Animations button or when the device asks for reduced motion.

The direction came from the ui-ux-pro-max design skill (minimal style, Plus Jakarta Sans, subtle motion; the warm
palette from its planner palettes: orange actions with readable text, cream background, white cards), and the
timeline layout is adapted from the "Process Timeline" component on [21st.dev](https://21st.dev).

## Cloud sync

Optional, and off unless the app is built with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (set-up:
[`../supabase/README.md`](../supabase/README.md)). Without them, nothing about sync is shown and the Supabase library
is never downloaded.

**What syncs** — everything you enter, so your data follows your account on every device (`src/sync/records.ts`):
- *First part (1.1.0):* the three task lists (one record each, in order), the queue (one record), each day's plan (one
  record per date) and each day's context, energy and sleep (one per date). These go together because building a
  day's plan picks tasks from the lists and moves tasks to and from the queue in the same step.
- *Everything else (1.8.0):* **one record each** for the planning settings (task times and breathing room), the rota
  (patterns, one-date changes, overtime and absence, colours), pay rates, the bank-holiday region, Finance, the Study
  roadmap (topics, stages, courses, tasks, focus, settings, concepts), Workout set-up (exercises, templates,
  schedule, planned dates), Food (preferences, favourites, want-to-cook, cooked, cooking), the shopping list, Goal,
  note collections, your Tasks lists and What MyDay has noticed; and **one record per item** for appointments and
  work commitments, notes, tasks, study sessions, revision answers, workouts, saved recipes and (from 1.12.0) projects — so something added
  on each device is simply kept on both, and only the same item changed on both is a conflict.
- Links between records are kept however they arrive: a favourite or want-to-cook keeps its recipe, a check-in its
  concepts, and the session or workout in progress is the one that says so. Taking the account's Tasks lists or note
  collections keeps your filing (an item moves to the account's list of the same name).
- **Stays on each device:** the theme and animations, a running focus timer or rest countdown, the bank holidays
  downloaded from gov.uk (re-downloaded as needed), and MyDay's own notes (nudges, celebrations, save signatures).
- The first time a device that already syncs gets 1.8.0, its other parts are new to the account: a device's version
  is sent if the account doesn't have one yet; if another device's is already there and differs, it's a conflict for
  you to decide (identical ones simply match). More than 30 at once goes through the review first.

**Your MyDay follows your account** (from 1.9.0; `src/sync/gate.ts`, `src/sync/SignInGate.tsx`, and the top of
`src/sync/engine.ts`) — not a device. When sync is set up (the published app):
- **Sign in first.** A device that isn't signed in shows a sign-in screen instead of MyDay, so what you see is always
  your own account's MyDay and another account never sees it. A device stays signed in, and a signed-in device opens
  straight away (offline too). If your account can't be reached (offline, or no answer when you sign in), "Use MyDay
  on this device for now" opens it with what's on the device until it's next opened, so you're never locked out.
- **Signing in combines the device with your account by itself** — no review, no set-up step: what's only in your
  account comes to the device, what's only on the device goes to your account, and where the same part differs,
  **your account's version is used** and the device's is kept aside (downloadable from Your account; a new MyDay's
  starter versions aren't kept). Nothing is lost. Then MyDay opens.
- **Every change is saved to your account automatically** as it's made — including restoring a backup (the
  question says it replaces your MyDay in your account too) or changing a lot at once.
- **Signing out** first makes sure everything is saved to your account, then **removes MyDay's data from the
  device**; signing in again (as you, anywhere) brings it all back. If something isn't saved yet (offline, a choice to
  make), it says so and offers "Download a backup and sign out" or "Stay signed in".
- A device that still has another account's MyDay (signed out before 1.9.0, when signing out kept it) is never mixed
  with a different account: signing in as someone else explains it and sends nothing.
- Without sync set up (test copies, `npm run dev` without the settings) there's no sign-in screen. The classic MyDay
  (`/classic/`) has no sign-in and uses the device's data as before.

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
- The status at the top of every screen: **Saved to your account**, **Saving…**, **Saved on this device** (offline,
  or still waiting to go) or **Needs attention**. Tap it for **Your account** (`#sync`): who's signed in, "Update now",
  anything to choose, copies kept aside, and signing out.
- Another account signed in on a device that has someone's MyDay sends and fetches nothing, and the database refuses requests
  naming a different account from the one signed in. Each account can read only its own rows (Row Level Security),
  and nobody can write to the tables directly.

**Limitations:** a one-record part (a list, the queue, the rota, Finance, the Study roadmap, the shopping list…)
changed on two devices before they sync is a conflict, even if different things in it changed. No live updates: the other device's changes arrive when you come back to MyDay, every 5 minutes while
it's open, or with "Sync now". Changes made in the classic MyDay are sent the next time the new app is open.
Checked against a local stand-in for Supabase (the real migrations in PostgreSQL, `tests/run.sh sync-db app-sync`), and
against the real project with two disposable test accounts (`tests/sync-live-check.js`: 21/21; the app on two browser
profiles: 16/16, 3 Oct 2026). Not yet checked in Safari or on a real phone before release 1.1.0. Everything else (1.8.0):
the second migration was applied to the project on 4 Oct 2026 in one transaction (existing sync data unchanged,
checked by fingerprints), and the live check with two disposable accounts passed 27/27, including the new table's
Row Level Security; the app's handling of every record is checked against the stand-in (`sync-records`, `app-sync`).

## Installable as an app (Android, and the Mac if you like)

From 1.10.0 MyDay can be installed like an app. On **Android**: open the website in Chrome → menu → **Install app**
(or "Install MyDay as an app" at the bottom of any screen): Chrome builds an app for it (a WebAPK), with its own icon
in the app drawer, opening full screen. On a **Mac**: use the website as usual, or Chrome → Install, or Safari → File
→ Add to Dock. It's always the latest release — there's nothing to reinstall.
- `public/manifest.webmanifest`: the name, start page (Today), full-screen display, colours and icons
  (`public/icons/`, made from `public/icon.svg` and `public/icon-maskable.svg` by `scripts/make-icons.mjs` with
  headless Chrome; the maskable icon fills the square so Android can crop it to its own shape).
- `sw/sw.js`, a service worker written by hand (no library), built with each release by the `serviceWorker` plugin
  in `vite.config.ts`, which fills in the release and the list of its files. It caches the whole release, so MyDay
  opens offline; opening MyDay online always gets the latest page; a new release replaces the old cache. It never
  touches your account, AI help, recipes, bank holidays or other sites, nor your MyDay data. Only in the built app
  (not `npm run dev`).
- `src/shell/install.ts`: the footer's "Install MyDay as an app", shown only when the browser offers to install.
- The status bar follows the theme (the page's `theme-color`).
- **An APK file** too (`../android/`, see its README): a Trusted Web Activity made with Bubblewrap that opens the
  website full screen (verified by `https://omar12ahmed.github.io/.well-known/assetlinks.json`), so it always runs
  the latest release; it's only rebuilt if the app's own settings change. Its signing key is outside the repository.

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

**Study's home page** (`#study`, from 1.7.0) is organised by topic, so it stays tidy as subjects are added (e.g.
Cybersecurity, Arabic):
- First what's in progress and the **current focus** (with its topic: "Current focus · Arabic"), ready to start, with
  its completion; then **Your topics** as cards — each with its next step ("Next: Lesson 2 · Madinah Arabic book 1"),
  progress ("1 of 4 tasks · 2 courses") and when you last studied it ("Studied 3 days ago") — and **+ Add a topic**,
  which opens the new topic's page. Revision, the whole roadmap, Concepts, Progress & history and Settings stay
  beside them (below on phones). The mixed "Other courses" list moved into each topic's page.
- **A topic's page** (`#study/topic/<id>`; `main` for a roadmap without topics): its progress, **Up next in <topic>**
  ready to start (or "Make this my focus"), its courses by stage with "Focus on this", and a link to the roadmap opened
  on that topic (`#study/roadmap/<id>`), where its outline is edited. A course's page goes back to its topic.
- Worked out from the roadmap and your sessions (`topicGlance` in `src/data/study/topics.ts`); nothing new is saved,
  so both versions are unaffected. Code: `src/study/Dashboard.tsx`, `src/study/TopicView.tsx`,
  `src/study/StartBlock.tsx` (choosing a length and starting, shared by both).

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

## Projects, Notes, Tasks and Capture

From 1.12.0 MyDay follows one progression — **capture → understand → organise → explore → decide → act → reflect** —
and **Projects** are its spine (milestone 1 of the direction in `CLAUDE.md`). The Inbox became **Projects** (the third
section in the bar), with two tabs, **Projects** and **Notes**; **Tasks** moved to **Today** (`#today/tasks`, and "Your
tasks" on Today). Older `#inbox…` and `#notes…` links are rewritten to where those screens are now.
- **A project** gathers everything about one intention: what it is and why it matters (in your words), where it is on
  the progression (seven steps; tap one to move it there), its **one next step**, its tasks (dates and times read from
  your words), its notes (new ones, or ones you already have), what's **coming up** (its dated tasks and
  appointments; an appointment added here is on the Calendar too) and **how it's going** (done and to-go counts with
  small squares — never a percentage). Projects can be paused, marked done or deleted; deleting one never deletes its
  notes, tasks or appointments — they just aren't linked any more. Start one from the Projects page, or from an idea
  in Capture ("Start a project from this", the first choice for an idea: the first line is its name, the rest what
  it's about).
- **The next step reaches Today:** "From your projects" on Today lists each active project's next step (not already on
  today's plan or due today) with **Add to plan** — one tap, only while there's room for your energy, the same rule as
  Due today. Nothing is added by itself. A project's own page has "Add to today" too.
- A task or a note can be put in a project (or taken out) from its own screen ("Project"); its way back then leads to
  the project. In Tasks, a task in a project shows the project's name.
- Saved as the `projects` section (`{ items }`; each with `title`, `summary`, `stage`, `status`, `nextTaskId`,
  `commitmentIds`, `createdAt`, `updatedAt`). Notes and tasks gain an optional `projectId` (left out when there isn't
  one, so nothing else changes; from 1.13.0 a note can also have `linkedBy` 'rules' | 'ai', `linkWhy`, `notProjects` and
  `private`, each left out when not set); appointments are listed on the project (`commitmentIds`) so the Calendar's own records,
  shared with the classic MyDay, never change. Added in 1.12.0; the classic MyDay keeps all of it unread. Synced with
  your account (one record per project; database migration `20261006120000_sync_projects.sql`) and in "Export my data".
- **Understanding and connecting, on the device (1.13.0):** MyDay puts a note into the project it clearly belongs to
  by itself — only a link: nothing you wrote changes, and nothing is added to your days or Calendar. It compares the
  meaningful words notes and projects share (`src/data/understand.ts`: common and everyday words like "work", "call"
  or "Friday" don't count; rarer words count more), and links only when it's clear: at least two meaningful words in
  common, a strong enough match, and half as strong again as the next project. Weaker matches are only offered
  ("Might belong in…" on the note, "Might belong here" on the project). It looks a moment after anything changes —
  never at the note you have open (that one says where it looks like it belongs) — and straight away for a note
  saved from Capture, whose message says where it went. Each link is listed under **MyDay connected these** on
  Notes, with why ("both mention “coffee” and “offices”"), **Keep** (the link becomes yours) and **Undo** (out of
  that project, and MyDay never puts it back in that one); the note and the project page say "connected by MyDay"
  too. Choosing a note's project yourself always wins. A note in a project has been put somewhere, so it leaves the
  Notes Inbox. A note also shows its **related notes** (sharing two meaningful words, or one strong one), and can be
  marked **private**: AI help will never read it (it still syncs with your own account, like every note). Honest
  limit: matching words isn't understanding meaning — a link can be wrong, which is what Undo is for; AI help (part
  2, once you switch it on) will place the notes word-matching can't.
- **Next** (in order): AI help that understands and connects notes (part 2, once switched on; private notes never
  sent), the project workspace for exploring and deciding with AI, the knowledge graph, Study by subject, and a
  weekly review.
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
  Tasks are synced with your account (from 1.8.0) and are in "Export my data".
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
  `blockers`, `letGoOn`). The classic MyDay keeps them unread. In "Export my data", and synced with your account.
  From 1.11.0 `prefs` may also hold `name` (what Today's greeting calls you: trimmed, at most 40 characters, left out
  when empty) — an addition only, set from the greeting or under Your preferences.
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
14. **Release 1.7.0:** Study's home page organised by topic — your topics as cards with their next step, progress
    and when you last studied them, and a page for each topic (up next, its courses, its roadmap).
15. **Release 1.8.0:** everything you enter syncs with your account — Calendar, Finance, Inbox, Study, Health, Goal,
    What MyDay has noticed and planning settings, besides Today — items one by one, other parts as one record each
    (a second database migration, `sync_records`).
16. **Release 1.9.0:** your MyDay follows your account — sign in first (a sign-in screen on a device that isn't
    signed in), signing in combines the device with your account by itself (your account wins where they differ; the
    device's version kept aside), every change saved to your account automatically, and signing out clears the
    device once everything is saved. Wording: "Saved to your account", "Your account", "Update now".
17. **Release 1.10.0:** installable as an app — a manifest, icons and a hand-written service worker (offline, always
    the latest release); "Install MyDay as an app" in the footer when the browser offers it.
18. **Release 1.11.0:** a new, warm look across the app — peach page, white cards, orange actions, green for done,
    light by default, an orange side menu on wide screens, a floating bar on phones and an orange app icon, with
    softer depth and quieter tools so it feels calm and expensive — and Today as a dashboard: a greeting with your
    name, a drawn scene and a calendar, quick add, a focus timer card, a "2 of 3 done" ring and this week's bars, and
    Focus mode (just what's next).
19. **Release 1.12.0:** Projects — the spine of MyDay's progression (capture → understand → organise → explore →
    decide → act → reflect). The Inbox became Projects (Projects and Notes); Tasks moved to Today. A project gathers
    its notes, tasks, appointments and progress, and its one next step reaches Today ("From your projects"). Capture
    can start a project from an idea. Synced (database migration `20261006120000_sync_projects.sql`, applied first).
20. **Release 1.13.0:** Understand & connect, part 1 (on the device, no AI) — MyDay puts notes that clearly belong to
    a project into it by itself, with why, Keep and Undo ("MyDay connected these"); related notes; "Might belong
    here"; private notes; notes in a project leave the Inbox. No database change (the link details are on each note).
