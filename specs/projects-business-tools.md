# Projects: experiments and money for a business idea (Phase 3, Business)

**Status:** the owner's decisions in §2 (30 October 2026); being built on branch `business-experiments`. Nothing live
without the owner's yes. No schema, migration or server change.
**Based on:** source at 1.94.0. Plan: `specs/projects-vision.md` §10 "Business" (extend the one page with Research and
Experiment tools: the assumption tested, the proposed test, the expected observation, the actual result, supporting
sources, the conclusion and next decision; completing an investigation task must not validate an assumption; optional
financial planning with structured inputs, currency, period and recorded assumptions; forecasts and actual
transactions distinguishable; business money never touches personal Finance), §17 (Phase 3). Builds on
`specs/projects-research.md`.

## 1. The practical problem

A business idea's one page lists what must be true ("Shops would pay to be listed") and a Find out task checks one.
But a real test (ask 20 shops, run a week of deliveries) has a plan, a result that would change your mind, and what
actually happened — none of which has a place. And the money is guesswork in a note: what one order leaves you, how
many a month cover the running costs, how deep the hole goes before it turns, and how the real months compare.

## 2. The owner's decisions (30 October 2026)

1. **Experiments, on business ideas and in Research:** on a business idea, each thing that must be true can have
   experiments; any project with Research on can also run one against a research question. The same records either
   way.
2. **A result is offered as a finding:** once an experiment has its result, one tap saves it as a Research finding
   that supports, contradicts or relates to what it tested, with the experiment as its source. Marking the thing
   "looks true" or "doesn't hold" stays yours; MyDay never decides.
3. **Money: both** a break-even from a few numbers and a 12-month forecast built from the same numbers.
4. **Real months too:** beside the plan, what actually came in and went out each month, kept clearly apart from the
   plan. Never connected to personal Finance.

## 3. What you see

### Experiments

- **Plan an experiment** (on the Model tab under "What must be true", and on the Research tab): what you'll try
  ("Ask 20 shops on Waheen Road if they'd pay $5 a month"), what it tests (things that must be true; on a project
  with Research, its questions too), how you'll run it, and **what result would change your mind** ("Fewer than 5 say
  yes"). Only the first is needed.
- Each experiment is **Planned**, **Running** (since a day) or **Done** (on a day). **Start it** marks it running;
  **Record what happened** asks for the result and what you conclude and will do next, and marks it done.
- **Add a task to run it** adds "Test: …" (30 minutes, no date) to the project's tasks, as Find out does; your next
  step stays as it is. Ticking the task records nothing by itself: Worth a look and Needs you then ask
  "“Test: …” is done — what happened?".
- Once done: **Save it as a finding?** — choose for each thing it tested whether the result supports, contradicts or
  relates to it; one tap saves a finding (the result's words, the day it was done, "From the experiment …" as its
  source) and switches Research on if it was off. Offered while that finding isn't there.
- Under each thing that must be true: "1 experiment running · 1 done", which goes to them.
- Removing a thing that must be true or a question takes it out of the experiments that tested it; removing an
  experiment leaves its task and its finding (the finding says where it came from no longer).

### Money (a business idea's Money tab)

- **Your numbers:** the currency (USD, GBP, EUR, SOS, ETB, KES, AED… or your own), what one sale is called ("order"),
  its average value, and three short lists, each line with its amount and **where it's from** (a guess · a quote ·
  measured) and an optional note:
  - **Each sale:** money in and out per sale, as an amount or a percentage of the average sale ("Commission 8%",
    "Delivery fee 1.50", "Rider −1.80", "Card fees −1%");
  - **Each month:** running costs (and any monthly income);
  - **To start:** one-off costs (and any one-off money in).
- **Break-even**, worked out as you type: "Each order leaves 1.80"; "Break-even: 500 orders a month"; "At [700] a
  month, start-up costs are back in about 9 months". When a sale loses money: "Each order loses 0.20 — no number of
  orders breaks even". When there's nothing yet: what's missing, in words.
- **12-month forecast:** a first month and the sales you expect each month ("Fill: start at 100, add 20% a month",
  then any month changed by hand). For each month: money in, money out and the running total, starting below zero by
  the start-up costs. Under it: "Lowest point: −4,170 in Feb 2027" and "Covers itself from Jul 2027" (or "Not within
  these 12 months").
- **Real months:** "Add a real month" — the month, the real sales, money in and money out (totals), a note. Shown
  beside that month's plan ("Plan 1,365 in · Real 1,100 in"), always labelled Plan or Real, never mixed into the
  plan's own figures.
- **At a glance** on a business idea gains a Money row: "Break-even: 500 orders a month" (or "Add your numbers").
- Words and plain numbers: no scores, no "success chance", no advice about whether the idea will work.

## 4. How it works

- **Experiments** are Research items of a new type, `experiment` (`specs/projects-research.md` §4): `{ id, type:
  'experiment', projectId, title, tests: [{ kind: 'assumption' | 'question', id }], how, expect, status: 'planned' |
  'running' | 'done', startedOn, doneOn, result, conclusion, taskId, findingId?, createdAt, updatedAt }`. They sync as
  `research` records (no migration); deleting the project deletes them. A finding saved from one carries
  `experimentId`. Limits: 100 experiments a project, 5 things tested each; texts as Research's.
- **Money** is an optional `money` field inside the business idea's one page (`project.model`), synced in the
  project's model record: `{ currency, sale, saleValue, perSale, monthly, startup, atSales, forecast: { from, sales },
  actual: [{ month, sales, in, out, note }] }`, each list line `{ id, label, dir: 'in' | 'out', amount, per: 'fixed' |
  'percent', basis: 'guess' | 'quote' | 'measured', note }`. Limits: 12 lines a sale, 20 a month, 20 to start, 12
  forecast months, 60 real months; amounts are finite numbers up to 1,000,000,000 (percentages 0–100). The sums are
  worked out each time from these, never saved.
- **Schema stays 5** (the AGENTS.md exception): the previous release keeps unknown Research types (kept as they are),
  unknown fields inside the one page (its reader spreads them) and unknown fields on a finding — proven against the
  actual previous release; it shows neither experiments nor Money. Changing the project's kind keeps both, out of sight.
- **Never sent to AI** (like Research and the Case's records): Ask MyDay's one-page context names its fields, so
  neither reaches it; `ai/reach.ts` lists both.
- **Search this project** (and so Search everywhere) finds experiments (what, how, expected, result, conclusion) and
  money lines (label, note).
- A sync conflict names an experiment ("Experiment: … · Running") and a one page's money ("Money: break-even 500
  orders a month · forecast from Jan 2027 · 3 real months").

## 5. Checks

Rules (reading both fields with a newer MyDay's extras kept; the experiment's steps and the finding offer; removal
cascades; every break-even case, payback, percentages, the forecast's running total, lowest point and turn, the fill
helper; real months kept apart); browser checks on the Model, Research and Money tabs, At a glance, Worth a look and
phone layout; the previous release keeps both; privacy planted secrets; Taste-skill look at the Money tab.
