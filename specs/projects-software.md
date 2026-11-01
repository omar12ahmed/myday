# Software projects: requirements, bugs, release checklists and code links

**Status:** the owner's decisions in §2 (1 November 2026); being built on branch `software-tools`. Nothing live without
the owner's yes; a new synced kind needs a migration, applied with the owner's yes.
**Based on:** source at 1.120.0. Plan: `specs/projects-vision.md` §6 ("Templates choose tools; they do not limit the
project"; "a small typed capability definition should replace that repetition when the first new tool or template is
approved"), §10 "Software development" (requirements and acceptance criteria, technical decisions with rationale,
tasks/bugs/milestones, test evidence and release checklists, references to repositories, issues and pull requests;
"a repository link is a resource; it is not evidence that MyDay knows the repository's current state"; "release
readiness should come from defined checks, not an unexplained score"), Phase 3 ("software requirements and acceptance
checks … complete it end to end").

## 1. The practical problem

Building software — MyDay itself is one — means keeping track of what it must do, how you'll know it does, what's
broken, and whether a release is ready. Today a project has tasks, milestones, decisions and plain links, so
requirements live in notes, bugs are ordinary tasks, "is it ready?" is a feeling, and a link to a repository or pull
request looks like any other web page.

## 2. The owner's decisions (1 November 2026)

1. **Everything in the plan, in one release:** requirements with acceptance checks, a Bugs list, links marked as
   repository / issue / pull request, and release checklists with test evidence. Decisions (with their "why") and
   milestones stay as they are.
2. **Releases: a checklist on a milestone.** Mark a milestone as a release; its checklist gathers the acceptance checks
   of the requirements in it plus your own checks; each tick can say what proved it. Ready means every check ticked —
   no score.
3. **Bugs: a Bugs list.** Each bug: what happens, what should happen, steps to repeat it, and open / fixed / won't fix.
   "Fix it" makes a task linked to the bug.
4. **Code links: marked links now; a live GitHub connection later**, as its own step (it needs a sign-in and a server
   change). MyDay never claims to know a linked repository's, issue's or pull request's state.

## 3. What you see

- **A new project type, Software** (the new-project form and the type switcher; "Software" beside General, Business
  idea, Case, Research and Content). Its tabs: **Overview, Requirements, Bugs, Milestones, Decisions** (and Research
  when it's on, as for any project).
- **Overview:** a "Software at a glance" card, in words and counts: "5 requirements · 12 of 18 acceptance checks
  ticked", "2 bugs open", and the next release: "Release 1.2 — 3 checks left, 1 bug open" or "Release 1.2 — ready".
- **Requirements** (`#projects/p/<id>/requirements`): each requirement has a title, a line of detail if you like, a
  state (**Proposed → Agreed → Built → Dropped**), its **acceptance checks** ("Given…, when…, then…" or plain lines),
  the release it's in (a milestone marked as a release), and links it points at (a pull request, an issue). Tick an
  acceptance check when it's proven, and say what proved it ("tests/app-projects [56] 1281/0", or a link) — the day is
  kept. Add, reorder, edit; a dropped requirement stays, out of the counts.
- **Bugs** (`#projects/p/<id>/bugs`): each bug: its title, **what happens**, **what should happen**, **steps to repeat
  it**, **open / fixed / won't fix** (with the day), the release it's in, and links (the issue, the pull request that
  fixed it). **Fix it** makes a project task "Fix: <bug>" linked to it (once; the bug then shows its task and whether
  it's done). Open bugs first, then fixed and won't fix (folded).
- **Milestones:** any milestone can be **marked as a release**. Its **release checklist** shows, in order: the
  acceptance checks of the requirements in it (grouped by requirement; ticking here ticks the requirement's check),
  your own release checks ("Backups exported", "Live check on C") with the same tick-and-proof, and the bugs in it that
  are still open. It says **"Ready: every check ticked and no bug open"** or what's left ("3 checks left · 1 bug
  open"). Unmarking a release keeps its own checks, out of sight.
- **Links** (the project's Links card, any project): a link can be marked **Repository, Issue or Pull request** (or
  left plain); it shows where it points ("github.com/owner/repo", "Issue #12", "Pull request #34") read from the
  address — never a state. A requirement or bug can point at the project's links.
- **Switching type** keeps everything: switch a Software project to General and its requirements, bugs and release
  checklists are kept, out of sight; switch back any time (the toast says so).
- No percentages, scores or streaks — words and counts, as the rest of MyDay.

## 4. How it works

- **Saved data (schema stays 5, the AGENTS.md exception):** a new top-level section `software: { items }` keyed by
  `projectId`, like Research and Content, one record per item in a new synced kind **`software`** (migration
  `<date>_sync_software.sql`, built from the live lists, applied first with the owner's yes). An item is one of:
  - `requirement`: `{ id ('sr'+uid), type, projectId, title, detail?, state: 'proposed'|'agreed'|'built'|'dropped',
    checks: [{ id, text, done?, proof?, on? }], releaseId?, linkIds?: string[], createdAt, updatedAt }`;
  - `bug`: `{ id ('sb'+uid), type, projectId, title, happens?, expected?, steps?, state: 'open'|'fixed'|'wontfix',
    closedOn?, taskId?, releaseId?, linkIds?, createdAt, updatedAt }`;
  - `release`: `{ id ('sl'+uid), type, projectId, milestoneId, checks: [{ id, text, done?, proof?, on? }], off?: true,
    createdAt, updatedAt }` — a milestone is a release while it has a release item that isn't `off`.
  Read as written: an item or check of a type this version doesn't know is kept; unknown fields kept. A requirement's
  or bug's `releaseId` names the release item, so a renamed milestone needs nothing.
- **The project type:** `template: 'software'` (`data/businessModel.ts`). 1.120.0 keeps an unknown template as written
  and hides its switcher (`knownTemplate`), showing the project as General with its tasks, milestones and decisions.
- **Marked links:** a resource gains an optional `kind: 'repo' | 'issue' | 'pr'` (a field on the project record's
  resources, which 1.120.0 keeps as written — checked with the actual previous release). Where it points is parsed from
  the address (GitHub and GitLab paths; otherwise the host).
- **A small typed definition of the project types** (`data/templates.ts`, as the vision asks once a new type is
  approved): each type's label, tabs and what the switch toast says it keeps. The tab list, the tab routes, the type
  switcher and the new-project form read it, instead of repeating the conditions. Other places keep their own checks
  for now. (This also fixes the switcher showing a Content project as "General".)
- **Limits** per project: 200 requirements (20 checks each, a check 300, proof 300), 500 bugs, 30 releases (30 own
  checks each); a title 160, a detail / happens / expected 2,000, steps 4,000; 12 links per item.
- **Deleting a project** deletes its software items (like its research and videos); the task "Fix: …" stays, as a
  project's tasks do.
- **AI:** nothing of a requirement, bug or release is sent to AI (ai/reach.ts's never list); myday-94 told.
- **Content fixes riding along:** the 1,000-video cap is for all projects together, and now says so when reached
  ("That's 1,000 videos across your projects — the most MyDay keeps."); the script and transcript fields no longer
  miss a change from another device of the same length (keyed by the text, not its length); the type switcher shows a
  Content project as Content and the toast says its videos are kept.

## 5. Checks

Rules (reading as written, limits, each item's changes, checks ticked with proof, a release's checklist and readiness,
open bugs blocking, Fix it once, marked links and where they point, deleting a project, the type definition's tabs);
sync (records, the database accepts the kind, two devices, the previous release keeping the section, a marked link and
the template); browser (the type, each tab, a release checklist ticked to ready, Fix it, marked links, switching type
and back, phone 390 px); live (a made-up Software project with a requirement, a bug and a release ticked to ready on
two devices; deleted afterwards).
