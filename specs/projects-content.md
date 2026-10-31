# Content projects: planning, making and posting videos

**Status:** the owner's decisions in §2 (31 October 2026); being built on branch `content-projects`. One release, with
a database change (a new synced kind) and a `files` function deploy, each only with the owner's yes.
**Based on:** source at 1.110.0. Plan: `specs/projects-vision.md` §10 ("Dedicated specialist records should be added
when they improve a real workflow"), the project kinds (Business idea, Case, Research), Research (1.89.0), files
(`specs/files.md`, 1.68.0–1.69.0).

## 1. The practical problem

The owner makes videos for YouTube and TikTok. The work is scattered: ideas in notes, scripts in documents,
transcripts nowhere, clips on the phone and in cloud folders, examples saved in a dozen apps, and no record of what
was tried, what got posted where, or what worked. Most of the effort — and most of what decides whether a video is
good — happens **before it's posted**: choosing the idea, trying several titles and hooks, learning from other
creators' videos, working out how to film it. MyDay has projects, tasks, notes, research and files, but nothing shaped
for a video's journey.

## 2. The owner's decisions (31 October 2026)

1. **Its own kind of project:** Content, beside General, Business idea, Case and Research — not part of software
   tools. A channel or series is a project; each video is a piece inside it.
2. **One release**, uploads included.
3. **Each video keeps:** its title, hook and idea notes; script and transcript; clips and thumbnails; where it was
   posted — "and the planning".
4. **Results, typed in by you:** views; likes, comments and shares; followers gained; what worked and what didn't. No
   scores.
5. **The emphasis is on planning before it's posted** — how to create it, ideas, a few examples, things not decided
   yet. All four parts:
   - an **ideas bank** (rough ideas; add from Capture anywhere; "Make this a video");
   - **options still open** (candidate titles, hooks, angles, thumbnail ideas side by side, picked when ready; the rest
     kept as "not chosen");
   - **how to make it** (an outline of beats, a shot list, what you need, steps that can become dated tasks);
   - **examples to learn from** (other creators' videos, what you like about each, a timestamp).
6. **A planned post day** adds a "Post: <video>" task on that day; ticking it can mark the video as posted.
7. **Uploads:** video (MP4, MOV, WebM) **up to 15 GB each**, **150 GB in all** for every file (from 10 GB), or links
   with timestamps. R2's price (checked 31 Oct 2026): $0.015 per GB-month past the first 10 GB, so about $2.10 a month
   when 150 GB is full.

## 3. What you see

- **Starting one:** "Start a project" gains **Content** ("a channel or a series"). A Content project's Overview has
  a **Videos** card (how many at each step, the next planned post day) and a **Videos** tab; Research can be switched
  on as for any project.
- **The Videos tab:** the **Ideas** bank first — rough ideas, a title and a line each, newest first, each with **Make
  this a video** — then your videos by step: **Planning · Filming · Editing · Posted**. Each row says its step, its
  planned post day and what's still open ("3 title ideas, none chosen"). One tap moves a video on a step or back.
- **A video's page** (`#projects/p/<id>/videos/<video>`), planning first:
  - **The idea:** title, hook (the first seconds), and notes from when it was an idea.
  - **Options still open:** candidate **titles, hooks, angles and thumbnail ideas**, each with a note. **Choose this**
    marks one chosen for its kind (the title and hook then read from it); the rest stay ("2 others not chosen").
    Nothing is ever picked for you.
  - **Examples to learn from:** another creator's video — a link, what you like about it, and a moment ("0:12 how they
    open"); it opens in a new tab.
  - **How to make it:** an **outline** (beats, in order), a **shot list** (what, where, with what), **what you need**
    (a checklist: place, gear, people), and **steps**, any of which **becomes a task** in this project, on a day if you
    like ("Film: market shots", Thu 6 Nov) — so it reaches Today like any task. Moving a posted video back to an earlier
    step lets go of its done post task (it's being worked on again).
  - **Script** and **transcript:** long text, written or pasted in.
  - **Clips and thumbnails:** a clip is a **link** (with a moment or a span, "0:42–0:58 market shot") or an **upload**
    (MP4, MOV, WebM up to 15 GB); thumbnails are images (or uploads). An uploaded clip plays in MyDay; a big upload
    shows how far it's got, carries on after a dropped connection, and after a reload asks you to pick the same file
    again to carry on.
  - **Posting:** a **planned post day** adds "Post: <video>" (10 min) on that day; ticking it shows the video as
    Posted. **Where it went up:** each platform's link and day (YouTube, Shorts, TikTok, Instagram, other).
  - **Results**, typed in when you like: for a platform and a day, views, likes, comments, shares and followers gained
    (any you have); and **what worked** and **what didn't**, in your words. No scores, no comparisons.
- **Capture:** "Keep as a video idea — <channel>" (your three most recently worked-on Content projects) sends what
  you captured to its Ideas: the first line the idea, the rest a line about it.
- **Storage:** every Files card's "used and left" line counts against **150 GB** in all.

## 4. How it works

- **Saved data (schema stays 5, the AGENTS.md exception):** a new section `content: { items }`, one record per item
  in a new synced kind **`content`** (not `project_…`). An item: `{ id ('cv'+uid), type: 'video', projectId, step:
  'idea' | 'planning' | 'filming' | 'editing' | 'posted', title, hook, notes, options[], examples[], outline[], shots[],
  needs[], steps[], script, transcript, clips[] (links), fileIds[] (its uploads: clips and thumbnails), postOn,
  postTaskId, posts[], results[], worked, didnt, createdAt, updatedAt }`. A video is a place for files, like a project
  or a note; deleting it (or its project, here or on another device) sends its uploads to Recently deleted. An idea is an item at step `idea`. Read as written; an item of a type or step this version doesn't know
  is kept; unknown fields kept. Limits keep a record well under the database's 512 KB (title 120, hook 200, notes
  2,000, script 20,000, transcript 50,000; up to 40 options, 20 examples, 60 beats, 60 shots, 40 needs, 40 clips, 10
  posts, 30 results; a link 1,000), and the app checks a record's size before sending, saying which video is too big.
  The previous release (1.110.0) keeps the section unread (it keeps unknown sections) and its sync ignores the kind.
- **Database:** a migration adds `content` to `sync_records_known_kind` and `sync_records_deletable_kind`, built from
  the live lists (re-read before applying). Applied only with the owner's yes, before the app that sends it.
- **Projects:** template `content`. Deleting a Content project deletes its content items (as for research); a content
  deletion waits while its project's deletion is undecided; content is applied after projects.
- **Tasks:** a step or shot turned into a task is an ordinary task with the project; "Post: <title>" likewise, its id
  kept as `postTaskId`. A video counts as posted when its step is `posted` or its post task is done.
- **Files:** a new area **`content`**: the existing photo and document types plus **video** (MP4 and MOV: `ftyp` at
  byte 4; WebM: the EBML header), up to **15 GB each**; every account **150 GB** in all.
  - Up to 64 MB a file goes up as now (one signed PUT). Larger ones go up **in parts** (64 MB each; R2 needs 5 MB to
    5 GB, at most 10,000): new `files` actions **`mp-begin`** (checks and creates the upload), **`mp-parts`** (signed
    links for up to 50 parts, each with its MD5 and length signed in), **`mp-list`** (which parts R2 already has, for
    carrying on), **`mp-done`** (completes, then the usual check of size, type and first bytes) and **`mp-abort`**.
  - The device reads one part at a time (never the whole file), so a phone can send 15 GB; no whole-file hash for a
    file over 64 MB (`sha256` empty, as already allowed).
  - An upload's progress (upload id, parts done) is kept on the device (`myday.files.parts`) so it can carry on; an
    unfinished upload is left alone for 7 days (R2 drops unfinished multipart uploads after 7 days by default), not 1
    hour. Removing one drops what was sent (`mp-abort`); Delete everything drops every unfinished one; starting a file
    again drops its own earlier one; at most 10 can be unfinished at once (their parts don't count in the 150 GB until
    done). Each part's MD5 is worked out 4 MB at a time, so a part is never held whole.
  - **Playing:** a video opens in a player in MyDay with a signed link valid 6 hours (R2 streams it in ranges); never
    held whole in memory or cached on the device. Its preview is a frame from the video, made on the device.
  - Bucket CORS already allows PUT with Content-MD5 and exposes ETag; the live check proves it for parts.
- **AI:** nothing of a Content project's ideas and videos is sent to AI in this release (their planning, script,
  transcript, links, posts and results: ai/reach.ts's "never" list); the tasks you make from them ("Post: …",
  "Film: …") are ordinary tasks and go as tasks always have.

## 5. Checks

- **Rules:** reading (as written, limits, unknown kept, twice over), ideas and videos (add, make a video, steps,
  options chosen and not, examples, outline, shots, needs, steps to tasks, post day and its task, posted when the task
  is done, posts, results), the size check, deleting a project.
- **Sync:** records (round trip, order, cleaning, summaries, lines), the database (the kind accepted, RLS, tombstones,
  earlier kinds still accepted), two devices, the previous release keeping the section.
- **Files:** rules (video types and their first bytes, 15 GB, 150 GB), the multipart actions against the stand-in
  (begin, parts with MD5, list, done with the check, abort, refusals), the device's part-by-part upload with progress
  and carrying on, playing.
- **Browser:** the Content kind, the Videos tab, a video's page section by section, Capture's "Video idea", phone 390
  px.
- **Live:** a made-up Content project with an idea, a video, its planning, a post task and results on two devices; a
  small video uploaded in parts (proving the bucket's CORS for parts) and played; all deleted afterwards.
