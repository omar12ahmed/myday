# Learning for a project (Study links)

**Status:** approved by the owner on 24 October 2026 ("start"; Study links first; your own courses, books and Arabic
lessons; a side-column card; Projects side only for now). Phase 2, release 1 of `specs/projects-vision.md`. Not yet
released.
**Based on:** source at 1.54.0 plus docs (b0e1079).

## 1. The practical problem

A project often needs learning: a course for the shop's Wi-Fi, a book on bookkeeping, Arabic greetings for a trip.
Study keeps that learning and its progress, but nothing on the project says what you're learning for it, why, or how
far you've got. The vision (§11) asks for stable links that explain why the learning matters, with Study's own
status, never a guessed one.

## 2. What changes

- **A "Learning" card** on the project's Overview, in the side column after Recently (before Manage).
  - **Nothing linked:** one line, "Link a course, book or Arabic lesson you're learning for this project.", and
    **Link something**.
  - **Each link:**
    - what it is ("Your course", "Book", "Arabic lesson") and its title, opening it in Study;
    - its status in Study's own words;
    - "Why: …" when you wrote one;
    - **Edit why** (or **Add why**) and **Unlink**, as quiet text buttons. Unlinking says "Unlinked — it's still in
      Study", as unlinking an appointment does.
- **Statuses**, never a percentage and never inferred competence:
  - **Your course:** Study's own line, e.g. "3 of 8 tasks marked complete" or "No tasks added yet". When it's
    archived: "Archived in Study".
  - **Book:** "Not started", "Page 120 of 300" (or "Page 120" without a total), or "Finished on Mon 12 Oct".
  - **Arabic lesson:** Study's lesson state, i.e. New, Practised, Ready to move on, Holding or Needs revision. It's
    loaded on demand, as on Study home; until then the line is empty, and if it can't load it says "Open it in Study to
    see how it's going".
  - **Gone** (a course or book removed in Study, or a lesson no longer in the Arabic course): the title you linked,
    with "No longer in Study" and Unlink.
- **Link something:**
  1. Choose what kind: Your course, Book or Arabic lesson.
  2. Choose which one. The list shows only those not linked yet: courses in roadmap order, books in Reading's order,
     and Arabic lessons in your path's order. A kind with nothing in it says so (e.g. "No books in Reading yet.").
  3. Optionally say why it matters (up to 200 characters).
  4. Press **Link**; Cancel closes the form.
- At most 20 links a project. The same item can't be linked twice.
- Opening a link goes to the course page, Reading (books have no page of their own) or the lesson.

## 3. Saved data, sync and AI

- **Saved data:** an optional `studyLinks` on the project, with no schema change. Each link is
  `{ kind: 'course' | 'book' | 'arabic', id, title, why?, addedOn }`.
  - `title` is kept so a link still reads well when its item is gone.
  - A project without links is saved exactly as before.
  - A kind this version doesn't know (from a newer MyDay) is kept and shown with its title and "Open it in a newer
    MyDay".
  - A link this version can't read is counted, never kept half-read.
- **Older releases:** this uses the owner's exception in AGENTS.md (optional fields inside an existing record whose
  unknown fields the previous release keeps). 1.54.0 keeps the field unread through read, edit, save and sync, which is
  proved with `app-sync-previous`. 1.54.0 doesn't show the links, so update every device you use.
- **Sync:** links travel in the project's own record (the split project sync). The sync-conflict details show them as
  "Learning: …".
- **Export and import:** links are included, as the rest of the project is.
- **Deleting:**
  - Deleting a project removes its links; the courses, books and lessons stay in Study.
  - Unlinking never changes Study.
  - Deleting a course or book in Study leaves the link, marked "No longer in Study".
- **AI:** nothing is sent. Ask MyDay and every other AI request build the project's context from named fields, which
  don't include links; a check keeps it that way.

## 4. Decisions

1. Your own courses, books and Arabic lessons (owner's choice). Cybersecurity lessons are left for a follow-up, once
   their lesson pages (being rebuilt in another session) are released. Study topics are left out because a topic has no
   status of its own: link its courses instead.
2. A side-column card (owner's choice), shown even when empty, as one line.
3. Projects side only (owner's choice). A "For your project" line on the Study side is a follow-up.
4. "Why it matters" is optional and short.
5. Not included in project search for now: a lesson's title is the curriculum's words, not yours. A follow-up can add
   your "why".

## 5. Checks

- **Rules:**
  - normalizing (valid, invalid, duplicates merged, unknown kinds kept, why trimmed and capped; links beyond 20 from
    elsewhere are kept, and only adding is capped);
  - add, remove and edit-why (no change returns false);
  - each status and the gone cases;
  - the choices exclude linked items and keep Study's order;
  - the conflict line;
  - Ask MyDay's project context has no links.
- **Browser:**
  - the empty card; linking a course, a book and an Arabic lesson (the status loads);
  - editing why, unlinking, opening each in Study;
  - a gone course;
  - the cap, keyboard use, and a phone at 320 px.
- **Previous release:** `app-sync-previous` against 1.54.0. A project with links survives the older version's read,
  edit, save and sync, with the links intact.
- **Visual (Taste skill):** the card empty and with three links, desktop and phone, light and dark.

## 6. Follow-ups (owner, 24 October 2026)

When the other session's Cybersecurity lesson journey is released:

- link Cybersecurity lessons, with "marked complete" and "begun" as Study keeps them;
- a "For your project" line on the Study side.
