import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { limitFor } from '../data/plan';
import type { Day } from '../data/types';

// The gentle nudge after a few days without learning: shrink today's learning to 15 minutes.
// If today's plan has no learning task, it offers to swap one in (or add one, if there's room).
export function NudgeCard({ day, choosing, onShrink, onSwap, onAdd, onDismiss }: {
  day: Day | undefined; choosing: boolean;
  onShrink: () => void; onSwap: (uid: string) => void; onAdd: () => void; onDismiss: () => void;
}) {
  if (!choosing) {
    return (
      <Card tone="nudge" id="nudge">
        <p>No learning in a few days — want to shrink today's task to just 15 minutes?</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="primary" data-action="shrink" onClick={onShrink}>Yes, shrink it</Button>
          <Button variant="ghost" data-action="dismiss-nudge" onClick={onDismiss}>Not today</Button>
        </div>
      </Card>
    );
  }
  const open = day ? day.tasks.filter(t => !t.done) : [];
  const room = !!day && day.tasks.length < limitFor(day.energy);
  return (
    <Card tone="nudge" id="nudge">
      <p>Today's plan doesn't have a learning task. Want to swap one optional task for a 15-minute learning session?</p>
      {!open.length && !room && <p className="text-[15px]">Everything on today's plan is already done — learning can happily wait for another day.</p>}
      <div className="grid gap-2.5">
        {open.map(t => <Button key={t.uid} data-action="swap-learning" data-uid={t.uid} onClick={() => onSwap(t.uid)}>Swap out “{t.title}”</Button>)}
        {room && <Button data-action="add-learning" onClick={onAdd}>Add it — there's room in today's plan</Button>}
        <Button variant="ghost" data-action="dismiss-nudge" onClick={onDismiss}>Never mind</Button>
      </div>
      {open.some(t => t.fromQueue) && <p className="text-[15px] mt-2.5 mb-0">Anything that was carried over goes back to your queue.</p>}
    </Card>
  );
}
