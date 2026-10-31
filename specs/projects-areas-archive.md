# Projects: areas, and an archive of finished projects (Phase 4)

**Status:** the owner's decisions in §2 (31 October 2026); being built on branch `areas-archive`. Nothing live without
the owner's yes. No schema, migration or server change.
**Based on:** source at 1.103.0. Plan: `specs/projects-vision.md` §5 capability table (Lifecycle: "Archiving, and a
clear distinction between achieved and deliberately stopped"; Organisation: "better filtering"), §17 (Phase 4).

## 1. The practical problem

With a dozen projects across home, work, a business idea and study, the Projects home is one board ordered by stage and
when you last worked on each: nothing says which part of your life a project belongs to. Finished projects sit in a
"Done" list that doesn't say whether they were achieved or let go on purpose.

## 2. The owner's decisions (31 October 2026)

1. **Areas and an archive together**, one release.
2. **Areas are made as you go:** on a project, "Area: [Home ▾]" — pick one you've used or type a new one; no setup
   screen; rename or merge an area from the Projects home.
3. **Colours:** each new area gets the next of a few soft colours made for light and dark; you can change it. Always
   shown with the area's name, never colour alone.
4. **The archive holds finished projects:** finishing asks "Achieved" or "Stopped on purpose" (with an optional note);
   finished projects move to the Archive, out of the way but searchable; one tap brings one back.
5. **Projects only for now:** the Projects home and each project — not Today or Needs you.

## 3. What you see

- **A project:** its area beside its kind at the top (a soft colour dot and the name). About it → Edit has **Area**:
  type a name, or pick one you've used (and "None").
- **Projects home:** above your projects, **Areas: All · Home · Work · Hargeisa · No area** (each with its dot and
  count) to show one area; the choice is kept on this device. The board keeps its stages; each card shows its area with
  a soft coloured edge. The List view groups by area (areas in name order, "No area" last). **Areas…** opens a short
  list where an area can be renamed (to an existing name: merged) and given another colour.
- **Finishing:** "Mark as done" now asks **How did it end?** — Achieved · Stopped on purpose — and an optional note
  ("What did you get out of it?" / "Why did you stop?"). The project's page then says "Achieved · Tue 3 Nov" (or
  "Stopped on purpose"), with the note.
- **The Archive** (where "Done" was): finished projects, newest first, each with its area and "Achieved · 3 Nov" /
  "Stopped on purpose · 3 Nov" (or "Finished" for one finished before this), and **Bring back**. Search still finds them.
- Words with colour, never colour alone; no scores.

## 4. How it works

- **Saved data (schema stays 5):** optional fields on the project, synced in its own record and kept by 1.103.0 (its
  project reader spreads unknown fields — the AGENTS.md exception): `area` (a name, up to 40 characters),
  `areaColour` (one of `sage`, `sky`, `sand`, `rose`, `lilac`, `teal`, `clay`, `slate`; one from a newer MyDay kept) and
  `finished: { how: 'achieved' | 'stopped', note, on }` (with status `done`; bringing it back removes it).
- **An area's colour** is its projects' colour (the most common if two devices chose differently); a new area takes the
  first colour no area uses. Choosing, renaming or recolouring an area is organising, not work: the project's "updated"
  time and its place in Projects stay. Finishing is work.
- The area filter is device-only (`myday.projects.area`), like Board · List. Nothing is sent to AI.

## 5. Checks

Rules (reading the fields with a newer MyDay's kept; areas listed with colours and counts; choosing a new and an
existing area; rename and merge; recolour; the next free colour; finishing and bringing back; the archive's order);
browser checks on a project's area, the Projects home filter, cards and list groups, Areas…, finishing and the archive,
phone layout; the previous release keeps the fields.
