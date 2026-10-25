# MyDay Projects: revised vision and feature specification

**Status:** the owner's vision of 24 October 2026, with review corrections folded in (listed in section 21). It
describes direction, not approval to build: each increment in section 17 needs its own short specification and the
owner's sign-off before work starts. **Phase 1 is delivered** (1.46.0, 1.48.0, 1.50.0, 1.52.0 and 1.54.0, each with
its own specification; see section 17). **Phase 2 is delivered** (1.56.0 and 1.58.0 Study links, 1.62.0 Resources,
1.65.0 automatic backups, 1.68.0 and 1.69.0 files). **Phase 3 has started:** Research (1.77.0, `specs/projects-research.md`),
then steps inside a task and "Starts after" (1.81.0, `specs/projects-steps.md`).
**Based on:** source at release 1.45.1 (status updated at 1.75.0).

## 1. Purpose

Projects is MyDay's workspace for organising and delivering meaningful outcomes.

It should help the user answer:

- What am I trying to achieve?
- Where does the work stand?
- What needs attention?
- What can I do next?
- Where did I leave off?

A simple project should remain simple. More complex work should be able to use specialist tools without requiring
a separate application or a completely different workflow.

The central experience should be straightforward: open a project, understand its situation and take one useful
action.

This specification extends MyDay's existing Projects system. It does not propose rebuilding capabilities that
already work.

## 2. Current foundation

The reviewed source already contains the following capabilities.

| Area | Already available | Improvement or addition needed |
|---|---|---|
| Project creation | Quick creation, title, description ("what it is and why it matters") and project kind | Clearer optional outcome and completion criteria |
| Organisation | Seven flexible stages; Ideas, Exploring and Doing board; this week's focus | Better filtering and visibility of waiting or blocked work |
| Lifecycle | Active, Paused, Done and reopening | Archiving, and a clear distinction between achieved and deliberately stopped |
| Tasks | Shared project tasks, dates, lengths and a chosen next step. One rule (`nextStep` in `app/src/data/projects.ts`) chooses the next step for the board, Overview, At a glance and Today | An explanation of the choice, waiting information and, later, dependencies |
| Today | Project next steps offered for the daily plan, linked completion and energy limits | Clearer explanations and continued visibility of important dates |
| Milestones | Ordered milestones, optional target dates and reached states | Optional connections to supporting tasks and completion evidence |
| Decisions | Questions, options, pros, cons, reasons and previous-choice history | Better connections to supporting research and affected work |
| Business | One-page model, assumptions, investigation tasks and findings | Structured experiments, sources and optional financial planning |
| Case | Timeline, evidence register, issues and entered deadlines | Deadline provenance, correspondence and shared attachment support |
| Dashboard | Project-specific "At a glance" information and useful pointers. "Coming up" lists only today and later, so an open dated task (including a Case deadline) drops off once its date passes | Less repetition, stronger recovery information, unresolved past dates kept visible, gradual customisation |
| Search | A search across all notes, in Notes | Project-scoped search over tasks, milestones, decisions and specialist records |
| Connections | Shared notes, Calendar links and a notes/projects relationship map | Structured Study, resource and related-project references |
| AI | Contextual questions, selected proposals, validation and supported Undo | Clearer permissions across features and better source references |
| Persistence | Local saving, export/import and account sync with split project records | Compatibility and conflict handling for every new record type |

These are implemented source capabilities, not a claim that every workflow has been newly tested in the live app.

## 3. Responsibilities across MyDay

Projects should connect the app's sections while preserving clear ownership.

| Area | Responsibility |
|---|---|
| Today | Choose and carry out manageable work for the day |
| Projects | Organise the context, decisions and work needed for an outcome |
| Explore | Investigate possibilities, questions and alternatives |
| Study | Manage learning, practice, revision and learning progress |
| Notes | Capture and develop information |
| Calendar | Own appointments and scheduled commitments |
| Finance | Manage the financial information supported by that section |
| Health | Own health routines, workouts and related progress |
| Ask MyDay | Help interpret information and propose supported actions |

These are complementary functions, not compulsory stages.

A user can start a project immediately, investigate something while already working on it, or return to Study
whenever a learning need appears.

Two proposed capabilities require separate development:

- General Goals: longer-term direction beyond the existing health and fitness goal feature.
- Shared Documents and Attachments: reliable file records and access beyond today's links and descriptions of where
  files are kept.

Neither requires an immediate new top-level navigation item.

Explore also needs a clear expansion plan. It currently provides project-based explorations and starting briefs; an
independent investigation workspace would be an addition.

## 4. A lightweight project foundation

Creating a project should require only a name.

The user can optionally add:

- What the project is and why it matters.
- The intended outcome.
- What would count as finished.
- A starting template.
- A target date.
- Important resources.
- A next action.

Further fields, such as tags, priority, related projects or Goal connections, should appear when useful rather than
becoming an initial form to complete.

An intended outcome should describe a result. For example, "Publish a working appointment-booking page" is more
useful than "Work on the website".

Completion criteria can remain informal for a small personal project. Complex projects can use more explicit
criteria or acceptance checks.

Finishing every task must not automatically declare the project successful. The user decides whether the intended
outcome has been achieved.

## 5. One Overview, with specialist tools underneath

Each project should have one clear starting screen: Overview.

The Overview and dashboard should be the same destination. The conceptual layers of identity, workspace, dashboard,
intelligence and history should not become separate screens the user must navigate.

The default Overview should prioritise:

1. The intended outcome and current situation.
2. One recommended next action.
3. Important dates, blockers or decisions needing attention.
4. A short "Where I left off" summary when available.

Tasks, milestones, decisions and resources should open directly from this screen. Specialist views should appear
according to the tools enabled.

The existing "At a glance" dashboard should be refined and reused. Repeated summaries across tiles and cards should
be reduced: today, milestone progress appears in a tile, a route picture and a separate card, and Model and date
summaries overlap.

A useful default should work without configuration. Early customisation should support showing, hiding and ordering
sections. Resizable widgets and elaborate dashboard builders should come later, if actual use justifies them.

Essential actions and unresolved firm deadlines must remain discoverable even when sections are hidden.

## 6. Templates choose tools; they do not limit the project

The current General, Business idea and Case templates should remain available.

A template should choose useful starting tools and defaults. The user should be able to enable additional tools
without changing the project's identity.

Examples:

- A Business project can add Research and Budget tools.
- A Software project can add Research and Requirements.
- A Case can add Correspondence.
- A personal project can remain an Overview, task list and a few milestones.

Changing a template or disabling a tool must preserve its records. Hidden information should remain discoverable,
with a clear route to reopen it.

The architecture should use shared capabilities with defined records and validation. It should not begin with an
unrestricted custom-field or workspace-building engine. Today, type and tool conditions are repeated across routes,
tab lists, Overview composition, dashboard tiles, Explore eligibility and AI context; a small typed capability
definition should replace that repetition when the first new tool or template is approved.

Additional templates should be introduced selectively:

| Template | Proposed approach |
|---|---|
| Software development | Add focused requirements, quality and external development references |
| Research | Add reusable sources, findings, questions and experiments |
| Personal objective | Initially use a simpler General preset |
| Career development | Begin with General plus Study and resource links; add application tracking when needed |
| Learning outcome | Optional preset for coordinating qualifications or examinations; actual learning remains in Study |

## 7. Tasks, next actions and Today

Shared tasks already exist and should remain the foundation.

A task viewed in Projects and its linked entry on Today must continue to represent the same work. Completing either
should update the linked state without creating another independent task.

Today may retain planning information and historical snapshots. Those should remain connected to the original task
rather than becoming competing sources of completion.

Each project already has one next-step rule, used by every view: the chosen task, or the first open task when the
chosen one is unavailable or done, with tasks ordered by date and time, then creation. Keep that single rule and
extend it. The recommendation should:

- Respect the user's explicitly chosen action.
- Exclude completed or deliberately released tasks.
- Account for recorded dependencies and waiting conditions.
- Explain why an action is suggested.
- Offer a clear way to choose another action.

When the chosen action is completed, the next eligible action can be recommended. It should not automatically start
a session or add itself to Today.

The existing energy-aware daily planning rules should be preserved. Important deadlines should remain visible even
when there is no room to add more work to the plan.

Structured dependencies and true subtasks are additions. They should be introduced only with clear behaviour for
completion, blocked work, deleted dependencies and circular dependencies. Because those rules are substantial, they
belong in Phase 3, not Phase 1.

A missing next action should prompt a small useful question, such as "What would move this forward?" It should not
trigger automatic task generation.

## 8. Stage, status, waiting and archive

MyDay already separates a project's stage from its status. Preserve that distinction.

Stage describes the kind of work currently happening: understanding, organising, exploring, deciding, acting or
reflecting. The existing stages can remain flexible and revisitable.

Status describes whether the project is active, paused or concluded.

Waiting and blocked information should identify:

- What is preventing progress.
- What or whom the user is waiting for.
- Any expected response date.
- An action that could unblock the work.

A blocked task does not necessarily block the entire project.

Archiving should control visibility while retaining the project's outcome and history. An archived project should
still show whether it was completed, paused or deliberately stopped.

Archived projects must remain searchable and reopenable. Archiving must not delete records or silently complete
unfinished tasks.

**Saved-data constraint.** Keep the three status values (`active`, `paused`, `done`). Record archiving and "achieved
or deliberately stopped" as separate optional fields, not as new status values. Released versions read any status
they do not recognise as Active, so an older device would show a stopped project as active and could sync Active
back over it. The new fields still need the schema-version and compatibility work in `AGENTS.md`.

## 9. Returning after a break

Project recovery should be an early priority.

The user should be able to record a short "Where I left off" note containing:

- What was happening.
- What remains unresolved.
- The next useful action.
- Any resource needed to resume.

MyDay can supplement this with changes supported by saved records.

The current "Recently" list should remain a lightweight activity summary. It should not be presented as a complete
audit history because it is reconstructed from current records.

Preserve significant history where it matters: decisions and reasons, important changes of direction, concluded
milestones and selected project updates. Avoid turning every minor edit into an activity feed.

An AI recovery summary should identify its sources and limitations. A user-written handoff should remain usable
without AI. Whether the handoff text is ever included in an AI request is an owner decision (section 20); until then
it is not sent.

## 10. Specialist workflows

### Business

Preserve the existing one-page model, assumptions and "Find out" tasks.

Extend it with reusable Research and Experiment tools. An experiment should connect:

- The question or assumption being tested.
- The proposed test.
- The expected observation.
- The actual result.
- Supporting sources.
- The user's conclusion and next decision.

Completing an investigation task must not automatically validate an assumption.

Optional financial planning should use structured inputs and calculations, including currency, time period and
recorded assumptions. Forecasts and actual transactions must remain distinguishable.

Business budgets must not silently modify personal Finance records. Any connection should be explicit.

### Case or formal matter

Preserve the existing distinction between the user's account, another party's account and information found in
evidence.

Improve deadline records so they can distinguish:

- A firm deadline from a date to aim for.
- The source of the date.
- Whether the date has been checked, by whom and when.
- Whether the associated action remains outstanding.

An unresolved deadline must remain visible after its date passes. It should not disappear merely because the
dashboard only displays future dates. Its wording stays calm and factual ("Still open, was due 3 Oct"), never a
red "Overdue" or other pressure.

"Have it", "Reviewed" and "Verified" must have different meanings. Reading a document does not establish that its
contents are accurate.

Correspondence can begin as a simple register of communications, requests, commitments and outstanding replies.

Original files, working drafts and annotations should remain distinguishable when attachment support arrives. MyDay
should not imply that its records establish legal authenticity or calculate authoritative legal deadlines.

### Software development

Introduce a focused initial toolset:

- Requirements and acceptance criteria.
- Technical decisions with rationale.
- Tasks, bugs and milestones.
- Test evidence and release checklists.
- References to repositories, issues and pull requests.

Use external development platforms where they already own the work. A repository link is a resource; it is not
evidence that MyDay knows the repository's current state.

Any connected status should show its source and when it was last checked. Release readiness should come from defined
checks, not an unexplained score.

### Research and investigation

Create a reusable Research capability rather than a separate disconnected system.

Its minimum useful records are questions, sources, findings, unresolved questions and conclusions. Experiments can
connect where appropriate.

Findings should retain source references, dates, relevant limitations and supporting or contradictory evidence.

Explore can present these records through an exploratory view. Projects can organise the investigation around a
defined outcome. Neither should keep a separate copy of the same finding.

### Personal and career projects

Use simple defaults first.

Personal projects can use existing tasks, notes, dates and milestones. Repeated health or learning activities should
connect to their existing owners where suitable.

Career projects can coordinate target roles, portfolio work, qualifications, applications and interviews. Study
should continue to own the associated learning.

Dedicated specialist records should be added when they improve a real workflow, rather than merely to make every
template look different.

## 11. Study and Goals connections

Projects should reference Study courses, topics, lessons or learning plans through stable links.

A connection can explain why the learning matters and where it applies. Learning content, revision schedules and
progress remain authoritative in Study.

Projects must not infer verified competence from time spent, a finished session or an administrative task marked
done. Display the status that Study actually supports.

A qualification project can coordinate booking, payment, deadlines and portfolio requirements while linking to the
relevant Study work.

General Goals should be a later, optional addition. A project must never require a Goal before it can be created.

Start with a simple relationship model. Support additional Goal connections when useful, without imposing complex
hierarchy or arbitrary combined progress percentages.

## 12. Notes, resources, files and relationships

Continue using shared Notes.

Tasks and notes currently have one primary project. Preserve that useful home while allowing additional references
where a record supports several projects.

Connections should distinguish meaningful relationships (for example "supports this decision", "evidence for this
issue" or "learning needed for this milestone") without requiring every link to be classified.

Shared attachments are a new capability. A file record should provide a stable identity, ownership, filename, type,
size, upload state and a resolvable storage reference.

The attachment workflow must define:

- Failed uploads and retries.
- Access from another signed-in device.
- Offline availability.
- Versions and originals.
- Deletion and recovery.
- Inclusion in backups and restoration.

Private files require appropriate access checks. Temporary access URLs should be generated when needed rather than
treated as permanent file identities.

Implement one useful storage path first, behind a small shared interface. Supporting several providers immediately is
unnecessary. Storage has been provisioned but holds nothing, and the app has no file-storage code yet
(`deploy/R2.md`). Automatic backups should come before attachments, so that saved data is protected before daily
use grows.

File storage, structured-data sync and backups are separate capabilities. Having one does not establish that the
others work.

Deleting a project must explain which project-owned records are removed and which shared resources remain. Unlinking
a file must not silently delete it from every other place that references it.

## 13. Search, connections and the Projects homepage

Add project-specific search before semantic search, building on the existing Notes search.

Search should cover supported tasks, notes, milestones, decisions and specialist records. Results should identify
their type and open the relevant item directly.

Global search can expand incrementally and should include completed and archived work when requested.

External search indexes or semantic services require a separate privacy decision. A private record must not be sent
to an external index merely because it is searchable inside MyDay.

Preserve the existing project board. Add useful filters and an optional list view rather than replacing it
immediately.

The homepage should make it easy to find:

- Active work and the user's current focus.
- Projects needing a decision or an unblocking action.
- Important unresolved dates.
- Paused, completed and archived work.
- The action to start a project.

Attention prompts should explain the underlying reason. A project should not be labelled unhealthy simply because
the user has not opened it recently.

Extend the existing Connections view when new relationships provide value. Keep a readable list alternative; a graph
should not be required to find information.

## 14. Progress and project intelligence

Use meaningful counts, milestones and evidence.

Task completion is activity information. It does not establish how close the overall outcome is to completion.

Indicators such as launch readiness, chronology completeness or release readiness require defined criteria. When no
criterion exists, show the underlying records and outstanding questions.

Distinguish:

- A recorded account.
- Information supported by identified sources.
- An assumption.
- A disputed or unverified statement.
- A decision.
- A proposed action.

AI must not silently promote information between these categories.

A useful project summary should explain what changed, what remains uncertain and what action could help. It should
avoid arbitrary scores, pressure or claims that exceed the evidence.

## 15. AI permissions and proposals

Extend the existing AI infrastructure rather than introducing a separate AI system for each template.

Preserve request previews, application validation, explicit approval for substantive changes and supported Undo.

The specification must accurately describe current exceptions. As of 1.45.1:

- Optional AI note filing (Notes, "AI help with notes") links notes to projects with Undo after the user enables
  it. It considers the names and summaries of every project that is not done, private projects included. It never
  reads private notes.
- "Help me adjust today" sends the titles of today's planned tasks without checking whether their project is
  private.
- AI revision cards on a note check the note's own Private switch, not its project's.
- Ask MyDay excludes private projects from its context, and excludes Case timeline, evidence and issues whatever the
  Private switch says.

Keep those boundaries until an explicit product decision changes them. Do not imply that the Private switch already
governs every AI feature identically.

Future controls should make clear what information can be sent, for what purpose, and whether an action needs
individual approval or operates under a specific enabled preference.

AI summaries should reference the records used and disclose relevant omissions or limits. New evidence-analysis
capabilities require an explicit scope and permission design.

Proposals must use existing application rules and identify actual records. Changes to records or permissions must
invalidate affected previews and proposals.

Project-specific instructions may shape tone and priorities. They must not override privacy settings, validation or
approval requirements.

## 16. Usability and saved-data requirements

Follow MyDay's established visual language and navigation.

On mobile, prioritise reading the situation, capturing an update, accessing a resource and completing the next
action. Complex configuration should remain optional.

Maintain keyboard access, visible focus, readable contrast, reduced motion and suitable touch targets. Reordering must
have an accessible alternative to dragging.

Every saved-data addition must cover local saving, export/import, sync, conflicts and compatibility with older
supported clients.

Continue using the shared storage path and existing safeguards against stale writes, damaged data and failed saves.
A failed save must preserve the previous state and the user's draft without announcing success.

Reuse the existing split project-sync approach where suitable (`supabase/PROJECT_STORAGE.md`). New record types
require the corresponding validation and migration work. Unknown fields and readable historical information must
survive supported round trips.

Existing user data must not be reset or discarded to introduce the new structure.

## 17. Delivery sequence

### Phase 1: Improve the existing daily experience

The objective is easier understanding and resumption of existing projects. Deliver it as small releases, lowest risk
first, each with its own specification:

1. **Overview tidy-up and unresolved dates.** Reduce repetition on Overview and At a glance, and keep open past
   dates visible. Display only: no saved-data change. *Released in 1.46.0 (`specs/projects-overview.md`).*
2. **Outcome and "Where I left off".** The optional intended outcome, what counts as finished, and the handoff note,
   together in one schema change. *Released in 1.48.0 (`specs/projects-left-off.md`), without a schema change under
   the owner's exception in AGENTS.md.*
3. **Waiting information.** What a task or project is waiting on, from whom, and until when. *Released in 1.50.0
   for tasks (`specs/projects-waiting.md`).*
4. **Project search.** Built on the Notes search. *Released in 1.52.0 (`specs/projects-search.md`).*
5. **Next-action explanation.** Why the next step was chosen, and an easy way to choose another, without
   dependencies. *Released in 1.54.0 (`specs/projects-next-why.md`).*

### Phase 2: Strengthen shared connections

Add structured Study references and related-resource links. Add automatic backups, then dependable attachment
support. Define ownership, deletion and restoration behaviour.

The objective is connected information with clear sources of truth. *Delivered:* `specs/projects-study-links.md`,
`specs/projects-resources.md`, `specs/automatic-backups.md` and `specs/files.md`; "delete everything" as a true wipe
(`specs/delete-everything.md`, 1.73.0) covers the deletion and restoration side.

### Phase 3: Develop specialist workflows

Choose one immediate need and complete it end to end. Software requirements and acceptance checks, Research records,
or Case deadline improvements are suitable candidates. Structured dependencies and subtasks also belong here.

The objective is a useful workflow supported by reliable records.

### Phase 4: Expand portfolio views and customisation

Add attention filters, list views, optional sections and modest dashboard configuration. Extend relationship views
only where useful.

The objective is better visibility across projects without requiring more administration.

### Phase 5: Add broader intelligence and integrations

Develop richer recovery summaries, source-aware analysis, selected external integrations and optional general Goals.

Advanced financial modelling, deeper subprojects, custom fields, semantic search and elaborate dashboard builders
remain later options.

## 18. Acceptance criteria

Each delivered increment should have observable checks proportionate to its scope.

At minimum:

1. A project can still be created with only a name.
2. Completing a linked task updates Projects and Today consistently.
3. All affected views use the same next-action recommendation.
4. Completing an action recommends the next eligible action without automatically starting it.
5. Waiting or dependent work is handled according to explicit rules, with an explanation.
6. Unresolved firm deadlines remain discoverable after their dates pass.
7. Template changes and disabled tools preserve their records.
8. Archived projects remain searchable and reopenable.
9. Study links reflect supported learning status without creating duplicate progress.
10. Rejected, stale or unapproved AI proposals make no substantive changes.
11. File access, deletion and backup behaviour match the documented ownership rules.
12. Failed saves preserve the previous data and the user's draft.
13. Export/import and sync retain relationships, unknown fields and supported history.
14. Essential actions remain usable on phones and with a keyboard.
15. An older supported version that opens or syncs the data does not silently change a new field (for example,
    an archived or stopped project does not become active).
16. Changed screens pass the visual checks in section 19 at phone, tablet and desktop widths.

Projects succeeds when it reduces the effort required to understand the work and resume it. Its depth should grow
with the project, while the next useful action remains easy to find.

## 19. Interface design and visual checks

Use the Taste skill (`design-taste-frontend`, installed at user level, not in this repository) for interface design
and visual checks, through its app-screen workflow (its `references/app-screens.md`, `draw.mjs --app` and
`inspect.mjs --app`). Use it when an increment changes how a screen looks or is arranged, such as the Overview
tidy-up, homepage filters and list view, or a new tool screen. It is not needed for data, sync or AI changes that
leave screens as they are.

For MyDay it should help:

- Make the next action and important information easy to find. Each screen answers one question first, and its
  largest element is the answer.
- Reduce repeated cards, clutter and unnecessary charts. No figures in their own tiles, no chart where a few numbers
  say it, and one fact in one place.
- Check phone, tablet and desktop layouts, accessibility, and empty, loading and error states, at 390, 768 and
  1440 px in both themes.
- Compare actual browser screenshots before and after each change: inspect into `.taste-skill/before` before any
  edit and into `.taste-skill/after` afterwards, then compare every width.

Rules for using it here:

- MyDay's own design decisions win where they differ: `design-system/myday/MASTER.md`, `app/src/styles/tokens.css`
  and `app/src/styles/workspace.css`. Keep the existing palette and type (`--keep palette,type`) and the
  `editorial-greeting` style already in use; take only arrangement from the skill.
- Use made-up data only, never a real saved plan. `.taste-skill/` is ignored by Git; do not commit its screenshots.
- It adds to MyDay's own checks (`app-design` and the affected browser suites); it does not replace them.
- MyDay's principles still apply: no scores, percentages, pressure or guilt for personal progress.

## 20. Decisions needed from the owner

- Whether "Where I left off" text may ever be included in an AI request, and if so, with what preview.
- ~~Whether the Private switch should govern every AI feature, including note filing, "Help me adjust today" and
  revision cards.~~ *Decided by the owner on 24 October 2026:* Private covers every AI feature except note filing.
  "Help me adjust today" sends a private project's task as "a private task", without its title (myday-83's task-links
  branch, after 1.57.0). Note filing keeps the 17 October choice: a private project's name and summary only.
- Whether automatic backups are scheduled before any attachment work.

## 21. Review notes

Changes from the owner's draft of 24 October 2026, after checking the 1.45.1 source:

- Section 2: the next step is already one shared rule; Notes already has a search; "Coming up" drops open tasks once
  their date passes.
- Section 5: the draft named five conceptual layers but called them six.
- Section 8: archive and "stopped" are separate fields, not new status values, because released versions read
  unknown statuses as Active.
- Section 15: two AI exceptions were missing ("Help me adjust today" and revision cards).
- Section 17: Phase 1 is split into five small releases; dependencies move to Phase 3; backups come before
  attachments.
- Sections 18 to 20: added the older-version check, the visual-check criterion, the Taste skill section and the
  open decisions.
