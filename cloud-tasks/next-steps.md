# Cloud tasks: the next steps after 1.39.0

**No longer for cloud sessions (20 Oct 2026):** the owner stopped using them, and these steps are being done on the
Mac. Step 1's offline mode was only for the cloud; its clock-proofing part still applies.

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

## Step 3: a plan for a voice across the whole Arabic course (a spec; build nothing)

**Done on the Mac, 20 Oct 2026:** `specs/arabic-audio-course.md`, with the inventory script
`app/scripts/arabic-audio-inventory.mjs`.

**Branch:** `spec-arabic-audio-course`

**What round one (1.39.0) built.** The 48 starter words and their example sentences have a synthesised voice.
- **The voice:** one Google Cloud Text-to-Speech Chirp 3 HD voice, chosen in a blind four-voice trial.
- **The clips:** made once, on the Mac, by `app/scripts/make-arabic-audio.mjs`. The key came from the environment
  and was deleted afterwards.
- **The checks:** a second model transcribed every clip, fully vowelled, and the doubtful ones were made again (a
  synthesised voice sometimes slips: a word cut short, a wrong final vowel). Then the owner listened to all 96
  against the text and its reading. The owner has basic Arabic; no teacher has listened yet.
- **Where it lives:** the clips and `audio-audit.json` are in `content/arabic-audio/`, checked at every build by
  `app/scripts/prepare-audio.mjs`. Only clips that have been listened to ship. The app's list of them is
  `app/src/study/arabic/voice-clips.json`.
- **Offline:** the service worker keeps each clip the first time it plays.
- **The label:** "Synthesised voice — a model to copy; checked by ear, not yet by a teacher."
- **More detail:** `app/README.md`, under "A voice for the starter words".

**What the owner asked (20 Oct 2026):** whether all the Arabic text in the course could have a voice. The answer
given, and agreed as the frame for this plan: yes in principle, in rounds, with one firm limit.
- **Cost and size aren't the obstacle.** A rough count on the Mac found about 1,200 distinct Arabic runs, about
  23,000 characters in all. Google's free allowance is 1 million characters a month. That's around 1,200 clips,
  about 10 MB in the repository, and about 40 minutes of audio. Your inventory replaces these rough numbers.
- **Text without vowel marks is the limit.** About half of those runs carry no vowel marks: the course fades them
  from intermediate level on purpose, and most checks and reference answers are written that way. On such text a
  synthesised voice has to guess the vowels and case endings. Neither a learner with basic Arabic nor the
  transcription cross-check can tell when the guess is wrong, because there are no marks to compare against. The
  reading texts themselves say a recording should be made by a competent Fuṣḥā speaker and checked against the
  text before it's used for listening.
- **The rounds, as agreed:**
  1. **Round two:** the 152 lessons' headline examples. Each lesson has an `example` (`text_ar`, `meaning_en`,
     `register`, `diacritics`) in `content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json`.
  2. **Round three:** everything else that is fully vowelled. That means the teaching companion's examples
     (`content/teaching/arabic-fusha.json`), the early reading texts and fully vowelled exercise items, checked
     the same way as round one.
  3. **Unvowelled text:** only once a teacher or fluent speaker can check it, or a human recording replaces it.
     Until then, those parts keep their honest "no recording" notes.

**Write `specs/arabic-audio-course.md`:**
1. **A precise inventory** of every piece of Arabic the app shows.
   - **The sources:** the curriculum (`lessons`, `assets` = reading texts, `exercises`, `assessments`), the answer
     keys (`MyDay_Arabic_Assessment_Keys.json`), the teaching companion and the word-families notes; say which
     screen shows each one.
   - **For each source:** the count, the characters, the kind (letter drill, word, phrase, sentence or passage) and
     the vowelling (full, partial / "targeted", or none), with a few examples of each.
   - **How you got the numbers:** a script on the branch (for example `ai-eval/` or `tests/`; not part of the
     build), so they can be re-run.
2. **What should and shouldn't have a voice.** Go piece by piece where it matters, and give a reason each time:
   - **Letter drills** would be read as letter names. Say what each lesson actually wants the learner to hear.
   - **Audio must never give away an answer.** For example, a check asking the learner to add vowels or to tell
     two sounds apart. Reference answers could be voiced only after they're revealed.
   - **Listening activities** in the course expect a human or external recording; say how they should be treated.
   - **Reading texts:** play the whole text, one paragraph at a time, or one sentence at a time?
3. **Each round in detail:**
   - which pieces it includes;
   - the clips, characters and listening minutes;
   - the screens and the places on them where a play button goes (`app/src/study/arabic/ArabicScreen.tsx`,
     `app/src/study/teaching/TeachingLesson.tsx`, the reading text view);
   - and what the Mac and the owner have to do.
4. **How the audit and the build check generalise** beyond starter words. Today they're keyed by lexeme id, with
   `word` and `example`. Propose a key for any source (for example the source's id and field, plus a snapshot of
   the exact text), and how `prepare-audio.mjs` and `voice-clips.json` change.
   - Check that the service worker's rule still holds when `AUDIO` lists over 1,000 clips.
   - Check the repository size.
   - A clip should be shared when the same text appears in several places.
5. **Unvowelled text:** set out the options with their trade-offs.
   - wait for a fluent speaker to check;
   - add vowel marks to a separate copy that a teacher then reviews (never changing the course's own text, which
     fades vowels on purpose);
   - a human recording;
   - or leave it without a voice.

   Recommend one.
6. **The Mac's part per round:** making the clips with the key, the transcription cross-check, the owner's
   listening load in minutes, and the cost. Google's pricing page showed the first 1 million characters a month
   free for WaveNet and Chirp 3 HD; that's to be confirmed on the day.
7. **Questions for the owner,** each with your recommendation. Include the order of the rounds and whether to
   look for a teacher's check before round three.

**Don't:** make any audio, call any paid service, or write app code. The inventory script is the only code.

**Done when:** the spec and the inventory script are pushed on the branch, with
`mac-steps/spec-arabic-audio-course.md` (read the spec and answer its questions).

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
