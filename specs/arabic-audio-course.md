# A voice across the Arabic course: the plan

**Status:** the owner accepted questions 1–6 on 20 October 2026. Round two shipped in 1.40.0. Round three (a) is
shipped in 1.41.0 (21 October 2026): 55 new clips generated, independently transcribed
and listened to on 21 October 2026 ("all fine"). Round three (b) shipped in 1.42.0 (21 October 2026): the owner
approved all 357 eligible clips ("both fine"); six uncertain recordings were held. Curriculum 1.1.2 (1.45.1, 24 October
2026) corrected six voiced sentences and replaced every held recording; 654 checked clips ship. Text without vowel
marks no longer waits for a teacher: see the decision of 25 October 2026 in §6. Round ten (1.94.0) voiced the six
unmarked reading texts from MyDay's checked scripts and moved all fourteen reading texts to a new voice. Build/lint and all 54 default suites passed after two affected-suite reruns
(4,956 checks); 24/24 live checks passed.
**Date:** 20 October 2026, after release 1.39.0.
**The numbers:** from `app/scripts/arabic-audio-inventory.mjs`. Run it by hand, with `--rounds` for the sizes in §4.

## 1. The question, and the short answer

**The question:** can all the Arabic text in the course have a voice, like the 48 starter words since 1.39.0?

**The short answer:** about 60% of it can, in two more rounds. That's 572 clips and about an hour of listening for
you, spread over the rounds. The rest needs a teacher or a fluent speaker first.
- **Cost and size aren't the problem.** The whole course is about 24,000 characters. Google's free allowance is a
  million a month, and the clips would add about 6 MB to the repository.
- **The limit is checking.** A synthesised voice reads exactly what's written. Where the text has its vowel marks,
  you and the transcription check can compare what you hear with what's written. Where it has none, the voice has to
  guess the vowels and endings, and nobody here can tell when it guesses wrong.

## 2. What's in the course

1,110 distinct pieces of Arabic, 23,922 characters in all:
- **641 are fully vowelled;**
- **56 are partly vowelled;**
- **413 have no vowel marks.**

199 pieces appear in more than one place, so one clip can serve them all.

| Where it's shown | Distinct pieces | Fully vowelled | No marks | What they are, mostly |
|---|---|---|---|---|
| Vocabulary: starter words and examples | 95 | 94 | 0 | Voiced since 1.39.0 |
| A lesson's headline example | 149 | 146 | 3 | Phrases and sentences |
| Teaching: examples, try it, solutions, explanations | 525 | 427 | 89 | Words, phrases, sentences |
| Reading texts, A1–A2 (8 texts) | 8 | 8 | 0 | Short passages, 5–11 sentences each |
| Reading texts, B1–B2 (6 texts) | 6 | 0 | 6 | Passages written without marks, as Arabic usually is |
| Lesson checks (questions) | 217 | 27 | 175 | Single letters and words inside English questions |
| Answers, behind a button | 196 | 35 | 138 | Mostly written without marks |
| A lesson's key concepts | 87 | 3 | 76 | Mostly letter groups (ا د ذ ر ز و) |
| Practical tasks | 78 | 16 | 60 | Words inside English instructions |
| Sound pairs, timetable, word families | 59 | 38 | 19 | Minimal pairs (قَلْب / كَلْب), days and places |

Every reading text also has a version without marks, and the app lets you switch between the two. The 8 A1–A2 texts
have a vowelled version; the 6 B1–B2 texts have only the version without marks.

## 3. What should have a voice, and what shouldn't

1. **Only fully vowelled text.** The voice reads what's written, and the marks are how both you and the cross-check
   know it read correctly. It's the same rule as round one.
2. **No letter drills.** Groups like ب ت ث ن ي would be read as letter names ("bāʾ, tāʾ, thāʾ…"). The lessons want
   the sounds, and those are better taught with the course's own recordings (the Madinah links). That's 73 pieces.
3. **Never before an answer is shown.** Some lesson checks and "try it" items would be answered just by listening.
   "Which article lām is pronounced: in الْقَمَر or in الشَّمْس?" is one. So in checks, answers and "try it",
   the play buttons appear only once you've revealed the answer. Revision cards stay as they are.
4. **Reading texts by sentence.** Each sentence is its own clip, made from the vowelled version.
   - One **Listen** button plays the whole text, sentence by sentence.
   - Tapping a sentence plays just that one.
   - The same audio plays when you're reading the version without marks, so you can listen while you practise
     reading without marks.
   - One clip per sentence makes retakes cheap and a slip easy to find.
   - In the two dialogues, the speaker's name at the start of a line ("سَامِي:") isn't read out; each line's clip
     holds only what is said.
5. **Listening activities stay as they are.** The course's listening tasks expect a human or external recording. A
   synthesised clip is a model to copy and never counts as listening practice done, as in round one.
6. **The same label everywhere:** "Synthesised voice — a model to copy; checked by ear, not yet by a teacher."

## 4. The rounds

| Round | Clips | Characters | Audio | Your listening, about |
|---|---|---|---|---|
| **Two:** the lessons' headline examples | 136 | 2,948 | 6 min | 15 min |
| **Three (a):** the 8 vowelled reading texts, by sentence | 55 new (3 distinct texts reused) | 2,177 new | 5 min | 11 min |
| **Three (b):** teaching examples, try it and solutions | 322 | 6,242 | 12 min | 31 min |
| **Three (b):** sound pairs and word-family forms | 21 | 189 | under 1 min | 1 min |
| **Three (b):** check questions and answers, once the answer is shown | 20 | 372 | 1 min | 2 min |
| **Held back** (see §3 and §6) | Unvowelled pieces, drills, fragments and 6 B1/B2 texts | | | |

"Your listening" allows for playing each clip about twice and ticking the checklist. Round three (b) is best done in
two sittings.

Round three (a)'s implemented extraction is `app/scripts/arabic-reading-sentences.mjs`: 59 sentence positions,
58 distinct spoken texts. It keeps newlines and the final signature, and removes dialogue speaker prefixes only
from the spoken text. Unlike the initial inventory, its character count excludes those prefixes. A whole-text
Listen button is offered only when every sentence has a checked clip. The local listening page is generated by
`node app/scripts/review-arabic-audio.mjs reading-texts`; it cannot change the audit or the shipped clip list.
Round three (b), **shipped in 1.42.0**, uses the same Arabic-run boundaries in the app and authoring scripts.
The revised count excludes 14 affixes/unfinished forms, two shadda-only words and one syllable drill which the
original heuristic admitted. 363 distinct new texts were generated; every current clip was transcribed blind and
the main session read every transcript. 21 texts were remade (27 retakes). Six uncertain recordings are held back
for a fluent reviewer: هَلِ; سَاعَة; الْكِتَابَ; دَعَا; إِنْ; and the teaching sentence ending in مَلَاحِظَاتٍ,
whose vowel the voice repeatedly read differently. The authored text stays unchanged.

**Curriculum 1.1.2 (24 October 2026):** the course review found that held sentence's text was itself wrong (the
voice had been reading the correct مُلَاحَظَاتٍ). It was corrected, with five other voiced sentences, and their six clips
were removed (`audio-audit.json`, `removed`). Sixteen new clips (11 corrected or new texts, 5 held retakes) were
made in the same voice, transcribed blind (`cross-check-1.1.2.json`) and listened to by the owner, who reads Arabic
("all fine", 24 October 2026). Four short forms were still heard differently by the transcription and were approved
by ear. 654 checked clips ship (released in 1.45.1) and none are held.

The owner listened to all 357 eligible clips, split into 179 and 178, and confirmed "both fine" on 21 October 2026. All decode in the browser: 679 seconds
(11 min 19 s) of audio, roughly 28 minutes of listening with repeats. Generate the two local pages with
`MYDAY_AUDIO_REVIEW_BATCH=179 node app/scripts/review-arabic-audio.mjs teaching sounds-families lesson-checks`.
The checklist cannot approve a clip or change MyDay. The 357 approved clips ship alongside the earlier 286; the six held recordings have no play controls.
See `content/arabic-audio/cross-check-teaching.json` for current and earlier transcriptions, holds and usage.

Round four (course words, 25 October 2026): each course word, its example and the Arabic in its note
(`course-words` in `app/scripts/arabic-voice-sources.mjs`): 133 new clips (20 texts already had one), transcribed blind
(`content/arabic-audio/cross-check-course-words.json`); eleven isolated forms heard as other words were remade; five
were still heard differently and the owner approved them by ear ("all good"). The temporary key was deleted.
Round five (course words for modules 5–7, the same day): 310 new clips, transcribed blind; twelve remade; three short
forms still heard differently (أَسْمَعُ، مَاء، مَاءً) and approved by ear in three listening batches ("all done"). A course word
is voiced when it's marked all through (`markedThrough`), so short words like مَاء, which the shared ratio calls partial,
get a clip. The temporary key was deleted.
Round six (course words for modules 8–10, the same day): 236 new clips, transcribed blind (one run stopped on a timeout
and saved nothing, so the script now skips and saves as it goes); twelve remade; a note that ran two Arabic pieces
together reworded and its merged clip removed; the owner asked for another take of one example (مَا اسْمُ الْمَكَانِ؟),
then approved all. The temporary key was deleted.
Round seven (course words for modules 11–13): 251 new clips, transcribed blind; eight short forms remade; three still
heard differently (ذَهَاب، فِقْرَات، يَعْرِفُنَا) and approved by ear in three batches ("all good"). The key was deleted.
Round eight (course words for modules 14–16): 276 new clips, transcribed blind; 23 remade, ten of them twice (the
voice gives the same audio for the same text, so five came back unchanged: rewording, not retaking, fixes those); three
note pieces voiced wrongly on every take are now said in context (الشِّعْرُ الْعَرَبِيُّ، شَعَرَ بِالْبَرْدِ، يَقْضِي وَقْتًا);
nine short forms still heard differently were approved by ear in three batches ("all good"). The key was deleted.
Round nine (course words for modules 17–19): 267 new clips, transcribed blind; 16 remade, four of them twice; four
texts the voice read wrongly on every take or another way are now said in context (الصُّورَة for الْمَلَفّ, read
milaff; سَافَرَ أَخِي وَحْدَهُ; صِحَّتُهُ جَيِّدَةٌ; أَخْطَاءٌ كَثِيرَةٌ); five short forms still heard differently were
approved by ear in three batches ("all good"). The key was deleted.
Round ten (the reading texts, 1.94.0): the six unmarked texts' scripts were cross-checked (one change, the accusative
after لَيْسَ … بَلْ) and approved by the owner's fluent checker. Then 98 sentence clips and 14 whole-text clips were made in
WaveNet B with pause forms, transcribed blind (no letter differences beyond pause forms spelled another way) and
approved in two batches ("all good"). The owner asked for one more take (كُرْسِيّ): a final ـِيّ or ـُوّ at a pause is now
said ī or ū, and the four clips that changed were made again and approved. The temporary keys were deleted.
Round eleven (the unmarked Arabic in lesson checks and answers, 1.96.0): 258 piece scripts (12 pieces left out on
purpose, with reasons) were cross-checked (no errors; one optional change, أَدْرُسْ) and approved by the owner's fluent
checker. Then 258 clips were made in WaveNet B, transcribed blind and approved in three batches ("all good"). Twelve
were made again; WaveNet usually gives new audio for the same text. Five isolated words were still transcribed
differently (يَدْعُو، يَدْرُسُوا، مَاء، أَدْرُسْ، شِعْرِيّ) and were approved by ear. The listening page had shown only the
unmarked text, so the owner re-listened to the eight doubtful clips with their scripts shown (the page now shows a
script first): seven were confirmed, and شِعْرِيّ, still read as شَعْرِي ("my hair") after more takes and a marked
variant, was left out with its reason. 257 clips ship; 13 pieces stay silent on purpose. The keys were deleted.

**Each round works like round one.**
- **On the Mac:**
  1. a Text-to-Speech-only key is made, and deleted afterwards;
  2. the clips are made in the same voice (Chirp 3 HD Charon);
  3. Gemini transcribes every clip, and any clip it hears differently is made again;
  4. you listen on a checklist page and tick anything that sounds off;
  5. the clips are made again until they're right;
  6. the full test run, a release, and a live check.
- **The cost is about nothing:**
  - **Text-to-Speech:** within the free allowance (to be confirmed on the day).
  - **Gemini's cross-check:** about US$0.04 for round two and about US$0.15 for round three.

## 5. How it would work in the app

This was the original implementation proposal. The text-keyed audit and stronger build checks shipped in 1.40.0;
reading-text controls and shared sentence extraction shipped in 1.41.0. The descriptions below retain the
original starting point for reference.

- **One clip per distinct text, shared wherever that text appears.**
  - `content/arabic-audio/audio-audit.json` today is keyed by starter word. It would be keyed by the **exact text**
    instead, listing where each text is used.
  - The app's `voice-clips.json` would map text to clip file.
  - The 96 clips already made would move over unchanged.
- **Play buttons only where we place them,** never automatically on every bit of Arabic: the lesson's example, the
  reading text's Listen and its sentences, and teaching examples and solutions. The answers and "try it" only after
  they're revealed. This keeps rule 3 safe.
- **The build check grows with it.**
  - `prepare-audio.mjs` still fails on a file that doesn't match its name, a cut-short file, a stray file or an
    unknown check.
  - It would now also fail on a clip whose text no longer appears anywhere in the course (so a changed sentence can't
    keep an old voice).
  - Only clips you've listened to ship.
- **Unchanged:**
  - the service worker, which keeps each clip the first time it plays;
  - the Slower switch;
  - saved data, so going back to an earlier release stays safe;
  - the server and the database.

## 6. Text without vowel marks

This covers the 6 B1–B2 reading texts and 358 other pieces, mostly check questions, answers and key concepts.

| Option | What it means | Trade-off |
|---|---|---|
| A. Leave it without a voice | Its honest "no recording" notes stay | Nothing to check; nothing gained |
| B. A fluent speaker checks synthesised clips | The voice guesses the vowels; a fluent speaker listens to every clip | Needs a fluent speaker's time |
| C. A vowelled copy, reviewed | A person (or an AI draft) adds marks in a separate copy, a teacher reviews it, then it's voiced like round three. The course's own text never changes: it drops marks on purpose | A teacher's time, plus extra authored content to keep |
| D. A human recording | A competent Fuṣḥā speaker records the 6 B1–B2 texts; the course itself asks for this | The best model to copy; needs a speaker and permission |

**Recommendation: A for now.** Then D for the 6 B1–B2 texts if a fluent speaker becomes available, and B for the rest
at that point. Don't use an AI-vowelled copy without a teacher's review: it would look checked when it isn't.

**Decision (owner, 25 October 2026), replacing A:** voice all of it, as the owner has a fluent checker: "all including
the 400 as i have someone who can check it", and "dont rely on the fluent checker the indendent fable checker should
also check". So it's option C, with the owner's checker in place of a teacher. MyDay keeps its own fully vowelled copy
of each unmarked piece (`content/teaching/arabic/voice-scripts.json`); the course text never changes and the app shows
it as it is. Each copy is cross-checked by an independent reviewer first, then by the fluent checker, with the
reviewer's changes marked; anything they disagree on goes to the owner. Only then are clips made, transcribed blind and
listened to. The build refuses a copy whose letters differ from the course text. Order: the six reading texts first
(round ten, 1.94.0), then the short pieces in two or three batches. Pieces unmarked on purpose (كتب on its own, single
letters, endings, drills) stay without a voice, each listed with its reason for the checker.

**Voice and pause forms (owner, 25 October 2026, after a listening trial):** WaveNet B (`ar-XA-Wavenet-B`) with pause
forms. It is used for the reading texts and for every new clip from now on; older clips keep Chirp 3 HD Charon until
each is redone (the audit lists it under `earlier_voices`). Pause forms are for connected reading only, because in a
short example the last word's ending is often the point of the lesson. Each reading text also has one clip read in one
go, for "Listen to the whole text".

## 7. Questions for you

1. **Round two now?** It's the 136 lesson examples, about 15 minutes of listening.
   *Recommendation: yes.*
2. **In round three, the reading texts first?** That's round three (a), about 11 minutes of listening. They're the
   biggest step up: a whole text read aloud, which you can follow with or without vowel marks.
   *Recommendation: yes, reading texts before the teaching items.*
3. **Voices in checks, answers and "try it" only after the answer is shown?**
   *Recommendation: yes. Otherwise some checks are answered just by listening.*
4. **Letter drills: no voice?**
   *Recommendation: no voice. Letter names would mislead; the course's linked recordings teach the sounds.*
5. **One voice for everything, dialogues included?** Two of the A1–A2 texts are dialogues between Sāmī and Laylā.
   With one voice, a male voice also reads Laylā's lines.
   *Recommendation: one voice for now. A second voice would mean another trial and a second voice to check; the
   speaker's name stays on the page.*
6. **Text without vowel marks: option A until a fluent speaker or teacher is available?** And would you like to look
   for one, who could also check rounds one to three?
   *Recommendation: A for now, and yes, worth looking for one.*
