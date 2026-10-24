# Ask MyDay looking at a day: quality review (24 October 2026)

**What was evaluated:** `myday-ask-v18` with the main model, GLM-5.3-Flash. The 7 day scenarios in
`ai-eval/ask-scenarios.ts` (y01–y07) and the 13 notes scenarios (l01–l13) again, under the new instructions.
- **First requests (y01–y04):** look at a day only when the question needs one that isn't on the page; a notes
  question still looks in notes with both lookups on offer.
- **Second requests (y05–y07):** answer from the day the app found (a busy Thursday with a shift, an appointment with no
  name and its prep; an empty day; a rest day with low energy).
- **y03:** "how busy am I today?" on Today, answered from the page (not a lookup).

Replies were read one by one, accuracy first: every time and minute against the data given, then the right lookup or
none, then wording (calm, no claims about what MyDay can do that it can't). Four live runs, about US$0.09 in all.

## Run 1 (`results/2026-10-24-15-29-08-live`, 20 scenarios × 3)

- **Automatic checks:** 627 of 629 met.
- **Lookups:** the right date every time ("Thursday" → 2026-10-22, "tomorrow" → 2026-10-21); none when today's plan
  was on the page; notes still searched for a notes question.
- **Accuracy defects:**
  - y05: 1 of 3 said "a 12–4 work shift" (it was 07:00–12:00); another suggested "the morning free stretch" (there
    wasn't one).
  - y03: 2 of 3 said about 135 minutes were left, counting the gym session already done (75 were left).
  - y06: 1 of 3 offered Help me adjust today for tomorrow (it plans today only), and several said MyDay could build a
    plan for tomorrow (it can't).
- **Notes:** the quality review's wording points held. When nothing matched, the replies suggested other words
  rather than guessing why. l13 looked in notes 2 of 3 times when the project's notes on the page already answered it
  (one extra request, no harm).
- **Fixes:**
  - Times and minutes exactly as in the data, and a done task is never still to do.
  - The app works out how much is left (`minutesLeft`, on Today's page data and on a looked-at day) instead of
    leaving the sum to the model. It's counted from the tasks sent only, so a private project's tasks never count.
  - After a day lookup, the model is told MyDay builds a plan only for today. The app drops "adjust-today" after a
    look at another day.

## Runs 2–4 (`15-37-42`, 20 × 3; `15-40-29` and `15-42-03`, focused, 3 × 5)

- **Run 2, everything again:** 630 of 630. y03 said 75 minutes left every time; y05's times were all right. l13
  answered from the page every time.
- **Run 3:** a new line ("offer to add tasks to it") made y06 offer vaguely to add something, with nothing to tick (3
  of 5). y07 offered to add "Pay council tax", which is already a task due that day (the app marks a same-titled task
  as already on your lists, so nothing would be duplicated).
- **Fix:** never offer to plan or build another day; tasks in "due" already exist, never offer them again.
- **Run 4 (y05–y07 × 5):** 160 of 160. Every time right. The empty day and the rest day were described accurately and
  gently, with no false offers and no button for another day.

## Left as it is

- A message cut short by straight double quotes still happens now and then (1 of about 100 here). The app cuts it
  back to its last whole sentence, or refuses it if nothing whole is left.
- l07, 1 of 3: "it looks like you haven't written about it there" — a mild, hedged guess.
