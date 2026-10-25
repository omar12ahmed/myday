# Projects: Research (Phase 3, first workflow)

**Status:** the owner chose Research as Phase 3's first workflow and made the decisions in §2 (24 October 2026).
Released in 1.77.0 (25 Oct 2026, the owner's advance yes): the migration `20261025180000_sync_research.sql` was applied
after a backup and a rehearsal that rolled back, and the app was published.
**Based on:** source at 1.73.0. Plan: `specs/projects-vision.md` §6 (templates choose tools), §10 ("Research and
investigation"), §12 (notes, resources, files), §17 (Phase 3).

## 1. The practical problem

Researching something (the Hargeisa marketplace, a purchase, a health question) means collecting what you read and
heard, noting what it told you, and working towards an answer, while remembering where each piece came from and how
far to trust it. Today that lives in loose notes and links: nothing says which finding came from which source,
whether it supports or contradicts what you think, or which questions are still open.

## 2. The owner's decisions (24 October 2026)

1. **A tool any project can turn on:** a Research tab you switch on for any project (offered on Business projects);
   turning it off hides it and keeps everything. Also **Research** as a kind of project when you start one.
2. **Sources reuse what's there, plus typed:** a link from the project's Resources, a file from its Files, a note, or
   a source you type (a book, a conversation, an interview). One copy of each; nothing duplicated.
3. **On a Business project, findings are evidence for "What must be true":** a finding can support or contradict one
   of the things that must be true; you still mark it "looks true" or "doesn't hold" yourself. MyDay never decides.
4. **Not sent to AI** in this first release (like files); decided later, with a preview of what would be sent.

## 3. What you see

- **Turning it on:** in a project's About it → Edit, "Research: On / Off" (`project.tools` holds `research`). A Research
  kind of project has it on from the start. A Business project without it shows one quiet line on its Model tab:
  "Collect what you find out in Research" with a Turn on button.
- **The Research tab** (`#projects/p/<id>/research`), in three parts:
  - **Questions** (open first, then answered): what you want to find out. Each shows its findings (supporting,
    contradicting, other), and **What you concluded** once you write it ("Answered" with the day). An answered question
    can be reopened. "No findings yet" when there are none.
  - **Findings:** what you found, each with its source(s), the day you found it, and **Limits** (how far to trust it:
    a small sample, one person's view, out of date…). It can be about one or more questions, and on a Business project
    one or more of the things that must be true, each as **supports**, **contradicts** or **relates to**.
  - **Sources:** each is a link from Resources, a file from Files, a note of yours, or typed (a title, who or where
    it's from, its date). A source lists the findings that use it. Opening it opens the link, the file or the note.
- **Adding:** "Add a question", "Add a finding" (pick sources, then what it's about), "Add a source". The finding form
  offers to add a source on the spot.
- **On the Model tab** (Business): each thing that must be true shows its evidence: "2 findings support it · 1
  contradicts it", which opens them. The "looks true" / "doesn't hold" choice stays yours.
- **Removing:** a question, finding or source is removed after "Remove …?". Removing a source takes it out of its
  findings (they keep their text); removing a question takes it out of its findings. A link, file or note used as a
  source is never deleted by Research.
- **Search this project** also finds questions, findings, limits, conclusions and typed sources.
- **Words and counts only:** no scores, no "confidence" numbers.

## 4. How it works

### Saved data (schema stays 5)

- **A top-level `research` section** `{ items: ResearchItem[] }`, one record per item, each with `projectId`:
  - question: `{ id, type: 'question', projectId, text, conclusion, answeredOn, createdAt, updatedAt }`;
  - source: `{ id, type: 'source', projectId, ref: { kind: 'resource' | 'file' | 'note', id } | null, title, from,
    on, createdAt, updatedAt }` (typed when `ref` is null; for a reused one, `title` is what it was called when added,
    so it still reads well if the link, file or note goes);
  - finding: `{ id, type: 'finding', projectId, text, limits, on, sourceIds, about: [{ kind: 'question' |
    'assumption', id, stance: 'supports' | 'contradicts' | 'relates' }], createdAt, updatedAt }`.
  - Unknown fields, types and stances from a newer MyDay are kept.
- **`project.tools`**: optional string list (`['research']`); `template: 'research'` for the Research kind. An older
  release keeps both (unknown fields; an unknown kind is kept and not offered to change).
- **Sync:** each item is its own record of the new kind `research`, deletable (a constraints-only migration adding
  `research` to the two kind lists, as for `file`). Not a project part, so the split-project functions don't change.
- **Deleting a project** deletes its research items with it (they belong to it), here or when the project's deletion
  arrives from another device (which may not know Research): the sync engine then deletes the project's research
  here and sends those deletions. A research deletion that arrives while its project is still here with its
  deletion undecided (a conflict) waits. Nothing is deleted just because a project is missing (a project refused by
  the account, say, still has its research on the device that made it).
- **A source points only at this project's** links, files and notes (checked when it's added).
- **Changing kind:** leaving the Research kind keeps Research switched on (`tools`), so its tab stays.
- **Limits:** 200 questions, 300 sources and 1,000 findings per project; texts as Notes' and Resources' limits.
- **Backups and export** include them (they're your data). Delete everything deletes them (they're records).

### In the app

- `app/src/data/research.ts`: the records, normalizing, add/edit/remove, the links (sources, about), evidence for an
  assumption, per-project lists. `sync/engine.ts`: research follows its project's deletion. Records are ordered by
  when they were made, the same on every device.
- `app/src/projects/ResearchView.tsx`: the tab; `project.tools` and the Research kind in `ProjectView.tsx`; the Model
  tab's evidence line in `ModelView.tsx`.
- `app/src/sync/records.ts`: the `research` kind. `app/src/data/projectSearch.ts`: research text.
- `app/src/ai/reach.ts`: "never: research (questions, findings, sources, conclusions)".

## 5. Privacy and safety

- Never sent to AI: no request builder reads `research`; the ai-rules [Privacy] world plants a secret in every field.
- Private projects' research is as private as they are.
- Removing never deletes the link, file or note a source points to.

## 6. Checks

- **research-rules:** normalizing (unknown kept, bad items counted, idempotent), add/edit/remove for each type,
  removing a source or question unlinks it from findings, evidence for an assumption (supports/contradicts counts),
  limits, deleting a project deletes its items, search hits only while Research is on.
- **sync-records / sync-db:** the `research` kind round-trips; the migration accepts it, isolates it, tombstones it.
- **app-projects (browser):** turn Research on/off (kept when off), the Research kind, add a question, a typed source,
  a source from Resources/Files/Notes, a finding with two sources about a question and an assumption, the conclusion
  and Answered, reopen, remove each (asked first), the Model tab's evidence line, search finds them, 320 px, keyboard.
- **app-sync / app-sync-previous:** items sync to a second device; the previous release keeps the section, the
  fields and the kind; deleting a project there: this release then deletes its research as the deletion arrives.
- **ai-rules [Privacy]:** a SECRET- value in every research field of a private and an open project; none reaches AI.
- **Live:** after the migration (rehearsed first), on disposable account A: a made-up research project synced to a
  second device, then tidied.
