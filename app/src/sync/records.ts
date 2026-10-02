// The records that sync in this first milestone, and how each one maps onto MyDay's saved data
// (myday.data.v4). The saved data's shape doesn't change: a record is just a part of it.
//
//   kind     id                          the record's content
//   list     learning | admin | health   { items: data.lists[id] }   one record per list, in its order
//   queue    queue                       { items: data.queue }       the tasks waiting for a later day
//   day      YYYY-MM-DD                  data.days[id]               that day's plan (absent = no plan)
//   context  YYYY-MM-DD                  data.context[id]            that day's energy and sleep
//
// Why these: a day's plan picks tasks from the lists and moves tasks to and from the queue in the same step,
// so syncing plans without the lists and the queue would leave carried-over tasks behind on one device.
// Everything else (Calendar and Pay, Health, Study, appointments, settings, the timer) stays on this device.
import { prettyDate } from '../data/dates';
import { CATS, normalize, SCHEMA_VERSION, SEED } from '../data/normalize';
import { CAT_LABEL, ENERGY_LABEL } from '../data/plan';
import type { Category, Day, DayContext, ListItem, MyDayData, QueueItem } from '../data/types';
import { isObj } from '../data/util';

export type Kind = 'list' | 'queue' | 'day' | 'context';
export type Content = Record<string, unknown>;

// A record's key on this device: "list:learning", "day:2026-10-02"…
export const keyOf = (kind: Kind, id: string) => `${kind}:${id}`;
export function splitKey(key: string): { kind: Kind; id: string } {
  const i = key.indexOf(':');
  return { kind: key.slice(0, i) as Kind, id: key.slice(i + 1) };
}

// Every synced record on this device. A day or context record that doesn't exist is simply missing.
export function localRecords(data: MyDayData): Map<string, Content> {
  const out = new Map<string, Content>();
  for (const cat of CATS) out.set(keyOf('list', cat), { items: data.lists[cat] });
  out.set(keyOf('queue', 'queue'), { items: data.queue });
  for (const [k, d] of Object.entries(data.days)) out.set(keyOf('day', k), d as unknown as Content);
  for (const [k, c] of Object.entries(data.context)) out.set(keyOf('context', k), c as unknown as Content);
  return out;
}

// Puts one record into a draft of the saved data. null removes it (only days and context can be removed).
export function putRecord(draft: MyDayData, key: string, content: Content | null) {
  const { kind, id } = splitKey(key);
  if (kind === 'list') draft.lists[id as Category] = ((content && content.items) as ListItem[]) || [];
  else if (kind === 'queue') draft.queue = ((content && content.items) as QueueItem[]) || [];
  else if (kind === 'day') { if (content) draft.days[id] = content as unknown as Day; else delete draft.days[id]; }
  else if (content) draft.context[id] = content as unknown as DayContext;
  else delete draft.context[id];
}

// A record from the cloud, checked exactly the way saved data is checked when MyDay opens (normalize), so it
// can never put anything into MyDay that a backup file couldn't. null = nothing usable (or not a record we know).
export function cleanRecord(key: string, data: unknown): Content | null {
  const { kind, id } = splitKey(key);
  const d = isObj(data) ? data : {};
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
  return null;
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
  if (kind === 'list') return `${CAT_LABEL[id as Category] ?? id} list`;
  if (kind === 'queue') return 'Queue';
  if (kind === 'day') return `Plan for ${prettyDate(id)}`;
  return `Context for ${prettyDate(id)}`;
}

// Records listed in a sensible order: the lists (in their usual order), the queue, then days newest first
// (each day's plan before its context).
export function sortKeys(keys: string[]): string[] {
  const rank = (k: string) => { const { kind, id } = splitKey(k); return kind === 'list' ? CATS.indexOf(id as Category) : kind === 'queue' ? 3 : 4; };
  return [...keys].sort((a, b) => rank(a) - rank(b) || splitKey(b).id.localeCompare(splitKey(a).id) || b.localeCompare(a));
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// One line, e.g. "4 tasks", "Rest day", "3 tasks · 1 done", "Energy: Good · sleep 23:00–07:00". null = deleted.
export function recordSummary(key: string, content: Content | null): string {
  if (!content) return 'Deleted';
  const { kind } = splitKey(key);
  if (kind === 'list') return plural((content.items as ListItem[]).length, 'task');
  if (kind === 'queue') { const n = (content.items as QueueItem[]).length; return n ? `${n} waiting` : 'Nothing waiting'; }
  if (kind === 'day') {
    const d = content as unknown as Day;
    if (d.rest) return 'Rest day';
    const done = d.tasks.filter(t => t.done).length;
    return [plural(d.tasks.length, 'task'), done ? `${done} done` : '', d.checkedIn ? 'checked in' : ''].filter(Boolean).join(' · ');
  }
  const c = content as unknown as DayContext;
  const sleep = c.sleep.start && c.sleep.end ? `sleep ${c.sleep.start.slice(11)}–${c.sleep.end.slice(11)}` : c.sleep.estimatedHours ? `sleep about ${c.sleep.estimatedHours} h` : '';
  return [c.energy ? `Energy: ${ENERGY_LABEL[c.energy]}` : '', sleep].filter(Boolean).join(' · ') || 'Nothing recorded';
}

// The lines inside a record, to compare two versions side by side.
export function recordLines(key: string, content: Content | null): string[] {
  if (!content) return [];
  const { kind } = splitKey(key);
  if (kind === 'list') return (content.items as ListItem[]).map(t => `${t.title} · ${t.minutes} min`);
  if (kind === 'queue') return (content.items as QueueItem[]).map(q => `${q.title} · from ${prettyDate(q.queuedOn)}`);
  if (kind === 'day') {
    const d = content as unknown as Day;
    return [d.energy ? `Energy: ${ENERGY_LABEL[d.energy]}` : '', ...d.tasks.map(t => `${t.done ? '✓ ' : ''}${t.title}`)].filter(Boolean);
  }
  return []; // a day's context fits in its one-line summary
}

// Is this the untouched starter list, or an empty queue? (Then the cloud's version is the likely choice.)
export function isStarter(key: string, content: Content | null): boolean {
  if (!content) return true;
  const { kind, id } = splitKey(key);
  if (kind === 'list') return fingerprint(content) === fingerprint({ items: SEED[id as Category] });
  if (kind === 'queue') return (content.items as QueueItem[]).length === 0;
  return false;
}
