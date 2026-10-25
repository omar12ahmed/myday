# Projects: deadlines you can trust (Phase 3, Case deadlines)

**Status:** the owner's decisions in §2 (25 October 2026); being built on branch `case-deadlines`. Nothing live without
the owner's yes.
**Based on:** source at 1.85.0. Plan: `specs/projects-vision.md` §10 "Case or formal matter" (deadline records that
distinguish a firm deadline from a date to aim for, the date's source, whether it was checked, by whom and when, and
whether the action remains outstanding; an unresolved deadline stays visible after its date, calmly; MyDay never
calculates authoritative legal deadlines), §17 (Phase 3).

## 1. The practical problem

On a Case, "Add a deadline" makes a dated task: it reaches Today on its day, Coming up keeps it after its date ("Still
open · was due 3 Oct"), and Needs you shows it in the week before. But nothing says whether the date is firm (the
tribunal's) or one you're aiming for, where it came from (a letter, the rules as you read them), or whether anyone
checked it.

## 2. The owner's decisions (25 October 2026)

1. **Shape:** a deadline stays a dated task (Today, Coming up, Needs you and the plan keep working), with optional
   details: firm or a date to aim for, where the date comes from, who checked it and when.
2. **Where:** any project's dated task; a Case keeps its "Add a deadline" (which makes a firm one).
3. **Notice:** 7 days, like other dates (no earlier notice for firm ones).
4. **When it's done:** on a Case, one tap notes it on the timeline ("Done: Send my witness statement", that day, your
   account) — never by itself.

## 3. What you see

- On the task's page, a **Deadline** card (shown when it has a date): Firm deadline · Date to aim for · Not a deadline;
  "Where does this date come from?" (e.g. "The tribunal's letter of 3 Oct"); "Checked by" and the day ("Me", "My
  adviser"). A line: "MyDay doesn't work out legal deadlines; it keeps the ones you enter."
- Wherever it's listed: "Firm deadline · Thu 6 Nov" or "Aiming for Thu 6 Nov"; after its date, while still to do,
  "Still open, was due Thu 6 Nov" (firm) or "Still open, was aimed for …" (aim) — never "overdue", never red.
- "Add a deadline" on a Case makes a firm one, asking where the date comes from.

## 4. How it works

- Saved data (schema stays 5): an optional `deadline: { kind: 'firm' | 'aim', from: string, checkedBy: string,
  checkedOn: DateKey | null, noted?: string }` on a task (`noted`: the timeline entry made from it, so it's offered
  once), kept by earlier releases (their task reader keeps unknown fields; the
  AGENTS.md exception), synced inside the task record. An older release shows it as a plain dated task.
- The dates' windows are unchanged (7 days). Where the date comes from and who checked it are never sent to AI.

## 5. Checks

Rules (reading the field, firm/aim words, past dates still listed, done → no longer outstanding,
the timeline offer); browser checks on the task page, Coming up, Needs you and a Case's Add a deadline; the previous
release keeps the field; phone layout; Taste-skill look at the new card.
