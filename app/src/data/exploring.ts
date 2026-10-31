// "You've been exploring a while" (specs/projects-exploring.md): after three weeks in Explore or Decide, a project's
// Overview asks once whether it would help to compare the strongest options and see what's still missing — and the
// comparison itself: each open decision's options side by side with their evidence, and what's still unknown. Never
// a score, a ranking or a pick: the choice stays yours. Worked out from what's saved; nothing new is sent anywhere.
import { isBusiness } from './businessModel';
import { isDateKey, parseKey, todayKey } from './dates';
import { columnOf } from './projects';
import { decisionsInOrder } from './projectPlan';
import { findingsAbout, hasResearch, researchOf, type Stance } from './research';
import type { Assumption, DateKey, Decision, DecisionOption, MyDayData, Project, ResearchFinding, ResearchQuestion } from './types';

export const EXPLORING_DAYS = 21;
const days = (a: DateKey, b: DateKey) => Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);

// An active project in Explore or Decide that entered the board's Exploring column 21 days or more ago: its stage,
// since when, and how many whole weeks (the whole time in the column: Explore then Decide counts as one exploration).
// null otherwise — for a project from before MyDay remembered the day, or one whose record is for another column
// (an older release moved it without knowing).
export interface Exploring { stage: 'explore' | 'decide'; since: DateKey; weeks: number }
export function exploringAWhile(p: Project, k: DateKey = todayKey()): Exploring | null {
  const cs = p.columnSince;
  if (p.status !== 'active' || (p.stage !== 'explore' && p.stage !== 'decide') || !cs || cs.column !== columnOf(p.stage) || !isDateKey(cs.on)) return null;
  const n = days(cs.on, k);
  return n >= EXPLORING_DAYS ? { stage: p.stage, since: cs.on, weeks: Math.floor(n / 7) } : null;
}
// "You've been exploring this for 3 weeks" / "You've been deciding on this for 4 weeks".
export const exploringWords = (x: Exploring) => `You’ve been ${x.stage === 'explore' ? 'exploring' : 'deciding on'} this for ${x.weeks} weeks`;

// ---------- Comparing ----------
export interface ComparedOption { option: DecisionOption; evidence: Record<Stance, ResearchFinding[]>; none: boolean }
export interface Compare {
  decisions: { decision: Decision; options: ComparedOption[] }[];
  research: boolean;                // Research switched on: evidence, questions and unknown options shown
  questions: ResearchQuestion[];    // research questions not answered yet
  assumptions: Assumption[];        // a business idea's must-be-true items not checked yet
  unknownOptions: { decision: Decision; option: DecisionOption }[]; // options with no evidence either way
}
// Open decisions (in the order you keep them) with each option in the order you added them. Evidence, questions and
// options with nothing found come from Research, so only while it's switched on (as the Decisions tab shows them).
export function compareView(data: MyDayData, p: Project): Compare {
  const open = decisionsInOrder(p).filter(x => !x.chosen), research = hasResearch(p), empty = { supports: [], contradicts: [], relates: [] };
  const decisions = open.map(decision => ({
    decision,
    options: decision.options.map(option => {
      const evidence = research ? findingsAbout(data, p.id, 'option', option.id) : empty;
      return { option, evidence, none: research && !evidence.supports.length && !evidence.contradicts.length && !evidence.relates.length };
    }),
  }));
  return {
    decisions, research,
    questions: research ? researchOf(data, p.id).questions.filter(q => !q.answeredOn) : [],
    assumptions: isBusiness(p) ? (p.model?.assumptions ?? []).filter(a => a.state === 'open') : [],
    unknownOptions: decisions.flatMap(d => d.options.filter(o => o.none).map(o => ({ decision: d.decision, option: o.option }))),
  };
}
// Whether the Decisions tab offers "Compare side by side": an open decision with two options or more.
export const canCompare = (p: Project) => decisionsInOrder(p).some(x => !x.chosen && x.options.length >= 2);
