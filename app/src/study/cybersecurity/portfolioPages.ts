// The portfolio's places and its export: where an entry belongs in the course (module, then lesson or lab), and the
// zip "Export portfolio" downloads (a page with every entry, and later its files). Nothing here is sent anywhere.
import { todayKey } from '../../data/dates';
import type { PortfolioEntry } from '../../data/cybersecurity/types';
import type { MyDayData } from '../../data/types';
import { zip } from '../../data/zip';
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

// ---------- Export ----------
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
// A page you can open anywhere: every entry by module and lesson, with no scripts and nothing fetched.
export function portfolioPage(entries: PortfolioEntry[], exportedOn: string): string {
  const body = grouped(entries).map(g => `<section><h2>${esc(g.moduleId ? modules.get(g.moduleId)?.name ?? g.moduleId : 'Other work')}</h2>${[...g.places.values()].map(p =>
    `<h3>${esc(p.label)}</h3>${p.entries.map(e => `<article><h4>${esc(e.title)}</h4><p class="meta">Reviewed ${esc(e.reviewedOn)} · self-study evidence</p>${e.evidence ? `<pre>${esc(e.evidence)}</pre>` : ''}${e.note ? `<p><strong>Note:</strong> ${esc(e.note)}</p>` : ''}</article>`).join('')}`).join('')}</section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"><title>Cybersecurity portfolio</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#1f2328}h1{font-size:1.6rem}h2{margin-top:2rem;border-bottom:1px solid #ccc}article{border:1px solid #ddd;border-radius:8px;padding:.75rem 1rem;margin:.75rem 0}pre{white-space:pre-wrap;word-break:break-word;background:#f6f6f4;padding:.5rem;border-radius:6px}.meta{color:#555;font-size:.9rem;margin:0}</style></head>
<body><h1>Cybersecurity portfolio</h1><p class="meta">Exported from MyDay on ${esc(exportedOn)}. Self-study evidence in my own words: a record of practice, not a credential.</p>${body}</body></html>`;
}
export function exportPortfolio(data: MyDayData) {
  const entries = data.cybersecurity.portfolio ?? [], k = todayKey();
  const blob = zip([{ name: 'portfolio/index.html', bytes: new TextEncoder().encode(portfolioPage(entries, k)) }]);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `MyDay Cybersecurity portfolio ${k}.zip`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
