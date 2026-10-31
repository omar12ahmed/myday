# Graduated help for Arabic words

**Status:** built on branch graduated-help (owner's "go ahead", 31 October 2026, taking the recommended choices).
**Why:** "How MyDay should think" (specs/myday-vision.md §1), level 6: build the person's own ability rather than
dependence. As a word becomes solid, MyDay gives less help with it.

## What it does

A word you know well asks you to read it aloud yourself first. Its play button and its Latin reading wait until you
tap **"Read it aloud, then check"**; then both show, until you leave the page. Focus moves to the word's play button.

- **Known** (`wordKnown`, `app/src/data/arabic/cards.ts`): the word's recognise card was last answered right on your
  own ("Recalled on your own", `understanding`) and its next review is at least `KNOWN_AFTER_DAYS` (7) days away (the
  card's interval). One success alone isn't enough. If the word slips, it isn't known any more, so the help is back at
  once.
- **Where:** the word itself, in every word row: Vocabulary's starter words and course words, and a lesson's word list
  (`WordRow`, `ArabicScreen.tsx`). The example sentence keeps its voice and reading, and so does a course word's note.
  Lessons, explainers, reading texts and checks are unchanged; revision already shows text only.
- **Always show the help:** a switch in Vocabulary's voice note, under Slower, keeps every word's voice and reading in
  view. It's remembered on this device (`myday.arabic.alwayshelp`, like `myday.arabic.slower`), not part of your data.
  A line above it says what a known word does.

## What it doesn't touch

Saved data, sync and the server: nothing new is saved or synced; it reads the revision record you already have. Going
back to an earlier release is safe (the help simply always shows there).

## Owner's choices (31 October 2026)

1. Help steps back once the next review is **a week** away (not three weeks).
2. The example sentence **keeps its voice** always.
3. **Yes** to a switch to always show the help, on this device.

## Later, as separate decisions

Vowel marks fading for words you know well, the way the course already tapers them in its texts.
