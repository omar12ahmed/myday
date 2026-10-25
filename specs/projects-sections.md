# Projects: optional sections on a project's Overview (Phase 4, second part)

**Status:** the owner's decisions in §2 (25 October 2026); being built on branch `sections`. Nothing live without the
owner's yes.
**Based on:** source at 1.83.0. Plan: `specs/projects-vision.md` §5 ("A useful default should work without
configuration. Early customisation should support showing, hiding and ordering sections … Essential actions and
unresolved firm deadlines must remain discoverable even when sections are hidden"), §17 (Phase 4), §19 (Taste skill).

## 1. The practical problem

A project's Overview shows the same twelve cards whatever the project is: Where I left off, Next step (with Worth a
look), At a glance, About it, Tasks, Notes, Coming up, Recently, Learning, Links, Files and the project's status. On a
small project ("Renew the passport") most of them are empty, and the page is long to scroll for one task.

## 2. The owner's decisions (25 October 2026)

1. **Approach:** empty optional cards fold by themselves into one short "Add to this project: …" row, **and** you can
   hide any optional card on a project.
2. **Which cards are optional:** Notes, Recently, Learning, Links and Files. Always shown: Where I left off (when
   there is one), Next step and Worth a look, At a glance, About it, Tasks, Coming up and the project's status.
3. **Ordering:** show and hide only; every project keeps the shared order.
4. **Where the choice lives:** on the project, synced with it.

## 3. What you see

- **Folded:** an optional card with nothing in it isn't shown; one row near the end offers what's missing ("Add to
  this project: a note · a link · a file · learning"), each opening that card's own "add" step.
- **Hidden by hand:** About it → Edit lists the optional cards with a switch each ("Show on the Overview"). A hidden
  card that has something in it is named at the foot of the Overview: "Hidden here: Files (3) · Links (1) — Show",
  so nothing is lost.
- **Never hidden:** where you left off, the next step, Worth a look, At a glance, About it, Tasks, Coming up and the
  status (so a date that's still ahead always shows).

## 4. How it works

- Saved data (schema stays 5): an optional `hidden: string[]` of section ids on the project, kept by earlier releases
  (their project reader keeps unknown fields; the AGENTS.md exception), synced inside the project record. An older
  release shows every card.
- Folding reads only what's there (no saving). Nothing sent to AI.

## 5. Checks

Rules for which cards fold or hide and the "Hidden here" line; browser checks on a small and a full project, the
switches, phone layout and 44 px targets; the previous release keeps `hidden`; Taste-skill screenshots.
