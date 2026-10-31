# Graduated help for Arabic words

**Status:** shipped in 1.112.0, on the owner's "go ahead" (31 October 2026). The owner ticked no box in the
proposal, so the recommended options were taken (below); any of them can still change.
**Why:** "How MyDay should think" (specs/myday-vision.md, "How MyDay should think"), level 6: build the
person's own ability rather than dependence. As a word becomes solid, MyDay gives less help with it.

## What it does

A word you know well asks you to read it aloud yourself first. Its play button and its Latin reading wait until you
tap **"Read it aloud, then check"**; then both show, until you leave the page.

- **Known** (`wordKnown`, `app/src/data/arabic/cards.ts`): the word's recognise card was last answered right on your
  own ("Recalled on your own", `understanding`), it now comes back at least `KNOWN_AFTER_DAYS` (7) days apart (the
  card's interval), and it isn't due yet. One success alone isn't enough. If the word slips, or comes due, the help is
  back at once.
- **Only when there's something to hold back:** the button shows only if the word has a listened-to clip or the
  readings are on; otherwise the row is as before. Pressing it moves focus to the word's play button, or to the row
  when it has none. The button's accessible name is its visible text, and it sits inside the word's own row, so a
  screen reader meets the word first.
- **Where:** the word itself, in every word row: Vocabulary's starter words and course words, and a lesson's word list
  (`WordRow`, `ArabicScreen.tsx`). The example sentence keeps its voice and reading, and so does a course word's note.
  Lessons, explainers, reading texts and checks are unchanged, and revision has no voice.
- **Honest limits:** the same word can still be heard or read nearby. Its example sentence usually contains it, with
  its voice (option 2) and its reading; a few notes contain it; its word-family note, if you open it, shows it
  with its reading and voice; and revision's recognise card shows a reading when readings are on. The help steps back
  on the word itself, where you read it on its own.
- **Always show the help:** a switch in Vocabulary's voice note, under Slower, keeps every word's voice and reading in
  view. It's remembered on this device (`myday.arabic.alwayshelp`, like `myday.arabic.slower`), not part of your data.
  A line above it says what a known word does.

## What it doesn't touch

Saved data, sync and the server: nothing new is saved or synced; it reads the revision record you already have. Going
back to an earlier release is safe (the help simply always shows there). Each word row listens only to the switch, so
playing a clip doesn't redraw the whole list. (The switch lives in the voice note, which shows only when the course has
clips; a build without any would hide readings with no switch, which the shipped course never is.)

## The options taken (recommended, on the owner's "go ahead", 31 October 2026)

1. Help steps back once the word comes back **a week** or more apart (not three weeks), and isn't due yet.
2. The example sentence **keeps its voice** always. (Its reading stays too; that wasn't asked, and it's unchanged.)
3. **Yes** to a switch to always show the help, on this device.

## Checks

`tests/arabic-rules.test.js` [K] (`wordKnown`: no card, a short gap, help, a wrong answer, due or overdue, the write
card) and `tests/app-arabic.test.js` [16] (the word rows, the reveal and its focus, readings off, a word without a clip,
the switch and its memory, 360 px).

## Later, as separate decisions

Vowel marks fading for words you know well, the way the course already tapers them in its texts.
