# "You've been exploring a while": comparing the options

**Status:** the owner's decisions in §2 (31 October 2026); being built on branch `exploring-a-while`. Nothing live
without the owner's yes. No schema, migration or server change.
**Based on:** source at 1.114.0. Plan: `specs/myday-vision.md` §1, "How MyDay should think", level 4 ("Notice and
anticipate, at the right moments … During a long exploration: compare the strongest options and see what's still
missing"); decisions with evidence (1.103.0, `specs/projects-evidence-decisions.md`).

## 1. The practical problem

A project can sit in Explore or Decide for weeks: more research, more notes, the same open question. MyDay already
holds what would help — the decision's options with their pros and cons, the findings for and against each, the
questions still open — but on separate tabs, so it never comes together at the moment it would help, and nothing
says how long it has been.

## 2. The owner's decisions (31 October 2026)

1. **Remember the day a project changes step** (a new optional field; older versions keep it). Not inferred.
   Later the same day: **the 3 weeks count the whole time in Explore and Decide** (the board's Exploring column), not
   restarting at Decide.
2. **After 3 weeks in Explore or Decide, its Overview asks once:** "You've been exploring this for 3 weeks. Would it
   help to compare the strongest options and see what's still missing?"
3. **Yes opens a side-by-side of the options** — the open decision's options with their evidence — plus what's still
   unknown (open research questions, must-be-true items not checked). The choice stays yours.

## 3. What you see

- **On the Overview,** for an active project that entered Exploring (Explore, then Decide) 21 days or more ago: "You've been exploring this
  for 3 weeks" (or "deciding on this") — "Would it help to compare the strongest options and see what's still
  missing?" — with **Compare them** and **Not now**. Either answers it: it isn't asked again until the project moves
  step and stays three weeks again (kept on this device, `myday.projects.compareAsked`). Never a stream: one card,
  once. Time paused or finished doesn't count: bringing a project back starts its day again.
- **Compare the options** (`#projects/p/<id>/compare`; also from the Decisions tab, "Compare side by side", whenever
  an open decision has two options or more):
  - each open decision's question, with its options **side by side** (stacked on a phone): the option, its pros and
    cons, and — with Research on — its evidence in words ("2 findings for · 1 against · 1 related", or "Nothing found
    yet"). In the order you added them — never ranked, scored or picked;
  - **What's still unknown:** with Research on, research questions not answered yet and options with no findings
    ("No findings yet about …"); a business idea's must-be-true items not checked yet — each opening where it lives;
  - the Decisions tab shows as the current one (a case, with no Decisions tab: Overview);
  - "When you're ready, choose in Decisions" (the decision stays yours), and back to the Overview.
  - With no open decision: "There's no open decision yet — what are you choosing between?", opening Decisions.
- How long a project has been at its step shows nowhere else; no count of days is said, only weeks, and only here.

## 4. How it works

- **Saved data (schema stays 5):** an optional `columnSince: { column, on }` on the project — its board column
  (ideas, exploring, doing) and the day it entered it: set when it's started, when its stage moves it into another
  column (Explore → Decide keeps the day), and when it's brought back from paused or finished (`addProject`,
  `editProject`, so the board's moves too). Kept by 1.114.0 (its project reader spreads unknown fields; the AGENTS.md
  exception, proved with the previous release). Saying which column it's for matters: 1.114.0 changes a stage without
  knowing, so a record whose column isn't the project's is ignored (not asked about) until its next move here. Read as
  written (a newer MyDay's keys kept); one without a column and a day is counted and left off. A project from before has
  none, so it isn't asked about until it next changes column.
- **Rules** in `data/exploring.ts`: `exploringAWhile` (active, Explore or Decide, its Exploring record 21 or more days
  old: the stage, since when, whole weeks) and `compareView` (open decisions with each option's evidence from
  `findingsAbout` while Research is on; open questions; unchecked must-be-true items; options with no findings).
- **AI:** nothing new is sent (Ask's project slices name their fields; `columnSince` isn't one).

## 5. Checks

Rules (stageOn set on creating and on each stage change, kept as written, a bad one counted; the ask from 21 days,
not before, only Explore/Decide and active; whole weeks; compareView's decisions, evidence, unknowns and the
no-decision case); browser (the card and its two answers, asked once per spell, the compare page side by side and
stacked at 390 px, its links, the Decisions tab's link); the previous release keeps `stageOn` through its own edits.
