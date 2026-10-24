// Searching one project: its own words, tasks, notes, milestones, decisions, a business idea's one page and a case's
// records (specs/projects-search.md). It only reads what's on this device: nothing is saved and nothing is sent anywhere.
// Every word must appear, in any order; capitals and accents don't matter. No ranking: a fixed order by kind.
import { isBusiness, isCase } from './businessModel';
import { noteName } from './notes';
import { decisionHistory } from './projectPlan';
import { projectNotes, projectTasks } from './projects';
import { isDone } from './tasks';
import type { MyDayData, Project } from './types';

export type SearchKind = 'about' | 'task' | 'note' | 'milestone' | 'decision' | 'model' | 'timeline' | 'evidence' | 'issue';
export interface SearchHit { kind: SearchKind; id: string; title: string; excerpt: string; href: string; done?: 'done' | 'let go' }
export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  about: 'About it', task: 'Task', note: 'Note', milestone: 'Milestone', decision: 'Decision', model: 'Your one page',
  timeline: 'Timeline', evidence: 'Evidence', issue: 'Issue',
};

// Without capitals or accents ("Café" → "cafe"), so you find the words you remember.
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const wordsOf = (q: string) => fold(q).split(/\s+/).filter(Boolean);

// A little of the longer text around the first word found (none when it's in the title), on one line.
function excerptOf(texts: string[], words: string[]): string {
  for (const t of texts) {
    const f = fold(t), at = Math.min(...words.map(w => f.indexOf(w)).filter(i => i >= 0));
    if (!Number.isFinite(at)) continue;
    const start = Math.max(0, at - 40), one = t.replace(/\s+/g, ' ');
    return `${start ? '…' : ''}${one.slice(start, start + 120).trim()}${start + 120 < one.length ? '…' : ''}`;
  }
  return '';
}

export function searchProject(data: MyDayData, p: Project, query: string): SearchHit[] {
  const words = wordsOf(query);
  if (!words.length) return [];
  const tab = (t?: string) => `#projects/p/${encodeURIComponent(p.id)}${t ? '/' + t : ''}`;
  const hits: SearchHit[] = [];
  // One thing (its title and its other text) is found when every word is somewhere in it.
  const add = (kind: SearchKind, id: string, title: string, rest: (string | null | undefined)[], href: string, done?: SearchHit['done']) => {
    const others = rest.filter((x): x is string => typeof x === 'string' && !!x.trim());
    const all = fold([title, ...others].join('\n'));
    if (!words.every(w => all.includes(w))) return;
    hits.push({ kind, id, title, excerpt: words.every(w => fold(title).includes(w)) ? '' : excerptOf(others, words), href, ...(done ? { done } : {}) });
  };

  add('about', p.id, p.title, [p.summary, p.outcome, p.finishedWhen, p.leftOff?.text], tab());
  const { open, done } = projectTasks(data, p);
  for (const t of [...open, ...done]) add('task', t.id, t.title, [t.notes, t.waiting?.on], `#today/tasks/${encodeURIComponent(t.id)}`,
    t.letGoOn ? 'let go' : isDone(data, t) ? 'done' : undefined);
  for (const n of projectNotes(data, p)) add('note', n.id, noteName(n), [n.text], `#projects/notes/${encodeURIComponent(n.id)}`);
  for (const m of p.milestones ?? []) add('milestone', m.id, m.title, [], tab('milestones'));
  for (const x of p.decisions ?? []) {
    add('decision', x.id, x.question, [...x.options.flatMap(o => [o.text, ...o.pros, ...o.cons]), x.why, ...decisionHistory(x).flatMap(h => [h.text, h.why])], tab('decisions'));
  }
  if (isBusiness(p) && p.model) {
    add('model', 'answers', 'Your answers', [p.model.problem, p.model.who, p.model.how], tab('model'));
    for (const a of p.model.assumptions) add('model', a.id, a.text, [a.found], tab('model'));
  }
  if (isCase(p) && p.case) {
    for (const t of p.case.timeline) add('timeline', t.id, t.title, [t.details], tab('timeline'));
    for (const e of p.case.evidence) add('evidence', e.id, e.title, [e.where, e.notes], tab('evidence'));
    for (const i of p.case.issues) add('issue', i.id, i.title, [i.notes], tab('issues'));
  }
  return hits;
}
