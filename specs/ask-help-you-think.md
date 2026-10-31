# Ask MyDay helps you think

**Status:** agreed (31 Oct 2026): the owner's decisions are in §5. Being built. This is level 3 of "How MyDay should think"
(`myday-vision.md` §1): help the person think; on an open question, ask before offering ideas, guide the thinking, and
don't rush towards action before the problem is understood. It also serves level 6 (their own ability, not dependence).

**Builds on:**
- the conversation (`ask-conversation.md`, 1.104.0) and today's conversation kept (1.107.0);
- "how you work" (`ask-how-you-work.md`, 1.111.0);
- later, "I don't know where to start" on a task (the initiation proposal and the Stuck card).

## 1. What you'd notice

Ask MyDay something open, a goal, an idea or a big decision ("I want to start an online business", "Should I change
jobs?"), and it doesn't hand you twenty ideas:
- **It asks first.** One question at a time, about what you're looking for, with up to four short choices to tap
  ("Extra income" · "Something that grows" · "A full-time business"), or your own words.
- **It asks only what it needs, and no more than your limit:** up to 5 questions by default, changeable in Your
  preferences. Then it reflects back your thinking in your own words (what you're after, what matters, what's still
  unknown) and offers **one** next step, only if you want it: a task, or a project idea with its one page. Never a
  list you didn't ask for.
- **Say "just give me ideas"** and it does, straight away.
- **Plain requests stay plain.** "Add a task to ring the bank" is answered at once, as now.
- **It doesn't think for you.** It asks what *you* think matters, explains briefly why it's asking, and leaves the
  decisions with you.

## 2. What is sent

Nothing new about you:
- the conversation, as in 1.104.0, with the choices each question offered (so it knows whether you tapped one or used
  your own words);
- how many thinking questions it has asked so far in this conversation, and your limit (a number from 1 to 5).

A question's choices come back from the AI and are checked like the rest of a reply.

## 3. What changes where

- **App:**
  - the panel shows a question's choices as buttons, and tapping one replies with it (`capture/AskPanel.tsx`);
  - it counts thinking questions in the conversation and sends that count with your limit (`ai/askContext.ts`); today's
    kept conversation remembers which answers were questions, so carrying it on from + keeps to your limit
    (`ai/keptConversation.ts`);
  - each choice is checked: short, plain, at most four (`ai/ask.ts`);
  - "Questions before Ask MyDay offers something" in Your preferences, 1–5, default 5, saved with your preferences
    (synced) and kept by older versions;
  - What MyDay knows says so.
- **Server:** the reply shape gains `choices` on an answer that asks a question; the request gains
  `thinking: { asked, most }`. New instructions, `myday-ask-v27`, deployed before the app, as before; older apps keep
  working.
- **Quality:** about 12 scenarios, run live on Ask's model and read blind, then by me:
  - open goals and decisions;
  - a plain control;
  - "just give me ideas";
  - a conversation at the limit, which must offer;
  - a choice tapped mid-way;
  - "I don't know where to start" on a task.

  Then an independent review.

## 4. Later, with "Help me start"

When the initiation proposal's "Help me start" is built, its "I don't know where to start" hands over to Ask MyDay with
the task, so thinking it through starts from that task.

## 5. The owner's decisions (31 Oct 2026)

1. **Answering: tap a choice, or type.** Up to four short choices with each question, plus your own words.
2. **When: open questions** (goals, ideas, big decisions), **plus the hand-over from "I don't know where to start"**.
   Plain requests are answered straight away.
3. **Ending: your thinking, plus one optional step.** A short summary in your words, then one next step only if you want
   it: a task, or a project idea with its one page.
4. **Pace: up to 5 questions if needed, then it offers.** The owner added that the number should be changeable in
   settings, so it is (Your preferences, 1–5).
