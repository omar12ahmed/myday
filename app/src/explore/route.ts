export function exploreRoute(hash: string): { projectId: string; example: boolean } | null {
  const m = /^#projects\/p\/([^/?#]+)\/explore(?:\?([^#]*))?$/.exec(hash);
  if (!m) return null;
  let projectId = '';
  try { projectId = decodeURIComponent(m[1]); } catch { /* Show the missing-project view, not a routing exception. */ }
  return { projectId, example: new URLSearchParams(m[2]).get('example') === 'hargeisa' };
}
export const projectHref = (id: string) => id ? `#projects/p/${encodeURIComponent(id)}` : '#projects';
export const exploreHref = (id: string) => `${projectHref(id)}/explore`;
const positions = new Map<string, number>();
export function rememberExploreEntry(id: string) { positions.set(id, window.scrollY); if (positions.size > 20) positions.delete(positions.keys().next().value!); }
export function restoreExploreEntry(id: string) {
  const y = positions.get(id);
  if (y === undefined) return;
  positions.delete(id);
  document.getElementById('projectExplore')?.focus({ preventScroll: true });
  window.scrollTo({ top: y, behavior: 'instant' });
}
