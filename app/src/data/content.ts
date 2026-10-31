// Content projects (specs/projects-content.md): a channel's or series' ideas and videos, planned before they're posted.
// Each idea or video is one record in the top-level `content` section, saying which project it belongs to, so the
// project itself stays as it is. An idea is a video at step 'idea'; "Make this a video" moves it on to planning. The
// weight is on planning: options still open (picked when you're ready, never for you), examples to learn from, how to
// make it (outline, shots, what you need, steps that become tasks), then the script and transcript, clips, posting and
// the results you type in. Words and counts only; no scores. Never sent to AI in this release.
import { isDateKey, isDateTime, localStamp, todayKey } from './dates';
import { recordBytes } from './projectRecords';
import { tidyText, webAddress } from './projectResources';
import { filesLeaving } from './files';
import { addTask, isDone, leaveTodaysPlanIfLater, removeTask, TASK_LIMITS } from './tasks';
import type { ContentClip, ContentData, ContentExample, ContentItem, ContentLine, ContentOption, ContentPost, ContentResult, ContentStep, DateKey, MyDayData, TaskItem } from './types';
import { isObj, listOf, uid } from './util';

export const CONTENT_LIMITS = {
  items: 1000, title: 120, hook: 200, notes: 2000, script: 20000, transcript: 50000, words: 2000,
  options: 40, option: 200, note: 400, examples: 20, url: 1000, at: 20, outline: 60, shots: 60, needs: 40, steps: 40, line: 300, where: 120,
  clips: 40, label: 160, posts: 10, results: 30, number: 1e12,
};
// A record must stay under the database's 512 KB (sync_records); the app checks before sending, with room to spare.
export const CONTENT_RECORD_BYTES = 480 * 1024;
export const emptyContent = (): ContentData => ({ items: [] });
const ID = /^[A-Za-z0-9_-]{1,64}$/;

export const STEPS: { id: ContentStep; label: string }[] = [
  { id: 'idea', label: 'Idea' }, { id: 'planning', label: 'Planning' }, { id: 'filming', label: 'Filming' }, { id: 'editing', label: 'Editing' }, { id: 'posted', label: 'Posted' },
];
export const stepLabel = (s: string | undefined) => STEPS.find(x => x.id === s)?.label ?? 'Planning';
export const OPTION_KINDS: { id: string; label: string; one: string }[] = [
  { id: 'title', label: 'Titles', one: 'title' }, { id: 'hook', label: 'Hooks', one: 'hook' }, { id: 'angle', label: 'Angles', one: 'angle' }, { id: 'thumbnail', label: 'Thumbnail ideas', one: 'thumbnail idea' },
];
export const PLATFORMS: { id: string; label: string }[] = [
  { id: 'youtube', label: 'YouTube' }, { id: 'shorts', label: 'YouTube Shorts' }, { id: 'tiktok', label: 'TikTok' }, { id: 'instagram', label: 'Instagram' }, { id: 'other', label: 'Other' },
];
export const platformLabel = (p: string) => PLATFORMS.find(x => x.id === p)?.label ?? p;
export const RESULT_FIELDS = ['views', 'likes', 'comments', 'shares', 'followers'] as const;
export type ResultField = typeof RESULT_FIELDS[number];
export const RESULT_LABEL: Record<ResultField, string> = { views: 'Views', likes: 'Likes', comments: 'Comments', shares: 'Shares', followers: 'Followers gained' };

// ---------- Reading ----------
// Reading saved content: an item without an id, a project or a type is counted, never kept half-read; a later
// duplicate id is counted too. Everything else is kept as written (fields, types, steps and kinds from a newer MyDay
// too), so reading never rewrites another device's record; a missing field reads as empty where it's used.
export function normalizeContent(raw: unknown, report: { dropped: number }): ContentData {
  if (!isObj(raw)) return emptyContent();
  const out: ContentData = { ...raw, items: [] }, seen = new Set<string>();
  for (const x of listOf(raw.items)) {
    if (!isObj(x) || typeof x.id !== 'string' || !ID.test(x.id) || typeof x.projectId !== 'string' || !x.projectId || typeof x.type !== 'string' || !x.type) { report.dropped++; continue; }
    if (seen.has(x.id)) { report.dropped++; continue; }
    seen.add(x.id);
    const item = { ...x } as ContentItem;
    if (!isDateTime(item.createdAt)) item.createdAt = isDateTime(item.updatedAt) ? item.updatedAt : '2000-01-01T00:00'; // (the same on every device)
    if (!isDateTime(item.updatedAt)) item.updatedAt = item.createdAt;
    out.items.push(item);
  }
  return out;
}
// What a video holds, every part there (a missing one empty): for showing it.
const objs = <T>(v: unknown): T[] => listOf(v).filter((x): x is T => isObj(x) && typeof x.id === 'string');
const text = (v: unknown) => (typeof v === 'string' ? v : '');
export interface Video {
  item: ContentItem; id: string; projectId: string; step: string; title: string; hook: string; notes: string;
  options: ContentOption[]; examples: ContentExample[]; outline: ContentLine[]; shots: ContentLine[]; needs: ContentLine[]; steps: ContentLine[];
  script: string; transcript: string; clips: ContentClip[]; fileIds: string[]; postOn: DateKey | null; postTaskId: string | null;
  posts: ContentPost[]; results: ContentResult[]; worked: string; didnt: string;
}
export function videoOf(v: ContentItem): Video {
  return { item: v, id: v.id, projectId: v.projectId, step: typeof v.step === 'string' && v.step ? v.step : 'planning', title: text(v.title), hook: text(v.hook), notes: text(v.notes),
    options: objs(v.options), examples: objs(v.examples), outline: objs(v.outline), shots: objs(v.shots), needs: objs(v.needs), steps: objs(v.steps),
    script: text(v.script), transcript: text(v.transcript), clips: objs(v.clips), fileIds: listOf(v.fileIds).filter((x): x is string => typeof x === 'string'),
    postOn: isDateKey(v.postOn) ? v.postOn : null, postTaskId: typeof v.postTaskId === 'string' && v.postTaskId ? v.postTaskId : null,
    posts: objs(v.posts), results: objs(v.results), worked: text(v.worked), didnt: text(v.didnt) };
}

// ---------- Looking at them ----------
const isVideo = (x: ContentItem) => x.type === 'video';
export const videoById = (data: MyDayData, id: string) => data.content.items.find(x => x.id === id && isVideo(x)) ?? null;
// Its post task, while it's there.
export const postTask = (data: MyDayData, v: ContentItem): TaskItem | null => (typeof v.postTaskId === 'string' ? data.tasks.items.find(t => t.id === v.postTaskId) ?? null : null);
// Posted: its step says so, or its post task is done (ticking "Post: …" shows it as posted).
export function isPosted(data: MyDayData, v: ContentItem): boolean {
  const t = postTask(data, v);
  return v.step === 'posted' || (!!t && isDone(data, t));
}
// The step it shows at.
export const stepOf = (data: MyDayData, v: ContentItem) => (isPosted(data, v) ? 'posted' : videoOf(v).step);
// A project's ideas (newest first) and videos (by step, then most recently changed first).
export function contentOf(data: MyDayData, projectId: string) {
  const all = data.content.items.filter(x => x.projectId === projectId && isVideo(x));
  const order = (s: string) => { const i = STEPS.findIndex(x => x.id === s); return i < 0 ? 1 : i; };
  return {
    ideas: all.filter(x => x.step === 'idea').sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)),
    videos: all.filter(x => x.step !== 'idea').sort((a, b) => order(stepOf(data, a)) - order(stepOf(data, b)) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id)),
  };
}
// How many at each step (ideas included), for the Overview's card.
export function stepCounts(data: MyDayData, projectId: string): Record<ContentStep, number> {
  const out: Record<ContentStep, number> = { idea: 0, planning: 0, filming: 0, editing: 0, posted: 0 };
  for (const x of data.content.items) if (x.projectId === projectId && isVideo(x)) { const s = stepOf(data, x) as ContentStep; if (s in out) out[s]++; }
  return out;
}
// The next planned post day still to come (with its video), for the card.
export function nextPost(data: MyDayData, projectId: string, k: DateKey = todayKey()): { day: DateKey; video: ContentItem } | null {
  const ahead = data.content.items.filter(x => x.projectId === projectId && isVideo(x) && isDateKey(x.postOn) && x.postOn >= k && !isPosted(data, x)).sort((a, b) => a.postOn!.localeCompare(b.postOn!));
  return ahead.length ? { day: ahead[0].postOn!, video: ahead[0] } : null;
}
// What's still open, in words: "3 title ideas, none chosen".
export function stillOpen(v: ContentItem): string[] {
  const out: string[] = [];
  for (const k of OPTION_KINDS) {
    const of = videoOf(v).options.filter(o => o.kind === k.id);
    if (of.length > 1 && !of.some(o => o.chosen)) out.push(`${of.length} ${k.one}s, none chosen`);
  }
  return out;
}
// A record too big for the database: the app says so instead of sending it.
export const tooBig = (v: ContentItem) => recordBytes(v) > CONTENT_RECORD_BYTES;

// ---------- Changing them (inside update(); each returns whether anything changed) ----------
const touch = (v: ContentItem) => { v.updatedAt = localStamp(); };
const find = (d: MyDayData, id: string) => d.content.items.find(x => x.id === id && isVideo(x));
// A rough idea: a title and a line. Returns its id, or null.
export function addIdea(d: MyDayData, projectId: string, title: string, notes = ''): string | null {
  const t = tidyText(title, CONTENT_LIMITS.title);
  if (!t || !d.projects.items.some(p => p.id === projectId) || d.content.items.length >= CONTENT_LIMITS.items) return null;
  const id = 'cv' + uid(), now = localStamp();
  d.content.items.push({ id, type: 'video', projectId, step: 'idea', title: t, notes: tidyText(notes, CONTENT_LIMITS.notes), createdAt: now, updatedAt: now });
  return id;
}
// A video straight away (Planning). Returns its id, or null.
export function addVideo(d: MyDayData, projectId: string, title: string): string | null {
  const id = addIdea(d, projectId, title);
  if (id) find(d, id)!.step = 'planning';
  return id;
}
// Its step: one of the five (a step from a newer MyDay isn't set here). Moving a video its done post task shows as
// Posted back to an earlier step lets go of that task (and its day): it's being worked on again.
export function setStep(d: MyDayData, id: string, step: ContentStep): boolean {
  const v = find(d, id);
  if (!v || !STEPS.some(s => s.id === step) || (v.step === step && stepOf(d, v) === step)) return false;
  const t = postTask(d, v);
  if (step !== 'posted' && t && isDone(d, t)) { delete v.postTaskId; delete v.postOn; }
  v.step = step; touch(v);
  return true;
}
// "Make this a video": an idea moves on to planning.
export const makeVideo = (d: MyDayData, id: string) => (find(d, id)?.step === 'idea' ? setStep(d, id, 'planning') : false);
const WORDS: Record<'title' | 'hook' | 'notes' | 'script' | 'transcript' | 'worked' | 'didnt', number> = {
  title: CONTENT_LIMITS.title, hook: CONTENT_LIMITS.hook, notes: CONTENT_LIMITS.notes, script: CONTENT_LIMITS.script, transcript: CONTENT_LIMITS.transcript, worked: CONTENT_LIMITS.words, didnt: CONTENT_LIMITS.words,
};
// Its words: a title can't be emptied; the rest can.
export function editVideo(d: MyDayData, id: string, patch: Partial<Record<keyof typeof WORDS, string>>): boolean {
  const v = find(d, id);
  if (!v) return false;
  let changed = false;
  for (const key of Object.keys(patch) as (keyof typeof WORDS)[]) {
    const raw = patch[key];
    if (raw === undefined || !(key in WORDS)) continue;
    const val = key === 'script' || key === 'transcript' ? Array.from(raw).slice(0, WORDS[key]).join('') : tidyText(raw, WORDS[key]); // (by character: never half an emoji)
    if (key === 'title' && !val) continue;
    if ((v[key] ?? '') === val) continue;
    if (val) v[key] = val; else delete v[key];
    if (key === 'title') renamePostTask(d, v, val);
    changed = true;
  }
  if (changed) touch(v);
  return changed;
}
// Its "Post: …" task follows a new title while it's still to do.
function renamePostTask(d: MyDayData, v: ContentItem, title: string) {
  const t = postTask(d, v);
  if (t && !isDone(d, t)) t.title = tidyText(`Post: ${title}`, TASK_LIMITS.title);
}
// Deleting one: its files that nothing else lists go to Recently deleted (the caller does that first, by its place).
export function deleteVideo(d: MyDayData, id: string): boolean {
  const i = d.content.items.findIndex(x => x.id === id);
  if (i < 0) return false;
  d.content.items.splice(i, 1);
  return true;
}
// When a project is deleted (here, or on another device), its ideas and videos go with it, and their uploads that
// nothing else lists go to Recently deleted.
export function deleteProjectContent(d: MyDayData, projectId: string): boolean {
  for (const v of d.content.items) if (v.projectId === projectId) filesLeaving(d, { kind: 'video', id: v.id });
  const before = d.content.items.length;
  d.content.items = d.content.items.filter(x => x.projectId !== projectId);
  return d.content.items.length !== before;
}

// ---------- Options still open ----------
export function addOption(d: MyDayData, id: string, kind: string, words: string, note = ''): string | null {
  const v = find(d, id), t = tidyText(words, CONTENT_LIMITS.option);
  if (!v || !t || !OPTION_KINDS.some(k => k.id === kind) || videoOf(v).options.length >= CONTENT_LIMITS.options) return null;
  const oid = 'co' + uid();
  v.options = [...videoOf(v).options, { id: oid, kind, text: t, ...(note.trim() ? { note: tidyText(note, CONTENT_LIMITS.note) } : {}) }];
  touch(v);
  return oid;
}
export function editOption(d: MyDayData, id: string, optionId: string, patch: { text?: string; note?: string }): boolean {
  const v = find(d, id), o = v && videoOf(v).options.find(x => x.id === optionId);
  if (!v || !o) return false;
  let changed = false;
  if (patch.text !== undefined) { const t = tidyText(patch.text, CONTENT_LIMITS.option); if (t && t !== o.text) { o.text = t; changed = true; } }
  if (patch.note !== undefined) { const n = tidyText(patch.note, CONTENT_LIMITS.note); if (n !== (o.note ?? '')) { if (n) o.note = n; else delete o.note; changed = true; } }
  if (changed) { if (o.chosen && (o.kind === 'title' || o.kind === 'hook')) setFrom(d, v, o); touch(v); }
  return changed;
}
// "Choose this": the one chosen for its kind; the others stay, not chosen. A title or hook then reads from it.
// Choosing the chosen one again un-chooses it (the title stays as it was).
export function chooseOption(d: MyDayData, id: string, optionId: string): boolean {
  const v = find(d, id), o = v && videoOf(v).options.find(x => x.id === optionId);
  if (!v || !o) return false;
  const on = !o.chosen;
  for (const x of videoOf(v).options) if (x.kind === o.kind) { if (x.id === o.id && on) x.chosen = true; else delete x.chosen; }
  if (on && (o.kind === 'title' || o.kind === 'hook')) setFrom(d, v, o);
  touch(v);
  return true;
}
// A chosen title or hook becomes the video's (within its own limit; a title renames its post task).
function setFrom(d: MyDayData, v: ContentItem, o: ContentOption) {
  if (o.kind === 'title') { v.title = tidyText(o.text, CONTENT_LIMITS.title); renamePostTask(d, v, v.title); }
  else v.hook = tidyText(o.text, CONTENT_LIMITS.hook);
}
export function removeOption(d: MyDayData, id: string, optionId: string): boolean {
  const v = find(d, id), list = v ? videoOf(v).options : [];
  if (!v || !list.some(x => x.id === optionId)) return false;
  v.options = list.filter(x => x.id !== optionId); touch(v);
  return true;
}

// ---------- Examples to learn from ----------
export function addExample(d: MyDayData, id: string, url: string, note = '', at = '', title = ''): string | null {
  const v = find(d, id), u = webAddress(url);
  if (!v || !u || u.length > CONTENT_LIMITS.url || videoOf(v).examples.length >= CONTENT_LIMITS.examples) return null;
  const eid = 'ce' + uid(), e: ContentExample = { id: eid, url: u };
  if (title.trim()) e.title = tidyText(title, CONTENT_LIMITS.label);
  if (note.trim()) e.note = tidyText(note, CONTENT_LIMITS.note);
  if (at.trim()) e.at = tidyText(at, CONTENT_LIMITS.at);
  v.examples = [...videoOf(v).examples, e]; touch(v);
  return eid;
}
export function removeExample(d: MyDayData, id: string, exampleId: string): boolean {
  const v = find(d, id), list = v ? videoOf(v).examples : [];
  if (!v || !list.some(x => x.id === exampleId)) return false;
  v.examples = list.filter(x => x.id !== exampleId); touch(v);
  return true;
}

// ---------- How to make it: outline, shots, what you need, steps ----------
export type LineList = 'outline' | 'shots' | 'needs' | 'steps';
const LINE_MAX: Record<LineList, number> = { outline: CONTENT_LIMITS.outline, shots: CONTENT_LIMITS.shots, needs: CONTENT_LIMITS.needs, steps: CONTENT_LIMITS.steps };
const PREFIX: Record<LineList, string> = { outline: 'cb', shots: 'cs', needs: 'cn', steps: 'cp' };
export function addLine(d: MyDayData, id: string, list: LineList, words: string, extra: { where?: string; gear?: string } = {}): string | null {
  const v = find(d, id), t = tidyText(words, CONTENT_LIMITS.line), lines = v ? videoOf(v)[list] : [];
  if (!v || !t || lines.length >= LINE_MAX[list]) return null;
  const lid = PREFIX[list] + uid(), line: ContentLine = { id: lid, text: t };
  if (list === 'shots') { if (extra.where?.trim()) line.where = tidyText(extra.where, CONTENT_LIMITS.where); if (extra.gear?.trim()) line.gear = tidyText(extra.gear, CONTENT_LIMITS.where); }
  v[list] = [...lines, line]; touch(v);
  return lid;
}
export function editLine(d: MyDayData, id: string, list: LineList, lineId: string, patch: { text?: string; where?: string; gear?: string }): boolean {
  const v = find(d, id), l = v && videoOf(v)[list].find(x => x.id === lineId);
  if (!v || !l) return false;
  let changed = false;
  if (patch.text !== undefined) { const t = tidyText(patch.text, CONTENT_LIMITS.line); if (t && t !== l.text) { l.text = t; changed = true; } }
  for (const key of ['where', 'gear'] as const) {
    if (patch[key] === undefined || list !== 'shots') continue;
    const t = tidyText(patch[key]!, CONTENT_LIMITS.where);
    if (t !== (l[key] ?? '')) { if (t) l[key] = t; else delete l[key]; changed = true; }
  }
  if (changed) touch(v);
  return changed;
}
// Ticked (a shot filmed, something you have, a step done).
export function tickLine(d: MyDayData, id: string, list: LineList, lineId: string): boolean {
  const v = find(d, id), l = v && videoOf(v)[list].find(x => x.id === lineId);
  if (!v || !l) return false;
  if (l.done) delete l.done; else l.done = true;
  touch(v);
  return true;
}
export function moveLine(d: MyDayData, id: string, list: LineList, lineId: string, by: -1 | 1): boolean {
  const v = find(d, id), lines = v ? videoOf(v)[list] : [], i = lines.findIndex(x => x.id === lineId), j = i + by;
  if (!v || i < 0 || j < 0 || j >= lines.length) return false;
  const next = [...lines];
  [next[i], next[j]] = [next[j], next[i]];
  v[list] = next; touch(v);
  return true;
}
export function removeLine(d: MyDayData, id: string, list: LineList, lineId: string): boolean {
  const v = find(d, id), lines = v ? videoOf(v)[list] : [];
  if (!v || !lines.some(x => x.id === lineId)) return false;
  v[list] = lines.filter(x => x.id !== lineId); touch(v);
  return true;
}
// A shot or step as a task in this project, on a day if you like ("Film: market shots"). Once per line, while that
// task is still there. Returns the task's id, 'already', or null.
export function lineTask(d: MyDayData, id: string, list: 'shots' | 'steps', lineId: string, due: DateKey | null = null): string | 'already' | null {
  const v = find(d, id), l = v && videoOf(v)[list].find(x => x.id === lineId);
  if (!v || !l) return null;
  if (l.taskId && d.tasks.items.some(t => t.id === l.taskId)) return 'already';
  const tid = addTask(d.tasks, { title: list === 'shots' ? `Film: ${l.text}` : l.text, due: due && isDateKey(due) ? due : null });
  if (!tid) return null;
  d.tasks.items.find(t => t.id === tid)!.projectId = v.projectId;
  l.taskId = tid; touch(v);
  return tid;
}

// ---------- Clips (links; uploads are its files) ----------
export function addClip(d: MyDayData, id: string, url: string, label = '', from = '', to = '', note = ''): string | null {
  const v = find(d, id), u = webAddress(url);
  if (!v || !u || u.length > CONTENT_LIMITS.url || videoOf(v).clips.length >= CONTENT_LIMITS.clips) return null;
  const cid = 'cc' + uid(), c: ContentClip = { id: cid, kind: 'link', url: u };
  if (label.trim()) c.label = tidyText(label, CONTENT_LIMITS.label);
  if (from.trim()) c.from = tidyText(from, CONTENT_LIMITS.at);
  if (to.trim()) c.to = tidyText(to, CONTENT_LIMITS.at);
  if (note.trim()) c.note = tidyText(note, CONTENT_LIMITS.note);
  v.clips = [...videoOf(v).clips, c]; touch(v);
  return cid;
}
export function removeClip(d: MyDayData, id: string, clipId: string): boolean {
  const v = find(d, id), list = v ? videoOf(v).clips : [];
  if (!v || !list.some(x => x.id === clipId)) return false;
  v.clips = list.filter(x => x.id !== clipId); touch(v);
  return true;
}

// ---------- Posting ----------
// The planned post day: "Post: <title>" (10 min) on that day in the project, or the day moved; none takes it away
// (unless it's done). Returns whether anything changed.
export function setPostDay(d: MyDayData, id: string, day: DateKey | null): boolean {
  const v = find(d, id);
  if (!v) return false;
  const on = day && isDateKey(day) ? day : null, t = postTask(d, v);
  if ((v.postOn ?? null) === on && (!on || t)) return false;
  if (!on) {
    delete v.postOn;
    if (t && !isDone(d, t)) { removeTask(d.tasks, t.id); delete v.postTaskId; } else if (!t) delete v.postTaskId;
  } else {
    v.postOn = on;
    if (t && !isDone(d, t)) { t.due = on; leaveTodaysPlanIfLater(d, t.id); } // (as a task's own date change does)
    else if (!t) {
      const tid = addTask(d.tasks, { title: tidyText(`Post: ${v.title || 'video'}`, TASK_LIMITS.title), minutes: 10, due: on });
      if (tid) { d.tasks.items.find(x => x.id === tid)!.projectId = v.projectId; v.postTaskId = tid; }
    }
  }
  touch(v);
  return true;
}
// Where it went up: a platform, its link and the day.
export function addPost(d: MyDayData, id: string, platform: string, url: string, on: DateKey | null): string | null {
  const v = find(d, id), u = url.trim() ? webAddress(url) : '';
  if (!v || !PLATFORMS.some(p => p.id === platform) || (url.trim() && !u) || u.length > CONTENT_LIMITS.url || videoOf(v).posts.length >= CONTENT_LIMITS.posts) return null;
  const pid = 'cq' + uid(), p: ContentPost = { id: pid, platform };
  if (u) p.url = u;
  if (on && isDateKey(on)) p.on = on;
  v.posts = [...videoOf(v).posts, p]; touch(v);
  return pid;
}
export function removePost(d: MyDayData, id: string, postId: string): boolean {
  const v = find(d, id), list = v ? videoOf(v).posts : [];
  if (!v || !list.some(x => x.id === postId)) return false;
  v.posts = list.filter(x => x.id !== postId); touch(v);
  return true;
}
// Results, typed in: for a platform and a day, any of views, likes, comments, shares and followers gained (whole
// numbers, none below 0). At least one number.
export function addResult(d: MyDayData, id: string, platform: string, on: DateKey | null, nums: Partial<Record<ResultField, number | null>>): string | null {
  const v = find(d, id);
  if (!v || !PLATFORMS.some(p => p.id === platform) || videoOf(v).results.length >= CONTENT_LIMITS.results) return null;
  const r: ContentResult = { id: 'cr' + uid(), platform };
  if (on && isDateKey(on)) r.on = on;
  let any = false;
  for (const f of RESULT_FIELDS) { const n = nums[f]; if (typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= CONTENT_LIMITS.number) { r[f] = Math.round(n); any = true; } }
  if (!any) return null;
  v.results = [...videoOf(v).results, r]; touch(v);
  return r.id;
}
export function removeResult(d: MyDayData, id: string, resultId: string): boolean {
  const v = find(d, id), list = v ? videoOf(v).results : [];
  if (!v || !list.some(x => x.id === resultId)) return false;
  v.results = list.filter(x => x.id !== resultId); touch(v);
  return true;
}
// "1,240 views · 85 likes · 12 followers gained"
export const resultWords = (r: ContentResult) => RESULT_FIELDS.filter(f => typeof r[f] === 'number').map(f => `${(r[f] as number).toLocaleString('en-GB')} ${f === 'followers' ? 'followers gained' : f}`).join(' · ');
