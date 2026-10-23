# Study as a learning environment: one focus, a clearer home and a guided lesson

**Status:** planned, not built. The owner's decisions of 24 October 2026 are in §2. This builds on
`specs/adaptive-study.md` (lesson states, answer marks, revision from every lesson, the next-step rules). Build that
first; this plan is a series of later, separate releases (§11).
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
- **Listening and speaking:** Try shows the play buttons and a "Say it aloud" prompt where the lesson uses them.
  They stay untested unless you tick that you used a recording or a person.

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

## 9. Later, each as its own decision

- **"Check my answer"**, a tutor job on a tap: it compares your Check answer with the reference, explains the gap and
  suggests a mark that you accept or change. It never sets a state itself, and never judges listening or
  pronunciation. Like every AI job it needs a blind evaluation on made-up answers first (Arabic accuracy matters:
  only Gemini was accurate in the 16 Oct evaluation). It counts against the shared 20 a day.
- **The skills view:** each skill's state in words and counts, with reading, writing, listening and speaking kept
  apart. The package's 0–100 model stays internal.
- **Course projects:** the 18 Arabic and the Cybersecurity projects, kept inside their course and called "course
  projects", because "Projects" is MyDay's own spine. Whether one could become a MyDay project is a separate
  decision.

## 10. What it never does

No scores or percentages. No locked lessons or steps. Nothing added to Today's plan by itself. No AI without a tap.
No guilt words: "Worth a look" is an offer. Opening a page or spending time never counts as evidence.

## 11. Order and checks

Each step is its own release, finished and checked before the next:

| Release | Saved data | Main checks |
|---|---|---|
| a. One focus and Study home (§3, §4) | none new; the existing fields get one control | study-guided-rules, app-study, app-today (the same next step on both), app-design, phone layout, 44 px |
| b. Lesson journey, Arabic then Cybersecurity (§5) | device-only `myday.study.lessonStep` | app-arabic, app-cybersecurity, app-teaching, app-teaching-voice, app-pronunciation, phone layout |
| c. Keep a word (§6) | `arabic.words`, record kind `arabic_word`, migration | arabic-rules, app-arabic, storage, app-storage, sync-records, sync-db, app-sync, app-study-reset, going back to the previous release |
| d. "Check my answer" (§9) | none in the app's data | ai-rules, ai-server, app-ai, ai-deno, plus the blind evaluation |

The 8-a-day limit (§7) and the prerequisite kinds (§8) ship with `adaptive-study.md`, because its catch-up rule and
automatic cards need them. Its checks cover them (arabic-rules: a checkpoint is never catch-up; the 8-a-day
placement).
