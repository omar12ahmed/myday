# MyDay: product vision, architecture and direction

**Status:** proposed. This document sits above the detailed specs beside it (Projects:
[`projects-vision.md`](projects-vision.md); Study: [`adaptive-study.md`](adaptive-study.md) and
[`study-home-and-lessons.md`](study-home-and-lessons.md)) and links to them rather than repeating them.

**Checked against:** the source at MyDay 1.53.0 (`e50f9c2`) on 24 October 2026, by reading the code and docs, with
1.54.0's next-step explanation added afterwards.
- **"Built"** means present in that source.
- **"Live-checked"** is said only where a live check was run.
- **Proposals:** a proposal here is not agreed because it is written down, and a built feature is not proven because its tests exist.
- **Approvals:** nothing in this document authorises code changes, migrations or publishing. Each increment still needs the owner's go-ahead.

---

## 1. Product vision

MyDay helps one person turn intentions into realistic action. It keeps enough context to adapt, pick things up again
and look back.

"Personal operating system" describes the connected ambition. The everyday promise stays simple:

> Understand what matters, organise what's needed and take the next useful step.

### The progression (built)

Every project carries a stage:

> Capture → Understand → Organise → Explore → Decide → Act → Reflect

The stages are shown as steps on a project page (`app/src/data/projects.ts`). The Projects board groups projects into
Ideas, Exploring (at most three) and Doing (at most two). Your week is the Reflect step for everything.

The stages are a guide, never a gate. A person can:
- capture a task straight onto a list;
- start a project without research;
- reopen a decision;
- pause a project without losing its context.

Planning and adapting happen throughout.

A standing principle from `AGENTS.md` stays central: **Projects are the spine, and a project's one next step is what
reaches Today.**

### How MyDay should feel

- **Calm, friendly and honest.** British English throughout.
- **No guilt, scores or percentages.** Counts and places instead. Missed days cost nothing.
- **Energy shapes the day.** It never limits the person.
- **Nothing unbuilt is presented as working.**
- **Useful without AI.** MyDay builds and runs with AI switched off. AI extends it where interpretation, explanation
  or drafting genuinely helps.

### A connected path, and where it stands

The target is that someone can go from an idea to a reviewed outcome without starting again at each step. Most of
the path exists; the gaps are specific.

| Step | What exists now | Gap |
|---|---|---|
| 1. Capture an idea | Capture (top bar, every screen) → "Start a project from this"; the Business idea template | — |
| 2. Questions and assumptions | A business idea's one page, with must-be-true items; Ask MyDay can propose them | — |
| 3. Investigate the key uncertainty | "Explore this idea": curated for the owner's Hargeisa Marketplace research, a generated starting brief for other projects | No sourced research; nothing proposes how to test an assumption |
| 4. Record findings and their sources | Notes linked to the project; a must-be-true item can be marked checked; a case records where its evidence is kept | No finding records with sources for a business idea |
| 5. Decide whether to continue | Decisions with options, pros and cons, and a history of choices | — |
| 6. Organise the outcome | Stage, milestones, what it's aiming for, what counts as finished (1.48.0) | — |
| 7. One manageable action for Today | The project's next step, with "Why this?" (1.54.0) → Today's "From your projects"; a weekly focus of up to three projects | — |
| 8. Adjust around commitments and energy | Build my day (energy limits, shift and appointment times), "Help me adjust today" | — |
| 9. Record what happened | Ticks, the evening check-in, "Where I left off", "waiting on…" (1.50.0); a tick on Today counts in Your week (1.55.1) | — |
| 10. Resume, review or conclude | "Where I left off" at the top of the Overview, Your week, Done | — |

---

## 2. Who owns what

MyDay has six sections: Today, Calendar, Projects, Finance, Health and Study. Four things work across all of them:
Capture, Ask MyDay, "What MyDay has noticed" and "What MyDay knows".

| Area | Owns |
|---|---|
| **Today** | The day: energy, Build my day, the plan, the evening check-in, the focus timer and Focus mode, Due today, "From your projects", and the Study and Health cards. **Tasks** lives here too (`#today/tasks`). |
| **Calendar** | Shifts (the rota, its versions, one-date changes, overtime and absence), appointments and bank holidays. Feeds Finance's pay and Workout's dates. |
| **Projects** | Projects and their stage, next step, milestones, decisions, the business one page, cases, and "Where I left off". Search within a project. Two more tabs: **Notes** (inbox, collections, search, Private, linking) and **Connections** (the knowledge graph). Explore for a project. |
| **Study** | Subjects, the roadmap and courses, guided Cybersecurity and Arabic, Your focus, revision, Reading. |
| **Finance** | Pay estimated from the rota (tax, NI, student loan), monthly expenses, money owed. |
| **Health** | Workout, Food (recipes, shopping list, cooking), daily exercises, Goal. |
| **Capture** | One way in from anywhere: on the device, it suggests an appointment, a task, a note, a collection or a new project. |
| **Ask MyDay** | Help with the page you're on: answers and checked proposals (see §4). |

### Shared records, and the links between them

- **Appointments** are one shared record (`data.commitments`). They are edited from both the Calendar and Today's
  context card; projects refer to them by id.
- **Links that exist:**
  - a project's next step on Today;
  - Due today;
  - notes and tasks linked to a project (notes also by word matching on the device);
  - an appointment made from a project appearing on the Calendar;
  - Study on Today;
  - the rota feeding Finance and Workout.
- **Links that don't exist yet:**
  - a project's dated tasks don't appear on the Calendar;
  - appointments don't show their project there;
  - Study has no links to Projects. This is Phase 2 of the Projects vision.

### Proposed: general Goals and shared files

- **General Goals:** only Health has a Goal today. A general Goals area would connect existing records.
- **Shared files:** not built yet (see §6).
- **The rule for both:** don't ask anyone to reorganise, and don't add navigation before a workflow needs it.

### Naming

"Explore" named two things: a project's investigation view and a level of Study home. Decided (24 Oct 2026):
Projects keep "Explore" (it is also a project stage); Study home's level is "Browse" (1.60.0).

---

## 3. Architecture: shared records, application rules, selective AI

Extend what exists, in small steps.

### Foundations to reuse (built)

- **One saved document per browser** (`myday.data.v4`, schema 5):
  - checked on every read (`normalize`);
  - exported and imported whole;
  - shared with the classic MyDay, which leaves newer sections unread.
- **Optional account sync** (Supabase, sign-in):
  - one record per item or setting;
  - projects stored as separate parts;
  - deletion markers;
  - it runs only while MyDay is open.
- **Device-only choices** are kept apart and never synced or exported (Focus mode, Sayings, Arabic reading
  preferences, the AI note-filing count).
- **Rules as plain functions with their own tests:** planning and energy limits, revision, mastery, pay, progress
  and the next step.
- **AI on the server:** one Edge Function with named jobs, fixed request shapes and limits. Every reply is checked
  again in the app.
- **Explore content** is checked by a strict schema with seven scene types.
- **Offline and installable:** a service worker and an Android app.

### Compatibility is a rule, not just a habit

- **New information is optional.** It arrives as new fields or record kinds, and "absent" means "as before".
- **Going back is checked.** Every release says whether going back one release is safe. When a release adds synced
  data, the real previous release proves it (`app-sync-previous`).
- **Schema bumps are rare.** A bump makes older releases refuse the data without changing it, so it's used only when
  unavoidable (the last was schema 5, in 1.44.0).
- **Database changes are rehearsed.** Each one is backed up, rehearsed with a rollback and fingerprinted before and
  after.

### Rules first, AI second

- **Application rules** handle everything with an explicit answer: calculations, relationships between records,
  eligibility, scheduling limits, privacy, validation and saving.
- **AI** helps with interpretation, explanation, summaries, breaking work down and drafting plans. It never becomes
  the authority for saved state or for what counts as done.
- **A number from AI is a proposal.** For example, Ask MyDay can suggest a 45-minute task. The app keeps it between 5
  and 120 minutes, and the energy rules decide whether it fits today.

### One owner per fact

The same thing should not have two independent truths. Views may keep snapshots and history, as long as their
link to the source is explicit (a plan's copy of a task, a week's reflection note).

- **Task completion (fixed in 1.55.1).** A task on a day's plan has a copy there. Ticking the copy now marks the
  task itself done too, dated the plan's day, so Tasks, Your week and this week's count give one answer. Before,
  ticking on Today set only the copy, and Your week missed project tasks ticked there.
- **Learning records:** a Study resource linked from anywhere keeps its learning record in Study.
- **Files:** when files arrive, each has one identity, and projects refer to it.

Specialised workspaces grow from shared capabilities with defined records, as the Business and Case templates already
do. They don't start from a general customisation engine or a separate app for each kind of project.

---

## 4. Ask MyDay and the AI tools

### What exists

**Ask MyDay** opens from Capture and receives a bounded slice of the page it was opened on.
- **It replies in one of five ways:** an answer, things to add, steps, changes, or "can't help with that".
- **It can add:** tasks, notes, appointments, projects, course tasks, milestones, a decision's options, pros and
  cons, and must-be-true items.
- **It can change** only items whose ids the page sent, and only certain fields:
  - a task's title, day, time, length, list or project;
  - an appointment's title, day or time;
  - a note's title or project.
- **Title, length and list** change only when the person asked for that.
- **Never:** it never deletes anything and never ticks anything off.
- **It can offer three actions:** start studying, start revision, or adjust today. Each is checked against the real
  data.
- **The app checks every reply:**
  - real ids;
  - days from today onwards;
  - 5–120 minutes;
  - pressuring wording reworded;
  - anything already on the person's lists left unticked.
- **Nothing is saved** until the person ticks and taps Add or Apply. Then it saves in one go, with one Undo (in the
  panel). If the data changed meanwhile, a fresh preview is built.
- **One follow-up** is allowed ("Not quite?"), and nothing of the conversation is kept.

**Other AI help, each only when tapped:**
- "Help me adjust today";
- "Add what's on my mind";
- revision cards from a note, with a check of doubtful lines;
- the Cybersecurity tutor;
- more practice cards, written by one model and checked by a second;
- "Explain it another way", including Arabic.

**"AI help with notes"** has its own switch. It files notes MyDay can't place by itself, at most twice a day on each
device. It applies links without asking about each one, then lists them with Undo. **This is the one exception to
"proposals first", and it should stay a named, deliberate exception.**

**On the server:**
- **Who chooses the model:** only the server chooses the provider and model, with one OpenAI-compatible adapter,
  practice mode, routing of jobs to models, and a fallback.
- **Limits:**
  - 20 requests a day;
  - US$1 a month;
  - 5 seconds between requests;
  - the worst-case cost reserved up front;
  - size and time limits.
- **Logs** keep no content.

"What MyDay knows" tells the person what each job sends. Its list of which model does which job is maintained by hand
alongside the server's routing, so it can drift; generate it from one source.

**Quality:** model and job changes are decided by the scenario sets in `ai-eval/` and by blind reviews of real
replies. Accuracy and teaching quality come first; speed and price come after. An automatic pass is not enough.

### Privacy: what may reach AI

MyDay has one user, so "permissions" here means privacy rules, not access control between people.

- **Never sent:**
  - a project's outcome, what counts as finished, and "Where I left off";
  - who a task is waiting on;
  - private notes;
  - Finance and Health records (only the page's name);
  - name and email;
  - preferences and patterns.
- **Private projects (decided 24 Oct 2026): Private covers every AI feature except note filing.** Ask MyDay sends
  nothing of them; "Help me adjust today" sends their tasks on today's plan only as "a private task" (1.59.0); no
  revision cards are made from their notes (1.59.0). "AI help with notes" may still offer their name and summary as a
  place to file a note (the owner's choice, 17 Oct 2026). "What MyDay knows" says all of this.
- **A note's text** reaches Ask MyDay only when "AI help with notes" is on.

**Built (1.61.0):** one shared "what may reach AI" filter (`app/src/ai/reach.ts`) used by every job, and by every future tool. The server goes on
refusing any field it doesn't know.

### Proposed: read-only tools first

A small, explicit set of read-only tools, built on that filter and on the slices that already exist:

| Tool | Built on |
|---|---|
| Find projects matching a question | cross-section search (§5) |
| A project's current context | Ask's project slice |
| Search notes | Notes search |
| Today's plan and commitments | the "Help me adjust today" context |
| The learning recommendation | `nextLearning`, the one authority for what to study next |
| Open decisions, must-be-true items and waiting tasks | the project records |

Each tool:
- returns record ids, so an answer can say which records it used;
- says what was left out (private, switched off, or too much) and when the information was read.

These are proposals. A tool exists only once it's built and tested.

### Proposed: actions

Changes keep going through the existing checks and save paths. Before anything is saved, the app (never the model)
establishes:
- which records and exactly which fields the person approved;
- that the information is still current;
- whether the change has already been applied;
- whether saving worked;
- what can be undone.

Ask MyDay does most of this today. As actions grow, Undo should outlive the panel.

A model saying approval exists is not approval. Add new actions only for a defined need, each with a tested boundary.

---

## 5. Memory, personalisation and search

MyDay already keeps structured information. The aim is to make the right parts easy to find and use, without
building an unrestricted memory pool.

| Kind | Purpose | Must keep clear |
|---|---|---|
| Records | Tasks, projects, notes, appointments, learning | The saved truth |
| Project history | Decisions and choices, milestones, findings, open questions | What was recorded vs what was reconstructed |
| Confirmed preferences | Choices the person accepted | Their choices vs inferred behaviour |
| Observed patterns | Possibly useful trends | Evidence awaiting a yes or no |
| AI-made records kept as data | Revision cards (with their origin and models), kept explanations, AI-placed note links | Marked as AI-made, easy to find and remove |
| Conversation | Continuing one exchange | Temporary; nothing is kept now |
| Generated summaries (proposed) | Help resume work | Derived, linked to sources, marked stale when the sources change |

These kinds don't need separate copies of the same information.

### What exists

- **Patterns** are counted on the device over eight weeks:
  - "an early sign" under 20 examples, "a clear pattern" from 20;
  - a pattern is used only after "Yes — do that";
  - "Not really" hides it until there's clearly more evidence;
  - patterns sync with the account.
- **Preferences shape planning on the device:**
  - a chosen maximum number of tasks (never above what energy allows);
  - shorter tasks, shown as "(shortened from 60)" with a "Why?".
- **Gap:** "Forget my answer" forgets the answer but keeps the preference. Undoing the effect means finding "No limit"
  under Your preferences. Reconsidering should be one step.
- **Not built yet:**
  - conversation memory, with no commitment either way (make the case first);
  - patterns suggesting times;
  - AI seeing confirmed preferences (planned only if the person chooses).

  The last two are recorded only in a README line today; they belong in the register (§8).

### Deletion: what happens now, and what to decide

- **Deleting a note** removes its connections, related notes and graph place, which are all worked out on the fly.
  Revision cards made from it stay. Decide whether that's right (they are the person's cards) and say so, or offer to
  remove them.
- **Deleting a project:**
  - unlinks its notes and tasks and keeps its appointments;
  - sync marks every part deleted;
  - the markers, which hold no data, are kept for good;
  - copies saved before 1.44.0 remain in `sync_project_legacy`.

  **Decided (24 Oct 2026): "delete everything" is a true wipe** — your data on the device and in your account, the
  deletion markers and the pre-1.44.0 project copies all go; your sign-in stays. It needs a server change, built and
  reviewed before real use starts.

### Search

- **Built:**
  - Notes, matching a phrase in the title or text;
  - Tasks, matching a phrase in the title or notes;
  - Search this project (1.52.0), where every word must appear, in any order, ignoring accents and apostrophes, and
    nothing is sent;
  - lesson finders in Arabic and Cybersecurity;
  - recipe search (online, TheMealDB).
- **Next:** one search across sections, built on the same matching as project search. Then reuse it as Ask MyDay's
  retrieval tool.
- **Semantic search** only for a gap that keyword search shows it can't fill. Any outside index needs its own
  decision on privacy, cost, updates and deletion.
- **General Goals** join search when they exist.

---

## 6. Background work, outside services and files

### Nothing runs while MyDay is closed

- Filing notes by word matching runs on the device a moment after changes.
- AI note filing runs at most twice a day on each device, only while MyDay is open.
- Sync runs every five minutes while MyDay is visible, and on returning, reconnecting or changing something.
- The service worker only caches.

Any proactive or scheduled work needs:
- a trigger;
- the person's permission;
- a way to cancel;
- a spending limit;
- a notification choice;
- retries that never duplicate;
- a check that a suggestion is still current before it's used.

Build it for one useful workflow first, not as general infrastructure.

### Outside services today

- **Services MyDay calls:**
  - Supabase (sign-in, sync, the AI function);
  - the AI provider (from the server only);
  - gov.uk bank holidays;
  - TheMealDB for recipes.
- **Plain references:** links on courses and study tasks are plain links that MyDay never fetches. A case records
  where its evidence is kept; MyDay stores no files.
- **Connections:** decide each one separately. A link is not live access. A connector says what it can see and how
  fresh it is.

### Files and backups

- **Not built:** automatic backups and files.
- **Decided (24 Oct 2026): stored files go in Cloudflare R2** (`deploy/R2.md`), including the Cybersecurity
  portfolio's images and PDFs, rather than Supabase Storage. Automatic backups come first, as in the Projects
  vision's Phase 2 order.

---

## 7. Interface quality and how increments are made

### Each screen answers its most important question first

Each screen gives one useful next action prominence, with supporting context nearby:
- Today: Build my day, or the next task;
- a project: its next step;
- Study: Now.

The connected system should feel simple; its internals stay out of sight.

### What every screen meets (`AGENTS.md`)

- WCAG AA, with keyboard use, visible focus and reduced motion respected;
- 44 px targets;
- reachable on a phone (for example, Build my day visible without scrolling);
- the wording rules in §1.

### Design work

Use the Taste skill's app-screen rules **only when a screen's look or layout changes**, and keep MyDay's palette and
type. Don't use them for logic, data, copy or routine UI that follows the existing design.

### How an increment is made

1. A spec, with the owner's decisions recorded in it.
2. Building on its own branch.
3. New checks shown to fail without the change and pass with it.
4. An independent review. Use the `fable` model when saved data, sync, privacy or security is touched.
5. The owner's go-ahead.
6. Publishing, with going back a release kept safe.
7. A live check on disposable accounts.

Sessions working in parallel agree release order and tell each other before and after publishing.

---

## 8. Capability register

Track decision status, building and verification separately. Keep this register as the one place for "not yet"
items, rather than scattering them through the README. Update it with each release that changes a row.

| Capability | Built now (1.55.1) | Direction or next step |
|---|---|---|
| Idea-to-review path | Most steps (§1) | Close the gaps one at a time, starting with findings and their sources |
| Task completion in one place | 1.55.1: a tick on a plan marks the task itself done, dated the plan's day; 1.59.0: a rolled task follows its copy to the next plan, and Ask's Undo keeps a tick made since | Keep one answer as new views appear |
| Ask MyDay in context | Page slice, five reply kinds, checked proposals, one follow-up, one Undo | Read-only tools over the shared AI filter |
| General assistant tools | Not built | Start read-only; actions only for a defined need |
| One "what may reach AI" filter | Built (1.61.0): `app/src/ai/reach.ts`, used by every request builder, with a leak test; Private covers every AI feature but note filing | Every future lookup goes through it (`specs/ai-tools.md`) |
| AI quality checks | `ai-eval` scenarios, blind reviews, budgets | Required before a model or job changes |
| Saved records | Built | Keep sources and dates; mark summaries stale |
| Conversation memory | Not built; nothing kept | No commitment; make the case first |
| Preferences in planning | Built, on the device | Make reconsidering one step |
| Patterns suggesting times | Not built | Recorded as later work |
| AI seeing confirmed preferences | Not built | Only if the person chooses |
| Search | Notes, Tasks, one project (1.52.0), lesson finders, recipes | One search across sections |
| Semantic search | Not built | Exploratory; separate decision |
| Projects | Overview (1.46.0); outcome, finish line and "Where I left off" (1.48.0); waiting on (1.50.0); search (1.52.0); why this next step (1.54.0) | `projects-vision.md` Phase 2; its owner decisions open there |
| Explore | Renderer; the Hargeisa Marketplace exploration; generated starting briefs | Sourced AI explorations need retrieval and checking first |
| Study | Guided paths, Start/Continue (1.46.1); adaptive Arabic (1.47.0); Your focus and a calmer home (1.51.0); Arabic lesson journey (1.53.0); Cybersecurity lesson journey (1.55.0) | Adaptive rules for Cybersecurity and your own courses; Keep a word; Practise again and Progress; portfolio files; graduated help |
| Saving, export/import, sync | Built (schema 5) | Keep going back a release safe; "delete everything" as a true wipe (decided) |
| Automatic backups | Not built | Before files |
| Files | Not built; decided: Cloudflare R2 (`deploy/R2.md`) | After automatic backups |
| Closed-app or scheduled work | Not built | One workflow first, with limits |
| Outside connections | Supabase, AI provider, bank holidays, TheMealDB | Decide one at a time |

For each entry, keep:
- the person's problem and the intended outcome;
- decision status and where it was decided;
- what's built and where the code is;
- what was verified, when and where (tests or live);
- known limits and open decisions;
- the next approved increment.
