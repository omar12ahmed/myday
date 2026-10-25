# Projects: what needs you, across projects (Phase 4, first part)

**Status:** the owner's decisions in §2 (25 October 2026); released in 1.83.0 (25 October 2026, the owner's yes). No
saved-data, sync, database or server change.
**Based on:** source at 1.81.0. Plan: `specs/projects-vision.md` §1 ("What needs attention?"), §13 (the homepage:
"Projects needing a decision or an unblocking action", "Important unresolved dates"; filters and an optional list
view, the board kept; "Attention prompts should explain the underlying reason"), §17 (Phase 4), §19 (Taste skill for
the screen).

## 1. The practical problem

What needs you is worked out today in three places that don't meet: each project's **Worth a look** (a past-dated
task, a wait whose expected day has come, a date in the next week, a business idea's Find out results, a case's
evidence to get), **Your week**'s step 2, **What needs you** (stuck tasks, quiet projects, decisions open two weeks
or more), and Today's **From your projects** (next steps). To see what needs you across five projects you open five
projects, or wait for the weekly review. The board shows each project's next step, but not what's asking for you.

## 2. The owner's decisions (25 October 2026)

1. **Where it lives:** a "Needs you" card at the top of the Projects home, above the board.
2. **What counts:** a date today or in the next 7 days; a task still open after its date (not one that's waiting or
   starts after another); a wait whose expected day has come; a task that keeps moving ("Something in the way?"); a
   decision open 14 days or more; a business idea's done Find out task with nothing found yet; a case's evidence still
   to get. **Not** "quiet" projects (Your week keeps those; a project isn't flagged just for not being opened).
3. **How much at once:** the five that matter soonest, then "Show N more"; filters by reason and a project picker.
4. **Board or list:** the board stays; a **Board · List** switch adds a list (one row per project), remembered on this
   device only.
5. **Hiding one:** no. An item goes when it's dealt with (done, chosen, found, moved).

## 3. What you see

- **Needs you** card: each line says what and why, in words, and opens the thing itself ("Order the boards — still
  open, was due Thu 22 Oct · Shed"; "Which supplier? — open 3 weeks · Coffee subscription"; "Priya — expected today
  (Armchair) · Chase it"). The project's name on every line. With nothing: "Nothing needs you right now." No counts of
  "overdue", no red, no scores; a paused or finished project isn't included.
- **Filters** as chips with counts in words ("Dates 2"), one at a time, and a project picker; the choice isn't saved.
- **List:** a Board · List switch at the top of the board; one row per active project (name, stage, next step, how
  many things need you), most recently worked on first, as the board orders each column.

## 4. How it works

- One rule set, `data/attention.ts`, that both each project's Worth a look and this card read (and Your week's step 2
  where it overlaps), so a reason is worded and decided once. Nothing saved; nothing sent to AI (a private project's
  items show here, on this device, as they do on its own page).
- The order: by when it matters — today's dates, dates passed (oldest first), waits that are due, tasks that keep
  moving, the coming week's dates (soonest first), decisions (open longest first), then a project's Find out results
  and evidence; ties go by project, most recently worked on first. Each task appears once, under the first of: keeps
  moving, wait due, date passed, date ahead. The same 7-day dates rule feeds each project's Worth a look.
- No saved-data, sync or database change (the List choice, if any, is a device-only `myday.*` key).

## 5. Checks

Rules for every reason (included, excluded: paused/done projects, held-back tasks, private projects shown), the
order, the cap and filters; Worth a look unchanged where it overlaps; browser checks on the card (each line opens
its item, filters, "Show more", empty state), the List choice, phone layout and 44 px targets; Taste-skill screenshots
for the arrangement.
