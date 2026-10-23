# Project section review — 22 October 2026

This review traces the React implementation and its shared storage, classic compatibility, account records and AI request paths. It uses synthetic data only. Existing workspace changes were preserved. This is a local review; nothing was published, migrated or tested against a live account or AI provider. The later split-project storage implementation is described below and in `../supabase/PROJECT_STORAGE.md`. Earlier verification sections remain historical records.

## Changes made

- Allow ten pros and ten cons per decision option, through the manual controls and the checked AI proposal path. The eleventh is refused; removing a point makes room again.
- Keep unknown fields inside a saved decision's `lastChoice`, as already happens for the surrounding decision and option. This prevents a read, restore or sync round trip from erasing future details of that previous choice.
- Require a new Ask preview after an external data replacement. Previously, Capture retained its opening preview even if another tab subsequently made that project private. The send path now catches up with local storage before sending, rejects late replies after replacement, and refuses Add/Apply from the old proposal. The user closes and reopens Capture to review current context.
- Explain the existing AI context limit: only the first six pros and six cons per option are sent. The locally saved limit is ten. The server contract and outgoing payload allowance were not enlarged.

The initial review introduced no saved fields or record kinds. The subsequently approved decision-history improvement adds optional saved data as described below; neither change has been released or deployed by this task.

### Approved follow-up: decision history

- Previous choices now retain their option label, reason and original decision day in an optional, oldest-first `Decision.history` array. The card's **Previous choices** disclosure presents them newest first, including the year, with wrapping text and keyboard access. Same-day choices retain their action sequence.
- Think again and removing a chosen option snapshot it before clearing the current choice. Choosing again cannot replace a past reason. Direct replacement through the domain function also archives the previous choice. The current reason remains available as the next choice's editable starting point; changing an option or reason cannot edit an archived snapshot.
- Older saves are read without being rewritten. The next relevant action explicitly carries their known `lastChoice` forward. When that decision is open, its kept reason belongs to that choice. When already decided again, the older reason cannot be recovered and the UI says it was not saved. Earlier choices already overwritten by older releases cannot be reconstructed. `lastChoice` is still maintained for older copies.
- History remains nested in the local project, backups and restores. The later split-project sync upgrade sends each retained snapshot separately. Unknown nested fields survive normalisation and sync. Older copies preserve the new optional array unread, but cannot record new history. The history feature itself introduced no new sync kind; the later storage upgrade adds split wire kinds and an explicit migration. This remains an unreleased schema-4 development change; a release must satisfy `AGENTS.md`'s schema-version and compatibility requirements before publication. No real-data conversion was run.
- History is retained until its decision or project is removed. It has no silent count cap or pruning. All project-writing paths now share the conservative 380,000-byte allowance per split record through `data/projectSize.ts` and `data/storage.ts`; growth beyond it is refused atomically. An oversized item may remain unchanged or shrink. Total project size is no longer one cloud record.
- Decide, Think again, option removal and decision removal now use the checked save result. If browser persistence fails, the existing choice stays on screen and in storage; a new reason draft remains available to retry. The later storage upgrade also makes ordinary `update` retain its previous snapshot when browser persistence fails; project add forms use the checked result before clearing drafts or announcing success. Existing memory-only editing when storage is unavailable remains.
- No stage, task, Today, Recently or AI-context behaviour changed. This records choices and their reasons/days, not every edit or the exact moment a decision was made. History is excluded from the AI request and preview.

## Implementation map

| Concern | Underlying implementation |
| --- | --- |
| Routes and screen ownership | `src/App.tsx`, `src/shell/legacyLinks.ts`, `src/projects/ProjectsScreen.tsx`, `src/projects/ProjectView.tsx` |
| Creation, board, stages, links, next step, Recently, deletion | `src/data/projects.ts`; controls in `ProjectsScreen.tsx`, `ProjectView.tsx`, `projects/parts.tsx`; Capture/Ask creation in `src/capture/save.ts`, `src/ai/ask.ts` |
| General, Business idea and Case types | `src/data/businessModel.ts`: `TEMPLATES`, `knownTemplate`, `isBusiness`, `isCase`, `setTemplate` |
| Milestones and decisions | `src/data/types.ts`, `src/data/projectPlan.ts`, `src/projects/PlanViews.tsx` |
| Dashboard and overview | `src/data/projectDashboard.ts`, `src/projects/AtAGlance.tsx`, feature summary cards in `PlanViews.tsx`, `ModelView.tsx`, `CaseViews.tsx` |
| Business Model | `src/data/businessModel.ts`, `src/projects/ModelView.tsx` |
| Case | `src/data/caseFile.ts`, `src/projects/CaseViews.tsx` |
| Tasks and Today | `src/data/tasks.ts`, `src/data/plan.ts`, `src/data/projects.ts`: `nextStep`, `stepsForToday`; Today and task screens |
| Notes and Connections | `src/data/notes.ts`, `src/data/understand.ts`, `src/data/graph.ts`, `src/notes/`, `src/projects/ConnectionsView.tsx` |
| State, local storage and backup | `src/data/useMyDay.ts`, `src/data/storage.ts`, `src/data/normalize.ts` |
| Sync | `src/sync/records.ts`, `src/sync/engine.ts`, `../supabase/migrations/20261006120000_sync_projects.sql` and existing sync migrations |
| AI context, preview and confirmation | `src/ai/askContext.ts`, `src/ai/ask.ts`, `src/capture/AskPanel.tsx`, `../supabase/functions/_shared/ai/ask-shape.ts` |
| Other AI privacy paths | `src/ai/context.ts`, `src/ai/connect.ts`, `src/notes/NoteEditor.tsx`, `src/notes/NoteCards.tsx` |

## Behaviour confirmed

### Milestones

`Project.milestones` is an optional ordered array. It is not a second task list.

| Requested behaviour | Result and implementation |
| --- | --- |
| Title and optional target date | `addMilestone` trims the title and stores a valid `aim` date or `null`. Blank titles are refused. |
| Intended order | Array order is retained through normalisation, storage and sync; the UI renders an ordered list. Target dates do not reorder it. |
| Next unreached milestone | `milestoneProgress` finds the first item without `reachedOn`; the list marks it Next and the overview names it. |
| Reach and record date | `setReached(true)` records the local day. Repeating the action does not replace that day. |
| Undo and clear reached date | Not yet calls `setReached(false)`, which sets `reachedOn` to `null`. |
| Edit title/date; clear date | `editMilestone` handles both fields. Clearing the date picker or using Clear the date stores `null`. |
| Reorder | Up/Down swap neighbours. Moving beyond either end is refused. The next marker follows the new order. |
| Remove with confirmation | The in-app confirmation must be accepted before `removeMilestone`. Removing the last item removes the optional array field. |
| Overview progress | Counts and the next title come from the same `milestoneProgress` helper used by the list. No personal progress percentage is introduced. |
| Maximum 30 | The data function refuses a 31st item; the UI replaces the add form at 30. |
| Phone and desktop | Responsive controls, wrapping titles, date editing and 44 px controls are covered by the project browser suite and visual inspection. |

### Decisions

`Project.decisions` is an optional array. A newly captured question may have no options while it is being written; deciding requires a real option.

| Requested behaviour | Result and implementation |
| --- | --- |
| Create question | `addDecision` trims a nonblank question and creates an open decision. |
| One to four options | `addOption` caps additions at four. One option is sufficient for `decide`; a question without options cannot be decided. |
| Ten pros and ten cons per option | The shared `PLAN_LIMITS.points` is now ten. Manual additions and checked AI proposals count existing and proposed points. The sides have separate limits. |
| Choice, optional reason and decision date | Choose this opens a reason field; Decide calls `decide`, saving `chosen`, `why` and the local `decidedOn` day. Cancel saves no choice. |
| Think again | Clears `chosen` and `decidedOn`; retains the question, all options, their points and the current reason. |
| Previous choices | Reopening snapshots the option text, day and reason in `history`, also maintaining `lastChoice`. The disclosure shows all retained snapshots newest first. The kept current reason is pre-filled when choosing again. Older saves can recover only the previous choice they still know about. |
| Remove selected option | `removeOption` reopens before removing that option, retaining its previous text/day and the reason. The UI explains why the decision reopened. |
| Ordering | `decisionsInOrder` returns open questions first, newest created first; then decided questions by decision day descending, with `updatedAt` as a tie-breaker. See the same-day limitation below. |
| Overview | `DecisionsCard` shows up to three open questions, or the most recent decided choice when none are open. |
| Maximum 12 | The data function refuses a 13th question; the UI removes the add form at 12. |
| Phone and desktop | Options are side by side at wider widths and stack on phones. Essential actions remain in the document and controls are at least 44 px tall in the browser checks. Long single-line point text remains a usability improvement below. |

The limits above govern additions. Import/normalisation deliberately retains readable over-limit arrays rather than silently destroying existing or future-version content.

### Workflow and connected information

- Projects home explicitly offers General, Business idea and Case. A Business idea opens its Model; the other types open Overview. Capture and Ask use `addProject` without a template, creating General projects; the type can subsequently be changed explicitly.
- Seven stages are persisted: Capture, Understand, Organise, Explore, Decide, Act and Reflect. The board groups these into Ideas, Exploring and Doing. Moving a board card is explicit; moving forward selects the next column's first stage and moving back its last stage.
- A decision does not call a task function, touch the day plan or change the stage. A decided question at Decide separately offers Move it; only that action changes the stage to Act/Doing. Milestone changes also leave tasks, notes, appointments, queue, stage, status and next step untouched.
- A next step is a reference to an existing project task, or the first open task if that reference is unavailable/done. Tasks are ordered by date/time, then creation. Add to today still uses `addToTodaysPlan`, including the existing built-day, rest-day and energy-cap rules.
- Project notes remain ordinary note records linked by `projectId`. Connections derives nodes and edges from those records and existing links; it does not copy note content into the project. Automatic note filing and its provenance are separate from milestones and decisions.
- Appointments remain Calendar commitments. The project stores `commitmentIds`; Coming up reads the original commitment records alongside dated tasks.
- Recently derives up to five rows from current records, newest first. Reached milestones and currently decided questions appear with links to their tabs. Undo/reopen removes their current completion event; the feed is not a permanent history. Day-only completions receive synthetic end-of-day times, so the feed is not an exact intra-day chronology.
- Deleting a project removes its internal milestones, decisions, Model and Case data. `deleteProject` removes project links from tasks and notes, retaining those records; Calendar commitments and existing day plans survive. The confirmation states this distinction.
- General and Business projects retain their existing tabs. A Case retains Overview, Timeline, Evidence and Issues; its milestone and decision cards open those pages from Overview. Model and Case deep links on an incompatible type fall back to Overview.
- Switching types retains Model/Case content out of sight. Business Find out remains an explicit action creating one ordinary linked task; marking an assumption is separate. A Case deadline remains an ordinary dated task. None of these paths was rewritten.

## Persistence, sync, offline and AI boundaries

React state is a subscription to one store. `update` clones the current data and all saved-data access passes through `storage.ts`. The shared local key remains `myday.data.v4`. Normalisation keeps optional project arrays and unknown project/feature fields; the classic app preserves the top-level Projects section unread. `mendHalves` still repairs invalid UTF-16 at the save/read/sync boundaries.

Exports contain the complete project records. Restore parses and normalises the backup and replaces store state after the existing confirmation. This includes order, target/reached dates, decision points, reasons and the complete retained choice history. No automatic reset or bulk read-time migration was added; the follow-up's conversion on explicit actions is described above.

The later storage upgrade projects each complete local project into separate account records: core details,
milestones, decisions, individual previous choices, Model, Case metadata and individual Case items. Each keeps
the existing 524,288-byte database cap; total project size can exceed it. Independent item edits merge, while
same-item edits and deletion races retain version conflicts. Parent deletions tombstone descendants. Incoming
pages are assembled before one checked local save. The original cloud project is retained in a read-only,
account-isolated recovery table during migration. Updated MyDay is required for cloud sync after migration;
older versions keep their local data. See `../supabase/PROJECT_STORAGE.md` for rollout and rollback details.
The local stand-in exercises real migrations; it is not the hosted Supabase service.

Once the application is available on the device, its editing logic uses local storage without a network requirement. Refresh/install caching is supplied by the existing service worker/build path. This task exercises offline sync edits through the stand-in; it does not claim a new full offline-install audit.

Ask sends only the current page's bounded slice, with a preview. Private projects are excluded from open-project names, project pages, linked tasks/notes, Today copies and linked appointment names. Private notes are excluded. A business Model is included only from its Model tab; findings are excluded. Case timelines, evidence and issues are excluded regardless of the Private switch. Milestones send titles, target dates and reached flags. A focused decision sends its question/options and the first six points per side, not reasons or decision history. Suggestions are validated and only saved after Add/Apply.

The Private switch is explicitly documented as an Ask boundary. AI note filing can still send a private project's name/summary as a possible destination; the project hint discloses this. The separate day-adjustment context includes plan task titles without checking project privacy, and revision-card generation checks a note's own privacy flag rather than its project's flag. These are important policy differences, not a global guarantee that a private project's contents never reach any AI tool.

## Architectural risks and recommended future work

These are findings and suggestions, not an implementation of configurable workspaces.

1. **Addressed in the storage follow-up: failed persistence advancing memory.** Ordinary `update`, checked saves and replacements now keep the old snapshot when a browser write fails. Project add controls check the save result before clearing their draft or announcing success. Other feature UI may still use domain results for its wording; a full application-wide success-message audit was not part of this task. The intentional storage-unavailable memory-only mode remains.

2. **Addressed in the storage follow-up: a whole project as the size/conflict boundary.** Projects now have separate wire records with the unchanged 524,288-byte database limit and a shared 380,000-byte editing allowance per record. This covers every project save and AI batch at the store boundary. Decisions, individual retained choices and Case items can grow the project beyond 512 KiB in total. Individual items and browser localStorage still have limits. The new migration, old-client refusal, parent-deletion semantics and recovery archive require the coordinated release described in `../supabase/PROJECT_STORAGE.md`; no live migration ran.

3. **High: privacy policy differs by AI job.** The present Ask policy is tested, including the stale-preview fix. Note filing, day adjustment and note revision cards have the distinctions above. Agree whether Private should govern every AI job; show the effect clearly and centralise eligibility only after that product decision. Also make the expanded preview honest about abridgement: `askPreview` clips some long note text to 300 characters while its request may contain up to 3,000. Offer the full text before describing it as everything sent. Do not silently enlarge AI context to include all ten points, Case records, hidden tool data or arbitrary connected records.

4. **Medium: type and tool availability are scattered.** Template definitions live in `businessModel.ts`, while routes, `ProjectTab`, tab lists, Overview composition, dashboard tiles, Explore eligibility and AI context repeat business/case conditions. A new type needs coordinated edits across these files. When a real fourth type is approved, introduce a small typed capability definition for its routes, tools, summary and AI allowance. Keep the current domain rules; a generic plugin framework is premature.

5. **Medium: Overview owns each feature's composition.** `ProjectView` imports every feature view and summary; `AtAGlance` imports `AiHelp` from `PlanViews`, coupling an overview to planning UI. Milestone progress appears in a tile, a route picture and a separate card; Model and date summaries overlap too. With an agreed layout change, give each summary one job and let feature modules expose small summary contracts. Remove repeated facts before adding more cards.

6. **Medium: exact chronology remains limited.** The approved follow-up now retains previous choices, reasons and days; the earlier loss of reasons on choosing again is addressed. History preserves action sequence, including choices on the same day, but does not invent missing older reasons or exact decision times. The main decided-question list still sorts by decision day and editable `updatedAt`; editing an older decision can change its position among questions decided that day. Recently and weekly counts still derive current state. An exact event log or immutable choice timestamp needs a separate product decision and compatibility plan.

7. **Medium: relations have different ownership.** Notes/tasks point to a project; projects point to appointments; assumptions point to tasks; Today keeps linked planning snapshots. These are existing deliberate compatibility boundaries, not redundant milestone/decision models. Sync applies records individually: a project tombstone alone does not clear foreign references, and related updates can arrive at different times or conflict. Define reusable link/deletion semantics before supporting arbitrary cross-project connections. Continue using original task/note/appointment records rather than copying them into new tools.

8. **Medium: draft lifetime needs an explicit boundary.** Planning drafts are held in a module-level Map until the page closes; other feature editors have their own state conventions. They are not backup data and can outlive leaving the project. Specify whether future drafts survive tab changes, imports, sign-out and account changes; scope them accordingly. Never attach private draft content to AI context implicitly.

9. **Usability: improve navigation and reading before adding tools.** Case milestone/decision pages have no selected primary case tab. On smaller screens a decision's single-line option/point inputs clip long content, and ten-point options require substantial scrolling. Prefer wrapping read text with an explicit editor, accessible full titles and a clear current tool location. The existing phone layout has no page-level horizontal overflow, but that alone does not prove comfortable reading.

10. **Low: small accessibility details remain.** Editing a decision question removes the heading named by its card's `aria-labelledby`; the project navigation uses tab roles for route links without a complete tab/panel keyboard pattern. Milestone route/progression lists insert a decorative span directly under `ol`. Correct these semantics in a focused accessibility pass without changing the data model or adding new navigation systems.

The useful foundation is already present: separate UI and domain functions, optional tool data inside projects, real links to shared records, derived summaries, validated proposals and explicit user actions. Preserve those boundaries as layouts become more flexible.

## Visual review

The existing Clarity design was retained; no new style was drawn. The synthetic fixture is a reading-room project with three milestones (one reached) and a two-option chair decision. It lives only in a temporary inspection copy, not in application starter data.

- **Question and hierarchy:** Milestones answers “What is the next marker?” with the ordered list, Next label and reached count. Decisions presents the question and options clearly, although its header and add form delay the first option on a phone.
- **Edges and space:** the content and cards share their containing edges; the decision grid becomes a single column on phones. No layout rewrite was needed for the limit change.
- **Colour:** milestone state has both a mark/label and colour; the current theme and shared navigation/Capture styling were retained.
- **Agreement:** the fixture's reached count is one of three, and the second milestone is Next. The list and summary logic agree. Pros and cons have no calculated winner or personal progress score.
- **Empty states:** the existing “first milestone”, “no options yet” and no-date states remain actionable; count limits explain how to make room.
- **Marks and labels:** ticks identify reached milestones; Next is printed in words. The decision options are named rather than distinguished by colour alone.
- **Phone:** bottom navigation remains available and options stack. The highest-value later improvements are wrapping long point text, shortening the route to the first option and clarifying the current tool for Cases. These were recorded rather than introducing an unapproved layout redesign.

## Verification record

Baseline: `projects-rules` **363 passed**, `app-projects` **396 passed**. Updating the rules expectation to ten reproduced the gap: **359 passed, 4 failed** (the limit and the resulting point-removal counts). After the limit change the rules suite passed again.

Production build passed. It reports existing chunk-size and ineffective dynamic-import warnings. App lint, syntax checks for the edited browser tests and `git diff --check` passed.

| Targeted suite | Final result |
| --- | --- |
| `projects-rules` | 363 passed, 0 failed |
| `app-projects` | 401 passed, 0 failed |
| `storage` | 21 passed, 0 failed |
| `app-storage` | 47 passed, 0 failed |
| `sync-db` | 86 passed, 0 failed |
| `sync-records` | 56 passed, 0 failed |
| `app-sync` | 122 passed, 0 failed |
| `ai-rules` | 428 passed, 0 failed |
| `ai-server` | 176 passed, 0 failed |
| `app-ai` | 210 passed, 0 failed |
| `app-tasks` | 68 passed, 0 failed |
| `app-today` | 243 passed, 0 failed |
| `graph-rules` | 24 passed, 0 failed |
| `understand-rules` | 47 passed, 0 failed |

The first combined browser run was not a complete pass: `app-ai` lost its browser connection (1006) before the new privacy cases; `app-tasks` stopped after 52 passes on a missing export file; `app-today` stopped after 46 passes and three failures (midnight rollover, its morning screen and a missing export). Fresh isolated Tasks/Today runs produced the results above. An AI retry was deliberately stopped (143) to correct a new test helper that reloaded instead of delivering a storage event. The next AI run passed all three new privacy checks but finished 208/2 because the new fixture left its project private for later count checks; fixture cleanup was added before the final run. No production assertion was weakened.

The passing Tasks runner reported a temporary-profile cleanup warning. Its leftover task-owned folder was removed after the browser exited. Failed/partial run logs and visual inspection artifacts were retained under temporary storage.

Final status also showed concurrent edits to Arabic normalisation, sessions, types and screen code, plus `src/sync/records.ts`, made after the last test build. Those edits were left untouched and are outside these verification results. The results above cover this review's project changes and the earlier working-tree snapshot.

Visual inspection used the existing design skill's real-browser inspector. Decisions measured **0 failures, 0 warnings** at 1440, 768 and 390 px before and after. The first Milestones captures were unstyled at the first desktop load (**1 failure, 3 warnings**, both before and after); the isolated retries measured **0 failures, 0 warnings** at all three widths. Every resulting screenshot was opened. Source design lint reported **0 failures, 2 warnings** for existing loading-pulse animation and punctuation; these were retained as established behaviour/copy, not restyled in this functional change.

All sync and AI service checks used the local stand-in and mock models. Hosted Supabase, live AI providers, deployment, a full offline-install audit and the untargeted test suites were not run.

## Decision history follow-up verification — 23 October 2026

The approved follow-up passed the production build and app lint. The build still reports the existing chunk-size
and ineffective-dynamic-import warnings. Edited test syntax checks and `git diff --check` passed.

| Targeted suite | Final result |
| --- | --- |
| `projects-rules` | 385 passed, 0 failed |
| `storage` | 21 passed, 0 failed |
| `app-storage` | 49 passed, 0 failed |
| `sync-db` | 86 passed, 0 failed |
| `sync-records` | 61 passed, 0 failed |
| `ai-rules` | 429 passed, 0 failed |
| `app-projects` | 417 passed, 0 failed |
| `app-sync` | 128 passed, 0 failed |

These eight suites total 1,576 passing assertions. The first combined run finished `app-projects` at 414 passed,
1 failed: the new keyboard test sent Enter without its character event. An isolated browser check confirmed the
native disclosure opens with a complete key event. The test now sends that event and waits for the disclosure;
it retains the visibility/content assertion and reports its focused element on failure. Two further checks cover
the size-refusal message and keeping a chosen option when its snapshot will not fit. The corrected project suite
then passed alone at 417/0. The other seven passing suites were not repeated. The initial failure logs were retained.

The checks cover repeated same-day choices, reasons independent of current edits, removed chosen options, blank and
unavailable legacy reasons, explicit conversion on action, unknown-field preservation, no history truncation,
atomic size refusal, failed browser saves and retry, keyboard access, full backup/restore, classic preservation,
offline editing followed by account/device sync, and exclusion from the Ask request and preview. Existing workflow,
Business Model and Case checks remain in the project suite. Tests use synthetic data and the local sync stand-in.

The existing Clarity design was retained, with the shared disclosure component and no redraw. Visual inspection
measured **0 failures, 0 warnings** at 1440, 768 and 390 px in both themes; all twelve fold/page screenshots were opened.
The temporary reading-room fixture has one current choice and three previous choices, including a removed option,
a multi-line reason, an explicitly blank reason and an unavailable older reason. No sample history was added to
starter data. Source design lint reports **0 failures, 1 warning** for the file's existing em-dash wording.

The current question/choice stays primary; the history disclosure is closed by default and opens with a 44 px target.
Its rows share the card's edges, labels and reasons wrap on phones, and full dates distinguish years. The three-row
count agrees with the saved snapshots; the latest snapshot appears first. Blank and missing reasons have different
explicit text. No new colour, chart, score or navigation system was introduced. The existing clipped option/point
inputs and long route to the first decision on a phone remain the separate usability findings above.

This is source-only work. No live accounts, real saved-data migration, hosted AI calls, release or deployment ran.
The full untargeted suite and an offline-install audit were not run. Unrelated workspace changes were preserved.

## Split-project storage follow-up — 23 October 2026

The approved implementation changes the cloud wire shape while retaining complete nested projects in local
storage, exports and restores. Individual history snapshots have no count cap or automatic expiry. Unknown
nested value fields and Case links remain with their records. Same-item conflicts keep the displaced record;
a parent-deletion choice keeps the complete displaced subtree. Concurrent additions at the same position use
a stable tie-breaker across devices; this does not invent an exact chronology.

`../supabase/migrations/20261023120000_split_project_sync.sql` is an explicit, atomic conversion with original
cloud payloads retained for recovery. Older sync clients are refused with an update-required message, as approved.
The matching client converts legacy device baselines before sending offline edits. Storage failures, per-item
size refusal and imports leave the previous saved data intact. This does not migrate localStorage to IndexedDB.
R2 provisioning is separate; no attachment uploads or automatic cloud backups were added to the app.

The targeted verification record follows. The earlier result tables describe
their own source snapshots and must not be read as validation of this later migration.


The production build and app lint passed; the build retains the existing chunk-size and ineffective dynamic-import
warnings. Edited JavaScript syntax checks and `git diff --check` passed. These results cover the targeted source
work, with synthetic records and disposable local accounts; they are not hosted-service verification.

| Targeted suite | Final result |
| --- | --- |
| `projects-rules` | 386 passed, 0 failed |
| `project-sync` | 34 passed, 0 failed |
| `project-sync-db` | 28 passed, 0 failed |
| `sync-records` | 61 passed, 0 failed |
| `sync-db` | 86 passed, 0 failed |
| `storage` | 21 passed, 0 failed |
| `app-storage` | 53 passed, 0 failed |
| `app-projects` | 417 passed, 0 failed |
| `app-sync` | 137 passed, 0 failed |
| `ai-rules` | 429 passed, 0 failed |
| `app-ai` | 210 passed, 0 failed |

These eleven suites total **1,862 passing assertions**. They cover exact SQL/browser projection, original-project
recovery and isolation, update-required legacy endpoints, provable and uncertain device baselines, lost legacy
replies, offline edits, per-item CAS, parent-deletion races and both resolution choices, multi-page pulls,
650-choice device round trips, 900-choice mapper round trips, stable concurrent appends, unknown fields, Case
links, complete backup shape, atomic size refusal and failed-save retry. Conflict descriptions expose decision
options and points, the chosen label, reason/day and milestone state. No AI request allowance changed.

The first new browser conflict fixture stopped after two failed assertions: it reconnected before proving that
the Mac's edit had reached the account. It now checks that prerequisite and delivers offline storage events
without reloading. The next sync run finished 135/1: the expanded scheduling exposed a retry-fingerprint
regression while repairing an old payload's half emoji. Restoring the original outgoing fingerprint prevents that
repair from being resent as a new local edit. The final isolated run passed 137/0, including an added check that
accepting a project deletion keeps all 652 displaced history snapshots and the edited milestone aside.

Early database development also caught a migration syntax error and a parent-cascade validation error, both fixed
before the final 28/0 run. A parallel test build stopped before running its suites when two builds shared generated
audio output; sequential builds resolved that interference. The following storage/AI run passed 53/0 and 210/0.
Failed and partial logs remain in temporary storage. Valid production assertions were retained.

No hosted migration, deployment, real-data conversion, live provider call, full untargeted suite or offline-install
audit ran. Release schema/previous-release compatibility work for the earlier history addition remains a release
requirement. Existing unrelated workspace changes were preserved. See `../supabase/PROJECT_STORAGE.md` for the
concrete migration, backups and rollback procedure before any live upgrade.
