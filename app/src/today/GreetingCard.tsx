import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { keyOf, nowMin, parseKey, shift } from '../data/dates';
import { NAME_MAX, setName } from '../data/patterns/saved';
import { actualFor } from '../data/rota';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { DateKey, MyDayData } from '../data/types';

// The top of Today: "Good morning, Sam!" over a calm drawn scene that follows the time of day, what's left today in
// plain words, and a small calendar (the month on wide screens, this week on phones) with a dot on days that have a
// shift or an appointment. The words sit on a soft panel so they're readable over any sky, in either theme. On phones
// it stays compact (no button, and no line before the plan is built: today's plan or "Build my day" is right below it). Your name is asked for quietly — a
// link that opens the field — and can be changed later under Your preferences ("What MyDay has noticed").
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
    <section id="greeting" aria-labelledby="greeting-h" className="greeting relative overflow-hidden rounded-card shadow-card mb-4 lg:min-h-[248px] border border-outline">
      <Scene part={part} />
      <div className="relative grid gap-2.5 p-3 lg:gap-4 lg:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(250px,300px)] lg:items-start">
        <div className="greeting-panel self-start rounded-tile bg-surface/85 backdrop-blur-sm px-3.5 py-3 lg:px-4 lg:py-3.5 max-w-[30rem]">
          <h2 id="greeting-h" className="text-[22px] lg:text-[26px] font-bold tracking-[-.01em] m-0" data-part={part}>{HELLO[part]}{name ? `, ${name}` : ''}!</h2>
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
              <Button inline variant="primary" className="max-lg:hidden" data-action="greeting-go" onClick={onGo}>{d ? "Today's plan" : 'Build my day'} <ChevronRight size={18} aria-hidden="true" /></Button>
              {!name && <button type="button" className="min-h-11 -my-2 text-[15px] font-semibold text-primary underline-offset-4 hover:underline cursor-pointer bg-transparent border-0 p-0" data-action="name-ask" onClick={() => setAsking(true)}>What should MyDay call you?</button>}
            </div>
          )}
        </div>
        <div className="hidden lg:block"><MonthCard data={data} k={k} /></div>
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

function MonthCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const first = k.slice(0, 8) + '01', start = mondayOf(first);
  const month = parseKey(first).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const days = Array.from({ length: 42 }, (_, i) => shift(start, i)).filter((day, i) => i < 35 || day.slice(0, 7) === k.slice(0, 7));
  return (
    <div className="month-card rounded-tile bg-surface/85 backdrop-blur-sm p-3" data-s="month">
      <div className="flex items-center justify-between mb-1.5">
        <p className="m-0 text-sm font-bold">{month}</p>
        <a href="#calendar" className="text-sm font-semibold text-primary no-underline inline-flex items-center min-h-11 -my-2.5 px-1" data-action="greeting-calendar">Calendar ›</a>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center tabular-nums" role="table" aria-label={`${month}: today, and days with a shift or appointment`}>
        {WEEKDAYS.map((w, i) => <span key={i} role="columnheader" className="text-[11px] font-bold text-fg-3">{w}</span>)}
        {days.map(day => {
          const inMonth = day.slice(0, 7) === k.slice(0, 7), today = day === k, busy = inMonth && busyOn(data, day);
          return (
            <span key={day} role="cell" className={`relative mx-auto grid place-items-center size-7 rounded-full text-[13px] ${today ? 'bg-primary text-on-primary font-bold' : inMonth ? 'text-fg' : 'text-fg-3 opacity-60'}`}
              aria-label={`${parseKey(day).getDate()}${today ? ', today' : ''}${busy ? ', something on' : ''}`} data-day={day}>
              {parseKey(day).getDate()}
              {busy && <span aria-hidden="true" className={`absolute bottom-0.5 size-1 rounded-full ${today ? 'bg-on-primary' : 'bg-primary'}`} />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WeekStrip({ data, k }: { data: MyDayData; k: DateKey }) {
  const mon = mondayOf(k);
  return (
    <div className="week-strip rounded-tile bg-surface/85 backdrop-blur-sm px-2 py-1.5 grid grid-cols-7 text-center tabular-nums" data-s="week-strip" aria-label="This week">
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

// The drawn scene: a sky for the time of day, the sun or moon, soft hills and a few small houses (lit at night).
// Decorative only (hidden from screen readers); still when animations are off.
const SKY: Record<Part, [string, string]> = {
  morning: ['#ffd8b5', '#fff3e4'], afternoon: ['#c4e4f3', '#ffeedd'], evening: ['#f7a072', '#c993b8'], night: ['#2a2948', '#5d4b72'],
};
const HILLS: Record<Part, [string, string]> = {
  morning: ['#f6c39a', '#ee9a68'], afternoon: ['#f3c6a0', '#e98e5c'], evening: ['#c9776a', '#9a5560'], night: ['#433a5c', '#2f2843'],
};
function Scene({ part }: { part: Part }) {
  const [top, bottom] = SKY[part], [far, near] = HILLS[part], night = part === 'night', lit = part === 'evening' || night;
  return (
    <svg aria-hidden="true" className="absolute inset-0 size-full [filter:var(--scene-filter)]" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid slice" data-scene={part}>
      <defs>
        <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient>
        <radialGradient id="gGlow"><stop offset="0" stopColor={night ? '#fff8e7' : '#fff6d6'} stopOpacity=".9" /><stop offset="1" stopColor={night ? '#fff8e7' : '#fff6d6'} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="600" height="260" fill="url(#gSky)" />
      {night && [[60, 40], [140, 70], [230, 30], [330, 60], [410, 25], [530, 50], [90, 110]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#fff4dc" opacity=".8" />)}
      <circle cx={part === 'evening' ? 470 : 500} cy={part === 'evening' ? 150 : 70} r="70" fill="url(#gGlow)" />
      <circle cx={part === 'evening' ? 470 : 500} cy={part === 'evening' ? 150 : 70} r={night ? 22 : 30} fill={night ? '#f4ead6' : '#fff1c7'} />
      {night && <circle cx="510" cy="64" r="20" fill={top} />}
      <path d="M0 190 C 90 150, 180 165, 270 178 S 450 150, 600 172 L600 260 L0 260 Z" fill={far} />
      <g fill={near} opacity=".95">
        {[[300, 176], [330, 168], [362, 180], [395, 171]].map(([x, y]) => <g key={x}><rect x={x} y={y} width="24" height={200 - y} /><path d={`M${x - 3} ${y} L${x + 12} ${y - 13} L${x + 27} ${y} Z`} /></g>)}
      </g>
      {lit && [[306, 184], [337, 176], [368, 188], [401, 179]].map(([x, y]) => <rect key={x} x={x} y={y} width="6" height="6" rx="1" fill="#ffd27a" opacity=".9" />)}
      <path d="M0 214 C 120 186, 230 206, 330 214 S 500 192, 600 206 L600 260 L0 260 Z" fill={near} />
    </svg>
  );
}
