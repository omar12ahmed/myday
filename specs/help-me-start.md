# Help me start

**Status:** agreed (1 Nov 2026), being built. Step 1 of "Getting started: MyDay's initiation intelligence" (the
owner's proposal, `initiation-intelligence.md` in the workspace, §3, §4 and §10): MyDay helps you *begin* a task, not
only plan it. No AI.

## 1. What you'd notice

A quiet **Help me start** on any open task's page, next to "Something in the way?", and on the **Up next** task of
Today's plan, beside its "Just start" (it opens the task's page with the card open, and focus on it). It opens a short card, two taps to the first action, every part skippable:

> **Let's get started.** You don't need to finish anything right now.

1. **What's getting in the way?** *(optional, one tap)*: the starting answers you know (it's too big, I don't know
   where to start, it's boring, I'm too tired), plus three new ones: **I just can't get going**, **I want it perfect**
   and **I keep getting pulled away**. The answer is kept with the task, as the Stuck card's are, and it picks which
   small act comes first.
2. **Open it:** what MyDay has for the task: its notes, its next unticked step, a link in its notes, and its project
   with *where you left off* ("Last time you wrote: …").
3. **One small act:**
   - **Start for 5 minutes:** the focus timer's "Just start", for five minutes. The task goes on today's plan if it isn't
     already. Stopping after five minutes is fine.
   - **Tick off the next step**, if the task has steps;
   - and, for "I don't know where to start", 1.118.0's **Think it through with Ask MyDay**.

   "I want it perfect" adds: *a rough first try still counts as started.*
4. **Then decide:**
   - **Carry on**;
   - **Later** (tomorrow, kindly: it isn't counted as a move);
   - **Make it smaller** (the first 10-minute piece becomes today's task, as the Stuck card does);
   - or **Let it go**.

   "No" is a good answer too.

## 2. The owner's decisions (1 Nov 2026)

1. **Who builds it:** myday-94, telling myday-af file by file (Tasks and Today are theirs).
2. **Where:** the task's page, and Today's plan, never an extra button on every row. Today's rows turned out to have no
   menu (only Just start and Focus), so it's on the Up next task alone, where starting matters; to change if the owner
   prefers another way.
3. **The answers:** all three new ones, beside the existing ones, which stay as they are.
4. **Kept with the task, synced, as now:** shown and deletable in What MyDay has noticed, never sent to AI. Older versions
   keep them.
5. **"Later" isn't a move:** it goes to tomorrow without counting towards the Stuck card.
6. **Publish when good.**

## 3. How the answers are kept

A task's answers stay `{ reason, on }`. A new answer is kept as `{ reason: 'other', on, kind: 'going' | 'perfect' |
'pulled' }`:
- 1.118.0 and earlier keep the whole entry (the loader spreads it) and count it as "Something else";
- this version reads the `kind`.

An unknown `kind` from a newer MyDay is kept as it is and counted as "Something else". Once a day per answer.

What MyDay has noticed counts each new answer on its own ("What usually gets in the way: 'I want it perfect'"), with a
tip for what MyDay does then.

## 5. Offers on evidence, under one attention budget (step 2)

The owner's choices (1 Nov 2026, about 03:10 UTC):
- **When:** a task that keeps moving — **moved twice** (the Stuck card's threshold changes from 3 to 2 as well:
  `STUCK_MOVES`, used by the Stuck card, Needs you and Your week), or a week past its date — with nothing said about it in
  the last week (`isStuck`), in an active project or none, and not one you said "Not now" to in the last week. The most
  moved first.
- **How:** a card at the top of Today: "You've moved 'Renew passport' twice. Want an easier way in?" — **Help me start**
  (its page, the card open) · **Not now** · **Don't suggest this again** (switched back on in Your preferences: "Offers to
  help you start a task").
- **One attention budget for Today's unprompted lines** (`data/offers.ts`): the start offer, the learning nudge and the
  "newly noticed" line share **at most one a day**. In that order when more than one applies; once one has shown today
  it's the only one, and **"Not now"** (the nudge's "Not today" too) means none for the rest of that day or the next.
  Projects' Needs you and Worth a look are pages you open, so they aren't part of it.
- **Where it's kept:** today's offer (`offerOn`), the last "Not now" (`notNowOn`) and the tasks it was said to (`quiet`,
  for a week) are MyDay's own notes on this device (`nudge`, not synced, like the learning nudge's), so Today never writes
  your synced data by itself — each device keeps its own one a day. "Don't suggest this again" is your choice, so it's
  kept with your preferences (`startOffers: false`, synced; older versions keep it). Never sent to AI.
- **After the review:** "Not now" says so and leaves that task alone for a week (MyDay withdraws); the nudge's "Never
  mind" (after "Yes, shrink it") isn't a "Not now"; the day's offer is used up only when it's shown (not in Focus mode or
  while editing lists); "twice" reads as a word everywhere.

## 6. What helps you start, learned and confirmed; help that steps back (step 3)

The owner's choices (1 Nov 2026, ~09:40 UTC, with advance approval to build and publish):
- **What counts as "you started":** something MyDay can see, **the same day** you used Help me start: the task done, a
  step ticked, its timer run to the end, its notes edited, or its project's *where I left off* written. Nothing is
  guessed, and "Later" or "Let it go" never count against you.
- **A way of starting worked 4 of the last 5 times** for a kind of work (learning, admin, health) → What MyDay has
  noticed offers it as a pattern to confirm, e.g. "Five-minute starts work for you on learning tasks — 4 of the last 5
  times you used one, you started that day." Confirmed, Help me start puts that way first for that kind of work. As with
  every pattern, it's doubted (held back) when the recent evidence fades, and deleted with the rest.
- **Help steps back:** when your last 5 done tasks of a kind were done without moving, start offers stop for that kind,
  and What MyDay has noticed says so. Help me start stays on every task.
- **Ask MyDay:** a confirmed way of starting is one of the "how you work" lines Ask MyDay gets — only while you've let
  Ask use how you work, as a general statement. Never your tasks or your answers.

**How it's kept** (no new synced kind; older versions keep both, as their loaders keep unknown fields):
- each use of Help me start's small acts, in your patterns (`startSeen`, synced, like Ask's counts): the day, the way
  (`five`, `step`, `ask`, `smaller`), the kind of work, the task, and for "smaller" the piece it made. Never words. At
  most 200, the last 8 weeks; forgotten with "Forget everything it has learned";
- the days a task was touched (`touched`, its last 30 days): when a step is ticked, its notes are edited, or its timer
  runs to the end.

**"Ticking off the next step"** is the start itself, so it's kept but not offered as a pattern (it would always "work").
A use is judged only once its day is over.

**After the review:**
- Not counted either way: a use you followed with "Later" or "Let it go" that day (`excused`), or one whose task is gone.
- The same way on the same task counts once a day.
- Each way that qualifies is its own pattern; if you've confirmed more than one, the one that has worked best lately
  comes first.
- **"Getting done on time"** (help stepping back) counts only dated tasks done on or before their date, never moved,
  with nothing said about what was in the way, and without Help me start (nor one of its 10-minute pieces).
- MyDay never trims or writes these on its own: old uses go when you next use Help me start; the timer marks a task only
  when it runs to the end while MyDay is open (not when it's reopened later). A task keeps its last 30 days.
- "Forget everything it has learned" shows, and says so, when your uses of Help me start are all there is.
- Older versions (1.123.0) keep `startSeen` and `touched` unread; their "Forget everything" doesn't clear `startSeen`.
- For the owner: a five-minute start counts when its timer runs to the end (the chosen definition), so it will nearly
  always "work" if you let it run.

## 4. Not in this step

- Learning which strategies help, "started", and fading (step 3).
- Opening a course lesson from a study task (Study's own cards already do).
