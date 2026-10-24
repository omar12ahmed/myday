# Evaluating "Help me adjust today", "Add what's on my mind", AI help with notes, the tutor and revision cards

20 synthetic MyDay days (`scenarios.ts`: low energy, poor sleep, day and night shifts — one across a clock change —,
appointments, too little time, revision due, rest days, missing information) are sent to each model with **identical
instructions, context and output shape** (`../supabase/functions/_shared/ai/`), repeated (3 times by default), and
every reply is checked by the app's own rules (`../app/src/ai/validate.ts`) and saved through the app's own save path,
in memory. Nothing here reads or writes real MyDay data.

## Run it

From the `myday-site` folder (needs `npm install` in `app/` once):

```bash
node ai-eval/eval.mjs                       # mock planners only: free, no keys (checks the pipeline and the checks)
DASHSCOPE_API_KEY=… DASHSCOPE_WORKSPACE_ID=… ZAI_API_KEY=… \
  node ai-eval/eval.mjs --live --budget-usd 0.50 --models qwen3.7-plus,glm-5.3-flash,qwen3.7-flash
```

A live run only starts when:
- `--live` is given (it's never the default);
- `--budget-usd` is given — before every call the most it could cost (the prompt counted generously, plus the whole
  reply cap, reasoning included) is set aside and checked against what's left, and the run stops (marking the rest
  "skipped") rather than go over. With `--total-budget-usd`, the same check also covers every earlier live run,
  from the ledger (`results/ledger.json`: every live call, with what it counted — the cost estimated from the token
  usage the provider reported, or, for a call that reported no usage, everything set aside for it, which stays
  counted until provider billing shows what it cost);
- each model's key is in its environment variable (`keyEnv` in `models.json`), and for Qwen your Alibaba Cloud
  workspace id is in `DASHSCOPE_WORKSPACE_ID` (it's part of the address). You can put `NAME=value` lines in
  `ai-eval/.env.local` instead, which Git ignores. Keys are never written to results;
- each model has its prices in `models.json`.

`models.json` holds model ids, addresses, request settings and list prices checked against the providers' official
documentation (3 Oct 2026; the sources are listed in the file). Which of them applies depends on your account: Qwen's
address and prices depend on your workspace's region (Singapore / International is filled in; Beijing's are noted),
and GLM-5.3-Flash is used through Z.ai, where thinking can't be switched off (it runs at the lowest reasoning effort,
which costs more output tokens and time than Qwen with thinking off — the evaluation shows how much).

Brain dumps: 12 synthetic ones in `tasks-scenarios.ts` (errands; study, health and admin mixed; feelings mixed in;
regular habits; big vague worries; an instruction hidden in the text; twelve things at once; nothing to do; something
already on the lists; deadlines; a health worry; a study list), each saying what a useful answer does (how many
tasks, which must or mustn't appear, lists, repeating or one-off, what's listed back, small enough, nothing invented
— checked on the model's own reply and after the app's corrections). Run them with `--action tasks` (or `all` for
both kinds); scenario names of either kind can be given with `--scenarios`.

No call is ever retried. If 3 calls in a row can't reach a provider (no connection, or no answer in time), the run
stops, since the connection is probably down. On a Mac, keep it awake during a long run: `caffeinate -i node ai-eval/eval.mjs …`.
Other options: `--repeats 3`, `--scenarios s01-energy-1,s09-clocks-go-back`,
`--stop-on-failure` (after an unsuccessful generation, call that model no more in this run), `--out <folder>`,
`--quiet`, `--report <results folder>` (writes a saved run's reports again from its `runs.json`, without calling
anything), and `--estimate`, which prints the most a run could cost from the real prompts, without calling anything:

```bash
node ai-eval/eval.mjs --estimate --models qwen3.7-plus,glm-5.3-flash,qwen3.7-flash --repeats 3
```

The estimate assumes each provider stops at the reply cap and charges its list prices, so it isn't a guarantee.

A small first trial, then the rest within the same overall ceiling:

```bash
node ai-eval/eval.mjs --live --repeats 1 --scenarios s04-good-day,s08-after-night-shift --budget-usd 0.05 \
  --total-budget-usd 0.50 --stop-on-failure --models qwen3.7-plus,glm-5.3-flash,qwen3.7-flash
```

## Unsuccessful generations

A generation only counts as usable if the provider says it finished normally (`finish_reason` "stop") and the final
answer is the complete JSON asked for. A reply cut off at the length limit (`length`, or Z.ai's
`model_context_window_exceeded`), filtered (`content_filter`, Z.ai's `sensitive`), failed on the provider's side
(`network_error`), empty (e.g. only reasoning), or JSON that stops half-way gives no suggestion, and the plan stays as
it was. The provider's error message is kept (shortened, key blanked out) to diagnose refused requests.

## What it records

Results go to `ai-eval/results/<date>-<live|mock>/` (Git ignores them):
- `summary.md` — per model: usable final proposals, how often the model's original reply broke a rule and which
  rules, expectations met (a rough automatic usefulness check per scenario) scored twice — on the original reply and
  on the proposal after the app's corrections, so the app's work isn't credited to the model —, whether using the
  suggestion changed only today's plan, explanation length (how much there is to read), latency (p50/p95), tokens
  (with reasoning tokens) and estimated cost, and every unsuccessful generation with the provider's message;
- `calls.md` — one row per call: usable or not, finish reason, the original reply's rule breaks, the app's
  corrections, latency, tokens and cost;
- `review.md` — every model's suggestion per scenario, to judge usefulness by eye (with a place for a 1–5 rating);
- `runs.json` — every run's numbers, what the app showed for it, and (from 4 Oct 2026) the model's original reply to
  these made-up scenarios, so a flag can be checked against the actual wording. No prompts, no keys.

The tone filter (`pressure-language`) flags words such as "failure" or "should" wherever they appear, so it can't
tell "rest isn't a failure" from pressure: a flag is a prompt to read the original. Results saved before the original
reply was kept show such flags as unverified.

Costs are estimated from the token usage each provider reported and the list prices in `models.json` — not billed
amounts; check your provider's console.

Mock results say nothing about any real model: they only show that the evaluation and the safety checks work.


## AI help with notes (understand & connect, part 2)

8 synthetic note collections in `connect-scenarios.ts` (`--action connect`): notes in your own words for three
projects, decoys that share a word with a project ("Coffee with Sam", a tired night shift), a note that fits two
projects, an instruction hidden in a note, a note in Arabic, tasks and questions, notes that belong nowhere, and eight
notes across six projects. Each scenario says which project every note belongs in (or none, or a list of acceptable
answers), and the notes are ones the device can't place by itself — what would really be sent (`sentAll`). Every reply
is checked by the app's own code (`app/src/ai/connect.ts`) and linked through it, in memory. The scores:
`noWrongLinks` (nothing put in a project it doesn't belong in — the one that matters most), `rightLinks`, `kinds`,
and "saved safely" (only link and AI fields change, never a note's words).

Live run, 5 Oct 2026 (`results/2026-10-05-14-20-38-live`), GLM-5.3-Flash (the model MyDay uses), 8 scenarios × 3: 22 of 24 calls
answered (2 network errors after about 10 seconds, both on the first scenario); of those 22, **no wrong links**,
every note placed right (22/22), kinds right 7/7, saved safely 22/22. US$0.0035 estimated from reported usage (plus
US$0.0024 reserved for the two calls that reported none). Synthetic notes only: real notes may be harder.

## The tutor, and Gemini for learning (AI roles, step 2)

11 synthetic questions to the Cybersecurity tutor in `tutor-scenarios.ts` (`--action tutor`): plain concept questions,
a confused learner, "explain it another way", a one-word question, an off-topic one, a target that isn't the
learner's (a neighbour's wifi), an instruction hidden in the question asking for the answer key, a real-looking
password typed in, a request for a mark, a request for links, and a long many-part question. Every reply is checked by
the app's own code (`app/src/study/cybersecurity/tutorReply.ts`: only what it accepts is shown) and scored: `usable`,
`noLinks` (it can't browse, so it mustn't invent resources), `noGrades` (an explanation, never a mark: "I can't mark
this" passes), `onLesson` (about the lesson's concepts — off-topic questions included, gently brought back), and per
scenario `talksPermission` + `noAttackSteps` (no scanning tools named), `noAnswerKey` (none of that lesson's reference
answers repeated), `notEchoed` (the password isn't repeated back) and `advisesAgainst`. These checks are narrow on
purpose; `review.md` shows every reply for a person to read. Nothing is saved, so "saved safely" shows "—".

The candidates for the learning model are in `models.json`: Gemini 3.1 Flash-Lite, 3.5 Flash-Lite and 3.8 Flash,
through Google's OpenAI-compatible endpoint (paid tier only; key in `GEMINI_API_KEY`), compared with GLM-5.3-Flash:

```bash
node ai-eval/eval.mjs --estimate --action tutor --models gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.8-flash,glm-5.3-flash
GEMINI_API_KEY=… ZAI_API_KEY=… node ai-eval/eval.mjs --live --action tutor --budget-usd 0.75 \
  --models gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.8-flash,glm-5.3-flash
```

The estimate for that (3 repeats): at most US$0.73 with every reply at its cap; real use is usually far less. In
practice mode the rule-based tutor meets 48 of 49 checks (it doesn't discuss passwords) and the deliberately sloppy
one 20 of 49 — so the checks catch a link, a mark and a repeated question.

Live run, 13 Oct 2026 (`results/2026-10-13-19-14-41-live`), 11 questions × 3, all four models, paid tier, US$0.088
estimated from reported usage: every one of the 132 replies usable, JSON output through Google's compatibility
layer confirmed. Checks met / typical (p50) and slowest-in-twenty (p95) time / words / cost per question:

| Model | Checks | p50 / p95 | Words | Per question |
|---|---|---|---|---|
| Gemini 3.1 Flash-Lite | 147/147 | 1.9 s / 2.8 s | 140 | US$0.00045 |
| Gemini 3.5 Flash-Lite | 147/147 | 1.3 s / 1.8 s | 100 | US$0.00052 |
| Gemini 3.8 Flash | 144/147 | 5.5 s / 10.1 s | 219 | US$0.0015 |
| GLM-5.3-Flash | 147/147 | 6.7 s / 9.5 s | 168 | US$0.00019 |

Gemini 3.8 Flash repeated the learner's password back once (of 3) in an example, and gave made-up addresses twice.
Read by a person: all refused the neighbour's wifi and gave no answer key; Gemini 3.1 Flash-Lite once invented a
domain name (not caught by `noLinks`, which looks for http/www). (A first attempt on 12 Oct stopped after 34 calls
when this Mac's connection dropped: `results/2026-10-12-09-49-05-live`.)

The automatic checks only catch specific failures, so every reply was then read and scored blind for accuracy,
teaching, next step and safety (`reviews/2026-10-13-tutor-quality.md`). On quality **GLM-5.3-Flash came out best**
(4.84 of 5, against 4.50 for Gemini 3.8 Flash, 4.45 for 3.1 Flash-Lite and 4.25 for 3.5 Flash-Lite, whose speed came
with thin answers): the tutor stays on GLM. Shared mistakes to fix in the tutor's instructions: NAT described as
isolation, a retrieval task's answer given away, a verdict on unseen work, no advice to change an exposed password.

Which model then answers which job is configuration on the server (`AI_ROUTES`, e.g. `{"tutor": "learn"}`, with the
learning model's `AI_LEARN_…` settings; see `../supabase/ai-secrets.example.env` and `routeFor` in
`../supabase/functions/_shared/ai/providers.ts`). If the chosen model can't answer, the other gets one try.

## Revision cards: a writer and a checker (AI roles, step 3, part B)

"More practice" on a Cybersecurity lesson: one model writes up to 10 cards on the lesson's key ideas, the other
checks each one (`../supabase/functions/_shared/ai/cards.ts`, the server's `cards` job). Three sets of scenarios in
`cards-scenarios.ts`, each run with the server's own reply caps and waits for the job (writer 6000 tokens, checker
3000):

- `--action cards`: the writers, 10 cards on each of four lessons where precision matters, with the course's own
  questions sent as "existing". Automatic checks are rough guides only (`usable`, `fullSet`, `mixed`,
  `answerIsTheMarkedOption`, `variedPositions`, `noRepeats`, `noLinks`, `noAttackTools`, `onLesson`); whether a card
  is right is judged by reading it (`review.md` lists every card).
- `--action cards-check`: the checkers on 40 cards written for the evaluation, 14 with seeded mistakes.
- `--action cards-drafts`: the checkers on the 215 cards the writers really produced, labelled sound / slip / wrong by
  a blind review (`cards-drafts.json`). Subtler than the seeded mistakes — the test that told the checkers apart.

```bash
node ai-eval/eval.mjs --estimate --action cards --repeats 2 --models glm-5.3-flash,gemini-3.8-flash,gemini-3.5-flash-lite
node ai-eval/eval.mjs --live --action cards --repeats 2 --budget-usd 0.40 --models glm-5.3-flash,gemini-3.8-flash,gemini-3.5-flash-lite
node ai-eval/eval.mjs --live --action cards-drafts --repeats 2 --budget-usd 0.25 --models glm-5.3-flash,gemini-3.8-flash
```

Live runs of 13–14 Oct 2026 (US$0.34 in all), judged on accuracy first (`reviews/2026-10-13-cards-quality.md`):
Gemini 3.8 Flash wrote 80 cards with no mistakes and no slips (GLM-5.3-Flash taught best but wrote 2 wrong cards and
9 slips in 75; Gemini 3.5 Flash-Lite was weakest). As checkers on the real drafts, Gemini 3.8 Flash caught 4 of 6
wrong cards, GLM 1 of 6 at its usual low reasoning and 3 of 6 at high (`glm-5.3-flash-high` in `models.json`).
Recommendation: Gemini 3.8 Flash writes, GLM checks at high reasoning (`AI_ROUTES={"cards": "learn"}` and
`AI_CHECKER_EXTRA_BODY` on the server).

## Cards from your notes (AI roles, step 3, part C)

"Make revision cards" on a note: an AI checks the note first (flags doubtful lines), then one model writes cards from
the lines kept and the other checks them (`../supabase/functions/_shared/ai/note-cards.ts`). Scenarios in
`note-scenarios.ts`: ten made-up learner notes, every line labelled sound / wrong / slip / dated / personal.

- `--action note-check`: the check on every note (wrong lines flagged, correct and personal lines left alone).
- `--action note-cards`: the writers, given every line (as if the check had missed everything).
- `--action note-cards-drafts`: the card checkers on the writers' real cards, labelled by a blind review
  (`note-drafts.json`).

Live runs of 14 Oct 2026 (US$0.09, `reviews/2026-10-14-note-cards-quality.md`): every model flagged every planted
mistake; writing from a note, GLM-5.3-Flash made no card from a wrong line (Gemini 3.8 Flash made two); as card
checker, Gemini caught the wrong cards and the slips best. Recommendation: Gemini checks the note, GLM writes, Gemini
checks the cards (`AI_ROUTES={"cards": "learn", "note-check": "learn"}`).

## "Check my answer" (graduated help, specs/study-home-and-lessons.md §12)

22 made-up answers to real lesson checks in `check-answer-scenarios.ts` (`--action check-answer`): 13 Arabic and 9
Cybersecurity questions, each sent exactly as the app sends it (`app/src/ai/checkAnswer.ts` with the courses' own
lesson content). Mostly realistic mix-ups and part-answers, some right, one asking about pronunciation, one with a
password the app's secret check doesn't catch, two trying to steer the AI. The automatic checks are the app's own
(`readCheckAnswer`: the parts and their lengths, no links or verdicts, for Arabic only the Arabic that was sent), the
suggested mark against the marks a careful teacher could give, the explanation's length, the password never repeated,
pronunciation never judged and steering ignored; `review.md` shows each reply part by part.

```sh
node ai-eval/eval.mjs --estimate --action check-answer --repeats 2 --models glm-5.3-flash,gemini-3.8-flash
node ai-eval/eval.mjs --live --action check-answer --repeats 2 --budget-usd 0.5 --models glm-5.3-flash,gemini-3.8-flash
```

Live runs of 24 Oct 2026 (US$0.17, `reviews/2026-10-24-check-answer-quality.md`, read blind): Gemini 3.8 Flash
kept to the Arabic it was given in every reply and said nothing false; GLM-5.3-Flash's Arabic replies were refused 6–10
times in 26 for Arabic it brought in, and it twice got هذه/هذا wrong. Both were accurate on Cybersecurity, GLM the
richer teacher. Recommendation: GLM checks Cybersecurity answers, Gemini checks Arabic ones
(`"check-answer-arabic": "learn"` in `AI_ROUTES`).
