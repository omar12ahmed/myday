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
   - its name: the course's own path name when the stage is whole (for example "A2 · Connected everyday Fuṣḥā"), its
     modules' names when the goal takes only part of a level (a branch after B1 takes one B2 module), or the goal's
     name for the branch;
   - how many of its lessons are ready, and how many need revision. A core stage counts its required lessons, like your
     path; a branch's lessons are all optional in the course, so the branch counts them all (and says so);
   - where you are: **the stage of your next step** (the same plan as the map's next-step card), even when that stage
     is all ready (resuming a ready lesson); a stage before it that isn't all ready is **earlier, not finished**; one
     that's all ready is **done**; the rest are **ahead**. When the plan's step is "complete" (your path's lessons are
     ready, or only revision is left), where you are is the first stage that isn't all ready (for a specialist goal,
     its branch). A stage with no lessons is never shown as done;
   - what you'll be able to do at its end: the course's milestone sample tasks (one line each for listening, reading,
     speaking and writing) when that milestone's closing module is on your goal, the same rule Progress uses; otherwise
     its modules' purposes. Where you are is open; the others fold, each fold naming its stage for screen readers.
2. **"A step towards …"** under a lesson's title (`stepTowards`, from the course alone, so it's cheap):
   "A step towards “Literary Arabic, stories and style”: stage 3 of 6, A2 · Connected everyday Fuṣḥā"; for a branch
   lesson, "…, the goal's own stage (6 of 6)"; for a one-stage goal, just "A step towards “…”". A lesson that isn't on
   the route to your goal shows no line.
3. **The same line on the map's next-step card**, under the lesson's title: not for a revision round, and not when
   your path is all ready (the step then points back at the first lesson), unless you're resuming a session. When only
   lessons needing revision are left, the line shows for the one to revisit.
4. **On Study home's Arabic card:** "Your next lesson is a step towards …" (the next lesson from the same plan as the
   map, with the same exceptions; `learningGlance`), with **Hide**. Hiding moves focus to a message ("Hidden here. To
   show it again: Arabic, under Your route."); **"Show the next step's goal on Study home"** under
   "Your route" on the map brings it back (or hides it). The choice is remembered on this device only
   (`myday.arabic.towardshome`, `towards.ts`), like Slower; it's not part of your data. Today's Study card, which shares
   the same options, doesn't show it (option 3), and nothing about it reaches Ask MyDay (`learningGlance` is Study
   home's alone).

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
