# Search everywhere

**Status:** built on branch `search-everywhere`; not yet released (owner's choice of 25 October 2026: "Search across MyDay"). The next step named in
`specs/myday-vision.md` §5. Built by myday-83, with myday-51 (Projects) and myday-86 (Study) agreeing the parts that
read their records.
**Based on:** source at release 1.83.0.

## 1. The practical problem

MyDay has a search in Notes, one in Tasks, one inside each project (1.52.0) and lesson finders in Arabic and
Cybersecurity. "Where did I write the electrician's number?" still means guessing which section to look in first.

## 2. The owner's decisions (25 October 2026)

1. **Where:** a Search page reached from the header — a magnifier button next to + on every screen — and, on a
   computer, the / key (unless you're typing somewhere). Results link to each item.
2. **What:** every section — tasks and their lists, projects (everything "Search this project" finds), notes, the
   calendar, your learning records, the course lesson titles, Finance and Health.
3. **Private:** private projects (with their tasks and notes) aren't searched here; you search inside one from its
   own page. A note marked private is left out too (its own page is Notes, which searches it). The page says so.
4. **Course words:** yes — once 1.84.0's course words shipped, the course's own Arabic words are found too (the
   word with or without vowel marks, its meaning, its example), each opening its lesson (a starter word: Vocabulary,
   at that word). Your kept words stay listed as your own.
5. **Ask MyDay:** later, as its own step — this search becomes Ask MyDay's lookup through the privacy filter (never
   anything private), with an evaluation and the owner's OK. Not in this release.

## 3. What changes

- A **Search** button (magnifier, "Search MyDay") beside + in the header opens `#search`. The / key opens it too,
  except while typing in a field. The page has one field, focused, and keeps what you typed in the address
  (`#search?q=…`), so Back returns to your results.
- **Results** are grouped by section in a fixed order — Tasks, Projects, Notes, Calendar, Study, Finance, Health —
  each with its count ("Tasks · 3"), and a heading for all of them: "12 matches for “armchair”" (a screen reader hears
  the count). Within a section: open things first, then paused, then done or let go (marked). No ranking, no scores.
- Each result says what it is ("Task", "Decision", "Kept word", "Lesson"…), where it is when that helps ("in
  “Garden shed”", "Arabic · Module 4"), and, when the match is in longer text, a short excerpt, as project search
  does. It's a link that opens the item (or its screen, where there's no page for the one item).
- **Nothing found:** "Nothing in MyDay matches “…”.". Whenever anything private exists, the page says under the field
  that private projects and notes aren't searched here.
- **Matching** is project search's: every word must appear, in any order; capitals, accents (Arabic vowel marks too),
  the Arabic stretching line (tatweel, now also in project search) and the kind of apostrophe don't matter. Only your own words are searched, never MyDay's labels — except the course lesson and module
  titles, which you asked to find.
- At most 50 results a section are shown, with "And 12 more — add a word to narrow it down." when there are more.
  Excerpts are cut only for what's shown, and the search follows your typing when it can, so a large account stays
  quick.

## 4. What each section searches

- **Tasks:** title, notes, who or what it waits on, its steps. In a project: "in “Project”". Its own page opens.
- **Projects:** each open, paused or done project (not private) through `searchProject` — its own words, milestones,
  decisions, one page, case records, links and research. Its tasks and notes are under Tasks and Notes instead, so
  nothing shows twice. A link opens the way Search this project opens it, and the item itself is brought into view and
  focused (as ProjectView's `focusItem` does). Once myday-51's optional Overview sections ship (1.85.0), a link in a
  folded or hidden Resources card opens that card for the visit (`openOnArrival`).
- **Notes:** title and text, not private, not in a private project.
- **Calendar:** appointment and work titles, with their day and time (coming ones first, soonest first, then past
  ones, marked); opens the calendar on that day (`#calendar/<day>`, new: the Calendar opens on a linked day). A private
  project's appointments aren't searched.
- **Study:** your own courses (stage, course, module, section and task titles, task notes), topics, Reading (book
  title, author, your book notes), Arabic kept words (the word — with or without vowel marks — your meaning and your
  note), your "Needs revision" notes and session answers, revision cards (one an AI wrote is marked "AI-made"; its
  explanation isn't searched), check-ins, Cybersecurity notebook answers and portfolio items; the Arabic and
  Cybersecurity module and lesson titles (and a module's purpose), as their "Find a module or lesson" boxes do; and the
  course's own Arabic words. The two course catalogues are loaded only when Search opens.
- **Never searched** (myday-86): a lesson check's reference answers (searching them would give them away), a kept
  "another way" explanation or other AI-written text, and revision cards' schedules.
- **Finance:** the names and notes you gave money owed and monthly expenses (Finance has one page: the card is brought
  into view).
- **Health:** recipes (with their ingredients and tags), the shopping list, exercises, workouts and daily exercises.
- **Tasks** also: your task lists by name, and the items on Today's task lists ("Your task lists").

## 5. Saved data, sync and AI

Nothing is saved (what you typed lives in the address only). No sync, schema or database change. Nothing is sent to
AI or any service.

## 6. Checks

- Rules (`tests/search-rules.test.js`): each section's sources found and linked; every word in any order, accents and
  apostrophes; MyDay's labels not matched; private projects, their tasks and notes, and private notes never found;
  order (open, paused, done); the 50 cap and "more"; nothing shown twice.
- Browser (`tests/app-search.test.js`): the button and the / key (not while typing); the field focused; results,
  counts and the heading read out; each kind of link opens its item; Back keeps the results; phones (no sideways
  scroll, 44 px targets); light and dark.
