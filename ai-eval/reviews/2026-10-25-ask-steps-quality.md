# Steps in Ask MyDay: quality review (25 October 2026)

**What was evaluated:** `myday-ask-v23` with the main model, GLM-5.3-Flash. The 6 step scenarios in
`ai-eval/ask-scenarios.ts` (t01–t06) and 4 earlier ones (k02, s01, p05, n04).
- **A task's breakdown (t01–t03):** with its checklist (empty, then with steps, one done) it fills the checklist; a
  request without one (the published app) still gets separate tasks.
- **A project's tasks (t04–t06):** the next step inside a task, a task that starts after another, and the project
  lookup with steps.

Replies were read one by one: the right kind of item first (a step for a checklist; never a step for an app that
can't take one), then nothing repeated or done twice, then the order of a project's work. Three live runs, about
US$0.03 in all.

## Run 1 (`results/2026-10-25-11-40-24-live`, 10 scenarios × 3)

- **Automatic checks:** 325 of 327.
- **Projects:** right every time. The next step inside a task was its first not done ("Book the van"), a task that
  starts after another came second ("Choose the moving date comes first — Book the van only starts after that"), and
  "starts after" was never called waiting. The looked-at project named the next step inside its task.
- **A task's breakdown with its checklist (t01):** steps only, every time.
- **Defect, compatibility (t03):** with no checklist sent, as the published app sends, 2 of 3 replies still gave
  "step" items, which that app would drop. The new "step" in the reply's format line tempted it.
- **Defect, t02:** with a done step "Draft the personal statement", replies suggested drafting parts of it again.
- **Fixes:** "step" appears in the instructions only when the request carries a checklist; the server turns a stray
  "step" into a task for a request without one (`askOutput`), so an older app never meets one; a done step is
  finished, so never suggest it or any part of it again — carry on from where the checklist is.

## Runs 2–3 (`11-43-53-live`, t02 and t03 × 5; `11-44-48-live`, t01 × 3)

- **Result:** 125 of 125 and 39 of 39. t03 gave tasks every time; t02 never re-suggested the done step, and carried on
  ("Review and polish the personal statement draft"); t01 still steps only.

## Left as it is

- t02: the open step "Ask two referees" was often broken into parts ("Email referee 1", "Email referee 2") — a fair
  reading of "break this into smaller steps"; they come as suggestions to untick.
