// Understanding notes, on this device (1.13.0): which project a note belongs to, which notes are related, and why — in
// plain words. No AI and nothing sent anywhere: it compares the words things share, weighting rare words more than
// common ones (TF-IDF with cosine similarity), so "coffee" and "roaster" say more than "call" or "week".
//
// MyDay links a note to a project by itself only when it's clear: at least two meaningful words in common, a strong
// enough match, and half as strong again as the next project. Those links are listed under "MyDay connected these" with
// Undo and Keep; a project you took a note out of is never suggested for it again (`notProjects`). Weaker matches
// are only offered ("Might belong here"), never linked.
//
// The link is saved on the note with no time in it (`linkedBy`, `linkWhy`), so two devices that reach the same link
// save exactly the same note, and syncing them is never a conflict. Matches are worked out from things as they were
// before any links are made, so the result doesn't depend on the order notes are looked at.
import { isBlank } from './notes';
import type { MyDayData, Note, Project } from './types';

// Words that say little about what a note is about (English): little words, days and months, numbers in words, and
// everyday words that turn up in all sorts of notes ("work", "near", "call", "plan") — so they never link a note.
const STOP = new Set(`a about above after again against all also am an and any are as at be because been before being below
between both but by can could did do does doing done down during each else even ever every few for from further get gets
got had has have having he her here hers him his how i if in into is it its just let like ll made make many may me might
more most much must my need needs no nor not now of off on once one only or other our ours out over own per please put
quite re really s same see she should so some still such than that the their them then there these they thing things
think this those though through to too try up us very want was way we well were what when where which while who whom
why will with within without would yes yet you your yours ve d t m isn aren wasn don doesn didn won wouldn couldn
shouldn can't today tomorrow yesterday week weeks day days month time times maybe idea ideas note notes something
anything everything someone good bad new old lot lots bit next last first etc via
monday tuesday wednesday thursday friday saturday sunday january february march april june july august september
october november december morning afternoon evening night tonight weekend
two three four five six seven eight nine ten half few several
work job home place places people person near close closer far under over small big short long basic fresh local
start started move moving learn learning call book buy pay meet meeting plan plans planning sort sorting check
going come coming went take taking give giving keep look looking find found use using ask asked`.split(/\s+/));

// A light stemmer: plurals, -ing/-ed and a final e, so "offices" and "office", "nursing" and "nurses" match.
function stem(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(ss|x|z|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed') && !w.endsWith('eed')) w = w.slice(0, -2);
  if (w.length > 4 && w.endsWith('e') && !w.endsWith('ee')) w = w.slice(0, -1); // "nurse", "nursing" → "nurs"
  return w;
}

// The meaningful words of a text, each with the way it was first written (to explain a match in your own words).
export function words(text: string): { stem: string; word: string }[] {
  const out: { stem: string; word: string }[] = [];
  for (const raw of text.toLowerCase().replace(/[’']s\b/g, '').match(/[\p{L}][\p{L}\p{N}-]*/gu) ?? []) {
    const w = raw.replace(/-+$/, '');
    if (w.length < 3 || STOP.has(w)) continue;
    const s = stem(w);
    if (s.length < 3 || STOP.has(s)) continue;
    out.push({ stem: s, word: w });
  }
  return out;
}

type Vec = Map<string, number>;
interface Doc { tf: Vec; surface: Map<string, string> }
function doc(parts: [string, number][]): Doc {
  const tf: Vec = new Map(), surface = new Map<string, string>();
  for (const [text, weight] of parts) for (const { stem: s, word } of words(text)) {
    tf.set(s, (tf.get(s) ?? 0) + weight);
    if (!surface.has(s)) surface.set(s, word);
  }
  return { tf, surface };
}
const noteDoc = (n: Note) => doc([[n.title, 2], [n.text, 1]]);

interface Index { idf: Map<string, number>; notes: Map<string, Doc>; projects: Map<string, Doc> }
// A project is described by its title (counted three times), what it's about (twice), and its notes and tasks.
function projectDoc(data: MyDayData, p: Project): Doc {
  const parts: [string, number][] = [[p.title, 3], [p.summary, 2]];
  for (const n of data.notes.items) if (n.projectId === p.id) parts.push([`${n.title} ${n.text}`, 1]);
  for (const t of data.tasks.items) if (t.projectId === p.id) parts.push([t.title, 1]);
  return doc(parts);
}

// Worked out once per saved state (the saved data is replaced, never changed in place, when anything is saved).
const cache = new WeakMap<MyDayData, Index>();
function indexOf(data: MyDayData): Index {
  const hit = cache.get(data);
  if (hit) return hit;
  const notes = new Map<string, Doc>(), projects = new Map<string, Doc>();
  for (const n of data.notes.items) if (!isBlank(n)) notes.set(n.id, noteDoc(n));
  for (const p of data.projects.items) projects.set(p.id, projectDoc(data, p));
  // Rarer words count more: how many notes and projects mention each word.
  const df = new Map<string, number>();
  for (const d of [...notes.values(), ...projects.values()]) for (const s of d.tf.keys()) df.set(s, (df.get(s) ?? 0) + 1);
  const total = notes.size + projects.size, idf = new Map<string, number>();
  for (const [s, n] of df) idf.set(s, Math.log(1 + total / n));
  const index = { idf, notes, projects };
  cache.set(data, index);
  return index;
}

function cosine(a: Doc, b: Doc, idf: Map<string, number>) {
  let dot = 0, na = 0, nb = 0;
  const shared: { s: string; w: number }[] = [];
  for (const [s, x] of a.tf) { const v = x * (idf.get(s) ?? 0); na += v * v; const y = b.tf.get(s); if (y) { const u = y * (idf.get(s) ?? 0); dot += v * u; shared.push({ s, w: v * u }); } }
  for (const [s, y] of b.tf) { const u = y * (idf.get(s) ?? 0); nb += u * u; }
  return { score: na && nb ? dot / Math.sqrt(na * nb) : 0, shared: shared.sort((x, y) => y.w - x.w || x.s.localeCompare(y.s)).map(x => x.s) };
}
// "both mention “coffee” and “offices”", from a reason saved as "coffee · offices".
export function bothMention(why: string): string {
  const w = why.split(' · ').filter(Boolean).map(x => `“${x}”`);
  return w.length ? `both mention ${w.length > 1 ? `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}` : w[0]}` : 'they have words in common';
}
// The shared words as you wrote them in the note: "coffee · offices".
const why = (d: Doc, shared: string[]) => shared.slice(0, 3).map(s => d.surface.get(s) ?? s).join(' · ');

// How sure is sure: tuned on made-up notes in tests/understand-rules.test.js.
// Linked: at least two meaningful words in common, a score of at least `link`, and `ratio` times the next project's.
// Offered ("Might belong here"): anything from `offer` up. Related notes: two words in common, or one very strong one.
export const MATCH = { link: 0.12, ratio: 1.5, linkWords: 2, offer: 0.08, related: 0.12, relatedOne: 0.3 };

export interface ProjectMatch { project: Project; score: number; why: string; words: number; sure: boolean }
// The projects a note could belong to, best first (open projects only — not done ones, nor ones you took it out of).
export function projectMatches(data: MyDayData, n: Note): ProjectMatch[] {
  if (isBlank(n)) return [];
  const ix = indexOf(data), nd = ix.notes.get(n.id) ?? noteDoc(n), out: ProjectMatch[] = [];
  for (const p of data.projects.items) {
    if (p.status === 'done' || n.notProjects?.includes(p.id) || p.id === n.projectId) continue;
    const c = cosine(nd, ix.projects.get(p.id)!, ix.idf);
    if (c.score >= MATCH.offer && c.shared.length) out.push({ project: p, score: c.score, why: why(nd, c.shared), words: c.shared.length, sure: false });
  }
  out.sort((a, b) => b.score - a.score || a.project.id.localeCompare(b.project.id));
  const [best, next] = out;
  if (best) best.sure = best.score >= MATCH.link && best.words >= MATCH.linkWords && best.score >= MATCH.ratio * (next?.score ?? 0);
  return out;
}

// The links MyDay would make now: every note not in a project whose best match is clear. `skip`: a note you have open
// (it's looked at once you've left it, not while you're still writing).
export function connections(data: MyDayData, skip: string | null = null): { noteId: string; projectId: string; why: string }[] {
  const out: { noteId: string; projectId: string; why: string }[] = [];
  for (const n of data.notes.items) {
    if (n.projectId || n.id === skip || isBlank(n)) continue;
    const best = projectMatches(data, n)[0];
    if (best?.sure) out.push({ noteId: n.id, projectId: best.project.id, why: best.why });
  }
  return out;
}
// Make them (on the data being saved). Returns how many were made. Projects aren't marked as changed, so a link is the
// same on every device that makes it.
export function connect(d: MyDayData, skip: string | null = null): number {
  const made = connections(d, skip);
  for (const c of made) {
    const n = d.notes.items.find(x => x.id === c.noteId)!;
    n.projectId = c.projectId; n.linkedBy = 'rules'; n.linkWhy = c.why;
  }
  return made.length;
}

// Undo a link MyDay made (or any link): the note leaves the project, and MyDay won't put it back in that one.
export function unlink(d: MyDayData, noteId: string): boolean {
  const n = d.notes.items.find(x => x.id === noteId);
  if (!n || !n.projectId) return false;
  n.notProjects = [...new Set([...(n.notProjects ?? []), n.projectId])].slice(-50);
  delete n.projectId; delete n.linkedBy; delete n.linkWhy;
  return true;
}
// Keep a link MyDay made: it becomes yours (and leaves "MyDay connected these").
export function keepLink(d: MyDayData, noteId: string): boolean {
  const n = d.notes.items.find(x => x.id === noteId);
  if (!n || !n.linkedBy) return false;
  delete n.linkedBy; delete n.linkWhy;
  return true;
}
// The links MyDay made that you haven't kept or undone yet, most recently changed notes first.
export const madeByMyDay = (data: MyDayData) => data.notes.items.filter(n => n.projectId && n.linkedBy).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

// Notes that might belong in a project (not linked anywhere yet, and not sure enough to link — those are linked by
// themselves in a moment), best first.
export function mightBelong(data: MyDayData, p: Project, max = 3): { note: Note; why: string }[] {
  const out: { note: Note; why: string; score: number }[] = [];
  for (const n of data.notes.items) {
    if (n.projectId || isBlank(n)) continue;
    const ms = projectMatches(data, n), m = ms.find(x => x.project.id === p.id);
    if (m && !ms[0].sure) out.push({ note: n, why: m.why, score: m.score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, max);
}

// Related notes: the notes sharing the most meaningful words with this one, with the words they share.
export function relatedNotes(data: MyDayData, n: Note, max = 5): { note: Note; why: string }[] {
  if (isBlank(n)) return [];
  const ix = indexOf(data), nd = ix.notes.get(n.id) ?? noteDoc(n), out: { note: Note; why: string; score: number }[] = [];
  for (const m of data.notes.items) {
    if (m.id === n.id) continue;
    const md = ix.notes.get(m.id);
    if (!md) continue;
    const c = cosine(nd, md, ix.idf);
    if (c.score >= MATCH.related && (c.shared.length >= 2 || c.score >= MATCH.relatedOne)) out.push({ note: m, why: why(nd, c.shared), score: c.score });
  }
  return out.sort((a, b) => b.score - a.score || a.note.id.localeCompare(b.note.id)).slice(0, max);
}
