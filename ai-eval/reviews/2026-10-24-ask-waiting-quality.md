# Ask MyDay looking at what you're waiting on: quality review (24 October 2026)

**What was evaluated:** `myday-ask-v21` with the main model, GLM-5.3-Flash. The 8 waiting scenarios in
`ai-eval/ask-scenarios.ts` (w01–w08) and 5 earlier ones (o01, o05, p01, y01, l01) to check the other lookups still
win their own questions.
- **First requests (w01–w03):** look at what's waiting, all or one project's; a decisions question still goes to the
  decisions lookup.
- **Second requests (w04–w08):** answer from what the app found: three waits with one past its expected day, one
  already chased, nothing waiting, "who am I waiting on?" (never sent) and one project's.

Replies were read one by one. First the rules from 1.50.0 and the privacy filter: never naming who, dates as dates
(never a count of days or "overdue"). Then accuracy: every task, date and project against the data given. Two live
runs, about US$0.03 in all.

## Run 1 (`results/2026-10-24-22-00-46-live`, 13 scenarios × 3)

- **Automatic checks:** 400 of 414. The misses were the harness's (it didn't know waiting tasks could be cited; one
  ban matched the words "Chase: task" in a message rather than an offered item), not the replies.
- **Lookups:** right every time, including a decisions question going to decisions.
- **Tone and accuracy:** every date and project right; never a count of days or "overdue". The van's chase was
  offered only where its expected day had passed, and none for the wait already chased.
- **Defect, w07:** asked who, two of three said MyDay "doesn't store" who — wrong: it's kept on the task, never sent.
- **Rule too strict:** asked "anything I should chase?", it offered a chase for a wait with no expected day — what
  they asked for, but against "only when the expected day has come".
- **Fix:** "If they ask who or what one waits on: that's kept on the task and never shared with Ask MyDay — say so, and
  never guess"; a chase also when they asked to chase; never for one already chased.

## Run 2 (`22-05-05-live`, w04, w05, w07, w08 × 3)

- **Result:** 138 of 138. w07 said "kept on the task itself and never shared with Ask MyDay" every time; w04 chased only
  the van; w05 offered nothing new; w08 offered a chase when asked.

## From the independent review, done in the app

- The tone filter is tied to the wait ("is running late", "overdue", "thirteen days", "a fortnight"), so "the late
  post" or "behind the sofa" stay.
- A "Chase:" task Ask offers for a looked-at wait is added the way Chase it adds one (5 minutes, its list and project,
  linked to the wait), and one already chased comes back unticked.
