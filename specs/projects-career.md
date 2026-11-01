# Career projects: roles, applications and interviews

**Status:** the owner's decisions in §2 (1 November 2026); being built on branch `career-tools`. Nothing live without
the owner's yes; a new synced kind needs a migration, applied with the owner's yes.
**Based on:** source at 1.122.0. Plan: `specs/projects-vision.md` §6 (the Career development template: "begin with
General plus Study and resource links; add application tracking when needed") and §10 "Personal and career projects"
("Career projects can coordinate target roles, portfolio work, qualifications, applications and interviews. Study
should continue to own the associated learning"; "dedicated specialist records … when they improve a real workflow").
The kinds of project are defined in `app/src/data/templates.ts` (1.122.0).

## 1. The practical problem

Looking for work — the owner's ambition of working in cybersecurity is one — means keeping many applications in mind:
where each stands, when you applied, who to chase, when an interview is and what to prepare. Spread over email, notes
and memory, an application is easily forgotten, a follow-up never sent, an interview prepared the night before.

## 2. The owner's decisions (1 November 2026)

1. **Roles, applications and interviews** first: the roles you're aiming for; each application with where it's at; its
   interviews with prep and questions to ask. Study and the Cybersecurity portfolio stay where they are and can be
   linked (qualifications as their own records come later, if a real need shows).
2. **Stages: Interested → Applied → Interviewing → Offer, or Closed.** Closed says gently why, in your words ("Not this
   time", "I withdrew", "No reply") — never counted as rejections or shown as a rate.
3. **A gentle follow-up nudge after 10 days:** in Needs you, once: "Heard back from <company>?" with **Follow up** (a
   task) or **Close it**. Nothing on Today unless you make the task.
4. **Interviews hold prep, questions and a Prepare task:** its date and time, kind (phone, video, in person), prep notes,
   questions to ask, and how it went; a "Prepare for <company> interview" task the day before.

## 3. What you see

- **A new kind of project, Career** (Start a project, or Edit → Kind of project). Its tabs: **Overview, Applications,
  Milestones, Decisions** (and Research when it's on).
- **Overview:** "Career at a glance", in words and counts: "3 applications open · 1 interviewing", "Next interview:
  Acme — Tue 4 Nov at 10:00", "2 roles you're aiming for". Closed applications are never counted there.
- **Applications** (`#projects/p/<id>/applications`):
  - **Roles you're aiming for** at the top: each a title ("SOC analyst"), a note if you like, and the work that shows
    it — entries from your Cybersecurity portfolio, picked by reference (they stay in Study). A role can be set aside.
  - **+ An application:** the company and the role as advertised (and which of your roles it's for, a link, a contact,
    notes). It starts at Interested, or Applied with today's date.
  - The list, by stage: **Interviewing, Offer, Applied, Interested**; **Closed** folded below. Each row: company — role,
    its stage, "applied Mon 3 Nov" or "interview Tue 4 Nov". Open a row to edit it, move its stage (Applied keeps the
    day you applied, which you can change), and see its interviews.
  - **Close it** asks why, in your words ("Not this time", "I withdrew", "No reply", or your own), and keeps the day.
    Opening it again clears both.
  - **Interviews** (inside an application): + An interview (a day, a time if you like, phone / video / in person /
    other) makes a "Prepare for <company> interview" task the day before (on the day itself if that's today; none for
    a day that's passed), and moves the application to Interviewing. Each interview: prep notes, questions to ask (a
    short list you tick as you ask them), and how it went afterwards. Changing its day moves its task (if not done);
    removing it leaves the task.
- **Needs you:** an application at Applied for 10 days or more, not yet followed up: "Heard back from Acme?" ·
  "applied Mon 20 Oct" with **Follow up** (a task "Follow up: Acme", for today) or **Close it** (asks why). Either
  answers it for good; moving the application on (an interview, an offer) does too.
- No percentages, scores, streaks or rejection counts — words and counts of what's open.

## 4. How it works

- **Saved data (schema stays 5, the AGENTS.md exception):** a new top-level section `career: { items }` keyed by
  `projectId`, like Research, Content and Software, one record per item in a new synced kind **`career`** (migration
  `20261101200000_sync_career.sql`, built from the live lists, applied first with the owner's yes). An item is one of:
  - `role`: `{ id ('cr'+uid), type, projectId, title, notes?, aside?: true, portfolioIds?: string[], createdAt,
    updatedAt }`;
  - `application`: `{ id ('ca'+uid), type, projectId, company, title?, roleId?, url?, contact?, notes?, stage:
    'interested'|'applied'|'interviewing'|'offer'|'closed', appliedOn?, closedOn?, closedWhy?, followedOn?,
    askedOn?, followTaskId?, interviews?: [{ id, on, at?, kind?, prep?, questions?: [{ id, text, done? }], went?, taskId? }],
    createdAt, updatedAt }`.
  Read as written: an item, stage, kind or field this version doesn't know is kept; changes keep entries this version
  can't read.
- **The project kind:** `template: 'career'` in `data/businessModel.ts` and `data/templates.ts`. 1.122.0 keeps an
  unknown template as written and shows the project as General.
- **The nudge** (`data/attention.ts`): an application at stage `applied`, `appliedOn` 10 or more days ago, not yet
  answered (`askedOn`), no interview yet, in an active Career project; its line opens the application itself. Follow up
  sets `followedOn` and `askedOn` and makes the task; Close it (from Applied) sets `askedOn` too, so opening it again
  never brings the nudge back.
- **Interviews** are added only to an application that isn't closed (open it again first). A Prepare task you deleted
  isn't made again when the interview's day changes.
- **Two devices:** an application holds its interviews and questions, so changing the same application on two devices
  at once is one record's conflict (you choose a version, as for any record); a Prepare or follow-up task made on the
  other device stays as an ordinary task.
- **Limits** per project: 20 roles, 300 applications, 10 interviews per application, 20 questions per interview, 20
  portfolio entries per role; company 120, title 160, contact 200, why closed 200, notes 2,000, prep 4,000, how it went
  2,000, a question 200, a link 2,000 (a web address).
- **Deleting a project** deletes its career items (its tasks stay, as a project's tasks do).
- **AI:** nothing of a role, application or interview is sent to AI (ai/reach.ts's never list); the tasks they make
  ("Prepare for <company> interview", "Follow up: <company>") are ordinary tasks, so a company's name in their title
  goes as tasks do — unless the project is private.

## 5. Checks

Rules (reading as written, limits, roles, applications and their stages and days, closing and reopening, interviews
and their Prepare task, questions, the nudge's rule and its answers, at a glance, deleting a project, the kind's tabs);
sync (records, the database accepts the kind, the previous release keeping the section and the template); browser
(the kind, roles, an application through its stages, an interview with its task, closing gently, the nudge in Needs
you, switching kind and back, phone 390 px); live (a made-up Career project with a role, an application, an interview
and the nudge's answer on two devices; deleted afterwards).
