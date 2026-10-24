# Study as a learning environment: one focus, a clearer home and a guided lesson

**Status:** release (a), one focus and Study home (§3, §4), published in 1.51.0 (24 October 2026); release (b),
the lesson journey, published for Arabic in 1.53.0 and for Cybersecurity in 1.55.0; release (c), Keep a word,
built on branch `keep-a-word` (its migration not yet applied); (d)–(f) planned. The owner's decisions of 24 October 2026 are in §2. This builds on
`specs/adaptive-study.md` (lesson states, answer marks, revision from every lesson, the next-step rules), published
in 1.47.0; this plan is a series of later, separate releases (§14).
**Plan date:** 24 October 2026, after release 1.44.1.

## 1. The practical problem

Study already has most of what a learning environment needs: guided courses with teaching, worked examples and
practice, sessions, spaced revision, progress history, an energy-aware session length, and AI help on a tap. Three
things get in the way:

- **Two answers to "what next?"** Today ranks subjects by your preferred subject (`study.settings.primarySubject`,
  via `app/src/study/nextLearning.ts`). Study home's "Current focus" card shows your pinned roadmap course
  (`study.focusCourseId`, via `focusCourse` in `app/src/data/study/roadmap.ts`). They can point at different things.
- **Everything competes on Study home.** An open session, Current focus, Your topics, Revision, Cybersecurity, Arabic
  and the links (Your map, Whole roadmap, Concepts, Progress & history, Settings) all sit at the same level. The
  focus card also shows "x of y tasks complete (z%)", which is a percentage.
- **A lesson is a stack of separate tools.** An Arabic lesson page has about ten cards: the header, teaching, the
  session, the practical task, the checks, the mini challenge, "When the lesson is done", history, "Read alongside"
  and the library. A Cybersecurity lesson has the teaching, the session choice, "Learn by doing", completion, the
  checks, More practice, the tutor and the notebook. It's all useful, but the page doesn't lead you through it.

The aim is to help you understand, practise, remember and apply what you learn, with one clear next action.

## 2. Decisions (owner, 24 October 2026)

1. **One focus choice.** A single "Your focus" (Arabic, Cybersecurity or one of your courses) used by both Today and
   Study home. Both show the same next step.
2. **The lesson journey is one page with step sections.** A small step bar lets you jump, your place is kept if you
   leave, and the session length decides which steps show.
3. **Keep a word.** Tap to keep a word you meet in a lesson or reading text, so it comes back in revision. You add
   the meaning, or accept the course's own where there is one.
4. **At most 8 new cards a day** join revision by themselves (the top of the course's suggested 3–8). Extra ones wait
   for the next day with room, in course order. Reviews keep their own gentle stop at 10.

**Second round (owner, 24 October 2026):**

5. **Practise again.** A lesson's Try and mini challenge come back later as their own cards, at wider gaps than
   questions (§9). They count towards the 8 a day.
6. **Light / Normal / Deep** are three names over the existing session lengths and journey steps. Energy and free time
   pick the default and you can always switch. Plus **"I got distracted — help me restart"** (§5).
7. **No recording yourself for now.** Speaking practice is listen-and-repeat with the model voice.
8. **The Cybersecurity portfolio takes files from the start**: screenshots, diagrams and PDFs as well as text, with
   a new private storage service, size limits and a privacy check (§10).

## 3. One focus, one next step

**No new saved field.** The two existing choices become one control, "Your focus", in Study settings and on Study home:

| You choose | Saved as |
|---|---|
| Arabic | `primarySubject = 'arabic'` |
| Cybersecurity | `primarySubject = 'cybersecurity'` |
| one of your courses | `primarySubject = 'roadmap'` and `focusCourseId` = that course |

`focusCourseId` keeps its meaning for the classic MyDay, which shares the `study` section. Choosing Arabic or
Cybersecurity leaves it as it is, so the classic's own dashboard doesn't change.

**One function.** Today's Study card and Study home's top card both take the first option from `learningOptions()`.
For a subject on the adaptive rules, that option comes from its next step (`adaptive-study.md` §7), so the reason
("Why this?") and the suggested length are identical on both screens. Check this with a test that compares the two.

**As built (release a):** the choice and its rules are `app/src/data/study/yourFocus.ts`; every option carries its
"Why this?" (`why`). Your focus on one of your courses follows the same rule on every screen (the labels, Today, Study
home): the course you chose while it has a task left; a chosen course with no tasks yet stays your focus (a session
still counts, and Study home offers its Start); a finished one gives way to your next course with work, and when none
has any, the next step is in another subject, which Study home says ("None of your courses has a task left…") and
Today shows without an empty course. An empty course is only offered while it's your focus. "Make this my focus" on a
course page, and opening another subject's next step from Today or Study home, change your focus. Arabic's
"revision first" step has the map's own button, "Revise Arabic", on both screens. The roadmap's set-up moved from
Study home to the roadmap page, behind a "Your own courses" tile.

## 4. Study home on three levels

1. **Now:** one card with your focus's next step, its "Why this?", the suggested length, and Start, Resume or Open
   lesson. An open session anywhere replaces it ("Pick up where you left off"). "Choose another subject" is folded
   underneath, as on Today.
2. **Worth a look:** at most three gentle items, hidden when there are none. Examples: "Revision ready: a round of
   5", "‹Lesson› needs revision", "A session is open in Cybersecurity". There is no backlog, nothing "overdue", no
   missed-day count. Due revision is an offer, never a debt.
3. **Explore:** Your map (the metro map, kept for exploring and long-term progress), then your subjects as tiles:
   Arabic, Cybersecurity, your topics and Reading. Each shows places and counts, such as "5 lessons · 3 ready".

**Manage**, folded at the bottom: Whole roadmap (editing), Concepts, Progress & history, Settings and Reset.

**No percentages.** "x of y tasks complete (z%)" becomes "x of y tasks marked complete", keeping the note that this
counts ticks, not how well you know them. The bar may stay as a picture of the count.

## 5. The lesson journey

One page, in this order, with a sticky step bar (each step a 44 px target) that jumps to its section:

| Step | What it is | Arabic | Cybersecurity |
|---|---|---|---|
| **Warm-up** | 2–3 minutes recalling the last lesson from memory, before anything new | up to 2 checks from the previous lesson on your path (or due ones from this course); skipped if there are none | the same, from its checks |
| **Understand** | read and see it worked | teaching explanation and worked example, the headline example with its voice | teaching and example |
| **Try** | apply it, with the answer hidden until you ask | "Try it" and its explained answer, then the practical task (rubric folded) and the mini challenge | "Learn by doing" and the notebook activity; More practice and the tutor sit here |
| **Check** | answer without the explanation in view | the lesson's checks: first answer, reveal, your mark (`adaptive-study.md` §5) | its knowledge checks |
| **Reflect** | decide what happens next | the finish card: Ready / Ready anyway / Needs revision; checks that haven't clicked come back tomorrow | the same card, replacing the bare "complete" tick |

- **Check, not "Recall".** Answering straight after reading is an immediate check. Real recall happens later, in
  revision and the next lesson's warm-up, so the step's name doesn't claim more than it is.
- **While you're in Check, the explanation folds away** ("Show the explanation again" brings it back). It isn't
  removed.
- **Session length decides which steps show.** The others stay one tap away under "The rest of this lesson".

  | Session | Steps shown |
  |---|---|
  | Revision, 10 min | Warm-up, Check |
  | Short, 15 min | Understand, one Check question |
  | Practical, 30 min | Try (practical task), Check |
  | Standard or extended | every step; extended adds the variant's transfer task under Try |

- **Your place is kept** on this device only: the step you were on, per lesson, in a new device-only key
  `myday.study.lessonStep` (not synced, not exported, like `myday.arabic.transliteration`). Sessions themselves are
  saved and synced as now.
- **Everything else moves under its step or into "More about this lesson":** prerequisites ("Builds on…"),
  "When the lesson is done", your history on the lesson, "Read alongside" and the reference library.
- **Listening and speaking:** Try shows the play buttons (with Slower) and a "Say it aloud, then compare" prompt where
  the lesson uses them. There's no recording yourself for now (decision 7). Listening and speaking stay untested
  unless you tick that you used a recording or a person.
- **Steps you did are recorded.** At Reflect, the steps you did are saved on the lesson (`arabic.lessons[id].tried`
  and `.challenged`: the last day you did its Try and its mini challenge). Progress uses this (§11), and so does
  Practise again (§9).

**Light / Normal / Deep.** Three names for how you want to study now. They're shown on the Now card and the lesson's
session choice, and are built only from what exists:

| Mode | Time | What it offers | Built from |
|---|---|---|---|
| Light | 5–15 min | resume what you started, revisit one idea, listen to the example again, answer two familiar checks; nothing new or advanced | the 10- and 15-minute sessions, Warm-up, Check |
| Normal | 15–30 min | the next one or two steps of the current lesson: learn one idea, do its Try, check yourself | the journey steps, kept place |
| Deep | 45–90 min | a whole lesson, a lab, a course project, or two lessons in a row; the focus timer offers a break every 25–45 minutes | standard and extended sessions, labs, projects |

The default comes from `suggestLength` (energy and free time; `adaptive-study.md` §7), but it's only a default. The
three choices are always shown, and a low-energy day can still choose Deep for something enjoyable.

**As built (release b, Arabic; 24 October 2026):** the Arabic lesson page is the journey; Cybersecurity follows as
its own release, reusing the step bar and restart (`app/src/study/arabic/Journey.tsx`) and the split teaching parts
(`app/src/study/teaching/`). The modes are the lesson's own sessions grouped under three names (Light: revision and
short; Normal: practical; Deep: standard and extended), each group showing its real minutes; what's saved is still
the session length. The suggested length gains the practical session for a lesson you've already practised (a new
lesson never gets it, since it skips the teaching), so an energy-3 day suggests Normal there. The warm-up is the
previous lesson on your path's first two checks, answered from memory and compared, saving nothing; it's skipped when
there's no previous lesson with checks. The step bar sticks at the top on a phone and under the header on wide
screens. **Recording the steps you did (`tried`, `challenged`) moves to release (d)**, with Practise again and
Progress, which are what use it: it's a field on the `arabic_lesson` record that 1.47.0–1.52.0 would drop when they
save that record, so it belongs with (d)'s sync and going-back design. This release changes no saved data.

**As built (release b, Cybersecurity; 24 October 2026):** the Cybersecurity lesson page is the same journey, sharing
the step bar, the restart and the kept place (`app/src/study/journey/`). Its session is the Study timer, so the
choice (Light / Normal / Deep over the lesson's own lengths, `#cyberMinutes`) sets the timer's minutes, and a running
timer on the lesson adds Reflect, which finishes in the session (Cybersecurity has no lesson states yet, so the "Ready
to move on" card comes with its move to the adaptive rules). Warm-up: the previous lesson's knowledge check, once
you've begun that lesson (an attempt, a session or its task ticked). Try: Try it, Learn by doing (the practical task
and the challenge, in the lab notebook), the AI practice cards, related practice and the tutor. Check: the knowledge
check's questions with the answer guide on the page, and "Answer in your lab notebook" to keep answers. The practical
session is suggested only once you've begun the lesson.

**"I got distracted — help me restart."** It's on the lesson page whenever a session is open, and on the Now card as
"Pick up where you left off". It reopens the exact lesson at the step you were on (the kept place) and offers one tiny
action for that step: "Read the example again", "Answer one check" or "Finish the last line of your Try". No penalty,
nothing lost, no questions about why.

## 6. Keep a word (Arabic)

- **Where:** a "Keep a word" button under each reading-text sentence, each lesson headline example and each teaching
  example. It opens a picker of that sentence's words (punctuation removed, vowel marks kept as written). On the
  Vocabulary page, "Add your own word" takes a typed word.
- **What you add:** the meaning in your words (required, at most 120 characters). Where the word matches a starter
  word, MyDay offers the course's meaning and example. A note is optional.
- **Duplicates:** a word you already keep is recognised ignoring optional vowel marks only. ة/ه, ى/ي and hamza
  forms stay distinct (`content/arabic-fusha/MyDay_Arabic_README.md`, "Arabic display and scoring").
- **Revision:** a kept word comes back Arabic → meaning, first the next day. "Also practise writing it" works as for
  starter words. It's included in "Revise Arabic" and the all-subjects round.
- **Saved data:** `arabic.words`, a new optional field. Each word holds its id, the Arabic as written, your meaning,
  an optional note, where it came from (a lesson or text id), the day added, and its two revision schedules. It
  syncs as a new record kind `arabic_word`, added by a migration.
  - **Why not as cards in `arabic.cards`:** older versions drop any card whose id they don't recognise
    (`cleanArabicCard`), then save without it, which would lose words when going back a version.
  - `normalizeArabic` keeps unknown fields of the section, so `arabic.words` survives older versions unread.
  - Its revision answers go into `study.reviews` like every other card's.
  - The Study reset clears it only if you choose to.
- **Not included:** roots and families for your own words (the families stay MyDay's authored file), audio for your
  own words, and AI-filled meanings.
- **As built (release c, 24 October 2026):** the rules are `app/src/data/arabic/words.ts`; the button and picker
  `app/src/study/arabic/KeepAWord.tsx`; "Your words" heads the Vocabulary page (add your own, both ways in revision,
  change your meaning, remove, asked first). A reading text has one "Keep a word" whose picker lists its words
  sentence by sentence (a button under every sentence crowded the text and its voice); a lesson's Understand step has
  one for its headline example and the Arabic in its worked example. A starter word's meaning is filled in, yours to
  change. Kept words are cards in the queue by id `<word id>:recognise` / `:write`, read from the word; they count in
  the 8-a-day placement. No AI "another way" for your own words (your words and meanings never reach AI). The Study
  reset keeps your words with their revision starting again unless you tick "Also remove the words you kept".
  Saved data stays schema 5 (the owner's exception: an optional field in the new-app-only Arabic section, synced as a
  new kind older releases ignore; `tests/app-sync-previous.test.js` [7]).

## 7. Eight new cards a day

This applies wherever cards join revision by themselves: checks that haven't clicked (next day) and checks after
Ready (7 days later), in `adaptive-study.md` §6.

- **On any day,** at most 8 cards come back for the first time. When a day is full, the next card goes to the next
  day with room, in course order.
- **Cards you add yourself** (a word, "Bring these checks back") are never delayed or refused. They count towards
  the 8 when MyDay places the automatic ones.
- **The finish card says the real day,** for example "2 checks will come back on Sat 26 Oct".

## 8. Catch-up from content prerequisites only

The course's prerequisite graph mixes real content with checkpoints. The most-needed prerequisite is
`skill.arabic-b1-portfolio` (needed by 30 lessons), and `skill.arabic-goal-baseline`, "Measure your starting point",
is needed by 14. Catch-up built on the raw graph would send you back to a portfolio review.

- **Prerequisite kinds:** a MyDay-authored list `content/teaching/arabic/prerequisite-kinds.json` marks checkpoint
  and study-method skills: the orientation module, the integration modules' lessons and portfolios. The course
  package isn't changed. The file is checked at every build: known skill ids only, and each listed skill is taught
  by a lesson.
- **Catch-up** (`adaptive-study.md` §7, rule 2) uses only content prerequisites. A checkpoint is never suggested as
  catch-up, though it stays on your path in order.
- Cybersecurity gets its own list when it moves to the adaptive rules.

## 9. Practise again

Not everything should be a flashcard: a skill needs doing again, not just remembering.

- **What comes back:** the lesson's own "Try it" and its mini challenge, never AI-written tasks. In Cybersecurity
  later, its "Learn by doing" activity and Practice shelf items.
- **When:** the first time you finish a session that included the Try (or the challenge), it joins revision as a
  Practise again card. It comes back after about 7 days, then 21, then 60. "Again" goes back to 7; it never goes past
  180. It counts towards the 8 new cards a day (§7).
- **In a round:** at most one Practise again card per round of 5, since it takes longer than a question. It opens the
  lesson at its Try step, with the explained answer hidden until you ask. You then mark it with the usual outcome and
  support, and that answer goes into `study.reviews`.
- **Saved:** its schedule sits in the lesson's record (`arabic.lessons[id].practice`, synced as `arabic_lesson`), not
  in `arabic.cards`, because older versions drop card ids they don't recognise.

## 10. The Cybersecurity portfolio, with files

**What it is.** From a notebook attempt, **Add to portfolio**: a title, the attempt's text evidence (commands, notes,
reports), an optional note, and up to 5 files. The portfolio page lists entries by lesson and module. Each entry shows
its lesson, the evidence, the files, the day you reviewed it, and later the NICE statements it relates to. **Export
portfolio** downloads it as a folder: an index page plus the files.

**Files:**
- **Types:** PNG, JPEG, WebP and PDF only. No SVG, HTML or Office files, since those can carry code or hidden content.
- **Limits:** 2 MB each and 200 MB in all (defaults; confirm at build). The free plan's 1 GB of storage is shared with
  everything else.
- **Checking a file:** each file is checked on the device for type (by its content, not its name) and size before
  upload. The service checks them again.

**The privacy check, before anything is added.** A short checklist you tick:
- no passwords, tokens or keys;
- no real IP addresses, hostnames or company names outside your own lab or the course's practice targets;
- no one's personal details.

Text evidence is also scanned on the device for obvious secrets: private-key headers, `password=`, common key
formats. Any find shows a warning to fix it first. Images can't be checked automatically, so the tick is yours.

**Never sent to AI** and never included in Ask MyDay.

**Storage (new, careful area):**
- **Bucket:** a private Supabase Storage bucket, `portfolio`. Files live under the signed-in account's own folder
  (`<user id>/<entry id>/<file id>`).
- **Policies** on `storage.objects` let only that account add, read and delete its own files. There are no public
  links; viewing uses short-lived signed links. The bucket itself enforces the size limit and the allowed types.
- **Saved data:** only metadata is in `myday.data.v4`: `cybersecurity.portfolio`, holding entries of id, attempt
  id, lesson id, title, note, the day reviewed, and files (id, name, type, bytes, SHA-256). It syncs as a new record
  kind, `cyber_portfolio`.
- **On the device:** the files themselves are cached in IndexedDB for viewing offline. localStorage can't hold them.
- **Migration:** a new migration adds the record kind, the bucket and its policies. It is applied on the Mac with
  your go-ahead, after a fresh backup and a rehearsal.
- **Requires sign-in.** Without an account, files aren't kept; the text entry still is.
- **Removing** an entry deletes its files from storage. Signing out removes the local file cache, as with the rest
  of MyDay's data.
- **Backups:** "Download a copy" includes the metadata. Files come only with "Export portfolio", and the backup
  screen says so plainly.
- **Going back** to an older version keeps `cybersecurity.portfolio` unread on the device, and older versions ignore
  the new record kind (verify in `app-sync`). Files stay in storage.
- **Review:** an independent security review (Fable) before release: the policies, signed links, type checks and
  that nothing reaches AI.

**NICE Framework, a later step:** a MyDay-authored mapping file. It holds, per module, the NICE work roles and a few
Task, Knowledge and Skill statements, checked against NIST's official NICE Framework Components (version named in the
file). It's labelled as MyDay's own mapping, never a credential. Portfolio entries show the statements of their lesson.

**Also fix:** the notebook's project page shows "‹n›/100; not verified here" for required skills. Show the skill
and whether it has evidence, never a number.

## 11. Progress that says what to do next

The opening of Progress shows four things in words and counts, never percentages or streaks:
- **Done:** lessons Ready or Holding.
- **On your own:** Holding lessons, and checks recalled on your own.
- **Needs revision**, each with its reason, built from the evidence. For example: "You've practised ‹lesson› and
  answered 2 of its 3 checks on your own, but haven't done its Try yet." It comes with a link straight to that step
  ("Do the Try"), not a vague "study more".
- **Next milestone:** the next checkpoint module on your path, such as "A1 consolidation: 3 lessons to go".

The existing history (sessions, recall over 8 weeks, practical work) stays below, unchanged.

**Weekly reflection: inside "Your week", not a second one.** In a week with any Study session, step 4 ("A line or
two") offers two optional prompts: "What got easier?" and "What still feels hard?". Answers are saved in the same
"Week of …" note. Nothing is required, and a quiet week is still allowed.

## 12. Later, each as its own decision

- **Graduated help ("Check my answer" and the tutor):** one request per question, never three. Its fixed reply holds
  a small hint, a more concrete example, a worked explanation, and one short follow-up question with its answer. The
  app reveals them one at a time, only as you ask. For example, with subnetting it first asks what the mask tells
  you, before any calculation.
  - **Sent:** the lesson's objective and teaching, its prerequisites, the question, your answer and the reference
    answer, shown in the usual preview.
  - **The reply** names which part of the lesson it drew on, and is labelled as AI. It may *suggest* a mark that you
    accept or change. It never sets a lesson's state, and never judges listening or pronunciation.
  - **Before shipping:** a blind evaluation on made-up answers (for Arabic, Gemini was the only accurate model on
    16 Oct). It counts against the shared 20 a day.
- **The skills view and four Arabic tracks:** reading, writing, listening and speaking each shown in words and
  counts, with the CEFR descriptors as a guide to objectives, never a qualification. The package's 0–100 model stays
  internal.
- **Course words with roots:** authored word lists per lesson (word, meaning, root, example, voice), checked by you,
  beside your kept words. That's content work, with the teaching-depth plan.
- **Recording yourself:** not now (decision 7). Speech recognition: not planned, as there's no dependable
  validation for MSA.
- **Course projects:** kept inside their course and called "course projects", because "Projects" is MyDay's spine.
  Whether one could become a MyDay project is a separate decision.

## 13. What it never does

No scores or percentages. No locked lessons or steps. Nothing added to Today's plan by itself. No AI without a tap,
and portfolio files never reach AI at all. No guilt words: "Worth a look" is an offer. Opening a page or spending
time never counts as evidence. Choosing a mode never stops you doing something else.

## 14. Order and checks

Each step is its own release, finished and checked before the next:

| Release | Saved data | Main checks |
|---|---|---|
| a. One focus and Study home (§3, §4) | none new; the existing fields get one control | study-guided-rules, app-study, app-today (the same next step on both), app-design, phone layout, 44 px |
| b. Lesson journey with Light / Normal / Deep and the restart (§5), Arabic then Cybersecurity | device-only `myday.study.lessonStep`; `tried` / `challenged` on `arabic.lessons` | app-arabic, app-cybersecurity, app-teaching, app-teaching-voice, app-pronunciation, app-study (modes and restart), phone layout |
| c. Keep a word (§6) | `arabic.words`, record kind `arabic_word`, migration | arabic-rules, app-arabic, storage, app-storage, sync-records, sync-db, app-sync, app-study-reset, going back to the previous release |
| d. Practise again (§9) and Progress (§11) | `practice` on `arabic.lessons`; the weekly prompts in the existing "Week of …" note | arabic-rules (the 7/21/60 ladder, one per round, the 8-a-day count), app-arabic, app-study, projects-rules and app-projects (the "Your week" prompts) |
| e. Cybersecurity portfolio with files (§10) | `cybersecurity.portfolio`, record kind `cyber_portfolio`; the private bucket and its policies; IndexedDB file cache | cybersecurity-rules, app-cybersecurity, storage, app-storage, sync-records, sync-db, app-sync, a storage-policy test (one account can't read another's files; the local stand-in `tests/supabase-standin.js` has no file storage yet, so either extend it or check on the Mac with the two disposable accounts), file type and size refusals, the secrets warning, export, phone layout; the Fable security review |
| f. Graduated help and "Check my answer" (§12) | none in the app's data | ai-rules, ai-server, app-ai, ai-deno, plus the blind evaluation |

The 8-a-day limit (§7) and the prerequisite kinds (§8) ship with `adaptive-study.md`, because its catch-up rule and
automatic cards need them. Its checks cover them (arabic-rules: a checkpoint is never catch-up; the 8-a-day
placement).
