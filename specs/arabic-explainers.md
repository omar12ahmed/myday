# Proposal: Arabic explainers ("How this works")

**Status:** decided by the owner on 30 October 2026 (§6). Built as in §2. Module 14 (ten) shipped in 1.98.0 and was
voiced in 1.102.0; module 15 (eight) and modules 4–5 (thirteen) ship with their voice in 1.105.0. Modules 6–7 (twelve)
are cross-checked and checked by the owner's checker (31 October), to be voiced. Each batch: drafted, validated, cross-checked independently (fixes re-checked), checked by the owner's
checker, voiced and listened to, then released.
**Content:** `content/teaching/arabic/explainers.json`. **Check:** `app/scripts/validate-explainers.mjs`.
**Related:** `specs/arabic-audio-course.md` (the voice), `specs/study-home-and-lessons.md` (lesson steps, course words).

## 1. What an explainer is

An explainer is a short, step-by-step explanation of one family of forms, in the style the owner chose on 30 October
2026. It is written once, checked, and then fixed. It isn't a live AI: nothing is generated while the learner reads.

Each explainer has:
- **The family as a table:** each row has the form, the Arabic and the meaning, and the app adds the transliteration.
  For a verb that means the past (he, I, they), the present (he, I, you, we), the command, the form after لَمْ (where
  the lesson teaches it), and a noun where useful.
- **Short steps** that start from the root and explain the contrast learners trip on. For example: why قُلْتُ and قُلْ
  lose the long vowel of قَالَ and يَقُولُ.
- **Two or three short sentences**, each broken down word by word.
- **The natural "why" question**, answered. For example: why add هُوَ when يَقُولُ already means "he says"?
- **A three-question self-test**, with the answers explained.

The rules follow from what went wrong in the example the owner liked:
- Standard Arabic only.
- Fully vowelled.
- Made-up names.
- No religious framing.
- No vague statements.
- Transliteration comes only from the app, so it can't contradict the vowels shown.

**The first set: ten explainers for module 14.**
- **Weak verbs:** قَالَ (say), كَانَ (be), عَاشَ (live, with خَافَ as the exception), دَعَا (invite), مَشَى (walk).
- **Irregular families:** وَقَفَ (stand, stop), رَدَّ (reply), أَخَذَ (take), سَأَلَ (ask).
- **Derived forms:** the ع-ل-م root across forms I, II and V.

They use the course's own words where they exist.

**What an explainer leaves out:** anything that answers the lesson's own check. For example, the weak-verbs check asks
for لَمْ with يَدْعُو, so the دَعَا explainer has no form after لَمْ. The principle is taught with مَشَى instead. The
check (§5) enforces this.

## 2. Where it appears

**Recommended:**
- **In the lesson's Understand step**, under the lesson's teaching, as a fold-out card titled with the explainer's own
  title (for example "Say: قَالَ and يَقُولُ"). A lesson can have more than one.
- **Folded away during the Check**, like the rest of the explanation, so check answers still come from memory.
- **From a course word to its explainer**, through a "How this verb works" link under the word in "Words in this
  lesson" and in Vocabulary's "Words from the lessons". Each explainer lists the course words it explains.
- **Nothing is saved.** The self-test shows its answers on request and records nothing, like the Warm-up: no scores
  and no saved-data change.

**Why the lesson, not only the word:** if explainers spread beyond module 14 (§6, question 1), most topics, such as
case endings or numbers, belong to a lesson rather than to one word.

## 3. Voicing

Voicing explainers goes through myday-5a's existing voice pipeline: the voice sources, the audio audit, blind
transcription and the owner's listening. It will be planned with myday-5a rather than built in parallel.

**What to voice (recommended):**
- the table's forms;
- the whole sentences;
- the Arabic inside the steps.

The word-by-word pieces aren't voiced separately, because they're heard in their sentence. Wrong self-test choices are
never voiced.

**The size:** the first set has 177 distinct Arabic pieces. Some, like قَالَ and يَقُولُ, may already have clips from the
course words. The audit will give the real number.

## 4. How it's checked

1. **The validator** (`node app/scripts/validate-explainers.mjs`) checks:
   - **The file's shape.**
   - **Vowelling.** Every Arabic piece is fully vowelled, with case and mood endings in phrases and sentences.
   - **Spelling.** The house spelling: hamzat al-waṣl, the article's alif, هَذَا without the dagger alif.
   - **No pieces run together.** No two Arabic pieces sit side by side, where they'd be voiced as one clip.
   - **The sentences.** Each sentence is exactly the words of its breakdown.
   - **No check answers.** No piece gives away the lesson check's answer or repeats its question's Arabic.

   With `--readings`, it also runs the app's own transliteration over every piece, and fails if a reading is
   incomplete. It caught 21 out of 21 kinds of deliberate mistake.
2. **An independent cross-check** by a separate reviewer covers every Arabic string, the readings and the English.
   Its fixes are applied, then re-checked.
3. **The owner's fluent checker** has the final say, in the usual checker file.
4. **Before voicing:** the usual audio audit and listening.

**When the panel is built:** the validator joins the build's preparation step, so a broken explainer stops a build. A
test will also prove that broken copies fail, as the word families do.

**Found along the way:**
- **Fixed on this branch:** the app couldn't fully read دَعَوْا and مَشَوْا (they invited, they walked).
- **Still open:** the app doesn't join the article after a vowel. It reads قُلِ الْحَقَّ as "quli al-ḥaqqa", where a
  speaker says "quli l-ḥaqqa". This affects the whole course (§6, question 4).

## 5. The file

Explainers are kept by lesson id, and each has:
- `id`;
- `title_en` and `family_en`;
- `root_ar` and `root_reading`;
- `course_words`, the ids of the course words it explains;
- `table`: one row per form, `{form_en, ar, en}`;
- `steps`: English text with Arabic pieces in it;
- `examples`: `{ar, en, words: [{ar, en}]}`;
- `why`: `{q_en, a_en}`;
- `selftest`: three questions, each `{q_en, choices, answer, why_en}`;
- `phrases_ar`: any phrase of two or more words that the English uses outside the table and the sentences.

Only Arabic is stored, never a transliteration. The file is MyDay's own; the curriculum package is untouched.

**For topics beyond verbs:** the root becomes optional, and the table can hold any set of forms.

**As the course fills:** one file loaded on demand is fine for the first batches (about 4 KB per explainer). Before it
grows to the whole course, split it by module, with a small map from course word to explainer built once, so a lesson
loads only its module's explainers.

## 6. Decisions (owner, 30 October 2026)

1. **The whole course, not just some sections.** Every lesson gets explainers, including the reading, listening,
   writing, speaking, consolidation and translation lessons.
   - **Pace:** module by module, with each batch cross-checked and then checked by the owner's checker. The next
     batches start once this first set is checked and the owner has seen it in the app.
   - **Skills lessons:** where the lesson is mostly practice, the explainer explains its technique with a worked
     example. Its shape (the root optional, perhaps the table too) is proposed with the first such batch.
2. **Where they appear:** in the lesson's Understand step as fold-out cards, folded away during the Check, and linked
   from their course words (§2).
3. **Voicing:** the table's forms, the sentences and the Arabic in the steps, once the checker has approved the text,
   planned with myday-5a. The word-by-word pieces and the wrong quiz answers aren't voiced.
4. **The article after a vowel ("quli al-ḥaqqa"):** to be fixed in the app's transliteration, separately from this
   work and planned with myday-5a, because it changes readings across the whole course.
5. **The self-test:** nothing is saved and there are no scores; the answers show on request. This is the default,
   because it needs no saved-data change.
