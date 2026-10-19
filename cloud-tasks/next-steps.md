# Cloud tasks: the next steps after 1.39.0

Written on the Mac on 19 Oct 2026, for cloud sessions. The owner will point a session at **one** step below. Do
only that step.

**Before anything else, read `CLAUDE.md` in full.** It holds the rules these steps rely on, especially:
- "Cloud sessions", with the Mac-only steps and "Mac steps in a file";
- "Careful areas";
- "Saved data";
- "After each change";
- "Lessons learned".

## How every step works

- **Branch:** start from `react-rebuild` at 1.39.0 or later, on the branch named in the step. Push only that
  branch. Never push to `main` or `react-rebuild`, and never merge, tag or publish.
- **Mac steps:** before you finish, write `mac-steps/<branch>.md` on the branch and push it with the work. It says
  what's left for the Mac, in order, with exact commands.
- **The report** (as `CLAUDE.md` says):
  - the branch and its commits;
  - every check that ran, with its counts and every FAIL line word for word;
  - every check that didn't run, and why;
  - what still needs the Mac.
- **The owner decides.** If a step reaches a choice that isn't settled here or in `CLAUDE.md`, stop at that point.
  Write the choice down with your recommendation, and don't pick it yourself.
- **No personal details anywhere:** the repository is public. Use made-up data only.

---

## Step 1: make the full test run pass in a cloud session (tests only)

**Branch:** `cloud-test-run`

**Why.** Cloud sessions are the place for full test runs, but a full run there can't currently pass. On 18 Oct a
cloud session ran all the suites, and 13 failed there and nowhere else:
- calendar-pay, health and study;
- app-calendar-pay, app-finance, app-tasks, app-patterns, app-study, app-workout and app-final;
- app-explore, app-explore-visual and app-architecture.

They failed for three reasons:
1. **No network.** The cloud machine can't reach gov.uk (bank holidays) or TheMealDB (recipes), and can't run
   `npx live-server`.
2. **A different date format.** The cloud's Chromium writes short dates as "Sat, 26 Sept"; the Mac's Chrome
   writes "Sep".
3. **A smaller window.** The headless browser doesn't give the Explore suites their 1440 px window.

There is also the clock. On 19 Oct, app-ai failed whenever it ran between midnight and 08:05: its made-up notes
were stamped "today 08:00", which was still in the future. Commit 2468dbc fixed that one suite. Others may have
the same kind of problem.

**What to do.**
1. **Reproduce first.** Run the full suite (`tests/run.sh`) and list every failure with its cause.
2. **Fix the tests, not the app.** The app is right in each known case. If you find a real app bug, stop and
   report it instead.
   - **Network.** Add an opt-in offline mode, for example `MYDAY_OFFLINE=1 tests/run.sh`.
     - In it, the page's requests to those sites are answered from fixture files in `tests/fixtures/`, with the
       real sites' shapes and made-up content (CDP `Fetch` interception or the local test server).
     - Without the variable, a run behaves exactly as it does today, on the real network.
     - A check that can only be true against the real site (`npx live-server`, for example) prints
       `SKIP <its name> (offline)`. It's counted apart and never as a pass, and the run's summary shows the skip
       count.
   - **Dates.** Don't hard-code "Sep". Work out the expected text with the same `Intl` / `toLocaleDateString` call
     inside the page, or accept exactly "Sep" or "Sept".
     - Don't change what the app shows: it follows the browser's own formatting.
     - If you think the app should fix its own month names, put that in the report as a question for the owner.
   - **Window.** Give the suites that need a size that size explicitly (CDP `Emulation.setDeviceMetricsOverride`,
     or Chrome's `--window-size`), so the Mac and the cloud agree.
   - **The clock.** Search every suite for anything that only works at certain times:
     - made-up data stamped at fixed times of today ("T08:00", "T09:30"…);
     - "tomorrow" or "yesterday" across midnight;
     - Match device or dark mode at night;
     - the end of a week or a month.

     Fix each so the suite passes at any time. Where the harness allows, prove it by running the affected suites
     with the timezone set so local time is just after midnight, then just before. If it doesn't allow that, say so.
3. **Never weaken, skip or bend a check to get a pass.** Each changed check must still prove what it proved before.
   Say in the report how you kept that for each one.
4. **Update the docs:** how to run offline goes in `tests/README.md`. Add any flake you find to the known flakes in
   `.claude/agents/test-runner.md`.

**Done when:**
- in the cloud, `MYDAY_OFFLINE=1 tests/run.sh` prints a result line for every suite, with 0 failed;
- every SKIP is listed in the report;
- a run without the variable behaves exactly as before.

**Leave for the Mac** (in `mac-steps/cloud-test-run.md`): a full run without `MYDAY_OFFLINE`, on the real network
and the Mac's Chrome, using the ports and command that `CLAUDE.md` gives. Then the review and the merge.

---

## Step 2: a plan for named lists from "Add what's on my mind" (a spec; build nothing)

**Branch:** `spec-named-lists`

**Why.** The owner's next AI milestones, in order, start with **brand-new named lists** from "Add what's on my
mind" on Today, then notes pasted from outside MyDay sorted into tasks, Study items and ideas.
- Today, the brain dump suggests up to 8 small tasks. One-off tasks go to the queue; repeating ones go to one of
  the existing lists.
- A new named list would change saved data in both versions and the sync tables. So it needs a written plan,
  including a migration, and the owner's confirmation **before** anything is built.

**Read:**
- `app/src/ai/mind.ts`, `app/src/ai/MindCard.tsx` and `supabase/functions/_shared/ai/tasks.ts`;
- `app/src/data/`: the task lists, the queue, and the `tasks` section with its own lists, since 1.5.0;
- the lists in `index.html`, the classic MyDay;
- `app/src/sync/records.ts` and `supabase/migrations/`;
- "Saved data" and "Cloud sync" in `app/README.md` and `CLAUDE.md`.

**Write `specs/named-lists.md`:**
1. **The practical problem:** what happens today when a brain dump holds something with no list to go in.
2. **What's saved today in both versions,** with field names, quoted from the code.
3. **The options and their trade-offs.** Include whether the Tasks section's own lists (since 1.5.0) already do the
   job, with no migration at all.
4. **For the option you recommend:**
   - the data shape;
   - what the classic MyDay does with it;
   - what going back to the release before does;
   - the sync record and the migration, described and not written;
   - the AI reply's shape and the app's checks on it;
   - Undo;
   - the tests to add;
   - the release steps, which are Mac-only: migration, then `ai-plan` deploy, then publish.
5. **Questions for the owner,** each with your recommendation.

Write it in plain English: the owner is learning.

**Don't:** write app code or a migration file, or change AI instructions.

**Done when:** the spec is pushed on the branch. `mac-steps/spec-named-lists.md` says: read the spec and answer
its questions.

---

## Step 3: a plan for Arabic audio, round two (a spec; build nothing)

**Branch:** `spec-arabic-audio-2`

**What round one (1.39.0) built.** The 48 starter words and their example sentences have a synthesised voice.
- **The voice:** one Google Cloud Text-to-Speech Chirp 3 HD voice, chosen in a blind four-voice trial.
- **The clips:** made once, on the Mac, by `app/scripts/make-arabic-audio.mjs`. The key came from the environment
  and was deleted afterwards.
- **The checks:** a second model transcribed every clip, and doubtful clips were made again. Then the owner
  listened to all 96. The owner has basic Arabic; no teacher has listened yet.
- **Where it lives:** the clips and `audio-audit.json` are in `content/arabic-audio/`, checked at every build by
  `app/scripts/prepare-audio.mjs`. Only clips that have been listened to ship.
- **Offline:** the service worker keeps each clip the first time it plays.
- **The label:** "Synthesised voice — a model to copy; checked by ear, not yet by a teacher."
- **More detail:** `app/README.md`, under "A voice for the starter words".

**Round two, as first proposed:** the lessons' headline examples. Each of the 152 lessons has an `example`
(`text_ar`, `meaning_en`, `register`, `diacritics`) in `content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json`.
The 14 reading texts stay with human or external recordings.

**Write `specs/arabic-audio-round-two.md`:**
1. **An inventory of the 152 examples:** characters in all, and how many are letter groups (like "ب ت ث ن ي"),
   single words, phrases and sentences. Also how many are fully vowelled and how many have partial ("targeted") or
   no vowel marks. A synthesised voice can't be trusted on text without vowel marks.
2. **Which deserve a clip and which don't.** A letter group, for example, would be read as letter names: say what
   each lesson actually wants the learner to hear.
3. **Where the play button goes on a lesson page:** see `app/src/study/arabic/ArabicScreen.tsx` and
   `app/src/study/teaching/TeachingLesson.tsx`.
4. **How the audit and the build check extend** (keyed by lesson id, with a snapshot of the text), and that the
   service worker's rule stays the same. Include the size.
5. **The Mac's part:**
   - making the clips with the key;
   - the transcription cross-check;
   - the owner's listening load, in minutes;
   - the cost: Google's pricing page showed the first 1 million characters a month free for WaveNet and
     Chirp 3 HD, to be confirmed on the day.
6. **Questions for the owner,** each with your recommendation, including whether this is worth doing now.

**Don't:** make any audio, call any paid service, or write app code.

**Done when:** the spec is pushed on the branch, with `mac-steps/spec-arabic-audio-2.md`.

---

## Always left for the Mac

- Anything that needs a key, a token or an account:
  - Supabase: migrations and `ai-plan` deploys;
  - Google Cloud: making audio;
  - live AI evaluations;
  - the disposable test accounts and live checks.
- Merging, tagging and publishing (`deploy/publish-main.sh`, `git push origin main`).
- Full runs that need the real network or the Mac's Chrome, until step 1 is done.
- Every decision.
