# Waiting on someone or something

**Status:** approved by the owner on 24 October 2026 (decisions in section 4). Phase 1, release 3 of
`specs/projects-vision.md`. Not yet released (planned as 1.50.0, after 1.49.0).
**Based on:** source at release 1.48.0.

## 1. The practical problem

Some tasks can't move until someone replies, a quote arrives or a part is delivered. Today such a task looks like any
other: MyDay may pick it as a project's next step, offer it for Today, and nothing records who it depends on or when
an answer is expected. "What's getting in the way?" has "I'm missing something I need", but it is about what you
lack, not whom you're waiting for.

## 2. What changes

- **A task can be waiting:** on whom or what (up to 120 characters), since when, and an optional "expected by" date.
  Set it in the task's page ("Waiting on someone or something?") or with a new choice in "What's getting in the way?":
  "I'm waiting on someone or something". It is not recorded as a blocker reason (older releases drop reasons they
  don't know).
- **Shown calmly:** the task row reads "Waiting on Priya · expected Wed 28 Oct" (Tasks, a project's Tasks card). The
  task's page shows "Waiting on Priya since Tue 20 Oct · expected Wed 28 Oct" with **Got it** (no longer waiting),
  **Change**, and **Chase it**.
- **Next step:** when MyDay picks a project's next step itself, it skips waiting tasks, and Today's "From your
  projects" doesn't offer them. A waiting task you chose yourself stays chosen; the Next step card says what it's
  waiting on and suggests choosing another while you wait. If everything is waiting, the card says so and asks for
  another small step. "What's getting in the way?" no longer appears for a waiting task.
- **When the expected date arrives:** on an active project, Worth a look says "Still waiting on Priya (Ask about the
  armchair) — expected Wed 28 Oct", linking to the task, with **Chase it** beside it. Chase it adds one 5-minute task,
  "Chase Priya: Ask about the armchair", in the same list and project (once per wait, until that task is done or let
  go). No red, no "overdue", no count of days. A waiting task isn't also pointed out as "still open". When the
  waiting task is the project's chosen next step, the Next step card says it and offers Chase it itself, so Worth a
  look doesn't repeat it beside the card (as for "still open" in 1.46.0). While a task is waiting, its page shows the
  wait first; a new wait opens below the task's buttons.
- Finishing or letting go of the task ends the wait as far as MyDay is concerned; the record stays with the task.

## 3. Saved data, sync and AI

- **Task field:** optional `waiting: { on, since, until, chaseTaskId? }` on a task; absent when not waiting.
- **No schema change** (the owner's exception in `AGENTS.md`): released 1.48.0 already keeps unknown task fields when it
  reads, edits, saves, exports, imports and syncs tasks. Proved with the previous release's own code
  (`projects-rules`) and a real previous-release device (`app-sync-previous`).
- **Sync:** inside the existing task record; no new kind, migration or database change. The conflict summary shows
  "waiting".
- **AI:** the waiting text is never sent to AI; Ask MyDay and every other AI job are unchanged.

## 4. Owner's decisions (24 October 2026)

1. On a task, set from its page and from "What's getting in the way?".
2. MyDay skips waiting tasks when it picks the next step; your own choice stays, labelled.
3. When the expected date arrives: a calm pointer in Worth a look, plus "Chase it" adding a 5-minute follow-up task.
4. No schema bump; never sent to AI.

## 5. Checks

- **Rules:** reading (kept, limited, blank absent, unreadable counted, unknown keys kept); set, change, stop waiting;
  Chase it once per wait; the next step and Today skip waiting tasks unless chosen; the pointer appears from the
  expected day on an active project only, oldest first, and replaces "still open" for that task.
- **Browser:** setting, changing and ending a wait from the task page and from "What's getting in the way?"; the row,
  Next step card and Worth a look; Chase it adds one task; Got it; export/import; 320 px phone.
- **Previous release:** 1.48.0's own code and a real 1.48.0 device keep `waiting` through reading, editing, saving,
  export/import and sync. **AI:** nothing new in Ask's preview or request.
- **Visual (Taste skill):** the task page, a project's Overview with a waiting next step and a due pointer; phone,
  tablet, desktop; light and dark.
