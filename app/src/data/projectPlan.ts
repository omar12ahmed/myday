// Milestones and decisions (1.31.0): two optional lists kept inside each project (`project.milestones`,
// `project.decisions`), so they're saved and synced with it — no new kind of record, no database change. A project
// without them has neither field, exactly as before; removing the last one removes the field again.
//
// Milestones are big markers on the way (in your order; a date to aim for is guidance, never "late"). Decisions are a
// question with 1–4 options, each with its own pros and cons — no scores, no weights, no winner worked out: you choose.
// Nothing here adds tasks, touches Today or moves the project on the board.
import { isDateKey, isDateTime, localStamp, todayKey } from './dates';
import type { DateKey, Decision, DecisionOption, Milestone, MyDayData, Project } from './types';
import { isObj, listOf, uid } from './util';

export const PLAN_LIMITS = { milestones: 30, milestoneTitle: 120, decisions: 12, question: 200, options: 4, optionText: 120, points: 6, point: 160, why: 600 };

// ---------- Reading saved lists (unknown fields kept; anything unreadable counted, never dropped silently) ----------
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
export function normalizeMilestones(raw: unknown, report: { dropped: number }): Milestone[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) { report.dropped++; return undefined; }
  const out: Milestone[] = [], seen = new Set<string>();
  for (const m of raw) {
    const title = isObj(m) ? text(m.title, PLAN_LIMITS.milestoneTitle) : '';
    if (!isObj(m) || typeof m.id !== 'string' || !m.id || !title) { report.dropped++; continue; }
    const id = seen.has(m.id) ? 'ms' + uid() : m.id;
    seen.add(id);
    out.push({ ...m, id, title, aim: isDateKey(m.aim) ? m.aim : null, reachedOn: isDateKey(m.reachedOn) ? m.reachedOn : null, createdAt: isDateTime(m.createdAt) ? m.createdAt : localStamp() });
  }
  return out.length ? out : undefined;
}
const points = (v: unknown) => listOf(v).map(x => text(x, PLAN_LIMITS.point)).filter(Boolean);
export function normalizeDecisions(raw: unknown, report: { dropped: number }): Decision[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) { report.dropped++; return undefined; }
  const out: Decision[] = [], seen = new Set<string>();
  for (const x of raw) {
    const question = isObj(x) ? text(x.question, PLAN_LIMITS.question) : '';
    if (!isObj(x) || typeof x.id !== 'string' || !x.id || !question) { report.dropped++; continue; }
    const ids = new Set<string>(), options: DecisionOption[] = [];
    for (const o of listOf(x.options)) {
      const t = isObj(o) ? text(o.text, PLAN_LIMITS.optionText) : '';
      if (!isObj(o) || typeof o.id !== 'string' || !o.id || !t) { report.dropped++; continue; }
      const id = ids.has(o.id) ? 'op' + uid() : o.id;
      ids.add(id);
      options.push({ ...o, id, text: t, pros: points(o.pros), cons: points(o.cons) });
    }
    const chosen = typeof x.chosen === 'string' && ids.has(x.chosen) ? x.chosen : null;
    const id = seen.has(x.id) ? 'dc' + uid() : x.id;
    seen.add(id);
    const d: Decision = {
      ...x, id, question, options, chosen,
      why: typeof x.why === 'string' ? x.why.slice(0, PLAN_LIMITS.why) : '',
      decidedOn: chosen && isDateKey(x.decidedOn) ? x.decidedOn : chosen ? todayKey() : null,
      createdAt: isDateTime(x.createdAt) ? x.createdAt : localStamp(),
      updatedAt: isDateTime(x.updatedAt) ? x.updatedAt : isDateTime(x.createdAt) ? x.createdAt : localStamp(),
    };
    if (isObj(x.lastChoice) && typeof x.lastChoice.text === 'string' && x.lastChoice.text.trim() && isDateKey(x.lastChoice.on)) d.lastChoice = { text: text(x.lastChoice.text, PLAN_LIMITS.optionText), on: x.lastChoice.on };
    else delete d.lastChoice;
    out.push(d);
  }
  return out.length ? out : undefined;
}

// ---------- Looking at them ----------
export function milestoneProgress(p: Project): { reached: number; total: number; next: Milestone | null } {
  const list = p.milestones ?? [];
  return { reached: list.filter(m => m.reachedOn).length, total: list.length, next: list.find(m => !m.reachedOn) ?? null };
}
// Open decisions first (newest first), then decided ones (most recently decided first).
export function decisionsInOrder(p: Project): Decision[] {
  const list = p.decisions ?? [];
  const open = list.filter(d => !d.chosen).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const done = list.filter(d => d.chosen).sort((a, b) => (b.decidedOn ?? '').localeCompare(a.decidedOn ?? '') || b.updatedAt.localeCompare(a.updatedAt));
  return [...open, ...done];
}
export const chosenOption = (d: Decision) => d.options.find(o => o.id === d.chosen) ?? null;

// ---------- Changing them (each returns whether anything changed; the project's "updated" time moves on) ----------
const proj = (d: MyDayData, id: string) => d.projects.items.find(p => p.id === id) ?? null;
const touch = (p: Project) => { p.updatedAt = localStamp(); };
// A list that's become empty goes, so the project is saved as it was before it had any.
function tidy(p: Project) { if (p.milestones && !p.milestones.length) delete p.milestones; if (p.decisions && !p.decisions.length) delete p.decisions; }
const ms = (p: Project | null, id: string) => p?.milestones?.find(m => m.id === id) ?? null;
const dc = (p: Project | null, id: string) => p?.decisions?.find(x => x.id === id) ?? null;
const touchDecision = (p: Project, x: Decision) => { x.updatedAt = localStamp(); touch(p); };

export function addMilestone(d: MyDayData, projectId: string, title: string, aim: DateKey | null = null): string | 'full' | null {
  const p = proj(d, projectId), t = text(title, PLAN_LIMITS.milestoneTitle);
  if (!p || !t) return null;
  if ((p.milestones?.length ?? 0) >= PLAN_LIMITS.milestones) return 'full';
  const id = 'ms' + uid();
  (p.milestones ??= []).push({ id, title: t, aim: isDateKey(aim) ? aim : null, reachedOn: null, createdAt: localStamp() });
  touch(p);
  return id;
}
export function editMilestone(d: MyDayData, projectId: string, id: string, patch: { title?: string; aim?: DateKey | null }): boolean {
  const p = proj(d, projectId), m = ms(p, id);
  if (!p || !m) return false;
  let changed = false;
  if (patch.title !== undefined) { const t = text(patch.title, PLAN_LIMITS.milestoneTitle); if (t && t !== m.title) { m.title = t; changed = true; } }
  if (patch.aim !== undefined) { const a = isDateKey(patch.aim) ? patch.aim : null; if (a !== m.aim) { m.aim = a; changed = true; } }
  if (changed) touch(p);
  return changed;
}
// Reached (today) or, to undo it, not yet (the date goes too).
export function setReached(d: MyDayData, projectId: string, id: string, reached: boolean, k: DateKey = todayKey()): boolean {
  const p = proj(d, projectId), m = ms(p, id);
  if (!p || !m || !!m.reachedOn === reached) return false;
  m.reachedOn = reached ? k : null;
  touch(p);
  return true;
}
export function moveMilestone(d: MyDayData, projectId: string, id: string, by: -1 | 1): boolean {
  const p = proj(d, projectId), list = p?.milestones ?? [], i = list.findIndex(m => m.id === id), j = i + by;
  if (!p || i < 0 || j < 0 || j >= list.length) return false;
  [list[i], list[j]] = [list[j], list[i]];
  touch(p);
  return true;
}
export function removeMilestone(d: MyDayData, projectId: string, id: string): boolean {
  const p = proj(d, projectId);
  if (!p || !ms(p, id)) return false;
  p.milestones = p.milestones!.filter(m => m.id !== id);
  tidy(p); touch(p);
  return true;
}

export function addDecision(d: MyDayData, projectId: string, question: string): string | 'full' | null {
  const p = proj(d, projectId), q = text(question, PLAN_LIMITS.question);
  if (!p || !q) return null;
  if ((p.decisions?.length ?? 0) >= PLAN_LIMITS.decisions) return 'full';
  const id = 'dc' + uid(), now = localStamp();
  (p.decisions ??= []).push({ id, question: q, options: [], chosen: null, why: '', decidedOn: null, createdAt: now, updatedAt: now });
  touch(p);
  return id;
}
export function editQuestion(d: MyDayData, projectId: string, id: string, question: string): boolean {
  const p = proj(d, projectId), x = dc(p, id), q = text(question, PLAN_LIMITS.question);
  if (!p || !x || !q || q === x.question) return false;
  x.question = q; touchDecision(p, x);
  return true;
}
export function addOption(d: MyDayData, projectId: string, id: string, optionText: string): string | 'full' | null {
  const p = proj(d, projectId), x = dc(p, id), t = text(optionText, PLAN_LIMITS.optionText);
  if (!p || !x || !t) return null;
  if (x.options.length >= PLAN_LIMITS.options) return 'full';
  const oid = 'op' + uid();
  x.options.push({ id: oid, text: t, pros: [], cons: [] });
  touchDecision(p, x);
  return oid;
}
export function editOption(d: MyDayData, projectId: string, id: string, optionId: string, optionText: string): boolean {
  const p = proj(d, projectId), x = dc(p, id), o = x?.options.find(y => y.id === optionId), t = text(optionText, PLAN_LIMITS.optionText);
  if (!p || !x || !o || !t || t === o.text) return false;
  o.text = t; touchDecision(p, x);
  return true;
}
// Removing the chosen option reopens the decision (and says so): 'reopened'. Otherwise 'removed'.
export function removeOption(d: MyDayData, projectId: string, id: string, optionId: string): 'removed' | 'reopened' | null {
  const p = proj(d, projectId), x = dc(p, id);
  if (!p || !x || !x.options.some(o => o.id === optionId)) return null;
  const wasChosen = x.chosen === optionId;
  if (wasChosen) reopen(x);
  x.options = x.options.filter(o => o.id !== optionId);
  touchDecision(p, x);
  return wasChosen ? 'reopened' : 'removed';
}
export type Side = 'pros' | 'cons';
export function addPoint(d: MyDayData, projectId: string, id: string, optionId: string, side: Side, line: string): boolean | 'full' {
  const p = proj(d, projectId), x = dc(p, id), o = x?.options.find(y => y.id === optionId), t = text(line, PLAN_LIMITS.point);
  if (!p || !x || !o || !t) return false;
  if (o[side].length >= PLAN_LIMITS.points) return 'full';
  o[side].push(t); touchDecision(p, x);
  return true;
}
// A blank line removes it.
export function editPoint(d: MyDayData, projectId: string, id: string, optionId: string, side: Side, index: number, line: string): boolean {
  const p = proj(d, projectId), x = dc(p, id), o = x?.options.find(y => y.id === optionId);
  if (!p || !x || !o || index < 0 || index >= o[side].length) return false;
  const t = text(line, PLAN_LIMITS.point);
  if (t === o[side][index]) return false;
  if (t) o[side][index] = t; else o[side].splice(index, 1);
  touchDecision(p, x);
  return true;
}
export const removePoint = (d: MyDayData, projectId: string, id: string, optionId: string, side: Side, index: number) => editPoint(d, projectId, id, optionId, side, index, '');

// Choosing: the option, your reasons (optional) and today. Nothing else moves — not the project's stage, not Today.
export function decide(d: MyDayData, projectId: string, id: string, optionId: string, why: string, k: DateKey = todayKey()): boolean {
  const p = proj(d, projectId), x = dc(p, id);
  if (!p || !x || !x.options.some(o => o.id === optionId)) return false;
  x.chosen = optionId; x.decidedOn = k; x.why = why.trim().slice(0, PLAN_LIMITS.why);
  touchDecision(p, x);
  return true;
}
export function editWhy(d: MyDayData, projectId: string, id: string, why: string): boolean {
  const p = proj(d, projectId), x = dc(p, id), w = why.trim().slice(0, PLAN_LIMITS.why);
  if (!p || !x || w === x.why) return false;
  x.why = w; touchDecision(p, x);
  return true;
}
// "Think again": the choice is cleared; the question, options, pros, cons and your reasons stay, and the last choice is
// remembered (shown, and offered again) so nothing you wrote is lost.
function reopen(x: Decision) {
  const o = x.options.find(y => y.id === x.chosen);
  if (o && x.decidedOn) x.lastChoice = { text: o.text, on: x.decidedOn };
  x.chosen = null; x.decidedOn = null;
}
export function thinkAgain(d: MyDayData, projectId: string, id: string): boolean {
  const p = proj(d, projectId), x = dc(p, id);
  if (!p || !x || !x.chosen) return false;
  reopen(x); touchDecision(p, x);
  return true;
}
export function removeDecision(d: MyDayData, projectId: string, id: string): boolean {
  const p = proj(d, projectId);
  if (!p || !dc(p, id)) return false;
  p.decisions = p.decisions!.filter(x => x.id !== id);
  tidy(p); touch(p);
  return true;
}
