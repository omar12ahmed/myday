import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LinkButton } from '../components/parts';
import { shortDate } from '../data/dates';
import { STUCK_MOVES } from '../data/tasks';
import type { TaskItem } from '../data/types';
import { openHelpMeStart } from '../tasks/helpPending';

// A start offer at the top of Today (specs/help-me-start.md §5; the owner's choices of 1 Nov 2026): one task that keeps
// moving, and an easier way in — Help me start on its page. It's Today's one unprompted offer when it shows
// (data/offers.ts): "Not now" means nothing more today or tomorrow; "Don't suggest this again" switches start offers off
// (back on in What MyDay has noticed). It says why, and never that you've failed.
export function StartOfferCard({ t, onNotNow, onNever }: { t: TaskItem; onNotNow: () => void; onNever: () => void }) {
  const why = t.postponed >= STUCK_MOVES ? `You’ve moved “${t.title}” ${t.postponed === 2 ? 'twice' : `${t.postponed} times`}.`
    : t.due ? `“${t.title}” was planned for ${shortDate(t.due)}.` : `“${t.title}” has been waiting a while.`;
  return (
    <Card tone="nudge" id="startOffer" aria-labelledby="startOffer-h">
      <p id="startOffer-h" className="m-0 break-words" data-s="start-offer">{why} Want an easier way in?</p>
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <Button variant="primary" data-action="offer-help-start" onClick={() => openHelpMeStart(t.id)}>Help me start</Button>
        <Button variant="ghost" data-action="offer-not-now" onClick={onNotNow}>Not now</Button>
      </div>
      <LinkButton className="mt-1" data-action="offer-never" onClick={onNever}>Don’t suggest this again</LinkButton>
    </Card>
  );
}
