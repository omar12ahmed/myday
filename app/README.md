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
| `src/components/` | Shared pieces with their styling in one place: `Button`, `Card`, `CategoryChip`, `TaskCard`. |
| `src/screens/` | Whole screens built from those pieces: `TodayScreen`. |
| `src/styles/tokens.css` | Colours for dark and light themes (copied from the current MyDay). |
| `src/index.css` | Gives the colours Tailwind names, e.g. `bg-surface`, `text-fg-2`, `bg-learning-c`. |

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
