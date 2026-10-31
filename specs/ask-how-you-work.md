# Ask MyDay learns how you work

**Status:** agreed (31 Oct 2026): the owner's decisions are in §5. Being built. It follows the owner's choice of
"Ask sees your preferences" (the vision's "AI seeing confirmed preferences: only if the person chooses",
`myday-vision.md` §8), widened by the owner: "it should gradually understand how I work and adapt its
recommendations".

**Builds on:**
- "What MyDay has noticed" (`app/src/data/patterns/`): plain counting on the device over the last eight weeks, never AI.
  Each pattern says what it's based on, and is used only once you say it's right;
- your preferences: the longest task per list and the most tasks a day (`data.patterns.prefs`);
- Ask MyDay (`ask-conversation.md`).

## 1. What you'd notice

- **Off until you switch it on.** "Let Ask MyDay use how you work" sits in What MyDay has noticed, beside your
  preferences.
- **Once it's on,** Ask MyDay's suggestions follow what you've confirmed. A learning task suggested for 45 minutes
  comes as 20 if that's your longest, with "(kept to 20 min, as you prefer)". Its advice takes your patterns into
  account: when you study, how your energy follows short nights, which kind of task you tend to put off.
- **It learns from how you treat its suggestions.** MyDay counts, on the device, what you do with Ask MyDay's
  suggestions: added as they are, shortened, renamed, or not added. Once there's enough to go on, What MyDay has
  noticed shows a new pattern with its evidence, for example "You shorten Ask MyDay's learning tasks to about 20
  minutes: 9 of 11 times". Say it's right and Ask follows it; say no and it never does.
- **The "Sent to the AI" preview** lists what goes, so you can see exactly what Ask knows about how you work.

## 2. What is sent, and what isn't

- **Sent, only when it's on:**
  - your preferences (each as a limit: "learning tasks: 20 min at most");
  - the patterns you've said are right, as short plain statements ("You study most between 07:00 and 09:00");
  - your answers about Ask's own suggestions, the same way.
- **Never sent:**
  - a pattern's evidence (the counts and dates);
  - patterns you said no to;
  - (unless you choose otherwise in §5) patterns you haven't answered yet;
  - anything private (the counting already leaves private projects out);
  - your name.
- **Small:** at most about 8 statements of up to 120 characters each.

## 3. The app keeps to it as well

The app holds Ask's suggestions to your limits whatever the AI says: a task longer than your longest for its list
is shortened and says so. The day's task limit doesn't apply here: Ask suggests things to add to your lists, not
today's plan, which Help me adjust today and Build my day already plan within it.

## 4. What changes where

- **App:**
  - the switch and the new "Ask MyDay's suggestions" patterns (`data/patterns/notice.ts`, `NoticedScreen.tsx`);
  - counting what you do with each suggestion when you Add (`capture/AskPanel.tsx`);
  - what's sent (`ai/askContext.ts` through the privacy filter, `ai/reach.ts`);
  - the shortening (`ai/ask.ts`);
  - What MyDay knows.
- **Saved data:** the switch and the counts go in your MyDay data, as counts and lengths only, never what you asked
  (unless you choose "this device only" in §5). That makes it a saved-data change: older versions must keep them
  untouched, and going back a release stays safe.
- **Server:** Ask's request shape gains "how you work", and its instructions (v26) say to follow the limits and take
  the statements into account without quoting them back or treating them as rules about what to say. It's deployed
  before the app, as before.
- **Quality:** about 10 scenarios with and without it (a task to break down, a study plan, "when should I do this?"),
  run live on Ask's model and read blind; then an independent review (privacy and saved data).

**Needs your OK, each at its time:** the live evaluation, deploying the server, publishing.

## 5. The owner's decisions (31 Oct 2026)

1. **Ask sees only what you've confirmed:** your preferences and the patterns you've said are right (not unconfirmed
   ones).
2. **MyDay learns from what you do with Ask's suggestions**, as new patterns you confirm in What MyDay has noticed.
3. **The counts are kept in your MyDay data, synced** (counts and lengths only), so every device learns together.
