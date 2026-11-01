# Ask MyDay and your ambitions

**Status:** agreed (1 Nov 2026): the owner's decisions are in §4. Being built. This is level 5 of "How MyDay should
think" (`myday-vision.md` §1): link daily work to long-term goals. Builds on Ambitions (`projects-ambitions.md`,
myday-af's, 1.119.0), which until now were never sent to AI.

## 1. What you'd notice

- **On a project or task that's a step towards an ambition**, Ask MyDay knows which, by name, and can say how
  what you're doing fits: "Booking the course is a step towards *Work in cybersecurity*."
- **Ask about your goals** ("what am I working towards?", "what should I do this week for my goals?") and Ask MyDay
  takes a look at your ambitions, shown above the answer like its looks at your notes or a day ("Looked at your
  ambitions: 3"), and answers from their titles. Asked, it suggests tasks towards one, which you add or not.
- It never decides your goals for you, never makes up what an ambition involves, and never says whether one is
  worth having.

## 2. What is sent

**Only an ambition's title**, and only when it's relevant:
- with a project's page (or Ask on it): the titles of the ambitions linked to that project (`project.towards`, at most
  3);
- with a task's page: the titles of the ambitions its project serves (`task.towards`, at most 3);
- when you ask about your goals: the titles of your ambitions (the `goals` look, at most 12, oldest first), and how
  many there are.

**Never:** an ambition's why, its steps or its links; anything on a private project's page (its slice isn't sent, so
neither are its ambitions); and **any ambition that links a private project, anywhere** — its title can be as private
as the project ("Leave my job", say), so it isn't sent through another project, a task or the goals look either
(myday-af's point, 1 Nov; stricter than the owner's page rule, so it only sends less). Only links to projects count for
a project or task (`ambitionsOfProject`); links to Study, to a project that's gone, or of a kind this version doesn't
know are ignored.

## 3. What changes where

- **App:** `ai/askContext.ts` (the slices' `towards`), `ai/lookup.ts` (`goalsLookup`; the `goals` look offered only
  when you have ambitions), the Ask panel's look line, the "Sent to the AI" preview, `ai/reach.ts`'s list, What MyDay
  knows.
- **Server:** the request may carry `towards` on a project or task, and the `goals` look (`ask-shape.ts`); new
  instructions, `myday-ask-v28`, deployed before the app; older apps keep working.
- **Quality:** about 10 scenarios run live on Ask's model and read blind: connecting a task, a plain request that
  shouldn't mention ambitions, asking about goals (the look), an answer from the look, suggesting tasks towards one,
  "is my goal realistic?" (never judging), no ambitions at all, and a steering attempt in a title.

## 4. The owner's decisions (1 Nov 2026)

1. **What's sent: an ambition's title only.** Never its why, its steps or its links.
2. **When: only when it's relevant** — on linked work, and when you ask about your goals (a look you can see). Never on a
   private project's page.
3. **What Ask may do: connect, and suggest** tasks towards it when asked (you add or not). It never decides your goals.
4. **Publish when good**, after a live evaluation read blind and a review; the server first.
