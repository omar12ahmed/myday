# Ask MyDay looking at what to study next: quality review (25 October 2026)

**What was evaluated:** `myday-ask-v22` with the main model, GLM-5.3-Flash. The 7 study scenarios in
`ai-eval/ask-scenarios.ts` (n01–n07) and 5 earlier first requests (y01, w01, o01, p01, l01).
- **First requests (n01–n03):** look at what to study next, from Today and from Projects; a notes question still goes
  to notes.
- **Second requests (n04–n07):** answer from the Today card's options: the focus with its reason, revision first, a
  choice between subjects, and nothing set up yet.

Replies were read one by one: accuracy first (every lesson, reason and number of minutes against the data), never a
percentage, no invented lesson. Three live runs, about US$0.03 in all.

## Run 1 (`results/2026-10-25-10-33-43-live`, 12 scenarios × 3)

- **Automatic checks:** 373 of 380.
- **Lookups:** right every time (n01, n02 study; n03 notes; the earlier ones each to their own).
- **Answers:** the focus, its reason and its minutes, accurate; revision first said where it applied; never a
  percentage. A choice between subjects was answered gently with both.
- **Defects:** four replies added a "start-study" action with made-up ids (the app would drop them, but they shouldn't
  be offered — the link opens the lesson); once "sources" held a subject's label instead of its key; once "75 minutes
  left" (the plan's minutes still to do) was read as free time.
- **Fixes:** no "start-study" after this look (the link opens the lesson); revision first may offer the revision
  round; "sources" are the subject keys exactly.

## Runs 2–3 (`10-36-08-live`, n04–n07 × 3; `10-37-22-live`, n05 and n07 × 3)

- **Run 2:** 135 of 141. No start-study; n05 offered the Arabic revision round every time (the miss was the harness,
  which didn't read the lookup's revision count — fixed). n07, with nothing set up, said the options "didn't come
  back" and cited subjects that weren't there.
- **Fix:** with no options, say plainly nothing is set up yet and that they can choose a focus in Study.
- **Run 3:** 69 of 69. n05 revision first with its round every time; n07 "Nothing is set up to study yet — you can
  choose a focus in Study".

## Left as it is

- n04 sometimes mentions the second subject unasked, briefly and accurately.
