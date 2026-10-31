// The Business template (1.33.0): a project can be a business idea, with its idea on one page — four simple questions
// in your words (what problem, for whom, how it works and pays, what must be true). Saved inside the project
// (`project.template`, `project.model`), so it's saved and synced with it — no new kind of record, no database change.
// A general project has neither field, exactly as before; switching back to general keeps the one page out of sight,
// never deleted.
//
// What must be true is a list of things you believe but haven't checked yet. Each can be found out (one tap adds a
// task in the project; your next step stays as it is) and marked as it turns out — only by you, never by itself.
// No scores, no percentages: places and counts.
//
// The kind of project lives here too: general (no field), a business idea (1.33.0) or a case (1.35.0, data/caseFile.ts).
import { isDateKey, isDateTime, localStamp, todayKey } from './dates';
import { emptyMoney, moneyIsEmpty, normalizeMoney, type MoneyChange } from './businessMoney';
import { forgetAssumption } from './research';
import { addTask, isDone } from './tasks';
import type { Assumption, AssumptionState, BusinessModel, DateKey, MyDayData, Project, TaskItem } from './types';
import { isObj, listOf, uid } from './util';

// An assumption fits in a task's title after "Find out: " (tasks allow 120 characters).
export const MODEL_LIMITS = { answer: 1000, assumptions: 12, assumption: 110, found: 400 };

export type TemplateChoice = 'general' | 'business' | 'case' | 'research' | 'content';
export const TEMPLATES: { id: TemplateChoice; label: string }[] = [{ id: 'general', label: 'General' }, { id: 'business', label: 'Business idea' }, { id: 'case', label: 'Case' }, { id: 'research', label: 'Research' }, { id: 'content', label: 'Content' }];
export const isBusiness = (p: Project) => p.template === 'business';
export const isCase = (p: Project) => p.template === 'case';
export const isResearchKind = (p: Project) => p.template === 'research'; // Research always on (specs/projects-research.md)
export const isContent = (p: Project) => p.template === 'content';       // a channel or series: its videos (specs/projects-content.md)
// A kind of project this version knows (none = general). One from a newer MyDay is kept, and not offered to change.
export const knownTemplate = (p: Project) => p.template === undefined || p.template === 'business' || p.template === 'case' || p.template === 'research' || p.template === 'content';

export type AnswerKey = 'problem' | 'who' | 'how';
export const QUESTIONS: { key: AnswerKey; label: string; hint: string }[] = [
  { key: 'problem', label: 'What problem does it solve?', hint: 'In your words: who has a harder time than they need to, and how?' },
  { key: 'who', label: 'Who is it for?', hint: 'The people who have this problem most — as specific as you can be.' },
  { key: 'how', label: 'How does it work, and how does it pay?', hint: "What you'd do for them, and where the money comes from." },
];
export const MUST_BE_TRUE = { label: 'What must be true for it to work?', hint: "Things you believe but haven't checked yet. One at a time is plenty." };
export const STATE_LABEL: Record<AssumptionState, string> = { open: 'Not checked yet', 'looks-true': 'Looks true', 'doesnt-hold': 'Doesn’t hold' };
const STATES = Object.keys(STATE_LABEL) as AssumptionState[];
const OWN_KEYS = ['problem', 'who', 'how', 'assumptions', 'money'];

// ---------- Reading what's saved (unknown fields kept; anything unreadable counted, never dropped silently) ----------
const line = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const answer = (v: unknown) => (typeof v === 'string' ? v.slice(0, MODEL_LIMITS.answer) : '');
// The kind of project: "business", "case", or one from a newer MyDay (kept as it is). None means general.
export function normalizeTemplate(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() && v.length <= 40 && v !== 'general' ? v : undefined;
}
export function normalizeModel(raw: unknown, report: { dropped: number }): BusinessModel | undefined {
  if (raw === undefined) return undefined;
  if (!isObj(raw)) { report.dropped++; return undefined; }
  if (raw.assumptions !== undefined && !Array.isArray(raw.assumptions)) report.dropped++;
  const assumptions: Assumption[] = [], seen = new Set<string>();
  for (const a of listOf(raw.assumptions)) {
    const text = isObj(a) ? line(a.text, MODEL_LIMITS.assumption) : '';
    if (!isObj(a) || typeof a.id !== 'string' || !a.id || !text) { report.dropped++; continue; }
    const id = seen.has(a.id) ? 'as' + uid() : a.id;
    seen.add(id);
    const state = STATES.includes(a.state as AssumptionState) ? (a.state as AssumptionState) : 'open';
    assumptions.push({
      ...a, id, text, state,
      found: typeof a.found === 'string' ? a.found.slice(0, MODEL_LIMITS.found) : '',
      checkedOn: state === 'open' ? null : isDateKey(a.checkedOn) ? a.checkedOn : todayKey(),
      taskId: typeof a.taskId === 'string' && a.taskId ? a.taskId : null,
      createdAt: isDateTime(a.createdAt) ? a.createdAt : localStamp(),
    });
  }
  const m: BusinessModel = { ...raw, problem: answer(raw.problem), who: answer(raw.who), how: answer(raw.how), assumptions };
  // Its money (specs/projects-business-tools.md), when there's something in it.
  const money = normalizeMoney(raw.money, report);
  if (money) m.money = money; else delete m.money;
  return isEmpty(m) ? undefined : m;
}
// Nothing written (and nothing a newer MyDay added): the project is saved as if it never had one.
const isEmpty = (m: BusinessModel) => !m.problem.trim() && !m.who.trim() && !m.how.trim() && !m.assumptions.length && !m.money && Object.keys(m).every(k => OWN_KEYS.includes(k));

// ---------- Looking at it ----------
export interface ModelProgress { answered: number; assumptions: number; open: number; looksTrue: number; doesntHold: number }
// "3 of 4 questions answered": the fourth counts once there's at least one thing that must be true.
export function modelProgress(p: Project): ModelProgress {
  const m = p.model, list = m?.assumptions ?? [];
  const answered = (m ? (['problem', 'who', 'how'] as const).filter(k => m[k].trim()).length : 0) + (list.length ? 1 : 0);
  return { answered, assumptions: list.length, open: list.filter(a => a.state === 'open').length, looksTrue: list.filter(a => a.state === 'looks-true').length, doesntHold: list.filter(a => a.state === 'doesnt-hold').length };
}
// Its "Find out" task, while it's still there (one you've deleted simply isn't).
export const assumptionTask = (data: MyDayData, a: Assumption): TaskItem | null => (a.taskId ? data.tasks.items.find(t => t.id === a.taskId) ?? null : null);
// Found out, but not marked yet: its task is done and it's still "not checked yet" (so it asks what you found).
export function awaitingAnswer(data: MyDayData, a: Assumption): boolean {
  const t = assumptionTask(data, a);
  return a.state === 'open' && !!t && isDone(data, t);
}
// The first thing still to check that has no "Find out" task yet (Explore offers to find out about it).
export const firstToFindOut = (data: MyDayData, p: Project): Assumption | null => p.model?.assumptions.find(a => a.state === 'open' && !assumptionTask(data, a)) ?? null;
export const findOutTitle = (a: Assumption) => `Find out: ${a.text}`;
const findOutNotes = (a: Assumption) =>
  `From your one page — something that must be true:\n${a.text}\n\nOne real piece of evidence is enough to start: ask someone it's for about a recent time it mattered, or look at what they do today.`;

// ---------- Changing it (each returns whether anything changed; the project's "updated" time moves on) ----------
const proj = (d: MyDayData, id: string) => d.projects.items.find(p => p.id === id) ?? null;
const touch = (p: Project) => { p.updatedAt = localStamp(); };
const modelOf = (p: Project): BusinessModel => (p.model ??= { problem: '', who: '', how: '', assumptions: [] });
function tidy(p: Project) { if (p.model && isEmpty(p.model)) delete p.model; }
// A change to the money (data/businessMoney.ts): an empty plan isn't kept, nor a one page left with nothing in it.
// Returns whether anything changed; the project's "updated" time moves on when it did.
export function changeMoney(d: MyDayData, projectId: string, change: MoneyChange): boolean {
  const p = proj(d, projectId);
  if (!p) return false;
  const before = JSON.stringify(p.model ?? null);
  change(modelOf(p).money ??= emptyMoney());
  if (p.model?.money && moneyIsEmpty(p.model.money)) delete p.model.money;
  tidy(p);
  if (JSON.stringify(p.model ?? null) === before) return false;
  touch(p);
  return true;
}
const as = (p: Project | null, id: string) => p?.model?.assumptions.find(a => a.id === id) ?? null;

// General, a business idea or a case. Changing kind keeps what the other kind had (a one page, a case's records), out
// of sight; changing back shows it again.
export function setTemplate(d: MyDayData, projectId: string, to: TemplateChoice): boolean {
  const p = proj(d, projectId);
  if (!p) return false;
  const was = p.template;
  if (to === 'general') { if (was === undefined) return false; delete p.template; }
  else { if (was === to) return false; p.template = to; }
  // Leaving the Research kind keeps its tab: Research stays switched on (turning it off is its own switch).
  if (was === 'research' && !p.tools?.includes('research')) p.tools = [...(p.tools ?? []), 'research'];
  touch(p);
  return true;
}
export function editAnswer(d: MyDayData, projectId: string, key: AnswerKey, value: string): boolean {
  const p = proj(d, projectId), v = value.trim().slice(0, MODEL_LIMITS.answer);
  if (!p || v === (p.model?.[key] ?? '')) return false;
  modelOf(p)[key] = v;
  tidy(p); touch(p);
  return true;
}
export function addAssumption(d: MyDayData, projectId: string, text: string): string | 'full' | null {
  const p = proj(d, projectId), t = line(text, MODEL_LIMITS.assumption);
  if (!p || !t) return null;
  if ((p.model?.assumptions.length ?? 0) >= MODEL_LIMITS.assumptions) return 'full';
  const id = 'as' + uid();
  modelOf(p).assumptions.push({ id, text: t, state: 'open', found: '', checkedOn: null, taskId: null, createdAt: localStamp() });
  touch(p);
  return id;
}
export function editAssumption(d: MyDayData, projectId: string, id: string, text: string): boolean {
  const p = proj(d, projectId), a = as(p, id), t = line(text, MODEL_LIMITS.assumption);
  if (!p || !a || !t || t === a.text) return false;
  a.text = t; touch(p);
  return true;
}
// Not checked yet, looks true or doesn't hold — the day is today's; back to "not checked yet" clears the day but keeps
// what you found.
export function setAssumptionState(d: MyDayData, projectId: string, id: string, state: AssumptionState, k: DateKey = todayKey()): boolean {
  const p = proj(d, projectId), a = as(p, id);
  if (!p || !a || !STATES.includes(state) || a.state === state) return false;
  a.state = state; a.checkedOn = state === 'open' ? null : k;
  touch(p);
  return true;
}
export function editFound(d: MyDayData, projectId: string, id: string, text: string): boolean {
  const p = proj(d, projectId), a = as(p, id), t = text.trim().slice(0, MODEL_LIMITS.found);
  if (!p || !a || t === a.found) return false;
  a.found = t; touch(p);
  return true;
}
// Its "Find out" task stays: it's your task now.
export function removeAssumption(d: MyDayData, projectId: string, id: string): boolean {
  const p = proj(d, projectId);
  if (!p || !as(p, id)) return false;
  p.model!.assumptions = p.model!.assumptions.filter(a => a.id !== id);
  forgetAssumption(d, projectId, id); // findings about it stop pointing at it (data/research.ts)
  tidy(p); touch(p);
  return true;
}
// Adds "Find out: …" (15 minutes, no date) to the project's tasks and remembers it. A next step you chose stays as it is
// (with none chosen, the project's first task to do is its next step, as always).
// Returns the new task's id, or null when nothing was added (it already has a task that's still there).
export function findOut(d: MyDayData, projectId: string, id: string): string | null {
  const p = proj(d, projectId), a = as(p, id);
  if (!p || !a || assumptionTask(d, a)) return null;
  const tid = addTask(d.tasks, { title: findOutTitle(a), minutes: 15, category: 'admin', notes: findOutNotes(a) });
  if (!tid) return null;
  d.tasks.items.find(t => t.id === tid)!.projectId = p.id;
  a.taskId = tid; touch(p);
  return tid;
}
