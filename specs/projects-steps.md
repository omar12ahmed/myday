# Projects: steps inside a task, and "waits for" (Phase 3)

**Status:** the owner chose this as Phase 3's next part and made the decisions in §2 (25 October 2026). Planned on
branch `research`'s successor; built after Research (1.76.0) is out. Nothing live without the owner's yes.
**Based on:** source at 1.75.0. Plan: `specs/projects-vision.md` §7 (tasks and next actions) and §17 (Phase 3:
"structured dependencies and subtasks"); `specs/projects-next-why.md` (how the next step is chosen and explained).

## 1. The practical problem

A task like "Build the shed base" is really five small things, and some tasks can't start until another is done
("Order the boards" before "Build the frame"). Today a task is one line, and MyDay can suggest as the next step a
task you can't do yet.

## 2. The owner's decisions (25 October 2026)

1. **Steps inside a task:** a short checklist on the task ("Measure the wall", "Order the boards"), shown as "2 of 5
   steps". The task stays the one thing you plan; steps aren't scheduled on their own.
2. **When every step is ticked, MyDay offers to mark the task done** ("All 5 steps done — mark the task done?"), one
   tap; nothing happens by itself.
3. **"Waits for" between tasks in the same project:** until the tasks it waits for are done (or let go), it isn't
   picked as the project's next step and it says "Waits for: …"; you can still do it any time.
4. **AI: yes, as a follow-up by myday-83** (Ask MyDay's project look-up and "Help me adjust today" may see a task's
   steps and what it waits for, never a private project's), after this release, with its usual check of the answers.
   This release adds them on the device only.

## 3. What you see (proposed)

- **On a task** (the task editor): **Steps**: add, tick, edit, reorder, remove (up to 30). Under the title on lists and
  on Today: "2 of 5 steps". Ticking the last one shows the offer to mark the task done.
- **Waits for:** on a project's task, "Waits for" lets you pick other open tasks of the same project (up to 10; never
  itself, never one that waits for it, directly or further along: no circles). Shown as "Waits for: Order the boards"
  until those are done or let go; then nothing.
- **Next step:** a task that still waits isn't picked; "Why this?" says so ("“Build the frame” waits for “Order the
  boards”, so MyDay picked this one").
- **Words and counts only.**

## 4. How it works (proposed)

- **Saved data (schema stays 5):** optional fields on a task: `steps: { id, text, done }[]` and `after: string[]`
  (ids of the tasks it waits for). The task reader keeps unknown fields, so an older release keeps both; tasks
  already sync as `task` records, so no migration.
- **Rules** in `data/tasks.ts` / `data/projects.ts`: normalizing (bad steps counted, ids unique, `after` only task ids,
  no self); `waitsFor(data, t)` (the open tasks it still waits for); `nextStep` and `whyNext` skip a task that waits;
  removing or letting go a task frees those that waited for it; moving a task to another project drops its `after`
  (and others' pointing at it).
- **Going back:** an older release keeps `steps` and `after` unread; it may pick a waiting task as next step there.

## 5. Checks (proposed)

Rules for steps (add, tick, all-ticked offer, limits, normalizing) and "waits for" (no circles, same project only,
freed when done or let go, next step and "Why this?"); browser checks on the task editor, lists, Today and the
project's next step; sync to a second device; the previous release keeps the fields; ai-rules [Privacy] (until the
AI follow-up, nothing of steps or `after` reaches AI).
