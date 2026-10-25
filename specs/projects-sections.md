# Projects: optional sections on a project's Overview (Phase 4, second part)

**Status:** the owner's decisions in §2 (25 October 2026); released in 1.85.0 (with the owner's yes). No schema,
migration or server change.
**Based on:** source at 1.83.0. Plan: `specs/projects-vision.md` §5 ("A useful default should work without
configuration. Early customisation should support showing, hiding and ordering sections … Essential actions and
unresolved firm deadlines must remain discoverable even when sections are hidden"), §17 (Phase 4), §19 (Taste skill).

## 1. The practical problem

A project's Overview shows the same twelve cards whatever the project is: Where I left off, Next step (with Worth a
look), At a glance, About it, Tasks, Notes, Coming up, Recently, Learning, Resources (its web links), Files and the
project's status. On a small project ("Renew the passport") most of them are empty, and the page is long to scroll
for one task.

## 2. The owner's decisions (25 October 2026)

1. **Approach:** empty optional cards fold by themselves into one short "Add to this project: …" row, **and** you can
   hide any optional card on a project.
2. **Which cards are optional:** Notes, Recently, Learning, Resources (web links) and Files. Always shown: Where I left off (when
   there is one), Next step and Worth a look, At a glance, About it, Tasks, Coming up and the project's status.
3. **Ordering:** show and hide only; every project keeps the shared order.
4. **Where the choice lives:** on the project, synced with it.

## 3. What you see

- **Folded:** an optional card with nothing in it isn't shown; one card near the end, **Add to this project**, offers
  what's missing in the cards' order (A note · Something to learn · A link · A file). A link's and a lesson's forms open
  straight away; for a note and a file the card's own button gets the keyboard (a new note opens its own page, and a
  file picker opens only on your tap). Recently has nothing to add, so it's never offered.
- **Hidden by hand:** About it → Edit has **Show on the Overview**, a switch per optional card. A hidden card that holds
  something is named under **Hidden here** ("Show Resources (2)"; "Show Files (2 recently deleted)" when all its files
  are waiting there, since they go for good after 30 days); one tap shows it again and the keyboard goes to it. A hidden
  Recently isn't named (it's a view of what changed, with nothing of its own to lose), nor is a hidden card with nothing
  in it. Notes that only "might belong here" don't name a hidden Notes; they're on the Connections tab too.
- **Never hidden:** where you left off, the next step, Worth a look, At a glance, About it, Tasks, Coming up and the
  status (so a date that's still ahead always shows).
- A search result inside a folded or hidden card ("Search this project") opens that card for the visit; another screen
  can do the same with `openOnArrival(projectId, section)` (agreed with myday-83 for Search everywhere).

## 4. How it works

- Saved data (schema stays 5): an optional `hiddenSections: string[]` of section ids on the project (once each, up to
  20, the rest counted; one from a newer MyDay kept), kept by earlier releases (their project reader keeps unknown
  fields; the AGENTS.md exception), synced inside the project's own record. Hiding is a choice of what to show, not
  work on the project: its "updated" time and its place in Projects stay. A sync conflict on the project names its
  hidden cards (and its tools). An older release shows every card.
- Folding reads only what's there (no saving). Nothing sent to AI.

## 5. Checks

Rules for which cards fold or hide and the "Hidden here" line; browser checks on a small and a full project, the
switches, phone layout and 44 px targets; the previous release keeps `hidden`; Taste-skill screenshots.
