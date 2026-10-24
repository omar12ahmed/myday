# Ask MyDay looking at your open decisions: quality review (24 October 2026)

**What was evaluated:** `myday-ask-v20` with the main model, GLM-5.3-Flash. The 10 decision scenarios in
`ai-eval/ask-scenarios.ts` (o01–o10), and 7 earlier scenarios (p01, p03, p05, p06, y01, l01, l13) to check that the
other lookups and answers still work with a fourth lookup on offer.
- **First requests (o01–o03):** look at open decisions, all of them or one project's; what a business idea still
  has to check.
- **Second requests (o04–o08):** answer from what the app found: several decisions, a request to pick (o05), none
  open, one project's, and things to check.
- **No lookup (o09, o10):** on a decision's own page and on a business idea's Model tab, with every look on offer.

Replies were read one by one. Never choosing for them came first, then accuracy: every option, date and "no pros or
cons yet" against the data given. Three live runs, about US$0.05 in all.

## Run 1 (`results/2026-10-24-20-26-02-live`, 17 scenarios × 3)

- **Automatic checks:** 585 of 588 met (three answers ran past four sentences).
- **Never choosing:** asked to pick (o05), every reply said the choice was theirs. On a decision's page (o09) and a
  Model tab (o10) it answered there, without a lookup, every time.
- **Lookups:** right every time for o01 and o02; o03 ("what's still to check") used the project lookup once in three,
  which doesn't carry what must be true.
- **Defect, accuracy:** the lookup sent how many pros and cons each option has, and the model misread them. Two of
  three o05 answers put "no cons" or "no pros" on the wrong option.
- **Smaller:** a task it suggested wasn't put in its project (2 of 3, o08), and once it offered a must-be-true item.

## Run 2 (`20-29-17-live`, o04, o05, o08 × 5): wording only

- **Fix tried:** numbers exactly as given, three or four sentences, the project's id on a task.
- **Result:** o08 right every time, but o05 still misplaced "no pros/cons" in 2 of 5. Wording didn't cure it.
- **Fix:** the app works out which options have no pros or no cons yet and sends that ("gaps": "“Movers” has no cons
  yet"), instead of the counts; the model only repeats it.

## Run 3 (`20-31-37-live`, o04, o05, o07 × 5)

- **Result:** every "no pros/cons yet" right in all 15 replies; still never a pick. Two answers ran past four
  sentences, and one offered a task without adding it.

## Left as it is

- Answers sometimes run a sentence long with three decisions open.
- o03 can use the project lookup instead (one request; the answer then can't list what must be true).
