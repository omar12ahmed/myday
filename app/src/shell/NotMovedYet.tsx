import { ExternalLink } from 'lucide-react';
import { Card } from '../components/Card';
import { CURRENT_MYDAY_URL } from '../links';
import { SECTIONS, type SectionId } from './sections';

export type NotMovedId = Exclude<SectionId, 'today' | 'calendar' | 'pay'>;
const WHAT: Record<NotMovedId, string> = {
  health: 'workouts, recipes, cooking history and shopping list',
  study: 'roadmap, study sessions, concepts and revision',
};

// A section that hasn't moved to the new app yet. It says so plainly rather than showing an empty screen.
export function NotMovedYet({ section }: { section: NotMovedId }) {
  const label = SECTIONS.find(s => s.id === section)!.label;
  return (
    <Card aria-labelledby="not-moved-h">
      <h2 id="not-moved-h">{label} hasn't moved to the new MyDay yet</h2>
      <p className="text-[15px] text-fg-2">
        Your {WHAT[section]} are saved and kept exactly as they are — the new app never changes them. For now, use {label} in the current MyDay.
      </p>
      {CURRENT_MYDAY_URL
        ? <a className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-btn bg-tonal text-on-tonal font-[550] text-[15px]" href={`${CURRENT_MYDAY_URL}#${section}`}>
            <ExternalLink size={18} aria-hidden="true" /> Open {label} in the current MyDay
          </a>
        : <p className="text-[15px] text-fg-2 m-0">(The development server doesn't include the current MyDay. Open it with Live Server instead.)</p>}
    </Card>
  );
}
