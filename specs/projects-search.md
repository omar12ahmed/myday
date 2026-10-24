# Searching one project

**Status:** built under the owner's advance approval of 24 October 2026 (build and publish, taking the
recommended option on routine choices; stop for saved data, AI, the live database, deletion or a real product
choice). Phase 1, release 4 of `specs/projects-vision.md`. Not yet released.
**Based on:** source at release 1.51.0 (started on 1.50.0).

## 1. The practical problem

A project collects tasks, notes, milestones, decisions and, for a business idea or a case, its own records. Finding
"where did I write the electrician's number?" means opening tabs one by one. Notes has a search across all notes, but
nothing searches one project's own things together.

## 2. What changes

- **"Search this project"**, a search field at the top of every project page, under its tabs.
- While there's something in it, results show above the tab, which stays as it was but hidden (so nothing being
  typed there is lost): "4 matches for “armchair”", in a fixed order by kind, each a link that opens the item.
  **Clear**, Escape or choosing another tab ends the search. A screen reader hears the count.
- **What it searches:** the project's name and own words (summary, what it's aiming for, what counts as finished, where
  you left off); its tasks (title, notes and who they're waiting on; done and let-go ones after the rest, marked); its
  notes (title and text); milestones;
  decisions (question, options, pros, cons, reasons and previous choices); a business idea's one page (answers and what
  must be true, with what was found); a case's timeline, evidence and issues. A kind of project's hidden tools (a
  business idea's one page kept after switching back to general) aren't searched, because their tab isn't shown.
- **Matching:** every word you type must appear, in any order; capitals, accents and the kind of apostrophe don't
  matter ("cafe" finds "Café", "Sam's" finds "Sam’s"). Only your own words are searched, never MyDay's labels. Each
  result shows its kind (private notes marked) and, when the match is in longer text, a short excerpt cut on whole
  characters and, where possible, whole words.
- **Opens:** a task or note opens itself; a milestone, decision, one-page item or case record opens its tab with that
  item brought into view and focused; the project's own words open the Overview at About it.
- Calm and plain: no scores, no ranking by relevance, no counts beyond the number of matches.

## 3. Saved data, sync and AI

Nothing is saved: the search lives only on the page. No sync, schema or database change. Nothing is sent to AI or any
service; it searches the data already on the device, including private notes and projects.

## 4. Decisions taken under the advance approval (recommended options)

1. A visible search field on every project tab, rather than a hidden button.
2. Results show above the tab while searching, with the tab kept but hidden (changed after review: replacing it lost
   unsaved drafts).
3. All words must match; capitals, accents and the kind of apostrophe ignored; no fuzzy matching.
4. Done and let-go tasks are included, after the rest, and marked.

## 5. Checks

- **Rules:** each kind is found and opens the right place; all words must match; accents, capitals and apostrophes;
  MyDay's labels aren't searched; excerpts in other scripts and with emoji; hidden tools aren't searched; done tasks
  come after open ones; an empty query finds nothing; another project's items never appear.
- **Browser:** typing shows results and hides the tab (a draft there survives); Clear, Escape and another tab restore it;
  each result opens and focuses its item; the count is announced; nothing found; phone at 320 px; keyboard (the field
  is a labelled search box; results are links in reading order).
- **Visual (Taste skill):** results on desktop and phone, light and dark.
