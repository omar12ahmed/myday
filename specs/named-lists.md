# Named lists from "Add what's on my mind": the plan

**Status:** option B accepted and released in 1.40.0 (21 October 2026). The original plan below is retained as
historical context.
**Original plan date:** 20 October 2026, after release 1.39.0.

## 1. The practical problem

"Add what's on my mind" on Today turns what you write into up to 8 small tasks, and you tick the ones you want. There
are only two places a task can go:
- **a one-off task** goes into the queue, where MyDay fits it into a coming day by itself;
- **a repeating one** goes onto one of the three fixed lists: Learning, Admin or Health.

So a brain dump about one thing gets scattered. For example: "We're moving next month: book a van, pack the books,
change my address with the bank". Its steps land in the queue one by one, mixed in with everything else, with
nothing to show they belong together.

Your decision of 3 Oct 2026 was that the brain dump's next step is **brand-new named lists**. At the time that
looked like a change to saved data in both versions and in the sync tables, needing a migration. Since then, two
things have arrived:
- **The Tasks section (1.5.0)** has its own named lists already: up to 30, each with a name of up to 40 characters.
  The code's own example is "Moving house".
- **Projects (1.12.0) and Ask MyDay (1.25.0)** give a bigger intention its own home, with one next step on Today.

## 2. What's saved today

| What | Where | Which versions | How it reaches Today |
|---|---|---|---|
| The three repeating lists | `lists.learning / admin / health`: `{ id, title, minutes }` | Both | Build my day picks from them, within your energy |
| The queue | `queue`: `{ qid, taskId, category, title, minutes, queuedOn, sourceUid }` | Both | MyDay fits each into a coming day, oldest first, within your energy |
| Tasks and their lists | `tasks.lists`: `{ id, name }`; `tasks.items`: `{ id, title, listId, category, minutes, due, time, … }` | New app only (the classic keeps them unread) | "Your tasks" on Today; a task due today shows under "Due today", and one tap adds it to today's plan |

**How these sync:**
- the three lists and the queue have their own tables (since 1.1.0);
- your Tasks lists are one record (kind `tasks`, id `lists`);
- each task is its own record (kind `task`).

**What the brain dump sends:** only what you wrote, the date and the weekday (contract version 1, instructions
`myday-tasks-v1`). The model answers with `{ title, category, minutes, repeat }` for each task. The app checks every
field (`app/src/ai/mind.ts`, `checkTasksReply`) and adds only the ones you tick:
- repeating tasks go to that category's list;
- one-off tasks go to the queue.

One Undo takes back exactly what was added.

## 3. The options

| Option | What it means | Saved data | Size |
|---|---|---|---|
| **A. Leave it as it is** | Nothing changes | None | None |
| **B. Brain-dump tasks into a Tasks list** | The reply may suggest a list for a one-off task. The app matches it to one of your Tasks lists, or offers it as a new list; you can change it or say none. A ticked task with a list goes into Tasks, in that list | **No change.** Tasks lists exist since 1.5.0, and the classic keeps the section unread | Small: the app, the server's instructions, tests |
| **C. New categories beside Learning, Admin and Health** | Your own named repeating lists, used by Build my day | A change in both versions and in the sync tables, plus a migration | Large: the classic's energy rule, Build my day and Today all assume three categories |
| **D. "These belong together: start a project"** | When several tasks share one aim, a link starts a project with them as its steps | None (projects exist) | Small, but it overlaps Ask MyDay, which already does this from + Capture |

## 4. Recommended: B

**What's sent stays the same.** Only what you wrote and the date go to the model, never your lists' names. The model
may suggest a short list name for a one-off task (e.g. "Moving house"). The device then matches it to your own lists.

**On the card:**
- **The list chip:** each one-off task shows where it would go, e.g. "Moving house · new list", or "Errands" when it
  matches a list you have. Matching ignores capitals and extra spaces.
- **Changing it:** a tap on the chip lets you pick another of your lists, or none.
- **When a new list is made:** only when you tick at least one task for it.
- **Limits:** at most two new lists per reply. Your 30-list limit still applies; when it's reached, the chip offers
  your existing lists or none.

**Where a ticked task goes:**
- **A one-off with a list:** into Tasks, in that list, with its category (for Today's plan) and its minutes. It has no
  date, so it waits under "Your tasks" until you pick it or give it a date.
- **A one-off without a list:** the queue, as now.
- **A repeating task:** the category list, as now. A list suggested for a repeating task is ignored.

**Undo** takes back the tasks this Add made (unless you've changed them since or they're on a day's plan). It also
removes a list this Add created, if that list is now empty and hasn't been renamed.

**Compatibility:**
- **The classic MyDay:** no change. It keeps the Tasks section unread, as it has since 1.5.0.
- **Going back to 1.39.0** is safe: the tasks and lists are ordinary Tasks data, which 1.39.0 already reads and keeps.
- **Sync:** no change, because the `tasks` and `task` records already exist. No migration, no database change.

**The server:**
- **The contract:** version 2 of the `tasks` job adds an optional `list` (up to 40 characters) to each task, and the
  instructions become `myday-tasks-v2`.
- **What the instructions say:** suggest a list only when several tasks belong together or what you wrote names one;
  use at most two list names; plain words, no emoji.
- **Older apps:** they send version 1 and must keep getting version 1 replies. So the server is deployed first and
  answers both versions; then the app is published.

**The app's checks on a reply:**
- a list name is trimmed, at most 40 characters, plain text, and free of pressure words;
- a third or later new name is dropped (its task stays, without a list);
- a list on a repeating task is ignored.

**The evaluation:** made-up brain dumps (a house move, a wedding, an ordinary mixed day, one stray errand), run live
on GLM and read blind. Do the lists make sense, and does it avoid inventing a list for one stray task? About US$0.03.

**The tests:**
- `ai-rules`: the checks on a list name, the two-new-lists limit, and matching;
- `ai-server`: version 1 and version 2 both answered correctly;
- `app-ai`: the chip, the picker, Add into Tasks, a new list made only when ticked, and Undo removing it;
- `sync-records`: unchanged, and run to prove it.

**The release steps (Mac):**
1. the evaluation;
2. deploy `ai-plan` with your go-ahead;
3. the full run;
4. publish after backups;
5. a live check.

## 5. Questions for you

1. **Option B?** Brain-dump tasks can go into a named Tasks list, which can be new; no migration.
   *Recommendation: yes. It gives your 3 Oct milestone what it asked for, without the migration.*
2. **A one-off task with no list: queue (as now) or Tasks?** In the queue, MyDay fits it into a coming day by itself.
   In Tasks, it waits until you pick it or give it a date.
   *Recommendation: the queue, as now. Only a task you've given a list goes into Tasks.*
3. **Also offer "these belong together: start a project" (option D)?**
   *Recommendation: not in this release. Ask MyDay already turns an intention into a project. Revisit if brain dumps
   keep producing project-sized lists.*
4. **Should the brain dump also suggest a date when you write one ("before Friday")?** That would be a dated task in
   Tasks, which shows under "Due today" on the day.
   *Recommendation: not now. Keep this release to lists, then decide once you've used it.*
