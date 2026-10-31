# Live checks

Checks that run against the real services: the published site (or a local production build) talking to the real
Supabase project, its Edge Functions and the R2 buckets. They write made-up records to the live database and tidy
them, so **each run needs the owner's yes** (AGENTS.md, "Releases and external actions"). Local suites
(`tests/run.sh`) use the stand-in; only these touch the real project.

## Running one

```
python3 -I tests/live/run.py live-files.js --version 1.77.0 --src <published commit>
python3 -I tests/live/run.py files-direct.mjs --version 1.77.0 --src <commit> --account C --other B
python3 -I tests/live/run.py live-files.js --version 1.77.0 --src <commit> --local    # before publishing
```

- **Accounts:** disposable `@example.com` accounts only, `TEST_<X>_EMAIL` / `TEST_<X>_PASSWORD` in the main
  checkout's ignored `supabase/live-check*.secret.env` (or a folder named by `MYDAY_LIVE_SECRETS`). `--account`
  picks one (default `MYDAY_LIVE_ACCOUNT`, else A); `--other` a second for isolation checks (default B). Each
  session has its own account, so their checks never meet: agree which before running one.
- **`--local`:** builds this worktree's app for production and serves it at `http://127.0.0.1:5500/myday/`, one of
  the addresses the files function and the attachments bucket allow. Use it before publishing whenever the release
  depends on a changed Edge Function, a migration or storage: it tries the exact build against the real services.
- **Browser checks** (`.js`) get a throwaway headless Chrome (`MYDAY_LIVE_CDP_PORT`, default 9587) whose profile is
  removed afterwards; API checks (`.mjs`) don't need one. A failed run keeps its temporary folder for a look and says
  where; remove it when done.
- Nothing about the accounts, tokens or links is printed.

## The checks

| Check | What it proves |
|---|---|
| `live-files.js` | Files on two devices: add a photo, a PDF and a text file (kept in R2), the preview, Open (a PDF inline; a document saved under its name), an SVG refused, the phone at 320 px, Remove / Recently deleted / Put back / Delete now, the storage line, then the project deleted and nothing left in R2. |
| `files-direct.mjs` | The files function and R2 directly: sign-in first, the signed headers and five-minute links, R2 refusing a longer body, other bytes or another type, the bucket's CORS for the site, the server's check of what was stored, previews only for photos, isolation from another account, delete's known areas, usage. |
| `live-graduated-help.js` | Graduated help for Arabic words on one device (1.112.0): Vocabulary explains it and offers "Always show the help", off to begin with; switching it on is remembered on this device (surviving a reload), and off again; nothing saved, on the device or in the account's Arabic and Study records. A word becoming known needs revision over days, so that part is in app-arabic [16]. Reads only (beyond signing in). |
| `live-needs-you.js` | The Projects home's Needs you and Board · List on two devices: a made-up project's task due today shows at the top ("today · <project>") and opens its task; List shows "1 needs you" and stays on that device only; the phone (320 px) gets the same item by sync, keeps its own board view, marks it done, and it leaves Needs you on both; then the project and task are deleted everywhere. |
| `live-research.js` | Research on two devices: switched on (the project's tools saved), a question, a typed source and a finding supporting it, the live database holding them as `research` records exactly, the phone receiving them at 320 px and marking the question answered, the Mac receiving that, then the project deleted and its research with it, in the account and on the phone. |
| `live-cyber-lessons.js` | Cybersecurity lesson states on two devices, on an account without the path in its roadmap: Ready to move on (the lesson record and its two knowledge checks in the live database as `cyber_lesson` and `cyber_card` records exactly as on the device; the module and the map show it), the phone receives it and flags Needs revision with what needs work, the Mac clears it with Done revisiting, the phone takes Ready back (a deletion marker), the phone at 320 px with 44 px buttons; then the checks are removed and both devices’ learning data is as before. |
| `live-arabic-skills.js` | Arabic's four skills on two devices: two made-up finished sessions reach the live database as `arabic_attempt` records exactly; Progress's "Arabic: four skills" counts them on the Mac, with the course's A1 guide and no percentage, and the phone shows the same card word for word (320 px, 44 px links); an open session's Reflect says which skills the lesson asks for, ticking nothing; then the sessions are removed (deletion markers) and both devices' learning data is as before. |
| `live-sections.js` | A project's optional Overview sections on two devices: a new project's empty cards fold into "Add to this project"; "A link" adds one; hiding Resources (About it → Edit) is saved in the project's own record in the account; the phone (320 px) receives it as "Show Resources (1)" and shows it again, which reaches the Mac; then the project is deleted everywhere. |
| `live-steps.js` | Steps and "Starts after" on two devices: a project's task gains two steps (one ticked) and starts after another task, the live database holds both inside the task record exactly, the next step skips it and "Why this?" says why; the phone (320 px) receives it, ticks the last step (the offer appears, nothing is marked by itself) and marks the other task done; the Mac receives that and the task is the next step again; then the project and both tasks are deleted everywhere. |
| `live-evidence.js` | Decisions backed by evidence and tasks toward milestones on two devices: a made-up Research project's decision gets two options, a finding supporting one, and that one chosen ("— with 1 finding for", kept with the choice); a milestone and a task toward it; the live database holds the decision's evidence, the finding about the option and the task's milestone exactly; the phone (320 px) receives them ("0 of 1 tasks done") and ticks the task, which reaches the Mac ("1 of 1"); then the project and task are deleted everywhere. |
| `live-welcome.js` | Welcome back on one device: a made-up project and task made the usual way (no welcome: just worked on), then its last work moved 18 days back on this device; its Overview opens with "Welcome back" (away 2 weeks, what you did last, where I left off, the next step); "Got it" puts it away on this device (a reload keeps it away) and the Projects home says "Away 2 weeks"; then the project and its tasks are deleted everywhere. |
| `live-business.js` | A business idea's experiments and money on two devices: a made-up business idea's thing that must be true gets an experiment (planned, started, its result recorded, then — on a tap, never by itself — saved as a finding, switching Research on, the thing still not checked); its Money tab gets a currency, an average sale and four lines ("429 orders a month"); the live database holds the experiment and finding as research records and the money inside the one page's record exactly; the phone (320 px) receives it all and adds a real month, which reaches the Mac; then the project is deleted everywhere, its research with it. |
| `live-areas.js` | Project areas and the archive on two devices: two made-up projects are put in a made-up area (the second joins it with its colour; the project's top shows it), the area gets another colour from Areas… (their "updated" time unchanged), and the second is finished — stopped on purpose, with a note; the live database holds both projects' area, colour and ending exactly; the phone (320 px) shows the area's chip counting the one still going, the first card's area and the second in the Archive ("Stopped on purpose ·"), and brings it back, which reaches the Mac (active, no ending, still in the area); then both projects are deleted everywhere. |
| `live-project-waiting.js` | A whole project waiting on two devices: a made-up project is marked as waiting from Manage, checking back today (the Overview starts with it; its "updated" time unchanged); the live database holds the wait exactly; the phone (320 px) shows "Waiting on … · check back …" on its card and "Still waiting on …" · "check back today" in Needs you, and chases it there ("Chase: <project>", 5 min, today); the Mac receives the chase and says No longer waiting, which reaches the phone; then the project and the chase task are deleted everywhere. |
| `live-deadlines.js` | Deadlines you can trust on two devices: a made-up Case's "Add a deadline" makes a firm deadline with where its date comes from, Coming up says so, and the task's page adds who checked it and when; the live database holds those details inside the task record exactly; the phone (320 px) receives them, marks the task done and, offered (never by itself), notes it on the case's timeline with one tap, and the account holds that entry; the Mac receives it and the task says it's noted; then the project and the task are deleted everywhere. |
| `live-course-words.js` | Arabic course words on two devices: a module 4 lesson shows its 9 words (with a voice); Ready brings its 13 words and 3 checks into revision, in the live database as `arabic_card` records exactly as on the Mac; the phone receives them and its Vocabulary lists "Words from the lessons" (320 px, 44 px); the Cybersecurity map speaks of notebook ratings, not scores; then Ready is taken back, the cards removed (deletion markers) and both devices' learning data is as before. |
| `live-ask-undo.js` | Ask MyDay's Undo from + on two devices, without the AI: two made-up tasks kept as Ask's last add on the Mac, one ticked on the phone; + on the Mac offers "Last from Ask MyDay" (the phone, another device, doesn't); Undo takes back the untouched task, keeps the ticked one and says so; the phone and the live account agree; tidied. |
| `live-explainers.js` | The Arabic explainers on one device (1.98.0): the weak-verbs lesson's How it works with its five cards; a card's table, sentences and questions (one answered wrong, one right); module 15's إِنَّ and كَانَ lesson and module 7's time and days lesson, two cards each; Vocabulary's 147 links, one opening the irregular-families lesson with the Take card open below the step bar; no sideways scroll at 320 px; nothing saved, on the device or in the account's Arabic and Study records. Reads only (beyond signing in). |
| `live-menu.js` | The side menu on pages of their own (1.99.0), on one device, read-only and without the AI: Today and Calendar mark their section; Search marks no section (the Search button instead); What MyDay knows and What MyDay has noticed mark only their own link; Your backups and Your week mark nothing |
| `live-voice-places.js` | The Arabic voice in its newer places on one device (1.102.0): a key idea read from MyDay's vowelled copy plays, with its label; a lesson's objectives and the weak-verbs task have their buttons, which wait while you check yourself and come back on Try; the Say explainer's 27 buttons, a form playing; the timetable's 15 cells, each named apart, one playing; no sideways scroll at 320 px; nothing saved, on the device or in the account's Arabic and Study records. Reads only (beyond signing in). |
| `live-how-you-work.js` | "Let Ask MyDay use how you work" on one device, without the AI: a preference and the switch on, the card listing what would be sent, + saying "How you work" goes, then everything back as it was |
| `live-ask-keep.js` | Today's Ask MyDay conversation kept on the device, with the real AI (one request): answered, closed, offered on another page, carried on with its thread and a reply box, kept out of the synced data, forgotten by Start over; nothing added |
| `live-ask-conversation.js` | A longer Ask MyDay conversation on one device with the real AI (two requests): a made-up question answered, a reply answered with the conversation above it, closing + forgets it, nothing added |
| `ask-conversation-api.mjs` | Ask MyDay's conversation on the live ai-plan function, before (`MYDAY_EXPECT=v24`: every conversation refused) and after deploying v25: four bad requests refused with no model call; one conversation answered with a "left" count (one AI request); the published app's single follow-up still accepted (held only by the pause) |
| `live-wipe.js` | Delete everything on two devices. **It wipes the whole account.** |

## Writing one

- Made-up data only, named "(made up)"; tidy first (anything an earlier stopped run left) and last.
- `synced(d)`: wait half a second (the badge shows a change 300 ms after it), then for the badge to say synced and
  nothing to be waiting (`link.out` empty). Read the account only after that.
- Never ask the page anything while it may be reloading itself (after a wipe, say): wait, then `open()` again.
- Return plain values from `ev()` (`!!document.querySelector(…)`, never an element).
- `devices.js` is `tests/cdp-devices.js` with two differences: a page load that stalls (the live site sometimes does,
  from here) is stopped and retried, up to four times; and `open()` marks the page already open, so it never mistakes
  it for the new one (it waits up to 30 s for a document without the mark).
- Pull rows carry `record_id` (not `id`); keep the newest row per record.
- A text box that saves when you leave it (`CommitTextarea`, `CommitInput`) saves on the native `change` event: after
  typing into one, dispatch `change` (or blur it), or nothing is saved.
- A page's code chunk sometimes stalls from GitHub Pages: if a lesson or screen doesn't appear within a minute, load
  the page afresh once before calling it a failure.
