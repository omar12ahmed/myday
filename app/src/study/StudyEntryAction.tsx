import { Button } from '../components/Button';
import { focusOn, startRevision } from './actions';
import { optionAction } from './courseOption';
import type { StudyNow } from './todayStudy';

// The entry's button on Today: the Study card's own action (revision first, or the lesson).
export function StudyEntryAction({ now, next }: { now: StudyNow; next: boolean }) {
  const o = now.option;
  if (o.revise) return <Button inline variant={next ? 'tonal' : 'ghost'} data-action="plan-study" onClick={() => { focusOn(o); startRevision(o.revise); }}>{optionAction(o)}</Button>;
  // A link, looking like the buttons beside it (components/Button.tsx's inline tonal or ghost).
  const look = next ? 'bg-tonal text-on-tonal border-transparent font-[550]' : 'bg-transparent text-fg-2 border-outline font-[600] hover:bg-surface-2 hover:text-fg';
  return <a href={o.href} className={`inline-flex items-center justify-center gap-2 border rounded-btn min-h-11 px-4 py-2 text-[15px] no-underline ${look}`} data-action="plan-study" onClick={() => focusOn(o)}>{optionAction(o)}</a>;
}
