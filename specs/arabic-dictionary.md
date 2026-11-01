# Arabic dictionary

Status: proposal (1 November 2026, myday-20). The owner asked for a dictionary holding every word in the course, with
the option to add new words. They chose to build the page **next, after 1.124.0**, and to give **every word used in
the course an entry, in batches**. Nothing here is built yet.

## 1. Why

The Vocabulary tab already holds most of a dictionary:
- **Your words:** "Keep a word" and "Add your own word", in revision both ways, and never sent to AI.
- **The 48 starter words.**
- **Word families by root.**
- **"Words from the lessons":** 752 course words, each with its root, example, note, voice and explainer link.

Three things stop it being one:

1. **No lookup.** The only way to find a word is to scroll one long page, lesson by lesson.
2. **Not every word is in it.** The course's Arabic text (lessons, examples, explainers, reading texts) has about
   3,300 distinct word forms. About 1,000 rough stems among them match no listed word: everyday words like كُلّ,
   عَنْ, قَدْ, مُنْذُ, قَالَ, آخَر, طَرِيق, مُدِير and سُوق. Leaving out names and leftover inflections, that is probably
   600–900 dictionary words.
3. **Your words sit apart.** "Add your own word" already matches a course word, via `starterFor` over all words. But
   it calls any match "one of the starter words", fills in only the meaning, and matches only after vowel marks are
   stripped, so آسِف and اسف don't meet.

## 2. The page

The tab **Vocabulary** becomes **Dictionary**. Its address stays `#study/arabic/vocabulary`, so every existing link
keeps working: revision's "hasn't clicked yet", Keep a word, and the questions' notes.

**Search** sits at the top, with one box:
- **Arabic, with or without vowels.** Hamza and alif forms (أ إ آ ٱ ا), ى/ي, ة/ه and tatweel count as the same.
  An article or a joined وَ, فَ, بِ, لِ or كَ in front is also tried without it, so الْكِتَاب finds كِتَاب.
- **English:** words in the meaning, so "door" finds بَاب, but "indoor" doesn't.
- **Latin letters:** the app's own reading, with the marks optional, so "kitab" or "kitāb" finds كِتَاب, and
  "salam" finds سَلَام.
- **Order:** results come exact first, then words that start with the search, then words that contain it.
- **Size:** the first 50 results show, with "Show more" below, and the number found is announced to screen
  readers. Nothing is sent anywhere: the search runs on the device.

**Browse**, when the box is empty:
- **A to ي:** by first letter, in Arabic order, ignoring vowels and the article.
- **By root:** each root with its words, as word families do now.
- **By lesson:** today's list, in course order.

**Filters:** All · Your words · In revision · Phrases · Starter words. Phrases shows the 100 everyday phrases grouped by
situation, once they exist; it replaces the separate phrasebook page that was planned.

**An entry** is today's word row:
- the form, meaning and part of speech, the root, voice, example and note;
- the explainer link, and revision ("Add to revision", "Also practise writing it", "Take it out");
- "Taught in <lesson>", linking to the lesson.

Your own word shows in the same list, marked **Yours**, with your meaning and note, and Change or Remove as now.

**Adding a word:** "Add a word" looks in the dictionary first.
- If the course has the word, its entry is shown, with "Add to revision". You can still keep your own meaning beside
  it, as now.
- If not, it's kept as yours, exactly as "Add your own word" does today.

The message "One of the starter words" becomes "In the dictionary: <meaning>, taught in <lesson>".

**Unchanged:**
- the starter words' "Bring them back in revision" card;
- the gentle note after a few new words a day;
- "Read it aloud, then check" for well-known words.

**A phone:** search, filters and entries fit 320 px without scrolling sideways.

## 3. Saved data

None changes. Your words stay in `arabic.words`, revision cards in `arabic.cards`, and answers in `study.reviews`.

The looser matching used by search is a separate function. `sameWord` (`data/arabic/words.ts`) decides whether you
already kept a word, so it stays as it is: changing it would change what counts as a duplicate in saved data.

Your words are still never sent to AI.

## 4. Every word in the course: the content plan (with myday-5a)

1. **Inventory.** A script lists every word form used in each lesson's teaching text, examples, explainers and
   reading texts, in course order. It leaves out:
   - forms already listed;
   - made-up names;
   - the Qur'anic quotes;
   - words that appear only in a lesson check's prompt or answer, so that no check's answer is given away.
2. **Dictionary form.** Each form is reduced to its dictionary form by hand, in batches: هَدَفِي → هَدَف,
   الْمُهَنْدِسُونَ → مُهَنْدِس (already listed).
3. **One entry per form, in one lesson** (the build already refuses a duplicate). The entry goes in the **first
   lesson, in course order, that uses the word**. Words used only in modules 25–30 go there. Later lessons that use
   the word point back to that entry; they never get a copy.
4. **The entry shape** is a course word's, under myday-5a's conventions:
   - append-only ids;
   - fully vowelled;
   - root or none;
   - an example that doesn't give away a check;
   - a voiced note.
5. **Batches** go by module, about ten in all. Each batch is drafted, then:
   - validated;
   - cross-checked by Fable;
   - read by the owner's checker;
   - voiced by myday-5a in Charon;
   - listened to by the owner;
   - released with other work.

   Who drafts which modules is settled between myday-20 and myday-5a. myday-5a merges, validates and voices every
   batch.

The page doesn't wait for this: it ships first with the 800 words already listed, and grows with each batch.

## 5. Later, not in the first release

- **Tap any word** in a lesson, explainer or reading text to look it up, including inflected forms (هَدَفِي → هَدَف).
  This needs a table from forms to entries.
- **"Also used in"**: the lessons that use a word after the one that teaches it, worked out by the build from the text.
- **Plural, feminine and a verb's present tense** as their own fields. Today they are in the notes.

## 6. Checks

- **Rules (no browser):** the search normaliser (hamza and alif forms, ى/ي, ة/ه, tatweel, the article and joined
  prefixes, Latin with and without marks) and the ranking.
- **Browser (app-arabic):**
  - search in Arabic, English and Latin;
  - each browse mode and filter;
  - "Add a word" offering the course's entry, then keeping your own;
  - your words marked Yours;
  - the old address still opening the page;
  - focus, labels and the announced count;
  - 320 px.
- **Live:** live-explainers.js gains one search on account D, read-only.
