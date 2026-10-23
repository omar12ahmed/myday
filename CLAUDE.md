# MyDay

MyDay is a personal ADHD-friendly daily planner that I'm building while learning. The live app is the new version
(React, `app/`), published at https://omar12ahmed.github.io/myday/. `index.html` is the classic MyDay, still published
at https://omar12ahmed.github.io/myday/classic/ as a fallback.

**This file is public, because the repository is public.** It holds the working rules, my decisions and the current
state, so that any session can work on MyDay, including a cloud session. I keep a longer private copy on my Mac with
each release's full history. Never add personal details to this file or to commits, tests or docs. That means no email
addresses, account or organisation names, cloud project ids, Jira or Trello addresses, real saved data or private notes.
Use made-up data everywhere.

Read this file before making any changes. If something here seems to conflict with what I ask, ask me.

## Start here

- **GitHub's default branch is `main`, and it holds only the built website.** Before doing anything, check out
  `react-rebuild` (the source) or the branch you were given.
- In a cloud session, read "Cloud sessions" below first.
- `app/README.md` is the main reference. It covers what each section does, Saved data, "Where things are" (a table of
  files), Design and Cloud sync, and ends with a numbered note for every release.

## Repository map

| Where | What's there |
|---|---|
| `app/` | The new app (React + Vite + Tailwind CSS + TypeScript). `app/README.md`, `app/EXPLORE*.md` |
| `index.html` | The classic MyDay: one file, no framework |
| `content/` | Curriculum packages (Cybersecurity, Arabic Fuṣḥā, teaching), validated and prepared at build by `app/scripts/prepare-*.mjs` (needs Python 3) |
| `tests/` | Every check: `tests/run.sh`, `tests/README.md`, the shared browser kit `tests/cdp.js` |
| `supabase/` | Database migrations (`supabase/migrations/`), the `ai-plan` Edge Function (`supabase/functions/ai-plan/`, shared code in `supabase/functions/_shared/ai/`), `supabase/README.md` |
| `deploy/` | Building and publishing the website (`deploy/README.md`; its "no service worker" line is older than 1.10.0) |
| `ai-eval/` | AI evaluations on made-up scenarios (`ai-eval/README.md`, blind reviews in `ai-eval/reviews/`) |
| `android/` | The Android app (a Trusted Web Activity made with Bubblewrap), `android/README.md` |
| `design-system/myday/MASTER.md` | Design decisions (also "Design" in `app/README.md`) |
| `CYBERSECURITY_INTEGRATION.md` | How Study → Cybersecurity fits together, and its limits |
| `specs/` | Written specs for features not built yet, with their mockups |
| `mac-steps/` | What a branch still needs on my Mac, one file per branch (`<branch>.md`), deleted once done |
| `cloud-tasks/` | Work queued for cloud sessions, written on my Mac: what to do, what to leave for the Mac |
| `.claude/agents/` | The helper agents: test-runner, test-writer, docs-drafter |

## Branches, releases and what's live

- `react-rebuild` holds the source. `main` holds only the built website, which GitHub Pages publishes exactly as it is.
  Never commit to `main` by hand.
- Each piece of work gets its own branch off `react-rebuild`. On my Mac, that branch lives in its own worktree, so
  sessions don't trip over each other. When the work is released, `react-rebuild` is fast-forwarded to it.
- Tags: each release is tagged `vX.Y.Z` on `react-rebuild`, and the release before it is tagged
  `live-before-X.Y.Z` on `main`.
- Bump `app/package.json`'s version for each release. The release identifier (version, commit, build date) is at the
  bottom of every screen.
- **Live: 1.44.1** (23 Oct 2026, tag `v1.44.1` on source `988e506`; main `e4c9707`): Decide, Think again, Remove
  option and Remove decision work again when the browser blocks saving (changes kept until the page closes); in
  1.44.0 they used the cloud-sync save path and did nothing. They now use `update()`, like every other edit. Found by
  another session; an independent read-only review (Fable) said ship. Docs now say that removing or reordering an
  item rewrites the positions after it, so a concurrent edit to one of those is a conflict, not a merge. Build/lint
  passed; app-projects **422/0** (its new blocked-storage check [36] fails without the fix), app-sync **144/0**. Live
  check **22/22** on disposable account A in two throwaway browsers (version and source, decisions chosen, reopened
  and chosen again through the screens, received on the phone, tidied). No saved-data, sync, server or database
  change; going back to 1.44.0 is safe. `live-before-1.44.1` marks the previous main.
- **Previous release: 1.44.0** (23 Oct 2026, tag `v1.44.0` on source `e6e0f6f`; main `8ab7ecb`): projects sync as separate records
  (details, milestones, decisions, previous choices, Business Model, Case details, issues, evidence and timeline), so
  a whole project can exceed 512 KiB; each item keeps the database limit with a 380,000-byte editing allowance.
  Decisions keep **Previous choices** (label, reason and day; never pruned) and allow ten pros and ten cons per
  option. Saved data is **schema 5**: both apps read versions 2–5 and save 5; older releases refuse version-5 data
  without overwriting it. Started by another tool, finished and published from the Mac. Migration
  `20261023120000_split_project_sync.sql` applied first, after a fresh backup of the sync tables and a rehearsal on
  the live database (test data only) that rolled back: every project archived unchanged and split into its expected
  parts, every other record and the change log identical by fingerprint; the old `sync_push`/`sync_pull` now refuse
  with "Update MyDay on this device". Published about 30 seconds after the migration; Pages deployment succeeded.
  Build/lint passed; **all 58 default suites, 5,265 passed, 0 failed** (in two parts on an unchanged tree after a
  session restart) and `app-schema` 11/0 (the built 1.43.0 refuses schema-5 data without overwriting it). The first
  full run exposed a test-harness fault from 1.43.0: app-study-reset left browser contexts open and later suites
  attached to them (missing exports, app-install's "in-incognito"); `tests/cdp.js` now closes them. 23 stale schema-4
  expectations and app-final [70] were updated; no app code changed after the review. Live: server check **5/5**
  (accounts A and B) and a two-device browser check **22/22** on account A in throwaway browsers: version and source,
  upgraded sync notes, schema 5, a made-up project with a milestone and a decision chosen, reopened and chosen again
  (through the screens) received on the phone with the same content, separate parts in the account, old calls refused,
  a phone edit reaching the Mac, then deleted with no live part left. Profiles removed. Backups confirmed on every
  device before the migration. Going back needs the backups exported before updating and a coordinated database
  restore (`supabase/PROJECT_STORAGE.md`). `live-before-1.44.0` marks the previous main. The 643 approved audio files
  are unchanged.
- **Earlier releases:** 1.43.0 (22 Oct 2026, `v1.43.0` on `d0e14cf`): Guided Study's next, resumable or revisit lesson
  on Today, and a Study reset that needs a fresh checked backup. 1.42.1 (21 Oct 2026, `v1.42.1` on `a292886`): one Cybersecurity entry on Study home.
  1.42.0 (`v1.42.0` on `0d7cfdc`): Arabic audio round three (b). On the server: `ai-plan` version 21, Ask
  instructions `myday-ask-v16`, brain dump instructions `myday-tasks-v2`; unchanged by 1.43.0 and 1.44.0.
- **1.42.0, audio round three (b):** teaching explanations/examples, sound pairs and family notes/forms have
  explicit checked-clip controls. Try it and solutions wait for reveal; lesson-check prompts also wait for the
  reference data to load. Hide/navigation stop their own audio; revision and saved data unchanged. Review caught
  and fixed a shared family/list play key and a slow-answer-load reveal gap.
  The earlier 380 estimate included 14 fragments, two shadda-only words and a syllable drill; these are excluded.
  363 new clips were generated and transcribed blind, with 27 retakes across 21 texts. Six uncertain recordings
  remain held for a fluent reviewer, with the authored text unchanged. The owner listened to all 357 eligible
  clips in two batches: "both fine". **643 checked clips ship**; the six holds have no controls. All 357 new files
  decoded natively (679 seconds). Provenance: `content/arabic-audio/cross-check-teaching.json`. Temporary TTS keys
  deleted; no active task keys remained.
  Build and lint passed; **54/54 default suites verified, 4,956 passed, 0 failed**. The full run had one outdated
  headline-only assertion, corrected and rerun (66/0), and a documented Chrome disconnect in app-ai, which passed
  alone (207/0). No other failures. Live check: **24/24**, two disposable accounts in isolated throwaway browsers:
  native teaching/practice/answer/family playback, reveal/hide and loaded-reference gates, Stop/navigation,
  new-clip offline cache, sound-pair guidance, named 44px phone controls, device-only Slower, bare B1 text without
  controls, and both learning-data copies byte-identical. Profiles and listening server removed afterwards.
  Review, docs and runner agents were used; findings reviewed and resolved. Two test-writing agents reached their
  usage limit without edits, so main wrote the tests. Backups were already confirmed on every device in this session.
  No saved-data change; going back to 1.41.0 is safe.
- **1.41.0, audio round three (a):** 59 sentence positions, 58 distinct spoken texts, 3 reused clips and 55 new
  clips (2,177 characters, about 596 KB, 149 seconds). All 55 generated and transcribed blind with Gemini; main
  session reviewed every transcription, no retakes indicated (US$0.00886875;
  `content/arabic-audio/cross-check-reading-texts.json`). Owner listened to all 55 on 21 Oct: "all fine".
  All are checked; 286 clips ship. Dialogue names stay on screen, not in the voice. Vowel marks can be hidden
  without changing the audio or prepared transliteration. One shared player, with Stop and Slower, stops on leaving
  a text. No saved-data change; going back to 1.40.0 is safe. The temporary TTS-only key was deleted.
  Final build and lint passed; full run **53/53 suites, 4,894 checks, 0 failed** (24.2 minutes). The initial Calendar
  network wait passed on the final run (108/0). Owner confirmed backups on every device before publishing.
  Live check: **19/19**, two disposable accounts in two throwaway browsers; native first/next-sentence playback,
  Stop, hidden vowels, cached new clip offline, phone layout, device-only Slower, bare B1 text without controls,
  and both learning-data copies unchanged. Profiles removed afterwards. Test-writing, docs, review and runner
  agents were used; findings reviewed and resolved. `review-arabic-audio.mjs <source>` makes future local checklists.
- **Publishing happens only on my Mac.** The steps, in this order:
  1. Remind me to export backups on every device.
  2. Commit the release on `react-rebuild` and run the relevant checks under "After each change" below.
  3. Only the steps this release needs, each with my go-ahead: apply the migration, then deploy `ai-plan`.
  4. Run `deploy/publish-main.sh`, then `git push origin main`.
  5. Do a live check with the two disposable test accounts in two throwaway browsers, then tidy up.
- **Going back:** see `deploy/README.md`. Each release note says what going back to the release before does to saved
  data. Check that with the older release's own code and its built app.

## Cloud sessions

**Not in use since 20 Oct 2026 (my decision):** I no longer use cloud sessions; all work happens on my Mac. This
section stays for reference.

A cloud session works on a copy of this repository. It has none of my secrets, test accounts or saved data, and none
should be pasted in. Use cloud sessions for long, self-contained work: building on a new branch, running the full
tests, reviews and audits, writing tests and drafting docs.

- **Queued work:** when I point you at a file in `cloud-tasks/` (e.g. `cloud-tasks/next-steps.md`), do only the step
  I name, as that file describes.
- **Branches:** work on a new branch off `react-rebuild`, or on the branch you were given, and push only that branch.
  Never push to `main` or `react-rebuild`. Never merge, tag, or rewrite a branch that someone else pushed.
- **Mac-only steps.** These never happen in a cloud session:
  - deploying `ai-plan` or changing its secrets;
  - applying migrations, or doing anything else on Supabase (with the CLI or the Management API);
  - `deploy/publish-main.sh`, or pushing to `main`;
  - `tests/sync-live-check.js`, or anything else that uses the disposable test accounts;
  - live AI evaluations (`--live`);
  - building or signing the Android app;
  - anything that touches my real data.

  If the work needs one of these, finish everything else and list what's left for the Mac.
- **Mac steps in a file (my decision, 18 Oct 2026).** Whenever work leaves anything for my Mac, also write it as
  `mac-steps/<branch>.md` on that branch and push it with the work: the steps in order with exact commands, what to
  look at and review, the checks still to run (with what already ran in the cloud), and the release steps this
  release needs. One file per branch, so branches never conflict. No personal details: the repository is public. I
  delete the file once the steps are done.
- **Careful areas:** saved data, `storage.ts`, sync, migrations, `index.html`, AI instructions, the app's checks on
  AI replies, and security. Change these only when the task asks for it, and say in the report that they need a
  careful review.
- **The report.** Finish with:
  - the branch and its commits, and what changed;
  - every check that ran, with its counts and every FAIL line word for word;
  - every check that didn't run, and why;
  - what still needs my Mac (and that it's in `mac-steps/<branch>.md`).

  Keep the checks you ran apart from the checks I still need to do.

### Setting up a fresh machine

- You need Node.js 22 or newer, Google Chrome or Chromium, and Python 3. `tests/run.sh` finds `google-chrome` or
  `chromium` on the PATH; otherwise set `CHROME=/path/to/chrome`.
- Install the app's packages: `cd app && npm ci --no-audit --no-fund`.
- Deno is needed only for `ai-deno`. Have it on the PATH, set `MYDAY_DENO=/path/to/deno`, or run
  `npm install --prefix tests/.denotools --foreground-scripts deno@2.9.6`.
- A few checks need the internet: gov.uk bank holidays, TheMealDB and `npx live-server`. Offline, those fail and the
  rest still run.
- Test copies are built without sync settings or real AI, so they have no sign-in screen and send nothing.

## Technology and code layout

- MyDay is built with **React + Vite + Tailwind CSS + TypeScript** in `app/`. This replaced the earlier single-file,
  no-framework approach. The saved-data and ADHD-friendly principles below still apply in full.
- Keep UI components, storage and calculation logic in separate, understandable files: `app/src/components/`,
  `app/src/data/`, and one folder per section (`app/src/today/`, `study/`, `health/`, `projects/`, `notes/`, `tasks/`,
  `finance/`, `calendar/`, `capture/`, `knows/`, `patterns/`, `explore/`, `ai/`, `sync/`, `shell/`). Port existing
  business logic from `index.html` rather than reinventing it, and keep its wording.
- `index.html` (the classic MyDay) stays unchanged unless I ask for a change. It shares saved data with the new app, so
  the two must stay compatible.
- Screens are `#addresses` (e.g. `#study/roadmap`, `#projects/p/<id>/milestones`). Older `#inbox…` and `#notes…` links
  are rewritten by `app/src/shell/legacyLinks.ts`. Vite's `base: './'` lets the app work from any folder.
- **Installable:**
  - the web app manifest is `app/public/manifest.webmanifest`, and the icons are made by `app/scripts/make-icons.mjs`;
  - the hand-written service worker `app/sw/sw.js` is built for each release by the plugin in `vite.config.ts`. It
    caches the release and loads pages network-first, and it never touches the account, other sites or MyDay's data;
  - the footer offers "Install MyDay as an app" (`src/shell/install.ts`).
- **The Android app** is a Trusted Web Activity (Bubblewrap 1.25.0, app id `io.github.omar12ahmed.myday`). It opens
  the website, so it needs rebuilding only when the app's manifest or icons change. Its signing key is never in Git.
- **Running it:**
  - `npm run dev` in `app` serves http://localhost:5173. It updates as the code changes, and its saved data is separate
    and starts empty.
  - `npm run build` makes the built copy in `app/dist/`.
  - On my Mac, VS Code's Live Server serves the parent folder on port 5500: the classic app at
    `/myday-site/index.html` and the new one at `/myday-site/app/dist/index.html`. Both read the same saved data.
  - For testing, use a backup or made-up data, never a real plan.

## Direction (my decisions)

MyDay isn't primarily a task manager. It's an interface for turning vague intentions into understandable, manageable
actions. Every major feature serves one step of the progression **capture → understand → organise → explore → decide →
act → reflect**.

- **Projects are the spine.** A project gathers everything about one intention: an idea, research, notes, analysis,
  decisions, tasks, calendar items and progress. It shows where it is on the progression and always has one next step,
  and that next step is what reaches Today.
- **Navigation:** Today = act (tasks live under Today, `#today/tasks`). Projects has the tabs Projects | Notes |
  Connections.
- **Everything happens in MyDay.** Ideas and projects are built and kept in MyDay, not in Trello or Jira; existing cards
  and items there are left as they are.
- **Milestones of the Direction**, in order (each finished, checked and released before the next):
  1. Projects + tasks on Today (1.12.0)
  2. Understand & connect (1.13.0–1.15.0)
  3. Projects as workspaces (1.30.0–1.36.0, complete)
  4. Knowledge graph (Connections, 1.21.0)
  5. Study by subject (Your map, 1.21.0; the Cybersecurity lab)
  6. Reflect (the weekly review, 1.37.0)

  All six are released. What comes next is my decision; see "Open ideas" below.
- **Finish and check one milestone or release before starting the next.** Don't present something that hasn't been
  built as if it works.

### AI design (my decision, 17 Oct 2026)

There is one shared AI with three ways in: proactive, ask-anywhere, and contextual actions on pages. All of them go
through the same `ai-plan` service. It's never a chatbot bolted on.

1. **One entry point:** the + Capture button contains Ask MyDay. There's no second floating AI button.
2. **AI runs only on a tap.** Background work is ordinary code: free time, overload against energy, tasks that keep
   moving, links. Any automatic AI is off until I switch it on, has a daily cap, and never runs on every page open.
3. **The app is in control.** The app chooses and sends the relevant slice of data, and each request shows what it
   sends: a preview with the values themselves, and "Show everything that's sent". The model returns a proposal in a
   fixed shape. The app checks it and applies it only on my tap. The model has no tool or database access.
4. **Memory is MyDay's own, visible and editable** ("What MyDay knows", `#knows`). The AI never writes it. There are no
   stored AI inferences about me.
5. **One request at a time.** Answers are cards to accept, edit or dismiss, with one follow-up at most. No chat
   transcripts are kept.
6. **One next step rather than lists.** Suggestions appear only where I already look (Today). No notifications.
7. **Every new AI job is evaluated** on made-up material, judged blind on quality and accuracy, and I decide its budget.

**What Ask may do.** Ask can:
- add tasks, notes, steps, milestones, labelled pros and cons, and "what must be true" items, only the ones I tick;
- change existing items, shown before → after and applied only when ticked, with Undo restoring exact copies. It may
  change a task's or appointment's day and time, titles, a task's length or list, and which project a task or note is
  in. A task's list, length or title changes only when what I typed asks for it;
- start a revision round;
- hand "plan my day" over to Help me adjust today.

Ask never deletes anything and never marks anything done.

**AI roles (my decision, 10 Oct 2026):**
- GLM (GLM-5.3-Flash) is the main assistant: planning, task breakdown, procrastination support, plan adjustments,
  reflection, ideas and projects, structured outputs.
- Gemini (3.8 Flash) is the learning specialist.
- Jobs are routed per action on the server; see "AI help" below for the live set-up.
- MyDay stores all learning history; the AIs remember nothing.
- AI-made cards are proposals I accept or edit, each linked to its source.

**Research** by the AI is the model's own knowledge, labelled as such, until a web-search service is added (a cost and
key decision for later).

### Privacy: nothing is private by default — I choose

- **Private notes** (a switch at the top of a note) are never sent to AI.
- **AI help with notes** (off until I switch it on) never looks at the note that's open, or at one whose words changed
  in the last 5 minutes.
- **A private project** (a switch on the project): Ask MyDay sends nothing of it. That covers its name, summary,
  milestones, decisions, its tasks, notes and appointments, and its one page. AI help with notes may still offer its
  name and summary as a place to link notes, and never anything else.
- **Cases:** a case's timeline, evidence and issues are never sent to AI, whether it's private or not. A case starts
  not private, like every project. Otherwise a private case behaves like any private project.
- **MyDay may link things by itself:** a note to a project, related notes. These are listed under "MyDay connected
  these" with Keep and one-tap Undo. It never edits or deletes what I wrote, and never adds tasks or calendar entries,
  or spends money, without a tap.

### Projects as workspaces (milestone 3, complete)

- **The board** (`#projects`) has the columns Ideas · Exploring · Doing, by stage. One tap moves a card a column on or
  back. A gentle note appears past three projects being explored or two in Doing; it's never enforced. **Recently** on
  a project's page shows up to five recent events.
- **Project tabs:** Overview · Milestones · Decisions. A business idea adds Model; a case has Overview · Timeline ·
  Evidence · Issues instead (its milestones and decisions are reached from Overview cards).
  - **Milestones and decisions** are optional lists inside the project (`app/src/data/projectPlan.ts`). Decide uses
    **pros and cons**, with no scoring. Nothing happens automatically.
  - "Suggest milestones" gives ticked suggestions only.
  - "What am I missing?" appears only after I've written an option with a pro or con myself. It suggests labelled pros,
    cons or an option, and never chooses, ranks or scores.
- **The Business template** (`template: 'business'`) has a one-page model of **four simple questions**: what problem,
  for whom, how it works and pays, and what must be true. It could open out into a Lean Canvas later. Its rules are in
  `app/src/data/businessModel.ts`.
  - "What must be true": at most 12 items, each at most 110 characters.
  - "Find out" makes a 15-minute task in the project. Only I mark an item Looks true or Doesn't hold.
  - "Suggest what must be true" is offered only on the Model tab and only once the first three questions are answered.
    Never on a private project, and not once there are 12 items.
  - The one page is sent to AI only from the Model tab.
- **The Case template** (`template: 'case'`, records in `project.case`, `app/src/data/caseFile.ts`):
  - deadlines are the case's dated tasks and appointments. MyDay never works out legal time limits;
  - sources are kept apart (My account / Their account / In the evidence);
  - no legal advice: the "Your case" card carries a not-legal-advice line pointing to ACAS and Citizens Advice;
  - no AI and no Explore;
  - limits: 150 timeline entries, 150 evidence items, 20 issues. Since 1.44.0 each item syncs as its own record, so
    the 380,000-byte allowance applies per item, not per project (the account refuses records over 524,288 bytes).
- **Dashboards** ("At a glance" on every project's Overview; `app/src/projects/AtAGlance.tsx`,
  `app/src/data/projectDashboard.ts`):
  - four tiles per kind, using places and counts, never percentages;
  - pictures only when there's data;
  - "Worth a look" gives at most three gentle pointers;
  - "Summarise this" runs Ask only on a tap and never on a private project. A summary says only what the data shows (a
    done "Find out: X" means I looked into whether X, never that it's confirmed). It gives no legal, medical or money
    advice.
- **Explore:** the Hargeisa Marketplace story is my own real business idea that I'm researching. It is **never an
  example or a sample**: don't use that framing. Keep honest labels (hypotheses, not findings; placeholder figures
  until my research replaces them). A business idea's Explore starter is built from its one page.

### "Your week", the weekly review (Reflect, milestone 6; 1.37.0)

`#review` (`app/src/review/ReviewScreen.tsx`, rules in `app/src/data/weekReview.ts`) covers the last seven days in four
steps, one at a time:
1. **What moved:** for each project, tasks done, milestones, decisions, things found out and case records; then other
   tasks, Study sessions and minutes, and workouts. A quiet week says "A quiet week — that's allowed".
2. **What's waiting** (at most 5): stuck tasks (`isStuck`), projects quiet for 14+ days, decisions open for 14+ days,
   done Find outs and evidence to get. Each offers a gentle choice: Pick a next step, What's in the way?, Open it,
   Pause it, Let it go, or Leave it for now.
3. **Next week's focus:** up to three active projects (`project.focus`). They come first in "From your projects" on
   Today (`stepsForToday`) and are labelled "This week's focus" there and on the board.
4. **A line or two** (optional): saved as a note "Week of …" in Personal, with `reflectionWeek`.

A card (`app/src/today/ReviewCard.tsx`) appears on Today only on my review day (Sunday unless `prefs.reviewDay` is 1–6)
and the day after. It stays until I've reviewed (`prefs.reviewed`) or chosen "Not this week" (`prefs.reviewHidden`).
There's also a link from Projects.

**See the pattern** uses Ask's `review` page: counts and names only, nothing of private projects. Its instructions
(`myday-ask-v16`) are warm: one or two patterns from the facts, never judging or guessing why, and one small
suggestion. All the new fields are optional and kept by 1.36.0.

## What MyDay has (a map; details in `app/README.md`)

- **Today:**
  - energy 1–5 with its task limits, and Build my day with a proposal I confirm. On phones, Build my day must be
    visible without scrolling;
  - Focus mode ("just what's next");
  - one quiet day-summary line above today's plan, only when it helps, never a score;
  - Your tasks, From your projects, Due today;
  - the focus timer, and cards for Study, Workout, Food reminders and the review;
  - the evening check-in;
  - AI help: "Help me adjust today" and "Add what's on my mind" (which can put tasks into a Tasks list, from
    1.40.0).
- **Calendar:** a repeating shift pattern with versions that start from a chosen date; one-date changes stored apart
  from the pattern; appointments; bank holidays from gov.uk.
- **Finance** replaced Pay in the new app; the classic keeps Pay. It shows:
  - work pay from the Calendar, with the same rules as Pay (`app/src/data/pay.ts` unchanged);
  - money owed, monthly expenses, and what's left over;
  - my rates, saved once on the first visit and folded away under "Rates".

  Keep this screen minimal: no settings card and no extra figures.
- **Study:**
  - topics → stages → courses on a roadmap;
  - concepts and revision, which tell "slipped" apart from "hasn't clicked yet", with a gentle stop after 10 reviews a
    day;
  - Your map: progress as a place, lit up, with fog for what's unexplored. No percentages, nothing "behind";
  - Reading: books, the page you're on, notes; nothing on Today, never in the learning streak;
  - **Cybersecurity:** a lab with the learning map, lessons, Practice shelf, lab notebook and toolkit; an AI tutor;
    the course's own checks in revision; AI "More practice" cards;
  - **Arabic Fuṣḥā:** the curriculum package read-only, lesson sessions, starter words and lesson checks in revision,
    transliteration, and word families on the vocabulary page (four roots linking 12 of the 48 starter words; MyDay's
    own authored file, checked at every build; nothing saved), and a synthesised voice for the 48 starter words and
    their examples (1.39.0), each lesson's headline example (1.40.0), the 8 vowelled reading texts (1.41.0), and
    checked teaching examples, sound pairs and family notes/forms (1.42.0). Practice, solutions and lesson checks
    wait for the answer to be revealed and loaded. One voice, made once and listened to before shipping, labelled "Synthesised voice — a model to copy;
    checked by ear, not yet by a teacher"; clips keyed by
    their exact text, with their audit, in `content/arabic-audio/`; which texts have a voice in
    `app/scripts/arabic-voice-sources.mjs`; checked at every build by `app/scripts/prepare-audio.mjs`. The 6 unvowelled
    B1/B2 reading texts, unvowelled pieces, letter/syllable drills, fragments and six uncertain recordings have no controls. It never claims certified levels, and keeps
    the package's 0–100 evidence scores internal.
- **Health:** Workout, Daily exercises, Food (recipes, kitchen, shopping list), and Goal. Goal's estimates come from
  public guidance, labelled with their sources. It sets no calorie targets when someone is pregnant, after an eating
  disorder, or with a condition, and never calls food "good" or "bad".
- **Projects:**
  - the board, project pages and templates;
  - **Notes:** an inbox, collections, private notes, related notes;
  - **Connections** (`#projects/connections`, the knowledge graph, drawn from links, never managed by hand);
  - Explore.
- **Capture / Ask MyDay** (+ on every screen): suggestions on the device from what I type (chrono-node, compromise,
  plain rules). Nothing happens without a tap.
- **What MyDay has noticed:**
  - Patterns, not judgements, from a deterministic on-device engine (`app/src/data/patterns/notice.ts`); no AI, nothing
    sent.
  - Patterns aren't saved; my answers and preferences are. A pattern is used only after "Yes — do that".
  - Adaptations happen in the open, with a "Why?". It never changes my energy rating.
- **What MyDay knows** (`#knows`): what Ask sends, in the same words as Ask's preview (`SENDS` in
  `app/src/ai/askContext.ts`).
- **Ideas** is only a placeholder (it was one in the classic too).

## Open ideas (not decided: ask me before building any of them)

- **A voice across the whole Arabic course** (`specs/arabic-audio-course.md`; my answers, 20 Oct 2026: "1-6 yes").
  Round two (the lessons' headline examples) shipped in 1.40.0. Round three (a), the 8 vowelled reading texts by sentence,
  shipped in 1.41.0. Round three (b), teaching examples, try it, solutions, sound pairs and family forms, shipped
  in 1.42.0: 357 approved clips, six uncertain recordings held back. In checks, answers and "try it", the voice
  waits for the answer to be shown and loaded. No voice for letter drills; one voice for everything. Text without
  vowel marks and the six holds wait for a teacher or fluent speaker. `app/scripts/arabic-audio-inventory.mjs --rounds`
  shows source coverage; held-piece counts are estimates because passages and sentence clips have different boundaries.
- **Roots in revision** (word families, `specs/vocabulary-families.md` §8): not now — the families are for noticing,
  not testing. Revisit after a month of use (from 1.38.0, 19 Oct 2026).
- **More AI:**
  - notes pasted from outside MyDay, sorted into tasks, Study items and ideas;
  - revision cards from trusted material I add (PDFs, e.g. with Gemini's File Search);
  - a web-search service for research (a cost and key decision);
  - meaning-based related notes (an embedding service, a later decision).
- **A Lean Canvas** opening out from a business idea's one page.
- **Patterns:** time-of-day suggestions. Giving AI my confirmed patterns and preferences, only if I opt in.
- **A small known wrinkle:** Undo after Ask adds steps to a project leaves the project's `updatedAt` as it was after
  the Add (a timestamp only).
- **The subagents:** review whether their work has held up, and whether a screenshots agent is worth adding.

## Project principles

### Building

- Start simple and build incrementally. Prioritise a working, usable product over technical sophistication.
- Keep the code understandable and maintainable, because I'm learning while building this.
- Keep unrelated changes separate and avoid unnecessary rewrites.
- When suggesting a new feature, explain the practical problem it solves before implementing it.
- Planning and every decision are mine. Bring me choices with a recommendation, and don't build what I haven't agreed.

### Tone

- Keep UI language friendly, supportive and non-judgemental, in plain British English. No guilt, shame, pressure or
  punishment for missed tasks.
- Progress is shown as places and counts, never scores or percentages. Missed days cost nothing.
- Name things the way the app does: Today, Build my day, Ask MyDay, What MyDay knows, Help me adjust today.

### Saved data

- Before changing data storage, inspect the existing localStorage keys and the data's structure.
- New features must not break, silently overwrite or delete existing saved data.
- Keep backwards compatibility with existing saved data. If the structure needs to change, write a migration rather
  than resetting my data.
  - Before a migration, make sure I can export a backup. Explain the migration and get my confirmation before applying
    it.
  - Most additions are optional fields, absent when unused, and kept unread by the release before. Check that going
    back keeps them.
- **The shared key:** both versions use localStorage key `myday.data.v4` (`schemaVersion` 5 since 1.44.0; versions
  2–4 are read and saved as 5; older releases refuse version-5 data without overwriting it).
  - A change to fields the classic also reads is made in `index.html` and in `app/src/data/` together.
  - Some top-level sections exist in the new app only: `finance`, `notes`, `tasks`, `projects`, `patterns`, `fitness`,
    `cybersecurity`, `arabic`, `reading`. The classic keeps unknown sections unread.
- **One way in:** in the new app, all reading and writing of saved data goes through `app/src/data/storage.ts`.
  - It loads and checks the data before any save.
  - It keeps sections it doesn't handle, and unknown fields, exactly as they are.
  - It never saves over another tab's newer data, and it reports a save lost to a simultaneous write in another tab.
    That last case is detected, not prevented: localStorage has no locking. Don't claim more than that.
  - Nothing unreadable is left out silently: the app says how many entries it couldn't read and offers "Download a
    copy".
- **Older data:** moving data from older versions of MyDay (`myday.data.v3`, `v2`, version 1) is done by the classic
  MyDay. The new app saves nothing until that has happened.
- **Never save or send half a character.** Cutting text with `.slice()` can split an emoji and leave a lone UTF-16
  surrogate. PostgreSQL's jsonb refuses that, and one such record would stop a device syncing.
  - `mendHalves` (`app/src/data/util.ts`) removes lone surrogates when saving (`persist`), when reading (`parseSaved`)
    and before a change is sent (`sync/engine.ts`).
  - Keep it in those paths.
- **Device-only keys** (not part of `myday.data.v4`, not synced, not exported):
  - `myday.focus`;
  - `myday.sync.v1` (read and written only by `app/src/sync/state.ts`);
  - `myday.sync.auth`;
  - `myday.ai.connect`;
  - `myday.arabic.transliteration`;
  - `myday.arabic.slower` (the starter words' voice at three-quarter speed).

  Theme, animations, running timers, downloaded bank holidays and nudges also stay per device.

### Cloud sync (Supabase)

- **Account first:** MyDay follows the signed-in account, not a device.
  - A device that isn't signed in shows a sign-in screen (`app/src/sync/gate.ts`, `SignInGate.tsx`). A signed-in
    device opens straight away, offline too. "Use MyDay on this device for now" appears only when the account can't be
    reached.
  - Never lock me out of the data on a device.
  - UI words: "Saved to your account", "Saving…", "Saved on this device", "Your account", "Update now". No sync jargon.
- **Signing in combines the device with the account automatically:**
  - account-only records come down, and device-only records go up;
  - where the same record differs, the account's version wins and the device's is kept aside (downloadable), never
    silently lost;
  - conflicts from editing the same record on two devices are shown for me to choose, never merged silently;
  - a device holding another account's MyDay is never mixed with a different account.

  Signing out first makes sure everything is saved, then removes MyDay's data from the device.
- **Everything I enter syncs.** The record definitions are in `app/src/sync/records.ts`. Every record must survive the
  round trip unchanged (`tests/run.sh sync-records`).
  - Adding a new part of MyDay to sync means a record definition there **and** its kind in a new migration.
  - The account refuses records over 524,288 bytes.
- **Sync doesn't change the shape of `myday.data.v4`.** Records from the account are checked with `normalize` and saved
  through `storage.ts` (`updateSaved`).
- **Building with sync:** the app syncs only when built with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - The published build gets them from `app/.env.production` (public values, committed).
  - `tests/run.sh` builds its test copies without them.
- **Database changes** go in version-controlled files in `supabase/migrations/`. Never edit a migration that has been
  applied; add a new one.
  - Keep Row Level Security on and grants minimal (no direct table writes). Writes go through `sync_push_v2` with
    version checks (since 1.44.0; the old `sync_push`/`sync_pull` refuse with "Update MyDay on this device").
    Projects travel as separate records (see `supabase/PROJECT_STORAGE.md`).
  - The project has no CLI migration history table: migrations are applied on my Mac through the Management API, in
    one transaction, checking that existing rows are unchanged by fingerprint.
- **Keys:** only the publishable key goes in the app. Secret and service_role keys never go in the app, in `VITE_`
  variables or in Git; `vite.config.ts` refuses to build with one.
- **Testing:** use disposable accounts and data only. `tests/run.sh sync-db app-sync` uses a local stand-in (PGlite +
  `tests/supabase-standin.js`), not Supabase. Only `tests/sync-live-check.js` checks the real project, and it runs on
  my Mac. Don't claim live sync was tested unless it was.

### AI help

- **Every reply is checked by the app, and saved only after I confirm.**
  - "Help me adjust today" is checked by `app/src/ai/validate.ts`: energy limits counting what's done, open tasks by
    id, lengths, free time from the calendar's own logic, rest always allowed, missing information named, gentle
    wording. It's saved through "Review my plan"'s save path, refused if stale, with Undo.
  - Never let the model write directly, change energy, task lists or history.
- **The server.** One Edge Function, `ai-plan`, has the jobs `adjust`, `tasks`, `connect`, `tutor`, `cards`,
  `note-check`, `note-cards`, `explain`, `explain-arabic` and `ask` (`supabase/functions/_shared/ai/`).
  - Each job's instructions are versioned (e.g. `myday-ask-v16`).
  - Deploy with Supabase's platform JWT check on (no `--no-verify-jwt`). The function verifies the sign-in before
    reading the request, charging the budget or calling a model.
- **Keys and settings.** AI keys live only in the function's secrets: never in the app, `VITE_` variables or Git.
  `supabase/ai-secrets.example.env` stays a template with placeholders. Model ids, addresses and prices come from the
  providers' official documentation (with the date checked).
- **The live routing:**
  - GLM-5.3-Flash on the lowest reasoning effort (it can't switch thinking off);
  - `AI_ROUTES={"cards": "learn", "note-check": "learn", "explain-arabic": "learn"}`, with "learn" = Gemini 3.8 Flash;
  - `AI_FALLBACK=off`. With the fallback on, every request would also reserve the other model's worst case against the
    budget;
  - GLM checks AI cards at high reasoning (`AI_CHECKER_EXTRA_BODY`, used only when checking);
  - `AI_ROUTES` ignores jobs it doesn't know.

  Routing code: `routeFor` in `supabase/functions/_shared/ai/providers.ts`. Model settings stay in configuration
  (`providers.ts`, `ai-eval/models.json`).
- **Limits are enforced on the server:**
  - US$1 a month, with a worst-case reservation;
  - 20 requests a day per account, shared;
  - a 5-second pause between requests (`AI_MIN_SECONDS_BETWEEN`);
  - output tokens and timeouts.

  Logs hold no content.
- **Practice mode:** `VITE_AI=mock` means no AI and nothing sent. The published build uses `VITE_AI=edge`. To switch AI
  off without a release, set the function's secret `AI_PROVIDER=off` (on my Mac).
- **Evaluations** use made-up scenarios only (`ai-eval/`). Live runs need `--live`, keys from the environment and a
  `--budget-usd`, and run on my Mac. Always say whether results came from real API calls or mocks.
- **Judge models on quality and accuracy first**; speed and price come after.
  - Read the replies blind, against a written rubric (accuracy, teaching, next step, safety). Automatic pass/fail
    checks aren't enough.
  - To test a model as a *checker*, use real drafts labelled blind, not hand-seeded mistakes, which are too easy.
- The Supabase CLI is pinned at `npx -y supabase@2.120.0` (2.121.0's package lacks the darwin-arm64 binary).
  Supabase counts a new function version for each settings change too.

### Design

- **The Clarity look** (from 1.21.0): flat and warm.
  - Colours: warm paper page (#f7f5ef), white cards, charcoal text. The teal accent is `primary` (#0f766e light /
    #7ed7c6 dark). One warm orange is reserved for Capture (`accent`, #c2410c light / #f0a069 dark). The dark theme is
    warm charcoal (#141815), and done is green (`done`).
  - Shapes: quiet borders over shadows; cards 12px, buttons 8px; solid primary buttons; generous spacing.
  - Layout: light by default, and Match device follows the system (browser bar included). Wide screens have a 208 px
    neutral sidebar; phones have a frosted floating bar, with Capture in the header.
  - Files: `app/src/styles/tokens.css`, `app/src/index.css`, `components/Button.tsx`. Decisions are in `app/README.md`
    ("Design") and `design-system/myday/MASTER.md`.
  - Sequential teal steps for pictures: `--seq-1/2/3` (validated in light and dark).
- **The classic MyDay** keeps its green look. Both share the Plus Jakarta Sans font and the task timeline.
- **Today** is a dashboard: a greeting with my name (`patterns.prefs.name`), a calendar, quick add, a focus timer card,
  a "2 of 3 done" ring and week bars. No scores or percentages, and no app block list.
- **Contrast:** every text colour pair passes WCAG AA in both the dark and light themes.
- **Tap targets** are at least 44 px (`app-projects` checks this). When a check catches a small target, fix the app,
  not the check.
- **Components:** use the ui-ux-pro-max skill for UI work when it's available. Adapt components from 21st.dev into the
  existing components rather than adding shadcn or another UI framework, and ask before adding one. The 21st.dev free
  plan allows 2 component code retrievals a day: search (free) first and retrieve only what will be used.
- **Explore images:** images I supply are examples to work from. Use the strongest legitimately licensed image for each
  story role, and never add images just for visual density.
  - Prefer Wikimedia Commons files with a clear licence.
  - Check for watermarks, and blur real people's contact details.
  - Record provenance in `app/src/explore/assets.ts` and credit the image in its caption.
  - Keep the byte budgets in `tests/explore-assets.test.js`.

### Shifts and pay

- Preserve the underlying repeating shift pattern when changing an individual shift; store exceptions separately.
- Label pay calculations clearly as estimates, and name the tax year and the source of the rules used.

## After each change

Run checks that match what changed and report their results, including failures.

**Testing scope (owner's decision, 21 Oct 2026):** run the full suite only when necessary, never automatically
for every fix or release. Start with checks for the changed behaviour and its dependencies. Expand to a full run
only when the change's reach, uncertain dependencies or regression evidence make targeted coverage insufficient;
explain that reason before starting. Sensitive areas (saved data/storage, sync, authentication, migrations,
security, calculations and shared core logic) need careful coverage, but a file/category alone does not trigger
all suites. Small UI fixes and documentation changes do not trigger a full run by themselves.

- After changing app code in `app/`, run `npm run build` and `npm run lint`, then the browser/rules suites for the affected
  behaviour and its dependencies. For a display-only change, test the affected screens, navigation and phone
  layout; verify that existing saved data stays unchanged where relevant. Do not run every suite just because
  an app file changed.
- After changing `index.html`, run the relevant classic suites, plus new-app compatibility checks if shared data
  or behaviour is affected. Expand to a full run only when justified by the scope above. On my Mac, while
  Live Server is running, use `MYDAY_LS_PORT=5599 tests/run.sh`.
- After changing sync (`app/src/sync/`, `supabase/` or `storage.ts`), include the relevant `sync-db`,
  `sync-records` and `app-sync` checks; choose any broader coverage using the scope above.
- After changing AI, include `ai-rules`, `ai-server`, `app-ai` and the opt-in `ai-deno` (the function's real entry
  under Deno). Expand to every default suite only when targeted coverage cannot adequately cover the affected flows.
- **Before a release:** build/lint and the relevant checks must pass, followed by a live check with disposable
  accounts in throwaway browsers. A small UI release does not require the full suite. Report the actual scope;
  never describe a targeted run or an interrupted full run as a complete one.
- **Full run when justified:** `tests/run.sh` with no names, currently 56 default suites. Do not repeat checks
  that already passed unless code changes, failures or unresolved concerns justify it.
- **Running the tests:**
  - Ports: `MYDAY_HTTP_PORT` (default 8765), `MYDAY_CDP_PORT` (9333), `MYDAY_SUPA_PORT` (54329), `MYDAY_LS_PORT`
    (5500). Only one test run per set of ports at a time; give each worktree its own set.
  - Account for every requested suite result, not just FAIL lines: a suite can stop early without a summary.
  - Known flakes: rerun that suite alone once and report both results. If it fails the same way twice, it is a
    failure. The list is in `.claude/agents/test-runner.md`.
- **Then explain** what changed, how to check that it works, and any limitations. Keep checks actually performed
  apart from checks still needed, and explain why any normally relevant check was omitted.

## Working with subagents (my decision, 17 Oct 2026)

The main session (Opus) thinks. Routine work that's long or wordy goes to the cheaper project subagents in
`.claude/agents/`.

- **The main session keeps:**
  - planning and every decision with me;
  - anything touching saved data, `storage.ts`, sync, migrations, `supabase/`, `index.html`, AI instructions, the
    app's checks on AI replies, security or secrets;
  - design and UI wording;
  - reading AI evaluation replies (judged blind);
  - reviewing everything an agent produces;
  - commits, merges, deploys, publishing, GitHub, Supabase, live checks;
  - talking to me.
- **Delegate:**
  - `test-runner` (Haiku): build, lint, and any test run longer than a moment. It reports counts and every FAIL line,
    word for word.
  - `test-writer` (Sonnet): new checks for behaviour already specified and built, in the named test file. Read every
    added check before committing.
  - `docs-drafter` (Haiku): the release note, a feature paragraph and a "Where things are" row in `app/README.md`. This
    file and my decisions stay with the main session.
- **Don't delegate:** one-line commands, quick searches, anything needing judgement or my answer, anything
  outward-facing, anything near secrets.
- **Every delegation names** the folder, the four test ports, the exact files or suites, and what "done" looks like.
  Agents never commit, push or deploy.
- **Check, then report:** pass on results as the agent's own counts give them, and re-check anything that looks off. If
  an agent's work isn't good enough, redo it rather than ship it.

## Lessons learned (don't repeat these)

- **Check that a file doesn't exist before writing a new one.** A new `data/dashboard.ts` once overwrote Today's
  dashboard file. The type-check caught it, and it was restored from git.
- **The real server pauses 5 seconds between AI requests.** A request that follows another at once (cards right after
  a note check) was refused every time. The test stand-in had the pause off, so test with it on. The app now waits
  and retries once.
- **A throwaway browser's "Saved" isn't proof.** Confirm a change on the second device before closing the first.
- **Check what the app shows, not what you expect in storage.** Something mended in memory is written at the next
  save.
- **When a check catches a real problem, fix the app.** Never weaken, skip or bend a check to get a pass.
- **List every changed file from `git status` before finishing.** Delete stray backups such as `*.js-e` from `sed -i`,
  and prefer real edits to `sed`.
- **Plan the order of server changes.** A server setting the previous `ai-plan` didn't understand once made it refuse
  every request. `AI_ROUTES` now ignores unknown jobs, but think through what going back on the server means before
  changing settings.
- **A tired machine causes flakes.** Several suites stopped early while the Mac's load was high (another tool running
  tests). Re-run them alone before calling them failures.
