# Why this next step

**Status:** approved by the owner on 24 October 2026 ("start"; "Why this?" like Study, on the project Overview only,
"Let MyDay pick" in the picker). Phase 1, release 5 of `specs/projects-vision.md`. Not yet released.
**Based on:** source at release 1.52.0.

## 1. The practical problem

Every project has one next step, chosen by one rule (`nextStep` in `app/src/data/projects.ts`) and used by the board,
the Overview, At a glance and Today. The Overview's Next step card shows the step and lets you choose another, but it
never says why this one is shown. Once you choose a step yourself, nothing lets you hand the choice back to MyDay.

## 2. What changes

- **"Why this?"** on the Next step card, folded like Study's, under the step's buttons. One tap shows a sentence or two:
  - **You chose it:** "You chose this step." Then "It's also what MyDay would pick.", "Left to MyDay, it would be
    “Order the timber”." or, when everything is waiting, "Left to MyDay, there'd be no next step: everything here is
    waiting."
  - **MyDay's pick, with a date:** "MyDay's pick: it has the earliest date (Fri 30 Oct)." When waiting tasks were
    passed over, it adds "of the tasks that aren't waiting".
  - **MyDay's pick, no dates:** "MyDay's pick: none of the tasks still to do has a date, so it's the one you added
    first." When waiting tasks were passed over, it says "none of the tasks that aren't waiting".
  - **The only one:** "MyDay's pick: it's the only task still to do." When others are waiting, it adds "that isn't
    waiting".
  - **Passed over:** with one waiting task that comes first: "“Ask Sam about bolts” comes first, but it's waiting on
    Sam." With several: "2 tasks that come first are waiting on someone or something."
  - **The step you chose was done or let go in the last week:** it starts with "The step you chose, “Order the
    timber”, is done." or "You let go of the step you chose, “Order the timber”." Then MyDay's pick follows as above.
    After a week, or for a chosen task that was deleted, only MyDay's pick is given. Nothing is added to Today and
    nothing starts by itself.
- **"Let MyDay pick"** is the first option of "Or choose another next step". It's selected while MyDay is picking.
  Choosing it hands the choice back, and a message says what MyDay picks (for screen readers too). Choosing a task,
  even the one MyDay picked, makes it your choice. The picker also shows for a chosen waiting step that's the only
  task left, so the choice can be handed back.
- **One order with Tasks:** a project's tasks now follow the Tasks screen's order: by date, then time (a task with no
  time after timed ones on the same day), then when it was added; undated ones last. Before, a task with no time came
  first on its day, so the next step could disagree with Coming up beside it. This only changes the next step when
  two tasks share a date and one has a time.
- The board, At a glance and Today don't change: they show the same step and link to the project.

## 3. Saved data, sync and AI

No saved-data, sync, schema or database change: the choice is the existing `nextTaskId`, and "Let MyDay pick" sets it to
`null`, which every release since projects began understands. Nothing is sent to AI. Who a task is waiting on is
shown on screen only, as it already is on the card, and never sent to AI; "Why this?" itself isn't saved or synced.

## 4. Decisions

1. "Why this?" folded, as in Study (owner's choice), rather than a line always shown.
2. On the project Overview only (owner's choice); Today and the board stay as they are.
3. "Let MyDay pick" as the picker's first option (owner's choice), rather than a separate button.
4. A chosen step that's done, let go or gone keeps its `nextTaskId`, as before (no clean-up write). The picker shows
   "Let MyDay pick" because MyDay is picking; undoing "done" makes it the next step again. "Why this?" mentions it
   only for a week (changed after review: it would otherwise say "is done" for months).
5. Projects use the Tasks order (found in review: on a shared date the old order contradicted Coming up).

## 5. Checks

- **Rules:** each reason above, including the passed-over waiting tasks (one, several), the chosen step done or let
  go (within a week, and after), and a deleted one; "Left to MyDay" names the task `nextStep` would give with no
  choice; the Tasks order on a shared date; nothing is written.
- **Browser:** "Why this?" is folded and opens to the reason; "Let MyDay pick" is selected when MyDay picks; choosing a
  task makes it your choice and the reason says so; "Let MyDay pick" hands it back with a message; marking the chosen
  step done explains the new pick; a chosen waiting step that's the only task can be handed back; phone at 320 px.
- **Visual (Taste skill):** the card with "Why this?" open, desktop and phone, light and dark.
