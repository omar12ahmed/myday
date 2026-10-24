# "Check my answer": which model checks (24 Oct 2026)

Graduated AI help (specs/study-home-and-lessons.md §12): once you've written your own answer to a lesson check, one
request returns a hint, an example, the worked explanation and a follow-up question with its answer, which the app shows
one at a time, plus the part of the lesson it drew on and a suggested mark you accept or change. Accuracy decides. All
results are from **real API calls** (paid tiers) on made-up answers to real checks (`check-answer-scenarios.ts`: 13
Arabic and 9 Cybersecurity questions with the courses' own objectives, teaching and reference answers, sent exactly as
the app sends them; mostly realistic mix-ups and part-answers, some right, one asking whether their pronunciation was
right, one with a password the app's secret check doesn't catch, two trying to steer the AI). US$0.17 in all. Replies
were read and scored **blind** (each case's replies shuffled, the key opened after scoring): accuracy, and teaching (a
hint that doesn't give the answer away, a real example, an explanation that clears up the mix-up, a useful follow-up),
1–5.

## Round 1 — instructions v1 (`results/2026-10-24-20-37-02-live`, 22 cases × 2)

Read in full: the first repeat of every case, and the second repeat's Arabic replies. (*Counted with the final reply
check, below; with v1's it was 12.)

| Model | Arabic: replies the app refused | Arabic: accuracy / teaching | Cybersecurity: accuracy / teaching | Something false |
|---|---|---|---|---|
| **Gemini 3.8 Flash** | **0 of 26** | **5.00** / 4.15 | 4.88 / 4.13 | **0** |
| GLM-5.3-Flash | 10 of 26* | 4.86 / 4.86 | 4.78 / 4.78 | 1 (Arabic) |

GLM kept bringing in Arabic that wasn't in what was sent (زُرْتُ, بَيْتٌ, مدارس, أَنْتِ طَالِبَةٌ) or adding vowel marks
to the lesson's bare words — and two of those were wrong: قَرَأْتَ ("you read") and قرأَتْ ("she read") for the
sentence's "I read". The app refuses any such reply, so the learner would have seen "couldn't be used" nearly four times
in ten. Its one false statement got through: "هذه كتاب جديد stays هذه كتاب جديد" (it must become هذا). Gemini kept to the
words given and said nothing false in the 34 replies read.

Three refusals were the reply check being too strict, so it changed before round 2 (`check-answer-shape.ts`): "score of"
was a lesson's own phrase ("not a score of technical competence"), so only verdicts about the learner count now ("your
score is", "score: 7", "you scored 8/10"); one model wrote the mark null as the word "null"; and a suffix shown with
tatweel (ـكَ, the stretching line) was refused. After the independent review the Arabic rule was tightened further:
only whole words as sent count (as written, with no vowel marks at all, or without the article; written bare, a word
can't carry a wrong vowel), plus one of Arabic's own letters on its own and a sent word's beginning or end drawn with
the stretching line (فَسَـ, ـكِ); presentation forms are folded to ordinary letters first, and invisible joiners can't
hide another word. Every reply in both rounds was scored again with that final check: the figures here are with it,
and Gemini's are unchanged.

## Round 2 — instructions v2 (`results/2026-10-24-20-50-57-live`, 22 cases × 2)

v2 asks for an example that is a real sentence, case or situation, never a restatement of the question (Gemini's example
for the "school sentence" case had just restated the task), and, when a question is about particular words, to say
plainly what each one means. Read in full: the first repeat of every case, and Gemini's second-repeat Arabic replies.

| Model | Arabic: replies the app refused | Arabic: accuracy / teaching | Cybersecurity: accuracy / teaching | Something false |
|---|---|---|---|---|
| **Gemini 3.8 Flash** | **0 of 26** | **5.00** / 4.15 | 4.89 / 3.89 | **0** |
| GLM-5.3-Flash | 9 of 26 | 4.73 / 4.82 | 5.00 / 4.89 | 1 (Arabic) |

GLM made the same هذه/هذا slip again ("هذه agrees with a masculine noun like كتاب, so هذا is used"). Gemini's examples
are now examples; on ربما and بالتأكيد it still never says which means "maybe" and which "certainly" (true, but vague —
in both rounds). Its Cybersecurity replies are accurate but plainer than GLM's, and once suggested redacting "a
fictional analyst's real email address".

Both rounds, both models: every Cybersecurity reply usable bar one (Gemini put a refusal before the JSON for the steering
answer; the app refuses that, which is fine there); the password was never repeated and every reply said to change it;
the steering answers were declined or ignored, with no scanning commands; pronunciation was never judged ("compare with
a recording or a fluent speaker"). Suggested marks matched what a careful teacher would give in 86 of 87 usable Gemini
replies and 67 of 69 GLM ones; the misses are the right-but-brief NAT answer marked "partly", defensible.

## Conclusion

**Recommendation: GLM-5.3-Flash checks Cybersecurity answers; Gemini 3.8 Flash checks Arabic answers** — the same split
as "Explain it another way". Checking an Arabic answer is its own job on the server (`check-answer-arabic`), so this is
configuration: add `"check-answer-arabic": "learn"` to `AI_ROUTES` ("check-answer" stays on GLM). About US$0.0003 per
check with GLM, US$0.0016 with Gemini; 4–6 s.

Limits: one reviewer, made-up answers, 52 Arabic replies read. The reply is an AI's help, never a mark: the suggested
mark is only a suggestion the learner accepts or changes, it never sets a lesson's state, and the app labels it as
AI-written. The app's Arabic check means an AI can only use whole Arabic words it was given (or those words bare, or
without the article), Arabic's letters on their own, and a given word's beginning or end drawn as such; the English
around it is the model's own, and that is where GLM's slip was. The accuracy and teaching scores are one reviewer's,
from replies kept outside the repository (`ai-eval/results/` is ignored).
