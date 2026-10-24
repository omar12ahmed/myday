# MyDay — new version (React + Vite + Tailwind + TypeScript)

**1.57.0 — Keep a word (Arabic):** under a lesson's examples (in its Understand step) and under a reading text,
**Keep a word** lists the words of each sentence. Tap one, give its meaning in your words (a starter word's meaning
is filled in, yours to change) and a note if you like, and it comes back in revision Arabic → meaning from the next
day, in "Revise Arabic" and the all-subjects round. **Your words** now heads the Vocabulary page: add a word you
type, "Also practise writing it" (meaning → Arabic), change your meaning or note, or remove a word (asked first). A
word you already keep is recognised ignoring vowel marks only; ة/ه, ى/ي and the hamza forms stay different words.
Your words and meanings are never sent to AI. The Study reset keeps your words, their revision starting again,
unless you tick "Also remove the words you kept". New optional `arabic.words`, synced as `arabic_word` (migration
`20261024180000_sync_arabic_words.sql`); saved data stays schema 5. Going back to 1.56.0 is safe: it keeps your
words unread and ignores the new records (checked with the actual previous release), but doesn't show them or bring
them back in revision. Three things to know: a device which spends time on the previous release receives other
devices' changes of that kind only when they next change (or when it signs in again); the same word kept on two
devices before they sync shows twice in Your words (remove one); and a Study reset done on the older release leaves
your words and their revision as they were.

**1.56.0 — Projects: Learning (Study links):** a project's Overview has a **Learning** card in its side column. Link
one of your own courses, a book in Reading or an Arabic lesson you're learning for the project, with an optional
"why it matters". Each shows Study's own status ("3 of 8 tasks marked complete", "Page 120 of 300", or the lesson's
state: New, Practised, Ready to move on, Holding or Needs revision), never a percentage, and opens it in Study.
Something removed from Study keeps its link, marked "No longer in Study"; Edit why and Unlink change only the
project. No schema, sync or database change: 1.55.1 keeps a project's links unread, so going back is safe, but it
doesn't show them, so update every device you use. Never sent to AI. Cybersecurity lessons and a "For your project"
line in Study come next.

**1.55.1 — One task, one tick:** ticking off a task from Your tasks on a day's plan (on Today, in the evening
check-in or by finishing its Study session) now marks the task itself done as well, dated that plan's day. Your week's
"What moved" counts project tasks ticked on Today, this week's count has each tick once, and unticking on the plan
unticks it in Your tasks too (before, a task ticked in Your tasks and unticked on the plan stayed done there).
"Start today over" keeps what you ticked off from Your tasks done, and says so; the plan's other ticks are cleared as
before. Ticks made before this release still show as done but aren't added to past weeks. No schema, sync or database
change: the task's own done flag and date have always been saved; going back to 1.55.0 is safe.

**1.55.0 — Cybersecurity lessons as a journey:** a Cybersecurity lesson is now one page in steps, as Arabic's are:
Warm-up (the previous lesson's knowledge check, from memory, once you've begun that lesson), Understand (the
explanation and worked example, then the assigned material), Try (Try it, Learn by doing in your lab notebook, the AI
practice cards, related practice and the tutor), Check (its questions with the answer guide on the page, and "Answer
in your lab notebook" to keep your answers) and Reflect (while the lesson's Study timer runs: finish in your
session). The session choice is Light / Normal / Deep over the lesson's own lengths and sets the timer; the
practical one is suggested only once you've begun the lesson, and the session you chose is remembered on this device.
Your step is kept on this device for the running session, with "I got distracted — help me restart", and the
explanation folds away while you check yourself. The answer guide now shows on the lesson page as well as in the
notebook, with the notebook's caveat: it's for after your own attempt. No saved-data, sync or database change; going
back to 1.54.0 is safe.

**1.54.0 — Projects: why this next step:** a project's Next step card has **Why this?**, folded as in Study. It says
whether you chose the step or MyDay picked it (the earliest date, the one added first when none has a date, or the
only task still to do), and names a waiting task that comes first and was passed over. When a step you chose was
done or let go in the last week, it says so first; nothing is added to Today by itself. "Or choose another next
step" now starts with **Let MyDay pick**, which hands your choice back and says what MyDay picks. A project's tasks
now follow the Tasks screen's order, so on a shared day a task with no time comes after timed ones and the next step
agrees with Coming up. No saved-data, sync or database change; going back to 1.53.0 is safe. Nothing is sent to AI.

**1.53.0 — Arabic lessons as a journey:** an Arabic lesson is now one page in steps: Warm-up (two questions from the
lesson before it on your path, from memory), Understand (the key ideas, the example with its voice, the explanation
and the worked example), Try (Try it with its explained answer, the practical task, the mini challenge, and "Say it
aloud, then compare" where the lesson uses listening or speaking), Check and Reflect (what you practised, then
finish). A step bar keeps them in reach; the session you choose decides which steps come first, and the rest are one
tap away, with everything else under "More about this lesson". Sessions are grouped as Light (revision and short),
Normal (practical) and Deep (standard and extended), with each lesson's real minutes, and a lesson you've practised
can now suggest Normal on a 30-minute day. While you check yourself the explanation folds away (you can bring it
back). Your place is kept on this device, so a lesson with a session open reopens at your step, Study home says where
you were, and "I got distracted — help me restart" offers one small thing to do there. Cybersecurity lessons follow.
No saved-data, sync or database change (the step you were on stays on this device, not in your data); going back to
1.52.0 is safe.

**1.52.0 — Projects: search one project:** every project page has "Search this project" under its tabs. Results show
above the tab, which keeps anything you were typing there, in a fixed order by kind: the project's name and own
words, its tasks (done and let go ones after the rest, marked), notes (private ones marked), milestones, decisions,
and a business idea's one page or a case's timeline, evidence and issues. Every word must appear, in any order;
capitals, accents and the kind of apostrophe don't matter. Opening a result goes to the item itself; Clear, Escape
or another tab ends the search. Nothing is saved, synced or sent to AI or anywhere else. No saved-data, sync or
database change; going back to 1.51.0 is safe.

**1.51.0 — Study: one focus, and a calmer Study home:** "Your focus" (Cybersecurity, Arabic or one of your own
courses) is now one choice, in Study settings and under Study home's first card, and Today's Study card and Study home
show the same next step with the same "Why this?". Study home has three levels: Now (your focus's next step, or the
session you're in), Worth a look (at most three gentle offers, such as revision ready, a session left open in another
subject or an Arabic lesson that needs revision; none when there's nothing) and Explore (your map, then Arabic,
Cybersecurity, your topics and Reading as tiles with counts, never percentages). The roadmap, concepts, progress and
settings are folded under Manage, and setting up your own courses moved behind a "Your own courses" tile. Arabic's
"revision first" step says "Revise Arabic" on both screens. A course is labelled your focus only while your focus is
your courses; one you choose that has no tasks yet stays your focus, offering a session. No saved-data, sync or
database change (the choice uses the existing subject and pinned-course fields); going back to 1.50.0 is safe, though
its Study home shows your pinned course whatever your focus.

**1.50.0 — Waiting on someone or something:** a task can be waiting on someone or something, with an optional
expected date, set on its page or in "What's getting in the way?". MyDay doesn't pick a waiting task as a project's
next step or offer it for Today (one you chose stays, labelled). From the expected day Worth a look offers **Chase
it**, which asks when (today, tomorrow, a day you pick or no date) and adds one 5-minute "Chase: …" task. The weekly
review's "What's waiting" is now **What needs you**, so "waiting" means one thing. No schema, sync or database
change: 1.49.0 keeps a task's wait unread, so going back is safe, but it doesn't show it, so update every device.
Who you're waiting on is never sent to AI.

**1.49.0 — Sayings, and more room on Today:** each screen shows one quiet saying chosen for where you are: Today
(gentler ones on a rest day or when your energy is 1 or 2), Study, Finance, Projects and Your week. It stays the
same all day and changes on most days. Arabic verses are shown fully vowelled above their English; a saying that is
only commonly attributed says "attributed to", a well-known rendering says "(paraphrase)", and two short lessons
come with their meaning (the one on resistance credited to Steven Pressfield's The War of Art). "Sayings: On/Off" in
the footer hides them on this device only (`myday.sayings`; not part of your data, not synced or exported). On wide
screens Today no longer shows a month calendar: the side column (focus timer, today and this week, the day at a
glance, learning days) now starts beside the greeting. Phones keep this week's strip. No saved-data, sync or
database change; going back to 1.48.0 is safe.

**1.48.0 — Projects: the outcome, what counts as finished, and Where I left off:** a project can say what it's
aiming for (a line under its title) and what would count as finished (in About it), and keep one short note for next
time, "Where I left off", which sits at the top of its Overview with the day it was written. All three are optional,
written in About it, and never sent to AI. No schema, sync or database change: 1.47.0 keeps the new fields unread,
so going back to 1.47.0 is safe, but it doesn't show them, even on its sync-conflict screen, so update every device
you use.

**1.47.0 — adaptive Study (Arabic):** a finished session is practice, not "done". Each lesson is New, Practised,
Ready to move on (your tap), Holding (its checks recalled on your own a week or more later) or Needs revision (your
flag, or a check that slipped). After seeing a reference answer you can mark how it went; finishing suggests "Looks
ready to move on" only when every check was right on your own, and you decide. Checks that haven't clicked come back
the next day, and a lesson's checks a week after Ready, at most 8 new cards a day. One next step on the map, lesson
pages and Today, with "Why this?", catch-up only to real content (never a portfolio or checkpoint), and a shorter
session suggested on a low-energy day. Older sessions count as Practised, with a one-time offer to mark lessons
ready. New optional `arabic.lessons`, synced as `arabic_lesson` (migration `20261024120000_sync_arabic_lessons.sql`);
saved data stays schema 5. Going back to 1.46.1 is safe: it keeps the lesson places unread and ignores the new
records (checked with the actual previous release), and its next step goes back to finished sessions. Two things to
know: a device that spends time on the older release and then updates again receives lesson places changed on other
devices meanwhile when they next change (or when it signs in again); and a Study reset done on the older release
leaves lesson places as they were.

**1.46.1 — Start, then continue:** Today's Study card said "Continue learning" even when nothing had been begun
(for example after a fresh start). Until you've begun a subject (an Arabic session; a Cybersecurity attempt, session
or ticked task; a session or ticked task in your own course) it now says "Start learning — Your first lesson is
ready", and the lesson's button says "Start lesson". After that it says "Continue learning" as before. No
saved-data, sync or database change; going back to 1.46.0 is safe.

**1.46.0 — Projects Overview, next step first:** a project's Overview now opens with its Next step, with Worth a
look beside it. At a glance shows each tool's summary once, one row per tool, and the tile strip and the separate
Milestones, Decisions, one-page, case and How it's going cards are gone. A task still to do after its date now leads
Coming up as "Still open · was due Wed 21 Oct" until it's done or let go; the Next step card says the same when it's
that task, and Worth a look points at another one on an active project. No red, no "overdue". No saved-data, sync or
database change, and Ask MyDay sends the same; going back to 1.45.2 is safe.

**1.45.2 — Study counts, never percentages:** Study's completion line now reads "2 of 5 tasks marked complete"
instead of "2 of 5 tasks complete (40%)", on Study home, the roadmap, topics, courses and Progress. The note that it
counts ticks, not how well you know them, and the bar stay. The classic MyDay keeps its own wording. No saved-data,
sync or database change; going back to 1.45.1 is safe.

**1.45.1 — Arabic corrections:** the Arabic curriculum is version 1.1.2, with errors fixed from a review of every
Arabic item (23 October 2026). These include a mis-vowelled word (مُلَاحَظَات), a missing فَـ before a سَـ
result, the Form II and diptote rules, a B2 example (وِجْهَةَ النَّظَرِ), a hamza seat (أقرؤه) and the relative
clause after an indefinite noun. Check prompts are vowelled or reworded where they could mislead. Answers accept more
correct alternatives, three reading texts are reworded, and transliterations gain helping vowels and consistent
prefixes. IDs and question meanings are unchanged, and earlier sessions keep their curriculum version. The six
clips whose sentences changed were replaced. With five earlier holds retaken, 16 new clips were transcribed blind
and listened to ("all fine"): 654 checked clips ship and none are held. No saved-data, sync or database change;
going back to 1.45.0 is safe.

**1.45.0 — the open paper workspace:** a calmer redesign of every screen (details under "Design" below). The page
is a low-chroma sage paper (#f4f5f2; dark mode a neutral charcoal, #151716), with flat panels, smaller corners and
teal kept for key actions, next steps and where you are. Wide screens use a 12-column grid: Today puts the plan in
eight columns and supporting information in four (seven and five on smaller laptops); the header, with Capture,
stays at the top while the page scrolls; and the 224 px sidebar, which scrolls on short screens, groups Your
workspace with task and note shortcuts and What MyDay has noticed / knows. Phones get an opaque bottom bar with six
labelled sections and a round Capture button above it; tab rows wrap rather than hide a tab. Disabled buttons have
no fill and a dashed outline, so they don't look like buttons that work. An active or
paused Study session sits right above Today's plan; otherwise the Study card stays with the other reminders, and it
remains always available as in 1.43.0. No saved-data, sync or database change; going back to 1.44.1 is safe (only
the look returns). The installed Android app keeps its own splash and status-bar colours until it is next rebuilt.

**1.44.1 — decisions when saving is blocked:** where the browser blocks storage (changes last until the page
closes), Decide, Think again, Remove option and Remove decision did nothing in 1.44.0. They now use the same save
path as every other edit: still refused when saved data can't be read or another tab saved first, and the previous
choice is kept if saving fails. The docs now say that removing or reordering a milestone, decision or Case item
also rewrites the positions after it, so editing one of those on another device at the same time is a conflict to
choose, not a merge. No saved-data, sync or database change; going back to 1.44.0 is safe.

**1.44.0 — project storage and choice history:** projects now sync as separate items, so their total can exceed
512 KiB. Each item retains the existing database limit, with a 380,000-byte editing allowance. Independent item
edits merge; editing the same item and deletion races retain version conflicts. Previous choices keep their
label, reason and original day, with no automatic history pruning. Decisions allow ten pros and ten cons per
option; Ask still sends only the first six per side and excludes reasons/history. Capture requires a fresh preview
after external data replacement. Failed saves retain the existing snapshot and project addition drafts.

The matching classic app and React app use schema **5** under the unchanged `myday.data.v4` key. They read
version 2–4 data and exports; saving writes version 5. Previous releases refuse version-5 data without changing
it. Keep device exports before returning to an older release. After the split-project migration, old clients
cannot cloud-sync. [Migration, recovery and rollback](../supabase/PROJECT_STORAGE.md). R2 uploads and automatic
backups remain separate work.

<a id="guided-study"></a>

**Guided Study (1.43.0 · 22 October 2026).**
Today offers a direct next lesson for Cybersecurity or Arabic, plus unfinished saved courses when available.
An active Study session takes priority. **Choose another subject** and the **Default learning subject** setting
save your preference; recent activity does not silently switch it. Recommendations resume current saved attempts
or follow the selected curriculum's required lesson order, using your recorded completion. Completing an activity
does not by itself complete a Cybersecurity lesson, and finishing practice does not establish verified mastery.
After finishing a lesson, the next-step link offers the next lesson, a saved session, or a revisit when the path is complete.
A general-course check-in continues that session's course first; if it is finished, the fallback names the actual course.

A new Cybersecurity learner can choose **Start this lesson** without first importing the path manually. The selected
path and its study session are saved together; a failed save adds neither and leaves existing work unchanged.

**Reset Study progress** in Study settings removes task completion marks, Study
sessions and their check-ins, Arabic answers and practice attempts, Cybersecurity notebook attempts and evidence,
and revision history; concept and revision-card schedules start afresh. The course outline, concept questions,
revision cards, separate notes, selected paths and other MyDay sections remain. A reset can synchronise to other
devices. First download a complete MyDay backup, save and check the file, then explicitly confirm that check in
MyDay. Requesting a download alone does not enable reset. Any saved-data change, including an incoming sync
change before or during confirmation, requires a fresh checked backup. Success is shown only after the reset
has been saved locally; a failed save leaves progress unchanged. The backup can restore the removed work through
**Import my data**. Local targeted checks passed across 15 suites (1,394 checks), including the disposable
two-device reset/restore flow; CI passed 10 suites (852 checks). No full rerun was needed.
The live-service check passed 39 checks on two isolated devices using one disposable account, including
delete propagation and importing the downloaded backup. The account was restored to its original test data.
After publishing, 37 smoke checks passed on two disposable accounts in isolated desktop/phone browsers;
both learning-data copies stayed byte-identical.

No database migration or server deployment is needed. Going back to 1.42.1 keeps the existing record shapes,
but the older version drops the new default-subject setting, so it returns to Cybersecurity on upgrade.
Rolling back the code cannot undo a reset: use **Import my data** with the checked pre-reset backup to recover the work.

Explore (local implementation): projects now offer **Explore this idea**, opening a dedicated narrative at
`#projects/p/<id>/explore`. The curated exploration of the owner's Hargeisa Marketplace project (being researched,
not a demo) has seven scenes, with a typed and validated content contract, optional GSAP motion, and an explicit
action that creates a normal project task. Other projects get a starting brief, with a link to see how Hargeisa
Marketplace is explored (shown for reference; the project is unchanged). No AI generation or new saved-data schema.
See [`EXPLORE.md`](EXPLORE.md) for the architecture, file inventory, calculations and limitations.
The Phase 2 visual upgrade uses six locally stored photographs, spatial process drawings and layered
architecture/economics storytelling, with each section arriving as it scrolls into view. See
[`EXPLORE_PHASE2.md`](EXPLORE_PHASE2.md) for the changes, performance and visual verification. The photographs
are openly licensed (Pexels and Wikimedia Commons), credited in each caption; their provenance is in
[`EXPLORE.md`](EXPLORE.md#asset-provenance). Existing routing, storage and calculations are preserved.

Cybersecurity in Study (1.14.0): Study now includes the supplied 27-module package,
path import, lesson/lab/project pages, evidence notebook and optional AI explanations. See
[`../CYBERSECURITY_INTEGRATION.md`](../CYBERSECURITY_INTEGRATION.md) for the architecture review, scope,
data model, validation and required backend deployment order. Builds validate the canonical package with
Python 3 before generating the catalogue. This does not implement verified mastery or automatic advancement.
The Practice shelf adds 12 free-first external assignments (including specific TryHackMe rooms and Academy
labs) and three local interactives. Each records resumable attempts through the existing notebook; no API
keys or MCP connection are required. Provider completion is self-reported. The separate activities JSON
is validated at build time, including lesson mappings, allowed provider URLs and free alternatives.

Arabic Fuṣḥā in Study (part 1, reading only): the supplied package in `../content/arabic-fusha` (30 modules,
152 lessons) is validated with its own Python checker on a temporary copy, so builds never change it, then split by
`scripts/prepare-arabic.mjs` into a small course map, one file per module (loaded when opened) and the reference
answers (loaded only when asked for). `#study/arabic` has the learning map by level, module and lesson pages,
16 original reading texts (with and without vowel marks) and 48 starter words. Arabic is marked `lang="ar"
dir="rtl"`, in Noto Naskh Arabic (`@fontsource-variable/noto-naskh-arabic`, downloaded only when Arabic shows);
Arabic inside English sentences is isolated with `<bdi>`. No level is awarded. A synthesised voice covers the 48
starter words and their examples (1.39.0) and lessons' headline examples (1.40.0); reading-text audio arrived in 1.41.0.

Part 2, your sessions: a lesson session saves what you did, never a score — the lesson, session length, start and
finish, help used, what you practised (ticked by you; listening and speaking are never assumed), your first answers
to the checks (kept as written once you look at the reference) and a "revisit" note, with the curriculum version.
Saved as the new-app-only top-level section `arabic` (`src/data/arabic/`: types, cleaning, sessions); the classic
MyDay keeps it unread. The map shows places (unexplored, exploring, visited) and your next small step along the goal
you choose (since 1.47.0 worked out by adaptive Study, Part 4); "Your sessions" lists them all. Synced as `arabic` (the goal) and `arabic_attempt` (one per session) —
migration `../supabase/migrations/20261011120000_sync_arabic.sql`, applied at release with my go-ahead. Fields a
newer MyDay adds to the section are kept as they are, so going back a version never loses them.

Part 3, revision: starter words and lesson checks come back in Study's revision — a word from Vocabulary ("Add to
revision", or "Add the next 5"; recognising it first, writing it from memory as a second card you add; a gentle note
after 8 new words in a day, never a block), a lesson's checks from the lesson ("Bring these checks back in
revision"). Each first comes back the next day. Since 1.47.0 some lesson checks also come back by themselves (Part 4). They're in the same rounds as your concepts
(Study's revision, Today's Study card; "Revise Arabic" on the map for a round of Arabic alone), scheduled by the
same rules, with "slipped" / "hasn't clicked yet", help after a wrong answer and the stop after 10 a day counting
both. You compare your answer yourself, with the reference and the course's "what also counts": MyDay never marks
Arabic (the course says its answers are examples, never to be exact-matched, and vowel marks are optional unless
the question is about them). Listening and speaking stay untested. Saved as `arabic.cards` — only the course's id
(`lexeme.…:recognise` / `:write`, or a check question's id), the day added and the schedule
(`src/data/arabic/cards.ts`); answers go into `study.reviews` like a concept's (`rateItem` in
`src/data/study/revision.ts`), which the classic MyDay already keeps. One queue for both: `src/data/study/queue.ts`.
The revision screen asks either through one description of a question (`Asked` in `src/study/RevisionView.tsx`);
Arabic cards load their words, checks (`checks.json`, from `scripts/prepare-arabic.mjs`) and answers only when a
round reaches one (`src/study/arabic/ArabicQuestion.tsx`). Synced as `arabic_card`, one per card — migration
`../supabase/migrations/20261012120000_sync_arabic_cards.sql`, applied at release with my go-ahead.

Part 4, adaptive Study (1.47.0, `../specs/adaptive-study.md`): a finished session is practice, never by itself
"done". Each lesson has a place in words, never a score: **New**, **Practised** (a finished session), **Ready to move
on** (your tap), **Holding** (every one of its checks recalled on your own in revision 7 or more days after Ready) or
**Needs revision** (your own flag with what needs work, or a check that slipped after Ready; a slip clears when you
recall it on your own). After looking at a check's reference answer in a session you can mark **How did it go?** in
revision's words (optional). Finishing says "Looks ready to move on" when every check was Right, on my own, or
"Practised" otherwise, and you choose: Ready to move on / Ready anyway / Needs revision… / Not yet. Checks marked Not
right or Not sure come back the next day by themselves ("Don't bring them back" takes them out); marking a lesson
ready brings all its checks back a week later (the delayed check). At most 8 cards a day come back for the first
time by themselves; your own additions are never delayed. The next step (on the map, the lesson page and Today's
Study card) is one suggestion with a **Why this?**: resume an open session; revisit a lesson that needs revision when
the next lesson builds on it (content prerequisites only: checkpoints such as the B1 portfolio are never catch-up,
`../content/teaching/arabic/prerequisite-kinds.json`); revise what's due; otherwise the first New or Practised
lesson. Its length comes from Study's own suggestion (energy and free time): the short or revision session when the
standard one doesn't fit, with the full lesson one tap away. Lessons with sessions from before 1.47.0 count as
Practised, with a one-time offer to mark any ready (device-only key `myday.arabic.readyOffer`). Rules:
`src/data/study/mastery.ts` (shared, no subject in it); Arabic records: `src/data/arabic/lessons.ts`; the next step:
`src/study/arabic/plan.ts`. Saved as the optional `arabic.lessons` (one per lesson: the Ready day, the flag, your
latest mark per check) and synced as `arabic_lesson` — migration
`../supabase/migrations/20261024120000_sync_arabic_lessons.sql`, applied at release with my go-ahead. Older releases
keep `arabic.lessons` unread and ignore the record kind (`tests/app-sync-previous.test.js` checks the actual previous
release). A Study reset clears lesson places too.

Keep a word (1.57.0, Arabic): under a lesson's examples (its Understand step: the headline example and the Arabic of
its worked example) and under a reading text (one picker, sentence by sentence), **Keep a word** lists the words
(punctuation left out, vowel marks as written). Tap one, give its meaning in your words (a starter word's meaning is
filled in, yours to change) and an optional note; nothing is saved until "Keep it". It comes back in revision
Arabic → meaning from the next day, in "Revise Arabic" and the all-subjects round. **Your words** heads the
Vocabulary page: add a word you type, "Also practise writing it" (meaning → Arabic, from the next day), change your
meaning or note, or remove it (asked first; its past answers stay in your Study history). A word you already keep is
recognised ignoring vowel marks and the tatweel only; ة/ه, ى/ي and the hamza forms stay different words. Your own
words are never held back, but they count when MyDay places the checks it brings back by itself (8 new a day). Your
words and meanings are never sent to AI, so revision has no AI "another way" for them. A Study reset keeps your
words with their revision starting again, unless you tick "Also remove the words you kept". Rules:
`src/data/arabic/words.ts`; the button and picker: `src/study/arabic/KeepAWord.tsx`. Saved as the optional
`arabic.words` (each word's id, the Arabic as written, your meaning and note, the lesson or text it came from, the day
added and its two schedules; answers in `study.reviews`) and synced as `arabic_word` — migration
`../supabase/migrations/20261024180000_sync_arabic_words.sql`, applied at release with my go-ahead. Older releases
keep `arabic.words` unread and ignore the record kind (`tests/app-sync-previous.test.js` [7] checks the actual
previous release).

Cybersecurity in revision (the course's own checks, no AI): every lesson's knowledge-check questions (146 lessons,
292 questions, each with the course's reference answer) can come back in Study's revision — from the lesson page or
the knowledge check itself ("Bring these checks back in revision"), never by themselves, first back the next day, then
by Study's rules, in the same rounds as everything else, or alone with "Revise Cybersecurity" on the map. You compare
your answer with the reference yourself. Saved as `cybersecurity.cards` (the question's id, the day added, the
schedule: `src/data/cybersecurity/cards.ts`); answers in `study.reviews`. The questions for revision are a small file
(`src/study/cybersecurity/checks.json`, from `scripts/prepare-curriculum.mjs`), loaded only when a round reaches one
(`src/study/cybersecurity/CyberQuestion.tsx`). Synced as `cyber_card` — migration
`../supabase/migrations/20261014120000_sync_cyber_cards.sql`, applied at release with my go-ahead. The section keeps
fields a newer MyDay adds, so going back a version never loses them.

More practice (AI-written cards, AI roles step 3 part B): on a Cybersecurity lesson, "Make practice cards" asks the
AI server for up to 10 cards on the lesson's key ideas — one model writes them, the other checks each one, and only
cards the checker keeps come back (`src/study/cybersecurity/AiCards.tsx`, `src/ai/cards.ts`; the server's job in
`../supabase/functions/_shared/ai/cards.ts`). Sent: the lesson's id and the questions you already have for it (the
course's, and AI cards you kept), so new ones don't repeat them — nothing else. The app checks every card again (its
shape, a multiple-choice answer that is the marked option, the checker's "keep", not a repeat), shows them with who
wrote and who checked them, and adds only the ones you leave ticked, as Study concepts due the next day, options in a
fresh order, with one step of Undo. Each keeps where it came from: `origin` on the concept (`{ by: 'ai', subject:
'cybersecurity', lessonId, writer, checker, edited }`, kept by both versions; `edited` once you change its question,
answer, explanation or options) and the same in words in its `source`. They count in "Revise Cybersecurity" too.
From 1.19.1 both versions also keep origins for other subjects (`subject` a plain word, e.g. `note`, with up to 12
short plain fields), so cards from your notes — and later sources — survive a device or version that predates them.

Revision cards from a note (AI roles step 3 part C, 1.20.0): with "AI help with notes" on, a note (never a private
one) offers "Make revision cards" (`src/notes/NoteCards.tsx`, `src/ai/noteCards.ts`; the server's jobs in
`../supabase/functions/_shared/ai/note-cards.ts`). The note's lines (blank ones dropped, a long paragraph split into
sentences; at most 60 lines, 6,000 characters) go to a check that flags doubtful ones with a reason — left out unless
you tap "It's right, use it"; nothing doubtful and it goes straight on. Then only the lines you kept go to the writer,
each card naming its lines, and the other model checks every card (correct by sound knowledge even where the note
says otherwise, and supported by its lines). The app checks every card again and adds the ones you keep, due the next
day, with Undo; origin `{ by: 'ai', subject: 'note', noteId, writer, checker, edited }` and "AI-written from your note"
in the source. Your note is never changed; if it changes after its check, it asks you to check again. Models chosen by
evaluation (`../ai-eval/reviews/2026-10-14-note-cards-quality.md`): Gemini checks the note, GLM writes, Gemini checks.
Which model writes and which checks is the server's configuration, chosen by evaluation
(`../ai-eval/reviews/2026-10-13-cards-quality.md`). Shown only when the app is built with AI help.

Explain it another way (AI roles step 4, 1.22.0): under every revision question once its answer is shown — your
concepts, Cybersecurity checks and Arabic cards — "Explain it another way" asks the AI server for a fresh explanation
from a different angle (`src/study/AnotherWay.tsx`; the server's jobs `explain` and `explain-arabic` in
`../supabase/functions/_shared/ai/explain.ts`). Only on your tap; sent: the question, its answer and explanation (and
the options, for multiple choice) and your own answer — nothing else. It's shown labelled as AI-written, by which model,
and not checked by your course. "Keep this explanation" saves it on the card (`anotherWay`: its text, the model, the
day — kept by both versions since 1.20.2), shown there next time until you remove it; your answer and the schedule are
untouched. Models chosen by evaluation (`../ai-eval/reviews/2026-10-16-explain-quality.md`): GLM explains Cybersecurity
and your concepts, Gemini explains Arabic. Shown only when the app is built with AI help.

Ask MyDay (the AI design's step 1, 1.25.0): in the + Capture sheet, below the suggestions worked out on the device,
**✦ Ask MyDay** is for what they can't do — a question, a breakdown into steps, several things at once. Only on your
tap, and a preview shows exactly what goes with it from the page you're on — the values themselves ("Course: …", "Next:
…", "Energy 2 of 5", "Free time 2 h 30 min"), with "Show everything that's sent" for the full list, built from the very
request that would be sent (`src/ai/askContext.ts`): what you typed, the date, the page and its small slice — today's
plan, energy, free time and tasks due on Today; the current course and next task, energy and free time on Study; a project's name, summary, stage, tasks and note titles (their text only with "AI help
with notes" on); the open note; the open task; today's appointments on the Calendar; open projects' names; never a
private note, and only the page's name from Health and Finance. The server's job `ask` (GLM, the main model;
`../supabase/functions/_shared/ai/ask.ts`, instructions versioned by `ASK_PROMPT_VERSION` there) answers with one kind: things to add (tasks,
notes, appointments, a project), steps, a short answer with at most one action (start a short study session; or, for
"plan my day", open Help me adjust today already filled in — `src/ai/handover.ts`), or "MyDay can't do that from here".
The app checks it all against your data (`src/ai/ask.ts`: real ids only, days from today on, an appointment only with
a day and a time, 5–120 minutes, gentle wording, anything already on your lists or today's plan left unticked) and
shows cards to tick, rename and edit — a day and time, the length and list, a note's text — checked by the same rules
(`src/capture/AskPanel.tsx`); Add saves them at once through the same rules as Capture,
with one step of Undo. One follow-up ("Not quite? …") at most; nothing of the conversation is kept. Evaluated on 40
synthetic requests (`../ai-eval/reviews/2026-10-17-ask-quality.md`). Shown only when the app is built with AI help.

**Planning a Study course with Ask (1.26.0):** a course page has **✦ Plan this course with Ask**, which opens + already
filled in ("Break this course into study tasks"; `src/capture/openCapture.ts`). From a course page Ask sends the
course's outline — its modules, sections and tasks: titles, lengths, kinds and done or not, no links or notes, cut to
12 modules, 30 sections, 80 tasks and about 9,000 characters (shown first in the preview). It proposes up to 12
**study tasks**, each into one of the course's sections or a new named section (in one of its modules or a new one),
labelled as general knowledge to check against the course. The app checks them against the real outline: a section or
module named like one the course already has is that one, a section that isn't there becomes a new one, a task the
course already has is left unticked, 5–120 minutes; Add puts them into the course on your roadmap in one save (it
syncs with the roadmap), with Undo that also takes back the sections and modules it made. Edit: the length and kind.

**Revision, changes and What MyDay knows (1.27.0):** Ask (instructions `myday-ask-v12`) can **start a revision round**
when something is due ("Revise 3 cards now" — Today and Study send how many cards are due; a round is at most 5; one
subject when you ask about it), and can **change what's already saved** on the page you asked from: a task's day and
time, title, length, list or project; an appointment's day, time or title (its length kept); a note's title or project.
Each change is a card showing before → after, ticked to apply (**Apply**), with Undo putting back exact copies of
everything touched. The app checks every change (`src/ai/ask.ts`): only things the page sent (their ids), not a done
task or a private note, days from today on, an open project, only real changes — and a task's list, length or title
only when what you typed asks for it (the page never sends a task's list; anything else is left out and said). Ask
never deletes or ticks anything off. Today's plan has **one quiet line** above it, only when it helps — "About 2 h
planned · 1 h 15 min free — it's fine to leave something for tomorrow", "…your energy has room for one; the rest can
wait", or "…first: Pay council tax (due today)" (`daySummary` in `src/data/today.ts`; on the device, never a score).
**What MyDay knows** (`#knows`, `src/knows/KnowsScreen.tsx`; from Ask's preview and the footer): what each page sends
to Ask (in the preview's own words — `SENDS` in `src/ai/askContext.ts`, so they can't drift), what the other AI help
sends, what MyDay keeps about how you work (your name and preferences, with a link to change them), the AI help with notes switch, what's never sent (private notes, your name and email, preferences and patterns,
Finance and Health records), that the AI remembers nothing, which model does which job, and the limits. Evaluated on 12
more synthetic requests (`../ai-eval/reviews/2026-10-17-ask-quality.md`).

**Breaking a task into smaller steps (1.29.0):** on a task's page, **✦ Break into smaller steps** (shown only when the
app is built with AI help, and not on a done or let-go task) opens + already filled in ("Break this into smaller steps";
`src/capture/openCapture.ts`), as the course page's button does. Nothing is sent until you tap Ask MyDay, and the
preview shows the task's title, date, length and notes, with your open projects' names. Ask returns up to 8 small
steps, the first the easiest, and the app checks them (`src/ai/ask.ts`, `checkAskReply`): they go in the task's own
list and its project (if it's in one that's still open), whatever was suggested; a step with the same title as
something on your lists starts unticked, and a line under the cards says where they'll go (`src/capture/AskPanel.tsx`).
Add saves the ticked steps as tasks in one go, with one step of Undo. The task itself is never changed; tick it off
yourself once its steps are done.

**The Projects board and Recently (1.30.0):** on Projects, active projects sit in three columns (Ideas, Exploring and
Doing) by the stage they're at, and one tap moves a project along or back. A project's page shows **Recently**, the
last five things that happened to it (tasks added or done, notes written or changed), newest first, each opening what
it's about. Both are worked out from what's already saved.

**Milestones and Decisions (1.31.0):** a milestone is reached with a tap ("Not yet" undoes it), can be renamed, moved or
given a date to aim for, and is removed only after asking. A decision's options sit side by side (stacked on phones).
**Choose this** asks "Why this one? (optional)" before **Decide**; the others stay, marked "Not chosen". **Think again**
reopens it with everything kept, and at the Decide stage the project can be moved to Doing, but only on your tap.
Both lists are saved inside the project (`milestones` and `decisions`, `src/data/projectPlan.ts`), so they sync with
it and need no new record or database change; a project without them is saved exactly as before. Recently lists
milestones reached and decisions made, and Ask MyDay doesn't send them. No AI is used.

**AI help with milestones and decisions, and private projects (1.32.0):** on a project's **Milestones** tab, **Suggest
milestones** offers 3–6 milestones in order, none repeating yours, with a date to aim for only if you gave one. On an
open decision, **What am I missing?** appears once you've written a pro or con yourself, and offers pros or cons for
its options (each labelled for its option) or one more option. It never chooses, ranks or scores: a reply that picks
an option is reworded, and the panel says so. Both go through Ask MyDay, only on your tap: **+** shows exactly what's
sent first, suggestions come back as cards to tick, and Add saves them under the same rules and limits as adding them
yourself, with one step of Undo. A **private project** (switched at the top of its page; a lock marks it on the board)
sends nothing to Ask MyDay: not its name, summary, milestones, decisions, tasks, notes or appointments. The preview
says how many items were left out, and its AI buttons give way to "Private project — AI help isn't offered here." AI
help with notes may still offer its name and summary as a place to link a note, if you choose. The flag is an optional
`private` on the project (`src/data/projects.ts`), synced with it.

**The Business template (1.33.0):** when you start a project you choose its kind, General or Business idea (General
unless you pick otherwise). You can change it later under About it → Edit ("Kind of project"). Switching back to
General keeps the one page out of sight, never deleted; switching back shows it again. A new business idea opens on
its **Model** tab (**Overview · Model · Milestones · Decisions**), headed "Your business on one page", with four
simple questions in your own words: What problem does it solve? Who is it for? How does it work, and how does it pay?
What must be true for it to work? The fourth is a list of up to 12 things you believe but haven't checked yet. Each
one has **Find out**, which adds a task "Find out: …" (15 minutes, no date) to the project's tasks; a next step you
chose stays as it is. You mark it **Looks true** or **Doesn't hold** yourself (Edit can set it back to Not checked
yet) and can add what you found. Nothing is marked by itself; when a Find out task is done and it's still not checked,
it asks "what did you find?". Overview's "Your one page" card gives counts only, e.g. "3 of 4 questions answered · 2
still to check · 1 looks true" (since 1.46.0, At a glance's "Your one page" and "What must be true" rows).
Recently lists what you found out, and the board labels business cards "Business
idea". Explore for a business idea is built from the one page (its last chapter offers the same Find out task, never a
second one), and each links to the other. Ask MyDay and AI help with notes send nothing from the one page, and no AI
is used. It's saved inside the project (`template` and `model`, rules in `src/data/businessModel.ts`); a general
project is saved exactly as before.

**AI help on the one page (1.34.0):** on a business idea's **Model** tab, under the fourth question, **Suggest what
must be true** asks Ask MyDay for up to five things your idea may depend on, only when you tap it. It's offered once the
first three questions are answered (until then a quiet line says so), never on a private project (its usual note
instead), and not once the list is full (12). Only from the Model tab, Ask sends the project's usual slice and its one
page: your three answers, and what must be true with how each is turning out — never what you found. From the
project's other tabs, nothing of the one page is sent. Ask's preview shows it ("One page: 3 answers, 2 things that
must be true"), and What MyDay knows says so. Suggestions come back as cards to tick, each "on your one page, not
checked yet"; MyDay checks each one itself (this business idea only, at most 110 characters, not a question, not
already on your list in any state, within the 12). Add puts the ticked ones on your list as Not checked yet, with one
step of Undo. It never marks anything and never says whether the idea will work: a reply that judges it is reworded
("Here are a few things your idea may depend on — yours to check."). Instructions `myday-ask-v14` on GLM-5.3-Flash,
evaluated on six made-up business ideas (18 live calls, about US$0.01). No saved-data change.

**The Case template (1.35.0):** a project can be a **Case**, the third kind in Start a project (General · Business
idea · Case) and in About it → Edit → Kind of project. A case starts like any project, Private off until you switch it
on. Its tabs are **Overview · Timeline · Evidence · Issues** (only four fit on a phone); its milestones and decisions
open from Overview (since 1.46.0, from its At a glance rows), and there's no Explore link.
**Timeline** lists what happened in date order,
grouped by month. Each entry has a date ("About this date" if it's approximate), what happened, optional details, and
where it comes from: **My account**, **Their account** or **In the evidence**, so the three never blur. Each can link
to evidence and issues. **Evidence** records what it is, its kind (document, email or letter, message, photo or
recording, witness, other), an optional date, where it's kept (a folder or link; MyDay doesn't store files) and notes.
Its status is **To get**, **Have it** or **Reviewed**, changed with a one-tap "Got it" or "Reviewed", and a filter
shows counts. **Issues** are what you're claiming or considering, each marked **Considering**, **Claiming** or
**Dropped**, with "What I need to show". Each lists its linked evidence and timeline entries, and "Nothing linked yet"
shows the gaps. **Deadlines** are the case's dated tasks and appointments: "Add a deadline" on Overview's "Your case"
card (since 1.46.0, in Coming up) adds a dated task, so it reaches Today and Coming up as usual, and the card leads with
"Next date". MyDay never
works out legal time limits; you enter the dates. The "Your case" card gives counts only (e.g. "3 timeline entries · 2
pieces of evidence (1 to get) · 2 issues"; since 1.46.0 in At a glance's rows) and says:
"MyDay helps you organise your case. It doesn't give legal advice
or say whether a claim will succeed — ACAS or Citizens Advice can help with that." **Privacy:** a case's Private
switch works as for any project — while it's on, Ask MyDay sends nothing of it, and AI help with notes can still
suggest it as a place for a note by its name and summary. A case's timeline, evidence and issues are never sent to AI,
private or not. No AI is used in this release. Limits: 150 timeline entries, 150 pieces of evidence and 20 issues.
Since 1.44.0, the 380,000-byte editing allowance applies to each split item; the whole project can exceed 512 KiB.
Saved data: two optional fields inside the project, `template: 'case'`
and `case`, with the rules in `src/data/caseFile.ts`, synced in the existing project record. Going back to 1.34.0 is
safe: checked with 1.34.0's own code (5/5) and its built app (5/5), which keep both fields.

**At a glance (1.36.0):** every project's Overview now starts with **At a glance**, worked out from what's already
saved, so nothing new is stored. Each kind has four tiles, and each one is a link to where you'd act. A **General**
project shows Next step, Next date, Milestones ("2 of 5 reached", "Next: …") and Decisions. A **Business idea** shows
Next step, Your one page ("3 of 4 answered"), What must be true ("2 to check · 1 looks true") and Milestones. A
**Case** shows Next date, Evidence to get, Issues with nothing linked and Timeline entries. Pictures appear only when
there's something to show, and never as an empty chart: milestones as stations on a line (reached, the next one, the
rest); what you did in the last 8 weeks (tasks done, milestones reached, decisions made, and things found out or
recorded) as small columns you can hover or focus to read; a business idea's What must be true in three counts; a
case's evidence by status (one bar in three teal steps, with a legend naming and counting each), its issues and what's
linked to each ("nothing linked yet" shows), its timeline entries by month, and its next dates. **Worth a look** gives
at most three gentle pointers from real data: a date within the next week, a Find out task that's done, one-page
questions still to answer, issues with nothing linked, evidence still to get, or no next step yet (since 1.46.0, the
tiles are At a glance rows, Worth a look sits beside the next step and no longer says "no next step yet"). It never says
"overdue" or "late", and it never gives percentages or scores. **Summarise this** opens Ask MyDay with "Summarise
where this project is, and the one next step", only on your tap and never on a private project. It uses the project
page's usual preview (for a case, its tasks, milestones and note titles, never its timeline, evidence or issues). The
`ask` job's instructions are now `myday-ask-v15`: a summary says only what the data shows, so a done "Find out" task
means it was looked into, not how it turned out, and it summarises without advising on legal, medical or money
matters. Evaluated live on made-up projects (about US$0.06, `ai-eval/reviews/2026-10-17-ask-quality.md`). The practice
helper (no AI) answers it too. Each picture has words for screen readers and never relies on colour alone, in light
and dark themes.

**Overview: next step first (1.46.0; `specs/projects-overview.md`):** a project's Overview now opens with its **Next
step**, with **Worth a look** beside it when there's something to point at (otherwise the next step takes the full
width). **At a glance** follows, holding each tool's summary once, as one row per tool that opens its tab: a
business idea's one page ("3 of 4 questions answered") and What must be true (three counts); a case's evidence bar,
issues and what's linked, and timeline ("4 entries · latest Mon 5 Oct", by month); then Milestones (the stations and
"1 of 4 milestones reached · Next: …"), Decisions (up to three open questions, or the latest choice) and **What you
did** (the 8-week columns with "3 done · 4 to go" and when it started and was last worked on). The tile strip and
the separate Milestones, Decisions, "Your one page", "Your case" and "How it's going" cards are gone, so each
summary appears once. "Add a deadline" moved into a case's Coming up, and the not-legal-advice line sits under a
case's At a glance. **Open past dates stay visible:** a task still to do whose date has passed leads Coming up as
"Still open · was due Wed 21 Oct"; done or let go, it leaves. When it's the next step, the Next step card says
"Still open · was due …" itself; otherwise, on an active project, the oldest one leads Worth a look. Past
appointments aren't listed, and there's no red, no "overdue" and no count of days. Worth a look no longer says "No
next step yet": the Next step card beside it already asks for the smallest one. Nothing new is saved, and Ask
MyDay's request and preview are unchanged (`comingUp` is unchanged; still-open tasks come from `stillOpen`).

**The outcome, what counts as finished, and where you left off (1.48.0; `specs/projects-left-off.md`):** a
project can say what it's aiming for ("Aiming for: …", a line under its title on every tab) and what would count as
finished ("Finished when: …" in About it), both written in About it → Edit. **Where I left off** is one short note
for next time, with prompts (what was happening, what's unresolved, the next useful thing, anything needed to pick
it up again): once written it sits at the top of the Overview, above the next step, with the day it was written and
Edit; clearing it asks first. Without one, About it offers "Leave a note for next time". Finishing every task never
marks the outcome as reached, and paused or done projects keep their note. Saved data: three optional fields on the
project (`outcome`, `finishedWhen`, `leftOff: { text, at }`), absent when empty, in the existing project record and
sync record, with no new record kind, migration or database change. There's no schema change, by the owner's
exception in AGENTS.md: 1.47.0 and earlier keep unknown project fields, so going back keeps them unread, which
`projects-rules` proves with 1.47.0's own code (loading, editing, saving, export, import, restore and the project
sync record). A device still on an older version doesn't show them, even on its sync-conflict screen, so update
every device. A sync conflict on the project shows them. None of them is sent to AI.

**Waiting on someone or something (1.50.0; `specs/projects-waiting.md`):** a task can be waiting on whom or
what, with an optional "expected by" date, set on its page ("Waiting on someone?") or with a new choice in "What's
getting in the way?" ("I'm waiting on someone or something", which isn't kept as a blocker reason). Its row, and
Today's Due today, read "Waiting on Priya · expected Wed 28 Oct"; its page puts the wait first, with Got it, Change
and Chase it. When MyDay picks a project's next step it skips waiting tasks, and Today's "From your projects"
doesn't offer them; a waiting task you chose stays chosen and its card says what it's waiting on. From the expected
day, on an active project, Worth a look says "Still waiting on Priya (…) — expected Wed 28 Oct" with **Chase it**
(the Next step card offers it itself when the wait is its own task). Chase it asks when: Today, Tomorrow, a day you
pick, or No date, then adds one 5-minute task "Chase: <the task>" in the same list and project. No red, no
"overdue". Saved data: an optional `waiting: { on, since, until, chaseTaskId? }` on a task, in the existing task
record, with no schema, migration or database change (the exception in AGENTS.md: earlier releases keep unknown task
fields). The conflict summary says "waiting". Who you're waiting on is never sent to AI, and a chase task's title
doesn't name them. To keep one meaning of "waiting", the weekly review's step 2 is now **What needs you** ("Nothing
needs you right now — lovely"; a past-dated task "was planned for …").

**Searching one project (1.52.0; `specs/projects-search.md`):** every project page has "Search this project"
under its tabs. While there's something in it, the results show above the tab, which stays as it was but hidden (so
nothing you were typing there is lost): "2 matches for “armchair”", in a fixed order by kind. It searches the
project's name and own words (summary, what it's aiming for, what counts as finished, where you left off), its tasks
(title, notes and who they're waiting on; done and let go after the rest, marked), notes (private ones marked),
milestones, decisions (with options, pros, cons, reasons and previous choices), a business idea's one page and a
case's timeline, evidence and issues; never MyDay's own labels. Every word must appear, in any order; capitals,
accents and the kind of apostrophe don't matter, and excerpts never cut a character in half. Opening a result goes
to the item itself (a milestone, decision or case record is brought into view and focused on its tab). Clear, Escape
or choosing another tab ends the search. A screen reader hears the count. Nothing is saved, and nothing is sent to
AI or anywhere else.

**Why this next step (1.54.0; `specs/projects-next-why.md`):** the Overview's Next step card has **Why this?**,
folded as in Study. It says whether you chose the step ("You chose this step. Left to MyDay, it would be “Paint the
first wall”.") or MyDay picked it: the earliest date, the one added first when none has a date, or the only task
still to do, saying when a waiting task that comes first was passed over ("“Book the electrician” comes first, but
it's waiting on the electrician's office."). When the step you chose was done or let go in the last week, it says so
before MyDay's pick; nothing is added to Today by itself. "Or choose another next step" now starts with **Let MyDay
pick**, which hands a choice back and says what MyDay picks; choosing any task, even MyDay's, makes it yours. A
project's tasks now follow the Tasks screen's order (on the same day, a task with no time comes after timed ones),
so the next step agrees with Coming up. The board, At a glance and Today are otherwise unchanged. The reasons follow
`nextStep` exactly (`whyNext` in `src/data/projects.ts`) and write nothing; the choice is the existing `nextTaskId`,
so there's no saved-data, sync or database change. Nothing is sent to AI.

**Learning for a project (1.56.0; `specs/projects-study-links.md`):** a project's Overview has a **Learning** card
in its side column, after Recently. **Link something** links one of your own courses, a book in Reading or an Arabic
lesson from your path, with an optional "why it matters". Each link shows Study's own status, never a percentage and
never a guess at what you know: a course's "3 of 8 tasks marked complete" (or "Archived in Study"), a book's "Page
120 of 300", "Not started" or "Finished on …", and an Arabic lesson's state (New, Practised, Ready to move on,
Holding or Needs revision, loaded on demand as on Study home). It opens the course, Reading or the lesson. Something
removed from Study keeps its link, marked "No longer in Study". **Edit why** and **Unlink** change only the project;
up to 20 links. Saved data: an optional `studyLinks` on the project (`{ kind, id, title, why?, addedOn }`), in the
project's own synced record, with no schema, migration or database change (the exception in AGENTS.md: 1.55.1 keeps
the field unread, but doesn't show it). The conflict details say "Learning: …". Never sent to AI. Cybersecurity
lessons and a "For your project" line on the Study side are the next release (the owner's follow-ups).

**Cybersecurity lessons and "For your project" (unreleased; `specs/projects-study-links.md` §7):** the Learning card
also links Cybersecurity lessons from your path (grouped by module, loaded on demand separately from Arabic's), with
Study's own words: "Marked complete", "Started" or "Not started" (Cybersecurity has no lesson states yet). In Study,
a course's page, a current book in Reading and a Cybersecurity lesson's page say "For your project: …" under the
title, naming every project that links it, each opening the project. Nothing new is saved: a Cybersecurity link is a
new kind in the existing `studyLinks`, which 1.56.0 keeps unread and shows as "From a newer MyDay". Never sent to
AI.

**Your week — the weekly review (1.37.0):** a short look back over the last seven days, at `#review` ("Your week"), in
four steps, one at a time, with Back and Next. Nothing changes until you tap. **1 What moved:** each project's tasks
done, milestones reached, decisions made, things found out, case records added (up to three done task names shown),
other tasks done, Study sessions and minutes, and workouts as counts and names, never scores; a quiet week is called
fine. **2 What's waiting** (since 1.50.0, **What needs you**): at most five things from real data: a task moved three or more times or long past its
date, a project quiet for two weeks, a decision open for two weeks, a done Find out not yet marked, and evidence still
to get. Each has "Pick a next step", "What's in the way?" or "Open it", "Pause it" for a quiet project, "Let it go"
for a stuck task, and "Leave it for now". **3 Next week's focus:** up to three active projects, from tomorrow for
seven days. Their next steps come first in "From your projects" on Today, marked "This week's focus", and the board
labels them. **4 A line or two (optional):** "What went well?" and "What would make next week easier?", saved as an
ordinary note "Week of …", in Personal when you have that collection. **See the pattern** (step 1, only on your tap,
with AI help): Ask MyDay gets your week in counts and names (what moved, what's waiting, next week's focus; never
private projects) and answers in two or three warm sentences naming a pattern or two, then one small suggestion. It
never judges. Instructions `myday-ask-v16`, evaluated live on made-up weeks (about US$0.05); the practice helper
answers it too. What MyDay knows lists the review page. **Look back at your week** is a card on Today, shown only on
your review day (Sunday unless you choose another day on the review page) and the day after, until you've done it or
tapped "Not this week". Never a notification. Projects has a link to it too ("Look back at your week"). Saved data
(all optional): a project's `focus` (the day its focus week starts), a note's `reflectionWeek`, and your preferences'
`reviewDay`, `reviewed` and `reviewHidden`. Going back to 1.36.0 is safe: checked with its own code (5/5) and its
built app (3/3).

**Word families (1.38.0):** on the Arabic vocabulary page (`#study/arabic/vocabulary`), a **Word families** card sits
above the list: one view, nothing to switch. It shows the four roots that connect 12 of the 48 starter words — ك-ت-ب
“writing” (5 words), د-ر-س “studying” (3), ق-ر-أ “reading” (2) and ط-ل-ب “seeking” (2) — each root shown whole with
its reading, and each word a button: a tap shows its note (why it belongs, with its reading and meaning) and “Show it
in the list, with its revision buttons”; a second tap closes it. Pairs are marked ⇄ (past and present, or a gender
pair), and each family explains its pattern, such as مَـ “place of” in both مَكْتَبَة and مَدْرَسَة. The other 36
words are named honestly in two groups: 14 whose relatives aren’t in the list yet, and 22 small words not built from
roots. Each family word in the list carries a small “ك-ت-ب family” badge. Readings follow Show / Hide transliteration.
The families are MyDay’s own authored file (`content/teaching/arabic/word-families.json`, by word id), checked at
every build by `app/scripts/validate-families.mjs`: every member exists and is placed once, contains its root’s
letters in order, pairs and notes belong to their family, examples really appear, and all 48 words are placed. For
noticing, not testing: nothing is saved and revision is unchanged.

**A voice for the starter words (1.39.0):** on the Arabic vocabulary page, each of the 48 starter words and its example
sentence has a play button (44 px) beside the Arabic, and a family word's note has one too. One clip plays at a time,
only when you tap; nothing plays by itself, and tapping again stops it. The voice is Google Cloud Text-to-Speech's Chirp
3 HD voice "Charon" (`ar-XA`), chosen by ear in a blind trial of four voices (two WaveNet, two Chirp 3 HD). The 96 clips
were made once from the curriculum's exact vowelled text by `app/scripts/make-arabic-audio.mjs`, run by hand and never
by the build or the app; its key comes from the environment and was deleted afterwards. The clips total about 800 KB.
Before shipping, a second model (Gemini 3.8 Flash) transcribed every clip with its vowels; where it heard something
different, the clip was made again (three clips, four retakes). Then all 96 were listened to against the text and its
reading. The app labels them honestly: "Synthesised voice — a model to copy; checked by ear, not yet by a teacher." The
note adds that the voice may leave out the last vowel at the end of a sentence, as speakers do, and that revision covers
reading and writing, while listening and speaking stay untested. A **Slower** switch plays the same clip at
three-quarter speed, pitch kept, and remembers the choice on the device (device-only key `myday.arabic.slower`, not part
of `myday.data.v4`). The clips are in `content/arabic-audio/`, each named by its contents, with `audio-audit.json` (the
voice, the label, the exact text each clip says and its check). `app/scripts/prepare-audio.mjs` checks them at every
build: a text that changed since its clip was made, a file that doesn't match its name or is cut short, or a stray file
or unknown check stops the build. Only clips that have been listened to are shipped: copied to `public/arabic-audio/`
(not in Git) and listed in `src/study/arabic/voice-clips.json`. Offline: the clips aren't part of a release's files, so a
new release doesn't download them again. Each is kept by the service worker the first time it plays, in its own cache,
and plays offline after that; the first play needs a connection, and if it fails the button says so. No saved-data
change.

**A voice for each lesson’s example (1.40.0):** the second round of `specs/arabic-audio-course.md`. Each Arabic lesson’s
headline example has a play button beside it, with the label under it ("Synthesised voice — a model to copy; checked by
ear, not yet by a teacher. Slower playback: Study → Arabic → Vocabulary."): 146 of the 152 lessons. The other six are
letter drills, which a voice would read as letter names, or written without vowel marks, which a voice can only guess;
they have none. The same voice made 136 new clips (10 examples share a starter sentence’s clip). Gemini transcribed each
one, 21 were made again, and all were listened to in full on 21 October 2026. Where an example lists forms with a slash
("مَلِك / مَالِك"), the slash is spoken as a short pause. Clips now belong to their exact text: `audio-audit.json` is
keyed by it, one clip serves every place that text appears, and `app/scripts/arabic-voice-sources.mjs` says which texts
have a voice. `make-arabic-audio.mjs <source>` makes one source’s clips. The build check (`prepare-audio.mjs`) also
fails on a clip whose text is no longer in a voiced part of the course, and on one file used by two texts. The app’s
list is `src/study/arabic/voice-clips.json` (text → file). `app/scripts/arabic-audio-inventory.mjs --rounds` counts
what’s left for round three. No saved-data change.

**A voice for reading texts (round three (a), 1.41.0):** a whole-text **Listen** button and
individual sentence controls for the 8 vowelled texts. The same audio plays when you hide the vowel marks. Dialogue
speaker names stay visible but are not spoken, and the standalone signature stays as its own sentence. The shared
player keeps one clip playing at a time, uses the same **Slower** choice and stops when you leave the text.
`scripts/arabic-reading-sentences.mjs` finds 59 sentence positions and 58 distinct spoken texts: 3 reuse existing
clips, leaving 55 new clips and 2,177 new characters to voice. All 55 new clips were independently transcribed and
listened to on 21 October 2026 ("all fine"); released in 1.41.0. Only clips listened to and marked checked enter the app, and whole-text Listen
is available only when every sentence has a checked clip. No saved-data, server or database change.

**A voice for teaching and checks (round three (b), 1.42.0):** play controls beside fully vowelled
Arabic in teaching explanations and worked examples, sound pairs, and word-family notes and extra forms. **Try it**
and solutions offer audio only after **Reveal explained answer**; hiding the answer removes the controls and stops
their audio. Lesson-check prompts and reference answers offer audio only after the reference data has loaded, in
ordinary lessons and sessions. Revision cards stay as they are. Isolated letters, syllable drills, affixes, unfinished
words, unvowelled pieces and pieces marked only with shadda are held back. The same Charon voice, shared player,
**Slower**, offline cache and synthesised-voice label apply; only checked clips enter the app. The 363 new clips have
been transcribed blind, with 27 retakes. You listened to all 357 eligible clips ("both fine"); six uncertain
recordings were held for a fluent reviewer. Curriculum 1.1.2 and its teaching companion (1.45.1) corrected six voiced
sentences, one of them a held recording, and their clips were replaced, since a clip belongs to its exact text
(`content/arabic-audio/audio-audit.json`, `removed`). Sixteen new clips cover the corrected and new texts and
retakes of the five other holds. They were transcribed blind (`cross-check-1.1.2.json`) and you listened to them
("all fine"). 654 checked clips ship, and every fully vowelled text has a voice.
`scripts/review-arabic-audio.mjs teaching sounds-families lesson-checks` makes a local listening checklist;
`MYDAY_AUDIO_REVIEW_BATCH` splits it into manageable sittings. No saved-data change.

This is MyDay being rebuilt in React, one milestone at a time. The current MyDay (`../index.html`) stays live
and unchanged until this version can do everything it does.

**The migration is complete: every section of the current MyDay — Today, Calendar, Pay, Health (Workout and Food)
and Study — works fully in the new app and saves, along with the shared controls (task lists, export/import,
animations, theme).** Ideas was only a placeholder in the current MyDay (never shown, nothing saved), so there's
nothing to move. Release 1.0.0 is published with GitHub Pages — how, how to check which release is loaded, and how
to go back: [`../deploy/README.md`](../deploy/README.md).

> This version saves to the **same data** as the current MyDay when both are opened at the same address (for
> example with Live Server). A change made in one shows in the other. To try things out, use disposable data or
> a backup, not your real plan.

**Cloud sync (from release 1.1.0):** task lists, the queue, daily plans and each day's context can sync between
devices through your own Supabase project. It's off unless the app is built with a Supabase URL and publishable key;
the published build has them (`app/.env.production`). Setting it up: [`../supabase/README.md`](../supabase/README.md).
How it works: "Cloud sync" below.

## Commands

You need Node.js 20.19+ or 22.12+ (checked with Node 24). From the `myday-site` folder:

```bash
cd app
npm install          # first time only (installs into app/node_modules)
npm run dev          # live-editing server, usually http://localhost:5173 (its saved data starts empty)
npm run build        # checks the types (tsc -b) and builds into app/dist/
npm run preview      # serves app/dist at http://localhost:4173, as it will be published (build first)
npm run lint         # checks the code for common mistakes
cd ..
tests/run.sh app-storage app-today app-calendar-pay app-study app-workout app-food app-final app-site   # builds, then checks in a throwaway Chrome profile
tests/run.sh sync-db app-sync   # cloud sync: the database (PGlite) and two devices end to end (a local Supabase stand-in)
deploy/preview-site.sh trial    # the website as GitHub Pages will publish it, at http://localhost:8080/myday/
```

To use the built app beside the current MyDay (sharing its saved data), run `npm run build`, then open
`http://127.0.0.1:5500/myday-site/app/dist/index.html` with VS Code's Live Server. The built copy doesn't update by
itself: build again after a change. While Live Server is running, run the checks as `MYDAY_LS_PORT=5599 tests/run.sh …`.

## What has moved

| Section | In the new app |
|---|---|
| **Today** | Everything: energy (1–5) with its task limits, Build my day with a proposal you confirm (edit, shorten, leave for later), rest days, the queue and Roll to tomorrow, the evening check-in (including yesterday's), Review my plan, Swap for a rest day, Start today over, the nudge, the focus timer, the rolling 7-day learning count with what's up next in your current topic, sleep / work / appointments / prep-time context, Today at a glance, editing task lists, export and import, animations on/off. |
| **Calendar** | Everything: your repeating pattern (e.g. 4 days → 4 off → 4 nights → 4 off) with versions that start from a chosen date (earlier dates never change), one-date changes stored apart from the pattern, what actually happened (worked different hours, sick, annual leave, cancelled, off instead, custom), overtime and unauthorised absence as separate entries, appointments, overlap warnings, bank holidays from gov.uk with the region choice, configurable colours with text labels, month and agenda views. |
| **Finance** (was Pay) | Work pay for each pay month: shifts worked (and still planned), gross pay, Income Tax, National Insurance and student loan, and take-home, all estimates labelled with the tax year and gov.uk as the source. Worked out from the Calendar with the same rules as the current MyDay's Pay (overtime, cancelled shifts, bank holidays, annual leave, sick pay, the clock changes), so it changes by itself when the Calendar does. Plus money owed (both ways, with "Settled"), monthly expenses, and what's left over (take-home minus expenses). Your rates are folded away under "Rates". See "Finance" below. |
| **Study** | Everything: a dashboard focused on starting (current focus and course, the next task with its path and estimate, a suggested length that fits your energy and free time, Start learning, "Just 15 minutes", course completion, a revision preview with its own Start revision button); the editable roadmap (stage → course → module → section → task, resource links, archive, focus); learning sessions you can pause, resume, finish or discard, with an optional clock that survives a reload; the optional check-in (task complete, concepts covered, how clear it felt, takeaway, question, Obsidian note); concepts with written or multiple-choice revision questions; revision one question at a time with the answer hidden until you ask, self-assessment, hints, notes, and spaced review dates; progress and history (learning days, completion, practical work, clarity, recall by week, what might need practice); your map (each stage a line, each course a station, lit up to where you stand, a finish line per stage, courses whose concepts might need practice ringed); Study settings; and the Study card on Today. |
| **Health → Workout** | Everything: workout templates (create, rename, reorder, archive and restore) with your own or common exercises; strength (reps and kg), bodyweight (reps, with added weight or assistance in kg, kept apart) and cardio (minutes and km); planned sets, reps, weights, durations, distances and rest; scheduling by weekday or as a repeating sequence; proposed dates fitted around shifts and appointments, saved only when you confirm; one-off plans on a date; the latest missed session to Move, Skip or Continue (no backlog); logging a workout with the plan and last time's result beside each exercise, big Done buttons, values prefilled from last time or the plan, the optional rest timer, leave-and-resume, and a kindly named shorter session; history with corrections; exercise history with charts per measure; daily exercises (a daily target in sets, one tap per set on Today with a countdown and undo, steppers to adjust, a gentle week view, missed days cost nothing); and the Health card on Today. |
| App shell | Header with the date, the five-section navigation (on wide screens, beside the theme button), Light / Dark / Match device themes. |
| **Health → Food** | Everything: recipe ideas from TheMealDB (three at a time, "Show more"), search with suggestions while you type (your saved recipes at once, TheMealDB after a pause), favourites, recently cooked and your own recipes; preferences (leave out, dislikes, time, batch cooking) with a plain allergen caution; recipe pages with ingredients, servings that scale the quantities (or "as written" when they can't), the method split only on its own lines with the original text kept, nutrition (only your own figures, labelled as yours — never estimated) and the source and links; Want to cook (servings, tick what you have, add the rest); the shopping list grouped by aisle, combining only compatible items, with editing, manual items, Undo and ticking off; the step-by-step cooking view with timers named in a step, saved position and resume; and the cooking and shopping reminders on Today. |

Today's Health card shows a workout to resume, decide about or start, a recipe being cooked, and the shopping list.
Nothing from Health is added to the day's task list.

Every section ends with the shared controls, as in the current MyDay: Edit task lists (it opens Today's list
editor), Export my data, Import my data, Animations on/off, and whether saving works in this browser. The theme
button (Dark → Light → Match device) is in the header on every screen.

### Ideas

The current MyDay lists Ideas only as a planned section (`ready: false`): it's never shown, has no screen and saves
nothing. So nothing was migrated, and the new app doesn't show it either (`#ideas` opens Today). If saved data ever
contains an `ideas` section, both apps keep it exactly as it is.

### Finance (it replaced Pay)

Finance shows only what's needed day to day: the pay month, shifts worked, gross pay with Income Tax, National
Insurance and student loan, take-home, then **Left over** (take-home minus monthly expenses), **Monthly expenses**,
**Money owed** (I owe / owed to me) and, folded away, **Rates**. Pay's other figures (scheduled hours, premiums, sick
pay rules) and its settings card are gone from the screen; the rules behind them haven't changed (`src/data/pay.ts`).

- **Your rates** (£13.85 an hour, overtime at the normal rate, bank holidays ×2, tax code 1241T, NI category A,
  Plan 2, calendar months) are saved into the pay settings the first time Finance opens, replacing what was there
  (`setYourRates` in `src/data/finance.ts`; `finance.ratesSetOn` makes sure it happens once). Change them under
  "Rates": hourly rate, overtime, bank holidays, tax code, NI, student loan and the day a pay month starts.
- **Saved data:** a new `finance` section in `myday.data.v4` (money owed and expenses), checked when loaded like every
  other section (bad entries are counted and reported, unknown fields kept). The current MyDay doesn't show it, and
  keeps it exactly as it is (checked by `tests/app-finance.test.js`). No change to the saved data's shape was needed
  in the current MyDay: it keeps sections it doesn't know.
- **The current MyDay** keeps its full Pay screen, using the same pay settings.
- If the tax code is one MyDay can't work out (e.g. a K code), Finance shows "—" for Income Tax and take-home rather
  than a figure without tax (the current MyDay leaves tax out instead).
- Finance (money owed and expenses) syncs with your account when you're signed in, like the rest of your data.

### Calendar and Pay: differences from the current MyDay

- Same rules, records and calculations. The checks compare the two apps side by side with the same data: the
  saved rota, pay settings and bank holidays, every calendar day, and Finance's gross pay, deductions and
  take-home against the current MyDay's Pay.
- The selected day's details sit beside the month on wide screens, and directly below it on phones (choosing a date
  moves focus there). Adding an appointment, overtime or an absence are three separate buttons; changing one date
  ("This date only") and changing the repeating pattern are separate, clearly named places.
- "Are you sure?" questions are asked in the page rather than with the browser's pop-up.
- The new app doesn't run when opened as a local file (`file://`): browsers block its JavaScript modules there. Use
  Live Server or `npm run dev`. (The current MyDay still works as a local file.)

### Study: differences from the current MyDay

- Same records, rules and wording. Scheduling is unchanged (first review: Again → tomorrow, Hard → 2 days, Good →
  4 days; then × 1.2 or × 2.5, at least a day longer, at most 180 days), rounds are still 5 questions, and an answer is
  only saved when you choose when it comes back. The checks compare the two apps side by side: the saved Study data
  (including messy data), the dashboard, revision preview, concept labels, progress and Today's learning count.
- Study only ever *suggests* a session length. It never adds tasks to Today or changes shifts and appointments; the
  one thing it changes on Today is ticking the matching learning task, and only when you press "Also tick … on today's
  plan" in the check-in.
- On wide screens the dashboard has two columns (what to start on the left; revision and links on the right).
- "Are you sure?" questions (removing part of the roadmap or a concept, discarding a session) are asked in the page.
- The check-in shows an "Open in Obsidian" link under its note path (the current MyDay only stores the path). The
  settings text now says note links appear on concepts and check-ins (tasks have no note field in either app).
- Export and import are on Today (the current MyDay shows them at the bottom of every section).

### Reading (Study → Reading, 1.24.0)

Study has two tabs, **Courses** (the roadmap home) and **Reading** (`#study/reading`): the books you're reading — a
title is all a book needs; the author and total pages can come later (Edit) — and where you are in each: − / + a page
at a time, or type the page you're on. With a total, a slim bar shows how far you are (never a percentage: where you
are is the page). Notes per book, each with an optional page ("p. 42"); removing one asks first. Reaching the last
page — or "Mark as finished" — shelves the book under **Finished** with the day; "Read again" puts it back. Edit
changes the title, author or total pages (never below the page you're on or a page a note is about, so nothing loses
its place) and can remove a book added by mistake (asked first). Kept small on purpose: no shelves, ratings or wish
lists, nothing on Today, and reading never counts towards the learning streak. Saved as a top-level `reading` section
(`books`: id, title, author, pages or none, page, notes {id, page or none, text, addedOn}, addedOn, finishedOn) — new
app only; the classic MyDay keeps it unread. Synced as one record per book (`book`, deletable; migration
`../supabase/migrations/20261017120000_sync_books.sql`). Started by another tool (Kimi), finished and released after
review.

### Daily exercises (Health → Workout, 1.23.0)

Everyday movements with a daily target and a set size — "150 push-ups, in sets of 25". Add them in Health → Workout
(name, daily target, set size; − / + to change a target or set size; archive one to take it off Today, its history
kept). On Today, each counts down what's left with a slim bar and one button — "+ a set of 25" — that logs one set
(the last one only what's left, so the day ends exactly on target), with **undo** for a mis-tap; a finished exercise
folds to a tick, "done for today". Missed days cost nothing: every morning starts from the full target, and a changed
target applies from today (days already logged stay as they were). Health shows this week as bars — full when every
exercise was finished, soft for some, empty simply a quieter day. Saved as `health.daily` (`exercises`: id, name,
target 1–1000, set 1–500, archived; `log`: day → exercise → each set's reps), new-app only — the classic MyDay keeps it
unread (from 1.23.0's `index.html`); synced with your account as one record (`daily:moves`, migration
`../supabase/migrations/20261016120000_sync_daily.sql`). Built by another tool (Kimi) and released after review.

### Workout: differences from the current MyDay

- Same records, rules and wording. The checks compare the two apps side by side: the saved workout data (including
  messy data), Today's Health card and timeline, the next-step card, templates, history, exercise history, a logged
  workout's plan and last results, and proposed dates.
- **Changing one planned session** (its date, time or workout) has its own "Change" button under Planned sessions. It
  never changes the template or the repeating schedule. (The current MyDay only lets you remove a plan and add it
  again.) Templates are edited separately, and that says they apply from your next session.
- **Overlap warnings:** planning or changing a session with a time warns about shifts, appointments (and their prep
  time), sleep and your task window, using the same check as Today, before anything is saved. It also says when a
  plan replaces one already on that date, or the weekday schedule's workout for that day only.
- The box for a bodyweight exercise's extra kilograms is labelled "kg added" or "kg assist" (the current MyDay says
  "kg" for both), so the two are never confused.
- "Are you sure?" questions (finishing early, cancelling, removing a done set, deleting from history) are asked in
  the page.
- The rest countdown is checked while the workout screen is open. If it ends while you're elsewhere, the screen
  says "Rest done" when you come back (the current MyDay notices it on any screen).
- Export and import are on Today (the current MyDay shows them at the bottom of every section).

### Food: differences from the current MyDay

- Same provider (TheMealDB with its free test key), records, rules and wording. The checks compare the two apps side by
  side: the saved Food data (including messy data), Today's Health card, a recipe's ingredients and scaled
  quantities, the method, the shopping list and its aisles, what Want to cook adds, and the cooking view.
- **Search replies in order:** each search (and each round of suggestions while typing) is numbered, and a reply for
  an older one is ignored, so a slow answer can never replace newer results. (The current MyDay already does this for
  suggestions, but not for a full search.)
- **Your own recipe's ranges:** an ingredient line like "1-2 cloves garlic" keeps "1-2" together as the quantity, so
  the shopping list keeps it as written. (The current MyDay reads it as "1" of "-2 cloves garlic".)
- Each recipe being loaded has its own "loading" or "couldn't load" state, so one recipe's error never shows on another.
- The recipe page says what Favourite, Want to cook and Start cooking each do, and that none of them records what you
  eat. The cooking view shows the step number large, in a circle, beside "Step 2 of 4".
- A recipe without a photo shows a pot icon (the current MyDay shows an emoji).
- "Are you sure?" questions (delete a recipe, stop cooking, start another recipe while cooking, clear ticked items)
  are asked in the page.
- Export and import are on Today (the current MyDay shows them at the bottom of every section).

## Saved data

- Same key and format as the current MyDay: `myday.data.v4`, `schemaVersion` 5. Versions 2–4 are read and upgraded on save.
- `src/data/storage.ts` is the only code that reads or writes it. It loads and checks the data before anything can be saved.
  If the data can't be read, or came from a newer MyDay, saving stops and the saved copy is left exactly as it was
  (you can download it, import a backup, or start fresh).
- Rota, pay, bank holidays, Study, Workout and Food are checked when loaded exactly as the current MyDay checks them: every
  valid record is kept, and anything damaged is dropped the same way (the checks prove both apps save identical
  results). As in the current MyDay, Study keeps only one session in progress (any other is marked finished), and
  Study, Workout and Food don't keep unknown fields *inside* their records.
- Anything else stored under Health, and any unknown top-level sections, are kept exactly as saved and included in
  exports.
- **Another tab:** before every save it checks whether another tab (or the current MyDay) saved since; if so, it shows
  that newer data and says your last change wasn't saved, rather than overwriting it. Tabs also update each other.
- **Saving at the same moment:** localStorage has no locking, so if two tabs save within the same instant, the later
  write wins. This can't be prevented; it is *detected*: the tab whose change was replaced says so. (Same as the
  current MyDay; both apps sign their saves the same way, so this works between them too.)
- Data from older MyDay versions (`myday.data.v3`, `v2`, version 1) is moved to the current format by the current
  MyDay. Until that has happened, the new app explains this and saves nothing.
- If the browser blocks storage, the app still works but says changes won't be kept after closing.
- **Cloud sync doesn't change the saved data's shape.** Its own notes are kept apart, in `myday.sync.v1` (read and
  written only by `src/sync/state.ts`), and the sign-in session in `myday.sync.auth` (kept by the Supabase library).
  Records arriving from the cloud are saved through `storage.ts` (`updateSaved`) after the same checks as a backup
  (`normalize`). Neither key is part of an export, which still holds all of the MyDay data.
- **Focus mode** (1.11.0) is a choice for one device, kept in `myday.focus` ("1" when on, read and written only by
  `src/shell/focusMode.ts`): not part of the MyDay data, not synced, not exported.
- **Sayings** (1.49.0) work the same way: `myday.sayings` is "off" when switched off in the footer and absent when on
  (the default), read and written only by `src/shell/sayingsMode.ts`.
- **Nothing unreadable is left out silently.** Like the current MyDay, entries that can't be read (and whole sections
  damaged into the wrong kind of value) are left out when the app starts, and they'd be gone after the next save.
  The new app says so on every screen, with how many, and offers "Download a copy" of the saved data exactly as it
  was before anything is saved over it. (The current MyDay leaves them out without saying.)

## Where things are

| Folder / file | What it holds |
|---|---|
| `src/data/types.ts` | The shape of the saved data, as TypeScript types. Must match the current MyDay exactly. |
| `src/data/normalize.ts` | Checks saved data and fills in anything missing (a copy of `normalize()` in the current MyDay). |
| `src/data/storage.ts` | The store: loading, saving with the other-tab protections, export and import. |
| `src/data/useMyDay.ts` | Lets components read the saved data and redraw when it changes. |
| `src/data/plan.ts` | Choosing tasks within the energy limit, the queue, rest days, ticking off. |
| `src/data/schedule.ts` | Sleep, commitments, shifts, workouts, prep time and free time; overlap warnings. |
| `src/data/proposal.ts` | Build my day / Review my plan proposals, saved only when applied. |
| `src/data/progress.ts` | The rolling learning count and the nudge. |
| `src/data/timer.ts`, `dates.ts`, `today.ts` | The focus timer, date helpers, and the wording for a day's plan. |
| `src/data/rota.ts` | The shift rota: pattern versions, one-date changes, what happened, overtime/absence, overlaps, colours. |
| `src/data/pay.ts` | Pay periods and the pay estimate: hours, rates, bank holidays, sick pay (SSP), tax, NI and student loans. |
| `src/data/finance.ts` | Finance: a month's work pay (from `pay.ts`), your rates (set once), checking saved money-owed and expense entries, totals. |
| `src/data/bankHolidays.ts`, `bankHolidayFetch.ts` | Bank holidays (checking, looking up a date) and loading them from gov.uk. |
| `src/data/util.ts` | Small shared helpers (number checks, ids, copying). |
| `src/data/food/` | Food's data and rules, ported from the current MyDay: `normalize.ts` (checking saved Food data), `words.ts` (ingredient words for preferences and shopping aisles), `quantities.ts` (reading and scaling quantities), `shopping.ts` (making and combining shopping items), `recipes.ts` (preferences, steps, timers, what's listed), `mealdb.ts` (TheMealDB requests, kept in memory for the visit). |
| `src/data/workout/` | Workout's data and rules, ported from the current MyDay: `normalize.ts` (checking saved Health data), `common.ts` (labels, units and wording), `plans.ts` (which workout is planned when, missed sessions, the sequence, Today's blocks), `propose.ts` (proposed dates around shifts), `sessions.ts` (logging, finishing, prefilling, the rest timer), `history.ts` (exercise history and chart measures). |
| `src/data/study/` | Study's data and rules, ported from the current MyDay: `normalize.ts` (checking saved Study data), `roadmap.ts` (the outline, completion, setup, editing), `sessions.ts` (sessions, suggested length, check-ins, learning days), `revision.ts` (due concepts, review scheduling, cautious labels), `progress.ts` (progress and history), `common.ts` (labels, limits, Obsidian links). |
| `src/components/` | Shared pieces with their styling in one place: `Button`, `Card`, `Banner`, `Field` (inputs, including ones saved as you type), `Dialog` (confirmations), `Toast`, `CategoryChip`, `EnergyMeter`, and `parts` (links, rows, chips and labels used by the section screens). |
| `src/today/` | The Today section's cards and `TodayScreen`, which puts them together — including the dashboard's `GreetingCard` (greeting; this week on phones), `DashboardCards` (the ring and this week's bars, counted by `src/data/dashboard.ts`), `QuickAdd`, `FocusCard` and `FocusView` (Focus mode). |
| `src/calendar/` | The Calendar: `CalendarScreen`, the month grid, agenda, selected-day panel, pattern editor and side cards. |
| `src/ai/` | "Help me adjust today": `context.ts` (what's sent), `validate.ts` (the rules), `apply.ts` (saving, stale check, undo) and `AdjustCard.tsx` (the card on Today). "Add what's on my mind": `mind.ts` (what's sent, the checks, adding and undo) and `MindCard.tsx`. Both: `request.ts` (the Edge Function or practice mode). Since 1.40.0 a one-off can go into a Tasks list (`sameList` matches names on the device). |
| `../ai-eval/` | The evaluation of AI models on 20 synthetic days and 12 synthetic brain dumps (see its README). |
| `src/finance/` | The Finance screen: `FinanceScreen` (with Left over), `WorkPayCard`, `ExpensesCard`, `OwedCard`, `RatesCard` (folded away), and `actions.ts` (what each button saves). |
| `src/data/patterns/`, `src/patterns/` | What MyDay has noticed: `notice.ts` (finding patterns in your history), `saved.ts` (your preferences and answers, the `patterns` section), `adapt.ts` (using preferences in Build my day and the room on today's plan); the screen `NoticedScreen.tsx` (`#noticed`, and the quiet line on Today). `src/components/Why.tsx`: a note with a "Why?". `src/tasks/StuckCard.tsx`: "What's getting in the way?". |
| `src/projects/`, `src/data/projects.ts` | Projects (1.12.0): `ProjectsScreen` (the Projects, Notes and Connections tabs, "Start a project", project cards), `ProjectView` (one project: where you left off, the next step with Worth a look beside it, At a glance, what it is, what it's aiming for and what counts as finished, the progression, tasks, notes, coming up, recently, pause / done / delete), `parts.tsx` (the progression steps, the project picker used by notes and tasks); the data, the next step (with why it's that one, `whyNext`) and what's coming up in `src/data/projects.ts`. Today's "From your projects" and "Your tasks": `src/today/ProjectCards.tsx`. Older `#inbox…`/`#notes…` links: `src/shell/legacyLinks.ts`. |
| `src/tasks/`, `src/data/tasks.ts` | Tasks (under Today since 1.12.0): `TasksScreen` (adding, the groups, lists as chips, search), `TaskEditor`, `WaitingCard` (waiting on someone or something, Got it, Chase it; 1.50.0), `ListsView`, `route.ts` (`#today/tasks`, `#today/tasks/<id>`, `#today/tasks/list/<id>`, `#today/tasks/lists`); the data and rules (groups, due today, room on today's plan, the link to the plan) in `src/data/tasks.ts`. Today's "Due today" card: `src/today/DueTodayCard.tsx`. |
| `src/data/graph.ts`, `src/projects/ConnectionsView.tsx` | Connections, the knowledge graph (milestone 4): which notes and projects connect, the groups that go together and their fixed layout, fitted to a width (`graph.ts`); the screen at `#projects/connections` — the drawing, a dot's details with Keep / Undo, "What goes together" (`ConnectionsView.tsx`). Shared with Your map: `src/components/measure.ts` (drawing at the real width, names measured in the app's font). |
| `src/data/understand.ts`, `src/shell/autoConnect.ts`, `src/notes/ConnectedCard.tsx` | Understanding notes on the device (1.13.0): the words that count, which project a note clearly belongs to, related notes, Undo / Keep (`understand.ts`); connecting a moment after changes (`autoConnect.ts`); "MyDay connected these" (`ConnectedCard.tsx`). |
| `src/notes/`, `src/capture/` | Notes, in the Projects section (`NotesScreen`: search, Inbox, collections; `NoteEditor`; `CategoriesView`; `route.ts` — `#projects/notes`, `#projects/notes/<id>`, `#projects/notes/in/<id>`, `#projects/notes/collections`), and Capture (`parse.ts`, `save.ts`, `CaptureSheet.tsx`). The notes data: `src/data/notes.ts`. |
| `src/health/food/` | The Food screens: `FoodScreen` (picks the screen from the address, e.g. `#health/food/shopping`), `FoodHome`, `RecipeCard`, `SearchBox` (with suggestions), `SearchView`, `RecipeView`, `WantView`, `ShoppingView`, `CookView`, `PrefsView`, `RecipeForm`; `actions.ts` (what each button saves) and `visit.ts` (what's kept in memory for the visit: ideas, search results, suggestions, drafts). |
| `src/health/` | The Health screens: `HealthScreen` (the Workout and Food tabs; picks the screen from the address, e.g. `#health/workout/schedule`), `WorkoutHome`, `TemplateEditor`, `SessionView` (a workout in progress, and correcting a logged one), `SetFields` (the number boxes for a set), `HistoryViews` (history, exercises, exercise history), `Chart`, `ScheduleView` and `HealthTodayCard`; `actions.ts` (what each button saves). |
| `src/data/health/daily.ts`, `src/health/DailyManage.tsx`, `src/health/DailyTodayCard.tsx`, `src/health/dailyActions.ts` | Daily exercises (1.23.0): checking the saved data, what's left today and this week (`daily.ts`); managing them in Health → Workout (`DailyManage`), the countdown on Today (`DailyTodayCard`) and what each button saves (`dailyActions.ts`). |
| `src/data/study/mastery.ts`, `src/data/arabic/lessons.ts`, `src/study/arabic/plan.ts`, `../content/teaching/arabic/prerequisite-kinds.json` | Adaptive Study (1.47.0): lesson states, "looks ready", the next step and its reason, the suggested session length and the 8-a-day placement (`mastery.ts`, shared); your place on each Arabic lesson and the checks that come back (`lessons.ts`); the course's facts and the Arabic next step for the map, lesson pages and Today (`plan.ts`); MyDay's list of checkpoint skills that are never catch-up (`prerequisite-kinds.json`, checked by `scripts/prepare-arabic.mjs`). |
| `src/data/study/yourFocus.ts`, `src/study/courseOption.ts`, `src/study/nextLearning.ts`, `src/study/useNextLearning.ts`, `src/study/FocusSelect.tsx`, `src/study/Dashboard.tsx` | One focus and Study home (1.51.0): the focus choice and which course is labelled the focus (`yourFocus.ts`, in the existing `primarySubject` and `focusCourseId`); your own courses' next step (`courseOption.ts`, no catalogue needed); every subject's options with their "Why this?" and Study home's counts (`nextLearning.ts`, loaded on demand by `useNextLearning.ts`, so Today and Study home take the same first option); the control (`FocusSelect.tsx`); Study home's Now, Worth a look, Explore and Manage (`Dashboard.tsx`). Plan: `../specs/study-home-and-lessons.md` §3–§4. |
| `src/study/journey/`, `src/study/lessonStep.ts`, `src/study/teaching/useTeaching.ts`, `src/data/study/mastery.ts` (modes and steps) | The lesson journey (Arabic 1.53.0, Cybersecurity 1.55.0): the step bar and "I got distracted — help me restart" (`journey/Journey.tsx`), moving to a step and the restart's small things (`journey/dom.ts`), your step following you and the reopen (`journey/useJourney.ts`), by prefix "ar" or "cy"; your step per session and the Cybersecurity session you chose, on this device only (`lessonStep.ts`, `myday.study.lessonStep`, `myday.study.sessionLength`); the teaching split into Understand, Try and the further material (`teaching/`); Light / Normal / Deep, the steps each session shows and the practical tier in the suggested length (`mastery.ts`). The lesson pages: `LessonView` in `src/study/arabic/ArabicScreen.tsx` and `src/study/cybersecurity/CyberScreen.tsx` (rules in `cybersecurity/learning.ts`: `sessionFor`, `sessionMode`, `warmUpLesson`, `cyberJourney`). Plan: `../specs/study-home-and-lessons.md` §5. |
| `src/data/arabic/words.ts`, `src/study/arabic/KeepAWord.tsx`, `src/study/arabic/starter.ts`, `YourWords` in `src/study/arabic/ArabicScreen.tsx` | Keep a word (1.57.0): the rules (keeping a word, the same word ignoring vowel marks, your meaning and note, writing practice, removing, and the revision cards `<word id>:recognise` / `:write`, read from the word); the button and the picker; a starter word's course meaning; Your words on the Vocabulary page. Saved as `arabic.words` (`cleanKeptWord` in `src/data/arabic/normalize.ts`), synced as `arabic_word` (`src/sync/records.ts`). Plan: `../specs/study-home-and-lessons.md` §6. |
| `src/study/teaching/TeachingLesson.tsx`, `src/study/arabic/transliterate.ts`, `src/study/arabic/Pronunciation.tsx`, `../content/teaching/` | Lesson teaching (1.26.0, PR #1): each course's teaching companion (`content/teaching/*.json`, generated and checked at build by `scripts/prepare-teaching.mjs`), shown above a lesson's practical tasks (`TeachingLesson`); Arabic transliteration (authored readings first, then rules; `transliterate.ts`, checked by `scripts/validate-pronunciation.mjs`) with the Show / Hide choice and the pronunciation guide (`Pronunciation.tsx`, device-only key `myday.arabic.transliteration`). |
| `src/data/reading.ts`, `src/study/ReadingView.tsx`, `src/study/readingActions.ts`, `src/study/StudyTabs.tsx` | Study → Reading (1.24.0): checking saved books (`reading.ts`); the Reading tab — books, the page you're on, notes, Edit, Finished (`ReadingView`); what each button saves (`readingActions.ts`); Study's Courses / Reading tabs (`StudyTabs`). |
| `src/study/` | The Study screens: `StudyScreen` (picks the screen from the address, e.g. `#study/roadmap`), `Dashboard`, `Roadmap`, `CourseDetails`, `TaskDetails`, `SessionView`, `CheckinView`, `RevisionView`, `ConceptsView`, `ConceptView`, `ProgressView`, `StudySettings` and `StudyTodayCard`; `actions.ts` (what each button saves), `round.ts` (the revision round, kept in memory), `parts.tsx` (small shared pieces). |
| `src/knows/KnowsScreen.tsx` | What MyDay knows (1.27.0, `#knows`): what each kind of AI help sends and when (Ask's lines from `SENDS` in `src/ai/askContext.ts`), what's never sent, which model does which job (keep in step with `AI_ROUTES`), limits. |
| `src/data/projectPlan.ts`, `src/projects/PlanViews.tsx`, `src/projects/planText.ts` | Milestones and decisions (1.31.0): `projectPlan.ts` (checking the saved lists, and adding, editing, reaching, choosing, thinking again, with the limits); `PlanViews.tsx` (the Milestones and Decisions screens; their Overview summaries are in At a glance); `planText.ts` (the "Aiming for" wording, which never says late or overdue). |
| `src/data/businessModel.ts`, `src/projects/ModelView.tsx` | The Business template (1.33.0): `businessModel.ts` (the kind of project and the one page: reading what's saved, the four answers, the list of what must be true with its limits, Find out, marking, counts); `ModelView.tsx` (the Model tab; its Overview summary is in At a glance). The Model tab's counts line is `progressLine` in `planText.ts`; Explore's brief from the one page is `fromOnePage` in `src/explore/content.ts`. |
| `src/data/caseFile.ts`, `src/projects/CaseViews.tsx` | The Case template (1.35.0): `caseFile.ts` (reading what's saved, unknown fields kept, links to missing items let go; the timeline, evidence and issues with their limits, links, counts and the size guard); `CaseViews.tsx` (the Timeline, Evidence and Issues tabs, and "Add a deadline" in a case's Coming up; its Overview summary is in At a glance). |
| `src/data/projectDashboard.ts`, `src/projects/AtAGlance.tsx` | The dashboards per kind (1.36.0): `projectDashboard.ts` (the next dates, the weeks, entries by month, each issue's links and Worth a look; Today's own dashboard numbers stay in `dashboard.ts`); `AtAGlance.tsx` (the At a glance card with one row per tool, its pictures and Summarise this, and the Worth a look card beside the next step). Still-open tasks are `stillOpen` in `src/data/projects.ts`. |
| `src/data/studyLinks.ts`, `src/projects/LearningCard.tsx`, `src/projects/learningArabic.ts`, `src/projects/learningCyber.ts`, `src/projects/ForYourProject.tsx` | Learning for a project (Study links): `studyLinks.ts` (reading and changing a project's links, Study's status for each, what can still be linked, which projects link an item); `LearningCard.tsx` (the Overview's Learning card and its form); `learningArabic.ts` and `learningCyber.ts` (lesson titles and Study's status, each catalogue loaded on demand); `ForYourProject.tsx` ("For your project: …" on a course's page, a book in Reading and a Cybersecurity lesson's page). |
| `src/data/projectSearch.ts`, `src/projects/SearchResults.tsx` | Searching one project: `projectSearch.ts` (what's searched, matching without capitals, accents or apostrophe differences, excerpts on whole characters, the fixed order by kind); `SearchResults.tsx` (the results card). The field and its query live in `ProjectView.tsx`. |
| `src/data/weekReview.ts`, `src/review/ReviewScreen.tsx`, `src/today/ReviewCard.tsx` | The weekly review (1.37.0): `weekReview.ts` (when the review is due, what moved, what's waiting, focus, and saving the review); `ReviewScreen.tsx` (the four steps and See the pattern); `ReviewCard.tsx` (the card on Today). |
| `src/study/arabic/WordFamilies.tsx`, `src/study/arabic/families.ts`, `content/teaching/arabic/word-families.json`, `scripts/validate-families.mjs` | Word families (1.38.0): the card on the vocabulary page and its notes; which family a word is in; the authored families (by word id); the build check. |
| `src/study/arabic/voice.ts`, `src/study/arabic/Listen.tsx`, `../content/arabic-audio/`, `scripts/arabic-voice-sources.mjs`, `scripts/make-arabic-audio.mjs`, `scripts/prepare-audio.mjs`, `scripts/arabic-audio-inventory.mjs` | The Arabic course's voice (1.39.0; lessons' examples 1.40.0): the clip list (by exact text) and the one shared player with Slower (device-only key `myday.arabic.slower`); the play button, the voice note and the label; the clips and their audit; which texts have a voice; making them (by hand); the build check; what's left to voice. |
| `src/study/arabic/ReadingVoice.tsx`, `src/study/arabic/voice.ts`, `scripts/arabic-reading-sentences.mjs`, `src/study/arabic/voice-clips.json`, `scripts/review-arabic-audio.mjs` | Reading-text voice (round three (a), 1.41.0): whole-text Listen and sentence controls; sequence support in the shared player; shared sentence boundaries; the generated `readings` list, with only checked clips playable; a local listening checklist for future clips. |
| `src/study/arabic/arabic-runs.mjs`, `scripts/arabic-voice-sources.mjs`, `scripts/review-arabic-audio.mjs` | Teaching and check voice (round three (b), 1.42.0): shared extraction of the exact Arabic displayed; the `teaching`, `sounds-families` and `lesson-checks` sources; a local listening checklist combining sources, split into sittings with `MYDAY_AUDIO_REVIEW_BATCH`. |
| `src/commitments/` | Work shifts and appointments: the form and list used by both Today and Calendar. |
| `src/data/sayings.ts`, `src/components/Saying.tsx`, `src/shell/sayingsMode.ts` | Sayings (1.49.0): the sayings, which places each belongs to, the choice for a place and day, the gentle set and the credit line (`sayings.ts`); the quiet line itself (`Saying.tsx`); the footer's device-only switch (`sayingsMode.ts`). |
| `src/shell/` | Navigation, the top bar's parts (`TopBar`: the Focus mode switch and your account; `focusMode.ts`, the device-only `myday.focus`), the theme button, the shared footer (`AppFooter`), the "couldn't be read" notice (`LoadIssue`) and the screens for unreadable or older data. |
| `public/icon.svg` | The tab icon. |
| `src/version.ts` | The release identifier (version, commit, build date), filled in when building (`vite.config.ts`). |
| `src/sync/` | Optional cloud sync (see "Cloud sync"): `config.ts` (is it set up?), `records.ts` (which parts of the saved data are records, fingerprints, descriptions), `state.ts` (sync's notes, `myday.sync.v1`), `client.ts` (Supabase: sign-in and the two sync functions), `engine.ts` (sending, receiving, conflicts, reviews, the status), and the screens: `SyncBadge` (the status at the top), `SyncScreen` (`#sync`), `ReviewPanel` (what would change), `Compare` (two versions side by side). |
| `../supabase/` | The database changes for sync (`migrations/`, version-controlled SQL) and the set-up guide. |
| `../deploy/` | Publishing: building the website (`build-site.sh`), previewing it (`preview-site.sh`), committing it to `main` (`publish-main.sh`) and the guide. |
| `src/styles/tokens.css` | Clarity's light/dark palette, semantic categories and primary-action roles. |
| `src/styles/workspace.css` | The open workspace frame, responsive navigation, shared presentation, Today grid, project board and Study shelf. |
| `src/index.css` | Gives the colours Tailwind names (e.g. `bg-surface`, `text-fg-2`), sets the font, the navigation bar and the animations. |
| `../tests/app-*.test.js` | The checks for this app (adapted from the current MyDay's checks). |

## Design

The October 2026 redesign uses an open paper workspace, based on Taste's **Editorial greeting** direction
(seed 137248462). Its defining detail is the connection between a project's next step and Today's plan:
the same quiet task treatment, with teal on key actions and next steps. The classic MyDay (`../index.html`)
keeps its existing look; both versions still share the font, task timeline and saved data. No data migration.

- **Colours** (`src/styles/tokens.css`): low-chroma sage paper (#f4f5f2), white cards and charcoal text, with a flat teal
  accent (`primary`, #0f766e light / #7ed7c6 dark — teal-700 was the lightest teal whose white text passes AA)
  and one warm orange reserved for Capture (`accent`, #c2410c light / #f0a069 dark). Primary actions use the
  established teal pair in each theme. Dark mode uses neutral charcoal (#151716). Green still means done,
  and category colours retain their meaning. Light remains
  the default; Match device follows system changes, including the native browser bar. Semantic text pairs
  are checked for WCAG AA contrast in both themes.
- **Hierarchy** (`src/styles/workspace.css`): a 12-column desktop grid with 16 px gutters, flat panels (8 px),
  controls (6 px), and sentence-case labels. Today uses eight columns for the plan and four for supporting
  information (seven and five between 64rem and 75rem). Independent streams keep their natural height. The
  greeting is Today's `h1`; other screens use their section name. Footer tools stay available, aligned with the
  content on wide screens. Disabled shared buttons have no fill and a dashed outline, and keep readable text.
- **Navigation:** on phones, an opaque full-width bottom bar with six labelled destinations and a 52 px
  Capture button above it (a ring in the page colour and a soft shadow, so it reads as floating); on wide
  screens (64rem and up), a 224 px sidebar on the page ground, with an
  outline circle-and-tick wordmark, task/note shortcuts, and the existing Noticed/Knows destinations.
  The current section uses the teal container fill with a teal icon, plus an accessible current-page label; the
  sidebar scrolls on short screens. Workspace tabs use an ink underline with the focus ring drawn inside the tab;
  on phones, tab rows wrap onto a second line instead of hiding a tab.
- **Top bar:** the section's name above the date; on Today, the Focus mode switch; your account when signed in;
  Capture and the theme button. On phones the header scrolls with the content (Capture floats above the bar);
  on wide screens it stays at the top, so Capture is always in reach. There Capture sits in the header's normal
  layout, so it cannot drift
  over the account or theme controls. A keyboard-only Skip to content link focuses the current workspace
  without changing the route.
- **App icon:** the circle-and-tick on an orange gradient (`public/icon.svg`, `public/icon-maskable.svg`; sizes made by
  `scripts/make-icons.mjs`).
- **Font:** Plus Jakarta Sans, bundled with the app (`@fontsource-variable/plus-jakarta-sans`) for offline use.
  Times use `tabular-nums` so their digits line up.
- **Icons:** [Lucide](https://lucide.dev) (`lucide-react`), with visible or accessible text labels.
- **Tap targets:** controls are at least 44 × 44 px; main buttons are 48 px tall.
- **A day's plan** is a timeline: tasks with a time are joined by a line in time order, with "any time today" tasks below.
  The round marker beside each task shows a tick once it's done; tapping anywhere on a task ticks it off. Each fact
  appears once: the time on top, then the title, then the category and length.
- **Up next:** one task is marked "Up next", using the existing `nextTask()` rule in `today.ts`.
  Task actions use 14 px text and at least 44 px targets; the next task's Just start action has a pale teal fill,
  while other timer actions have an outline.
- **Progress note:** nothing until the first task is done, then "1 done so far", and
  "That's the whole plan — lovely." once everything is done.
- **Morning:** energy and Build my day share a card, just under the greeting; on phones the greeting stays compact so
  Build my day is visible without scrolling (checked by `tests/app-today`). On wide screens the greeting offers
  "Today's plan" only once there is one (before that, Build my day is the button just below).
- **Today's dashboard:** the time-of-day greeting and optional name; on phones this week sits under it, with a dot on
  days with a shift or appointment. On wide screens the side column (focus timer, today's ring and this week, the day
  at a glance, learning days) starts level with the greeting: since 1.49.0 there is no month calendar on Today, as it
  took the best space and the Calendar is one click away in the side menu. The plan keeps quick add,
  the focus timer, today's progress ring and this week's green bars — plain counts, never scores or percentages.
  Names can still be changed under Your preferences.
- **Study on Today:** an active or paused session appears immediately above the plan (below the energy card
  before a plan is built), before Quick Add and the other reminders. Resume opens the same saved session.
  Revision-only reminders keep their existing position; nothing is added to the task list.
- **Focus mode:** shows only the next task with Start focus, Just start and Tick it off, or the running timer.
  Show everything brings the rest back. The choice stays on this device only (`myday.focus`).
- **Sayings:** one quiet line per screen, never a card: under the plan on Today (under Build my day before a plan, so
  it stays in view on phones; after a running or paused Study session, which keeps its place), under Study's tabs, above Finance's work pay, in Projects' intro and in Your week's
  first card. Muted text; Arabic right to left in the Arabic font. Today uses only the gentle ones (al-Shāfiʿī on
  the days, Marcus Aurelius, Viktor Frankl) on a rest day or a low-energy day, so the demanding lines never read as
  blame. A fold-out, at least 44 px to tap, gives a lesson's meaning or a note on the Arabic.
- **Study:** the first visit offers the guided cybersecurity path beside course setup. Suggested courses can be
  reviewed in a disclosure before creating the roadmap. Existing learning dashboards and records keep their
  behaviour. Cybersecurity uses a wider catalogue, narrower reading pages and tabs that identify the current
  destination. Guided courses form a compact shelf beside roadmap setup, with plain icons and course metadata.
  The shared `Ar` renderer owns Arabic's bundled font, so the first course-card label already uses Noto Naskh.
- **Confirmations** ("Start today over?", "Replace your saved data?") use an in-page dialog.
- **Motion:** working content appears immediately; controls and completion keep their brief feedback.
  Motion switches off with the Animations button or when the device asks for reduced motion.

The original timeline was adapted from the "Process Timeline" component on [21st.dev](https://21st.dev).
The refresh reviewed [coss ui](https://github.com/cosscom/coss) and [Twenty](https://github.com/twentyhq/twenty)
as references for restrained action hierarchy and workspace navigation. No third-party component code,
new UI framework or dependency was added. `tests/app-design.test.js` checks desktop and phone layout,
Capture, keyboard access and learning-record preservation, and captures both themes using synthetic data.

## Cloud sync

Optional, and off unless the app is built with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (set-up:
[`../supabase/README.md`](../supabase/README.md)). Without them, nothing about sync is shown and the Supabase library
is never downloaded.

**What syncs** — everything you enter, so your data follows your account on every device (`src/sync/records.ts`):
- *First part (1.1.0):* the three task lists (one record each, in order), the queue (one record), each day's plan (one
  record per date) and each day's context, energy and sleep (one per date). These go together because building a
  day's plan picks tasks from the lists and moves tasks to and from the queue in the same step.
- *Everything else (1.8.0):* **one record each** for the planning settings (task times and breathing room), the rota
  (patterns, one-date changes, overtime and absence, colours), pay rates, the bank-holiday region, Finance, the Study
  roadmap (topics, stages, courses, tasks, focus, settings, concepts), Workout set-up (exercises, templates,
  schedule, planned dates), Food (preferences, favourites, want-to-cook, cooked, cooking), the shopping list, Goal,
  note collections, your Tasks lists and What MyDay has noticed; and **one record per item** for appointments and
  work commitments, notes, tasks, study sessions, revision answers, workouts, saved recipes and (from 1.12.0) projects — so something added
  on each device is simply kept on both, and only the same item changed on both is a conflict.
- Links between records are kept however they arrive: a favourite or want-to-cook keeps its recipe, a check-in its
  concepts, and the session or workout in progress is the one that says so. Taking the account's Tasks lists or note
  collections keeps your filing (an item moves to the account's list of the same name).
- **Stays on each device:** the theme and animations, a running focus timer or rest countdown, the bank holidays
  downloaded from gov.uk (re-downloaded as needed), and MyDay's own notes (nudges, celebrations, save signatures).
- The first time a device that already syncs gets 1.8.0, its other parts are new to the account: a device's version
  is sent if the account doesn't have one yet; if another device's is already there and differs, it's a conflict for
  you to decide (identical ones simply match). More than 30 at once goes through the review first.

**Your MyDay follows your account** (from 1.9.0; `src/sync/gate.ts`, `src/sync/SignInGate.tsx`, and the top of
`src/sync/engine.ts`) — not a device. When sync is set up (the published app):
- **Sign in first.** A device that isn't signed in shows a sign-in screen instead of MyDay, so what you see is always
  your own account's MyDay and another account never sees it. A device stays signed in, and a signed-in device opens
  straight away (offline too). If your account can't be reached (offline, or no answer when you sign in), "Use MyDay
  on this device for now" opens it with what's on the device until it's next opened, so you're never locked out.
- **Signing in combines the device with your account by itself** — no review, no set-up step: what's only in your
  account comes to the device, what's only on the device goes to your account, and where the same part differs,
  **your account's version is used** and the device's is kept aside (downloadable from Your account; a new MyDay's
  starter versions aren't kept). Nothing is lost. Then MyDay opens.
- **Every change is saved to your account automatically** as it's made — including restoring a backup (the
  question says it replaces your MyDay in your account too) or changing a lot at once.
- **Signing out** first makes sure everything is saved to your account, then **removes MyDay's data from the
  device**; signing in again (as you, anywhere) brings it all back. If something isn't saved yet (offline, a choice to
  make), it says so and offers "Download a backup and sign out" or "Stay signed in".
- A device that still has another account's MyDay (signed out before 1.9.0, when signing out kept it) is never mixed
  with a different account: signing in as someone else explains it and sends nothing.
- Without sync set up (test copies, `npm run dev` without the settings) there's no sign-in screen. The classic MyDay
  (`/classic/`) has no sign-in and uses the device's data as before.

**How it works** (details at the top of `src/sync/engine.ts`):
- Local first: every change is saved on the device as before; sync never makes you wait.
- Sync remembers each record's cloud version and a fingerprint of its content. Anything that differs was changed on
  this device (here, in another tab or in the classic MyDay), so changes waiting to be sent survive reloads and
  being offline without a separate queue.
- Each change is sent with the version it was based on and its own id. The database (`sync_push`) applies it only
  if that's still the latest version. Otherwise it's a **conflict**: nothing is overwritten, and the sync screen shows
  both versions for you to choose. A retried change (same id) is never applied twice.
- Then it fetches what changed since the last time, by the account's own change numbers (never device clocks).
  Deleted day plans arrive as deletions (the database keeps a marker), so they don't come back.
- The status at the top of every screen: **Saved to your account**, **Saving…**, **Saved on this device** (offline,
  or still waiting to go) or **Needs attention**. Tap it for **Your account** (`#sync`): who's signed in, "Update now",
  anything to choose, copies kept aside, and signing out.
- Another account signed in on a device that has someone's MyDay sends and fetches nothing, and the database refuses requests
  naming a different account from the one signed in. Each account can read only its own rows (Row Level Security),
  and nobody can write to the tables directly.

**Limitations:** a one-record part (a list, the queue, the rota, Finance, the Study roadmap, the shopping list…)
changed on two devices before they sync is a conflict, even if different things in it changed. No live updates: the other device's changes arrive when you come back to MyDay, every 5 minutes while
it's open, or with "Sync now". Changes made in the classic MyDay are sent the next time the new app is open.
Checked against a local stand-in for Supabase (the real migrations in PostgreSQL, `tests/run.sh sync-db app-sync`), and
against the real project with two disposable test accounts (`tests/sync-live-check.js`: 21/21; the app on two browser
profiles: 16/16, 3 Oct 2026). Not yet checked in Safari or on a real phone before release 1.1.0. Everything else (1.8.0):
the second migration was applied to the project on 4 Oct 2026 in one transaction (existing sync data unchanged,
checked by fingerprints), and the live check with two disposable accounts passed 27/27, including the new table's
Row Level Security; the app's handling of every record is checked against the stand-in (`sync-records`, `app-sync`).

## Installable as an app (Android, and the Mac if you like)

From 1.10.0 MyDay can be installed like an app. On **Android**: open the website in Chrome → menu → **Install app**
(or "Install MyDay as an app" at the bottom of any screen): Chrome builds an app for it (a WebAPK), with its own icon
in the app drawer, opening full screen. On a **Mac**: use the website as usual, or Chrome → Install, or Safari → File
→ Add to Dock. It's always the latest release — there's nothing to reinstall.
- `public/manifest.webmanifest`: the name, start page (Today), full-screen display, colours and icons
  (`public/icons/`, made from `public/icon.svg` and `public/icon-maskable.svg` by `scripts/make-icons.mjs` with
  headless Chrome; the maskable icon fills the square so Android can crop it to its own shape).
- `sw/sw.js`, a service worker written by hand (no library), built with each release by the `serviceWorker` plugin
  in `vite.config.ts`, which fills in the release and the list of its files. It caches the whole release, so MyDay
  opens offline; opening MyDay online always gets the latest page; a new release replaces the old cache. It never
  touches your account, AI help, recipes, bank holidays or other sites, nor your MyDay data. Only in the built app
  (not `npm run dev`). The Arabic starter words' clips (1.39.0) stay out of the release's files; each is cached
  one by one the first time it plays, in a cache of their own that outlives releases. A release removes clips
  it no longer plays.
- `src/shell/install.ts`: the footer's "Install MyDay as an app", shown only when the browser offers to install.
- The status bar follows the theme (the page's `theme-color`).
- **An APK file** too (`../android/`, see its README): a Trusted Web Activity made with Bubblewrap that opens the
  website full screen (verified by `https://omar12ahmed.github.io/.well-known/assetlinks.json`), so it always runs
  the latest release; it's only rebuilt if the app's own settings change. Its signing key is outside the repository.

## Study topics

Study holds more than one subject: **Topic → stage → course → module → section → task**. A bar of topics sits above
the roadmap (always visible, with "Add a topic"); choosing one shows its stages. Data without topics is one roadmap,
shown as one topic ("Cybersecurity" when it's built from the starter stages) — nothing is saved until you add a topic.
- Adding the first topic makes your roadmap the first topic: its stages get that topic's id; their contents are
  untouched. A new topic starts with a stage, "Start here", so you can add a course straight away.
- "Add a course" asks for its name, a usual session and **Also suggest it on Today** (ticked): then it's also added
  to the end of your Learning list ("<course> — one section"), linked to the course like the ones you set up first.
- In Edit: rename, move or remove the chosen topic (removing says what goes with it, and the only topic can't be
  removed; its Learning list entries stay); "Add a stage" adds to the chosen topic; moving a stage stays within its
  topic.
- Saved as `study.topics` (`[{ id, title }]`) and a `topicId` on each stage — additions only, in **both** versions'
  `normalizeStudy` (the classic MyDay keeps them and shows every stage, whatever its topic). A stage without a topic
  (e.g. added in the classic MyDay) shows under the first. Code: `src/data/study/topics.ts`, `src/study/TopicsBar.tsx`,
  `src/study/CourseForm.tsx`.

**Study's home page** (`#study`, from 1.7.0) is organised by topic, so it stays tidy as subjects are added (e.g.
Cybersecurity, Arabic):
- First what's in progress and the **current focus** (with its topic: "Current focus · Arabic"), ready to start, with
  its completion; then **Your topics** as cards — each with its next step ("Next: Lesson 2 · Madinah Arabic book 1"),
  progress ("1 of 4 tasks · 2 courses") and when you last studied it ("Studied 3 days ago") — and **+ Add a topic**,
  which opens the new topic's page. Revision, the whole roadmap, Concepts, Progress & history and Settings stay
  beside them (below on phones). The mixed "Other courses" list moved into each topic's page.
- **Cybersecurity** has one home card for the guided path (27 modules, 146 lessons), from 1.42.1.
  If you already have a Cybersecurity topic, **Your saved courses** on that card shows its task completion and
  course count (including courses set aside), and opens its original topic page. Your roadmap and progress are unchanged.
- **A topic's page** (`#study/topic/<id>`; `main` for a roadmap without topics): its progress, **Up next in <topic>**
  ready to start (or "Make this my focus"), its courses by stage with "Focus on this", and a link to the roadmap opened
  on that topic (`#study/roadmap/<id>`), where its outline is edited. A course's page goes back to its topic.
- Worked out from the roadmap and your sessions (`topicGlance` in `src/data/study/topics.ts`); nothing new is saved,
  so both versions are unaffected. Code: `src/study/Dashboard.tsx`, `src/study/TopicView.tsx`,
  `src/study/StartBlock.tsx` (choosing a length and starting, shared by both).

## Health → Goal

A third Health tab: choose a goal (lose weight, build muscle, both at once, maintain, or get fitter and healthier),
answer a few questions one at a time (about you — in kg/cm or stone/feet —, how active your days are with shift
examples, training experience, days and equipment, pace, and a few health questions), and get a plan:
- **Calories** (a range): Mifflin–St Jeor × an activity factor; losing about 300 (gentle) or 550 (steady) kcal a day
  under that (NHS: 0.5–1 kg a week from about 600 kcal less), never starting below your body's own needs or
  1,200 kcal (women) / 1,500 (men); building muscle 200 or 350 over; both at once 250 under; maintain about level.
- **Protein**: 1.2–2.2 g/kg depending on the goal (ISSN 2017; Morton et al. 2018), using a healthy weight for your
  height above a BMI of 30. **Fats** 25–35% of calories; **carbs** the rest ("carbs aren't the enemy").
- **Training**: strength sessions a week (never more than the days you have; full-body for beginners, upper/lower
  for more), cardio (NHS: 150 minutes of moderate activity a week), progress, checking in, and tips for shifts.
- **Safety**: no calorie or protein targets when pregnant or breastfeeding, after an eating disorder (or if you'd
  rather not say), or with diabetes, a kidney or heart condition — kind words and where to turn (midwife, GP, BEAT,
  a dietitian) instead; under-18s are stopped with the NHS's advice for young people; it never suggests losing
  weight below a healthy BMI.
- **Connected**: "Suggest a workout schedule" sets Workout's in-order schedule to about that many sessions a week
  (you confirm); recipes with your own nutrition figures show how they fit the goal (e.g. "High in protein — good for
  your goal", "Higher in calories for your goal — try a smaller portion" — never "good" or "bad"); Today's Health card
  shows "This week: 1 of 3 workouts".
- Labelled as estimates from public guidance, not medical advice, with the sources. Saved as a top-level `fitness`
  section (added by the new app, like Finance and Notes; the classic MyDay keeps it unread), synced with your
  account when you're signed in (record `fitness:goal`).
  Code: `src/data/goals.ts` (the figures), `src/health/GoalView.tsx`.

## Projects, Notes, Tasks and Capture

From 1.12.0 MyDay follows one progression — **capture → understand → organise → explore → decide → act → reflect** —
and **Projects** are its spine (the durable direction is summarised in `../AGENTS.md`). The Inbox became **Projects** (the third
section in the bar), with two tabs, **Projects** and **Notes**; **Tasks** moved to **Today** (`#today/tasks`, and "Your
tasks" on Today). Older `#inbox…` and `#notes…` links are rewritten to where those screens are now.
- **A project** gathers everything about one intention: what it is and why it matters (in your words), where it is on
  the progression (seven steps; tap one to move it there), its **one next step**, its tasks (dates and times read from
  your words), its notes (new ones, or ones you already have), what's **coming up** (its dated tasks and
  appointments; an appointment added here is on the Calendar too) and **how it's going** (done and to-go counts with
  small squares — never a percentage). Projects can be paused, marked done or deleted; deleting one never deletes its
  notes, tasks or appointments — they just aren't linked any more. Start one from the Projects page, or from an idea
  in Capture ("Start a project from this", the first choice for an idea: the first line is its name, the rest what
  it's about).
- **The next step reaches Today:** "From your projects" on Today lists each active project's next step (not already on
  today's plan or due today) with **Add to plan** — one tap, only while there's room for your energy, the same rule as
  Due today. Nothing is added by itself. A project's own page has "Add to today" too.
- A task or a note can be put in a project (or taken out) from its own screen ("Project"); its way back then leads to
  the project. In Tasks, a task in a project shows the project's name.
- Saved as the `projects` section (`{ items }`; each with `title`, `summary`, `stage`, `status`, `nextTaskId`,
  `commitmentIds`, `createdAt`, `updatedAt`, and from 1.48.0 the optional `outcome`, `finishedWhen` and
  `leftOff: { text, at }`). Notes and tasks gain an optional `projectId` (left out when there isn't
  one, so nothing else changes; from 1.13.0 a note can also have `linkedBy` 'rules' | 'ai', `linkWhy`, `notProjects` and
  `private`, and from 1.15.0 `aiKind` and `aiSeen`, each left out when not set; `patterns.prefs.aiNotes` is the switch); appointments are listed on the project (`commitmentIds`) so the Calendar's own records,
  shared with the classic MyDay, never change. Added in 1.12.0; the classic MyDay keeps all of it unread. Synced with
  your account (one record per project; database migration `20261006120000_sync_projects.sql`) and in "Export my data".
- **Understanding and connecting, on the device (1.13.0):** MyDay puts a note into the project it clearly belongs to
  by itself — only a link: nothing you wrote changes, and nothing is added to your days or Calendar. It compares the
  meaningful words notes and projects share (`src/data/understand.ts`: common and everyday words like "work", "call"
  or "Friday" don't count; rarer words count more), and links only when it's clear: at least two meaningful words in
  common, a strong enough match, and half as strong again as the next project. Weaker matches are only offered
  ("Might belong in…" on the note, "Might belong here" on the project). It looks a moment after anything changes —
  never at the note you have open (that one says where it looks like it belongs) — and straight away for a note
  saved from Capture, whose message says where it went. Each link is listed under **MyDay connected these** on
  Notes, with why ("both mention “coffee” and “offices”"), **Keep** (the link becomes yours) and **Undo** (out of
  that project, and MyDay never puts it back in that one); the note and the project page say "connected by MyDay"
  too. Choosing a note's project yourself always wins. A note in a project has been put somewhere, so it leaves the
  Notes Inbox. A note also shows its **related notes** (sharing two meaningful words, or one strong one), and can be
  marked **private** with the small **Private** switch at the top of the note (from 1.28.0; a lock marks it in lists):
  AI help will never read it (it still syncs with your own account, like every note). Honest
  limit: matching words isn't understanding meaning — a link can be wrong, which is what Undo is for; AI help (part
  2, once you switch it on) will place the notes word-matching can't.
- **AI help with notes (1.15.0, part 2):** off until you switch it on (Notes → "AI help with notes", saved with your
  preferences so it follows your account). Then, a few seconds after things settle, MyDay sends the notes it couldn't
  place by itself — never private ones, never ones already in a project, never the note you have open, and (from
  1.28.0) never one whose words changed in the last 5 minutes, so there's always time to switch a new note to
  private first — with your open projects' names and summaries
  (`src/ai/connect.ts`; the shared instructions and checks in `../supabase/functions/_shared/ai/connect.ts`). The model
  says which project each clearly belongs to (or none) and what kind of note it is (idea, task, question, reference,
  reflection). Every answer is checked; a note is linked only if it's still unplaced, not private and unchanged since
  it was sent — as "connected by AI", with its reason, Keep and Undo, like MyDay's own links. A note is sent again only
  if you change its words (a fingerprint, `aiSeen`); at most twice a day on each device (`src/shell/aiConnect.ts`,
  device-only `myday.ai.connect`), so the day's AI requests stay free for what you ask yourself. A note AI help saw as
  something to do offers "Add as a task" (in the same project). Evaluated on synthetic notes with GLM-5.3-Flash: no
  wrong links, every note placed right (see `../ai-eval/README.md`).
- **Connections — the knowledge graph (milestone 4, branch `knowledge-graph`):** a third tab, **Connections**
  (`#projects/connections`), draws how your notes and projects connect — by itself, from links that already exist:
  a note in a project (a plain line; dashed when MyDay put it there and you haven't kept it yet) and related notes
  (dotted: the same word matching as a note's "Related", its 3 closest; two notes in one project aren't joined again).
  Things that connect form groups, each laid out by a small fixed simulation that always starts from the same place, so
  the drawing stays put between visits and only changes when your notes do (`src/data/graph.ts`). It's drawn at the
  screen's real width with names at 13–14 px, placed so they never overlap (shortened if they'd touch; the full name is
  in the details). Tap a dot — or Tab to it and press Enter — for what it's connected to and why: a note's project
  (with **Keep** / **Undo** for MyDay's links, as under "MyDay connected these") and related notes; a project's notes
  and what might belong in it. **What goes together** says the same in words, and notes that connect to nothing yet are
  counted, not drawn. At most 150 notes are drawn (the most connected). Nothing is saved by looking and nothing is
  sent anywhere — no saved-data change. Honest limit: it shows shared words, not meaning (that would need an
  embedding service — a later decision).
- **Next:** all six Direction milestones are complete. Future work is chosen by the owner from the current specs and
  task, rather than from historical instruction notes; Arabic reading-text audio arrived in 1.41.0.
- **Tasks** holds every one-off task in one place, separate from Today's repeating Learning / Admin / Health lists
  (which stay as they are). Type a task in your own words and its date and time are read from them, as in Capture
  ("pay rent by Friday" is due Friday; "call GP tomorrow at 10am" is due tomorrow at 10:00). Tasks are grouped
  **From earlier** (said gently: no rush), **Today**, **Coming up**, **Any time** and **Done** (folded away), earliest
  first. Each task has its words, an optional date and time, a length, a kind (Learning, Admin or Health — what it
  counts as on Today's plan), notes, and an optional **list** of your own ("Moving house", "Car": add, rename,
  reorder; removing a list keeps its tasks). Search appears once there are more than four tasks. Rolling a task to
  tomorrow in the evening check-in sends it to the queue like any plan task; it then shows under "Also on your plate".
- **Due today on Today:** tasks due today, or still to do from before, are listed on Today with **Add to plan** — one
  tap adds the task to today's plan (at its time, if it has one), but only while there's room for your energy (1, 2
  or 3 tasks, the same limit as Build my day). Nothing is added by itself. Before the day is built, and on a rest day,
  the card says so instead. A task on the plan is linked, not copied: ticking it off on the plan ticks it off in
  Tasks, and the other way round. Moving it to a later day (its date, "Tomorrow", "too tired" or Ask) takes it off
  today's plan too, unless it's already ticked there (from 1.28.0; `leaveTodaysPlanIfLater` in `src/data/tasks.ts`;
  earlier days' plans are history and stay as they were).
- Saved as the `tasks` section (`{ lists, items }`; a task points at its plan copy with `plannedOn` and `planUid`).
  Added in 1.5.0; the classic MyDay keeps it unread (a task added to today's plan is an ordinary plan task there).
  Tasks are synced with your account (from 1.8.0) and are in "Export my data".
- **Notes** is an Inbox you can dump anything into — nothing has to be filed. Each note in the Inbox shows a one-tap
  suggestion from its words ("File in Business ideas") and a "File it…" menu; **collections** (Lifestyle, Business
  ideas, Health & fitness, Money, Study & career, Personal — rename, reorder, add or remove) each have their own list;
  **search** looks in every note. Removing a collection puts its notes back in the Inbox; nothing is deleted. A note
  is saved as you type (after a short pause), when you leave a box and when you switch away; a new note left empty
  isn't kept; deleting asks first.
- Saved as the `notes` section (`{ categories, items }`; a note with no collection, or one whose collection has gone,
  is in the Inbox). Notes filed in 1.3.0 stay filed. The classic MyDay keeps the section unread. Notes sync with
  your account when you're signed in (one record per note) and are in "Export my data".

**Capture** (the **+** button: bottom-right above the bar on phones, beside the theme button on wide screens, on every
screen): type anything and MyDay suggests what it looks like — and does only what you tap.
- A time ("call GP tomorrow at 10am", "meeting with Jo next Tuesday 2-3pm") → **Add to Calendar** (an appointment,
  30 minutes unless an end is given). An action ("renew passport", "need to email the landlord") → **Add as a task**
  (to Tasks, with the date and time it mentions, as the kind of task you pick; a task due today then shows on Today). An
  idea ("app idea: …", "what if…") → **Save in Business ideas**. Anything else → **Save to Notes inbox**. The other
  choices are always there too.
- Worked out on the device, nothing sent: dates and times with [chrono-node](https://github.com/wanasit/chrono)
  (MIT; UK date order, and "the 14th" read as this month or the next), grammar and people's names with
  [compromise](https://github.com/spencermountain/compromise) (MIT), and plain rules for action words, appointment
  words, ideas, lists and collections (`src/capture/parse.ts`). Both libraries load only when Capture first opens.
  Saving: `src/capture/save.ts`; the sheet: `src/capture/CaptureSheet.tsx`.
- Wide screens: below 1440 px the bar shows icons only (with names for screen readers and on hover), so six
  sections, Capture and the theme button never run into a long date.

## What MyDay has noticed (learning your patterns)

MyDay learns how you actually work — patterns, not judgements — so it can fit itself to you rather than the other
way round. **What MyDay has noticed** (`#noticed`, from the footer on every screen; Today shows one quiet line only
when there's something new) lists what it found, each with a **Why?** (the evidence, in numbers), and asks "Does this
sound right?".

- **Worked out on the device, from what's already saved** — no new log of what you do, no AI, nothing sent anywhere:
  day plans (what was planned, how long, what got ticked off), Study sessions (planned and actual length, when they
  started), energy and sleep, and work days from the Calendar. Patterns aren't saved; they're worked out afresh each
  time from the last 8 weeks, so they follow how you work now. `src/data/patterns/notice.ts`.
- **Careful with small numbers:** a pattern needs a minimum of examples before it's shown (an "early sign", or a
  "clear pattern" from 20), only days you used MyDay count (something ticked off, or the evening check-in — a task you
  did but didn't tick off would otherwise count as not done), and the evidence is given as counts ("7 of 9"), not
  percentages.
- **What it looks for:** shorter tasks of a kind getting done more often (comparing lengths of 15–45 min); study
  sessions ending much sooner (or running much longer) than planned; when you usually study; energy after short
  nights and on work days; finishing everything more often with fewer tasks; one kind of task being left for another
  day much more often; and what usually gets in the way of stuck tasks.
- **Your answers:** "Yes — do that" (for a pattern MyDay can use: it becomes one of your preferences, with its evidence
  kept as the "Why?"), "Yes, but change nothing" / "That's right", or "Not really" (hidden until there's clearly more
  evidence: half as many examples again, at least 5). "Forget my answer" undoes one. A pattern you agreed with that
  fades is shown as "less clear lately", not hidden.
- **Your preferences come first** (`src/data/patterns/saved.ts`): the longest task of each kind when building your
  day, and the most tasks in a day (never more than your energy allows). Build my day applies them in the open — "25
  min (shortened from 60)" with "Shortened to 25 min — your length for learning tasks." and a **Why?**; "1 task today,
  as you chose (your energy allows 3)." — and nothing is saved until you apply the plan, as before. "Review my plan"
  and "Due today" keep to the same most. Without preferences, plans are exactly as before (`src/data/patterns/adapt.ts`).
  Your energy rating is never changed by a pattern.
- **Tasks that keep moving** (Inbox → Tasks): a task moved later 3 times, or a week past its date, asks **What's
  getting in the way?** (also on any task, from "Something in the way?"). Each answer changes the task so it's easier
  to start, rather than "try again": too big / don't know where to start → you write the first step, which becomes a
  10-minute task for today (the whole task waits under Any time); boring → a 10-minute version today; too tired → your
  next day off from the Calendar (or the weekend); missing something → noted, Any time; doesn't matter any more → **let
  go** (under Done, and unticking brings it back); something else → noted. Answers are kept on the task and looked at
  for a pattern.
- Saved: the `patterns` section (`{ prefs, answers }`, new in 1.6.0) and three fields on each task (`postponed`,
  `blockers`, `letGoOn`). The classic MyDay keeps them unread. In "Export my data", and synced with your account.
  From 1.11.0 `prefs` may also hold `name` (what Today's greeting calls you: trimmed, at most 40 characters, left out
  when empty) — an addition only, set from the greeting or under Your preferences.
- Not yet: using patterns to suggest times (e.g. studying in the evening), and giving AI help your confirmed patterns
  and preferences (both planned as later steps, the second only if you choose to).

## AI help: "Help me adjust today" (prototype)

Off unless the app is built with `VITE_AI` (`mock` = practice mode, rules not AI, nothing sent; `edge` = the
`ai-plan` Supabase Edge Function, for signed-in accounts). Set-up: [`../supabase/README.md`](../supabase/README.md),
"AI planning prototype". Evaluation: [`../ai-eval/README.md`](../ai-eval/README.md).

- A secondary button on Today's plan opens a card: an optional short note, then **one** request.
- `src/ai/context.ts` gathers what's sent, with MyDay's own rules (the energy limit counting what's done, the
  calendar's busy blocks and free time — overnight shifts and clock changes included). Appointment names, Finance,
  Health records and Study notes are not sent.
- `src/ai/validate.ts` checks every reply before you see it: only today's open tasks by id, energy 1–2 (or not
  recorded) one small task (≤ 20 min), 3 two, 4–5 three (minus what's done), never longer than the task's usual
  length, times only inside free time, rest always allowed, missing information named (energy, sleep), short and
  gentle wording (pushy or guilt-tripping explanations are replaced). Anything else is dropped or reduced to fit,
  and listed under "Adjusted to fit MyDay's rules".
- `src/ai/apply.ts` saves only after **Use this plan**, through "Review my plan"'s save path: only today's copy of
  each task changes (minutes and time); task lists, other days, finished tasks and the energy rating never change;
  tasks left out wait in the queue. A suggestion made before the plan, energy, sleep, shifts, appointments or settings
  changed is refused. One step of **Undo** right after (until the plan changes, or you leave).
- `src/ai/request.ts` talks only to the Edge Function (or the practice planner). The app never holds an AI key.
- No saved-data changes: suggestions live in memory; the server keeps only counts (requests, tokens, budget).

### "Add what's on my mind"

A second secondary button, on Today before and after the day is built. You write whatever is on your mind; one request
returns up to 8 small tasks; you tick the ones to add.
- **Sent**: only what you write and today's date — not your lists, queue or plan (`src/ai/mind.ts`,
  `buildTasksContext`). The shared contract, instructions and practice version are in
  `supabase/functions/_shared/ai/tasks.ts`.
- **Checked** (`checkTasksReply`): at most 8 tasks (more are listed back, not dropped), names cleaned and at most 80
  characters, a list MyDay has (otherwise Admin), 5–120 minutes, one-off unless said otherwise, the same task twice
  kept once, gentle wording; anything not turned into a task is listed back under "Not turned into tasks". Tasks
  already on a list or in the queue (in any wording) are marked and start unticked.
- **Added** (`applyMind`) only after **Add**: a one-off to the **queue** (no list of its own — MyDay fits it into a
  coming day, oldest first, within the day's energy rule, and once done it's gone), or, since 1.40.0, into a **Tasks
  list** when "Where it goes" names one (see Lists below); a repeating one to the end of its **list**. Only additions;
  nothing else changes. One step of **Undo** takes back exactly what was added, except a
  task you've changed since or one already on a day's plan.
- Saved data keeps its shape (a queue item with no list, `taskId: null`, as the classic MyDay already allows), so
  both versions and sync read it as they are.

**Lists (1.40.0):** a one-off task can now go into one of your lists in Tasks: one you already have, or a new one
the suggestion names (for example "Moving house" for "book a van, pack the books, cancel the broadband"). Each ticked
one-off task has **Where it goes**: your queue (as before), one of your Tasks lists, or "New list: …". A list you
already have is chosen when the suggestion matches it (capitals, "my" or "the" and a plural "s" don't count).
A new list is chosen only when two or more tasks share it, so a single task never makes a list by itself, and a line
above says how many go into a new list. A task in a list waits under "Your tasks" until you pick it or give it a
date. A task without a list goes to the queue, as before; repeating tasks still go on their Learning, Admin or Health
list. What's sent doesn't change: only what you write and today's date, never your lists' names (matching happens on
the device). The suggestion's checks: at most two new lists per suggestion, plain words (no emoji or pushy words),
names up to 40 characters, and never on a repeating task. Tasks already open in Tasks count as "already there".
With 30 lists already, the task goes to the queue and the message says so. One step of **Undo** takes back the
tasks it added (unless you've changed them, marked them done or put them on a day's plan) and a list it made, if
that list is still empty and has its name. No saved-data change: Tasks has had its own lists since 1.5.0, so
there's no migration and no database change. The server's instructions are `myday-tasks-v2` (contract version 2); an
older app still gets version 1. Evaluated live on GLM-5.3-Flash with every reply read
(`ai-eval/reviews/2026-10-20-tasks-lists-quality.md`, about US$0.007).

## Milestones

1. **Done:** project set-up, design, shell and navigation, themes, the shared storage layer, and a fully working Today.
2. **Done:** Calendar and Pay (Pay became Finance after release 1.1.0).
3. **Done:** Study, with its card on Today.
4. **Done:** Workout (the first half of Health), with its card on Today.
5. **Done:** Food (the rest of Health), with the cooking and shopping reminders on Today.
6. **Done:** final checks: the shared controls on every section, a whole-app comparison with the current MyDay,
   representative backups, unreadable data never left out silently, keyboard, phones, themes, development mode and the
   production preview. Ideas was only a placeholder, so there was nothing to move.
7. **Release 1.0.0:** published with GitHub Pages — the new app at the main address, the classic MyDay kept at
   `/myday/classic/`. The release identifier ("MyDay 1.0.0 · commit · build date") is at the bottom of every screen.
   See [`../deploy/README.md`](../deploy/README.md).
8. **Cloud sync, first part — release 1.1.0:** sign-in, and syncing task lists, the queue, daily plans and day
   context through Supabase, with reviews, conflicts and deletions handled. Checked with a local stand-in and against
   the real project with disposable test accounts.
9. **Release 1.2.0:** Finance replaces Pay (work pay from the Calendar, money owed, monthly expenses, what's left
   over), and AI help on Today for signed-in accounts — "Help me adjust today" and "Add what's on my mind" — through
   the `ai-plan` Edge Function (GLM-5.3-Flash, after evaluations on synthetic days and brain dumps; see
   [`../ai-eval/README.md`](../ai-eval/README.md)). Built with `VITE_AI=edge` in `.env.production`.
10. **Release 1.3.0:** Notes (your own categories, from a card on Today), Study topics (more than one subject, each
    with its own roadmap; new courses can be suggested on Today), and Health → Goal (a goal, a few questions and a plan
    from public guidance, connected to Workout, recipes and Today). Notes and Goal are new sections the classic MyDay
    keeps unread; Study topics are kept by both versions.
11. **Release 1.4.0:** Inbox (a sixth section) with Notes as an Inbox, optional collections and search, and Capture
    on every screen — suggestions from what you type (Calendar, a task, an idea, a note), worked out on the device.
    Part 1 of 3: Tasks and Ideas follow.
12. **Release 1.5.0:** Tasks in the Inbox (part 2 of 3): every task in one place with dates and times, your own lists,
    "Due today" on Today with one tap to add a task to the plan (within your energy's limit), and Capture's tasks
    going there with their dates. Ideas (part 3) follows.
13. **Release 1.6.0:** What MyDay has noticed — patterns in how you actually work, from your own history on the
    device, each with a "Why?" and only used once you say so; your preferences (task length, most tasks a day) used by
    Build my day in the open; and "What's getting in the way?" for tasks that keep moving.
14. **Release 1.7.0:** Study's home page organised by topic — your topics as cards with their next step, progress
    and when you last studied them, and a page for each topic (up next, its courses, its roadmap).
15. **Release 1.8.0:** everything you enter syncs with your account — Calendar, Finance, Inbox, Study, Health, Goal,
    What MyDay has noticed and planning settings, besides Today — items one by one, other parts as one record each
    (a second database migration, `sync_records`).
16. **Release 1.9.0:** your MyDay follows your account — sign in first (a sign-in screen on a device that isn't
    signed in), signing in combines the device with your account by itself (your account wins where they differ; the
    device's version kept aside), every change saved to your account automatically, and signing out clears the
    device once everything is saved. Wording: "Saved to your account", "Your account", "Update now".
17. **Release 1.10.0:** installable as an app — a manifest, icons and a hand-written service worker (offline, always
    the latest release); "Install MyDay as an app" in the footer when the browser offers it.
18. **Release 1.11.0:** a new, warm look across the app — peach page, white cards, orange actions, green for done,
    light by default, an orange side menu on wide screens, a floating bar on phones and an orange app icon, with
    softer depth and quieter tools so it feels calm and expensive — and Today as a dashboard: a greeting with your
    name, a drawn scene and a calendar, quick add, a focus timer card, a "2 of 3 done" ring and this week's bars, and
    Focus mode (just what's next).
19. **Release 1.12.0:** Projects — the spine of MyDay's progression (capture → understand → organise → explore →
    decide → act → reflect). The Inbox became Projects (Projects and Notes); Tasks moved to Today. A project gathers
    its notes, tasks, appointments and progress, and its one next step reaches Today ("From your projects"). Capture
    can start a project from an idea. Synced (database migration `20261006120000_sync_projects.sql`, applied first).
20. **Release 1.13.0:** Understand & connect, part 1 (on the device, no AI) — MyDay puts notes that clearly belong to
    a project into it by itself, with why, Keep and Undo ("MyDay connected these"); related notes; "Might belong
    here"; private notes; notes in a project leave the Inbox. No database change (the link details are on each note).
21. **Release 1.14.0:** Study → Cybersecurity (built in another session, reviewed and merged): the 27-module curriculum
    with a learning map, paths you can add to your Study roadmap, lessons, labs and projects, a Practice shelf, a lab
    notebook with provisional rubric scores, and optional AI explanations from the tutor (only the lesson id and your
    question are sent). Needs database migration `20261007120000_sync_cybersecurity.sql` and the updated `ai-plan`
    function, both before publishing (see `../CYBERSECURITY_INTEGRATION.md`).
22. **Release 1.15.0:** Understand & connect, part 2 — AI help with notes, once you switch it on: it places the notes
    MyDay can't (never private ones), says what kind each is, with Keep and Undo; "Add as a task" for notes that are
    things to do. Needs the updated `ai-plan` function (the `connect` action) deployed before publishing.
23. **Release 1.16.0:** a calmer, neutral design across the app (it replaces the warm peach look); Explore, the
    Hargeisa Marketplace story (seven scenes, openly licensed photographs, only "Create this task" saves); revision that
    tells a slip from what hasn't clicked yet, with a gentle stop after ten reviews a day; and Study → Arabic Fuṣḥā,
    parts 1–2 (the course, read-only, and your lesson sessions, saved and synced). Needs database migration
    `20261011120000_sync_arabic.sql` before publishing. Going back to 1.15.0 is safe: it keeps the `arabic` section
    unread.
24. **Release 1.17.0:** Study → Arabic Fuṣḥā, part 3 — starter words and lesson checks in revision, only when you add
    them: recognising a word first, writing it from memory as a second card you add, a lesson's checks from the lesson
    or when you finish a session there. The same rounds and rules as your concepts ("Revise Arabic" for Arabic alone),
    self-assessed, never marked. Saved as `arabic.cards`, answers in `study.reviews`. Database migration
    `20261012120000_sync_arabic_cards.sql` was applied before 1.16.0 was published, so there's no database step.
    Going back to 1.16.0 is safe: it keeps `arabic.cards` as they are.
25. **Release 1.17.1:** Arabic curriculum 1.1.1 — the definite article's sukūn restored in six fully vowelled beginner
    examples (e.g. أَنَا فِي الْبَيْتِ.), matching the starter texts and words. No other change; new sessions record
    curriculum 1.1.1, earlier ones keep 1.1.0.
26. **Release 1.17.2:** groundwork, nothing new to see. The Cybersecurity section keeps fields a newer MyDay adds (so
    going back from 1.18.0 is safe), and the AI server's code matches what's deployed (`ai-plan` version 6: one model
    per kind of job, Gemini set up but switched off, and the tutor's instructions v2). No saved-data or database change.
27. **Release 1.18.0:** Study → Cybersecurity's own knowledge checks in revision (no AI): 292 questions with the course's
    reference answers, brought back only when you choose, in the same rounds as everything else or alone with "Revise
    Cybersecurity". Saved as `cybersecurity.cards`, answers in `study.reviews`. Database migration
    `20261014120000_sync_cyber_cards.sql` was applied before publishing. Going back to 1.17.2 is safe: it keeps
    `cybersecurity.cards` as they are.
28. **Release 1.19.0:** Study → Cybersecurity → More practice: up to 10 cards on a lesson's key ideas, written by
    Gemini 3.8 Flash and checked by GLM-5.3-Flash (chosen by a live evaluation judged blind on accuracy:
    `../ai-eval/reviews/2026-10-13-cards-quality.md`), shown only after the check, added only when you keep them, as
    Study concepts with where they came from (`origin`, kept by both versions; also in words in their source). Needs
    `ai-plan` version 7 and its settings (deployed first). No database change. Going back to 1.18.0 keeps the cards as
    ordinary concepts — their source still says AI-written — but drops `origin` when it saves.
29. **Release 1.19.1:** groundwork, nothing new to see. Both versions keep an AI card's origin for any subject (a
    note, later a PDF) as short plain values — so going back from the cards-from-notes release, or a device still on
    this version, never loses where a card came from. No other change; no database change.
30. **Release 1.20.0:** revision cards from your notes. With "AI help with notes" on, a note (never a private one)
    offers "Make revision cards": a check flags doubtful lines (left out unless you say they're right), then cards are
    written from the rest and checked by the other model; you keep the ones you want. Gemini 3.8 Flash checks the note
    and the cards, GLM-5.3-Flash writes them (`../ai-eval/reviews/2026-10-14-note-cards-quality.md`). Needs `ai-plan`
    version 9 (Supabase's numbering), then `AI_ROUTES` with "note-check" (in that order). No database change. Going back to 1.19.1 is safe: it
    keeps the cards and their origin.
31. **Release 1.20.1:** a fix for 1.20.0. Making cards from a note asked for the cards straight after the check, and the
    server's pause between requests (5 s) refused it — "Just a moment between requests", every time a note had
    nothing doubtful. The cards request now waits until 6 s after the check began, and tries once more if told it's
    too soon (such a refusal isn't counted). Found by the live check after publishing; now tested through the
    server's real code with the pause on. No data or server change.
32. **Release 1.20.2:** groundwork, nothing new to see. Every version keeps an explanation you kept on a revision card
    (`anotherWay`: its text, the model that wrote it, the day) — on your concepts (both versions), Cybersecurity checks
    and Arabic cards — so going back from "Explain it another way" never loses one. No database change.
33. **Release 1.21.0:** a new look, called Clarity: warm paper instead of white, teal as the one accent, calmer
    square corners — same app underneath. And the learning garden retires. Today keeps one learning card: the rolling
    7-day count (nothing ever resets it), now with one quiet line pointing at what's next in your current topic and
    when you last sat with it. And Study gains your map (milestone 5): each stage is a line, each course a station, lit up to where you stand, with a finish-line flag per stage and a quiet ring on courses whose concepts might benefit from more practice. Then
    (branch `map-polish`) the unexplored sits in fog — beyond the station after where you stand, the line runs dotted
    into a soft mist; phones list the stations top to bottom with every name in full, wide screens draw the line at its
    real width (names at 14 px, shortened only when they'd touch a neighbour, never overlapping the flag); every colour
    comes from the theme, so dark mode reads properly; the key is drawn with the stations' own shapes; topics are plain
    links; and "Start 15 minutes" goes straight from where you stand — on the map and on Today's learning card — into a
    short session on the next task. And Projects gains a third tab, Connections — the knowledge graph (milestone 4):
    how your notes and projects connect, drawn by itself from links already there (a note in a project, dashed while
    MyDay's link isn't kept; related notes, dotted), with a dot's connections and why on a tap, Keep / Undo for MyDay's
    links, and "What goes together" in words. No data change, nothing sent anywhere.
34. **Release 1.22.0:** "Explain it another way" (AI roles step 4): under any revision question once its answer is
    shown, one tap asks for a fresh explanation from another angle — GLM for Cybersecurity and your concepts, Gemini for
    Arabic — sent with only the question, its answer and your answer. Shown as AI-written; "Keep this explanation"
    saves it on the card for next time. The server side was deployed first (16 Oct 2026). No database change.

35. **Release 1.23.0:** Daily exercises in Health → Workout: a small set of everyday movements, each with a daily
    target and a set size you choose ("150 push-ups, in sets of 25"). One tap on Today logs a set and counts down
    what's left, with a quiet undo for a mis-tap; finished exercises fold away to a tick. Missed a day? The target
    starts fresh tomorrow — nothing piles up. Adjust targets or add exercises in Health; changes apply from today,
    days already logged stay as they were. Saved as `health.daily` (the current MyDay keeps it unread, like Notes),
    synced as one `daily:moves` record — database migration `20261016120000_sync_daily.sql` applied first (17 Oct 2026;
    older versions keep working with it). Undo, Archive and the − / + steppers are full-size tap targets on phones.
36. **Release 1.24.0:** Study → Reading: the books you're reading, the page you're on (a page at a time, or typed),
    notes per book with their page, Edit for the details that come later, and a Finished shelf. No percentages, nothing
    on Today, never in the learning streak. Synced one record per book — database migration
    `20261017120000_sync_books.sql` applied first (one more kind, `book`); older versions keep working with it.
37. **Release 1.25.0:** Ask MyDay in the + button (step 1 of the AI design): a question, a breakdown into steps or
    several things at once, answered as cards to tick and edit — nothing saved until you tap Add, with Undo; "plan my
    day" opens Help me adjust today already filled in. Only on your tap, with exactly what's sent shown first (the values
    themselves, and everything on request); never a private note. The server's `ask` job was deployed first. No data or database change.
38. **Release 1.26.0:** Teaching in every Cybersecurity and Arabic lesson (PR #1): a short explanation, a worked
    example, "Try it" with an explained answer behind a button, and assigned reading, watching or listening from
    reputable sources (168, checked 16 Oct 2026) — loaded only when a lesson opens, never marking progress. Arabic gains
    a Show / Hide transliteration choice (remembered on the device) and a pronunciation guide; missing vowels are
    bracketed, not guessed. And Ask MyDay plans a Study course: "Plan this course with Ask" on a course page sends the
    course's outline (shown first) and proposes study tasks into its sections — or new ones — to tick, edit and add
    into the course on your roadmap, with Undo. The server's `ask` job (instructions `myday-ask-v10`) was deployed
    first. No data or database change.
39. **Release 1.27.0:** Ask MyDay can start a revision round when cards are due, and change what's already saved on
    the page you're on — a task's or appointment's day and time, a title, a task's length or list, a task's or note's
    project — shown before → after, applied only when ticked, with Undo; never deleting or ticking off. Today gets one
    quiet line above the plan when it helps (too much for the time or energy left, or a task due today to start with).
    And a new page, What MyDay knows, says exactly what each kind of AI help sends and what never leaves MyDay. The
    server's `ask` job (instructions `myday-ask-v12`) was deployed first. No data or database change.
40. **Release 1.28.0:** small fixes. Notes have a small **Private** switch at the top (a lock marks private notes in
    lists), and AI help with notes now waits until you've left a note and it's had 5 minutes without changes, so a
    new note can always be made private before AI help could look at it. A task on today's plan that you move to a
    later day comes off today's plan too (Undo in Ask puts it back). Today's theme test no longer fails at night (it
    read the browser bar a moment too early). No data or database change; no server change.
41. **Release 1.29.0:** a task's page has **✦ Break into smaller steps** (only when the app has AI help, and not on a
    done or let-go task). It opens + with Ask MyDay already filled in; nothing is sent until you tap it, and the
    preview shows the task's title, date, length and notes. Up to 8 small steps come back, checked on the device: they
    go in the task's own list and open project, whatever was suggested, and a step whose title is already on your
    lists starts unticked. Add saves the ticked steps as tasks in one go, with Undo; the task itself is never changed.
    No server, data or database change.
42. **Release 1.30.0:** Projects has a board of your active projects in three columns: **Ideas** (capture, understand,
    organise), **Exploring** (explore, decide) and **Doing** (act, reflect). One tap moves a project to the next
    column (at its first stage) or back (at its last). When more than three projects are being explored, or more than
    two are in Doing, the column says so gently: "pausing one is fine, it'll keep". Paused and done projects stay
    folded away below. A project's page has **Recently**: up to five things from lately, newest first (tasks added or
    done, notes written or changed), each opening what it's about. No server, data or database change.
43. **Release 1.31.0:** milestone 3, release 2. A project's page has three tabs, **Overview · Milestones ·
    Decisions**, each with its own address, so Back works. Overview keeps everything it had and gains two small cards:
    the milestones reached with the next one and its aim, and the open decisions. **Milestones** are the big markers
    on the way, in your order (up to 30), with an optional date to aim for, shown gently and never as late.
    **Decisions** set a question against 1–4 options, each with its own pros and cons (up to 6 each; no scores, no
    winner). Nothing is automatic: no tasks, appointments or reminders are made. No server or database change: saved
    data only gains these two optional lists inside each project, and going back to 1.30.0 is safe (it keeps them,
    unseen).
44. **Release 1.32.0:** AI help with milestones and decisions, through Ask MyDay, only on your tap. **Suggest
    milestones** works on a project's Milestones tab, and **What am I missing?** on an open decision (once you've
    written a pro or con yourself). Suggestions come back as cards to tick; Add saves them with the usual rules, with
    one step of Undo. It never chooses for you. **Private projects** (a switch at the top of a project's page) send
    nothing to Ask MyDay, and their AI buttons give way to a note saying so. What MyDay knows and AI help with notes
    say all this. The server's `ask` job (instructions `myday-ask-v13`) was deployed first. No database change; going
    back to 1.31.0 is safe.
45. **Release 1.33.0:** milestone 3, release 3: the Business template. Start a project now offers a kind, General or
    Business idea, and About it → Edit can change it later (back to General keeps the one page, out of sight). A
    business idea opens on its **Model** tab, **Your business on one page**: four simple questions in your own words,
    the fourth a list of what must be true. Each of those has **Find out** (a 15-minute task in the project, no date)
    and is marked **Looks true** or **Doesn't hold** only by you. Overview's "Your one page" card gives counts, never
    percentages, and Explore's brief for a business idea is built from the one page. No AI is used, and Ask MyDay sends
    nothing of it. No server or database change; going back to 1.32.0 is safe.
46. **Release 1.34.0:** milestone 3: AI help on a business idea's one page, through Ask MyDay, only on your tap.
    **Suggest what must be true** (on the Model tab, under question 4, once the first three questions are answered;
    never on a private project) offers up to five things your idea may depend on, as cards to tick. MyDay checks
    each one itself (this idea only, at most 110 characters, not a question, not already on your list, within the
    12); Add puts them on your list as Not checked yet, with one step of Undo. It never marks anything or says
    whether the idea will work. The one page is sent only from the Model tab, and never what you found.
    Instructions `myday-ask-v14`; the same 20 AI requests a day, shared. The server's `ask` job was deployed first;
    no database change; going back to 1.33.0 is safe.
47. **Release 1.35.0:** milestone 3, release 4: the Case template. Start a project offers a third kind, Case, and
    About it → Edit → Kind of project can change it. Switching keeps a case's records out of sight until you
    switch back. A case has the tabs Overview, Timeline, Evidence and Issues. Timeline entries are dated; each
    entry's source is My account, Their account or In the evidence. Evidence is To get, Have it or Reviewed, with
    one-tap Got it or Reviewed. Issues are Considering, Claiming or Dropped, each listing its linked evidence and
    timeline entries. Add a deadline on the Your case card adds a dated task, and MyDay never works out legal time
    limits. Private works as for any project, and a case's timeline, evidence and issues never go to AI. No server
    or database change; going back to 1.34.0 is safe.
48. **Release 1.35.1:** a fix. Text is cut to a length in many places, and a cut in the middle of an emoji left half a
    character behind; your account refuses a record holding one, and the device would then stop syncing (it kept
    retrying that change). MyDay now takes such halves out whenever it saves, as it reads saved data, and from a
    change waiting to be sent (`mendHalves` in `src/data/util.ts`); whole emoji, Arabic and every other character
    stay exactly as they are. Checked against the database stand-in (real PostgreSQL), which refuses halves as the
    account does: without the fix sync stops, with it everything is saved. No server or database change; going back
    to 1.35.0 is safe.
49. **Release 1.36.0:** milestone 3, release 5: dashboards per kind of project. Every project's Overview starts
    with **At a glance**, worked out from what's already saved (nothing new is saved). Four tiles per kind link
    to where you'd act. Pictures appear only when there's something to show. **Worth a look** gives at most three
    gentle pointers from real data, never "overdue" or "late". **Summarise this** opens Ask MyDay with
    "Summarise where this project is, and the one next step", only on your tap and never on a private project;
    the summary says only what the data shows (instructions `myday-ask-v15`). The practice helper answers it too.
    The server's `ask` job was deployed first; no data or database change; going back to 1.35.1 is safe.
50. **Release 1.37.0:** milestone 6, Reflect: **Your week**, a short look back over the last seven days, at
    `#review`, in four steps, one at a time: what moved, what's waiting (at most five, and nothing changes until
    you tap), next week's focus (up to three active projects, shown first on Today), and a line or two saved as
    a note. A card on Today on your review day, and a link from Projects.
    **See the pattern** (only on your tap, with AI help) names a pattern or two in your week. Saved data is
    all optional. The server's `ask` job was deployed first; no database change; going back to 1.36.0 is safe.
51. **Release 1.38.0:** word families on the Arabic vocabulary page. A **Word families** card above the word list
    shows the four roots that connect 12 of the 48 starter words (ك-ت-ب, د-ر-س, ق-ر-أ, ط-ل-ب): tap a word for its
    note, reading and meaning, and a way to it in the list with its revision buttons. Each family's pattern is
    explained, and the other 36 words are named in two honest groups. Families are MyDay's own authored file,
    checked at every build; nothing is saved and revision is unchanged. No data, server or database change; going
    back to 1.37.0 is safe.
52. **Release 1.39.0:** a voice for the Arabic starter words. A play button sits beside each of the 48 words and their
    examples, and in a family word's note: one synthesised voice (Chirp 3 HD), chosen by ear, cross-checked by a second
    model and listened to in full, and labelled "Synthesised voice — a model to copy; checked by ear, not yet by a
    teacher". A Slower switch plays at three-quarter speed, and each clip is kept for offline use the first time it
    plays. Word families gain four more forms from your examples (أَكْتُبُ, نَدْرُسُ, أَدْرُسُ, أَقْرَأُ, with what أَ
    and نَـ mean) and fuller notes on the plural كُتُب and on ق-ر-أ, taken from a cloud session’s version of the same
    feature. No saved-data, server or database change; going back to 1.38.0 is safe.
53. **Release 1.40.0:** a voice for each lesson’s example, and lists from "Add what’s on my mind". 146 of the 152 Arabic
    lessons’ headline examples have a play button: the same synthesised voice, cross-checked by a second model and
    listened to in full; clips now belong to their exact text and are shared. A one-off task from "Add what’s on my
    mind" can go into one of your Tasks lists or a new one the suggestion names; a new list only when two or more tasks
    share it; what’s sent is unchanged and names are matched on the device; Undo takes back a list it made. The server’s
    instructions were deployed first (`myday-tasks-v2`); no saved-data or database change; going back to 1.39.0 is safe
    (the lessons’ examples simply have no button there, and the tasks and lists are ordinary Tasks data).
54. **Release 1.41.0:** a voice for the eight vowelled Arabic reading texts. **Listen to
    the whole text** plays sentence by sentence, or tap a sentence to hear only that one. The current sentence lights
    up; Stop, choosing another sentence or leaving the text ends whole-text playback. The same clips play with vowel
    marks shown or hidden, using the shared Slower choice. Dialogue names stay visible but are not spoken. The 55 new
    clips were independently transcribed and listened to in full ("all fine"); the label still says they are synthesised
    and not yet teacher-checked. Unvowelled B1/B2 texts keep their no-recording note. No saved-data, server or database
    change; going back to 1.40.0 is safe (reading-text controls simply disappear).
55. **Release 1.42.0:** a voice for fully vowelled teaching examples, sound pairs and word-family
    notes and forms. Try it and solutions gain controls only after **Reveal explained answer**; hiding them stops
    their audio. Lesson-check prompts and reference answers gain controls only after the references have loaded,
    in ordinary lessons and sessions. Revision cards are unchanged. The same voice, Slower and offline cache apply;
    isolated letters, syllable drills, affixes, unfinished words and unvowelled or shadda-only pieces stay silent.
    363 new clips were transcribed blind, with 27 retakes; you listened to all 357 eligible clips ("both fine").
    Six uncertain recordings are held for a fluent reviewer; 643 checked clips ship.
    Only checked clips enter the app, with the same synthesised-voice label.
    No saved-data, server or database change; going back to 1.41.0 is safe.
56. **Release 1.42.1:** one **Cybersecurity** card on Study's home, for the current guided path. **Your saved courses**
    on it shows task completion and course count, including courses set aside, and opens your original Cybersecurity
    topic page. Your topics, courses, progress, sessions and revision are unchanged.
    No saved-data, server or database change; going back to 1.42.0 is safe.
57. **Release 1.43.0:** Today offers the next lesson, a saved session or a revisit in your chosen default subject.
    General-course check-ins continue their own course first; recorded completion stays separate from mastery.
    Cybersecurity can add the selected path and start its lesson in one saved step; failed saves leave work unchanged.
    Reset Study progress requires a fresh, checked full backup and confirmation before clearing learning history.
    Your outline, concept questions, revision cards, separate notes and other MyDay sections remain;
    see [Guided Study](#guided-study) for exactly what is removed, backup safeguards and verification results.
    Going back to 1.42.1 drops the new subject preference; only importing the pre-reset backup can undo a reset.
    No database migration or server deployment is needed.
