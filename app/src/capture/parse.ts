// Capture: what's in something you've just typed. Everything happens on this device — nothing is sent anywhere.
//   dates and times   chrono-node (UK date order: "4/10" is 4 October), e.g. "tomorrow at 10am", "next Tuesday 2-3pm"
//   grammar           compromise: whether it starts with a verb ("buy milk"), and people's names ("…with Jo")
//   the rest          plain rules: everyday action words, appointment words, idea phrases, and which list or note
//                     collection it might belong to.
// The result is only a suggestion: you choose what happens (see CaptureSheet.tsx). Both libraries are loaded only
// when Capture opens, so the app itself doesn't get any bigger to start.
import { keyOf, pad } from '../data/dates';
import type { Category, DateKey, NoteCategory } from '../data/types';

export type Chrono = typeof import('chrono-node');
export type Nlp = typeof import('compromise').default;
export interface CaptureLibs { chrono: Chrono; nlp: Nlp }
export async function loadLibs(): Promise<CaptureLibs> {
  const [chrono, compromise] = await Promise.all([import('chrono-node'), import('compromise')]);
  return { chrono, nlp: compromise.default };
}

export type CaptureKind = 'appointment' | 'task' | 'idea' | 'note';
export interface Capture {
  text: string;               // what you typed (trimmed)
  title: string;              // without the date and time, e.g. "Call GP"
  date: DateKey | null;       // a date it mentions
  time: string | null;        // "HH:MM", if it gives a time
  endTime: string | null;     // "HH:MM", if it gives an end ("2-3pm")
  when: string | null;        // the words that gave the date, e.g. "tomorrow at 10am"
  kind: CaptureKind;          // what it looks most like
  category: Category;         // for a task: which list it fits
  people: string[];
  collection: string | null;  // for a note: a collection it seems to fit (id), if any
}

// Everyday action words that start a task (compromise doesn't always see "call GP" as a verb).
const VERBS = new Set(('call phone ring text email message book pay buy get pick collect renew send post return fix clean tidy sort cancel check ask tell order make write ' +
  'finish start submit apply register revise study read watch learn practise practice go take bring wash change update print sign file organise organize plan prepare ' +
  'cook iron hoover vacuum empty put find look research contact chase reply respond arrange schedule visit drop sell list back').split(' '));
const TASK_LEAD = /^(i\s+)?(need to|must|have to|got to|gotta|remember to|don'?t forget to|should|todo:?|to do:?)\s+/i;
const APPOINTMENT = /\b(gp|doctor|dr|dentist|appointment|appt|meeting|interview|hospital|clinic|physio|therapy|therapist|counsell?ing|haircut|barber|class|lesson|viewing|vet|optician|nurse|consultant|call with|lunch with|dinner with|coffee with|drinks with|date|party|wedding|match|gig|concert|flight|train)\b/i;
const IDEA = /^(app |business |side[- ]hustle |project |product )?ideas?\b|\bideas?:|\bwhat if\b|\bcould build\b|\bmaybe (i|we) could\b|\bside[- ]hustle\b|\bstartup\b|\bwould be cool\b/i;
const LEARNING = /\b(study|revise|revision|course|exam|read(ing)?|learn|module|ccna|lecture|practi[sc]e|homework|assignment|tryhackme|subnet\w*)\b/i;
const HEALTH = /\b(gym|run|walk|workout|doctor|gp|dentist|physio|meds|medication|prescription|cook|meal|sleep|yoga|swim|stretch|protein|weigh)\b/i;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Words that suggest a note collection, by the collection's starting name. Collections you've named yourself are
// matched by their own name too.
const HINTS: Record<string, RegExp> = {
  'Lifestyle': /\b(home|house|flat|garden|recipe|holiday|travel|trip|routine|decor|furniture|clothes)\b/i,
  'Business ideas': /\b(business|startup|side[- ]hustle|customers?|sell|market|product|app idea|brand|idea)\b/i,
  'Health & fitness': /\b(gym|workout|run|protein|diet|sleep|doctor|gp|physio|weight|meal|steps|yoga)\b/i,
  'Money': /(£|\$|€)\s?\d|\b(money|bill|rent|save|saving|budget|bank|debt|owe|owes|loan|tax|salary|pay ?day)\b/i,
  'Study & career': /\b(study|revise|course|exam|ccna|job|cv|interview|career|module|learn|certificate|promotion)\b/i,
  'Personal': /\b(family|friend|mum|dad|brother|sister|birthday|feel|feeling|journal|grateful|memory)\b/i,
};

// chrono reads "on the 14th at 3pm" as just "at 3pm" (today). "the 14th" alone means this month — or next month if
// the 14th has passed — so it's written out in full first.
export function fullDates(text: string, now: Date): string {
  return text.replace(/\b(the\s+)?(\d{1,2})(st|nd|rd|th)\b(?!\s+(of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/gi, (m, _the, d) => {
    const day = Number(d);
    if (day < 1 || day > 31) return m;
    const month = day >= now.getDate() ? now.getMonth() : (now.getMonth() + 1) % 12;
    return `${day} ${MONTHS[month]}`;
  });
}
const tidy = (s: string) => s.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
// The title once the date's words are taken out: no dangling "at", "on", "by"…, and a capital letter.
function titleFrom(text: string): string {
  let t = tidy(text).replace(TASK_LEAD, '');
  const edge = /^(on|at|by|for|from|in|until|till|before|after|the|,|-|–|—)\s+|\s+(on|at|by|for|from|in|until|till|before|after|,|-|–|—)$|[,;:–—-]+$/i;
  for (let i = 0; i < 4; i++) t = t.replace(edge, '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

export function parseCapture(raw: string, now: Date, libs: CaptureLibs, collections: NoteCategory[] = []): Capture {
  const text = raw.trim();
  const pre = fullDates(text, now);
  const r = libs.chrono.en.GB.parse(pre, now, { forwardDate: true })[0];
  let date: DateKey | null = null, time: string | null = null, endTime: string | null = null, when: string | null = null, rest = pre;
  if (r) {
    const s = r.start.date();
    date = keyOf(s);
    if (r.start.isCertain('hour')) time = `${pad(s.getHours())}:${pad(s.getMinutes())}`;
    if (time && r.end && r.end.isCertain('hour')) { const e = r.end.date(); endTime = `${pad(e.getHours())}:${pad(e.getMinutes())}`; }
    when = r.text;
    rest = pre.slice(0, r.index) + ' ' + pre.slice(r.index + r.text.length);
  }
  const title = titleFrom(rest) || titleFrom(text) || text;
  const doc = libs.nlp(text.replace(TASK_LEAD, ''));
  const people = doc.people().out('array') as string[];
  const first = (text.replace(TASK_LEAD, '').match(/^[a-z']+/i)?.[0] || '').toLowerCase();
  const startsWithPerson = people.length > 0 && text.replace(TASK_LEAD, '').toLowerCase().startsWith(people[0].toLowerCase());
  const taskish = TASK_LEAD.test(text) || VERBS.has(first) || (!startsWithPerson && (doc.has('^#Imperative') || doc.terms().first().has('#Infinitive')));

  let kind: CaptureKind = 'note';
  if (IDEA.test(text)) kind = 'idea';
  else if (time && (APPOINTMENT.test(text) || (people.length > 0 && !startsWithPerson) || !taskish || /\bcall\b/i.test(first))) kind = 'appointment';
  else if (taskish || date) kind = 'task';

  const category: Category = LEARNING.test(text) ? 'learning' : HEALTH.test(text) ? 'health' : 'admin';
  return { text, title, date, time, endTime, when, kind, category, people, collection: suggestCollection(text, collections) };
}

// A note collection the text seems to fit (its id), or null: one whose own name appears in it, otherwise the usual
// words for the starting collections. Plain rules — no libraries needed.
export function suggestCollection(text: string, collections: NoteCategory[]): string | null {
  const lower = text.toLowerCase();
  const byName = collections.find(c => c.name.length > 2 && lower.includes(c.name.toLowerCase()));
  const byHint = collections.find(c => HINTS[c.name] && HINTS[c.name].test(text));
  return (byName || byHint)?.id ?? null;
}
