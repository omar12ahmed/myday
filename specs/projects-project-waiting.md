# A whole project waiting on someone or something

**Status:** the owner's decisions in §2 (31 October 2026); being built on branch `project-waiting`. Nothing live without
the owner's yes. No schema, migration or server change.
**Based on:** source at 1.106.0. Plan: `specs/projects-vision.md` §8 (waiting and blocked information: what is preventing
progress, whom you're waiting for, an expected response date, an action that could unblock it — "a blocked task does
not necessarily block the entire project"). Tasks can already wait (1.50.0, `specs/projects-waiting.md`); this is the
same idea for a whole project.

## 1. The practical problem

Sometimes a whole project can't move: the landlord has to agree, the visa office has the passport, the builder hasn't
sent the quote. Today the project just goes still. After two weeks Your week calls it "quiet", its card says "Away 3
weeks", and nothing records whom it's waiting on or when to check back — so it either nags you about something you
can't do, or slips out of mind entirely.

## 2. The owner's decisions (31 October 2026)

1. **It stays on the board, labelled:** a waiting project keeps its column and card; the card says
   "Waiting on Priya · check back Wed 4 Nov". No separate Waiting group.
2. **When the check-back day comes:** a gentle line in Needs you — "Still waiting on Priya (Garden shed) — check back
   was Wed 4 Nov" — with **Chase it**, which adds one 5-minute follow-up task, as for a waiting task.
3. **Set from its page, plus a nudge:** "Waiting on someone?" on the project's page; and when every open task in a
   project is waiting, MyDay offers once: "Everything here is waiting — mark the project as waiting?"
4. Stated with the decisions, without objection: the task-waiting rules are reused; it's never sent to AI; no schema
   change; a waiting project is never called quiet or nudged as stalled.

## 3. What you see

- **On the project's page:** in the Manage card (with Pause for now and Mark as done), **Waiting on someone?** opens
  a short form: "Who or what is it waiting on?" (up to 120 characters) and "Check back on (optional)" (a day). Saving
  says "Waiting on Priya. MyDay won’t call it quiet while you wait."
- **While it waits:** the Overview starts with **Waiting on someone or something** — "Waiting on Priya since Tue 20 Oct
  · check back Wed 4 Nov", "While it waits, MyDay won’t call it quiet or nudge you about it. Its tasks work as usual."
  — with **Got it** (no longer waiting), **Change**, and **Chase it**.
- **The nudge:** when the project has open tasks and every one is waiting (and the project isn't), the Next step card
  adds "Everything here is waiting — mark the project as waiting?" with **Mark as waiting** (the form, filled in with
  whom the tasks wait on if it's the same for all, and the earliest expected day) and **Not now**. It's offered once on
  this device for that set of waiting tasks (`myday.projects.waitOffer`); a task starting or stopping waiting can
  bring it back.
- **Projects home:** the card and the List row say "Waiting on Priya · check back Wed 4 Nov" (or "Waiting on Priya"),
  in place of "Away 3 weeks".
- **Needs you:** from the check-back day, on an active project: "Still waiting on Priya" · "check back today" /
  "check back was Wed 4 Nov", in the Waiting group, opening the project, with Chase it beside it (or "A task to chase it
  is in this project’s tasks." once added). No red, no count of days.
- **Your week** doesn't call a waiting project quiet. Welcome back still greets you after a break (it's about you
  coming back, not a nudge).
- **Chase it** asks when (Today, Tomorrow, a day you pick, No date) and adds "Chase: Garden shed" (5 min) to the
  project's tasks — once per wait, until that task is done or let go. The title doesn't name whom you're waiting on.
- **Finishing** the project ends its wait; **Pause for now** keeps it (a paused project isn't in Needs you anyway).
- Search finds a project by whom it's waiting on, as it does a task.

## 4. How it works

- **Saved data (schema stays 5):** an optional `waiting: { on, since, until, chaseTaskId? }` on the project — the
  same shape as a task's — synced in the project's own record and kept by 1.106.0 (its project reader spreads unknown
  fields: the AGENTS.md exception). Read as written: kept when `on` is text that isn't blank and `since` is a day; an
  `until` that isn't a day is counted and left off; one from a newer MyDay keeps its extra keys. Waiting isn't work on
  the project: its "updated" time and its place in Projects stay.
- **Rules** in `data/projectWaiting.ts`: set, change, stop, the chase task, whether the check-back day has come, and
  the nudge's suggestion. A project is waiting while it isn't finished.
- **Not quiet:** Your week's "has been quiet for N weeks" and the card's "Away" label skip a waiting project.
- **Tasks are unchanged:** a waiting project's tasks still count for its next step and Today; the project's wait is
  about the project.
- **AI:** none of it is sent (Ask's project slices name their fields; this isn't one). The sync conflict summary names
  it ("Waiting on Priya since … · check back …").

## 5. Checks

Rules (reading as written, blank and unreadable; set, change keeping since, stop; chase once per wait; due from the
check-back day; finishing ends it; the nudge's suggestion and its signature; Needs you's line and order; Your week
skips a waiting project); sync compare lines; browser checks (the form from Manage, the Overview card with Got it,
Change and Chase it, the nudge with Mark as waiting and Not now, the board card and List row, Needs you with Chase it,
finishing, phone 390 px); the previous release keeps the field through its own edits.
