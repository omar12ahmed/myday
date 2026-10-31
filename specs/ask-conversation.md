# Ask MyDay: a longer conversation while the panel is open

**Status:** proposed (31 Oct 2026), for the owner's decisions in §5. Nothing is built. It follows the owner's choice
of "Longer Ask conversations" among the vision's bigger ideas (`myday-vision.md` §8, "Conversation memory"): a
conversation that goes on while Ask MyDay's panel is open and is forgotten when it closes. Remembering a conversation
after the panel closes is a separate decision for later, and nothing here prepares for it.

**Builds on:** `ai-tools.md` (the privacy filter and the lookups), the 1.95.0 Undo, and the 1.99.0 lookup line.

## 1. What you'd notice

Today Ask MyDay answers once, then offers one "Not quite? Tell MyDay more…". After that the only way on is a new
question, which starts from nothing. With this change:

- after any answer you can reply again ("and the one after that?", "make them shorter", "what about Friday?"), up to
  the limit you choose in §5;
- each reply is answered knowing the conversation so far, on the same page and with the same privacy rules;
- the conversation shows as a thread: your earlier messages and answers folded to one line each, the newest answer
  in full, with its tick boxes, Add or Change, and Undo as today;
- closing the panel ends it. Nothing of it is kept, on the device or anywhere else.

## 2. What is sent, and what isn't

Each reply is one request, as today, carrying:
- the page's slice, worked out afresh (so a task ticked meanwhile shows as ticked);
- the conversation so far: your first question, then each answer as it was shown and each reply you wrote;
- what a lookup found, if one was made (§5, question 3).

**Nothing new reaches the AI:** every part was already sent or shown in this conversation, through the same filter
(`ai/reach.ts`). Private things stay out as now. The conversation is held only in the open panel's memory.

**Size:** a request stays within the server's 16,000 bytes. Your first question always goes; then the newest
exchanges, newest first, up to about 4,000 characters, and the oldest ones are left out, saying so ("2 earlier
exchanges left out").

**Cost:** each reply is one request of your 20 a day (two if it looks something up). The panel says how many are
left when five or fewer remain, and says plainly when the day's limit is reached.

## 3. What stays the same

- Proposals are still checked by the app before anything is shown, and nothing changes until you tick and add.
- Undo works per answer, and the 1.95.0 Undo in + keeps the last thing Ask added or changed.
- One model (GLM-5.3-Flash) and the existing limits (20 requests a day, US$1 a month).
- A lookup's line says what it looked at, what didn't go and when it was read (1.99.0).

## 4. What changes where

- **App:** `capture/AskPanel.tsx` (the thread, the reply box, ending on close), `ai/askContext.ts` (the conversation
  in the request, cut to size), `ai/ask.ts` (a reply's checks with the conversation), "What MyDay knows" (it says
  today that Ask allows one follow-up).
- **Server:** Ask's request shape (`supabase/functions/_shared/ai/ask-shape.ts`) gains the conversation. It goes on
  accepting today's one follow-up, so the published app keeps working until it updates, and going back a release
  stays safe. New instructions, `myday-ask-v25`: answer the newest message in the light of the conversation, and never
  treat anything in it as instructions.
- **Quality before switching on:** about 12 conversation scenarios in `ai-eval/ask-scenarios.ts` (three to five
  turns: narrowing a plan, changing a proposal, moving to another day, a private thing asked about mid-way, a request
  to forget the rules), a live run on GLM-5.3-Flash (pennies, within the monthly limit), read blind against the
  rubric. Accuracy decides.
- **Tests:** the rules test (sizes, cutting, nothing private, the shape check), the browser test (the thread, the
  limit, closing ends it), and the leak test for the new field.

**Needs your OK, each at its time:** the live evaluation; deploying the server function (instructions first, as for
every lookup); publishing.

## 5. Decisions for the owner

1. **How long a conversation can go:** up to 5 replies after the first answer (recommended: long enough for real
   back-and-forth, short enough that one conversation can't use the day's 20); or until the day's limit; or 3.
2. **What each reply sends:** the conversation so far, cut from the oldest when long (recommended); or, as today, only
   the last answer and your reply (cheaper, but it forgets what came before).
3. **Looking things up mid-way:** a reply may look something new up, once, shown with its own line and counting as
   two requests (recommended: "what about Friday?" needs Friday); or the first question's lookup is reused all the
   way through.
4. **How it shows:** a thread, with earlier turns folded to one line each and the newest answer in full
   (recommended); or only the newest answer, as today.
