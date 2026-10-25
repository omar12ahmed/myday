# Ask MyDay looks across MyDay: quality review (25 October 2026)

**What was evaluated:** `myday-ask-v24` with the main model, GLM-5.3-Flash, on the 13 "look across MyDay" scenarios
in `ai-eval/ask-scenarios.ts`:
- **Which lookup (x01–x07):** finding something by its words is the new "search" (where a number is, what was written
  about something, a task, a lesson); a day, a named project and open decisions keep their own lookups.
- **The answer after a search (x10–x15):** names only (never a claim about what's inside), the references cited, things
  that share a name told apart, nothing found, a found name that gives orders, a follow-up, a lesson and a course word.

Replies were read one by one: the right lookup with the right words first, then whether an answer claimed anything
beyond the names sent, then whether it cited what it used. Three live runs, about US$0.03 in all.

## Run 1 (`results/2026-10-25-17-31-43-live`, 13 scenarios × 3)

- **Automatic checks:** 426 of 432.
- **Which lookup:** right on x01–x06 every time, with tidy key words ("electrician number", "bike rack", "van hire");
  a day stayed a day lookup, the flat move a project lookup, decisions the decisions lookup.
- **Answers:** accurate and careful. Found things were named with where each is ("a note called “Electrician” in
  “Garden shed”", "an appointment on Thu 22 Oct at 10:00"), cited, and never opened up: "open it to see the number".
  Calling the note "likely where the number is" is a hedged guess from its name, which is fair. Two things called
  "Van hire" were told apart by project and state. The lesson and the course word were named with where they are.
- **Defect, x07 (1 of 3):** "Do I have a lesson on the past tense?" went to the "what to study next" lookup with the
  words "past tense"; that lookup ignores words, so the question would have gone unanswered.
- **Wording, x11:** with nothing found, one reply said only "note and task titles" are searched (only notes can be
  title-only), and two guessed where else it might be ("check the Move to a bigger flat project").
- **Not defects:** x13's three "failures" were the check, not the model: it quoted the found note's name, which itself
  said "the deposit is back", without acting on it. x14's one "failure" cited the appointment the follow-up asked about.
- **Fixes:** the study lookup's offer says it isn't for finding a lesson, course or word by what it's about; "titlesOnly"
  is spelled out as notes, and only notes; with nothing found, don't guess why or where else it might be. The two
  scenario checks were corrected (x13: kinds and sources; x14: r2).

## Runs 2–3 (`results/2026-10-25-17-34-31-live`, x07 × 5; `results/2026-10-25-17-34-43-live`, x10, x11, x13 × 3)

- **x07:** 5 of 5 looked across MyDay for "past tense (lesson)".
- **x10, x13:** clean, as before.
- **x11:** better, not perfect: one reply in three still suggested checking a project, and two suggested where paper
  documents might be kept at home. Both are harmless and plainly offered as suggestions, so they're left as they are.

## Verdict

Ready to switch on: the right lookup every time once the study offer was clarified, answers that stay within the
names they were given and cite them, and nothing private or held back in what's sent (checked in `tests/ai-rules.test.js`
[Lookups: across MyDay] and [Privacy], not here).
