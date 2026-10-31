# Ask MyDay: today's conversation kept until you close the day

**Status:** agreed (31 Oct 2026): the owner's decisions are in §4. Being built. It follows the owner's choice
of "Keep today's conversation" after 1.104.0 (`ask-conversation.md`), where a conversation is forgotten when Ask
MyDay's panel closes.

**Builds on:** `ask-conversation.md` (the conversation and what each reply sends), and the 1.95.0 Undo kept for the
day in + (`app/src/ai/lastAsk.ts`), whose way of keeping things this copies.

## 1. What you'd notice

You ask Ask MyDay something, reply once or twice, close +, and get on with your day. Later, when you open + again, a
line at the top offers the conversation ("Your conversation from 10:42, 3 messages · Carry on"). Carry on brings back
the thread as it was, with a reply box under the last answer, and replying works exactly as in 1.104.0. A new
question starts a new conversation, which replaces the kept one. At midnight it's forgotten.

## 2. What is kept, where, and what isn't

- **Kept:** each exchange as the panel shows it (your message, and the answer as it was shown with its note of what
  you did), the lookup behind the last answer, and when it started. Only what was already sent or shown.
- **Where:** on this device only, like the 1.95.0 Undo. It's not part of your data: not synced, exported or backed up.
  Delete everything clears it, and so do signing out and another account's data being cleared.
- **Not kept:** the tick boxes, Add and Apply of the last answer. Their state could be out of date by later, so the
  last answer comes back as text; "add those" in a reply proposes them again, checked against your data as it is then.
- **Nothing new reaches the AI.** A reply sends the conversation exactly as in 1.104.0.
- **Made private since:** a kept answer may name a project or note you've since made private, so if anything has been
  made private since it was kept (or AI help with notes switched off), it's forgotten rather than offered.

## 3. What changes where

- **App:** a small store like `lastAsk.ts` for the conversation (one per device, shape-checked when read, never
  throws); the panel keeps it after each answer and forgets it on Start over, Dismiss and Delete everything; + shows
  the line; sync forgets it on sign-out; "What MyDay knows" says it's kept on this device until midnight.
- **Server:** nothing.
- **Quality:** no new AI behaviour, so no evaluation is needed. Rules and browser tests cover keeping, carrying on,
  forgetting and a damaged stored copy; an independent review checks privacy (device only, cleared on sign-out).

## 4. The owner's decisions (31 Oct 2026)

1. **Where: on any page**, with replies seeing the page you're on (rather than only where it started).
2. **How it comes back: a line at the top of + with Carry on** (rather than the whole thread, open).
3. **How long: until midnight or a new question**, like Undo (rather than two hours after the last message).
4. **The last answer's suggestions: back as text only**; a reply asks for them again (rather than with tick boxes).
