import { Card } from '../components/Card';
import { parseKey, shift, todayKey } from '../data/dates';
import { learningSessions, windowDays } from '../data/progress';
import type { MyDayData } from '../data/types';

// The rolling learning count: today and the 6 days before. Nothing ever resets it to zero.
export function StreakCard({ data, justLearned }: { data: MyDayData; justLearned: boolean }) {
  const k = todayKey(), days = windowDays(data, k), n = days.filter(Boolean).length;
  return (
    <Card id="streak" aria-labelledby="streak-h">
      <h2 id="streak-h" className="text-lg">Learning days in the last 7: {n}</h2>
      <div className="week grid grid-cols-7 gap-1.5 my-3.5" aria-hidden="true">
        {days.map((on, i) => {
          const day = shift(k, i - 6), date = parseKey(day);
          const isToday = i === 6;
          return (
            <div key={day} className={`wd grid justify-items-center gap-1.5 text-xs text-fg-3${on ? ' on' : ''}${isToday ? ' today' : ''}${isToday && on && justLearned ? ' just' : ''}`}
              title={`${date.toLocaleDateString(undefined, { weekday: 'long' })}${on ? ': learning done' : ''}`}>
              <span className={`pip w-full max-w-[38px] aspect-square rounded-xl grid place-items-center font-bold text-learning border ${on ? 'bg-learning-c border-learning' : 'bg-surface-2 border-outline'}`}>{on ? '✓' : ''}</span>
              <span className={isToday ? 'text-fg font-bold' : ''}>{date.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[15px] text-fg-2 m-0">A rolling count of today and the 6 days before. Missed days and rest days never reset it to zero — older days simply slide out of the window.</p>
    </Card>
  );
}

// The learning garden: one leaf per session, five leaves make a flower. It only ever grows.
export function GardenCard({ data, justLearned }: { data: MyDayData; justLearned: boolean }) {
  const n = learningSessions(data), flowers = Math.floor(n / 5), leaves = n % 5;
  const shown = Math.min(flowers, 18);
  const back: React.ReactNode[] = [], front: React.ReactNode[] = [];
  const petalClass = ['fill-learning', 'fill-rest', 'fill-appt', 'fill-work'];
  for (let i = 0; i < shown; i++) {
    const row = i < 9 ? 0 : 1, col = i % 9;
    const x = row ? 29 + col * 22 : 18 + col * 22;
    const base = row ? 110 : 120, top = base - (row ? 24 : 34);
    const flower = (
      <g key={i} className={`gd-flower${justLearned && leaves === 0 && i === flowers - 1 ? ' gd-grow' : ''}`} style={{ transformOrigin: '50% 100%' }}>
        <line className="stroke-health" strokeWidth="2.5" strokeLinecap="round" x1={x} y1={base} x2={x} y2={top} />
        <g className={petalClass[i % 4]}>
          {[0, 1, 2, 3, 4].map(p => { const a = (p * 72 - 90) * Math.PI / 180; return <circle key={p} cx={(x + Math.cos(a) * 4.6).toFixed(1)} cy={(top + Math.sin(a) * 4.6).toFixed(1)} r="4.2" />; })}
        </g>
        <circle className="fill-admin" cx={x} cy={top} r="2.6" />
      </g>
    );
    (row ? back : front).push(flower);
  }
  const sx = 276, sb = 116, sprout: React.ReactNode[] = [];
  if (n === 0) sprout.push(<ellipse key="seed" className="fill-admin" cx={sx} cy={sb - 2} rx="6" ry="4" />);
  else {
    const h = 16 + leaves * 14;
    sprout.push(<line key="stem" className="stroke-health" strokeWidth="2.5" strokeLinecap="round" x1={sx} y1={sb + 4} x2={sx} y2={sb - h} />);
    for (let j = 0; j < leaves; j++) {
      const side = j % 2 ? 1 : -1, y = sb - 12 - j * 14, cx = sx + side * 9;
      sprout.push(
        <g key={`l${j}`} className={justLearned && j === leaves - 1 ? 'gd-grow' : undefined} style={{ transformOrigin: `${side < 0 ? '100%' : '0%'} 50%` }}>
          <ellipse className="gd-leaf fill-health" cx={cx} cy={y} rx="9" ry="4.2" transform={`rotate(${side * -28} ${cx} ${y})`} />
        </g>,
      );
    }
    sprout.push(<circle key="bud" className="fill-health" cx={sx} cy={sb - h} r="3" />);
  }
  const plural = (x: number, one: string, many: string) => `${x} ${x === 1 ? one : many}`;
  const caption = n === 0
    ? 'Each learning session you finish grows a leaf, and five leaves make a flower. It only ever grows.'
    : `${plural(n, 'learning session', 'learning sessions')} so far · ${plural(flowers, 'flower', 'flowers')} and a sprout with ${plural(leaves, 'leaf', 'leaves')}. Missed days never take anything away.`;
  return (
    <Card id="garden" className="garden" aria-labelledby="garden-h">
      <h2 id="garden-h">Your learning garden</h2>
      <svg viewBox="0 30 320 100" role="img" aria-label={caption} className="w-full h-auto block mt-1.5 mb-2">
        <path className="fill-health-c" d="M0 116 Q160 104 320 116 L320 130 L0 130 Z" />
        {flowers > 18 && <text className="fill-fg-3 text-[11px]" x="6" y="46">+{flowers - 18} more flowers</text>}
        {back}{front}{sprout}
      </svg>
      <p id="gardenCaption" className="text-[15px] text-fg-2 m-0">{caption}</p>
    </Card>
  );
}
