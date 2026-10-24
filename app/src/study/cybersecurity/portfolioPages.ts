// The portfolio's places and its export: where an entry belongs in the course (module, then lesson or lab), and the
// zip "Export portfolio" downloads (a page with every entry, and its files). Nothing here is sent anywhere; files are
// read from this device's copy or fetched through their short-lived links.
import { AREA_RULES, cleanName } from '../../../../supabase/functions/_shared/files/rules';
import { todayKey } from '../../data/dates';
import type { PortfolioEntry } from '../../data/cybersecurity/types';
import { cachedFile, cacheFile, type Cached } from '../../data/fileCache';
import type { FileRecord, MyDayData } from '../../data/types';
import { zip, type ZipItem } from '../../data/zip';
import { linkTo, type FilesResult } from '../../sync/files';
import { activities, curriculum, lessons, modules } from './catalogue';

// Where an entry's activity sits: its lesson (practical task, mini challenge or knowledge check), or for a lab or a
// project, its module only.
function placeOf(activityId: string): { moduleId: string | null; lessonId: string | null; label: string } {
  const lesson = [...lessons.values()].find(l => [l.practical_task_id, l.knowledge_check_id, l.mini_challenge_id].includes(activityId));
  if (lesson) return { moduleId: lesson.module_id, lessonId: lesson.id, label: lesson.title };
  const lab = curriculum.labs.find(l => l.id === activityId);
  if (lab) return { moduleId: lab.module_id, lessonId: null, label: lab.name };
  const mod = curriculum.modules.find(m => m.project_ids?.includes(activityId));
  return { moduleId: mod?.id ?? null, lessonId: null, label: activities.get(activityId)?.title ?? activityId };
}
// The entries in course order: by module, then by lesson or lab, oldest first within each.
export function grouped(entries: PortfolioEntry[]) {
  const order = new Map(curriculum.modules.map((m, i) => [m.id, i]));
  const groups = new Map<string, { moduleId: string | null; places: Map<string, { label: string; lessonId: string | null; entries: PortfolioEntry[] }> }>();
  for (const e of entries) {
    const p = placeOf(e.activityId), key = p.moduleId ?? '';
    if (!groups.has(key)) groups.set(key, { moduleId: p.moduleId, places: new Map() });
    const g = groups.get(key)!, pk = p.lessonId ?? e.activityId;
    if (!g.places.has(pk)) g.places.set(pk, { label: p.label, lessonId: p.lessonId, entries: [] });
    g.places.get(pk)!.entries.push(e);
  }
  return [...groups.values()].sort((a, b) => (order.get(a.moduleId ?? '') ?? 999) - (order.get(b.moduleId ?? '') ?? 999));
}

// The type to give a portfolio file's bytes on this device: one the files function enforced for the area (PNG, JPEG,
// WebP or PDF), or plain bytes. Never the record's word alone: a synced record's type could say HTML or SVG, and a
// blob of that type would run in MyDay's own origin.
export const blobType = (type: string) => (AREA_RULES.portfolio.types.includes(type) ? type : 'application/octet-stream');
// The file's bytes: this device's copy, or fetched once through a short-lived link and kept.
export async function portfolioBytes(f: FileRecord): Promise<{ ok: true; c: Cached } | { ok: false; why: FilesResult }> {
  const kept = await cachedFile(f.id);
  if (kept) return { ok: true, c: kept };
  const r = await linkTo(f);
  if (!r.ok) return r;
  try {
    const res = await fetch(r.url);
    if (!res.ok) return { ok: false, why: res.status === 404 ? 'not-found' : 'failed' };
    const c = { type: blobType(f.type), bytes: await res.arrayBuffer() };
    void cacheFile(f.id, c);
    return { ok: true, c };
  } catch { return { ok: false, why: navigator.onLine === false ? 'offline' : 'failed' }; }
}
// ---------- Export ----------
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
type Linked = { name: string; href: string | null }; // href null: not included (it couldn't be fetched)
// A page you can open anywhere: every entry by module and lesson, with links to its files beside it in the zip. No
// scripts and nothing fetched.
export function portfolioPage(entries: PortfolioEntry[], exportedOn: string, files: Map<string, Linked[]> = new Map()): string {
  const fileList = (e: PortfolioEntry) => { const l = files.get(e.id) ?? []; return l.length ? `<ul>${l.map(f => `<li>${f.href ? `<a href="${esc(f.href.split('/').map(encodeURIComponent).join('/'))}">${esc(f.name)}</a>` : `${esc(f.name)} (not included: it couldn’t be fetched)`}</li>`).join('')}</ul>` : ''; };
  const body = grouped(entries).map(g => `<section><h2>${esc(g.moduleId ? modules.get(g.moduleId)?.name ?? g.moduleId : 'Other work')}</h2>${[...g.places.values()].map(p =>
    `<h3>${esc(p.label)}</h3>${p.entries.map(e => `<article><h4>${esc(e.title)}</h4><p class="meta">Reviewed ${esc(e.reviewedOn)} · self-study evidence</p>${e.evidence ? `<pre>${esc(e.evidence)}</pre>` : ''}${e.note ? `<p><strong>Note:</strong> ${esc(e.note)}</p>` : ''}${fileList(e)}</article>`).join('')}`).join('')}</section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"><title>Cybersecurity portfolio</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#1f2328}h1{font-size:1.6rem}h2{margin-top:2rem;border-bottom:1px solid #ccc}article{border:1px solid #ddd;border-radius:8px;padding:.75rem 1rem;margin:.75rem 0}pre{white-space:pre-wrap;word-break:break-word;background:#f6f6f4;padding:.5rem;border-radius:6px}.meta{color:#555;font-size:.9rem;margin:0}</style></head>
<body><h1>Cybersecurity portfolio</h1><p class="meta">Exported from MyDay on ${esc(exportedOn)}. Self-study evidence in my own words: a record of practice, not a credential.</p>${body}</body></html>`;
}
// The zip: the page, and each entry's files in its own folder (files/01/…). Returns how many files couldn't be fetched.
export async function exportPortfolio(data: MyDayData): Promise<{ missing: number }> {
  const entries = data.cybersecurity.portfolio ?? [], k = todayKey(), items: ZipItem[] = [], links = new Map<string, Linked[]>();
  let missing = 0;
  for (const [i, e] of entries.entries()) {
    const list: Linked[] = [];
    for (const [j, id] of (e.fileIds ?? []).entries()) {
      const f = data.files.items.find(x => x.id === id);
      if (!f || f.state !== 'kept') continue;
      const r = await portfolioBytes(f), path = `files/${String(i + 1).padStart(2, '0')}/${j + 1}-${cleanName(f.name)}`;
      if (r.ok) { items.push({ name: 'portfolio/' + path, bytes: new Uint8Array(r.c.bytes) }); list.push({ name: f.name, href: path }); }
      else { missing++; list.push({ name: f.name, href: null }); }
    }
    links.set(e.id, list);
  }
  items.unshift({ name: 'portfolio/index.html', bytes: new TextEncoder().encode(portfolioPage(entries, k, links)) });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zip(items)); a.download = `MyDay Cybersecurity portfolio ${k}.zip`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return { missing };
}
