# Ask MyDay: one privacy filter, then read-only lookups

**Status:** agreed direction (the owner's decisions are in §6). Step 1, the filter (`app/src/ai/reach.ts`), shipped in 1.61.0; step 2's first lookup, "Search your notes", shipped in 1.63.0; the second, "Your day", in 1.66.0 (`dayLookup`; the server's instructions `myday-ask-v18` were deployed first); the third, "A project's context", in 1.70.0 (`projectLookup`; the server's instructions `myday-ask-v19` were deployed first); the fourth, "Open decisions", in 1.72.0 (`decisionsLookup`; the server's instructions `myday-ask-v20` were deployed first); the fifth, "What you're waiting on", in 1.75.0 (`waitingLookup`; the server's instructions `myday-ask-v21` were deployed first); the sixth and last, "What to study next", in 1.79.0 (`studyLookup`; the server's instructions `myday-ask-v22` were deployed first).
**Builds on:** [`myday-vision.md`](myday-vision.md) §4, and the owner's decision of 24 Oct 2026 that Private covers
every AI feature except note filing.

## 1. What this adds, and why

Ask MyDay answers from a fixed slice of the page you opened it on. Ask it on Today about a note, and it can't see the
note; ask it on a project about tomorrow's plan, and it can't see the plan. The aim is for Ask MyDay to **look
something up when your question needs it**. For example, "what did I write about the van hire?" or "have I got time
for the dentist tomorrow?". It should do this without ever seeing more than the privacy rules allow, and always
saying what it looked at.

It's built in two steps:
1. **One shared privacy filter**, used by every AI feature. Today, each feature decides for itself what to leave out.
2. **Lookups**, read-only, starting with two.

## 2. Step 1: one filter for everything AI sees

A single module, `app/src/ai/reach.ts`, answers "what of this may reach AI?". Every request builder that reads your data uses it
(builders that send only course content or what you type, such as the tutor and "Add what's on my mind", have nothing to hold):
- Ask MyDay (`askContext.ts`);
- "Help me adjust today" (`context.ts`);
- "Add what's on my mind";
- AI help with notes (`connect.ts`);
- revision cards;
- the tutor;
- "Explain it another way";
- every future lookup.

The rules it applies are the ones already decided:

| Never reaches AI | Reaches AI only… |
|---|---|
| A private note, by any feature | A note's text: only with "AI help with notes" on |
| A private project, by any feature, except that note filing may offer its name and summary (owner, 17 Oct) | A private project's task on today's plan: only as "a private task" |
| A project's outcome, what counts as finished, "Where I left off" | Appointment names: only on the Calendar page's own slice, as today |
| Who a task is waiting on | Finance and Health: only the page's name, and workouts as busy time |
| Name, email, preferences and patterns | |

**What you'd notice:** nothing, except that any gap the filter closes stops being sent. Each closed gap is listed in
the release note. The server goes on refusing any field it doesn't know, which is a second line of defence.

**Checks:** a rules test feeds every request builder the same made-up data, with a private project, a private note
and every never-sent field filled in. It proves none of them leaks. Each future lookup is added to the same test.

## 3. Step 2: lookups

MyDay's data lives in your browser, not on the server. So the model can't fetch anything itself. A lookup is two
steps:
1. Ask MyDay's reply can be a new kind, **"look up"**, which names one lookup and its search words. It replies that
   way only when the page's slice doesn't answer the question.
2. The app runs the lookup **on your device, through the filter**, then sends a second request with what it found.
   The answer that comes back names the records it used.

Rules for every lookup:
- **Read-only.** A lookup never changes anything. Changes still come back as proposals you tick and apply, as today.
- **One lookup per question**, so a question costs at most two requests of your 20 a day.
- **Shown, not hidden.** The panel says "Looked in your notes for 'van hire': 3 notes (1 private left out)" before the
  answer, and each record the answer used is a link.
- **Small.** At most 8 records, each cut to a few hundred characters, within the existing 16 KB request limit.
- **Honest gaps.** If nothing is found, or things were left out (private, switched off, too many), the answer says so.
  It never guesses.

The first two lookups:

| Lookup | Finds | Built on |
|---|---|---|
| **Search your notes** | Notes matching the words: title, a short snippet (text only with "AI help with notes" on), project name | Notes search, with project search's matching (every word, any order, accents ignored) |
| **Your day** | One day's plan (today or a named day): its tasks, appointments as busy time, energy and free time | The "Help me adjust today" context |

The third, the owner's choice (24 Oct 2026): **A project's context** — one of your open projects asked about by name
from another page ("what's next on the flat move?"), as its own page sends it: name, summary, stage, tasks, milestones
and note titles (their text only with "AI help with notes" on). Never a private project, its outcome, what counts as
finished or where you left off; its decisions and one page stay on its page. It also covers "find projects": open
projects' names already go with most questions, and the model names the project by its id from them.

The fourth, the owner's choice (24 Oct 2026): **Open decisions** — the decisions with nothing chosen yet across your
open projects (or one), each one's question and options, which options have no pros or cons yet (not what any say)
and when it was opened, plus a business idea's unchecked must-be-true items. Not on Finance or Health. Never a private project's, your reasons,
earlier choices or what you found; it never picks an option for you.

The fifth, the owner's choice (24 Oct 2026): **What you're waiting on** — the tasks marked as waiting (not done or let
go), oldest first, across your tasks or one project's: title, project, since when, the day expected and whether it's
chased. Never who or what it waits on; never a private project's task; dates, never a count of days or "overdue".

The sixth and last: **What to study next** — the same next steps as Today's Study card (`learningOptions`, the one
authority), your focus first, with the reason, minutes and length; offered everywhere but Study. No ids or links go. The reason goes as
`aiWhy` (myday-86's): never your own "needs revision" note, and never a calendar block's name (a private project's
appointment may only go as busy time). A private project hides itself and its link, not a course it points at: a
course's title and tasks go like any course's (your own words, even if they name the project), but never that a
project links it, the project's name or the "For your project" line.

## 4. Quality before it's switched on

1. **Practice mode first.** The mock answers lookups by simple rules, so the whole flow can be tested without AI.
2. **Practice questions.** A scenario set in `ai-eval/` holds about 40 practice questions:
   - ones the page already answers (no lookup should happen);
   - ones that need a note or a day;
   - ones about private things (the answer must say they're left out);
   - ones where nothing matches.
3. **Blind review.** The replies are read blind against a rubric of accuracy, the right lookup (or none), honesty
   about gaps, and wording. Accuracy decides; speed and price come after. Automatic checks can't judge this alone.
4. **Your go-ahead.** Only then is it switched on in the published app.

## 5. What changes where, and what needs your OK

**What changes:**
- **App:** `ai/reach.ts`; the request builders; Ask's panel ("Looked in…", links); the lookups.
- **Server:** Ask's reply shape gains "look up" (`supabase/functions/_shared/ai/ask-shape.ts`). The instructions say
  when to look something up. A second request carries the results.
- **Docs:** "What MyDay knows" lists each lookup and what it sends. The README and this spec are updated.

**What needs your OK:**
- **Deploying the server function:** an outside action. I'll ask each time.
- **Live AI evaluations:** pennies, within the US$1 a month limit. I'll ask before running them.
- **Switching lookups on:** in the published app, after the blind review.

## 6. The owner's decisions (24 Oct 2026)

1. **Automatic, and shown.** A lookup happens by itself (read-only, through the filter), shown above the answer as
   "Looked in your notes for 'van hire': 3 notes (1 private left out)".
2. **Search your notes first.** "Your day" follows.
3. **A lookup's second request counts towards the 20 a day.** A question with a lookup uses 2.
4. **The filter ships first, on its own**, before any lookup, so a privacy change is never mixed with a new feature.
5. **Busy time counts every appointment** (for "Your day"): a private project's appointments go as busy time, by kind
   and time only, as in Help me adjust today, so a day is never shown free when it isn't.
6. **"A project's context" is the third lookup.**
7. **"Open decisions" is the fourth lookup.**
8. **"What you're waiting on" is the fifth lookup**: titles, project, since and until; never who.
9. **"What to study next" is the sixth lookup** (the owner's "continue", 25 Oct 2026).
10. **Steps reach Ask MyDay** (25 Oct 2026, with myday-51's steps and "Starts after"): on a task's page its steps go
    (words and done) and a breakdown fills its checklist; a project's page and the project lookup send each task's
    steps (words included) and what it starts after, by title. Never a private project's.
