# Arabic dictionary

Status: the page is live (1.127.0, §2); dictionary-only words (§4) are live for modules 1–7 (78 words, 1.130.0, with word-forms.json and the check against lesson checks) and 8–13 (45 words, 1.131.0); modules 14–19 (myday-cc, formerly myday-20) and 20–30 (myday-78, formerly myday-5a) follow in batches, then catch-up batches for what the corrected inventory found (6 November: every word a lesson shows, plus words common in dictionary examples). Proposal of 1 November 2026, myday-20. The owner asked for a dictionary holding every word in the course, with
the option to add new words. They chose to build the page **next, after 1.124.0**, and to give **every word used in
the course an entry, in batches**.

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

## 2. The page (built first)

The tab **Vocabulary** becomes **Dictionary**. Its address stays `#study/arabic/vocabulary`, so every existing link
keeps working: revision's "hasn't clicked yet", Keep a word, and Search everywhere. The voice label's "Slower
playback" and the revision glance name it too. A new card, **Look up a word**, heads the page.

**Search**, with one box:
- **Arabic, with or without vowels.** Hamza on a seat (أ إ آ ؤ ئ), ٱ, ى/ي, ة/ه and tatweel count as the same.
  The article, alone or after a joined وَ, فَ, بِ or كَ, or as لِلْـ, is also tried without it, so الْكِتَاب,
  بِالْكِتَابِ and لِلْكِتَابِ find كِتَاب. A single joined letter is tried off only when the rest is the whole word, so
  وَكِتَاب finds كِتَاب, but وَقْت isn't read as قْت.
  A match found only by taking your article or joined letter off ranks a little below the word as typed, and with
  fewer than three letters left it must be the whole word: كانت finds كَانَتْ before أَنْتَ, and الآن doesn't bring in
  every word starting أن.
- **English:** whole words in the meaning, matched from the start of a word, so "door" and "doo" find بَاب but
  "indoor" doesn't. A meaning with alternatives matches any of them exactly: "home" finds بَيْت, "house/home".
- **Latin letters:** the app's own reading, without accents, ʿ or ʾ, and with a doubled letter as one, so "kitab",
  "kitāb" and "mudaris" find كِتَاب and مُدَرِّس.
- **Order:** results come exact first, then words that start with the search, then words that contain it (with two
  Arabic letters or three Latin ones typed). Ties keep the course's order: starter words, then each lesson's, then
  yours. "Show more" moves focus to the first word it adds.
- **Size:** the first 50 results show, with "Show more" below. The number found is announced to screen readers, and
  "Nothing found" suggests keeping the word under Your words. The search runs on the device; nothing is sent.

**Browse**, when the box is empty:
- **By first letter:** a button for each letter in dictionary order (hamza alone first; a letter with no words is
  shown but off). Choosing one lists its words in Arabic order, ignoring vowels and the article.
- **By root:** the same buttons, for the root's first letter. Each root is a heading with its words below. Starter
  words take their word family's root, and phrases their main word's.
- **By lesson:** the existing "Words from the lessons" card further down, in course order.
- Nothing is listed until a letter is chosen, so the page stays light.

**An entry** is the existing word row:
- the form, meaning and part of speech;
- the root, labelled "Root of the main word" on a phrase, since a chunk's root field gives only that (this applies
  everywhere the row appears);
- the voice, the example and the note;
- the explainer link, and revision: "Add to revision", "Also practise writing it", "Take it out";
- in the dictionary, also "Taught in <lesson>" or "A starter word, first in <lesson>", linking to the lesson.

**Your words** appear in search results marked **Yours**, with your meaning and note. "Show it in Your words" moves
focus to the word's row on the Your words card, where Change, Remove and "Also practise writing it" stay, as now.

**Adding a word:** "Add your own word" looks in the dictionary as you type.
- Every course word with the same letters (vowels, hamza seats and the article aside, but not a joined letter, so
  بيت isn't offered كَالْبَيْتِ) is offered: "In the
  dictionary: <word>, “<meaning>”, taught in <lesson>" (or "a starter word"), with **Use the course's meaning** and,
  unless it's already in your revision, **Add it to revision instead**. Adding it to revision keeps no copy, closes
  the form, says it first comes back tomorrow and puts focus back on "Add your own word". If the save is refused (say,
  another tab saved first), nothing is announced and the form stays as it was.
- Otherwise, the word is kept as yours, exactly as before.

This replaces "One of the starter words".

**Unchanged:**
- Your words, the starter words' "Bring them back in revision" card;
- word families, and the starter and lesson lists;
- the gentle note after a few new words a day;
- "Read it aloud, then check" for well-known words.

**Later, with the 100 phrases:** a **Phrases** view grouped by situation, in place of the separate phrasebook page
that was planned. Filters for "in revision" or "starter words" were considered and left out: search and the existing
cards cover them.

**A phone:** search, browse and entries fit 320 px without scrolling sideways.

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
4. **Dictionary-only words.** Each new entry carries `"dictionary": true`. A lesson's own new words stay what they
   are now; dictionary-only words don't swell them or flood revision:
   - On the lesson page, they sit folded under **"Also in this lesson"**, below the lesson's words.
   - **Marking a lesson ready doesn't add them to revision.** Today `markReady` adds every id from `lessonWordIds`,
     its own words and its starter words; dictionary-only words are left out of that list.
   - They join revision only when you add one ("Add to revision" in the dictionary, or Keep a word).
   - In the dictionary they look like any other entry. myday-5a's build checks the field.
5. **The entry shape** is a course word's, under myday-5a's conventions:
   - append-only ids;
   - fully vowelled;
   - root or none;
   - an example that doesn't give away a check;
   - a voiced note.
6. **Never a check's answer.** `validate-explainers.mjs` checks every course word's form, example and note against its
   own lesson check (the lesson's course words not counting as shown): a phrase of two or more words from the
   answer, found there, fails the build for a dictionary word and is reported by id for the lessons' own words, which
   were approved before this check (4 on 1 November; myday-5a took them to the owner's checker). Single words and
   earlier lessons' phrases are left out on purpose: measured on 1 November, they flagged 793 and 15 places, all a
   word list teaching the words a check asks for (فِي, إِلَى) or a common phrase coming back later (عَلَى الْمَكْتَبِ).
   The same script checks `word-forms.json`.
7. **Batches** of about 100 words (about 300 clips, since the form, the example and the note's Arabic are each
   voiced), going through the modules in order, so roughly six to nine batches. Each batch is drafted, then:
   - validated;
   - cross-checked by Fable;
   - read by the owner's checker;
   - voiced by myday-5a in Charon;
   - listened to by the owner;
   - released with other work.

   The inventory (`node app/scripts/arabic-word-inventory.mjs [--modules 4-13] [--json]`) lists, lesson by lesson,
   every form a lesson shows that no listed word covers. That's about 1,000 groups of forms on 1 November, fewer
   dictionary words once each group is reduced: 40 in modules 1–3, 177 in 4–13, 579 in 14–24 and 208 in 25–30. To
   share the work evenly, myday-20 drafts modules 1–19 (about 500 groups) and myday-5a modules 20–30 (about 500).
   myday-5a merges, validates and voices every batch.

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
  - browsing by first letter and by root, and Show more;
  - "Add a word" offering the course's entry, then keeping your own;
  - your words marked Yours, and "Show it in Your words";
  - the old address still opening the page;
  - focus, labels and the announced count;
  - 320 px.
- **Live:** live-explainers.js gains one search on account D, read-only.
