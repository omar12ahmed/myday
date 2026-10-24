// Research (specs/projects-research.md): a project's questions, sources and findings. Each is one record in the
// top-level `research` section, saying which project it belongs to, so the project itself stays as it is. A source is
// a link, file or note you already have (by its id: nothing copied), or typed. A finding names its sources and what
// it's about: a question, or on a business idea one of the things that must be true, as supports, contradicts or
// relates to; deciding whether something "looks true" stays yours. Words and counts only. Never sent to AI.
import { isDateKey, isDateTime, localStamp, todayKey } from './dates';
import { tidyText } from './projectResources';
import type { DateKey, MyDayData, Project, ResearchAbout, ResearchData, ResearchFinding, ResearchItem, ResearchQuestion, ResearchSource } from './types';
import { isObj, listOf, uid } from './util';

export const RESEARCH_LIMITS = { questions: 200, sources: 300, findings: 1000, text: 1000, conclusion: 2000, limits: 500, title: 160, from: 160, sourcesPerFinding: 10, aboutPerFinding: 10 };
export const STANCES = ['supports', 'contradicts', 'relates'] as const;
export type Stance = typeof STANCES[number];
const REF_KINDS = ['resource', 'file', 'note'];
export const emptyResearch = (): ResearchData => ({ items: [] });
const ID = /^[A-Za-z0-9_-]{1,64}$/;

export const isQuestion = (x: ResearchItem): x is ResearchQuestion => x.type === 'question';
export const isSource = (x: ResearchItem): x is ResearchSource => x.type === 'source';
export const isFinding = (x: ResearchItem): x is ResearchFinding => x.type === 'finding';

// ---------- Reading ----------
const str = (v: unknown, max: number) => (typeof v === 'string' ? tidyText(v, max) : '');
const day = (v: unknown): DateKey | null => (isDateKey(v) ? v : null);
// Reading saved research: an item without an id, a project or a type is counted, never kept half-read; a later
// duplicate id is counted too. Fields, types, kinds and stances from a newer MyDay are kept.
export function normalizeResearch(raw: unknown, report: { dropped: number }): ResearchData {
  if (!isObj(raw)) return emptyResearch();
  const out: ResearchData = { ...raw, items: [] }, seen = new Set<string>();
  for (const x of listOf(raw.items)) {
    if (!isObj(x) || typeof x.id !== 'string' || !ID.test(x.id) || typeof x.projectId !== 'string' || !x.projectId || typeof x.type !== 'string' || !x.type) { report.dropped++; continue; }
    if (seen.has(x.id)) { report.dropped++; continue; }
    seen.add(x.id);
    const base = { ...x, id: x.id, projectId: x.projectId, type: x.type, createdAt: isDateTime(x.createdAt) ? x.createdAt : localStamp(), updatedAt: isDateTime(x.updatedAt) ? x.updatedAt : isDateTime(x.createdAt) ? x.createdAt : localStamp() };
    if (x.type === 'question') out.items.push({ ...base, type: 'question', text: str(x.text, RESEARCH_LIMITS.text), conclusion: str(x.conclusion, RESEARCH_LIMITS.conclusion), answeredOn: day(x.answeredOn) });
    else if (x.type === 'source') {
      const r = x.ref, ref = isObj(r) && typeof r.kind === 'string' && r.kind && typeof r.id === 'string' && r.id ? { ...r, kind: r.kind, id: r.id } : null;
      out.items.push({ ...base, type: 'source', ref, title: str(x.title, RESEARCH_LIMITS.title), from: str(x.from, RESEARCH_LIMITS.from), on: day(x.on) });
    } else if (x.type === 'finding') {
      const sourceIds = [...new Set(listOf(x.sourceIds).filter((v): v is string => typeof v === 'string' && ID.test(v)))];
      const about: ResearchAbout[] = [];
      for (const a of listOf(x.about)) if (isObj(a) && typeof a.kind === 'string' && a.kind && typeof a.id === 'string' && a.id && typeof a.stance === 'string' && a.stance && !about.some(b => b.kind === a.kind && b.id === a.id)) about.push({ ...a, kind: a.kind, id: a.id, stance: a.stance });
      out.items.push({ ...base, type: 'finding', text: str(x.text, RESEARCH_LIMITS.text), limits: str(x.limits, RESEARCH_LIMITS.limits), on: day(x.on), sourceIds, about });
    } else out.items.push(base); // a type from a newer MyDay
  }
  return out;
}

// ---------- The tool ----------
export const hasResearch = (p: Project) => p.template === 'research' || !!p.tools?.includes('research');
// Switch Research on or off for a project (a Research kind always has it). Off keeps every record.
export function setResearch(d: MyDayData, projectId: string, on: boolean): boolean {
  const p = d.projects.items.find(x => x.id === projectId);
  if (!p || p.template === 'research' || !!p.tools?.includes('research') === on) return false;
  const tools = (p.tools ?? []).filter(t => t !== 'research');
  if (on) tools.push('research');
  if (tools.length) p.tools = tools; else delete p.tools;
  p.updatedAt = localStamp();
  return true;
}

// ---------- A project's research ----------
export interface ProjectResearch { questions: ResearchQuestion[]; sources: ResearchSource[]; findings: ResearchFinding[] }
export function researchOf(d: MyDayData, projectId: string): ProjectResearch {
  const mine = d.research.items.filter(x => x.projectId === projectId);
  return { questions: mine.filter(isQuestion), sources: mine.filter(isSource), findings: mine.filter(isFinding) };
}
export const itemOf = (d: MyDayData, id: string) => d.research.items.find(x => x.id === id);
// Open questions first (in the order you added them), then answered ones (latest answer first).
export const questionOrder = (qs: ResearchQuestion[]) => [...qs.filter(q => !q.answeredOn), ...qs.filter(q => q.answeredOn).sort((a, b) => (b.answeredOn ?? '').localeCompare(a.answeredOn ?? ''))];
// The findings about something (a question or a thing that must be true), by how they bear on it.
export function findingsAbout(d: MyDayData, projectId: string, kind: 'question' | 'assumption', id: string): Record<Stance, ResearchFinding[]> {
  const out: Record<Stance, ResearchFinding[]> = { supports: [], contradicts: [], relates: [] };
  for (const f of researchOf(d, projectId).findings) {
    const a = f.about.find(x => x.kind === kind && x.id === id);
    if (a) out[(STANCES as readonly string[]).includes(a.stance) ? (a.stance as Stance) : 'relates'].push(f);
  }
  return out;
}
// "2 findings support it · 1 contradicts it" (words and counts; '' when none).
export function evidenceLine(e: Record<Stance, ResearchFinding[]>): string {
  const n = (k: number, verb: string) => (k ? `${k} finding${k === 1 ? '' : 's'} ${verb}` : '');
  return [n(e.supports.length, e.supports.length === 1 ? 'supports it' : 'support it'), n(e.contradicts.length, e.contradicts.length === 1 ? 'contradicts it' : 'contradict it'),
    n(e.relates.length, e.relates.length === 1 ? 'relates to it' : 'relate to it')].filter(Boolean).join(' · ');
}

// What a source is called, and whether what it points to is still there. A link, file or note that has gone keeps
// the name it had when added.
export function sourceInfo(d: MyDayData, s: ResearchSource): { name: string; detail: string; gone: boolean; href: string | null } {
  if (!s.ref) return { name: s.title || 'A source', detail: [s.from, s.on].filter(Boolean).join(' · '), gone: false, href: null };
  const p = d.projects.items.find(x => x.id === s.projectId);
  if (s.ref.kind === 'resource') {
    const r = p?.resources?.find(x => x.id === s.ref!.id);
    return r ? { name: r.title || r.url, detail: 'Link', gone: false, href: r.url } : { name: s.title || 'A link', detail: 'Link (no longer in Resources)', gone: true, href: null };
  }
  if (s.ref.kind === 'file') {
    const f = d.files.items.find(x => x.id === s.ref!.id && !x.deletedOn);
    return f ? { name: f.name, detail: 'File', gone: false, href: null } : { name: s.title || 'A file', detail: 'File (no longer in Files)', gone: true, href: null };
  }
  if (s.ref.kind === 'note') {
    const n = d.notes.items.find(x => x.id === s.ref!.id);
    return n ? { name: n.title || 'A note', detail: 'Note', gone: false, href: `#projects/notes/${n.id}` } : { name: s.title || 'A note', detail: 'Note (no longer in Notes)', gone: true, href: null };
  }
  return { name: s.title || 'A source', detail: '', gone: false, href: null };
}

// ---------- Changes ----------
type Add = { ok: true; id: string } | { ok: false; why: string };
const now = () => localStamp();
const count = (d: MyDayData, projectId: string, type: string) => d.research.items.filter(x => x.projectId === projectId && x.type === type).length;
const known = (d: MyDayData, projectId: string) => d.projects.items.some(p => p.id === projectId);

export function addQuestion(d: MyDayData, projectId: string, text: string): Add {
  const t = tidyText(text, RESEARCH_LIMITS.text);
  if (!t || !known(d, projectId)) return { ok: false, why: 'Write the question first.' };
  if (count(d, projectId, 'question') >= RESEARCH_LIMITS.questions) return { ok: false, why: `A project keeps at most ${RESEARCH_LIMITS.questions} questions.` };
  const id = 'rq' + uid(), at = now();
  d.research.items.push({ id, type: 'question', projectId, text: t, conclusion: '', answeredOn: null, createdAt: at, updatedAt: at });
  return { ok: true, id };
}
export function editQuestion(d: MyDayData, id: string, patch: { text?: string; conclusion?: string }): boolean {
  const q = itemOf(d, id);
  if (!q || !isQuestion(q)) return false;
  const text = patch.text === undefined ? q.text : tidyText(patch.text, RESEARCH_LIMITS.text) || q.text;
  const conclusion = patch.conclusion === undefined ? q.conclusion : tidyText(patch.conclusion, RESEARCH_LIMITS.conclusion);
  if (text === q.text && conclusion === q.conclusion) return false;
  q.text = text; q.conclusion = conclusion; q.updatedAt = now();
  return true;
}
// "Answered": with what you concluded (it needs a few words), on this day. Reopening keeps the words as a draft.
export function answerQuestion(d: MyDayData, id: string, k: DateKey = todayKey()): boolean {
  const q = itemOf(d, id);
  if (!q || !isQuestion(q) || q.answeredOn || !q.conclusion) return false;
  q.answeredOn = k; q.updatedAt = now();
  return true;
}
export function reopenQuestion(d: MyDayData, id: string): boolean {
  const q = itemOf(d, id);
  if (!q || !isQuestion(q) || !q.answeredOn) return false;
  q.answeredOn = null; q.updatedAt = now();
  return true;
}

// A link, file or note of this project's (a source points only at those).
function belongs(d: MyDayData, projectId: string, ref: { kind: string; id: string }) {
  const p = d.projects.items.find(x => x.id === projectId);
  if (ref.kind === 'resource') return !!p?.resources?.some(r => r.id === ref.id);
  if (ref.kind === 'file') return !!p?.fileIds?.includes(ref.id) && d.files.items.some(f => f.id === ref.id);
  return d.notes.items.some(n => n.id === ref.id && n.projectId === projectId);
}
// A source: one of yours (by its id: the same link, file or note is one source, not two) or typed.
export interface NewSource { ref?: { kind: 'resource' | 'file' | 'note'; id: string } | null; title?: string; from?: string; on?: DateKey | null }
export function addSource(d: MyDayData, projectId: string, s: NewSource): Add {
  if (!known(d, projectId)) return { ok: false, why: 'That project isn’t here any more.' };
  const ref = s.ref && REF_KINDS.includes(s.ref.kind) && s.ref.id ? { kind: s.ref.kind, id: s.ref.id } : null;
  if (s.ref && (!ref || !belongs(d, projectId, ref))) return { ok: false, why: 'That isn’t one of this project’s links, files or notes.' };
  if (ref) { const same = researchOf(d, projectId).sources.find(x => x.ref?.kind === ref.kind && x.ref.id === ref.id); if (same) return { ok: true, id: same.id }; }
  const title = tidyText(s.title ?? '', RESEARCH_LIMITS.title);
  if (!ref && !title) return { ok: false, why: 'Give the source a title first.' };
  if (count(d, projectId, 'source') >= RESEARCH_LIMITS.sources) return { ok: false, why: `A project keeps at most ${RESEARCH_LIMITS.sources} sources.` };
  const id = 'rs' + uid(), at = now();
  d.research.items.push({ id, type: 'source', projectId, ref, title, from: tidyText(s.from ?? '', RESEARCH_LIMITS.from), on: isDateKey(s.on) ? s.on : null, createdAt: at, updatedAt: at });
  return { ok: true, id };
}
export function editSource(d: MyDayData, id: string, patch: { title?: string; from?: string; on?: DateKey | null }): boolean {
  const s = itemOf(d, id);
  if (!s || !isSource(s) || s.ref) return false; // a link, file or note is edited where it lives
  const title = patch.title === undefined ? s.title : tidyText(patch.title, RESEARCH_LIMITS.title) || s.title;
  const from = patch.from === undefined ? s.from : tidyText(patch.from, RESEARCH_LIMITS.from);
  const on = patch.on === undefined ? s.on : isDateKey(patch.on) ? patch.on : null;
  if (title === s.title && from === s.from && on === s.on) return false;
  s.title = title; s.from = from; s.on = on; s.updatedAt = now();
  return true;
}

export interface NewFinding { text: string; limits?: string; on?: DateKey | null; sourceIds?: string[]; about?: { kind: 'question' | 'assumption'; id: string; stance: Stance }[] }
function cleanLinks(d: MyDayData, projectId: string, f: Pick<NewFinding, 'sourceIds' | 'about'>) {
  const mine = researchOf(d, projectId);
  const p = d.projects.items.find(x => x.id === projectId);
  const assumptions = p?.model?.assumptions ?? []; // a business idea's one page, kept even while the project is another kind
  const sourceIds = [...new Set(f.sourceIds ?? [])].filter(id => mine.sources.some(s => s.id === id)).slice(0, RESEARCH_LIMITS.sourcesPerFinding);
  const about: ResearchAbout[] = [];
  for (const a of f.about ?? []) {
    if (!(STANCES as readonly string[]).includes(a.stance) || about.some(b => b.kind === a.kind && b.id === a.id)) continue;
    if (a.kind === 'question' ? mine.questions.some(q => q.id === a.id) : a.kind === 'assumption' && assumptions.some(x => x.id === a.id)) about.push({ kind: a.kind, id: a.id, stance: a.stance });
  }
  return { sourceIds, about: about.slice(0, RESEARCH_LIMITS.aboutPerFinding) };
}
export function addFinding(d: MyDayData, projectId: string, f: NewFinding, k: DateKey = todayKey()): Add {
  const text = tidyText(f.text, RESEARCH_LIMITS.text);
  if (!text || !known(d, projectId)) return { ok: false, why: 'Write what you found first.' };
  if (count(d, projectId, 'finding') >= RESEARCH_LIMITS.findings) return { ok: false, why: `A project keeps at most ${RESEARCH_LIMITS.findings} findings.` };
  const id = 'rf' + uid(), at = now();
  d.research.items.push({ id, type: 'finding', projectId, text, limits: tidyText(f.limits ?? '', RESEARCH_LIMITS.limits), on: isDateKey(f.on) ? f.on : k, ...cleanLinks(d, projectId, f), createdAt: at, updatedAt: at });
  return { ok: true, id };
}
export function editFinding(d: MyDayData, id: string, patch: Partial<NewFinding>): boolean {
  const f = itemOf(d, id);
  if (!f || !isFinding(f)) return false;
  const next = {
    text: patch.text === undefined ? f.text : tidyText(patch.text, RESEARCH_LIMITS.text) || f.text,
    limits: patch.limits === undefined ? f.limits : tidyText(patch.limits, RESEARCH_LIMITS.limits),
    on: patch.on === undefined ? f.on : isDateKey(patch.on) ? patch.on : null,
    ...(patch.sourceIds === undefined && patch.about === undefined ? { sourceIds: f.sourceIds, about: f.about }
      : cleanLinks(d, f.projectId, { sourceIds: patch.sourceIds ?? f.sourceIds, about: (patch.about ?? f.about) as NewFinding['about'] })),
  };
  // An entry of a kind or stance this version doesn't know (from a newer MyDay) is kept as it is.
  const foreign = f.about.filter(a => !['question', 'assumption'].includes(a.kind) || !(STANCES as readonly string[]).includes(a.stance));
  next.about = [...next.about, ...foreign.filter(a => !next.about.some(b => b.kind === a.kind && b.id === a.id))];
  if (JSON.stringify(next) === JSON.stringify({ text: f.text, limits: f.limits, on: f.on, sourceIds: f.sourceIds, about: f.about })) return false;
  Object.assign(f, next, { updatedAt: now() });
  return true;
}

// Removing: a source comes out of its findings, a question out of the findings about it (they keep their words). The
// link, file or note a source points to is never touched.
export function removeResearch(d: MyDayData, id: string): boolean {
  const x = itemOf(d, id);
  if (!x) return false;
  d.research.items = d.research.items.filter(i => i.id !== id);
  for (const f of d.research.items) {
    if (!isFinding(f) || f.projectId !== x.projectId) continue;
    if (isSource(x) && f.sourceIds.includes(id)) { f.sourceIds = f.sourceIds.filter(s => s !== id); f.updatedAt = now(); }
    if (isQuestion(x) && f.about.some(a => a.kind === 'question' && a.id === id)) { f.about = f.about.filter(a => !(a.kind === 'question' && a.id === id)); f.updatedAt = now(); }
  }
  return true;
}
// When one of the things that must be true is removed: findings stop pointing at it.
export function forgetAssumption(d: MyDayData, projectId: string, assumptionId: string) {
  for (const f of researchOf(d, projectId).findings)
    if (f.about.some(a => a.kind === 'assumption' && a.id === assumptionId)) { f.about = f.about.filter(a => !(a.kind === 'assumption' && a.id === assumptionId)); f.updatedAt = now(); }
}
// When the project is deleted (here, or its deletion arriving from another device: sync/engine.ts), its research goes
// with it.
export function deleteProjectResearch(d: MyDayData, projectId: string): boolean {
  const before = d.research.items.length;
  d.research.items = d.research.items.filter(x => x.projectId !== projectId);
  return d.research.items.length !== before;
}
