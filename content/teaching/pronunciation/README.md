# Arabic pronunciation support

Arabic pages and Arabic revision questions offer **Show / Hide transliteration**, enabled initially. The choice is remembered on the current device. The expandable pronunciation key explains the symbols and links to alphabet recordings. English meanings remain separate from the Latin reading.

Coverage includes the Arabic examples in all 152 teaching lessons, lesson headline examples, all 48 starter words and their example sentences, all 14 reading texts (including dialogue line alignment), the timetable and sound pairs. Compact previews in the reading index show only Arabic; open a text for its full reading. Answers and their transliteration appear together only after the learner requests the answer. Writing-from-memory questions do not show the target word or its transliteration early.

## Reading conventions

This is a learner-facing, word-by-word transliteration. It is not IPA, a strict bibliographic standard, automatic diacritisation or recorded audio. Use the course's linked listening lessons for connected speech, stress and rhythm; no recording is provided for the original course texts.

| Symbols | Meaning |
| --- | --- |
| a, i, u / ā, ī, ū | Short / long vowels |
| th, dh, sh | One consonant each, as in think, this, ship |
| kh, gh | The consonants خ, غ |
| ḥ, ʿ, ʾ | ح, ع, ء; initial hamza is usually omitted |
| ṣ, ḍ, ṭ, ẓ, q | ص, ض, ط, ظ, ق |
| bb, ll, rr | Doubled consonants, matching shadda |
| al-qamar / ash-shams | Moon-letter / sun-letter article |
| -un, -in, -an | Tanwīn when written in the source |

Fully vowelled examples retain written endings. An unmarked final consonant is read as a citation or pausal form. These readings do not model all changes in continuous speech or at a sentence boundary. The six longer unvowelled texts use prepared readings, generally omitting nominal case endings; their pages state this convention. Do not use them as an iʿrāb answer key.

An unvowelled form can have several pronunciations. Authored phrases supply a reading from their actual context. Bare `كتب` deliberately retains alternatives. Outside that authored coverage, incomplete vowel information is marked with brackets instead of being silently guessed. Bracketed consonant skeletons are not pronunciations to memorise.

## Sources checked

The symbol choices and explanations were checked against these primary sources on 17 October 2026. The learner guide intentionally uses sun-letter assimilation and written vowel endings rather than applying every ALA-LC bibliographic convention.

- [Library of Congress Arabic romanization table](https://www.loc.gov/catdir/cpso/romanization/arabic.pdf): consonants, long vowels and orthographic distinctions.
- [Madinah Arabic alphabet lesson](https://madinaharabic.com/free-content/reading/lesson-1/part-1): letters and sound models; linked directly in the app.
- [Madinah Arabic definite article lesson](https://madinaharabic.com/free-content/grammar/lesson-3/part-1): the article and sun/moon-letter pronunciation.
- [Al Jazeera Learning: the letter ḥāʾ](https://learning.aljazeera.net/en/generallanguage/%D8%A7%D9%84%D8%AD%D8%B1%D9%88%D9%81-%D9%88%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-7-%D8%AD%D8%B1%D9%81-%D8%A7%D9%84%D8%AD%D8%A7%D8%A1): sound distinctions and examples.

These sources support the conventions, not external certification of the original sentence readings. Media playback was not tested.

## Maintenance and checks

`readings.json` holds exact context-specific readings and orthographic exceptions. Keys are NFC-normalized and whitespace-normalized; vowel marks are retained so that different vowelled forms stay distinct. `passages.json` holds the 14 prepared texts with a source snapshot and matching line breaks. Edit a reading whenever its source changes; the production build rejects stale snapshots or misaligned lines.

`app/src/study/arabic/transliterate.ts` renders written vowels, long vowels, shadda, article assimilation and other supported orthography. It flags missing information rather than assigning an arbitrary vowel pattern. The React provider is scoped to Arabic pages and revision. Its separate `myday.arabic.transliteration` local-storage key does not modify or sync learning progress; if storage fails, the toggle still works for that visit. Source course text, IDs, answer keys, scheduling and saved-data formats are unchanged.

From the repository root:

```bash
node app/scripts/validate-pronunciation.mjs
node tests/arabic-pronunciation-rules.test.js
bash tests/run.sh app-pronunciation app-arabic app-teaching
```

The rule checks cover linguistic contrasts and course coverage. Browser checks cover visibility, persistence, blocked storage, bidirectional text, answer reveal, revision, vowel-mark independence and phone layout. Automated checks establish these behaviours; they cannot certify every linguistic reading or spoken proficiency.
