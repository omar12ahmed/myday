# Adaptive Study with mastery tracking: the plan

**Status:** built for Arabic on branch `adaptive-study` (24 October 2026), for release 1.46.0 once the owner gives the
go-ahead for its migration. The owner's decisions of 23 October 2026 are in §2; Cybersecurity and your own courses
follow as separate releases. As built: the Ready and flag days are local days (`DateKey`); marking a lesson ready
again clears your own flag; the one-time offer lists practised lessons with no record of your own yet and closes for
good on that device (`myday.arabic.readyOffer`); each lesson's content prerequisites, check count and session
minutes are written into the course map by `scripts/prepare-arabic.mjs`, so the next step works without opening a
module; saved data stays schema 5 (owner's decision, 24 October 2026, recorded in AGENTS.md).
**Plan date:** 23 October 2026, after release 1.44.0.

## 1. The practical problem

Take a short Arabic session on nominal sentences. You read the explanation, try two examples, and still aren't
confident enough to make sentences of your own. You finish the session, and MyDay moves your next step on to the next
lesson, because in Arabic a finished session is what counts as "done". It can't tell having practised something
from being ready to move on. A 10-minute revision session on a lesson you've never studied also marks it finished.

The course itself says otherwise. Its 15-minute "short" session is "partial; not whole-lesson completion", and its
adaptive policy (`content/arabic-fusha/MyDay_Arabic_Adaptive_Tutor_Spec.json`) says that opening a page or spending
time is never evidence. MyDay already keeps the right evidence for revision: "On my own" apart from "With help", and
"slipped" apart from "hasn't clicked yet". Lessons don't use it yet.

So Study should adapt to what you can actually do. It should keep the course order, never make you repeat what you
know, and never move on just because time was spent.

## 2. Decisions (owner, 23 October 2026)

1. **Who decides "Ready to move on":** you do. MyDay suggests "looks ready" when the evidence is there, and you tap to
   confirm. Nothing is locked.
2. **Delayed check:** yes. When you mark a lesson Ready, its checks come back by themselves in revision about a week
   later. The 10-a-day gentle stop still applies.
3. **Scope:** Arabic first, built on one shared model in Study's code. Cybersecurity and your own courses come later,
   each as its own release.
4. **Energy:** yes, gently. On a low-energy day the next step offers a shorter session first. The full lesson is
   always one tap away.
5. **Checks that haven't clicked yet come back too:** a check you marked Not right or Not sure in a session returns
   in revision by itself, without waiting for Ready (§6). Same gentle stop.

## 3. What's saved today

| Subject | "Done" means | Evidence kept | Where |
|---|---|---|---|
| Arabic | any finished session (`lessonDone` in `app/src/data/arabic/sessions.ts`) | sessions: length, help, what you practised, first answers, which answers you looked at, a "revisit" note | `arabic.attempts`, synced as `arabic_attempt` |
| Cybersecurity | you marked the lesson complete (its roadmap task is done) | notebook attempts with self-assessed rubric scores and help | `cybersecurity.attempts`, `cyber_attempt` |
| Your own courses | you ticked the task | concepts with revision answers (outcome and support) | `study`, shared with the classic MyDay |

Lesson checks you add to revision are cards (`arabic.cards`); their answers go into `study.reviews` with an outcome
(Right, Partly right, Not right, Not sure) and support (On my own, Used a hint, Checked notes).

**Parked work:** branch `arabic-lesson-done` (WIP commit `cfdcde1`, moved from the main checkout on 23 Oct 2026) adds
an explicit "I've finished this lesson" saved as `arabic.lessonCompletions` inside the `arabic:preferences` record.
It isn't reconciled with Guided Study or the Study reset. This plan supersedes it: its "finished" becomes
"Ready to move on" (§4), saved in its own record type (§8). Its tests are worth reusing; the branch isn't for release.

## 4. A lesson's state

Five states, shown in words, never as a score:

| State | Means | Comes from |
|---|---|---|
| **New** | no session yet | worked out |
| **Practised** | at least one finished session, not marked Ready | worked out from sessions |
| **Ready to move on** | you tapped it | saved: the day you tapped |
| **Holding** | Ready, and every one of its checks answered "Right, on my own" in revision at least 7 days after you marked it Ready, with no struggle since | worked out from revision answers |
| **Needs revision** | you flagged it, saying what (a word, a grammar point, a skill); or, after Ready, the latest answer to one of its checks (in revision, or marked in a session) was Not right, Not sure or Again | saved flag, or worked out |

If more than one applies, the first of these wins: Needs revision, Holding, Ready, Practised, New. What can be
worked out isn't saved, like "slipped" today. A slip after Ready clears by itself when you next recall that check on
your own. A flag you set clears only when you clear it ("Done revisiting"); finishing a session on that lesson
offers to.

**Holding is only as good as the checks.** Most lessons have two or three, and from B1 most are English questions
about the idea rather than using it. The lesson page says what its checks cover, so Holding never claims more than
that. Listening and speaking stay untested unless you practised with a recording or a person, as now.

## 5. Marking your answers in a session

After "Show the reference answer", a check question asks **How did it go?** with the revision labels: Right / Partly
right / Not right / Not sure, and On my own / Used a hint / Checked notes. One tap each; it's optional. Your first
answer still stays as you wrote it. Only the latest mark per question is kept for the "looks ready" suggestion; the
session itself is unchanged.

## 6. Finishing a session: the suggestion, the tap and the delayed check

The finish card replaces "Session finished" and "Session saved — Next lesson":

- **Every check marked Right, on my own in this session:** "Looks ready to move on." Buttons: **Ready to move on** ·
  Not yet.
- **Otherwise:** "Practised. Come back to it when you like." Buttons: **Ready anyway** · Needs revision… (asks what,
  in a few words) · Close.

**Checks that haven't clicked yet.** When you finish the session, each check you marked Not right or Not sure joins
revision, due the next day: the same gap revision gives after "Again". Only those checks join, and only if they
aren't in revision already; a check already there keeps its schedule. The finish card says so, with a way out:
"2 checks that haven't clicked yet will come back tomorrow." · **Don't bring them back** (takes just those out again).
Partly right counts as getting there, so it waits for Ready. Marks change nothing until you finish, so you can
correct one before then.

**At most 8 new cards a day** (owner, 24 Oct 2026). Cards that join by themselves (these, and the checks after Ready)
first come back on a day that has room: at most 8 first-time cards a day. When a day is full, the next card goes to
the next day with room, in course order. Cards you add yourself are never delayed, but they count towards the 8. The
finish card names the real day. Details are in `specs/study-home-and-lessons.md` §7.

**Ready to move on** saves the day, and every check of that lesson not already in revision joins it, due 7 days
later. The card says so: "Its 3 checks will come back on Thu 30 Oct." Checks already in revision keep their schedule.
Taking Ready back ("Not ready after all", on the lesson page) leaves the cards in revision; you can take them out as
now. Ready can also be marked without a session, for a lesson you already know, and it then works the same way.

## 7. The next step

One suggestion with a **Why this?**, worked out on the device by these rules in order (no AI, nothing sent):

1. **Resume:** a session is open on a lesson in your path. *"You have a session open on this lesson."*
2. **Revisit:** the next new lesson builds directly on a lesson that needs revision (its `prerequisites.all`,
   content prerequisites only: checkpoints such as `b1-portfolio` are never catch-up; see
   `specs/study-home-and-lessons.md` §8).
   *"‹Next› builds on ‹this›, which needs revision: ‹what›."*
3. **Revise:** Arabic checks or words are due today and you haven't reached today's gentle stop. *"4 Arabic checks
   are back today; a few minutes keeps them."* The lesson is a second link right under it, so nothing is forced.
4. **Lesson:** the first lesson on your path that is New or Practised. Practised: *"You've practised this. Mark it
   ready when it clicks."* New: *"Next on your path."*

When every lesson on your path is Ready or Holding, it says so and suggests revision or a lesson that needs revision.

**Energy and free time.** These use Study's existing rule, `suggestLength(data, standardMinutes)` in
`app/src/data/study/sessions.ts`. It caps the length at 15, 20 or 30 minutes for energy 1, 2 or 3, and trims it to
the free time before your next plan. The longest session that fits is offered:

- the standard session if it fits;
- otherwise the 15-minute short session for a lesson, or the 10-minute revision session for a revisit;
- under 15 minutes, the 10-minute revision session.

The session card starts on that length, and `suggestLength`'s own reasons ("energy 2 today", "25 min free before
work") appear in "Why this?". The full lesson is always one tap away. Every lesson already has all five lengths.

The same next step and reason feed Today's Guided Study card (`app/src/study/nextLearning.ts`), replacing "Every
required lesson has a finished session".

## 8. Saved data and sync

**New, optional, absent when unused:** `arabic.lessons`, keyed by lesson id:

```ts
interface ArabicLesson {
  readyOn?: string;                         // when you tapped Ready (ISO); removed if you take it back
  revisit?: { since: string; what: string }; // your Needs revision flag; what ≤ 300 characters
  marks?: Record<string, { outcome: Outcome; support: Support; on: DateKey; attemptId: string }>; // latest per check
}
```

- **Its own sync record:** kind `arabic_lesson`, one record per lesson (the id is the lesson id, under 64
  characters), with a record definition in `app/src/sync/records.ts` and the kind added by a new migration.
- **Not inside sessions:** older versions rebuild each session from the fields they know (`cleanArabicAttempt`), so
  marks there would be lost going back.
- **Not in the preferences record (the parked branch's choice):** an older version writes that record with the path
  alone, which risks wiping lesson states when it changes the path.
- **Going back to 1.44.x:** `normalizeArabic` keeps unknown fields of the section, so `arabic.lessons` stays on the
  device unread. Older versions ignore record kinds they don't know; check this in `app-sync` before relying on it.
  The older next step falls back to finished sessions, and nothing is lost. No schema change: it stays 5.
- **The classic MyDay** keeps the `arabic` section unread, as now.
- **Study reset** (`app/src/study/resetProgress.ts`) also clears `arabic.lessons` and its synced records.
- **Sessions finished before this release** count as Practised, not Ready. Once, the Arabic map offers: "You've
  finished sessions on N lessons. Mark any of them ready to move on?" with each lesson unticked, plus "Not now". As
  the only saved Arabic data today is test data, this could be dropped; decide at build.
- **Release:** the migration needs fresh backups, your go-ahead and a rehearsal, as for 1.44.0.

## 9. One shared model

`app/src/data/study/mastery.ts` holds the rules once, with no subject in them:

- `lessonState(evidence, today)`: the state of §4, from sessions, the Ready day, the flag, the lesson's check ids and
  their revision answers.
- `looksReady(marks, checkIds)`: the suggestion of §6.
- `nextStep(path, prerequisites, states, open, due, reviewedToday, energy)`: the rules of §7, returning the kind,
  the lesson, the suggested length and a reason code; the screen turns the code into words.

Each subject gives it its own evidence:

| Subject | Ready | Practised | Checks |
|---|---|---|---|
| Arabic (first) | `arabic.lessons[id].readyOn` | finished sessions | the lesson's check questions as cards |
| Cybersecurity (later) | the existing "complete" tick | submitted notebook attempts | its knowledge checks as cards (`cyber_card`) |
| Your own courses (later) | the task's tick | a finished Study session on it | concepts linked to the task (`taskIds`) |

## 10. The map and lesson page

- **Lesson page:** a state line under the title, e.g. "Practised · 2 sessions", "Ready since 23 Oct · checks back
  on 30 Oct", "Holding", "Needs revision: the mood after لم". With it: Ready to move on, Not ready after all,
  Needs revision…, Done revisiting.
- **Module lessons list:** each lesson's state word instead of "finished".
- **Module tile:** counts, not percentages: "5 lessons · 3 ready · 1 needs revision". A module is visited when every
  core lesson in it is Ready or Holding.

## 11. What it never does

No scores or percentages (the package's 0–100 evidence model stays unused). No locked lessons. No automatic Ready.
No AI marking: a "Check my answer" on a tap could come later as its own decision. Opening a page or the time spent
never counts. No guilt words; a lesson that needs revision is just the next useful thing.

## 12. Checks to write

- **arabic-rules / study rules:** each state and the precedence order. Holding at 6 and 7 days after Ready. A slip
  after Ready, and its clearing. Every next-step rule and its reason, with "Catch-up" never pointing at a checkpoint. The suggested length for each
energy level, for little free time and for no energy set, with `suggestLength`'s reasons shown. The 8-a-day
placement: a full day pushes to the next day with room, and your own additions are never delayed. Older
  finished sessions counting as Practised.
- **app-arabic:** marking answers. Both finish cards. Finishing brings Not right / Not sure checks back the next day
  (not Partly right, not ones already in revision), and "Don't bring them back" takes exactly those out. Ready adds
  the checks due in 7 days and leaves cards already in revision alone. Taking Ready back. The flag and "Done revisiting". Why this?. Map counts and states. Phone layout
  and 44 px targets.
- **app-study and Today:** Guided Study's new wording. **app-study-reset:** lesson states cleared.
- **sync-records, sync-db, app-sync:** the `arabic_lesson` round trip, and an older version ignoring the new kind.
- **Classic compatibility:** the section kept unread.
- Then the live check with the two disposable accounts.

## 13. Before relying on it: the checks themselves

Lesson checks become the evidence, so the Arabic review of 23 October 2026 matters here. Fix its confirmed errors.
Close the gaps where a lesson's checks test less than it teaches (e.g. L049 tests only لم, not a choice of
negation). Vowel unvowelled prompts that can be read for more than one person, or accept every reading. Lessons
without an Arabic application question would gain one over time.
