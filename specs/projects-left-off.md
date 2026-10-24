# Projects: the outcome, what counts as finished, and "Where I left off"

**Status:** approved by the owner on 24 October 2026 (decisions in section 4). Phase 1, release 2 of
`specs/projects-vision.md`. Released in 1.48.0 (24 October 2026).
**Based on:** source at release 1.47.0 (started on 1.46.1).

## 1. The practical problem

Coming back to a project after a few days means rebuilding the picture from tasks, notes and dates. Nothing says
what the project is trying to achieve, what would count as done, or what was going on when it was last put down.
The Overview already leads with the next step (1.46.0); this release adds the two things that frame it.

## 2. What changes

Three optional fields on a project. A project with none of them is saved exactly as before.

| Field | Saved as | Limit | Where it shows |
| --- | --- | --- | --- |
| The intended outcome | `outcome` (text) | 200 characters | A line under the title on every tab: "Aiming for: …" |
| What would count as finished | `finishedWhen` (text) | 600 characters | In About it: "Finished when: …" |
| Where I left off | `leftOff: { text, at }` | 800 characters | A card at the top of the Overview, with the day it was written |

- **Outcome and Finished when** are written in About it → Edit, beside the summary. Empty means absent.
- **Where I left off** is one short note with gentle prompts: what was happening, what's unresolved, the next useful
  thing, and anything needed to pick it up again. Once written, it sits at the top of the Overview, above the next
  step, headed "Where I left off · Tue 20 Oct", with Edit. Saving records the time it was written; clearing it asks
  first. With no note, About it offers "Leave a note for next time", which opens the same editor there.
- Finishing every task never marks the outcome as reached: the owner decides (the existing Mark as done).
- Paused and done projects keep and show their note, since that is when it helps most.
- Failed saves keep the previous data and the typed draft, and announce nothing (the existing checked save path).

## 3. Saved data, sync and AI

- **No schema change** (the owner's exception, recorded in `AGENTS.md`). The fields live inside the project's own
  record. Released 1.47.0 and earlier already keep unknown project fields when they read saved data, edit a project,
  save, export, import and sync the project core record, so a device that goes back to 1.47.0 keeps the fields unread
  and passes
  them on unchanged. The classic MyDay keeps the whole Projects section unread.
- **Sync:** no new record kind, no migration, no database change. The fields travel in the existing project record.
- **AI:** never sent in this release. Ask MyDay's project context and preview, AI note filing and every other AI job
  are unchanged. A later release may add them to Ask, only when the owner asks or agrees after seeing a preview, with
  the server's request contract updated and deployed separately.

## 4. Owner's decisions (24 October 2026)

1. No schema bump; use the exception, proved against the actual previous release.
2. Not sent to AI in this release; later only on request or with a preview first.
3. The note at the top of the Overview once written; the outcome under the title; Finished when in About it.
4. One short, dated note with prompts, not four separate boxes.

## 5. Checks

- **Rules** (`projects-rules`): reading keeps valid fields, trims and limits them, removes empty ones and counts
  unreadable shapes; editing sets and clears each; saving the note records the time; unknown fields still survive.
- **Browser** (`app-projects`): write and edit the outcome and Finished when; leave, edit and clear the note
  (asking first); the note card's place and date; the outcome line on every tab; failed save keeps the draft;
  export and import keep all three; phone at 320 px with no sideways scroll; nothing new in Ask's preview or request
  (`app-ai`).
- **Previous release** (`projects-rules` [14], pinned to `v1.47.0`, the last release without the fields): with that
  release's own code, data with all three fields keeps them unchanged when loaded, edited, saved to the browser's
  storage, exported, imported and restored, and through the project sync record both ways.
- **Mixed versions:** a device still on 1.47.0 or earlier keeps the fields but doesn't show them, including on its
  sync-conflict screen, so choosing "this device's" version there could set aside a newer note. The release note says
  to update every device.
- **Visual (Taste skill, app-screen workflow):** the Overview with and without a note, 1440, 768 and 390 px, light and
  dark, compared with the 1.46.0 screenshots.
