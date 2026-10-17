import { modelProgress } from '../data/businessModel';
import { shortDate, todayKey } from '../data/dates';
import type { DateKey, Project } from '../data/types';

// Words and addresses shared by a project's Milestones, Decisions and one page (PlanViews.tsx, ModelView.tsx) and its
// page (ProjectView.tsx).

// "Aiming for Fri 31 Oct", or — once the day has passed — gently, with no pressure ("late" and "overdue" never appear).
export function aimText(aim: DateKey, k: DateKey = todayKey(), lower = false): string {
  const s = aim >= k ? `Aiming for ${shortDate(aim)}` : `Aimed for ${shortDate(aim)} — change it whenever it suits`;
  return lower ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
export const tabHref = (p: Project, tab: 'model' | 'milestones' | 'decisions') => `#projects/p/${encodeURIComponent(p.id)}/${tab}`;

// A business idea's one page in counts: "3 of 4 questions answered · 2 still to check · 1 looks true".
export function progressLine(p: Project): string {
  const g = modelProgress(p);
  const bits = [`${g.answered} of 4 questions answered`];
  if (g.open) bits.push(`${g.open} still to check`);
  if (g.looksTrue) bits.push(`${g.looksTrue} look${g.looksTrue === 1 ? 's' : ''} true`);
  if (g.doesntHold) bits.push(`${g.doesntHold} ${g.doesntHold === 1 ? 'doesn’t' : 'don’t'} hold`);
  return bits.join(' · ');
}
