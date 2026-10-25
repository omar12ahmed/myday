// Search everywhere (specs/search-everywhere.md): one search across MyDay's sections, on this device — nothing is saved
// and nothing is sent anywhere. Matching is project search's (data/projectSearch.ts): every word must appear, in any
// order; capitals, accents, Arabic vowel marks and the kind of apostrophe don't matter. Only your own words are
// searched, never MyDay's labels — except the Arabic and Cybersecurity modules and lessons by title, which the owner
// asked to find (passed in as `courses`, loaded only when Search opens). No ranking: sections in a fixed order, and in
// each, open things before paused ones and those before done, finished or past ones.
// Private projects (with their tasks, notes and appointments) and private notes aren't searched here: they're searched
// on their own pages (the owner's choice, 25 Oct 2026). Never searched: a lesson check's reference answers, a kept
// "another way" explanation, or anything else an AI wrote but a revision card's own words (marked "AI-made").
import { lessonHref } from './cybersecurity/types';
import { shortDate } from './dates';
import { categoryName, noteName } from './notes';
import { CAT_LABEL } from './plan';
import { privateProjectIds } from './projects';
import { excerptOf, fold, SEARCH_KIND_LABEL, searchProject, wordsOf } from './projectSearch';
import { isDone, listName } from './tasks';
import type { Category, DateKey, MyDayData } from './types';

export type SearchSection = 'tasks' | 'projects' | 'notes' | 'calendar' | 'study' | 'finance' | 'health';
export const SECTION_LABEL: Record<SearchSection, string> = { tasks: 'Tasks', projects: 'Projects', notes: 'Notes', calendar: 'Calendar', study: 'Study', finance: 'Finance', health: 'Health' };
const ORDER: SearchSection[] = ['tasks', 'projects', 'notes', 'calendar', 'study', 'finance', 'health'];
export const PER_SECTION = 50;

// One thing found: what it is, what it's called, where it is (when that helps), a little of the longer text the words
// were found in, and the link that opens it. `focus` is an element to bring into view once its screen is open (for
// things with no page of their own); `tags` are shown after the kind ("Done", "Private" never — private isn't here).
export interface Found {
  kind: string; id: string; title: string; where: string; excerpt: string; href: string;
  tags: string[]; focus?: string; lang?: 'ar';
  rank: number; // 0 open, 1 paused, 2 done, let go, archived, finished or past (the order within a section)
}
export interface FoundSection { section: SearchSection; label: string; items: Found[]; more: number }
export interface SearchResult { query: string; total: number; sections: FoundSection[]; leftOut: boolean }

// The Arabic and Cybersecurity courses' modules and lessons by title (search/courseIndex.ts builds it from the two
// catalogues, loaded only when Search opens).
export interface CourseIndex {
  // words: the course's own (each lesson's, and the starter words, which have no lesson) — 1.84.0 on.
  arabic: { modules: { id: string; name: string; purpose: string }[]; lessons: { id: string; title: string; moduleId: string }[]; words?: { id: string; ar: string; meaning: string; example: string; exampleMeaning: string; lessonId: string | null }[] };
  cyber: { modules: { id: string; name: string; purpose: string }[]; lessons: { id: string; title: string; moduleId: string }[]; activities: { id: string; title: string }[] };
}

// Tatweel (the Arabic stretching line) is left out as well, so a word found with or without it is the same word.
const fold2 = (s: string) => fold(s).replace(/ـ/g, '');
const texts = (xs: unknown[]): string[] => xs.flatMap(x => Array.isArray(x) ? texts(x) : typeof x === 'string' && x.trim() ? [x] : []);
const enc = encodeURIComponent;
const quote = (s: string) => `“${s}”`;
const attr = (id: string) => id.replace(/["\\]/g, '\\$&'); // an id inside [data-…="…"]

export const foundCount = (n: number, query: string) =>
  n ? `${n} ${n === 1 ? 'match' : 'matches'} for “${query.trim()}”` : `Nothing in MyDay matches “${query.trim()}”`;

export function searchEverywhere(data: MyDayData, query: string, courses: CourseIndex | null, today: DateKey): SearchResult {
  const words = wordsOf(query).map(w => w.replace(/ـ/g, '')).filter(Boolean);
  const priv = privateProjectIds(data);
  const leftOut = priv.size > 0 || data.notes.items.some(n => n.private);
  if (!words.length) return { query, total: 0, sections: [], leftOut };
  const found: Record<SearchSection, Found[]> = { tasks: [], projects: [], notes: [], calendar: [], study: [], finance: [], health: [] };
  // Found when every word is somewhere in its own words; the excerpt only when they aren't all in `own` (its name).
  const add = (section: SearchSection, f: Omit<Found, 'excerpt' | 'tags' | 'rank' | 'where'> & { where?: string; tags?: string[]; rank?: number }, own: string, rest: unknown[] = []) => {
    const others = texts(rest);
    if (!words.every(w => fold2([own, ...others].join('\n')).includes(w))) return;
    const excerpt = own && words.every(w => fold2(own).includes(w)) ? '' : excerptOf(others, words);
    found[section].push({ where: '', tags: [], rank: 0, ...f, excerpt });
  };
  const projects = new Map(data.projects.items.map(p => [p.id, p]));
  const inProject = (id?: string) => { const p = id ? projects.get(id) : undefined; return p ? `in ${quote(p.title)}` : ''; };
  const hidden = (projectId?: string) => !!projectId && priv.has(projectId);

  // Tasks: yours and your projects' (not a private one's): title, notes, who or what it waits on, its steps.
  for (const t of data.tasks.items) {
    if (hidden(t.projectId)) continue;
    const state = t.letGoOn ? 'Let go' : isDone(data, t) ? 'Done' : null;
    const list = t.listId ? listName(data.tasks, t.listId) : '';
    add('tasks', { kind: 'Task', id: t.id, title: t.title, where: inProject(t.projectId) || (list ? `${quote(list)} list` : ''), href: `#today/tasks/${enc(t.id)}`, tags: state ? [state] : [], rank: state ? 2 : 0 },
      t.title, [t.notes, t.waiting?.on, (t.steps ?? []).map(s => s.text)]);
  }
  for (const l of data.tasks.lists) add('tasks', { kind: 'Task list', id: l.id, title: l.name, href: `#today/tasks/list/${enc(l.id)}` }, l.name);
  for (const cat of Object.keys(data.lists) as Category[]) {
    for (const it of data.lists[cat] ?? []) add('tasks', { kind: 'Today list', id: it.id, title: it.title, where: CAT_LABEL[cat] ?? '', href: '#today/edit' }, it.title);
  }

  // Projects: everything "Search this project" finds but its tasks and notes (they're under Tasks and Notes, so nothing
  // shows twice); open projects, then paused, then done. Private ones aren't searched here.
  for (const p of data.projects.items) {
    if (p.private) continue;
    const state = p.status === 'paused' ? 'Paused' : p.status === 'done' ? 'Done' : null, rank = p.status === 'paused' ? 1 : p.status === 'done' ? 2 : 0;
    for (const h of searchProject(data, p, query)) {
      if (h.kind === 'task' || h.kind === 'note') continue;
      // Arriving, the item itself is brought into view and focused, as Search this project's pick does (ProjectView's
      // focusItem: the head, the one page's answers, or the row with its data-id).
      const focus = h.kind === 'about' ? '#projectHead' : h.kind === 'model' && h.id === 'answers' ? '#pjModelH' : `[data-id="${attr(h.id)}"]`;
      found.projects.push({ kind: h.kind === 'about' ? 'Project' : SEARCH_KIND_LABEL[h.kind], id: `${p.id}:${h.kind}:${h.id}`, title: h.title, where: h.kind === 'about' ? '' : `in ${quote(p.title)}`,
        excerpt: h.excerpt, href: h.href, tags: state ? [state] : [], rank, focus });
    }
  }

  // Notes: title and text; not private, not in a private project.
  for (const n of data.notes.items) {
    if (n.private || hidden(n.projectId)) continue;
    add('notes', { kind: 'Note', id: n.id, title: noteName(n), where: inProject(n.projectId) || categoryName(data.notes, n.categoryId), href: `#projects/notes/${enc(n.id)}` }, n.title, [n.text]);
  }

  // Calendar: appointments and work, with their day and time (not a private project's); coming ones first, soonest
  // first, then past ones, latest first. Opens the calendar on that day.
  const privAppts = new Set(data.projects.items.filter(p => p.private).flatMap(p => p.commitmentIds ?? []));
  const appts = data.commitments.filter(c => !privAppts.has(c.id));
  const coming = appts.filter(c => c.start.slice(0, 10) >= today).sort((a, b) => a.start.localeCompare(b.start));
  const past = appts.filter(c => c.start.slice(0, 10) < today).sort((a, b) => b.start.localeCompare(a.start));
  for (const c of [...coming, ...past]) {
    const day = c.start.slice(0, 10), was = day < today;
    add('calendar', { kind: c.kind === 'work' ? 'Work' : 'Appointment', id: c.id, title: c.title, where: `${shortDate(day)}, ${c.start.slice(11, 16)}`, href: `#calendar/${day}`, tags: was ? ['Past'] : [], rank: was ? 2 : 0 }, c.title);
  }

  // Study: your own courses on the roadmap (not the guided Cybersecurity course, whose lessons are found as lessons),
  // topics, revision cards, check-ins, Reading, Arabic kept words and "Needs revision" notes, your session answers,
  // your notebook and portfolio; then the two courses' modules and lessons by title.
  for (const tp of data.study.topics ?? []) add('study', { kind: 'Study topic', id: tp.id, title: tp.title, href: `#study/topic/${enc(tp.id)}` }, tp.title);
  for (const st of data.study.stages) {
    add('study', { kind: 'Stage', id: st.id, title: st.title, href: `#study/topic/${enc(st.topicId || 'main')}` }, st.title);
    for (const c of st.courses) {
      if (c.id.startsWith('cyber:1:')) continue;
      const course = `#study/course/${enc(c.id)}`, inCourse = `in ${quote(c.title)}`, cr = c.archived ? 2 : 0, ct = c.archived ? ['Archived'] : [];
      add('study', { kind: 'Course', id: c.id, title: c.title, where: st.title, href: course, tags: ct, rank: cr }, c.title);
      for (const m of c.modules) {
        add('study', { kind: 'Module', id: m.id, title: m.title, where: inCourse, href: course, tags: ct, rank: cr }, m.title);
        for (const s of m.sections) {
          add('study', { kind: 'Section', id: s.id, title: s.title, where: inCourse, href: course, tags: ct, rank: cr }, s.title);
          for (const t of s.tasks) add('study', { kind: 'Study task', id: t.id, title: t.title, where: inCourse, href: `#study/task/${enc(t.id)}`, tags: t.done ? ['Done'] : ct, rank: t.done ? 2 : cr }, t.title, [t.note]);
        }
      }
    }
  }
  for (const c of data.study.concepts) {
    // An AI-made card's own words are found (it's marked); never a kept "another way" explanation.
    add('study', { kind: 'Revision card', id: c.id, title: c.title, href: `#study/concept/${enc(c.id)}`, tags: c.origin ? ['AI-made'] : [] }, c.title, [c.prompt, c.answer, c.hint, c.origin ? [] : [c.explanation, c.source]]);
  }
  for (const s of data.study.sessions) {
    if (!s.checkin) continue;
    add('study', { kind: 'Check-in', id: s.id, title: s.title || 'Study session', where: shortDate(s.date), href: `#study/checkin/${enc(s.id)}` }, '', [s.checkin.takeaway, s.checkin.question, s.checkin.note]);
  }
  for (const b of data.reading.books) {
    add('study', { kind: 'Book', id: b.id, title: b.title, where: b.author, href: '#study/reading', tags: b.finishedOn ? ['Finished'] : [], rank: b.finishedOn ? 2 : 0 }, b.title, [b.author, b.notes.map(n => n.text)]);
  }
  const arLesson = new Map((courses?.arabic.lessons ?? []).map(l => [l.id, l.title]));
  const cyLesson = new Map([...(courses?.cyber.lessons ?? []), ...(courses?.cyber.activities ?? [])].map(l => [l.id, l.title]));
  const arHref = (id: string) => `#study/arabic/${enc(id)}`;
  for (const w of data.arabic.words ?? []) {
    add('study', { kind: 'Kept word', id: w.id, title: w.ar, where: w.meaning, href: '#study/arabic/vocabulary', focus: `[data-ar-kept="${attr(w.id)}"]`, lang: 'ar' }, w.ar, [w.meaning, w.note]);
  }
  for (const l of data.arabic.lessons ?? []) {
    if (l.revisit?.what) add('study', { kind: 'Needs revision', id: `ar:${l.id}`, title: arLesson.get(l.id) ?? 'Arabic lesson', where: 'Arabic', href: arHref(l.id) }, '', [l.revisit.what]);
  }
  for (const a of data.arabic.attempts) {
    add('study', { kind: 'Your answers', id: a.id, title: arLesson.get(a.lessonId) ?? 'Arabic lesson', where: `Arabic · ${shortDate(a.startedAt.slice(0, 10))}`, href: arHref(a.lessonId) }, '', [Object.values(a.answers), a.revisit]);
  }
  for (const l of data.cybersecurity.lessons ?? []) {
    if (l.revisit?.what) add('study', { kind: 'Needs revision', id: `cy:${l.id}`, title: cyLesson.get(l.id) ?? 'Cybersecurity lesson', where: 'Cybersecurity', href: lessonHref(l.id) }, '', [l.revisit.what]);
  }
  for (const a of data.cybersecurity.attempts) {
    add('study', { kind: 'Notebook', id: a.id, title: cyLesson.get(a.activityId) ?? 'Notebook activity', where: `Cybersecurity · ${shortDate(a.startedAt.slice(0, 10))}`, href: lessonHref(a.activityId) }, '', [a.evidence, Object.values(a.answers), a.resumePoint]);
  }
  for (const e of data.cybersecurity.portfolio ?? []) {
    add('study', { kind: 'Portfolio', id: e.id, title: e.title, where: 'Cybersecurity', href: '#study/cybersecurity/portfolio' }, e.title, [e.evidence, e.note]);
  }
  if (courses) {
    const arModule = new Map(courses.arabic.modules.map(m => [m.id, m.name])), cyModule = new Map(courses.cyber.modules.map(m => [m.id, m.name]));
    for (const m of courses.arabic.modules) add('study', { kind: 'Arabic module', id: m.id, title: m.name, href: arHref(m.id) }, m.name, [m.purpose]);
    for (const l of courses.arabic.lessons) add('study', { kind: 'Arabic lesson', id: l.id, title: l.title, where: arModule.get(l.moduleId) ?? '', href: arHref(l.id) }, l.title);
    // The course's own words (the owner's yes, 25 Oct 2026): by the Arabic, its meaning or its example; a lesson's word
    // opens its lesson, a starter word Vocabulary at that word.
    for (const w of courses.arabic.words ?? []) {
      add('study', { kind: 'Course word', id: w.id, title: w.ar, where: w.meaning, href: w.lessonId ? arHref(w.lessonId) : '#study/arabic/vocabulary', lang: 'ar',
        ...(w.lessonId ? {} : { focus: `[data-ar-word="${attr(w.id)}"]` }) }, w.ar, [w.meaning, w.example, w.exampleMeaning]);
    }
    for (const m of courses.cyber.modules) add('study', { kind: 'Cybersecurity module', id: m.id, title: m.name, href: lessonHref(m.id) }, m.name, [m.purpose]);
    for (const l of courses.cyber.lessons) add('study', { kind: 'Cybersecurity lesson', id: l.id, title: l.title, where: cyModule.get(l.moduleId) ?? '', href: lessonHref(l.id) }, l.title);
  }

  // Finance: the names and notes you gave money owed and monthly expenses (Finance has one page; the card is brought
  // into view).
  for (const x of data.finance.debts) add('finance', { kind: x.direction === 'owed' ? 'Owed to you' : 'You owe', id: x.id, title: x.person, href: '#finance', focus: '#owedCard' }, x.person, [x.note]);
  for (const x of data.finance.expenses) add('finance', { kind: 'Monthly expense', id: x.id, title: x.name, href: '#finance', focus: '#expensesCard' }, x.name);

  // Health: recipes (with their ingredients and tags), the shopping list, exercises, workouts and daily exercises.
  for (const [id, r] of Object.entries(data.health.food.recipes ?? {})) {
    add('health', { kind: 'Recipe', id, title: r.title, href: `#health/food/recipe/${enc(id)}` }, r.title, [r.ingredients.map(i => i.name), r.tags, r.category, r.area, r.sourceName]);
  }
  for (const s of data.health.food.shopping ?? []) {
    add('health', { kind: 'Shopping list', id: s.id, title: s.name, href: '#health/food/shopping', tags: s.checked ? ['Ticked'] : [], rank: s.checked ? 2 : 0 }, s.name, [s.text]);
  }
  for (const x of data.health.workout.exercises) add('health', { kind: 'Exercise', id: x.id, title: x.name, href: `#health/workout/exercise/${enc(x.id)}`, tags: x.archived ? ['Archived'] : [], rank: x.archived ? 2 : 0 }, x.name);
  for (const x of data.health.workout.templates) add('health', { kind: 'Workout', id: x.id, title: x.name, href: `#health/workout/template/${enc(x.id)}`, tags: x.archived ? ['Archived'] : [], rank: x.archived ? 2 : 0 }, x.name);
  for (const x of data.health.daily.exercises) add('health', { kind: 'Daily exercise', id: x.id, title: x.name, href: '#health/workout', tags: x.archived ? ['Archived'] : [], rank: x.archived ? 2 : 0 }, x.name);

  const sections: FoundSection[] = [];
  let total = 0;
  for (const s of ORDER) {
    const all = found[s].map((f, i) => [f, i] as const).sort((a, b) => a[0].rank - b[0].rank || a[1] - b[1]).map(([f]) => f); // stable
    if (!all.length) continue;
    total += all.length;
    sections.push({ section: s, label: SECTION_LABEL[s], items: all.slice(0, PER_SECTION), more: Math.max(0, all.length - PER_SECTION) });
  }
  return { query, total, sections, leftOut };
}
