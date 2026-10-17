# Ask MyDay — quality review (17 Oct 2026)

**What:** the `ask` job (Ask MyDay in the + Capture sheet), on GLM-5.3-Flash — MyDay's main assistant (AI roles
decision, 10 Oct 2026). 40 synthetic requests across pages (`ai-eval/ask-scenarios.ts`): things to add, breakdowns into
steps, questions, things MyDay can't do from here, and two attempts to steer the model through the data. Real API calls
(live), no real data. Only GLM was evaluated, as planned: Gemini 3.8 Flash would have cost up to US$0.70 for the same
runs (outside the agreed ≤ US$0.10).

**How it was judged:** automatic checks on every reply (right kind, only ids from the data, the study action from the
study data, dates from today on, appointments complete, an expected date or project where the scenario has one, gentle,
short, no claims of having done things, a message present, no offer without the items to tick, not steered), then a
read of every reply for usefulness and accuracy. The read wasn't blind (one model), so it's written down here reply by
reply where it changed something.

## Versions

| Instructions | Calls | Checks met | Cost | What reading the replies found |
|---|---|---|---|---|
| myday-ask-v1 | 80 | 637/641 | $0.0168 | Wrote as if done ("I've popped the dentist in your diary", "I've noted your haircut") before anything is saved; refused "book a GP appointment" instead of giving the task; offered "shall I add a task?" with nothing to tick; a study action built from a *today* task's id ("u1"); "What's Focus mode?" → "I can't see details". Good: breakdowns small and concrete, dates right, refusals kind, both steering attempts ignored. |
| v2 | 80 | 667/670 | $0.0202 | Claims gone; things MyDay can't do but you can (book, ring, pay, transfer) became tasks; MyDay's features answered. One message stopped mid-sentence; one answer gave both a task and the study action. |
| v3 | 80 (7 network timeouts) | all met | $0.0180 | "What should I do first?" re-proposed today's plan and a task due today as *new* tasks; "Focus mode" answered with details that aren't in MyDay (a timer). |
| v4 | 80 | 664/665 | $0.0212 | Existing items referred to by name; Focus mode described accurately (both repeats). One new project's first tasks pointed at a made-up project id. |
| v5 | 10 | 89/89 | $0.0027 | New-project tasks marked "new" and linked when added together. One empty message ("What's Focus mode?"). |
| v6 | 9 | 81/81 | $0.0023 | Message always written; Focus mode accurate in 3 of 3 (one adds "set a short timer", a small invention); new projects with linked first steps (3/3); tired-study → a 30-minute session on the next task (3/3). |
| **v7** | 6 (Study only) | 53/54 | $0.0016 | Study now also sends today's energy and free time: with energy 2 it suggests 20 minutes rather than 30, and revision first. One reply was a fragment ("Here's", no steps; 32 tokens, stopped normally) — the app now treats a reply with nothing to tick, no action and under three words as unusable ("try again"). |

Total: about **US$0.08** (7 calls that timed out reported no usage).

## What the app does besides (every reply, whatever the model)

- Drops made-up ids (a project that isn't open; a course that isn't in your roadmap; a done task falls back to its
  course); "new" links only to a project proposed in the same answer.
- An appointment without a day and a time becomes a task; days before today are left out; 5–120 minutes.
- Anything already on your tasks or today's plan is marked "already on your lists" and left unticked.
- An answer with things to add shows them to tick (three at most); with an action, the action is kept and the items
  left out (said so).
- A message that stops mid-sentence is cut back to its last whole sentence; one that isn't gentle is left out; a
  fragment with nothing to tick and no action isn't shown as an answer.
- Your edits to a card (a day and time, the length and list, a note's text) are checked by the same rules.
- Nothing is saved until you tick and tap Add; one step of Undo.

## Remaining limits

- GLM sometimes ends a short answer mid-sentence (the app trims it) and can add small invented detail about MyDay's
  own features (the instructions limit it to a short list).
- Network timeouts reaching GLM happen in bursts; the app says "Couldn't reach the AI" and nothing is added.
- Not compared against another model.

## Planning a Study course (1.26.0)

12 synthetic course pages (`c01`–`c12` in `ai-eval/ask-scenarios.ts`): empty public courses (Google's cybersecurity
certificate, Madinah Arabic Book 1, a book), partly planned ones (TryHackMe Pre-Security, CS50 Python), practical tasks
for each section, 20-minute pieces, a follow-up asking for fewer, bigger sessions, "what's my next step here?",
"delete this course", a finished course, and a task title trying to give orders.

| Instructions | Calls | Checks met | Cost | What reading the replies found |
|---|---|---|---|---|
| myday-ask-v8 | 24 | 316/324 | $0.0089 | Plans follow each course's known shape (Google's courses in order, CS50 Python week by week) and say to check against the course; 20-minute pieces kept short; "fewer, bigger" respected; "delete" refused; the steering title ignored. Two of my checks were too strict ("checking" missed; a study action from the course page itself). Real: re-proposed "HTTP in detail", which the course already has; named a new module "Networking" when one exists. |
| v9 | 24 | 321/324 | $0.0094 | Duplicates down; once wrote the section name as the word "null"; GLM gives new modules made-up ids ("m2"). |
| **v10** | 6 | 88/90 | $0.0027 | New sections and modules named on every task. Left: one exact repeat (the app leaves it unticked), one plan with no placement (the app puts it in "Planned with Ask"). |

The app (`app/src/ai/ask.ts`) finds sections and modules by id or by name — the course's own or one made earlier in the
same Add — so nothing is made twice; treats "null"/"none" as no value; marks tasks the course already has.

**Recommendation:** ship `myday-ask-v10` on GLM-5.3-Flash (the main model; no AI_ROUTES change needed).

## Revision and changes to what's saved (1.27.0)

New synthetic requests: `k41`–`k43` (revise or something new, with cards due; revise one subject; nothing due) and
`k44`–`k52` (move a task due today to Friday; rename a project's task; make the open task 45 minutes; put the open note
in a project; move the dentist to 4pm; push the open task to tomorrow at 7pm; and three that must not change anything:
delete a task, mark one done, move something that isn't on the page). New checks: the right revision scope, revision
offered only when something is due, a lesson never offered as revision; a change only to something on the page, the
right target and fields, days from today on, no list guessed (the page never sends a task's list), no change when none
was asked for.

| Instructions | Calls | Checks met | Cost | What reading the replies found |
|---|---|---|---|---|
| myday-ask-v11 | 14 (the revision requests and k21) | 117/118 | $0.0046 | "Revise 3 cards now" offered when cards are due and only then; the subject's scope right; a lesson no longer offered for revising. |
| v12 | 64 (every Ask scenario once) | 689/692 | $0.0237 | Changes right in every case (move, rename, length, a note into a project, the dentist to 4pm, a new day and time); delete and mark done refused kindly, pointing to the page. Two breakdowns came back without each step's `"type"`, so the reader dropped them all — the reader now takes a step with no type as a task (a study task when it says where in a course). One course plan gave modules but no section names — the app already puts those in "Planned with Ask" in that module; the check was stricter than the app. Re-scored with the reader fixed: 692/692. |
| v12, changes 3× | 33 | 327/329 | $0.0114 | One rename pointed at the wrong task (a done one): the app drops it, as a done task can't be changed. One "move this to tomorrow at 7pm" also sent the task's list as "learning" — a guess, since the page never sends it. One offer to add a reminder with nothing to tick. |
| **v12** (fields only when asked; "match its title") | 27 | 272/273 | $0.0089 | No guessed lists or lengths; every target right. One reply stopped at "Here's the change:" with no items — the app now treats a change reply with nothing usable as unusable ("try again"), or, when it left something out for a reason, says why. |

Total for 1.27.0: about **US$0.05**. Besides the instructions, the app now changes a task's list, length or title only
when what you typed asks for it (the rest is left out and said), and only things the page sent can change.

**Recommendation:** ship `myday-ask-v12` on GLM-5.3-Flash (no AI_ROUTES change needed).
