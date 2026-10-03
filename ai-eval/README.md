# Evaluating "Help me adjust today"

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
