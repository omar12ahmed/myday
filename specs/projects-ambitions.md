# Ambitions: the long-term goals your projects and learning are steps towards

**Status:** the owner's decisions in §2 (31 October 2026); being built on branch `ambitions`. Nothing live without the
owner's yes; a new synced kind needs a migration, applied with the owner's yes.
**Based on:** source at 1.116.0. Plan: `specs/myday-vision.md` §1, "How MyDay should think", level 5 ("Understand
long-term goals … so today's networking lesson is seen as a step towards something larger"), §2 "Proposed: general
Goals" ("connect existing records; don't ask anyone to reorganise; don't add navigation before a workflow needs it");
`specs/arabic-route.md` (the Arabic route and its "A step towards …" line, myday-5a; option 3 said Today waits for
general goals — this is them).

## 1. The practical problem

The owner's daily work serves a few larger aims — working in cybersecurity, reading Arabic literature, a business in
Hargeisa — but MyDay holds each piece on its own: a project here, a Study path there, the Arabic route in Study. Nothing
says what a task on Today moves forward, so the day can feel like a list rather than progress towards something.

## 2. The owner's decisions (31 October 2026)

1. **Named Ambitions** ("Your ambitions"), so they're never confused with Health's fitness Goal.
2. **At the top of the Projects home:** a short "Your ambitions" strip, each opening its own page. No new menu item.
3. **An ambition links, by reference only** (nothing moved or copied): **projects**, **Study paths**, **the Arabic
   route**, and **steps of its own** — an ordered route (learn networking → Security+ → labs → apply), each step
   pointing at a project or path if you like.
4. **Today says "A step towards …"** quietly under a task from a linked project (and an Arabic lesson keeps its own
   line from the route). "Towards", as the app says it everywhere.

## 3. What you see

- **Projects home, at the top:** **Your ambitions** — each as a short card (its title, what it links: "2 projects ·
  the Arabic route"), opening its page; **+ An ambition** (a name, and why it matters if you like). "One to three is
  plenty." With none yet, one quiet line offers to name one.
- **An ambition's page** (`#projects/a/<id>`):
  - its title and why (editable);
  - **Steps**, its own ordered route ("Learn networking", "Security+", "Home lab", "Apply"): add, reorder, tick when
    done, and point a step at one of its links if you like;
  - **What it links**, each with where it stands, in words: a project (its stage and next step), a Study topic or
    course ("3 of 8 tasks marked complete" and what's next), the Cybersecurity path (the path chosen, lessons done of
    its lessons, the next lesson), the Arabic route (your Arabic goal, the stage you're at, and what you'll be able to
    do at its end — from myday-5a's `arabicRoute`). Each opens where it lives. **Link** something: a project, a topic
    or course, the Cybersecurity path or the Arabic route; **Unlink**.
  - Delete (asked first; nothing it links is touched).
- **Today:** under a task from a project an ambition links — in today's plan, Due today and From your projects — a
  quiet "A step towards “Work in cybersecurity”" (two ambitions: both named). Today's Study card says the same under
  a lesson from a linked path, topic or course (a Cybersecurity lesson copied into Study counts its module's course and
  the Cybersecurity topic too).
- **A project's page:** under its title, "A step towards “Work in cybersecurity”", opening that ambition (with two or
  more, each named one opens its own page).
- No percentages, scores or streaks — words and counts, as the rest of MyDay.

## 4. How it works

- **Saved data (schema stays 5, the AGENTS.md exception):** a new section `ambitions: { items }`, one record per
  ambition in a new synced kind **`ambition`** (migration `20261101120000_sync_ambitions.sql`, built from the live
  lists, applied first with the owner's yes). An ambition: `{ id ('am'+uid), title, why?, links: [{ id, kind, ref? }],
  steps: [{ id, text, done?, linkId? }], createdAt, updatedAt }`. A link's kind is `project` (ref: the project's id),
  `topic` or `course` (ref: the Study id), `cyber` or `arabic` (no ref: whichever path or goal you've chosen there, so
  it never goes out of date when you change it). Read as written: a link or step of a kind this version doesn't know is
  kept; unknown fields kept. Limits: 12 ambitions, a title 120, why 400, 20 links, 20 steps (a step 160).
  1.117.0 keeps the section unread (it keeps unknown sections) and its sync ignores the kind.
- **Nothing is moved:** a project, topic or course doesn't know it's linked; a link whose item is gone says so ("No
  longer in Study") and can be unlinked; deleting a project leaves the link to say it's gone.
- **Rules** in `data/ambitions.ts` (adding, editing, linking, steps, what a task or project is a step towards); the
  Study, Cybersecurity and Arabic progress come from their own read-only functions, loaded lazily (never into Today's
  first paint).
- **AI:** nothing of an ambition is sent to AI (ai/reach.ts's never list); "Help me adjust today" sends tasks as
  before, without the line.
- `specs/arabic-route.md` option 3 is updated: Today's line now comes from Ambitions.

## 5. Checks

Rules (reading as written, limits, adding, links of each kind and unknown ones, steps and their order and links,
towards for a task, a plan copy and a project, two ambitions, a gone link); sync (records, the database accepts the
kind, two devices, the previous release keeping the section); browser (the strip, an ambition's page section by
section, Today's lines in the plan, Due today and From your projects, the Study card's line, a project's line, phone
390 px); live (a made-up ambition linking a made-up project and the Arabic route, its steps, Today's line, on two
devices; deleted afterwards).
