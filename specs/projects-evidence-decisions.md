# Projects: decisions backed by evidence, and tasks toward milestones (Phase 3)

**Status:** the owner's decisions in §2 (31 October 2026); being built on branch `evidence-decisions`. Nothing live
without the owner's yes. No schema, migration or server change.
**Based on:** source at 1.101.0. Plan: `specs/projects-vision.md` §5 capability table ("Decisions … better connections to
supporting research and affected work"; "Milestones … optional connections to supporting tasks and completion
evidence"), §10 Business ("an experiment should connect … the user's conclusion and next decision"), §14 (show the
records, never a score). Builds on `specs/projects-research.md` and `specs/projects-business-tools.md`.

## 1. The practical problem

A decision ("Which supplier?") has options with pros and cons, and Research has findings and experiment results — but
nothing connects them: the evidence for an option sits on another tab, and once you choose, what it rested on isn't
kept. A milestone ("Shed base laid") has no idea which tasks lead to it.

## 2. The owner's decisions (31 October 2026)

1. **From the finding:** a finding's "What it bears on" also lists your open decisions' options (supports / goes
   against / relates to); each option shows its evidence ("3 findings: 2 for · 1 against"), opening them.
2. **Experiments can test a decision's options** ("Try both suppliers for a week"); a result saved as a finding lands on
   those options.
3. **Choosing shows and keeps the evidence:** the choose form shows each option's evidence beside the reasons box, and
   the decision remembers it with the choice ("Chose Larch — 2 findings for, 1 against"), in its history too. MyDay
   never chooses.
4. **Tasks toward each milestone:** a project's task can be "toward" one of its milestones; the milestone shows "3 of 5
   tasks done" and, once reached, what got you there.

## 3. What you see

- **Research → Add or edit a finding:** "What it bears on" lists questions, things that must be true, and now each open
  decision's options ("Option: Larch — Larch or pine?"), each as Supports / Contradicts / Relates to. A finding about an
  option says so ("Supports “Larch” (Larch or pine?)").
- **Decisions tab:** each option shows its evidence when it has any — "3 findings: 2 for · 1 against" — which opens
  Research. While choosing: "What the evidence says" — "Larch — 2 for · 1 against", "Pine — nothing yet" — above "Why
  this one?" (only with Research on; with it off, no evidence is shown or kept). Once
  decided: "Decided Tue 3 Nov: Larch — with 2 findings for, 1 against", and Previous choices remember theirs.
- **Experiments:** "What it tests" also lists open decisions' options.
- **Milestones tab:** each milestone with tasks toward it: "3 of 5 tasks done" (opens the list); once reached, "What got
  you there" lists the tasks done. **The task's page** has "Toward a milestone" (its project's milestones; "None").
- Words and counts only: no score, no recommendation, no "the evidence says choose X".

## 4. How it works

- **A finding's `about`** gains kind `option` (`{ kind: 'option', id: <option id>, stance }`); **an experiment's
  `tests`** likewise. Both are Research records already keeping unknown kinds — 1.101.0 keeps them (it shows such a
  finding as about "something that must be true", a wording slip only there; going back is otherwise safe).
- **The decision** keeps `chosenEvidence: { for, against }` (the chosen option's counts when chosen); a history entry
  keeps `evidence` likewise. Optional fields inside the decision's own record (`project_decision`), kept by 1.101.0.
- **A task** gains optional `milestoneId` (its project's milestone; one removed simply no longer counts — read through,
  like "Starts after"), inside the task record, kept by 1.101.0.
- Removing an option or a decision takes it out of the findings and experiments that pointed at it.
- Schema stays 5 (the AGENTS.md exception), proven against the actual previous release. Never sent to AI: Ask MyDay's
  decision context names its fields (question, options, pros, cons), so neither counts nor findings reach it.

## 5. Checks

Rules (reading the new kinds and fields with a newer MyDay's kept; links only to this project's options; the counts;
removal cascades; choosing records and history keeps the evidence; think again; milestone counts and "what got you
there"; a removed milestone); browser checks on a finding's form, the Decisions tab (evidence, choosing, decided,
history), an experiment testing options, the task page's milestone choice and the Milestones tab; the previous release
keeps all of it; phone layout.
