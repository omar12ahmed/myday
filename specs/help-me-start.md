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

## 4. Not in this step

- Offers on evidence and one attention budget across MyDay (§10 step 2).
- Learning which strategies help, "started", and fading (step 3).
- Opening a course lesson from a study task (Study's own cards already do).
