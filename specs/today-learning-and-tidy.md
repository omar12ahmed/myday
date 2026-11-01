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
  when it's due. It's titled for its subject ("Arabic — your next lesson", "Cybersecurity — your next lesson", or
  "<course> — your next section"), and saved with `study: { subject, courseId? }` on the plan entry.
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
- **Older versions** drop `study` from a plan entry when they read it (`cleanTask`), so the entry stays a plain
  learning task with its subject's title. Going back is safe.

## 3. Moving on from Today's Study card

- **Ready — next lesson.** When the step is a Practised lesson (Arabic or Cybersecurity), Today's card offers
  **Ready — next lesson**, the same as the lesson page's Ready to move on, and the card moves to the next step.
- **A session left open more than 7 days** (an Arabic session, or a Cybersecurity notebook draft) no longer holds the
  card. The card shows the next step, with a line: "You left <lesson> open on <day>", with **Resume** and **Let it go**.
  Let it go discards the open session or draft, as the lesson's own discard does. The Arabic route's "you are here"
  stays the same as the card's step: `arabicRoute` reads `arabicPlan`'s step, so the rule flows through, and
  `specs/arabic-route.md` §1.1 and §1.3 say so (myday-5a's point).

## 4. Tidy up, in Tasks

- **The four starters are removed** from the Learning list (and the queue) when they're exactly as MyDay added them:
  same id, title and minutes. Anything you changed or added stays. New accounts start with an empty Learning list.
- **A Tidy up card at the top of Tasks**, when there's something to tidy, lists unfinished tasks (not on today's plan or
  in the queue) that look old or unrelated, grouped by reason:
  - **From more than 2 weeks ago:** its date is more than 14 days before today. Tasks in an active project are in a
    folded group of their own, "In active projects", left to you (myday-af's point).
  - **From a finished project:** its project is finished.
  - **Its reason has gone** (read only from the records that point at the task, never from its title; myday-af's
    answers, 1 Nov):
    - a Chase task that no task's or project's wait points at any more: "its wait has ended";
    - a Fix task whose bug is fixed or marked won't fix (`bugState`): "its bug is fixed" / "its bug is marked won't
      fix". A Fix task whose bug was removed has nothing pointing at it, so only the age rule applies;
    - a Follow up task whose application has moved past Applied (`stageOf`): "the application has moved on", or is
      closed: "the application is closed";
    - a Prepare for … interview task whose interview day is before today: "the interview was on Tue 4 Nov", or whose
      application is closed: "the application is closed" (`interviewsOf`).
    Missing sections (`data.software`, `data.career`) are treated as empty.
- Each has **Let go** (as everywhere: it's kept, marked let go, and leaves Today), and the card has **Let go of all
  these** (one Undo). Nothing is deleted, so a project's links still resolve and the history stays. **Keep** stops one
  being listed again, on this device; **Not now** hides the card for 7 days, on this device.
- Due today says how many older tasks there are, with a link to Tidy up.

## 5. The owner's decisions (1 Nov 2026)

1. **Learning comes from Study's next step**: the same as the Study card, from lesson 1, moving on as you do. Your own
   list is used only when Study has nothing next.
2. **The four starter items are removed** if unchanged.
3. **A Tidy up card, you choose**: by reason; Let go for each, or all; nothing deleted.
4. **Ready — next lesson on Today's card, and old open sessions stop holding it.**
