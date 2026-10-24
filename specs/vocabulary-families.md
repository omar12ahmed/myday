# Build spec: word families on the Arabic vocabulary page

**Status:** built in 1.38.0 (see `app/README.md`, release 51). Below is the spec as decided, revised after Claude's review (17 October 2026), with corrections and additions folded in.
**Date:** 17 October 2026
**Related:** the Arabic audio proposal (kept on the owner's Mac, not in this repository; play buttons land only if that proposal is accepted)
**Mockup:** [`vocabulary-families-mockup.html`](vocabulary-families-mockup.html), beside this file — reviewed 17 October 2026. Note: its "Full list" table is not the real page (see §4).

---

## 1. What this is

A second lens on the existing 48-word starter lexicon: show which words share an Arabic root, so learners see the language's core organising principle instead of a flat list. Four real families exist in the current lexicon — ك-ت-ب (5 words), د-ر-س (3), ق-ر-أ (2), ط-ل-ب (2) — covering 12 of 48 words. Checked against all 48 words on 17 October 2026: these four are right and no other family is missed.

The other 36 fall into two different groups, and the page should say so honestly:
- **14 words whose relatives just aren't in the list:** بَيْت, بَاب, كَبِير, صَغِير, جَدِيد, صَبَاح, مَسَاء, أَمْسِ, غَدًا, الْيَوْم, أُرِيدُ, سُؤَال, فِكْرَة, مَعْنَى.
- **22 small words that aren't built from roots the way nouns and verbs are:** pronouns, prepositions, question words, هَلْ, connectors and set phrases (شُكْرًا, مِنْ فَضْلِكَ/كِ, عِنْدِي).

**Non-goals:** no stemming or NLP at runtime or authoring time; no new progress records; no change to revision, streaks, scheduling or the saved-data format; no automatically derived families, ever — membership is authored and checked like the readings.

## 2. Data model

**Not in `app/src/study/arabic/data/texts.json`.** That file is generated: `prepare-arabic.mjs` deletes the folder and rewrites it from the curriculum package (`content/arabic-fusha/MyDay_Arabic_Starter_Materials.json`, `lexicon_seed`) before every build, so fields added there would vanish. The package's own schema also doesn't allow new fields on a word.

Instead, a separate authored file beside the pronunciation data — e.g. `content/teaching/arabic/word-families.json` — which the prepare step validates and passes to the app. The curriculum package and its version stay untouched. Words are referred to by their **fixed id**, not their spelling (spellings get corrected, as the 1.1.1 vowel fix showed):

```jsonc
{
  "families": [
    {
      "id": "ktb",
      "root_ar": "ك-ت-ب",
      "root_reading": "k-t-b",            // in the app's reading scheme (k-t-b, d-r-s, q-r-ʾ, ṭ-l-b); hidden with the reading toggle
      "theme_en": "writing",
      "members": ["lexeme.arabic-seed-009", "lexeme.arabic-seed-010", "lexeme.arabic-seed-036", "lexeme.arabic-seed-037", "lexeme.arabic-seed-012"],
      "pair": ["lexeme.arabic-seed-036", "lexeme.arabic-seed-037"],   // the ⇄ badge: past/present or a gender pair
      "pattern_en": "مَكْتَبَة = مَـ “place of” + ك-ت-ب “writing”. The same pattern as مَدْرَسَة.",
      "word_notes": { "lexeme.arabic-seed-009": "From the root ك-ت-ب, “writing”. A kitāb is the thing written." },
      "also_in_examples": [ { "form_ar": "مَكْتَب", "meaning_en": "desk", "note_en": "“Place of writing” — the same مَـ pattern, in عَلَى الْمَكْتَبِ." } ]  // optional
    }
  ]
}
```

The other families' members: د-ر-س → 038, 039, 011 (pair 038/039); ق-ر-أ → 034, 035 (pair); ط-ل-ب → 013, 014 (the gender pair).

- One family per word (a display rule, not a linguistic claim). A word in no family stands alone.
- The full copy for all four families exists in the mockup; transcribing it is mechanical, with the wording fixes in §4.

## 3. Build-time validation (beside `validate-pronunciation.mjs`)

Fail the build when:

1. A member id isn't a word in the lexicon, or a word appears in two families, or a family lists a member twice.
2. A member doesn't contain its root's letters in order (vowel marks removed, hamza forms أ إ ؤ ئ ء treated as one) — catches a word put in the wrong family.
3. A `pair` isn't two members of the same family.
4. A `word_notes` key isn't a member.
5. An `also_in_examples` form doesn't appear in a starter example sentence or text.
6. Every Arabic run in `pattern_en`, `word_notes` and `also_in_examples` passes the existing transliteration completeness check.
7. Coverage: family members + standing-alone words = all 48. A new word in the lexicon forces a choice — give it a family or leave it standing alone on purpose. Families grow by audit, not by accident.

## 4. UI (Arabic vocabulary page only)

**Today's page is a list, not a table.** Each word shows its example sentence and its own revision buttons ("Add to revision", "Also practise writing it", "Take it out", and how it's going), under "Add the next … words to revision". Those must stay one tap away.

**Recommended: one view, no toggle.**
- A **"Word families"** card above the list: the insight line, the four family cards (ك-ت-ب full width as the richest), pattern notes, and the two groups from §1 ("Their relatives aren't in this list yet" · "Small words — not built from roots").
- Tapping a family word shows its note (Arabic, reading, meaning) and can jump to it in the list below, where its revision buttons are. A second tap closes it. Nothing is saved.
- Each word in the list gets a small family badge (e.g. "ك-ت-ب family"), or nothing.
- No new device key, less to build and test.

*Alternative (if you prefer the mockup's toggle):* "Full list" stays the default and is the real list above (not a new table); the family view's word panel must carry the word's revision state and buttons; the choice is remembered in `myday.arabic.vocabView` (device only, never synced; read and written safely).

**Wording fixes to the mockup's copy:**
- "Standing alone — for now" → two groups as in §1, and drop "this section will shrink" (the 48 starter words are a fixed set; new words come from lessons, which aren't part of this list).
- "Root stays, vowels move" → "the root stays; the vowels change, and the present adds يَـ".
- Root readings in the app's scheme ("k-t-b", not "K-T-B"), hidden with Show / Hide transliteration like every other reading.

**Accessibility:** word chips are real buttons (44 px or more, keyboard), the word panel is announced (a polite live region), Arabic is shown through the existing `Ar` component (right to left, Noto Naskh), and roots are kept in their own right-to-left span so the hyphens don't reorder.

**Edge case:** if a future lexicon has no families, the card isn't shown.

## 5. Tests

**Rule tests** (`arabic-families.test.js`, or in `arabic-pronunciation-rules.test.js`):
- Every validation rule in §3, each with a bad example that must fail.
- Spot checks: ك-ت-ب has exactly 5 members; ط-ل-ب is the gender pair; no pronoun, preposition, particle or connector is in a family; 12 in families, 14 + 22 standing alone.

**Browser tests** (`app-families.test.js`, modelled on `app-pronunciation.test.js`):
- The card shows 4 families and 12 family words; the two standing-alone groups show 14 and 22.
- Tapping a word opens its note with the right Arabic, reading and meaning (no answer content) and closes on a second tap; "jump to it" reaches the word in the list.
- Every word's revision buttons still work as before (add, also writing, take out).
- Show / Hide transliteration hides every reading in the families card, root readings included, while the Arabic remains.
- Looking, tapping and jumping leave `myday.data.v4` byte-identical.
- 390 px phone width: no sideways scrolling; buttons 44 px or more.
- `app-pronunciation.test.js`'s counts on the vocabulary list (96 readings) are unchanged — scope its selectors to the list if the card adds readings of its own.

## 6. Phasing

| Phase | Content | Depends on |
|---|---|---|
| **1** | The families file, validation, the card, the badges, tests | nothing |
| **2** | Play buttons in the word note, labelled "Synthesised voice" | the audio proposal accepted and its clips checked and shipped |

Both after release 1.27.0 (released; the live release is now 1.37.0).

## 7. Guardrails (carried from the app's existing contracts)

- Reading and tapping write nothing: no streaks, no session records, no mastery signals.
- Family membership is display information; revision questions and answer keys are untouched.
- The curriculum package isn't edited; the families file is MyDay's own, authored and checked.

## 8. Open questions for the owner (with recommendations)

1. **One view or a toggle?** Recommendation: one view — the list as it is, with the "Word families" card above it (§4). If a toggle, the list stays the default.
2. **Root in revision?** Recommendation: not now; the families are for noticing, not testing. Revisit after a month of use.
3. **Terminology** — "family" (recommended, friendly), with "words that share a root" said once in the card's first line.
