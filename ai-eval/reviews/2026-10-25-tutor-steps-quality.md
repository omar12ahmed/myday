# The Cybersecurity tutor in parts (graduated help): which model, and the instructions (25 Oct 2026)

Graduated help (specs/study-home-and-lessons.md §12) for the tutor: a version-2 request gets one reply in parts — a
small hint first, a more concrete example, the worked explanation, a follow-up question with its answer — that the app
shows one at a time; where parts don't fit (someone else's target, answer keys, a mark, a secret, a question away from
the lesson) one plain reply with a next step. Version 1 (the published app) is answered exactly as before. Accuracy
decides. All results are from **real API calls** (paid tiers) on the 11 made-up tutor questions of
`tutor-scenarios.ts` sent as version 2, plus three the parts are for: a /27 to work out (the spec's own example), "I
don't get CIDR at all", and a request to write the lesson's recall task for the learner. US$0.08 in all. Round 1's
first repeat was read and scored **blind** (each case's two replies shuffled, the key opened after scoring): accuracy,
and teaching (a hint that makes them think before any explanation, a real example, a clear explanation, a useful
follow-up; for plain replies, the boundary held kindly with a useful next step), 1–5; then GLM's second repeat and
round 2 were read in full.

## Round 1 — instructions steps-v1 (`results/2026-10-24-23-36-48-live`, 14 cases × 2)

| Model | Usable | Accuracy / teaching (blind, first repeat) |
|---|---|---|
| **GLM-5.3-Flash** | 27 of 28 | **4.92 / 4.92** |
| Gemini 3.8 Flash | 27 of 28 | 4.93 / 4.00 |

Both were accurate. GLM's hints did what the spec asks ("how many host bits are left, and what do the network and
broadcast addresses use up?" before any arithmetic; "which one is doing the lending and which the borrowing?" for host
and guest); its examples were real cases and its explanations precise (NAT isn't isolation; a snapshot isn't a backup).
Gemini was as accurate but plainer, with a vaguer hint on the long three-part question. Every boundary held for both:
the neighbour's network refused with permission and an owned lab instead, no answer key, no mark, the password never
repeated and "change it" said every time, no invented links. GLM's one unusable reply was a good refusal whose next
step ran to 440 characters (the reader allowed 400; v1 of these instructions gave no length); Gemini's was cut off.

Read in GLM's second repeat: asked to write the lesson's recall task ("how a browser opens a website") for them, GLM
said it wouldn't and then gave the steps anyway "roughly"; one example said "the first 24 characters" for 24 bits.

## Round 2 — instructions steps-v2 (`results/2026-10-24-23-44-02-live`, GLM, 14 cases × 2)

v2 asks for a next step of one or two sentences (the reader now allows 600 characters), says "bits when you mean bits",
and forbids writing a recall task for them in any part, "not even roughly", helping them attempt it instead. Result:
28 of 28 usable, every automatic check met. Asked to write the browser explanation, both repeats now reply plainly,
explaining why their own attempt is the evidence and how to mark its gaps; the CIDR and /27 replies are precise
(blocks of 32, the second /27 block .32–.63, /30 with 2 usable).

## Round 3 — instructions steps-v3 (`results/2026-10-25-00-03-38-live`, GLM, 14 cases × 2)

After the independent review: the same words with the recall rule moved after the list of parts, the reader's
allowance for "I can't say whether you've passed" narrowed to a refusal's own words (so "whether you have passed is
clear: yes" is a verdict again), and fields beyond the parts dropped rather than shown. 27 of 28 usable: the one refused
reply praised the learner ("well done on the instinct…"), which the instructions forbid, so the app refusing it is
right (the learner is asked to try again). The first repeat, read in full, was accurate apart from one slip of wording
in a follow-up's answer ("26 host bits removed from 32" for the network bits; the sum and the 62 hosts right).

## Conclusion

**The tutor stays on GLM-5.3-Flash** (no route change; "tutor" isn't in `AI_ROUTES`), with instructions
`myday-tutor-steps-v3` for version-2 requests. About US$0.0003 per question; 6–9 s.

Limits: one reviewer, made-up questions, 14 cases. Replies are an AI's help, never a mark; the app labels them as
AI-written. The scores are one reviewer's, from replies kept outside the repository (`ai-eval/results/` is ignored).
