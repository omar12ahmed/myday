# "Explain it another way": which model explains (16 Oct 2026)

AI roles step 4: on any revision question once its answer is shown, a tap asks for a new explanation from a different
angle, aimed at the learner's own answer. Accuracy decides. All results are from **real API calls** (paid tiers) on
made-up revision moments (`explain-scenarios.ts`: real questions from the Cybersecurity and Arabic courses and typical
concepts of your own, each with a realistic wrong or partial answer, one right answer, one answer trying to steer the
AI). US$0.044 in all. Every reply was read and scored **blind** (each case's replies shuffled, the key opened after
scoring): accuracy and teaching (a genuinely new angle that clears up the mix-up), 1–5.

## Round 1 — instructions v1 (`results/2026-10-16-14-05-29-live`, 12 cases × 2)

| Model | Accuracy | Teaching | Replies with something false |
|---|---|---|---|
| GLM-5.3-Flash | 4.58 | **4.54** | 1 of 24 (Arabic) |
| Gemini 3.8 Flash | 4.48 | 4.21 | 2 of 24 (Arabic) |

Cybersecurity and concepts went well for both: everyday comparisons (a phone's contacts and the phone network for DNS
and IP; a house number for a port), the learner's mix-up named kindly, the steering answer refused or ignored by every
reply. One GLM reply stopped mid-sentence; one used a made-up memory trick.

The Arabic word card went badly: three of four explanations of بَاب ("door") said something false. Gemini twice
described بَاب's outer letters as tall "doorposts" (ب sits low; the only tall letter is the alif), once adding that
"book" starts with the same letter (كِتَاب starts with ك); GLM said the two words "differ by one extra ك". The
pronoun and letter-name cases were fine.

## Round 2 — instructions v2 (`results/2026-10-16-14-11-25-live`, 6 Arabic cases + 2 others × 2)

v2 forbids describing letter shapes or building memory tricks from them, forbids bringing in other Arabic words, and
asks for every sentence to be finished.

| Model | Arabic: replies with something false | Arabic: accuracy / teaching | Others: accuracy / teaching |
|---|---|---|---|
| **Gemini 3.8 Flash** | **0 of 12** | **4.96** / 4.13 | 4.75 / 4.50 |
| GLM-5.3-Flash | 2 of 12 | 4.54 / 4.58 | 4.88 / 4.63 |

Gemini kept to the rules: no other Arabic, no letter pictures, accurate — though plainer. GLM still brought in other
Arabic words in 4 of 12 replies (all correct: أَنْتَ, فِي, الْيَوْمَ, غَدًا) and made two errors: "book" described as
بَاب "with an extra letter at the start" sharing a "baa-alif" ending (it's alif-bāʾ), and the doer meaning of طَالِب
credited to its double-vowel ending rather than its pattern.

## Conclusion

**Recommendation: GLM-5.3-Flash explains Cybersecurity and your own concepts; Gemini 3.8 Flash explains Arabic.**
Explaining an Arabic card is its own job on the server (`explain-arabic`), so this is configuration:
`AI_ROUTES={"cards": "learn", "note-check": "learn", "explain-arabic": "learn"}` ("explain" stays on GLM). About
US$0.0002 per explanation with GLM, US$0.001 with Gemini; 4–5 s.

Limits: one reviewer, made-up cases, 24 Arabic replies — and "explain it another way" is an AI's explanation, never a
mark: the app says so, and a kept explanation stays labelled AI-written.
