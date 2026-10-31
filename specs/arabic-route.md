# A path to your Arabic goal

**Status:** built on branch arabic-route, on the owner's "go ahead" (31 October 2026). The owner chose option 2
themselves (Study home too, with a way to remove it); for options 1 and 3 nothing was ticked, so the recommended ones
were taken (below), and either can still change.
**Why:** "How MyDay should think" (specs/myday-vision.md), level 5: long-term goals. Today's lesson should be seen
as a step towards something larger.

## What it does

The Arabic map already has **"Your goal"** (`d.arabic.pathId`, saved and synced since the course arrived): the
common core to A1, A2, B1 or B2, or a specialist branch after it (literature, classical prose, Qur'anic Arabic,
translation, technology and cybersecurity, academic and professional). This adds:

1. **"Your route"** on the map, under "Your goal": the goal's stages in course order (`arabicRoute`,
   `app/src/study/arabic/plan.ts`). A stage is the goal's modules at one core level (Start, A1, A2, B1, B2), or its
   branch modules. Each stage shows:
   - its name, from the course's own path names (for example "A2 · Connected everyday Fuṣḥā"), or the goal's name for
     the branch;
   - whether it's done (every lesson in it ready to move on or holding), where you are (the first one that isn't), or
     ahead, and how many of its lessons are ready;
   - what you'll be able to do at its end: the course's milestone sample tasks for A1 to B2 (one line each for
     listening, reading, speaking and writing), and its modules' purposes for Start and for a branch. Where you are is
     open; the others fold.
2. **"A step towards …"** under a lesson's title (`stepTowards`): "A step towards “Literary Arabic, stories and style”:
   stage 3 of 6, A2 · Connected everyday Fuṣḥā". A lesson that isn't on the route to your goal shows no line.
3. **The same line on the map's next-step card**, under the lesson's title (not when the step is a revision round).
4. **On Study home's Arabic card:** "Your next lesson is a step towards “…”: stage 3 of 6, …" (the next lesson from the
   same plan as the map; `learningGlance`), with **Hide**. Hiding says how to bring it back; **"Show it on Study home"**
   under "Your route" on the map brings it back (or hides it). The choice is remembered on this device only
   (`myday.arabic.towardshome`, `towards.ts`), like Slower; it's not part of your data. Today's Study card, which shares
   the same options, doesn't show it (option 3).

## What it doesn't touch

No new saved data, no sync change and nothing sent: it reads "Your goal" and your lesson records, and works the
route out on the device each time. Lessons don't change and nothing is locked. Going back to an earlier release is
safe (the route and the line simply aren't there).

**General Goals, later:** if MyDay gets general Goals across sections (proposed in the vision, not built), a Goal
would point at this path by its id and call `arabicRoute` for its stages; nothing moves (agreed with myday-af and
myday-94, 31 October 2026).

## The options (31 October 2026)

1. The goal's wording: the course's own names (nothing new to write or check). Recommended; none ticked.
2. Where the line shows (the owner's choice): the lesson, the map's next-step card, **and Study home's Arabic card,
   with the option to remove it** there.
3. Today's plan: not yet; wait for general Goals so every section says it the same way. Recommended; none ticked.

## Levels 5 and 6 together

Nothing is decided for the learner: the goal is theirs to change at any time, and every lesson still opens. The route
explains why a lesson matters rather than pushing it.
