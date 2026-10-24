# Ask MyDay looking at a project: quality review (24 October 2026)

**What was evaluated:** `myday-ask-v19` with the main model, GLM-5.3-Flash. The 8 project scenarios in
`ai-eval/ask-scenarios.ts` (p01–p08), and 7 earlier first requests (y01, y02, y04, l01, l02, l03, l13) to check
that notes and day questions still go to the right lookup now that a project lookup is offered too.
- **First requests (p01–p04):** look at a project asked about by name from another page; not on that project's own
  page; not for a project that isn't one of theirs.
- **Second requests (p05–p08):** answer from the project the app found: where it's at and the next step, a breakdown
  into steps, a question about its decision (not sent), and a project with no tasks yet.

Replies were read one by one, accuracy first: every task, milestone and date against the data given, then the right
lookup or none, then wording. Four live runs, about US$0.04 in all (a provider outage cut two of them short).

## Run 1 (`results/2026-10-24-18-02-31-live`, 15 scenarios × 3)

- **Automatic checks:** 431 of 432 met; one call failed at the provider (a timeout).
- **Lookups:** p01 and p02 looked up the right project every time; on the project's own page (p03) and for a project
  that isn't theirs (p04) it didn't look, and p04 said plainly it couldn't see one by that name. The notes and day
  questions went to the right lookup every time.
- **Answers:** accurate to the data — the done task, the reached milestone, the date aimed for, and "75 minutes left
  today" from the page. Steps (p06) all went into the project. Asked about its decision (p07), every reply said to ask
  on the project's page. l13 looked in notes 1 of 3 times when the page already answered (as before; one request).
- **Defect, 2 of 3 in p05:** it offered to add "Ring the letting agent", which is already one of the project's tasks
  (the app would have shown it unticked as already there).
- **Fix:** "Its tasks already exist: never offer to add one again."

## Runs 2–4 (`18-22-55` and `18-24-06`, cut short by the provider; `18-25-33`, p05, p06, p08 and y04 × 4)

- **Runs 2 and 3:** the provider failed calls in a row (timeouts and network errors) and the runs stopped themselves;
  the one p05 answer that came back still offered the existing task. The general rule "if you suggest adding
  something, put it in items" pulls the other way.
- **Fix:** "Its tasks already exist: to suggest one, name it — never put it in "items"."
- **Run 4:** 180 of 180, y04 looking in notes every time (the earlier failures were the provider's). No existing task
  offered again; every step in the project; the empty project got a sensible first task. One slip, 1 of 4: "would
  keep things moving towards viewings" when the viewings were already booked.

## Left as it is

- l13: an extra look in notes now and then when the page already has the answer (one request, no harm).
