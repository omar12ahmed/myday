# A path to your Arabic goal

**Status:** built on branch arabic-route, on the owner's "go ahead" (31 October 2026). The owner ticked no box in the
proposal, so the recommended options were taken (below); any of them can still change.
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

## What it doesn't touch

No new saved data, no sync change and nothing sent: it reads "Your goal" and your lesson records, and works the
route out on the device each time. Lessons don't change and nothing is locked. Going back to an earlier release is
safe (the route and the line simply aren't there).

**General Goals, later:** if MyDay gets general Goals across sections (proposed in the vision, not built), a Goal
would point at this path by its id and call `arabicRoute` for its stages; nothing moves (agreed with myday-af and
myday-94, 31 October 2026).

## The options taken (recommended, on the owner's "go ahead", 31 October 2026)

1. The goal's wording: the course's own names (nothing new to write or check).
2. Where the line shows: the lesson and the map's next-step card (not Study home).
3. Today's plan: not yet; wait for general Goals so every section says it the same way.

## Levels 5 and 6 together

Nothing is decided for the learner: the goal is theirs to change at any time, and every lesson still opens. The route
explains why a lesson matters rather than pushing it.
