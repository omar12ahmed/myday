import { Pause, Play, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { shortDate, todayKey } from '../data/dates';
import { stIndex } from '../data/study/roadmap';
import { activeStudy, fmtElapsed, sessionMs } from '../data/study/sessions';
import type { MyDayData } from '../data/types';
import { discardLearning, finishLearning, pauseLearning, resumeLearning, setShowClock } from './actions';
import { Eyebrow, ExternalLink, LinkButton, TextLink } from './parts';

// One focused screen while you learn: what you're on, the time, and Pause / Finish.
// The time comes from the clock (when it started, plus time banked before a pause), so a refresh, or
// coming back later, keeps it right.
export function SessionView({ data }: { data: MyDayData }) {
  const st = data.study, s = activeStudy(st);
  const confirm = useConfirm();
  const running = s ? s.runningSince : null;
  // Redraw once a second while the clock runs.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!s) {
    return (
      <Card><h2>No session in progress</h2><p className="text-[15px] text-fg-2">Start one from your Study dashboard.</p>
        <TextLink href="#study">Back to Study</TextLink></Card>
    );
  }
  const ix = stIndex(st), t = s.taskId ? ix.task.get(s.taskId) : null, c = ix.course.get(s.courseId || '');
  const link = (t && t.node.url) || (c && c.node.url), ms = sessionMs(s), clock = st.settings.showClock;
  const reached = ms >= s.plannedMin * 60000;

  async function discard() {
    if (await confirm({ title: 'Discard this session?', body: "It won't be saved or counted.", confirmLabel: 'Discard it', cancelLabel: 'Keep it' })) discardLearning();
  }

  return (
    <Card tone="accent" className="next-card st-session" aria-labelledby="ses-h">
      <Eyebrow>Learning{s.runningSince ? '' : ' · paused'}{s.date !== todayKey() ? ` · started ${shortDate(s.date)}` : ''}</Eyebrow>
      {t ? <><p className="st-path text-[13px] text-fg-3 m-0 mt-1">{c ? c.node.title : ''} › {t.section.title}</p><h2 id="ses-h">{t.node.title}</h2></>
        : <h2 id="ses-h">{c ? c.node.title : s.title}</h2>}
      {link && <ExternalLink href={link}>Open the resource</ExternalLink>}
      {clock && (
        <>
          <div id="stClock" className="st-clock text-[52px] font-bold text-center tabular-nums tracking-[-.02em] mt-3.5 leading-tight" role="timer" aria-live="off">{fmtElapsed(ms)}</div>
          <p className="text-[15px] text-fg-2 text-center m-0">{s.short ? 'Short session' : 'Planned'}: {s.plannedMin} min</p>
          <div className="st-bar h-2 rounded-full bg-track overflow-hidden mt-2 mb-1" aria-hidden="true">
            <span id="stClockBar" className="block h-full bg-primary rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${Math.min(100, (ms / (s.plannedMin * 60000)) * 100).toFixed(1)}%` }} />
          </div>
        </>
      )}
      <div id="stReached" aria-live="polite">
        {reached && <p className="timer-msg bg-primary-container text-on-primary-container rounded-tile px-3.5 py-3 mt-3 mb-0">That's the {s.plannedMin} minutes you planned. Finish here, or keep going — either is fine.</p>}
      </div>
      <div className="grid gap-2.5 mt-3">
        {s.runningSince
          ? <Button variant="primary" data-action="s-pause" onClick={pauseLearning}><Pause size={18} aria-hidden="true" /> Pause</Button>
          : <Button variant="primary" data-action="s-resume" onClick={resumeLearning}><Play size={18} aria-hidden="true" /> Resume</Button>}
        <Button data-action="s-finish" onClick={finishLearning}><Square size={16} aria-hidden="true" /> Finish session</Button>
      </div>
      <label className="check flex items-center gap-2.5 min-h-11 mt-2 text-[15px] cursor-pointer">
        <input type="checkbox" data-s="show-clock" className="size-[22px] accent-primary flex-none" checked={clock} onChange={e => setShowClock(e.target.checked)} /> Show the clock
      </label>
      <div className="st-actions flex flex-wrap gap-x-3.5 gap-y-1 items-center">
        <TextLink href="#study">Back to Study — it keeps {s.runningSince ? 'running' : 'your place'}</TextLink>
        <LinkButton className="!text-fg-2 font-medium" data-action="s-discard" onClick={discard}>Discard this session</LinkButton>
      </div>
    </Card>
  );
}
