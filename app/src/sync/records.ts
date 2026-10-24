// The records that sync, and how each one maps onto MyDay's saved data (myday.data.v4). The saved data's shape
// doesn't change: a record is just a part of it.
//
// First milestone (1.1.0):
//   kind     id                          the record's content
//   list     learning | admin | health   { items: data.lists[id] }   one record per list, in its order
//   queue    queue                       { items: data.queue }       the tasks waiting for a later day
//   day      YYYY-MM-DD                  data.days[id]               that day's plan (absent = no plan)
//   context  YYYY-MM-DD                  data.context[id]            that day's energy and sleep
// (A day's plan picks tasks from the lists and moves tasks to and from the queue in the same step, so those sync
// together.)
//
// Everything else (from 1.8.0) — see ONE and MANY below:
//   one record each:      planning settings, the rota, pay rates, bank-holiday region, Finance, the Study roadmap
//                         (with concepts), Workout set-up, Food (favourites, cooking), the shopping list, Goal, note
//                         collections, your Tasks lists, What MyDay has noticed
//   one record per item:  appointments and work commitments, notes, tasks, study sessions, revision answers,
//                         workouts, saved recipes — so something added on each device is simply both kept
// Stays on each device: the theme and animations, a running focus timer or rest countdown, the bank holidays
// downloaded from gov.uk, and MyDay's own notes (nudges, celebrations, save signatures).
import { prettyDate, shortDate } from '../data/dates';
import { CATS, freshState, normalize, SCHEMA_VERSION, SEED } from '../data/normalize';
import { DEFAULT_CATEGORIES } from '../data/notes';
import { STAGES, STATUS_LABEL } from '../data/projects';
import { CAT_LABEL, ENERGY_LABEL } from '../data/plan';
import type { Book, Category, Commitment, Day, DayContext, FileRecord, ListItem, MyDayData, Note, Project, QueueItem, Recipe, ResearchItem, Review as StudyReview, StudySession, TaskItem, WorkoutSession } from '../data/types';
import { isObj } from '../data/util';
import { cleanAttempt, cleanCyberCard, cleanPortfolioEntry, normalizeCyber } from '../data/cybersecurity/normalize';
import type { CyberAttempt, CyberCard, PortfolioEntry } from '../data/cybersecurity/types';
import { cleanArabicAttempt, cleanArabicCard, cleanArabicLesson, cleanArabicPractice, cleanKeptWord, normalizeArabic } from '../data/arabic/normalize';
import { ARABIC_CORE_PATH, type ArabicAttempt, type ArabicCard, type ArabicLesson, type ArabicPractice, type KeptWord } from '../data/arabic/types';
import { PROJECT_KINDS, splitProject, type ProjectContent, type ProjectKind } from '../data/projectRecords';
import { cleanProjectRecord, isProjectKind, projectApplyOrder, putProjectRecord } from './projectParts';
import { resourceName } from '../data/projectResources';
import { sizeLabel } from '../data/files';

export type Kind = 'list' | 'queue' | 'day' | 'context'
  | 'settings' | 'rota' | 'pay' | 'holidays' | 'finance' | 'study' | 'workout' | 'food' | 'fitness' | 'notes' | 'tasks' | 'patterns'
  | 'commitment' | 'note' | 'task' | 'session' | 'review' | 'wsession' | 'recipe' | 'project' | 'cybersecurity' | 'cyber_attempt'
  | 'arabic' | 'arabic_attempt' | 'arabic_card' | 'arabic_lesson' | 'arabic_word' | 'arabic_practice' | 'cyber_card' | 'cyber_portfolio' | 'daily' | 'book' | 'file' | 'research' | ProjectKind;
export type Content = Record<string, unknown>;

// A record's key on this device: "list:learning", "day:2026-10-02", "note:nt8f…"…
export const keyOf = (kind: Kind, id: string) => `${kind}:${id}`;
export function splitKey(key: string): { kind: Kind; id: string } {
  const i = key.indexOf(':');
  return { kind: key.slice(0, i) as Kind, id: key.slice(i + 1) };
}

// Checks part of a record the way saved data is checked when MyDay opens (normalize), so a record from the cloud can
// never put anything into MyDay that a backup file couldn't.
const via = (raw: Record<string, unknown>): MyDayData => normalize({ schemaVersion: SCHEMA_VERSION, ...raw });
const obj = (v: unknown): Record<string, unknown> => (isObj(v) ? v : {});
const pick = <T extends object>(o: T, keys: (keyof T)[]): Content => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]])) as Content;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const firstLine = (t: string) => (t.split('\n').find(l => l.trim()) ?? '').trim().slice(0, 60);

// ---------- One record each ----------
interface One {
  kind: Kind; id: string; label: string;
  get(d: MyDayData): Content;
  put(draft: MyDayData, c: Content): void;
  clean(raw: Record<string, unknown>): Content | null;
  summary(c: Content): string;
  lines?(c: Content): string[];
  starter(c: Content): boolean; // still as a new MyDay has it (then the account's version is the likely choice)
}
const PLANNING = ['bufferMinutes', 'earliestTime', 'latestTime', 'gapMinutes'] as const;
const ROADMAP = ['stages', 'topics', 'focusCourseId', 'settings', 'concepts'] as const;
const SETUP = ['exercises', 'templates', 'schedule', 'planned', 'restTimer'] as const;
const KITCHEN = ['prefs', 'favourites', 'want', 'cooked', 'cooking'] as const;
const sameAsNew = (one: () => One, c: Content) => fingerprint(c) === fingerprint(one().get(freshState()));
// Recipes a Food record points at, made up just so checking keeps those links (the recipes are records of their own).
const linkedRecipes = (c: Record<string, unknown>) => {
  const ids = [...(Array.isArray(c.favourites) ? c.favourites : []), ...(Array.isArray(c.want) ? c.want.map(w => obj(w).recipeId) : []), obj(c.cooking).recipeId];
  return Object.fromEntries(ids.filter((x): x is string => typeof x === 'string').map(id => [id, { id, title: 'Recipe' }]));
};
// Renaming-safe: when your lists (or note collections) are replaced by the account's, an item filed under one of
// yours moves to the account's one with the same name, rather than losing where it was filed.
function refile<T extends { id: string; name: string }>(before: T[], after: T[], items: { [k: string]: unknown }[], field: string) {
  const name = new Map(before.map(x => [x.id, x.name.toLowerCase()]));
  const ids = new Set(after.map(x => x.id));
  for (const it of items) {
    const was = it[field];
    if (typeof was !== 'string' || !was || ids.has(was)) continue;
    const match = after.find(x => x.name.toLowerCase() === name.get(was));
    if (match) it[field] = match.id;
  }
}

const ONE: One[] = [
  { kind: 'settings', id: 'planning', label: 'Planning settings',
    get: d => pick(d.settings, [...PLANNING]), put: (dr, c) => { Object.assign(dr.settings, pick(c, [...PLANNING])); },
    clean: raw => pick(via({ settings: raw }).settings, [...PLANNING]),
    summary: c => `Tasks between ${c.earliestTime} and ${c.latestTime} · ${c.gapMinutes} min breathing room`, starter: c => sameAsNew(() => ONE[0], c) },
  { kind: 'rota', id: 'rota', label: 'Work pattern and shifts (Calendar)',
    get: d => d.rota as unknown as Content, put: (dr, c) => { dr.rota = c as unknown as MyDayData['rota']; },
    clean: raw => via({ rota: raw }).rota as unknown as Content,
    summary: c => { const r = c as unknown as MyDayData['rota']; return [plural(r.patterns.length, 'pattern'), plural(Object.keys(r.overrides).length, 'one-date change'), plural(r.entries.length, 'overtime or absence entry').replace('entrys', 'entries')].join(' · '); },
    starter: c => { const r = c as unknown as MyDayData['rota']; return !r.patterns.length && !Object.keys(r.overrides).length && !r.entries.length; } },
  { kind: 'pay', id: 'pay', label: 'Pay rates',
    get: d => d.pay as unknown as Content, put: (dr, c) => { dr.pay = c as unknown as MyDayData['pay']; },
    clean: raw => via({ pay: raw }).pay as unknown as Content,
    summary: c => (c.hourlyRate ? `£${c.hourlyRate}/h · tax code ${c.taxCode}` : 'No hourly rate yet'), starter: c => sameAsNew(() => ONE[2], c) },
  { kind: 'holidays', id: 'region', label: 'Bank holiday region',
    get: d => ({ region: d.bankHolidays.region }), put: (dr, c) => { dr.bankHolidays.region = c.region as MyDayData['bankHolidays']['region']; },
    clean: raw => ({ region: via({ bankHolidays: { region: raw.region, fetchedAt: null, divisions: null } }).bankHolidays.region }),
    summary: c => String(c.region).replace(/-/g, ' ').replace(/^./, x => x.toUpperCase()), starter: c => sameAsNew(() => ONE[3], c) },
  { kind: 'finance', id: 'finance', label: 'Finance (money owed, expenses)',
    get: d => d.finance as unknown as Content, put: (dr, c) => { dr.finance = c as unknown as MyDayData['finance']; },
    clean: raw => via({ finance: raw }).finance as unknown as Content,
    summary: c => { const f = c as unknown as MyDayData['finance']; return `${plural(f.debts.length, 'money-owed entry').replace('entrys', 'entries')} · ${plural(f.expenses.length, 'expense')}`; },
    lines: c => { const f = c as unknown as MyDayData['finance']; return [...f.debts.map(x => `${x.direction === 'owe' ? 'You owe' : 'Owed by'} ${x.person}: £${x.amount}`), ...f.expenses.map(x => `${x.name}: £${x.amount}`)]; },
    starter: c => { const f = c as unknown as MyDayData['finance']; return !f.debts.length && !f.expenses.length; } },
  { kind: 'study', id: 'roadmap', label: 'Study roadmap, topics and concepts',
    get: d => pick(d.study, [...ROADMAP]),
    put: (dr, c) => { Object.assign(dr.study, pick(c, [...ROADMAP])); if (!c.topics) delete dr.study.topics; },
    clean: raw => pick(via({ study: { ...raw, sessions: [], reviews: [] } }).study, [...ROADMAP]),
    summary: c => { const st = c as unknown as MyDayData['study']; const courses = st.stages.flatMap(s => s.courses); const tasks = courses.flatMap(x => x.modules.flatMap(m => m.sections.flatMap(se => se.tasks)));
      return [st.topics?.length ? plural(st.topics.length, 'topic') : '', plural(courses.length, 'course'), `${tasks.filter(t => t.done).length} of ${plural(tasks.length, 'task')} done`, plural(st.concepts.length, 'concept')].filter(Boolean).join(' · '); },
    lines: c => { const st = c as unknown as MyDayData['study']; return st.stages.flatMap(s => s.courses.map(x => `${s.title} › ${x.title}`)); },
    starter: c => { const st = c as unknown as MyDayData['study']; return !st.stages.length && !st.concepts.length; } },
  { kind: 'workout', id: 'setup', label: 'Workout templates and schedule',
    get: d => pick(d.health.workout, [...SETUP]), put: (dr, c) => { Object.assign(dr.health.workout, pick(c, [...SETUP])); },
    clean: raw => pick(via({ health: { workout: { ...raw, sessions: [], activeId: null, rest: null } } }).health.workout, [...SETUP]),
    summary: c => { const w = c as unknown as MyDayData['health']['workout']; return `${plural(w.templates.filter(t => !t.archived).length, 'template')} · ${plural(w.exercises.length, 'exercise')} · ${plural(Object.keys(w.planned).length, 'planned date')}`; },
    lines: c => (c as unknown as MyDayData['health']['workout']).templates.map(t => t.name), starter: c => sameAsNew(() => ONE[6], c) },
  { kind: 'food', id: 'kitchen', label: 'Food: preferences, favourites, cooking',
    get: d => pick(d.health.food, [...KITCHEN]), put: (dr, c) => { Object.assign(dr.health.food, pick(c, [...KITCHEN])); },
    clean: raw => pick(via({ health: { food: { ...raw, recipes: linkedRecipes(raw), shopping: [] } } }).health.food, [...KITCHEN]),
    summary: c => `${plural((c.favourites as unknown[]).length, 'favourite')} · ${plural((c.want as unknown[]).length, 'recipe')} to cook`, starter: c => sameAsNew(() => ONE[7], c) },
  { kind: 'food', id: 'shopping', label: 'Shopping list',
    get: d => ({ items: d.health.food.shopping }), put: (dr, c) => { dr.health.food.shopping = c.items as MyDayData['health']['food']['shopping']; },
    clean: raw => ({ items: via({ health: { food: { shopping: Array.isArray(raw.items) ? raw.items : [] } } }).health.food.shopping }),
    summary: c => { const it = c.items as { checked: boolean }[]; return it.length ? `${plural(it.length, 'item')} · ${it.filter(x => x.checked).length} ticked` : 'Empty'; },
    lines: c => (c.items as { name: string; checked: boolean }[]).map(x => `${x.checked ? '✓ ' : ''}${x.name}`), starter: c => !(c.items as unknown[]).length },
  { kind: 'fitness', id: 'goal', label: 'Goal (Health)',
    get: d => d.fitness as unknown as Content, put: (dr, c) => { dr.fitness = c as unknown as MyDayData['fitness']; },
    clean: raw => via({ fitness: raw }).fitness as unknown as Content,
    summary: c => (c.answers ? `Set${c.setOn ? ` on ${shortDate(String(c.setOn))}` : ''}` : 'No goal yet'), starter: c => !c.answers },
  { kind: 'notes', id: 'collections', label: 'Note collections',
    get: d => ({ categories: d.notes.categories }),
    put: (dr, c) => { const after = c.categories as MyDayData['notes']['categories']; refile(dr.notes.categories, after, dr.notes.items as unknown as { [k: string]: unknown }[], 'categoryId'); dr.notes.categories = after; },
    clean: raw => ({ categories: via({ notes: { categories: Array.isArray(raw.categories) ? raw.categories : [], items: [] } }).notes.categories }),
    summary: c => plural((c.categories as unknown[]).length, 'collection'), lines: c => (c.categories as { name: string }[]).map(x => x.name),
    starter: c => (c.categories as { name: string }[]).map(x => x.name).join('|') === DEFAULT_CATEGORIES.join('|') },
  { kind: 'tasks', id: 'lists', label: 'Your lists in Tasks',
    get: d => ({ lists: d.tasks.lists }),
    put: (dr, c) => { const after = c.lists as MyDayData['tasks']['lists']; refile(dr.tasks.lists, after, dr.tasks.items as unknown as { [k: string]: unknown }[], 'listId'); dr.tasks.lists = after; },
    clean: raw => ({ lists: via({ tasks: { lists: Array.isArray(raw.lists) ? raw.lists : [], items: [] } }).tasks.lists }),
    summary: c => plural((c.lists as unknown[]).length, 'list'), lines: c => (c.lists as { name: string }[]).map(x => x.name), starter: c => !(c.lists as unknown[]).length },
  { kind: 'patterns', id: 'patterns', label: 'What MyDay has noticed (your answers and preferences)',
    get: d => d.patterns as unknown as Content, put: (dr, c) => { dr.patterns = c as unknown as MyDayData['patterns']; },
    clean: raw => via({ patterns: raw }).patterns as unknown as Content,
    summary: c => plural(Object.keys(obj(c.answers)).length, 'answer'), starter: c => sameAsNew(() => ONE[12], c) },
  { kind: 'cybersecurity', id: 'preferences', label: 'Cybersecurity learning path',
    get: d => ({ pathId: d.cybersecurity.pathId }), put: (d, c) => { d.cybersecurity.pathId = String(c.pathId); },
    clean: raw => ({ pathId: normalizeCyber(raw).pathId }), summary: c => String(c.pathId), starter: c => c.pathId === 'path.core' },
  { kind: 'arabic', id: 'preferences', label: 'Arabic learning path',
    get: d => ({ pathId: d.arabic.pathId }), put: (d, c) => { d.arabic.pathId = String(c.pathId); },
    clean: raw => ({ pathId: normalizeArabic(raw).pathId }), summary: c => String(c.pathId), starter: c => c.pathId === ARABIC_CORE_PATH },
  { kind: 'daily', id: 'moves', label: 'Daily exercises (Health)',
    get: d => d.health.daily as unknown as Content, put: (dr, c) => { dr.health.daily = c as unknown as MyDayData['health']['daily']; },
    clean: raw => via({ health: { daily: raw } }).health.daily as unknown as Content,
    summary: c => { const dd = c as unknown as MyDayData['health']['daily']; return `${plural(dd.exercises.length, 'exercise')} · ${plural(Object.keys(dd.log).length, 'day')} logged`; },
    lines: c => (c as unknown as MyDayData['health']['daily']).exercises.map(e => `${e.name} — ${e.target} a day, in sets of ${e.set}${e.archived ? ' (archived)' : ''}`),
    starter: c => !(c.exercises as unknown[]).length && !Object.keys(obj(c.log)).length },
];

// ---------- One record per item ----------
interface Many {
  kind: Kind; label: string;
  items(d: MyDayData): { id: string }[];
  put(draft: MyDayData, id: string, c: Content | null): void;
  clean(id: string, raw: Record<string, unknown>): Content | null;
  summary(c: Content): string;
  lines?(c: Content): string[];
}
// Replaces, adds or removes one item (a new one goes in order, by `order`, if given).
function putItem<T extends { id: string }>(list: T[], id: string, c: Content | null, order?: (a: T, b: T) => number) {
  const i = list.findIndex(x => x.id === id);
  if (!c) { if (i >= 0) list.splice(i, 1); return; }
  if (i >= 0) list[i] = c as unknown as T;
  else { list.push(c as unknown as T); if (order) list.sort(order); }
}
// The one in progress (a study session or a workout) is the one that says so; a second one stays as it is until
// MyDay next opens, which keeps just one (as it always has).
function fixActive(sessions: { id: string; status: string }[], current: string | null): string | null {
  if (current && sessions.some(s => s.id === current && s.status === 'active')) return current;
  return sessions.find(s => s.status === 'active')?.id ?? null;
}
const byStart = (a: { date: string; startedAt: string }, b: { date: string; startedAt: string }) => (a.date + a.startedAt).localeCompare(b.date + b.startedAt);
const same = (id: string, c: { id?: unknown } | undefined | null): Content | null => (c && c.id === id ? (c as Content) : null);

const MANY: Many[] = [
  { kind: 'arabic_attempt', label: 'Arabic lesson session',
    items: d => d.arabic.attempts, put: (d, id, c) => putItem(d.arabic.attempts, id, c, (a, b) => a.startedAt.localeCompare(b.startedAt)),
    clean: (id, raw) => same(id, cleanArabicAttempt(raw) ?? undefined),
    summary: c => { const a = c as unknown as ArabicAttempt; return `${a.lessonId} · ${a.finishedAt ? 'finished' : 'in progress'}`; } },
  // An Arabic revision card: only its id (the course's), the day it was added and its schedule.
  { kind: 'arabic_card', label: 'Arabic revision card',
    items: d => d.arabic.cards, put: (d, id, c) => putItem(d.arabic.cards, id, c),
    clean: (id, raw) => same(id, cleanArabicCard(raw)),
    summary: c => { const x = c as unknown as ArabicCard; return `${x.id} · ${x.review.due ? `back on ${prettyDate(x.review.due)}` : 'not revised yet'}`; } },
  // Your place on one Arabic lesson (adaptive Study): Ready to move on, Needs revision, your latest check marks.
  // Its own record, so an older MyDay (which doesn't know this kind) leaves it alone.
  { kind: 'arabic_lesson', label: 'Arabic lesson: your place',
    items: d => d.arabic.lessons ?? [], put: (d, id, c) => { if (c || d.arabic.lessons) putItem(d.arabic.lessons ??= [], id, c); },
    clean: (id, raw) => same(id, cleanArabicLesson(raw)),
    summary: c => { const x = c as unknown as ArabicLesson; return [x.id, x.readyOn ? `ready since ${prettyDate(x.readyOn)}` : '', x.revisit ? 'to revisit' : '', x.marks ? `${Object.keys(x.marks).length} marked` : ''].filter(Boolean).join(' · '); } },
  // A word you kept: the Arabic, your meaning and note, where it came from and its two schedules. Its own record, so an
  // older MyDay (which doesn't know this kind) leaves it alone.
  { kind: 'arabic_word', label: 'Arabic: a word you kept',
    items: d => d.arabic.words ?? [], put: (d, id, c) => { if (c || d.arabic.words) putItem(d.arabic.words ??= [], id, c); },
    clean: (id, raw) => same(id, cleanKeptWord(raw)),
    summary: c => { const x = c as unknown as KeptWord; return `${x.ar} — ${x.meaning}${x.write ? ' · both ways' : ''}`; } },
  // Practise again on one Arabic lesson: the days you did its Try it and mini challenge, ticks in a session still
  // open, and its place in revision. Its own record, so an older MyDay (which doesn't know this kind) leaves it alone.
  { kind: 'arabic_practice', label: 'Arabic: a lesson to practise again',
    items: d => d.arabic.practice ?? [], put: (d, id, c) => { if (c || d.arabic.practice) putItem(d.arabic.practice ??= [], id, c); },
    clean: (id, raw) => same(id, cleanArabicPractice(raw)),
    summary: c => { const x = c as unknown as ArabicPractice; return [x.id, x.tried ? `Try it ${prettyDate(x.tried)}` : '', x.challenged ? `challenge ${prettyDate(x.challenged)}` : '', x.review?.due ? `back ${prettyDate(x.review.due)}` : ''].filter(Boolean).join(' · '); } },
  // A Cybersecurity revision card: only its question's id (the course's), the day it was added and its schedule.
  { kind: 'cyber_card', label: 'Cybersecurity revision card',
    items: d => d.cybersecurity.cards, put: (d, id, c) => putItem(d.cybersecurity.cards, id, c),
    clean: (id, raw) => same(id, cleanCyberCard(raw)),
    summary: c => { const x = c as unknown as CyberCard; return `${x.id} · ${x.review.due ? `back on ${prettyDate(x.review.due)}` : 'not revised yet'}`; } },
  // An entry in the Cybersecurity portfolio: its title, evidence, note, the day you reviewed it and its files' ids.
  // Its own record, so an older MyDay (which doesn't know this kind) leaves it alone.
  { kind: 'cyber_portfolio', label: 'Cybersecurity portfolio entry',
    items: d => d.cybersecurity.portfolio ?? [], put: (d, id, c) => { if (c || d.cybersecurity.portfolio) putItem(d.cybersecurity.portfolio ??= [], id, c); },
    clean: (id, raw) => same(id, cleanPortfolioEntry(raw)),
    summary: c => { const x = c as unknown as PortfolioEntry; return [x.title, `reviewed ${prettyDate(x.reviewedOn)}`, x.fileIds?.length ? plural(x.fileIds.length, 'file') : ''].filter(Boolean).join(' · '); } },
  { kind: 'cyber_attempt', label: 'Cybersecurity notebook attempt',
    items: d => d.cybersecurity.attempts, put: (d, id, c) => putItem(d.cybersecurity.attempts, id, c, (a, b) => a.startedAt.localeCompare(b.startedAt)),
    clean: (id, raw) => same(id, cleanAttempt(raw) ?? undefined),
    summary: c => { const a = c as unknown as CyberAttempt; return `${a.activityId} · ${a.submittedAt ? 'submitted' : 'in progress'}`; } },
  { kind: 'commitment', label: 'Appointment or work',
    items: d => d.commitments, put: (dr, id, c) => putItem(dr.commitments, id, c, (a, b) => a.start.localeCompare(b.start)),
    clean: (id, raw) => same(id, via({ commitments: [raw] }).commitments[0]),
    summary: c => { const x = c as unknown as Commitment; return `${x.title} · ${prettyDate(x.start.slice(0, 10))} ${x.start.slice(11)}–${x.end.slice(11)}`; } },
  { kind: 'note', label: 'Note',
    items: d => d.notes.items, put: (dr, id, c) => putItem(dr.notes.items, id, c),
    clean: (id, raw) => same(id, via({ notes: { categories: [], items: [raw] } }).notes.items[0]),
    summary: c => { const n = c as unknown as Note; return n.title || firstLine(n.text) || 'Empty note'; },
    lines: c => (c as unknown as Note).text.split('\n').filter(l => l.trim()).slice(0, 8) },
  { kind: 'task', label: 'Task',
    items: d => d.tasks.items, put: (dr, id, c) => putItem(dr.tasks.items, id, c),
    clean: (id, raw) => same(id, via({ tasks: { lists: [], items: [raw] } }).tasks.items[0]),
    summary: c => { const t = c as unknown as TaskItem; return `${t.title}${t.due ? ` · ${shortDate(t.due)}${t.time ? ` ${t.time}` : ''}` : ''}${t.done ? ' · done' : t.letGoOn ? ' · let go' : t.waiting ? ' · waiting' : ''}`; } },
  { kind: 'session', label: 'Study session',
    items: d => d.study.sessions,
    put: (dr, id, c) => { putItem(dr.study.sessions, id, c, byStart); dr.study.activeId = fixActive(dr.study.sessions, dr.study.activeId); },
    // The concepts a check-in names are made up just so checking keeps those links (they're in the roadmap record).
    clean: (id, raw) => { const ids = Array.isArray(obj(raw.checkin).conceptIds) ? (obj(raw.checkin).conceptIds as unknown[]) : [];
      return same(id, via({ study: { stages: [], concepts: ids.filter(x => typeof x === 'string').map(x => ({ id: x, title: 'Concept' })), sessions: [raw] } }).study.sessions[0]); },
    summary: c => { const s = c as unknown as StudySession; return `${s.title} · ${shortDate(s.date)}${s.status === 'active' ? ' · in progress' : ''}`; } },
  { kind: 'review', label: 'Revision answer',
    items: d => d.study.reviews, put: (dr, id, c) => putItem(dr.study.reviews, id, c, (a, b) => (a.date + a.at).localeCompare(b.date + b.at)),
    clean: (id, raw) => same(id, via({ study: { reviews: [raw] } }).study.reviews[0]),
    summary: c => { const r = c as unknown as StudyReview; return `${r.title} · ${shortDate(r.date)}`; } },
  { kind: 'wsession', label: 'Workout',
    items: d => d.health.workout.sessions,
    put: (dr, id, c) => { const w = dr.health.workout; putItem(w.sessions, id, c, byStart); w.activeId = fixActive(w.sessions, w.activeId); },
    clean: (id, raw) => same(id, via({ health: { workout: { sessions: [raw] } } }).health.workout.sessions[0]),
    summary: c => { const s = c as unknown as WorkoutSession; return `${s.templateName} · ${shortDate(s.date)}${s.status === 'active' ? ' · in progress' : ''}`; } },
  { kind: 'recipe', label: 'Recipe',
    items: d => Object.values(d.health.food.recipes),
    put: (dr, id, c) => { if (c) dr.health.food.recipes[id] = c as unknown as Recipe; else delete dr.health.food.recipes[id]; },
    clean: (id, raw) => same(id, via({ health: { food: { recipes: { [id]: raw } } } }).health.food.recipes[id]),
    summary: c => String(c.title) },
  // Projects (1.12.0; the database accepts them from migration 20261006120000_sync_projects.sql).
  { kind: 'project', label: 'Project',
    items: d => d.projects.items, put: (dr, id, c) => putItem(dr.projects.items, id, c),
    clean: (id, raw) => same(id, via({ projects: { items: [raw] } }).projects.items[0]),
    summary: c => { const p = c as unknown as Project; return `${p.title} · ${STAGES.find(x => x.id === p.stage)?.label ?? p.stage}${p.status === 'active' ? '' : ` · ${STATUS_LABEL[p.status].toLowerCase()}`}`; } },
  // Books in Study → Reading (1.24.0; the database accepts them from migration 20261017120000_sync_books.sql).
  // Attached files (specs/files.md; the database accepts them from migration 20261025120000_sync_files.sql): one record
  // per file — its name, type, size and state, never its bytes, which are in R2.
  { kind: 'file', label: 'File',
    items: d => d.files.items, put: (dr, id, c) => putItem(dr.files.items, id, c),
    clean: (id, raw) => same(id, via({ files: { items: [raw] } }).files.items[0]),
    summary: c => { const f = c as unknown as FileRecord; return `${f.name} · ${sizeLabel(f.size)}${f.deletedOn ? ' · in Recently deleted' : ''}`; } },
  // A project's research (specs/projects-research.md; from migration 20261025180000_sync_research.sql): one record per
  // question, source or finding, saying which project it belongs to.
  { kind: 'research', label: 'Research',
    items: d => d.research.items, put: (dr, id, c) => putItem(dr.research.items, id, c, (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
    clean: (id, raw) => same(id, via({ research: { items: [raw] } }).research.items[0]),
    summary: c => { const r = c as unknown as ResearchItem; const what = r.type === 'question' ? 'Question' : r.type === 'finding' ? 'Finding' : r.type === 'source' ? 'Source' : 'Research';
      const text = String((r as { text?: unknown }).text ?? (r as { title?: unknown }).title ?? ''); return `${what}${text ? `: ${text.length > 80 ? text.slice(0, 80) + '…' : text}` : ''}`; } },
  { kind: 'book', label: 'Book (Reading)',
    items: d => d.reading.books, put: (dr, id, c) => putItem(dr.reading.books, id, c, (a, b) => a.addedOn.localeCompare(b.addedOn) || a.id.localeCompare(b.id)),
    clean: (id, raw) => same(id, via({ reading: { books: [raw] } }).reading.books[0]),
    summary: c => { const b = c as unknown as Book; return `${b.title}${b.author ? ` · ${b.author}` : ''}${b.finishedOn ? ` · finished ${shortDate(b.finishedOn)}` : b.pages ? ` · page ${b.page} of ${b.pages}` : ''}`; },
    lines: c => (c as unknown as Book).notes.map(n => `${n.page ? `p. ${n.page} — ` : ''}${n.text}`) },
];
const oneOf = (kind: Kind, id: string) => ONE.find(o => o.kind === kind && o.id === id);
const manyOf = (kind: Kind) => MANY.find(m => m.kind === kind);
export const ALL_KINDS: Kind[] = ['list', 'queue', 'day', 'context', ...new Set(ONE.map(o => o.kind)), ...MANY.map(m => m.kind), ...PROJECT_KINDS.filter(k => k !== 'project')];

// Every synced record on this device. A day, context or item record that doesn't exist is simply missing.
export function localRecords(data: MyDayData): Map<string, Content> {
  const out = new Map<string, Content>();
  for (const cat of CATS) out.set(keyOf('list', cat), { items: data.lists[cat] });
  out.set(keyOf('queue', 'queue'), { items: data.queue });
  for (const [k, d] of Object.entries(data.days)) out.set(keyOf('day', k), d as unknown as Content);
  for (const [k, c] of Object.entries(data.context)) out.set(keyOf('context', k), c as unknown as Content);
  for (const o of ONE) out.set(keyOf(o.kind, o.id), o.get(data));
  for (const m of MANY) if (m.kind !== 'project') for (const it of m.items(data)) out.set(keyOf(m.kind, it.id), it as unknown as Content);
  data.projects.items.forEach(p => { for (const r of splitProject(p)) out.set(keyOf(r.kind, r.id), r.content); });
  return out;
}

// Puts one record into a draft of the saved data. null removes it (days, context and items can be removed).
export function putRecord(draft: MyDayData, key: string, content: Content | null) {
  const { kind, id } = splitKey(key);
  if (isProjectKind(kind)) putProjectRecord(draft, kind, id, content as ProjectContent | null);
  else if (kind === 'list') draft.lists[id as Category] = ((content && content.items) as ListItem[]) || [];
  else if (kind === 'queue') draft.queue = ((content && content.items) as QueueItem[]) || [];
  else if (kind === 'day') { if (content) draft.days[id] = content as unknown as Day; else delete draft.days[id]; }
  else if (kind === 'context') { if (content) draft.context[id] = content as unknown as DayContext; else delete draft.context[id]; }
  else if (oneOf(kind, id)) { if (content) oneOf(kind, id)!.put(draft, content); }
  else manyOf(kind)?.put(draft, id, content);
}

// A fetch can span pages or deliver a newer parent after its children. Apply the complete fetch in dependency order.
export function putRecords(draft: MyDayData, rows: [string, Content | null][]) {
  for (const [key, content] of [...rows].sort(projectApplyOrder)) putRecord(draft, key, content);
}

// A record from the cloud, checked exactly the way saved data is checked when MyDay opens (normalize), so it
// can never put anything into MyDay that a backup file couldn't. null = nothing usable (or not a record we know).
export function cleanRecord(key: string, data: unknown): Content | null {
  const { kind, id } = splitKey(key);
  const d = isObj(data) ? data : {};
  if (isProjectKind(kind)) return cleanProjectRecord(kind, id, d);
  const raw: Record<string, unknown> = { schemaVersion: SCHEMA_VERSION };
  if (kind === 'list') {
    if (!CATS.includes(id as Category)) return null;
    raw.lists = { [id]: Array.isArray(d.items) ? d.items : [] };
    return { items: normalize(raw).lists[id as Category] };
  }
  if (kind === 'queue') {
    raw.queue = Array.isArray(d.items) ? d.items : [];
    return { items: normalize(raw).queue };
  }
  if (kind === 'day') { raw.days = { [id]: d }; return (normalize(raw).days[id] as unknown as Content) ?? null; }
  if (kind === 'context') { raw.context = { [id]: d }; return (normalize(raw).context[id] as unknown as Content) ?? null; }
  const one = oneOf(kind, id);
  if (one) return one.clean(d);
  const many = manyOf(kind);
  return many ? many.clean(id, d) : null;
}

// ---------- Comparing records ----------
// The same content always gives the same text, whatever order its fields were saved in (the cloud's database
// stores fields in its own order).
function canonical(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return '{' + Object.keys(o).filter(k => o[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonical(o[k])).join(',') + '}';
  }
  return JSON.stringify(v ?? null);
}
// cyrb53, a small fast hash (not for security): two runs with different seeds give a 106-bit fingerprint.
function cyrb53(s: string, seed: number): string {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).padStart(11, '0');
}
// A fingerprint of a record's content (null = the record doesn't exist). Equal fingerprints = equal content.
export function fingerprint(content: Content | null | undefined): string | null {
  if (!content) return null;
  const s = canonical(content);
  return cyrb53(s, 1) + cyrb53(s, 2);
}

// ---------- Describing records (for the review and conflict screens) ----------
export function recordLabel(key: string): string {
  const { kind, id } = splitKey(key);
  const projectLabels: Partial<Record<ProjectKind, string>> = { project: 'Project details', project_milestone: 'Milestone', project_decision: 'Decision',
    project_choice: 'Previous choice', project_model: 'Business Model', project_case: 'Case details', project_issue: 'Case issue',
    project_evidence: 'Case evidence', project_timeline: 'Case timeline entry' };
  if (isProjectKind(kind)) return projectLabels[kind]!;
  if (kind === 'list') return `${CAT_LABEL[id as Category] ?? id} list`;
  if (kind === 'queue') return 'Queue';
  if (kind === 'day') return `Plan for ${prettyDate(id)}`;
  if (kind === 'context') return `Context for ${prettyDate(id)}`;
  return oneOf(kind, id)?.label ?? manyOf(kind)?.label ?? key;
}

// Records listed in a sensible order: the lists (in their usual order), the queue, then days newest first
// (each day's plan before its context), then everything else by kind (in the order above), newest items first.
const LATER: Kind[] = [...new Set([...ONE.map(o => o.kind), ...MANY.map(m => m.kind), ...PROJECT_KINDS])];
export function sortKeys(keys: string[]): string[] {
  const rank = (k: string) => { const { kind, id } = splitKey(k); return kind === 'list' ? CATS.indexOf(id as Category) : kind === 'queue' ? 3 : kind === 'day' || kind === 'context' ? 4 : 5 + LATER.indexOf(kind); };
  return [...keys].sort((a, b) => rank(a) - rank(b) || splitKey(b).id.localeCompare(splitKey(a).id) || b.localeCompare(a));
}

// One line, e.g. "4 tasks", "Rest day", "3 tasks · 1 done", "Energy: Good · sleep 23:00–07:00". null = deleted.
export function recordSummary(key: string, content: Content | null): string {
  if (!content) return 'Deleted';
  const { kind, id } = splitKey(key);
  if (isProjectKind(kind)) {
    const v = (content as ProjectContent).value;
    if (kind === 'project') return `${v.title} · ${STAGES.find(x => x.id === v.stage)?.label ?? v.stage}${v.status === 'active' ? '' : ` · ${STATUS_LABEL[v.status as Project['status']]?.toLowerCase() ?? v.status}`}`;
    return String(v.title ?? v.question ?? v.text ?? (kind === 'project_model' ? 'Your business idea' : 'Case details'));
  }
  if (kind === 'list') return plural((content.items as ListItem[]).length, 'task');
  if (kind === 'queue') { const n = (content.items as QueueItem[]).length; return n ? `${n} waiting` : 'Nothing waiting'; }
  if (kind === 'day') {
    const d = content as unknown as Day;
    if (d.rest) return 'Rest day';
    const done = d.tasks.filter(t => t.done).length;
    return [plural(d.tasks.length, 'task'), done ? `${done} done` : '', d.checkedIn ? 'checked in' : ''].filter(Boolean).join(' · ');
  }
  if (kind === 'context') {
    const c = content as unknown as DayContext;
    const sleep = c.sleep.start && c.sleep.end ? `sleep ${c.sleep.start.slice(11)}–${c.sleep.end.slice(11)}` : c.sleep.estimatedHours ? `sleep about ${c.sleep.estimatedHours} h` : '';
    return [c.energy ? `Energy: ${ENERGY_LABEL[c.energy]}` : '', sleep].filter(Boolean).join(' · ') || 'Nothing recorded';
  }
  const one = oneOf(kind, id), many = manyOf(kind);
  try { return one ? one.summary(content) : many ? many.summary(content) : ''; } catch { return ''; }
}

// The lines inside a record, to compare two versions side by side.
export function recordLines(key: string, content: Content | null): string[] {
  if (!content) return [];
  const { kind, id } = splitKey(key);
  if (isProjectKind(kind)) {
    const v = (content as ProjectContent).value;
    const words = (items: unknown) => Array.isArray(items) ? items.join('; ') : '';
    if (kind === 'project_decision') {
      const options = (Array.isArray(v.options) ? v.options : []) as { id: string; text: string; pros: string[]; cons: string[] }[];
      // One wrapping row per option keeps all its points visible within Compare's eight-row preview.
      return [String(v.question), ...options.map(o => `${o.text} — Pros: ${words(o.pros) || 'None'} · Cons: ${words(o.cons) || 'None'}`),
        v.chosen ? `Chosen: ${options.find(o => o.id === v.chosen)?.text ?? v.chosen}` : 'Open decision',
        `Reason: ${v.why || 'No reason given'}`, ...(v.decidedOn ? [`Decided: ${v.decidedOn}`] : [])];
    }
    if (kind === 'project_model') {
      const assumptions = (Array.isArray(v.assumptions) ? v.assumptions : []) as { text: string; state: string; found: string }[];
      return [`Problem: ${v.problem || 'Not written yet'}`, `Who: ${v.who || 'Not written yet'}`, `How: ${v.how || 'Not written yet'}`,
        ...assumptions.map(a => `${a.text} (${a.state})${a.found ? `: ${a.found}` : ''}`).reduce<string[]>((all, line) => [all.length ? `${all[0]}; ${line}` : line], [])];
    }
    // A project's own outcome, finish line and where you left off (1.48.0), and what you're learning for it (Study
    // links), so a conflict shows them too.
    const learning = kind === 'project' && Array.isArray(v.studyLinks) ? (v.studyLinks as unknown[]).filter(isObj).map(l => l.title).filter((x): x is string => typeof x === 'string') : [];
    // …and the web links kept with it, by name (their title, or their site without one).
    const kept = kind === 'project' && Array.isArray(v.resources) ? (v.resources as unknown[]).filter(isObj).filter(r => typeof r.url === 'string')
      .map(r => resourceName({ title: typeof r.title === 'string' ? r.title : '', url: r.url as string })) : [];
    const own = kind === 'project' ? [v.outcome ? `Aiming for: ${v.outcome}` : null, v.finishedWhen ? `Finished when: ${v.finishedWhen}` : null,
      isObj(v.leftOff) && typeof v.leftOff.text === 'string' ? `Where I left off: ${v.leftOff.text}` : null, learning.length ? `Learning: ${learning.join('; ')}` : null, kept.length ? `Links: ${kept.join('; ')}` : null] : [];
    return [v.title, ...own, v.text, v.summary, v.details, v.notes,
      kind === 'project_choice' ? (v.why === null ? 'Reason not saved' : v.why || 'No reason given') : v.why,
      v.on, v.date ? `${v.about ? 'About ' : ''}${v.date}` : null,
      v.aim ? `Aiming for: ${v.aim}` : null, kind === 'project_milestone' ? (v.reachedOn ? `Reached: ${v.reachedOn}` : 'Not reached yet') : null,
      v.status, v.kind, v.source, v.where, v.private ? 'Private' : null]
      .filter((x): x is string => typeof x === 'string' && !!x);
  }
  if (kind === 'list') return (content.items as ListItem[]).map(t => `${t.title} · ${t.minutes} min`);
  if (kind === 'queue') return (content.items as QueueItem[]).map(q => `${q.title} · from ${prettyDate(q.queuedOn)}`);
  if (kind === 'day') {
    const d = content as unknown as Day;
    return [d.energy ? `Energy: ${ENERGY_LABEL[d.energy]}` : '', ...d.tasks.map(t => `${t.done ? '✓ ' : ''}${t.title}`)].filter(Boolean);
  }
  const f = oneOf(kind, id)?.lines ?? manyOf(kind)?.lines;
  try { return f ? f(content) : []; } catch { return []; }
}

// Is this the untouched starter version (a new MyDay's), or empty? (Then the cloud's version is the likely choice.)
export function isStarter(key: string, content: Content | null): boolean {
  if (!content) return true;
  const { kind, id } = splitKey(key);
  if (kind === 'list') return fingerprint(content) === fingerprint({ items: SEED[id as Category] });
  if (kind === 'queue') return (content.items as QueueItem[]).length === 0;
  const one = oneOf(kind, id);
  try { return one ? one.starter(content) : false; } catch { return false; }
}
