// Resources for a project (specs/projects-resources.md): web links you keep with it — a supplier's page, a guide, a
// form — each with an optional title and note. Only web addresses (http or https, with a real site name) are kept and
// opened, in a new tab. The links live on the project (`resources`). Never sent to AI.
import { isDateKey, localStamp, todayKey } from './dates';
import type { DateKey, MyDayData, ProjectResource } from './types';
import { isObj, uid } from './util';

export const RESOURCE_LIMITS = { resources: 30, title: 120, note: 300, url: 2000 };
// Tidied the same way every time (trimmed after the cut too), so saved text reads back unchanged.
const tidy = (s: string, max: number) => s.trim().slice(0, max).trimEnd();

// A web address as you typed it, made whole: "example.com/page" becomes "https://example.com/page". Only http(s) with a
// real site name and no user name or password in it; '' when it isn't one (e.g. "javascript:…", "mailto:…").
export function webAddress(raw: string): string {
  const typed = raw.trim();
  if (!typed) return '';
  const s = /^[a-z][a-z0-9+.-]*:\/\//i.test(typed) ? typed : 'https://' + typed.replace(/^\/\//, '');
  try {
    const u = new URL(s);
    const ok = (u.protocol === 'http:' || u.protocol === 'https:') && /\.[a-z0-9-]+$/i.test(u.hostname) && !u.username && !u.password;
    return ok && u.href.length <= RESOURCE_LIMITS.url ? u.href : '';
  } catch { return ''; }
}
// The site, for the small line under a link: "example-timber.co.uk" (without "www.").
export const siteOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
// What a link is called: its title, or its site when it has none.
export const resourceName = (r: Pick<ProjectResource, 'title' | 'url'>) => r.title || siteOf(r.url);

// Reading saved links: kept only when there are some. One without an id or a web address is counted, never kept
// half-read; a duplicate id is merged. Fields from a newer MyDay are kept.
export function normalizeResources(raw: unknown, report: { dropped: number }): ProjectResource[] | null {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) { report.dropped++; return null; }
  const out: ProjectResource[] = [];
  for (const r of raw) {
    const url = isObj(r) && typeof r.url === 'string' ? webAddress(r.url) : '';
    if (!isObj(r) || typeof r.id !== 'string' || !r.id || !url) { report.dropped++; continue; }
    if (out.some(x => x.id === r.id)) continue;
    const item: ProjectResource = { ...r, id: r.id, title: typeof r.title === 'string' ? tidy(r.title, RESOURCE_LIMITS.title) : '', url, addedOn: isDateKey(r.addedOn) ? r.addedOn : todayKey() };
    if (typeof r.note === 'string' && r.note.trim()) item.note = tidy(r.note, RESOURCE_LIMITS.note); else delete item.note;
    out.push(item);
  }
  return out.length ? out : null;
}

// ---------- Changing ----------
const project = (d: MyDayData, id: string) => d.projects.items.find(p => p.id === id);
export interface ResourceInput { url: string; title?: string; note?: string }
// Keep a link. Returns its id, or null when the project isn't there, the address isn't a web address, it's already
// kept in this project, or the project has 30 links.
export function addResource(d: MyDayData, projectId: string, input: ResourceInput, k: DateKey = todayKey()): string | null {
  const p = project(d, projectId), url = webAddress(input.url), list = p?.resources ?? [];
  if (!p || !url || list.length >= RESOURCE_LIMITS.resources || list.some(r => r.url === url)) return null;
  const note = tidy(input.note ?? '', RESOURCE_LIMITS.note), id = 'rs' + uid();
  p.resources = [...list, { id, title: tidy(input.title ?? '', RESOURCE_LIMITS.title), url, ...(note ? { note } : {}), addedOn: k }];
  p.updatedAt = localStamp();
  return id;
}
// Change a link's address, title or note. Returns false when nothing changed, the address isn't a web address, or
// another link in the project already has it.
export function editResource(d: MyDayData, projectId: string, id: string, input: ResourceInput): boolean {
  const p = project(d, projectId), r = p?.resources?.find(x => x.id === id), url = webAddress(input.url);
  if (!p || !r || !url || p.resources!.some(x => x.id !== id && x.url === url)) return false;
  const title = tidy(input.title ?? '', RESOURCE_LIMITS.title), note = tidy(input.note ?? '', RESOURCE_LIMITS.note);
  if (r.url === url && r.title === title && (r.note ?? '') === note) return false;
  r.url = url; r.title = title;
  if (note) r.note = note; else delete r.note;
  p.updatedAt = localStamp();
  return true;
}
export function removeResource(d: MyDayData, projectId: string, id: string): boolean {
  const p = project(d, projectId);
  if (!p?.resources?.some(r => r.id === id)) return false;
  const rest = p.resources.filter(r => r.id !== id);
  if (rest.length) p.resources = rest; else delete p.resources;
  p.updatedAt = localStamp();
  return true;
}
