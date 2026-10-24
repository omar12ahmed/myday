# Projects Overview: next step first, one place per fact, open past dates kept

**Status:** approved by the owner on 24 October 2026, with the recommended answers to section 4. Phase 1,
release 1 of `specs/projects-vision.md`. Released in 1.46.0 (24 October 2026).
**Based on:** source at release 1.45.2. Display only: no saved-data, sync or AI-payload change.

## 1. The practical problem

The Overview answers "what can I do next on this project, and does anything need me?" too late and too often.

Measured with the Taste skill's app-screen inspector at 1440, 768 and 390 px, on made-up projects (a General
reading-room project, a Business idea and a Case), 24 October 2026:

- **The next step is below the first screen.** At 1440 × 900 the first screen is the title and "At a glance". The
  Next step card, with Add to today and Done, starts on the second screen; on a phone, on the second of about five.
  The inspector reports only 2–3 of 13–14 blocks starting on the first desktop screen.
- **The same facts appear two to four times.** On a General project, milestone progress is in a tile, the route
  picture and the Milestones card; the next date is in a tile, a "Worth a look" pointer and Coming up; the next step
  and open decisions are each in a tile and a card. On a Business idea, "What must be true" counts show in a tile and
  again in three boxes beneath it. On a Case, the next date shows in four places.
- **An open task whose date has passed disappears from every date list.** "Coming up", "Next date", the Case card's
  "Next date" and "Next dates" all start at today (`comingUp` in `app/src/data/projects.ts`). In the Case example, an
  unsent "Send the deposit scheme my evidence" (due 22 Oct) is missing from all four; they show 30 Oct instead.
- **The right column ends 31–145 px away from the left** (the inspector's `ragged-row`), with seven separate cards.

No measurement failed. Contrast, type sizes and phone overflow pass. This is about order and repetition.

## 2. What changes

The screen's one question: **"What can I do next here, and does anything need me?"** Its largest element is the
answer: the Next step card.

### Order

Desktop (two columns, the wider on the left):

1. Title, Private switch and tabs: unchanged.
2. **Next step** (left) beside **Worth a look** (right), so the action and what needs attention are on the first
   screen.
3. **At a glance**, full width, holding each tool's summary once (below).
4. **About it**: unchanged (summary, stage, Explore this idea).
5. Left: **Tasks**, then **Notes**. Right: **Coming up**, **Recently**, then Pause / Mark as done / Delete.

Phone: Next step, Worth a look, At a glance, About it, Tasks, Notes, Coming up, Recently, and the status buttons.
Still-open dates also lead Worth a look, near the top. When Worth a look has nothing to show, Next step takes the
full width.

### At a glance holds each summary once

- The four-tile strip goes. Its Next step and Next date tiles repeat the Next step card and Coming up.
- Each tool becomes one row: a label that opens its tab, its picture if it has one, and its count in words:
  - Milestones: the route, "1 of 4 reached · Next: Walls painted (aiming for Sun 8 Nov)".
  - Decisions: up to three open questions, or the latest choice when none are open.
  - Business idea: "Your one page" with how many of its four questions are answered, and "What must be true" as
    its three counts (not checked yet, looks true, doesn't hold), shown once.
  - Case: the Evidence bar, Issues and what's linked, and Timeline entries by month, each once.
  - What you did: the week-by-week columns, with "3 done · 4 to go · started 1 Oct · last worked on 23 Oct"
    (today's "How it's going" card, merged in).
- The separate Milestones, Decisions, "Your one page" and "Your case" cards leave the Overview; their tabs are
  unchanged. "Add a deadline" moves into Coming up for a Case. The "MyDay doesn't give legal advice" line stays
  on the Case Overview, under its At a glance rows.
- "Summarise this" stays, at the end of At a glance, with its current rules.

### Open past dates stay visible

- A new helper lists a project's **open tasks whose date has passed**. It changes no saved data, and `comingUp`
  itself is unchanged.
- **Coming up** starts with a "Still open" group: each item shows "was due Wed 21 Oct", in the normal text colour.
  No red, no "overdue", no count of days missed. Ticking the task done removes it. Appointments in the past are not
  listed: they have happened.
- **Worth a look** puts at most one still-open item first ("Send the deposit scheme my evidence — still open, was
  due Thu 22 Oct"), then its existing pointers, still at most three. Its "No next step yet" pointer goes: the Next
  step card beside it already asks for the smallest one.
- After the independent review: when the still-open task is the next step (the default, since dated tasks come
  first), the **Next step card** itself says "Still open · was due Thu 22 Oct" and Worth a look points at a different
  still-open task, if any, rather than repeating it beside the card. The still-open pointer is for active projects
  only; a paused or done project isn't nudged, though Coming up still lists the tasks. A case's empty Coming up keeps
  the old card's words: "No dates yet. A deadline is a dated task here — it reaches Today on its day."

### Kept as they are

Names ("At a glance", "Worth a look", "Coming up", "Recently", "About it"); the next-step rule (`nextStep`); every
tab; Ask MyDay's request and preview; Today; the Projects home board; the floating Capture button.

## 3. Checks

- **Visual (Taste skill, app-screen workflow).** The same made-up data and frozen clock as the before screenshots,
  inspected again into `.taste-skill/after` at 1440, 768 and 390 px, light and dark, for the General, Business and
  Case Overviews. Expected: Next step and Worth a look on the first desktop screen; no fact repeated; no
  `ragged-row` on the Overview; 0 FAIL. Every screenshot opened and compared with the before set.
- **States.** A project with nothing yet (empty At a glance rows keep their label and one sentence); a project with
  only past dates; a paused and a done project; a private project ("Summarise this" still hidden).
- **Browser suites.** Update `app-projects` for the moved and merged blocks and add checks for: still-open tasks in
  Coming up and Worth a look, their removal when done, no past appointments, the phone order, and no horizontal
  scroll at 320 px. Run `app-projects`, `app-ai` (the Summarise button moves), `app-design`, `projects-rules`.
- **Accessibility.** Keyboard order follows the visual order; headings stay in order; 44 px targets; both themes.

### Results (24 October 2026, source only, not released)

- Build, lint and type-check passed. `app-projects` 439/0, `projects-rules` 371/0, `app-ai` 210/0, `app-design` 74/0.
  The tile checks were removed (their subject is gone); every other changed check was repointed to the fact's new
  place, and new checks cover still-open dates, the order, removal when done, and 320 px phones.
- Taste inspector, same data and clock as before: 0 FAIL on every screen. Next step and Worth a look now start on the
  first desktop screen (4 of 11 blocks, from 2–3 of 13–14), and the phone page is about 4.3 screens instead of 5.
  Remaining warnings, kept on purpose: a blank band in Worth a look where it lines up with the taller Next step card;
  the lower two columns ending at different heights (task and note lists vary, as before); the existing Business icon
  finding and em dashes in established wording.
- Not checked visually: a paused or done project's Overview.

## 4. Owner's decisions (24 October 2026)

1. The order and the merge into At a glance: approved as described.
2. A passed date reads "Still open · was due Wed 21 Oct".
3. The week-by-week columns stay inside At a glance, merged with How it's going.

Out of scope, for later releases: Today showing still-open project dates; the Projects home board; the floating
Capture button covering content on phones (owner-agreed in 1.45.0; noted only).
