# Cards from your notes: which model checks the note, writes, and checks the cards (14 Oct 2026)

AI roles step 3, part C: "Make revision cards" on a note. First an AI checks the note and flags doubtful lines (left
out unless you say they're right); then one model writes cards from the lines you kept and the other checks each card.
Accuracy decides. All results are from **real API calls** (paid tiers) on made-up learner notes
(`note-scenarios.ts`: ten notes, 72 lines, every line labelled — 39 sound, 16 wrong, 4 slips, 1 dated, 12 personal, three notes
entirely correct), US$0.09 in all from reported token usage.

## 1. Checking the note (`--action note-check`, 2 runs each, `results/2026-10-14-08-55-36-live`)

| Checker | Wrong lines flagged | Correct lines left alone | Personal lines left alone | Slips / dated flagged | Typical time |
|---|---|---|---|---|---|
| **Gemini 3.8 Flash** | 32/32 | 77/78 | 24/24 | **10/10** | 2.5 s |
| GLM-5.3-Flash | 32/32 | 78/78 | 24/24 | 8/10 | 3.6 s |
| GLM-5.3-Flash, high reasoning | 32/32 | 78/78 | 24/24 | 10/10 | 4.2 s |

Every model flagged every planted mistake: like the seeded mistakes for lesson cards, these were too easy to tell the
models apart, and real notes will hold subtler ones — which is why the cards are checked again (below). The
differences are in the slips and the dated line (an allowance that can change), where Gemini caught every one, with
one false alarm. (High reasoning for GLM isn't available for this single-call job without a further setting.)

## 2. Writing cards from a note (`--action note-cards`, `results/2026-10-14-08-59-08-live`)

Each writer was given **every** line — as if the check had missed everything and you'd kept every doubtful line — so
its own care is visible. The 94 cards were judged **blind** (each note's two sets shuffled, the key opened after
scoring): per card sound, slip (teaches an overstated line), wrong (teaches a false line) or personal (made from a
reminder or preference); per set, teaching 1–5.

| Writer | Cards | Teaching a wrong line | Teaching a slip | From a personal line | Teaching | Typical time |
|---|---|---|---|---|---|---|
| **GLM-5.3-Flash** | 49 | **0** | 1 | 1 | **3.95** | 7 s |
| Gemini 3.8 Flash | 45 | 2 | 2 | 1 | 3.65 | 4 s |

The reverse of lesson cards. Writing from a note means following it faithfully and skipping what looks wrong; GLM did,
every time. Gemini twice turned a wrong line into a card ("DHCP leases are permanent unless you restart the router";
"directories get 744", marked right, with the true 755 offered as a wrong option). Both made one card from "I do
better with 20-minute sessions". Both taught "a TLS certificate proves who owns the website" (a slip the check flags).

## 3. Checking the cards (`--action note-cards-drafts`, 2 runs each, `results/2026-10-14-09-03-58-live`)

The checkers judged those 94 real cards (`note-drafts.json`; 2 wrong, and 8 that may go either way: 3 slips, 2 from
personal lines, 3 resting on the dated allowance), seeing the note with them:

| Card checker | Wrong cards dropped | Sound cards kept | Either-way cards dropped |
|---|---|---|---|
| **Gemini 3.8 Flash** | 4/4 | 164/168 | 6/16 |
| GLM-5.3-Flash, high reasoning | 4/4 | 168/168 | 2/16 |

Both dropped both wrong cards every time, even though the note itself said otherwise. Gemini also dropped the TLS
slips and the ISA slip both times; GLM only the ISA one. Gemini's four dropped sound cards were over-strict but
harmless (it judged "why do leaves look green?" and an applied `x is y` example to go beyond the note's words).

## Conclusion

**Recommendation: Gemini 3.8 Flash checks the note; GLM-5.3-Flash writes the cards; Gemini 3.8 Flash checks them.**
On the server: `AI_ROUTES={"cards": "learn", "note-check": "learn"}` — note cards stay on the main model (GLM) to
write, and the other model (Gemini) checks them. About US$0.002 per note, 10–20 s for the cards after a few seconds'
check. With every model flagging every planted mistake, the evidence that matters most is the card checks on real
drafts: two independent layers each caught every wrong card here.

Limits: made-up notes, one reviewer, 2 wrong cards among 94 — a small sample. The check is the AI's doubt, not a
verdict, and the app says so.
