import { CalendarDays } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { shortDate } from '../data/dates';
import { update } from '../data/storage';
import { addToTodaysPlan, dueForToday, isStuck, planRoom, setTaskDone } from '../data/tasks';
import { toast } from '../data/toast';
import type { DateKey, MyDayData } from '../data/types';

// Tasks due today (or still to do from before), from Tasks: tick one off, or add it to today's plan in one
// tap while there's room for your energy. Nothing is added by itself.
export function DueTodayCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const due = dueForToday(data, k);
  if (!due.length) return null;
  const room = planRoom(data, k);
  function plan(id: string) {
    let r = '';
    update(d => { r = addToTodaysPlan(d, id, k); if (r !== 'added') return false; });
    toast(r === 'added' ? "Added to today's plan." : r === 'full' ? "Today's plan is full for your energy." : 'Build your day first.');
  }
  return (
    <Card aria-labelledby="due-h" id="dueToday">
      <h3 id="due-h" className="flex items-center gap-2"><CalendarDays size={18} aria-hidden="true" className="text-primary" /> Due today <span className="text-fg-3 font-normal tabular-nums">{due.length}</span></h3>
      <ul className="list-none p-0 m-0">
        {due.map(t => (
          <li key={t.id} className="due-li flex items-center gap-1 border-t border-outline first:border-t-0 py-2" data-id={t.id}>
            <label className="tick flex-none grid place-items-center size-11 -ml-2.5 cursor-pointer">
              <input type="checkbox" className="size-[22px] accent-done m-0 cursor-pointer" data-s="due-done" data-id={t.id} checked={false} aria-label={`Done: ${t.title}`}
                onChange={() => { if (update(d => (setTaskDone(d, t.id, true) ? undefined : false))) toast('Done — nice.'); }} />
            </label>
            <a href={`#today/tasks/${t.id}`} className="flex-1 min-w-0 min-h-11 py-1 text-fg no-underline">
              <span className="block font-medium leading-snug break-words">{t.title}</span>
              <span className="flex flex-wrap items-center gap-2 mt-0.5 text-sm text-fg-3 tabular-nums">
                {t.due! < k ? <span>from {shortDate(t.due!)}</span> : t.time ? <span>{t.time}</span> : null}
                <span>{t.minutes} min</span><CategoryChip kind={t.category} />
                {isStuck(data, t, k) && <span className="text-primary font-semibold" data-s="stuck">Something in the way?</span>}
              </span>
            </a>
            {room.built && room.room > 0 && <Button inline data-action="due-plan" data-id={t.id} onClick={() => plan(t.id)}>Add to plan</Button>}
          </li>
        ))}
      </ul>
      <p className="text-sm text-fg-2 m-0 mt-2" data-s="due-note">
        {!room.built ? 'Build your day, then add any of these to it.'
          : room.rest ? "It's a rest day — these can wait. Open a task to give it another day."
          : room.room <= 0 ? `Today's plan is full for your energy (${room.limit} task${room.limit === 1 ? '' : 's'}). Open a task to move it to another day.`
          : `Room for ${room.room} more on today's plan.`}{' '}<a href="#today/tasks" className="text-primary font-semibold">All tasks</a>
      </p>
    </Card>
  );
}
