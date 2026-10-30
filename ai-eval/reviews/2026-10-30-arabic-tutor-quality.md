# A live Arabic tutor that may bring in new Arabic (option 2): Gemini alone, Gemini with a Gemini checker, or not yet (30 Oct 2026)

The question: can a live AI tutor answer a learner's "why" questions about a Fuṣḥā lesson (the forms of a root, why a
pronoun is optional, how a command is made, two look-alike forms, what a particle does) with Arabic of its own beyond
the lesson's words, safely enough to ship? The alternative (option 1) is pre-written explainers checked before release.
Accuracy decides; the target was **no false statement left after checking**. All results are from **real API calls**:
Gemini 3.8 Flash as tutor (temperature 1.0, reasoning "low", up to 4,000 tokens) and as checker, on the 24 questions of
`arabic-tutor-scenarios.ts`, three repeats each. Each question is grounded in a real lesson (title, objectives, key
concepts, teaching explanation and example, course words; never its checks, practice or solution), and none is worded
with its lesson's own check words. The tutor writes no transliteration: MyDay adds it from the vowels
(`app/src/study/arabic/transliterate.ts`), so its Arabic has to be fully vowelled. US$0.55 in all (of US$1.50 allowed).

**The reference.** Every usable draft was read **blind** by a Fable reviewer (model and checker hidden): each error with
its place, fix and severity (wrong: a learner acting on it gets wrong Arabic; minor: notation, loose wording, a "never"
with rare exceptions), a teaching score of 1–5, and whether it gives away a lesson check's answer before the learner
meets it. I then read the reviewer's findings against the drafts. The v2 reviewer's instructions named the hollow-verb
rule as something to look for, so its severities ran higher; the "one scale" counts below are mine, counting the same
kinds of error as serious in both runs.

## Run 1 — instructions v1 (`results/2026-10-30-21-33-21-arabic-tutor-live`, 24 questions × 3)

71 of 72 replies usable (one malformed JSON). The Arabic itself is reliable: 2,665 Arabic pieces, no colloquial words, no
religious framing, written transliteration in only 3 replies (always a grammar term next to its Arabic, such as "wāw").
Of the 24 pieces MyDay couldn't fully transliterate, 17 are endings shown on their own (ـُونَ, ـِينَ), which is right;
4 are a joining hamza at the start of a phrase written bare (اشْتَرَيْتُهَا for اِشْتَرَيْتُهَا, اسْمُ); 3 are
transliteration gaps (see "Found on the way"). Teaching was good (mean 4.0): short steps, a root table, sentences word by
word, a reason, a self-test and a follow-up.

The explanations are where it goes wrong. **19 errors in 18 of 71 replies (25%).** On one scale, 6 are serious, in 6
replies (8%), all on two topics:

- **An invented form.** For "How are دَرَسَ and دَرَّسَ different?", 2 of 3 replies add a Form V row تَدَرَّسَ, "he
  studied carefully", which standard dictionaries don't list. A learner would use it.
- **An over-general rule for hollow verbs.** Asked why كَانَ becomes كُنْتُ, or why عَاشَ becomes عِشْتُ, 4 of 6
  replies say the short vowel comes from the root letter (و gives ḍamma, ي gives kasra). Common verbs break it: خَافَ
  and نَامَ have و and give خِفْتُ and نِمْتُ. The true rule follows the present tense (يَقُولُ → قُلْتُ, يَبِيعُ →
  بِعْتُ, يَخَافُ → خِفْتُ). One reply then asks the learner to apply its rule to خَافَ.

The 13 minor ones: the ending written وُا (ḍamma on the wāw), the silent alif written أ, لَمْ called a prefix, "with
الـ" where the condition is definiteness, a missing kasra on a joining hamza, a loose gloss (مِنَ "to / from").

## The checker (Gemini 3.8 Flash, a second call per draft)

The checker sees the question and the draft and reports only Arabic and claims about Arabic.

| | Drafts | Reference errors caught | Serious ones caught | Real problems the reference missed | False alarms |
|---|---|---|---|---|---|
| checker v1 on run 1 (`…-21-37-05-arabic-tutor-check-live`) | 71 | 4 of 19 | 0 of 6 | 6 | 0 |
| checker v2 on run 1 (`…-21-48-32-arabic-tutor-check-v2-live`) | 70 (1 network failure) | 7 of 19 | 0 of 6 | 7 | 2 |
| checker v2 on run 2 (`…-21-52-54-arabic-tutor-check-v2-live`) | 23 | 3 of 11 | 1 of 6 | 0 | 0 |

It is good at what it can see in the letters: the ـُوا ending, a sukūn on a long-vowel letter (بِيْعَ ×3, missed by the
reference), مَفْعَلٌ given as the pattern of مَدْرَسَةٌ (also missed by the reference), "every verb has three root
letters", لَمْ called a prefix. It almost never catches an explanation that is wrong in substance: it passed the
invented تَدَرَّسَ every time, and the root-letter rule for hollow verbs every time, even with v2's instruction to look
for a common counterexample to every rule. Its one serious catch was a reply that called the -tu ending "a suffix
starting with a vowel". The false alarms: a deliberate blank in a self-test flagged as a missing vowel, and فَـ called a
prefix (which is reasonable for a letter written on the word).

## Run 2 — instructions v2 (`results/2026-10-30-21-52-01-arabic-tutor-v2-live`, 8 questions × 3)

v2 adds: think of a common counterexample before stating a rule, never invite the learner to apply a rule to its
exception; only forms certainly in common use, no rows to complete a pattern; label grammar plainly; write endings as
Arabic writes them; and the lesson's check questions, to steer clear of. It was run on the 8 questions with the serious
errors, the endings and pattern slips, and the most giveaways. 23 of 24 usable (one malformed JSON); no
written transliteration; no check phrase the lesson doesn't already teach.

| Same 8 questions | Replies | Errors | Serious (one scale) | Replies with a serious error | Gives a check away | Teaching |
|---|---|---|---|---|---|---|
| v1 | 24 | 10 | 6 | 6 | 14 | 3.96 |
| v2 | 23 | 11 | 6 | 5 | 5 | 3.96 |

**No gain in accuracy.** The root-letter rule is still in 4 of the 6 hollow-verb replies, the invented تَدَرَّسَ in 1 of
3, a new slip says the -tu ending starts with a vowel, and two replies say ـُونَ is "never" used for things (it is, in a
few words such as سِنُونَ and the tens). What v2 did fix is the giveaways (14 → 5), the labels and endings notation, and
the stray transliteration. Since it didn't change accuracy, I didn't run v2 on the other 16 questions.

## What a reply costs

Measured, per learner question (Gemini 3.8 Flash at US$0.75 in / US$3.75 out per million tokens):

| | Calls | Time (p50 / p90) | Tokens in / out | Cost |
|---|---|---|---|---|
| Gemini alone | 1 | 7.4–8.2 s / 9.4–10.1 s | 920–1,280 / about 750 | US$0.0036–0.0037 |
| Gemini + Gemini checker | 2 | 9–11 s / 13–16 s | adds 1,130–1,280 / 30–120 | US$0.0046–0.0052 |

About US$5 per thousand questions with the checker. 2 of 96 tutor replies were malformed JSON and would need a retry; 1
of 165 checker calls failed on the network.

## Conclusion

**Not yet.** Gemini's Arabic is reliable letter by letter, but a quarter of its explanations contain an error and about
1 in 12 a serious one: a rule that gives wrong forms for common verbs, or a form it made up. The Gemini checker is cheap
and rarely raises a false alarm, but it catches between a fifth and a third of the errors and 1 of the 12 serious ones
across both runs, so **Gemini + Gemini checker doesn't meet the target**, and better instructions didn't move it. Neither
configuration should go to learners as a free-form tutor that brings in new Arabic.

For the explainers session (option 1): the serious errors cluster on hollow verbs and derived forms. Those topics most
need checked written explainers, and those explainers should state the present-tense rule for كُنْتُ / قُلْتُ / خِفْتُ
and list only attested derived forms of a root.

If a live tutor is reconsidered later, the shape most likely to pass, to be tested with this harness before any decision
(about US$0.35 a round of 24 × 3 with the checker):

- it explains with the rule from the lesson's checked explainer rather than its own, and uses only words the learner has
  met or a verified list in tables;
- the checker is kept as a pass for spelling, endings and labels, not as the safety net for claims;
- anything MyDay can't fully transliterate is shown without transliteration, or the reply is refused.

## Found on the way

`transliterate()` handles the article's joining hamza but not a verb's or noun's. بِٱلنَّجَاحِ comes out "[bilnnajāḥi]";
اشْتَرَيْتُهَا, correctly bare inside a phrase (الَّتِي اشْتَرَيْتُهَا), comes out "[āshtaraytuhā]"; with ٱ it is dropped
("[shtaraytuhā]"). All are marked incomplete, so nothing wrong is shown as certain. Reported to the explainers session,
which owns the fix.

Limits: one AI reviewer plus my reading, made-up questions, 24 lessons, Gemini only (no GLM comparison, by the owner's
choice). The replies, the reference's findings and the side-by-side readings are kept outside the repository
(`ai-eval/results/` is ignored).
