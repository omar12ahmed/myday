// Searching one project: its own words, tasks, notes, milestones, decisions, a business idea's one page and a case's
// records (specs/projects-search.md). It only reads what's on this device: nothing is saved and nothing is sent anywhere.
// Every word must appear, in any order; capitals, accents and the kind of apostrophe don't matter. No ranking: a fixed
// order by kind. Only your own words are searched, never MyDay's labels ("Your answers", "Untitled note").
import { isBusiness, isCase } from './businessModel';
import { noteName } from './notes';
import { decisionHistory } from './projectPlan';
import { projectNotes, projectTasks } from './projects';
import { isDone } from './tasks';
import type { MyDayData, Project } from './types';

export type SearchKind = 'about' | 'task' | 'note' | 'milestone' | 'decision' | 'model' | 'timeline' | 'evidence' | 'issue';
export interface SearchHit { kind: SearchKind; id: string; title: string; excerpt: string; href: string; done?: 'done' | 'let go'; private?: true }
export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  about: 'About it', task: 'Task', note: 'Note', milestone: 'Milestone', decision: 'Decision', model: 'Your one page',
  timeline: 'Timeline', evidence: 'Evidence', issue: 'Issue',
};

// "2 matches for “armchair”": the results' heading, and what the always-present status line tells a screen reader.
export const matchCount = (n: number, query: string) =>
  n ? `${n} ${n === 1 ? 'match' : 'matches'} for “${query.trim()}”` : `Nothing in this project matches “${query.trim()}”`;

// Without capitals or accents ("Café" → "cafe"), and with one kind of apostrophe ("Sam’s" → "Sam's"), so you find the
// words you remember however your keyboard typed them.
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[’‘]/g, "'").toLowerCase();
const wordsOf = (q: string) => fold(q).split(/\s+/).filter(Boolean);

// A little of the longer text around the first word found, on one line. It's cut on whole characters and, where it
// can be, at spaces: never half an emoji or a mark without its letter, whatever the script.
function excerptOf(texts: string[], words: string[]): string {
  for (const t of texts) {
    const chars = Array.from(t.replace(/\s+/g, ' ').trim());
    let folded = '';
    const back: number[] = []; // the character each folded position came from
    chars.forEach((c, i) => { const f = fold(c); folded += f; for (let j = 0; j < f.length; j++) back.push(i); });
    const found = words.map(w => folded.indexOf(w)).filter(i => i >= 0);
    if (!found.length) continue;
    const at = back[Math.min(...found)];
    let start = Math.max(0, at - 40), end = Math.min(chars.length, start + 120);
    if (start > 0) { const sp = chars.indexOf(' ', start); start = sp >= 0 && sp < at ? sp + 1 : start; } // begin on a word
    if (end < chars.length) { const sp = chars.lastIndexOf(' ', end); end = sp > at ? sp : end; }
    while (start > 0 && /\p{M}/u.test(chars[start])) start--; // never begin on a mark without its letter
    return `${start ? '…' : ''}${chars.slice(start, end).join('').trim()}${end < chars.length ? '…' : ''}`;
  }
  return '';
}

export function searchProject(data: MyDayData, p: Project, query: string): SearchHit[] {
  const words = wordsOf(query);
  if (!words.length) return [];
  const tab = (t?: string) => `#projects/p/${encodeURIComponent(p.id)}${t ? '/' + t : ''}`;
  const hits: SearchHit[] = [];
  // One thing is found when every word is somewhere in its own words. `show` is what the result is called (which may be
  // MyDay's own label); only `own` is searched.
  const add = (kind: SearchKind, id: string, show: string, own: string, rest: (string | null | undefined)[], href: string, more: Partial<SearchHit> = {}) => {
    const others = rest.filter((x): x is string => typeof x === 'string' && !!x.trim());
    if (!words.every(w => fold([own, ...others].join('\n')).includes(w))) return;
    hits.push({ kind, id, title: show, excerpt: own && words.every(w => fold(own).includes(w)) ? '' : excerptOf(others, words), href, ...more });
  };

  add('about', p.id, p.title, p.title, [p.summary, p.outcome, p.finishedWhen, p.leftOff?.text], tab());
  const { open, done } = projectTasks(data, p);
  for (const t of [...open, ...done]) {
    const state = t.letGoOn ? 'let go' : isDone(data, t) ? 'done' : undefined;
    add('task', t.id, t.title, t.title, [t.notes, t.waiting?.on], `#today/tasks/${encodeURIComponent(t.id)}`, state ? { done: state } : {});
  }
  for (const n of projectNotes(data, p)) add('note', n.id, noteName(n), n.title, [n.text], `#projects/notes/${encodeURIComponent(n.id)}`, n.private ? { private: true } : {});
  for (const m of p.milestones ?? []) add('milestone', m.id, m.title, m.title, [], tab('milestones'));
  for (const x of p.decisions ?? []) {
    add('decision', x.id, x.question, x.question, [...x.options.flatMap(o => [o.text, ...o.pros, ...o.cons]), x.why, ...decisionHistory(x).flatMap(h => [h.text, h.why])], tab('decisions'));
  }
  if (isBusiness(p) && p.model) {
    add('model', 'answers', 'Your answers', '', [p.model.problem, p.model.who, p.model.how], tab('model'));
    for (const a of p.model.assumptions) add('model', a.id, a.text, a.text, [a.found], tab('model'));
  }
  if (isCase(p) && p.case) {
    for (const t of p.case.timeline) add('timeline', t.id, t.title, t.title, [t.details], tab('timeline'));
    for (const e of p.case.evidence) add('evidence', e.id, e.title, e.title, [e.where, e.notes], tab('evidence'));
    for (const i of p.case.issues) add('issue', i.id, i.title, i.title, [i.notes], tab('issues'));
  }
  return hits;
}
