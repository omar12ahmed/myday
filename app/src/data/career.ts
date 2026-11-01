// Career projects (specs/projects-career.md): the roles you're aiming for, and your applications with where each is
// at and its interviews. Each is one record in the top-level `career` section, saying which project it belongs to, so
// the project itself stays as it is. A closed application keeps why, in your words — never counted as a rejection or
// shown as a rate. An interview makes a "Prepare for … interview" task the day before; an application at Applied for
// 10 days, not yet followed up, asks "Heard back?" in Needs you (data/attention.ts). Words and counts only; never
// sent to AI.
import { isDateKey, isDateTime, localStamp, shift, shortDate, todayKey } from './dates';
import { tidyText, webAddress } from './projectResources';
import { addTask, isDone, leaveTodaysPlanIfLater, TASK_LIMITS } from './tasks';
import type { CareerApplication, CareerData, CareerInterview, CareerItem, CareerQuestion, CareerRole, CareerStage, DateKey, MyDayData, Project } from './types';
import { isObj, listOf, uid } from './util';

export const CAREER_LIMITS = {
  roles: 20, applications: 300, interviews: 10, questions: 20, portfolio: 20,
  company: 120, title: 160, contact: 200, why: 200, notes: 2000, prep: 4000, went: 2000, question: 200, url: 2000,
};
export const FOLLOW_UP_DAYS = 10;
export const emptyCareer = (): CareerData => ({ items: [] });
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const STAGES: { id: CareerStage; label: string }[] = [
  { id: 'interested', label: 'Interested' }, { id: 'applied', label: 'Applied' }, { id: 'interviewing', label: 'Interviewing' }, { id: 'offer', label: 'Offer' }, { id: 'closed', label: 'Closed' },
];
export const stageLabel = (s: string | undefined) => STAGES.find(x => x.id === s)?.label ?? 'Interested';
// Why it closed, in your words: these to tap, or your own.
export const CLOSE_REASONS = ['Not this time', 'I withdrew', 'No reply'];
export const INTERVIEW_KINDS = [{ id: 'phone', label: 'Phone' }, { id: 'video', label: 'Video' }, { id: 'in-person', label: 'In person' }, { id: 'other', label: 'Other' }] as const;
export const interviewKindLabel = (k: string | undefined) => INTERVIEW_KINDS.find(x => x.id === k)?.label ?? null;

// ---------- Reading ----------
// Reading saved items: one without an id, a project or a type is counted, never kept half-read; a later duplicate id
// is counted too. Everything else is kept as written (types, stages and fields from a newer MyDay too), so reading
// never rewrites another device's record; a missing field reads as empty where it's used.
export function normalizeCareer(raw: unknown, report: { dropped: number }): CareerData {
  if (!isObj(raw)) return emptyCareer();
  const out: CareerData = { ...raw, items: [] }, seen = new Set<string>();
  for (const x of listOf(raw.items)) {
    if (!isObj(x) || typeof x.id !== 'string' || !ID.test(x.id) || typeof x.projectId !== 'string' || !x.projectId || typeof x.type !== 'string' || !x.type) { report.dropped++; continue; }
    if (seen.has(x.id)) { report.dropped++; continue; }
    seen.add(x.id);
    const item = { ...x } as CareerItem;
    if (!isDateTime(item.createdAt)) item.createdAt = isDateTime(item.updatedAt) ? item.updatedAt : '2000-01-01T00:00'; // (the same on every device)
    if (!isDateTime(item.updatedAt)) item.updatedAt = item.createdAt;
    out.items.push(item);
  }
  return out;
}
const byMade = (a: CareerItem, b: CareerItem) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
const text = (v: unknown) => (typeof v === 'string' ? v : '');
export const isRole = (x: CareerItem): x is CareerRole => x.type === 'role';
export const isApplication = (x: CareerItem): x is CareerApplication => x.type === 'application';
const ofProject = (data: MyDayData, projectId: string) => data.career.items.filter(x => x.projectId === projectId);
// In the order you added them.
export const rolesOf = (data: MyDayData, projectId: string) => ofProject(data, projectId).filter(isRole).sort(byMade);
export const applicationsOf = (data: MyDayData, projectId: string) => ofProject(data, projectId).filter(isApplication).sort(byMade);
export const careerItem = (data: MyDayData, id: string) => data.career.items.find(x => x.id === id) ?? null;
export const stageOf = (a: CareerApplication): string => text(a.stage) || 'interested';
export const isOpen = (a: CareerApplication) => stageOf(a) !== 'closed';
export const companyOf = (a: CareerApplication) => text(a.company) || '(no company)';
export const roleTitle = (x: CareerRole) => text(x.title) || '(untitled)';
// What's shown: interviews with an id and a day (by day, then time), questions with an id and words. Changes keep
// anything else in the list as written.
export const interviewsOf = (a: CareerApplication): CareerInterview[] => listOf(a.interviews).filter((v): v is CareerInterview => isObj(v) && typeof v.id === 'string' && isDateKey(v.on))
  .sort((x, y) => x.on.localeCompare(y.on) || text(x.at).localeCompare(text(y.at)) || x.id.localeCompare(y.id));
export const questionsOf = (iv: CareerInterview): CareerQuestion[] => listOf(iv.questions).filter((q): q is CareerQuestion => isObj(q) && typeof q.id === 'string' && typeof q.text === 'string');
const savedInterviews = (a: CareerApplication) => listOf(a.interviews) as CareerInterview[];
const savedQuestions = (iv: CareerInterview) => listOf(iv.questions) as CareerQuestion[];
const isEntry = (x: unknown, id: string) => isObj(x) && x.id === id;
// The role an application is for (null when none, or it's gone).
export const roleOfApplication = (data: MyDayData, a: CareerApplication) => (a.roleId ? rolesOf(data, a.projectId).find(r => r.id === a.roleId) ?? null : null);
// The portfolio entries a role points at that are still in your portfolio.
export const portfolioOfRole = (data: MyDayData, r: CareerRole) => {
  const ids = listOf(r.portfolioIds).filter((v): v is string => typeof v === 'string');
  return (data.cybersecurity.portfolio ?? []).filter(e => ids.includes(e.id));
};
// The next interview from today on (null when none).
export const nextInterview = (a: CareerApplication, k: DateKey = todayKey()) => interviewsOf(a).find(iv => iv.on >= k) ?? null;

// ---------- In words ----------
// "applied Mon 3 Nov", "interview Tue 4 Nov at 10:00", "closed Mon 3 Nov · Not this time", "interested".
export function applicationWhen(a: CareerApplication, k: DateKey = todayKey()): string {
  const st = stageOf(a), iv = isOpen(a) ? nextInterview(a, k) : null;
  if (iv) return `interview ${shortDate(iv.on)}${iv.at ? ` at ${iv.at}` : ''}`;
  if (st === 'closed') return [a.closedOn ? `closed ${shortDate(a.closedOn)}` : 'closed', text(a.closedWhy)].filter(Boolean).join(' · ');
  if (st === 'offer') return 'an offer';
  return isDateKey(a.appliedOn) ? `applied ${shortDate(a.appliedOn)}` : st === 'interested' ? 'interested' : stageLabel(st).toLowerCase();
}
// "3 applications open · 1 interviewing" — what's open only (closed ones are never counted).
export interface CareerGlance { open: number; interviewing: number; offers: number; roles: number; next: { application: CareerApplication; interview: CareerInterview } | null }
export function careerGlance(data: MyDayData, p: Project, k: DateKey = todayKey()): CareerGlance {
  const apps = applicationsOf(data, p.id).filter(isOpen);
  const next = apps.flatMap(a => interviewsOf(a).filter(iv => iv.on >= k).map(iv => ({ application: a, interview: iv })))
    .sort((x, y) => x.interview.on.localeCompare(y.interview.on) || text(x.interview.at).localeCompare(text(y.interview.at)))[0] ?? null;
  return { open: apps.length, interviewing: apps.filter(a => stageOf(a) === 'interviewing').length, offers: apps.filter(a => stageOf(a) === 'offer').length,
    roles: rolesOf(data, p.id).filter(r => !r.aside).length, next };
}
// The follow-up nudge's rule: at Applied for 10 days or more, not yet answered (Follow up or Close it, `askedOn`, for
// good — reopening doesn't bring it back), and no interview yet.
export const needsFollowUp = (a: CareerApplication, k: DateKey = todayKey()) =>
  stageOf(a) === 'applied' && isDateKey(a.appliedOn) && a.appliedOn <= shift(k, -FOLLOW_UP_DAYS) && !a.followedOn && !a.askedOn && !interviewsOf(a).length;

// ---------- Changing them (inside update(); each returns whether anything changed, or an id) ----------
const touch = (x: CareerItem) => { x.updatedAt = localStamp(); };
const find = (d: MyDayData, id: string) => d.career.items.find(x => x.id === id);
const app = (d: MyDayData, id: string) => { const x = find(d, id); return x && isApplication(x) ? x : null; };
const projectOf = (d: MyDayData, projectId: string) => d.projects.items.find(p => p.id === projectId);
const count = (d: MyDayData, projectId: string, type: string) => d.career.items.filter(x => x.projectId === projectId && x.type === type).length;
// A text field: set, or the key removed when emptied.
function setText(x: Record<string, unknown>, key: string, value: string, max: number): boolean {
  const w = tidyText(value, max), was = text(x[key]);
  if (w === was) return false;
  if (w) x[key] = w; else delete x[key];
  return true;
}

// ---------- Roles ----------
export function addRole(d: MyDayData, projectId: string, title: string, notes = ''): string | null {
  const t = tidyText(title, CAREER_LIMITS.title);
  if (!t || !projectOf(d, projectId) || count(d, projectId, 'role') >= CAREER_LIMITS.roles) return null;
  const id = 'cr' + uid(), now = localStamp(), r: CareerRole = { id, type: 'role', projectId, title: t, createdAt: now, updatedAt: now };
  setText(r, 'notes', notes, CAREER_LIMITS.notes);
  d.career.items.push(r);
  return id;
}
export function editRole(d: MyDayData, id: string, patch: { title?: string; notes?: string; aside?: boolean }): boolean {
  const r = find(d, id);
  if (!r || !isRole(r)) return false;
  let changed = false;
  if (patch.title !== undefined) { const t = tidyText(patch.title, CAREER_LIMITS.title); if (t && t !== r.title) { r.title = t; changed = true; } }
  if (patch.notes !== undefined) changed = setText(r, 'notes', patch.notes, CAREER_LIMITS.notes) || changed;
  if (patch.aside !== undefined && patch.aside !== !!r.aside) { if (patch.aside) r.aside = true; else delete r.aside; changed = true; }
  if (changed) touch(r);
  return changed;
}
// The work that shows it: an entry of your Cybersecurity portfolio, by reference (it stays in Study), or stop.
export function togglePortfolio(d: MyDayData, roleId: string, entryId: string): boolean {
  const r = find(d, roleId);
  if (!r || !isRole(r) || !(d.cybersecurity.portfolio ?? []).some(e => e.id === entryId)) return false;
  const saved = listOf(r.portfolioIds) as string[], ids = saved.filter(v => typeof v === 'string'); // (a newer MyDay's entries kept)
  if (ids.includes(entryId)) { const rest = saved.filter(v => v !== entryId); if (rest.length) r.portfolioIds = rest; else delete r.portfolioIds; }
  else { if (ids.length >= CAREER_LIMITS.portfolio) return false; r.portfolioIds = [...saved, entryId]; }
  touch(r);
  return true;
}

// ---------- Applications ----------
export interface ApplicationInput { company: string; title?: string; roleId?: string | null; url?: string; contact?: string; notes?: string }
// It starts at Interested, or at Applied with the day (`appliedOn`). Returns its id, or null.
export function addApplication(d: MyDayData, projectId: string, input: ApplicationInput, appliedOn: DateKey | null = null): string | null {
  const c = tidyText(input.company, CAREER_LIMITS.company);
  if (!c || !projectOf(d, projectId) || count(d, projectId, 'application') >= CAREER_LIMITS.applications) return null;
  const id = 'ca' + uid(), now = localStamp(), a: CareerApplication = { id, type: 'application', projectId, company: c, stage: appliedOn && isDateKey(appliedOn) ? 'applied' : 'interested', createdAt: now, updatedAt: now };
  if (a.stage === 'applied') a.appliedOn = appliedOn!;
  setText(a, 'title', input.title ?? '', CAREER_LIMITS.title);
  setText(a, 'contact', input.contact ?? '', CAREER_LIMITS.contact);
  setText(a, 'notes', input.notes ?? '', CAREER_LIMITS.notes);
  const url = webAddress(input.url ?? '');
  if (url) a.url = url.slice(0, CAREER_LIMITS.url);
  if (input.roleId && rolesOf(d, projectId).some(r => r.id === input.roleId)) a.roleId = input.roleId;
  d.career.items.push(a);
  return id;
}
export interface ApplicationPatch { company?: string; title?: string; roleId?: string | null; url?: string; contact?: string; notes?: string; appliedOn?: DateKey }
// A link that isn't a web address refuses the whole change (false); an empty one clears it.
export function editApplication(d: MyDayData, id: string, patch: ApplicationPatch): boolean {
  const a = app(d, id);
  if (!a || (patch.url !== undefined && patch.url.trim() && !webAddress(patch.url))) return false;
  let changed = false;
  if (patch.company !== undefined) { const c = tidyText(patch.company, CAREER_LIMITS.company); if (c && c !== a.company) { a.company = c; changed = true; } }
  if (patch.title !== undefined) changed = setText(a, 'title', patch.title, CAREER_LIMITS.title) || changed;
  if (patch.contact !== undefined) changed = setText(a, 'contact', patch.contact, CAREER_LIMITS.contact) || changed;
  if (patch.notes !== undefined) changed = setText(a, 'notes', patch.notes, CAREER_LIMITS.notes) || changed;
  if (patch.url !== undefined) {
    const url = patch.url.trim() ? webAddress(patch.url) : '';
    if (url !== text(a.url)) { if (url) a.url = url.slice(0, CAREER_LIMITS.url); else delete a.url; changed = true; }
  }
  if (patch.roleId !== undefined) {
    const to = patch.roleId && rolesOf(d, a.projectId).some(r => r.id === patch.roleId) ? patch.roleId : null;
    if ((a.roleId ?? null) !== to) { if (to) a.roleId = to; else delete a.roleId; changed = true; }
  }
  if (patch.appliedOn !== undefined && isDateKey(patch.appliedOn) && patch.appliedOn !== a.appliedOn) { a.appliedOn = patch.appliedOn; changed = true; }
  if (changed) touch(a);
  return changed;
}
// Where it's at. Applied keeps the day you applied (today, if it has none); moving away from Closed clears the day
// and why. Closing goes through closeApplication (it asks why).
export function setStage(d: MyDayData, id: string, stage: CareerStage, k: DateKey = todayKey()): boolean {
  const a = app(d, id);
  if (!a || !STAGES.some(s => s.id === stage) || stage === stageOf(a)) return false;
  if (stage === 'closed') return closeApplication(d, id, '', k);
  a.stage = stage;
  if (stage === 'applied' && !isDateKey(a.appliedOn)) a.appliedOn = k;
  delete a.closedOn; delete a.closedWhy;
  touch(a);
  return true;
}
// Closed, with why in your words (absent when blank) and the day.
export function closeApplication(d: MyDayData, id: string, why: string, k: DateKey = todayKey()): boolean {
  const a = app(d, id);
  if (!a || stageOf(a) === 'closed') return false;
  if (stageOf(a) === 'applied') a.askedOn = k; // (closing answers "Heard back?" for good)
  a.stage = 'closed'; a.closedOn = k;
  const w = tidyText(why, CAREER_LIMITS.why);
  if (w) a.closedWhy = w; else delete a.closedWhy;
  touch(a);
  return true;
}
// Why it closed, changed afterwards (emptied removes it).
export function setClosedWhy(d: MyDayData, id: string, why: string): boolean {
  const a = app(d, id);
  if (!a || stageOf(a) !== 'closed' || !setText(a, 'closedWhy', why, CAREER_LIMITS.why)) return false;
  touch(a);
  return true;
}
// "Heard back?" answered with Follow up: a task "Follow up: <company>" for today, once. Returns its id, or null.
export function followUp(d: MyDayData, id: string, k: DateKey = todayKey()): string | null {
  const a = app(d, id);
  if (!a || a.followedOn) return null;
  const tid = addTask(d.tasks, { title: tidyText(`Follow up: ${companyOf(a)}`, TASK_LIMITS.title), minutes: 10, due: k });
  if (!tid) return null;
  d.tasks.items.find(t => t.id === tid)!.projectId = a.projectId;
  a.followedOn = k; a.askedOn = k; a.followTaskId = tid; touch(a);
  return tid;
}

// ---------- Interviews ----------
// The Prepare task's day: the day before; on the day itself if that's today; none for a day that's passed.
export const prepareDay = (on: DateKey, k: DateKey = todayKey()): DateKey | null => (on > k ? shift(on, -1) : on === k ? k : null);
const prepareTitle = (a: CareerApplication) => tidyText(`Prepare for ${companyOf(a)} interview`, TASK_LIMITS.title);
export interface InterviewInput { at?: string | null; kind?: string | null }
// An interview on a day (a time and kind if you like), on an application that isn't closed: makes its Prepare task and
// moves the application to Interviewing (from Interested or Applied). Returns its id, or null.
export function addInterview(d: MyDayData, id: string, on: DateKey, input: InterviewInput = {}, k: DateKey = todayKey()): string | null {
  const a = app(d, id);
  if (!a || !isDateKey(on) || !isOpen(a) || interviewsOf(a).length >= CAREER_LIMITS.interviews) return null; // (open it again first)
  const iid = 'ci' + uid(), iv: CareerInterview = { id: iid, on };
  if (input.at && TIME.test(input.at)) iv.at = input.at;
  if (input.kind && INTERVIEW_KINDS.some(x => x.id === input.kind)) iv.kind = input.kind;
  const due = prepareDay(on, k);
  if (due) {
    const tid = addTask(d.tasks, { title: prepareTitle(a), minutes: 30, due });
    if (tid) { d.tasks.items.find(t => t.id === tid)!.projectId = a.projectId; iv.taskId = tid; }
  }
  a.interviews = [...savedInterviews(a), iv];
  if (stageOf(a) === 'interested' || stageOf(a) === 'applied') a.stage = 'interviewing';
  touch(a);
  return iid;
}
export interface InterviewPatch { on?: DateKey; at?: string | null; kind?: string | null; prep?: string; went?: string }
// Changing its day moves its Prepare task (if not done), or makes one if it never had one and the day hasn't passed
// (one you deleted isn't made again).
export function editInterview(d: MyDayData, id: string, interviewId: string, patch: InterviewPatch, k: DateKey = todayKey()): boolean {
  const a = app(d, id), iv = a && interviewsOf(a).find(x => x.id === interviewId);
  if (!a || !iv) return false;
  let changed = false;
  if (patch.on !== undefined && isDateKey(patch.on) && patch.on !== iv.on) {
    iv.on = patch.on; changed = true;
    const due = prepareDay(patch.on, k), t = iv.taskId ? d.tasks.items.find(x => x.id === iv.taskId) : undefined;
    if (t && !isDone(d, t) && due) { t.due = due; leaveTodaysPlanIfLater(d, t.id, k); } // (as a task's own date change does)
    else if (!iv.taskId && due) {
      const tid = addTask(d.tasks, { title: prepareTitle(a), minutes: 30, due });
      if (tid) { d.tasks.items.find(x => x.id === tid)!.projectId = a.projectId; iv.taskId = tid; }
    }
  }
  if (patch.at !== undefined) { const to = patch.at && TIME.test(patch.at) ? patch.at : null; if ((iv.at ?? null) !== to) { if (to) iv.at = to; else delete iv.at; changed = true; } }
  if (patch.kind !== undefined) { const to = patch.kind && INTERVIEW_KINDS.some(x => x.id === patch.kind) ? patch.kind : null; if ((iv.kind ?? null) !== to) { if (to) iv.kind = to; else delete iv.kind; changed = true; } }
  if (patch.prep !== undefined) changed = setText(iv, 'prep', patch.prep, CAREER_LIMITS.prep) || changed;
  if (patch.went !== undefined) changed = setText(iv, 'went', patch.went, CAREER_LIMITS.went) || changed;
  if (changed) touch(a);
  return changed;
}
// Removing an interview leaves its task (it's yours now).
export function removeInterview(d: MyDayData, id: string, interviewId: string): boolean {
  const a = app(d, id);
  if (!a || !interviewsOf(a).some(x => x.id === interviewId)) return false;
  const rest = savedInterviews(a).filter(x => !isEntry(x, interviewId));
  if (rest.length) a.interviews = rest; else delete a.interviews;
  touch(a);
  return true;
}
// Questions to ask: a short list you tick as you ask them.
export function addQuestion(d: MyDayData, id: string, interviewId: string, words: string): string | null {
  const a = app(d, id), iv = a && interviewsOf(a).find(x => x.id === interviewId), t = tidyText(words, CAREER_LIMITS.question);
  if (!a || !iv || !t || questionsOf(iv).length >= CAREER_LIMITS.questions) return null;
  const qid = 'cq' + uid();
  iv.questions = [...savedQuestions(iv), { id: qid, text: t }]; touch(a);
  return qid;
}
export function tickQuestion(d: MyDayData, id: string, interviewId: string, questionId: string): boolean {
  const a = app(d, id), iv = a && interviewsOf(a).find(x => x.id === interviewId), q = iv && questionsOf(iv).find(x => x.id === questionId);
  if (!a || !q) return false;
  if (q.done) delete q.done; else q.done = true;
  touch(a);
  return true;
}
export function removeQuestion(d: MyDayData, id: string, interviewId: string, questionId: string): boolean {
  const a = app(d, id), iv = a && interviewsOf(a).find(x => x.id === interviewId);
  if (!a || !iv || !questionsOf(iv).some(x => x.id === questionId)) return false;
  const rest = savedQuestions(iv).filter(x => !isEntry(x, questionId));
  if (rest.length) iv.questions = rest; else delete iv.questions;
  touch(a);
  return true;
}
// An interview's Prepare task, and whether it's done (null when none, or it's gone).
export function interviewTask(data: MyDayData, iv: CareerInterview) {
  const t = iv.taskId ? data.tasks.items.find(x => x.id === iv.taskId) : undefined;
  return t ? { task: t, done: isDone(data, t) } : null;
}

// ---------- Removing ----------
// A role (applications that were for it keep everything else) or an application (its tasks stay), asked first.
export function removeItem(d: MyDayData, id: string): boolean {
  const i = d.career.items.findIndex(x => x.id === id && (isRole(x) || isApplication(x)));
  if (i < 0) return false;
  const [gone] = d.career.items.splice(i, 1);
  if (isRole(gone)) for (const a of d.career.items) if (isApplication(a) && a.projectId === gone.projectId && a.roleId === gone.id) { delete a.roleId; touch(a); }
  return true;
}
// A project deleted: its roles and applications go with it (its tasks stay, as a project's tasks do).
export function deleteProjectCareer(d: MyDayData, projectId: string): boolean {
  const before = d.career.items.length;
  d.career.items = d.career.items.filter(x => x.projectId !== projectId);
  return d.career.items.length !== before;
}
