// Experiments (specs/projects-business-tools.md): a test of something you believe — on a business idea, the things that
// must be true; on a project with Research, its questions too. Each is a Research item (`type: 'experiment'`), so it's
// saved and synced like a finding. It goes Planned → Running → Done only when you say so: ticking its "Test: …" task
// records nothing, and its result never marks anything "looks true" by itself. Once done, its result can be saved as
// a finding (one tap), which is evidence you weigh yourself. Never sent to AI.
import { isBusiness } from './businessModel';
import { localStamp, todayKey } from './dates';
import { tidyText } from './projectResources';
import { addFinding, hasResearch, isExperiment, itemOf, optionOf, RESEARCH_LIMITS, researchOf, setResearch, type Stance } from './research';
import { addTask, isDone, TASK_LIMITS } from './tasks';
import type { DateKey, MyDayData, Project, ResearchExperiment, TaskItem } from './types';
import { uid } from './util';

export type ExperimentStatus = 'planned' | 'running' | 'done';
export const STATUS_LABEL: Record<ExperimentStatus, string> = { planned: 'Planned', running: 'Running', done: 'Done' };
// (A status from a newer MyDay reads as planned here, and is kept as it is until you change it.)
export const statusOf = (e: ResearchExperiment): ExperimentStatus => (e.status === 'running' || e.status === 'done' ? e.status : 'planned');
export type TestKind = 'assumption' | 'question' | 'option';
export const testKey = (t: { kind: string; id: string }) => `${t.kind}:${t.id}`;

// ---------- Looking at them ----------
// Running first, then planned (each in the order you planned them), then done (latest first).
export function experimentOrder(list: ResearchExperiment[]): ResearchExperiment[] {
  const by = (s: ExperimentStatus) => list.filter(e => statusOf(e) === s);
  return [...by('running'), ...by('planned'), ...by('done').sort((a, b) => (b.doneOn ?? '').localeCompare(a.doneOn ?? ''))];
}
export const experimentsOf = (d: MyDayData, projectId: string) => experimentOrder(researchOf(d, projectId).experiments);
// The experiments that test one thing (a thing that must be true, or a question).
export const experimentsTesting = (d: MyDayData, projectId: string, kind: TestKind, id: string) =>
  experimentsOf(d, projectId).filter(e => e.tests.some(t => t.kind === kind && t.id === id));
// "1 experiment running · 1 done" (words and counts; '' when none).
export function experimentsLine(list: ResearchExperiment[]): string {
  const n = (s: ExperimentStatus) => list.filter(e => statusOf(e) === s).length;
  const r = n('running'), p = n('planned'), dn = n('done'), parts = [r && `${r} running`, p && `${p} planned`, dn && `${dn} done`].filter(Boolean);
  return parts.length ? `${list.length === 1 ? '1 experiment' : `${list.length} experiments`}: ${parts.join(' · ')}` : '';
}
// What it tests, in words: each thing that must be true or question that's still there.
export interface Tested { kind: TestKind; id: string; text: string }
export function testedThings(d: MyDayData, e: ResearchExperiment): Tested[] {
  const p = d.projects.items.find(x => x.id === e.projectId), questions = researchOf(d, e.projectId).questions;
  return e.tests.flatMap((t): Tested[] => {
    if (t.kind === 'assumption') { const a = p?.model?.assumptions.find(x => x.id === t.id); return a ? [{ kind: 'assumption', id: a.id, text: a.text }] : []; }
    if (t.kind === 'question') { const q = questions.find(x => x.id === t.id); return q ? [{ kind: 'question', id: q.id, text: q.text }] : []; }
    if (t.kind === 'option') { const o = optionOf(p, t.id); return o ? [{ kind: 'option', id: o.option.id, text: `${o.option.text} — ${o.decision.question}` }] : []; }
    return [];
  });
}
// What an experiment can test on this project: its things that must be true (a business idea's), with Research on its
// questions, and the options of its open decisions (specs/projects-evidence-decisions.md).
export function testChoices(d: MyDayData, p: Project): { kind: TestKind; id: string; text: string }[] {
  return [...(isBusiness(p) ? (p.model?.assumptions ?? []).map(a => ({ kind: 'assumption' as const, id: a.id, text: a.text })) : []),
    ...(hasResearch(p) ? researchOf(d, p.id).questions.map(q => ({ kind: 'question' as const, id: q.id, text: q.text })) : []),
    ...(p.decisions ?? []).filter(x => !x.chosen).flatMap(x => x.options.map(o => ({ kind: 'option' as const, id: o.id, text: `${o.text} — ${x.question}` })))];
}
// Where experiments live on a project: a business idea's Model tab, otherwise its Research tab.
export const experimentsHome = (p: Project) => `#projects/p/${encodeURIComponent(p.id)}/${isBusiness(p) ? 'model' : 'research'}`;
// Its "Test: …" task, while it's still there.
export const experimentTask = (data: MyDayData, e: ResearchExperiment): TaskItem | null => (e.taskId ? data.tasks.items.find(t => t.id === e.taskId) ?? null : null);
// Its task is done but the result isn't recorded yet (so Worth a look and Needs you ask what happened).
// (One reopened with its result kept isn't asked again.)
export function awaitingResult(data: MyDayData, e: ResearchExperiment): boolean {
  const t = experimentTask(data, e);
  return statusOf(e) !== 'done' && !e.result && !!t && isDone(data, t);
}
// Only where its experiments show: a business idea, or a project with Research on (one switched off keeps them, unseen).
export const testsDone = (data: MyDayData, p: Project) => (isBusiness(p) || hasResearch(p) ? researchOf(data, p.id).experiments.filter(e => awaitingResult(data, e)) : []);
// The finding saved from its result, while it's still there.
export const savedFinding = (d: MyDayData, e: ResearchExperiment) => (e.findingId ? researchOf(d, e.projectId).findings.find(f => f.id === e.findingId) ?? null : null);
// Offered once it's done with a result, while no finding from it is there.
export const findingOffered = (d: MyDayData, e: ResearchExperiment) => statusOf(e) === 'done' && !!e.result && !savedFinding(d, e);
export const testTitle = (e: ResearchExperiment) => `Test: ${Array.from(e.title || 'an experiment').slice(0, TASK_LIMITS.title - 6).join('')}`;

// ---------- Changing them ----------
type Add = { ok: true; id: string } | { ok: false; why: string };
const now = () => localStamp();
function cleanTests(d: MyDayData, projectId: string, tests: { kind: string; id: string }[]): { kind: TestKind; id: string }[] {
  const p = d.projects.items.find(x => x.id === projectId), questions = researchOf(d, projectId).questions, out: { kind: TestKind; id: string }[] = [];
  for (const t of tests) {
    if (out.some(x => x.kind === t.kind && x.id === t.id)) continue;
    if (t.kind === 'assumption' && p?.model?.assumptions.some(a => a.id === t.id)) out.push({ kind: 'assumption', id: t.id });
    else if (t.kind === 'question' && questions.some(q => q.id === t.id)) out.push({ kind: 'question', id: t.id });
    else if (t.kind === 'option' && optionOf(p, t.id)) out.push({ kind: 'option', id: t.id });
  }
  return out.slice(0, RESEARCH_LIMITS.testsPerExperiment);
}
const exp = (d: MyDayData, id: string) => { const x = itemOf(d, id); return x && isExperiment(x) ? x : null; };

export interface NewExperiment { title: string; tests?: { kind: TestKind; id: string }[]; how?: string; expect?: string }
export function addExperiment(d: MyDayData, projectId: string, e: NewExperiment): Add {
  const title = tidyText(e.title, RESEARCH_LIMITS.title);
  if (!title || !d.projects.items.some(p => p.id === projectId)) return { ok: false, why: 'Say what you’ll try first.' };
  if (researchOf(d, projectId).experiments.length >= RESEARCH_LIMITS.experiments) return { ok: false, why: `A project keeps at most ${RESEARCH_LIMITS.experiments} experiments.` };
  const id = 're' + uid(), at = now();
  d.research.items.push({ id, type: 'experiment', projectId, title, tests: cleanTests(d, projectId, e.tests ?? []), how: tidyText(e.how ?? '', RESEARCH_LIMITS.text),
    expect: tidyText(e.expect ?? '', RESEARCH_LIMITS.text), status: 'planned', startedOn: null, doneOn: null, result: '', conclusion: '', taskId: null, createdAt: at, updatedAt: at });
  return { ok: true, id };
}
export interface ExperimentPatch { title?: string; tests?: { kind: TestKind; id: string }[]; how?: string; expect?: string; result?: string; conclusion?: string }
export function editExperiment(d: MyDayData, id: string, patch: ExperimentPatch): boolean {
  const e = exp(d, id);
  if (!e) return false;
  // What it tests: a kind this version doesn't know (from a newer MyDay) is kept as it is.
  const foreign = e.tests.filter(t => t.kind !== 'assumption' && t.kind !== 'question' && t.kind !== 'option');
  const next = {
    title: patch.title === undefined ? e.title : tidyText(patch.title, RESEARCH_LIMITS.title) || e.title,
    tests: patch.tests === undefined ? e.tests : [...cleanTests(d, e.projectId, patch.tests), ...foreign],
    how: patch.how === undefined ? e.how : tidyText(patch.how, RESEARCH_LIMITS.text),
    expect: patch.expect === undefined ? e.expect : tidyText(patch.expect, RESEARCH_LIMITS.text),
    result: patch.result === undefined ? e.result : tidyText(patch.result, RESEARCH_LIMITS.text),
    conclusion: patch.conclusion === undefined ? e.conclusion : tidyText(patch.conclusion, RESEARCH_LIMITS.conclusion),
  };
  if (JSON.stringify(next) === JSON.stringify({ title: e.title, tests: e.tests, how: e.how, expect: e.expect, result: e.result, conclusion: e.conclusion })) return false;
  Object.assign(e, next, { updatedAt: now() });
  return true;
}
// Planned → running, from today.
export function startExperiment(d: MyDayData, id: string, k: DateKey = todayKey()): boolean {
  const e = exp(d, id);
  if (!e || statusOf(e) !== 'planned') return false;
  e.status = 'running'; e.startedOn = k; e.updatedAt = now();
  return true;
}
// What happened (it needs a few words; as long as a finding can be, so saving it as one keeps all of it) and what you
// conclude: done, today. A planned one can be recorded straight away.
export function recordResult(d: MyDayData, id: string, result: string, conclusion: string, k: DateKey = todayKey()): boolean {
  const e = exp(d, id), r = tidyText(result, RESEARCH_LIMITS.text);
  if (!e || !r || statusOf(e) === 'done') return false;
  Object.assign(e, { status: 'done', doneOn: k, result: r, conclusion: tidyText(conclusion, RESEARCH_LIMITS.conclusion), updatedAt: now() });
  return true;
}
// Back to running (to change what happened), keeping its words; a finding saved from it stays.
export function reopenExperiment(d: MyDayData, id: string): boolean {
  const e = exp(d, id);
  if (!e || statusOf(e) !== 'done') return false;
  e.status = 'running'; e.doneOn = null; e.updatedAt = now();
  return true;
}
// Adds "Test: …" (30 minutes, no date) to the project's tasks and remembers it; a next step you chose stays as it is.
// Returns the task's id, or null when nothing was added (it has a task that's still there, or it's done).
export function addExperimentTask(d: MyDayData, id: string): string | null {
  const e = exp(d, id);
  if (!e || experimentTask(d, e) || statusOf(e) === 'done' || !d.projects.items.some(p => p.id === e.projectId)) return null;
  const notes = [`From your experiment:\n${e.title}`, e.how && `How: ${e.how}`, e.expect && `What would change my mind: ${e.expect}`].filter(Boolean).join('\n\n');
  const tid = addTask(d.tasks, { title: testTitle(e), minutes: 30, category: 'admin', notes });
  if (!tid) return null;
  d.tasks.items.find(t => t.id === tid)!.projectId = e.projectId;
  e.taskId = tid; e.updatedAt = now();
  return tid;
}
// Saves its result as a finding: about each thing it tested, as you say it bears on it (relates, unless you chose),
// on the day it was done, saying it came from this experiment. Switches Research on, so the finding has its place.
export function saveAsFinding(d: MyDayData, id: string, stances: Record<string, Stance> = {}): Add {
  const e = exp(d, id);
  if (!e || !findingOffered(d, e)) return { ok: false, why: 'There’s no result to save yet.' };
  const about = testedThings(d, e).map(t => ({ kind: t.kind, id: t.id, stance: stances[testKey(t)] ?? 'relates' }));
  const r = addFinding(d, e.projectId, { text: e.result, on: e.doneOn, about }, e.doneOn ?? todayKey());
  if (!r.ok) return r;
  const f = itemOf(d, r.id)!;
  f.experimentId = e.id;
  e.findingId = r.id; e.updatedAt = now();
  setResearch(d, e.projectId, true);
  return r;
}
