import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { parseKey, shift, todayKey } from '../data/dates';
import { windowDays } from '../data/progress';
import { stIndex } from '../data/study/roadmap';
import { activeStudy } from '../data/study/sessions';
import { studiedText, topicGlance, topicsOf } from '../data/study/topics';
import type { MyDayData } from '../data/types';
import { startLearning } from '../study/actions';

// Learning at a glance: the rolling count (today and the 6 days before — nothing ever resets it to zero),
// then one quiet line of orientation from Study (what's next in your current topic, and when you last sat
// with it), with one tap straight into 15 minutes on it. The learning garden was retired (16 Oct 2026): Today is for acting, and a map that lights up
// (milestone 5) will do the garden's job properly inside Study.
export function StreakCard({ data, justLearned }: { data: MyDayData; justLearned: boolean }) {
  const k = todayKey(), days = windowDays(data, k), n = days.filter(Boolean).length;
  const st = data.study;
  const glance = (() => {
    const topics = topicsOf(st);
    if (!topics.length) return null;
    const ix = stIndex(st);
    const gs = topics.map(t => topicGlance(st, ix, t.id)!).filter(Boolean);
    return gs.find(g => g.isFocus && g.next) ?? gs.find(g => g.next) ?? null;
  })();
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
      {glance?.next && (
        <p className="text-[15px] text-fg-2 m-0" id="streak-next">
          {glance.topic.title} — up next: {glance.next.title}. {studiedText(glance.lastStudied, k)}.
        </p>
      )}
      {glance?.next && (activeStudy(st)
        ? <Button inline variant="ghost" className="mt-2" data-action="streak-start" onClick={() => startLearning(glance.next!.id, null, 15, true)}>Back to your study session</Button>
        : <Button inline variant="tonal" className="mt-2" data-action="streak-start" onClick={() => startLearning(glance.next!.id, glance.nextTask ? glance.nextTask.id : null, 15, true)}>Start 15 minutes</Button>)}
      <p className="text-[15px] text-fg-2 m-0 mt-1">A rolling count of today and the 6 days before. Missed days and rest days never reset it to zero — older days simply slide out of the window.</p>
    </Card>
  );
}
