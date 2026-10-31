# Projects: welcome back after a break (Phase 5, recovery)

**Status:** the owner's decisions in §2 (31 October 2026); for 1.101.0 (branch `welcome-back`). Nothing live without
the owner's yes. No saved-data, schema, migration or server change.
**Based on:** source at 1.97.0. Plan: `specs/projects-vision.md` §9 ("Returning after a break": project recovery is an
early priority; the user's "Where I left off" note, supplemented by changes supported by saved records; "Recently"
stays a lightweight summary, never presented as a complete history), §17 (Phase 5, richer recovery summaries).

## 1. The practical problem

Coming back to a project after a couple of weeks, you open it and see everything at once: the next step, At a glance,
Recently, Coming up, your note if you left one. What you need first is the thread: what you were last doing, what came
up while you were away, where you said you'd pick up, and the next small step.

## 2. The owner's decisions (31 October 2026)

1. **When:** after 7 days with no work on the project (counted from the last change anywhere in it), not a new record.
2. **What it gathers:** what you did last; what came up while you were away; where you left off and the next step; and,
   when there's no note, "Leave yourself a note for next time?".
3. **Afterwards:** "Got it" puts it away on this device until the next break; any work on the project ends the break.
4. **Projects home:** a quiet label on the project's card and list row ("Away 3 weeks"; on the project itself it
   greets you as "Welcome back").

## 3. What you see

- **On the project's Overview**, first, a **Welcome back** card: "Away 18 days — last worked on Tue 13 Oct", then
  - **What you did last:** the last few things before the break, from what's saved ("Done: Order the boards", "Note:
    Shed sizes"); with nothing done yet, when you started it;
  - **While you were away:** dates that came and went and are still open, dates in the next 7 days, waits now due,
    decisions open a while, Test and Find out tasks done with nothing recorded — each one tap away; or "Nothing came
    due while you were away.";
  - **Where you left off:** your note and its day (the separate "Where I left off" card is folded into it while this
    shows), or "Leave yourself a note for next time?" with the note's own editor;
  - **Next step:** its title, with Add to today (as the Next step card offers);
  - **Got it** (and the keyboard goes to the project's heading).
- **On the Projects home**, a project away 7 days or more says "Away 18 days" / "Away 3 weeks" / "Away 2 months" on
  its board card and list row, calmly (no colour, no warning).
- Paused projects greet you too; a finished one doesn't (nothing to pick up).
- Words and plain counts: no scores, no streaks, no "you've neglected".

## 4. How it works

- **Away** is measured from the project's last activity (`lastActivity` in `data/projects.ts`): its own changes, its
  notes, its tasks added — and now also a task done and its research changed, so "last worked on" (At a glance, Your
  week, the order of Projects) counts those as work too.
- **What you did last** is `recently()` (the same reconstructed list as the Recently card: never a full history).
- **"Got it"** is remembered on this device only (`myday.projects.welcomed`: each project's last-activity stamp at the
  time), like the Board · List choice: not your data, not synced, not in backups. When the project's last activity
  moves on, the stamp no longer matches, so the next break greets you again.
- Nothing is saved, nothing is sent to AI, and nothing about it syncs. Going back to 1.97.0 just loses the card.

## 5. Checks

Rules (away days and words; the 7-day rule; done projects; what you did last; each kind of "while you were away" item;
the note or the prompt; the next step; dismissal by stamp; `lastActivity` counting a task done and research); browser
checks on a project away 18 days (the card, each link, Add to today, the note prompt, Got it and its focus, coming back
after more work), the home card and list row, and phone layout.
