# MyDay — new version (React + Vite + Tailwind + TypeScript)

This is MyDay being rebuilt in React, one stage at a time. The current MyDay (`../index.html`) stays live and
unchanged until this version can do everything it does.

**Right now this is a read-only preview.** It shows today's plan from your saved data, but nothing in it writes
to `localStorage`, so it can't change or damage anything.

## Running it

```bash
cd app
npm install      # first time only
npm run dev      # then open the address it prints (usually http://localhost:5173)
```

Saved data belongs to the web address it was saved at, so `localhost` starts out empty. To see your own plan:
in the current MyDay choose **Export my data**, then use **Open a backup file** here. The file is only shown, never saved.

Other commands: `npm run build` (checks types and builds into `dist/`) and `npm run lint`.

## Where things are

| Folder / file | What it holds |
|---|---|
| `src/data/types.ts` | The shape of the saved data, as TypeScript types. Must match the current MyDay exactly. |
| `src/data/normalize.ts` | Checks saved data and fills in anything missing (a copy of `normalize()` in the current MyDay). |
| `src/data/storage.ts` | Reads saved data and backup files. Read-only for now. |
| `src/data/dates.ts`, `today.ts` | Date helpers and the wording for a day's plan. |
| `src/components/` | Shared pieces with their styling in one place: `Button`, `Card`, `Banner`, `CategoryChip`, `TaskCard`, `TaskTimeline`, `EnergyMeter`. |
| `src/screens/` | Whole screens built from those pieces: `TodayScreen`. |
| `src/styles/tokens.css` | Colours for dark and light themes (copied from the current MyDay). |
| `src/index.css` | Gives the colours Tailwind names, e.g. `bg-surface`, `text-fg-2`, `bg-learning-c`, and sets the font. |

## Design

The current MyDay (`../index.html`) has the same look: the same colours, font and task timeline (its font files are in
`../fonts/`). A visual change belongs in both.

- **Colours** are the current MyDay's calm sage palette, unchanged. Every text colour pair meets WCAG AA contrast in both themes.
- **Font:** Plus Jakarta Sans, a friendly, rounded sans-serif. It's bundled with the app (`@fontsource-variable/plus-jakarta-sans`),
  so it works offline. Times use `tabular-nums` so their digits line up.
- **Icons:** [Lucide](https://lucide.dev) (`lucide-react`), always with a text label beside them, never emoji.
- **A day's plan** is a timeline: tasks with a time are joined by a line in time order, with "any time today" tasks below.
  The round marker beside each task shows a tick once it's done. Each fact appears once: the time on top, then the title,
  then the category and length.
- **Up next:** one task is marked "Up next", so there's always an obvious place to start. It uses the current MyDay's
  rule (`nextTask()` in `today.ts`): the first unfinished timed task whose time isn't over, else the earliest unfinished
  timed task, else any unfinished task. The screen redraws once a minute so this moves on as the day goes.
- **Progress note:** nothing until the first task is done, so an untouched list doesn't feel like a score; then
  "1 done so far", and "That's the whole plan — lovely." once everything is done.
- **Cards** hold content with a heading; **banners** hold a one-line message (a preview note, a backup being shown).
- **Motion** stays small (button presses only) and switches off if the device asks for reduced motion.

The direction came from the ui-ux-pro-max design skill (minimal style, Plus Jakarta Sans, subtle motion), and the
timeline layout is adapted from the "Process Timeline" component on [21st.dev](https://21st.dev).

## Rules for this rebuild

- Both versions use the **same saved data**: key `myday.data.v4`, `schemaVersion` 4. No migration is needed.
- If a saved field is added or changed, change `types.ts`, `normalize.ts` **and** the current MyDay together,
  with a new `schemaVersion` and a migration (see the project's CLAUDE.md).
- Sections that aren't described in `types.ts` yet (rota, pay, health, study) are kept exactly as saved.
- Saving stays off until it has the same protections as the current MyDay (e.g. not overwriting another tab's save).

## Stages

1. **Foundation** (done): project set-up, design tokens, data types, read-only Today plan.
2. **Saving**: port the save protections, then ticking tasks off.
3. **The rest of Today**: energy, Build my day, focus timer, evening check-in.
4. **Calendar & Pay, Health, Study**, one at a time.
5. **Switch over**: publish this version at the main address, keeping the current one as a fallback.
