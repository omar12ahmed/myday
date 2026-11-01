# Today's learning follows Study, and a tidy-up for old tasks

**Status:** agreed (1 Nov 2026). The owner's decisions are in §5. Being built.

## 1. Why

- **Today's learning task doesn't follow Study.** It comes from a repeating "Learning" list (`data/plan.ts`
  `freshPick`). On day one MyDay seeded that list with four starters (`normalize.ts` `SEED`): TryHackMe Pre-Security,
  OverTheWire Bandit, HTB Networking and HTB Web Requests. None of them is in your Study. It cycles round them and repeats
  after the last, and no task on Today is linked to a lesson, so moving on in Study never moves it.
- **Today's Study card** starts at lesson 1 (both subjects), but it moves on only when you tap **Ready to move on**, and
  that's on the lesson page or after a session. A session left open, or a Cybersecurity draft, holds the card on its
  lesson for ever.
- **Old tasks pile up.** Due today and Tasks list every unfinished task, however old, including those of finished
  projects. Tasks MyDay made for you (Chase, Fix, Follow up, Prepare for … interview) stay after their reason has gone.
  The only way to clear them is one at a time.

## 2. Today's learning task is Study's next step

- **What it is.** When MyDay builds your day (and in Review my plan, and the nudge's 15 minutes of learning), the
  learning task is the Study card's first option: your chosen subject's next step, from lesson 1, with revision first
  when it's due. It's titled for its subject ("Arabic Fuṣḥā — your next lesson", "Cybersecurity — your next lesson",
  or "<course> — your next step"). It's marked as Study's by its `taskId`: 'study:arabic', 'study:cybersecurity' or
  'study:roadmap:<courseId>'. That's an existing field every version keeps, so there's no new saved field and no schema
  change (the review's point, 1 Nov: AGENTS.md's schema rule).
- **On Today it shows the lesson now.** The row names the current step ("Arabic · The Fuṣḥā register"), says why in a
  short line ("Next in your course", "Revision first (3 ready), then this lesson"), and opens it. If you move on in
  Study before doing it, the row shows the new next step. Nothing is written for that.
- **It ticks itself when you study that subject that day:** you finish a session or hand in a notebook, finish a
  revision round in that subject, finish a study session, or tick one of your own course's tasks. The tick is written
  by that Study action, at that moment. The entry then keeps the lesson's name ("Arabic Fuṣḥā: The Fuṣḥā register")
  for your history. **Marking a lesson ready doesn't tick it**: that's moving on, not studying, so the entry shows the
  next lesson, still to do.
- **Order.** A learning task you carried over from yesterday still comes first. Then Study's next step. Your own
  Learning list is used only when Study has nothing next: your path is complete and nothing is due, or there's no
  Study option.
- **Carrying over.** A Study entry isn't rolled to tomorrow ("Roll to tomorrow" isn't offered on it): tomorrow's plan
  picks up wherever you are in Study.
- **Older versions** keep the `taskId` and show the entry as a plain learning task with its subject's title; if one
  carries it over, this version still knows it. Going back is safe. One small effect there: an older version's own
  Learning list rotation starts again from its first item after a day whose learning was a Study entry.
- **The learning nudge** no longer needs items in your Learning list: Study's step is what it swaps in.

## 3. Moving on from Today's Study card

- **Ready — next lesson.** When the step is a Practised lesson (Arabic or Cybersecurity), Today's card offers
  **Ready — next lesson**, the same as the lesson page's Ready to move on, and the card moves to the next step. It
  doesn't tick today's Study entry (§2): the entry moves to the next lesson, still to do.
- **A session left open more than 7 days** (an Arabic session, or a Cybersecurity notebook draft) no longer holds the
  card. The card shows the next step, with a line: "You left <lesson> open on <day>", with **Resume** and **Let it go**.
  Let it go discards an Arabic session, as the lesson's own Discard does (asked first). A Cybersecurity draft holds
  your notebook work and has no discard, so it's offered as **Open it** only, and stays in your notebook. The Arabic
  route's "you are here"
  stays the same as the card's step: `arabicRoute` reads `arabicPlan`'s step, so the rule flows through, and
  `specs/arabic-route.md` §1.1 and §1.3 say so (myday-5a's point).

## 4. Tidy up, in Tasks

- **The four starters** are no longer seeded: new accounts start with an empty Learning list. Ones still exactly as
  MyDay added them (same id, title and minutes), and not made into one of your Study courses, are **offered for removal
  in Tidy up** ("Starter items MyDay added … Remove them / Keep them", with Undo). They're never removed on their own:
  removing them on every load lost linked starters through sync and removed carried-over copies (the review, 1 Nov), so
  it's one choice of yours instead. Sync still treats an untouched list of them as the starter list.
- **A Tidy up card at the top of Tasks**, when there's something to tidy, lists unfinished tasks (not on today's plan or
  in the queue) that look old or unrelated, grouped by reason:
  - **From more than 2 weeks ago:** its date is more than 14 days before today. Tasks in a project you haven't
    finished (active or paused) are in a folded group of their own, "In projects you haven't finished", left to you
    (myday-af's point), and "Let go of all these" never includes them.
  - **From a finished project:** its project is finished.
  - **Its reason has gone** (read only from the records that point at the task, never from its title; myday-af's
    answers, 1 Nov):
    - a Chase task whose wait has ended: titled "Chase: <task>" for a task in the same project, or "Chase: <project>"
      for a project, that's no longer waiting, with nothing pointing at it: "its wait has ended" / "the project's wait
      has ended". A task you wrote that starts "Chase: " isn't one unless it names such a task or project exactly;
    - a Fix task whose bug is fixed or marked won't fix (`bugState`): "its bug is fixed" / "its bug is marked won't
      fix". A Fix task whose bug was removed has nothing pointing at it, so only the age rule applies;
    - a Follow up task whose application has moved past Applied, to Interviewing or Offer (`stageOf`): "the
      application has moved on", or is closed: "the application is closed";
    - a Prepare for … interview task whose interview day is before today: "the interview was on Tue 4 Nov", or whose
      application is closed: "the application is closed" (`interviewsOf`).
    Missing sections (`data.software`, `data.career`) are treated as empty.
- Each has **Let go** (as everywhere: it's kept, marked let go, and leaves Today), and the card has **Let go of all
  these** (one Undo, kept with the day it let them go). Nothing is deleted, so a project's links still resolve and the
  history stays. **Keep** stops one being listed again, on this device; **Not now** hides the card for 7 days, on this
  device. After each action, focus goes to the card's heading (or Undo, or the Tasks heading when the card has gone).
- Due today says how many of its tasks look old or unrelated (the same as the card, without the ones in active
  projects), with a link to Tidy up, unless you said Not now.

## 5. The owner's decisions (1 Nov 2026)

1. **Learning comes from Study's next step**: the same as the Study card, from lesson 1, moving on as you do. Your own
   list is used only when Study has nothing next.
2. **The four starter items are removed** if unchanged — offered in Tidy up, one tap with Undo, rather than on their
   own (the review's point; reported to the owner).
3. **A Tidy up card, you choose**: by reason; Let go for each, or all; nothing deleted.
4. **Ready — next lesson on Today's card, and old open sessions stop holding it.**
