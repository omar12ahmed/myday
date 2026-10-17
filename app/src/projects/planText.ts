import { shortDate, todayKey } from '../data/dates';
import type { DateKey, Project } from '../data/types';

// Words and addresses shared by a project's Milestones and Decisions (PlanViews.tsx) and its page (ProjectView.tsx).

// "Aiming for Fri 31 Oct", or — once the day has passed — gently, with no pressure ("late" and "overdue" never appear).
export function aimText(aim: DateKey, k: DateKey = todayKey(), lower = false): string {
  const s = aim >= k ? `Aiming for ${shortDate(aim)}` : `Aimed for ${shortDate(aim)} — change it whenever it suits`;
  return lower ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
export const tabHref = (p: Project, tab: 'milestones' | 'decisions') => `#projects/p/${encodeURIComponent(p.id)}/${tab}`;
