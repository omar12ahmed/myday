import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { keyOf, nowMin, parseKey, shift } from '../data/dates';
import { NAME_MAX, setName } from '../data/patterns/saved';
import { actualFor } from '../data/rota';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { DateKey, MyDayData } from '../data/types';

// A compact greeting with this week under it on phones; on wide screens the greeting alone, with the side column beside
// it (no month calendar on Today since 1.49.0: the owner found it took space, and the Calendar is in the side menu).
// The name and time-of-day greeting still follow the existing preferences and clock.
type Part = 'morning' | 'afternoon' | 'evening' | 'night';
const partOf = (m: number): Part => (m >= 300 && m < 720 ? 'morning' : m >= 720 && m < 1020 ? 'afternoon' : m >= 1020 && m < 1320 ? 'evening' : 'night');
const HELLO: Record<Part, string> = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Hello' };

export function GreetingCard({ data, k, onGo }: { data: MyDayData; k: DateKey; onGo: () => void }) {
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState('');
  const part = partOf(nowMin(k));
  const name = data.patterns.prefs.name;
  const d = data.days[k];
  const open = d && !d.rest ? d.tasks.filter(t => !t.done).length : 0;
  const line = !d ? "Build your day when you're ready — one step at a time."
    : d.rest ? "It's a rest day. Go gently."
    : open ? `You have ${open} task${open === 1 ? '' : 's'} left for today.`
    : d.tasks.length ? "Everything on today's plan is done — lovely." : 'Nothing planned today.';
  function saveName() {
    if (!draft.trim()) return;
    if (update(x => (setName(x.patterns, draft) ? undefined : false))) toast(`Nice to meet you, ${draft.trim().slice(0, NAME_MAX)}.`);
  }
  return (
    <section id="greeting" aria-labelledby="greeting-h" className="greeting">
      <div className="greeting-grid">
        <div className="greeting-panel min-w-0">
          <h1 id="greeting-h" data-part={part}>{HELLO[part]}{name ? `, ${name}` : ''}!</h1>
          <p className={`text-[15px] text-fg-2 m-0 mt-1 ${d ? '' : 'max-lg:hidden'}`} data-s="greeting-line">{line}</p>
          {!name && asking ? (
            <form className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end" onSubmit={e => { e.preventDefault(); saveName(); }}>
              <label className="grid gap-1 text-sm text-fg-2 min-w-0" htmlFor="nameInput">What should MyDay call you?
                <input id="nameInput" autoFocus className="min-h-11 min-w-0 rounded-tile border border-outline-strong bg-surface px-3 text-fg text-base" value={draft} maxLength={NAME_MAX} autoComplete="given-name" onChange={e => setDraft(e.target.value)} />
              </label>
              <span className="flex gap-1.5">
                <Button inline type="submit" variant="primary" data-action="name-save" disabled={!draft.trim()}>Save</Button>
                <Button inline variant="ghost" data-action="name-later" onClick={() => setAsking(false)}>Not now</Button>
              </span>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 max-lg:mt-0">
              {/* Only once there's a plan: before it, Build my day is the button just below. */}
              {d && <Button inline variant="quiet" className="greeting-go max-lg:hidden" data-action="greeting-go" onClick={onGo}>Today's plan <ChevronRight size={16} aria-hidden="true" /></Button>}
              {!name && <button type="button" className="min-h-11 -my-2 text-[15px] font-semibold text-primary underline-offset-4 hover:underline cursor-pointer bg-transparent border-0 p-0" data-action="name-ask" onClick={() => setAsking(true)}>What should MyDay call you?</button>}
            </div>
          )}
        </div>
        <div className="lg:hidden"><WeekStrip data={data} k={k} /></div>
      </div>
    </section>
  );
}

// A day with something on it: a shift (from the Calendar's pattern or what happened) or an appointment.
function busyOn(data: MyDayData, day: DateKey) {
  return actualFor(data, day).works || data.commitments.some(c => c.start.slice(0, 10) === day);
}
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const mondayOf = (k: DateKey) => shift(k, -((parseKey(k).getDay() + 6) % 7));

function WeekStrip({ data, k }: { data: MyDayData; k: DateKey }) {
  const mon = mondayOf(k);
  return (
    <div className="week-strip rounded-tile bg-surface-2 px-2 py-1.5 grid grid-cols-7 text-center tabular-nums" data-s="week-strip" aria-label="This week">
      {Array.from({ length: 7 }, (_, i) => shift(mon, i)).map((day, i) => {
        const today = day === k, busy = busyOn(data, day);
        return (
          <span key={day} className={`relative grid justify-items-center gap-0.5 rounded-tile py-1 ${today ? 'bg-primary text-on-primary' : 'text-fg'}`} aria-label={`${keyOf(parseKey(day)) === k ? 'Today, ' : ''}${parseKey(day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' })}${busy ? ', something on' : ''}`}>
            <span className={`text-[11px] font-bold ${today ? '' : 'text-fg-3'}`}>{WEEKDAYS[i]}</span>
            <span className="text-[15px] font-semibold">{parseKey(day).getDate()}</span>
            <span aria-hidden="true" className={`size-1 rounded-full ${busy ? (today ? 'bg-on-primary' : 'bg-primary') : 'bg-transparent'}`} />
          </span>
        );
      })}
    </div>
  );
}
