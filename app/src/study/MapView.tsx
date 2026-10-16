import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { todayKey } from '../data/dates';
import { completion, stIndex, type StudyIndex } from '../data/study/roadmap';
import { conceptEvidence, evidenceText } from '../data/study/revision';
import { activeStudy } from '../data/study/sessions';
import { studiedText, topicGlance, topicOfStage, topicsOf } from '../data/study/topics';
import type { DateKey, MyDayData, StudyCourse, StudyData, StudyStage } from '../data/types';
import { startLearning } from './actions';
import { BackLink, InlineLink, Meta, Note, TextLink } from './parts';

// Your map (milestone 5): each stage is a line, each course a station, lit up to where you stand.
// The terminus is the stage's finish line; a dashed blue ring marks a course whose concepts might
// benefit from more practice (the same flag as on Progress). Stations beyond the next one sit in the
// fog — unexplored, not behind. Derived entirely from the roadmap, sessions and reviews — nothing extra
// is saved, nothing is graded. Stations open their course. Wide screens draw each stage as a metro line
// (design-directions/map-2-stations.html, "Stations", picked 16 Oct 2026); phones list the same stations
// top to bottom, so every name stays readable. All colours come from the theme's tokens (light and dark).

type StationState = 'done' | 'now' | 'started' | 'ahead';
type Station = { c: StudyCourse; comp: ReturnType<typeof completion>; st: StationState; fog: boolean; prac: boolean };

const C = {
  teal: 'var(--primary)', tealC: 'var(--primary-container)', onTeal: 'var(--on-primary)', track: 'var(--track)', surface: 'var(--surface)',
  ink: 'var(--text)', ink2: 'var(--text-2)', ink3: 'var(--text-3)', learn: 'var(--learning)', accent: 'var(--accent)', fog: 'var(--outline)',
};
const STATE_WORDS: Record<StationState, string> = { done: 'complete', now: 'you are here', started: 'started', ahead: 'ahead' };

// Courses whose tasks link to a concept flagged "might benefit from more practice".
function practiceCourses(st: StudyData, ix: StudyIndex): Set<string> {
  const out = new Set<string>();
  for (const c of st.concepts) {
    if (conceptEvidence(st, c).status !== 'practice') continue;
    for (const tid of c.taskIds) { const e = ix.task.get(tid); if (e) out.add(e.course.id); }
  }
  return out;
}

function stationState(ix: StudyIndex, c: StudyCourse, focusId: string | null): StationState {
  const comp = completion(ix.courseTasks.get(c.id) ?? []);
  if (comp.total > 0 && comp.done === comp.total) return 'done';
  if (c.id === focusId) return 'now';
  if (comp.done > 0) return 'started';
  return 'ahead';
}

// One stage's stations, lit up to the furthest one reached ("you are here" counts); beyond the next one is fog.
function stageStations(sg: StudyStage, ix: StudyIndex, focusId: string | null, practice: Set<string>) {
  const courses = sg.courses.filter(c => !c.archived);
  const base = courses.map(c => ({ c, comp: completion(ix.courseTasks.get(c.id) ?? []), st: stationState(ix, c, focusId) }));
  const litTo = base.reduce((m, s, i) => (s.st === 'ahead' ? m : i), -1);
  const fogFrom = litTo + 2; // the station after where you stand stays clear; beyond it is unexplored
  const stations: Station[] = base.map((s, i) => ({ ...s, fog: i >= fogFrom && s.st === 'ahead', prac: practice.has(s.c.id) }));
  const left = stations.reduce((a, s) => a + (s.comp.total - s.comp.done), 0);
  // A course with no tasks added doesn't block the finish line — there's nothing to complete in it.
  const allDone = stations.some(s => s.comp.total > 0) && stations.every(s => s.comp.total === 0 || s.st === 'done');
  return { stations, litTo, fogFrom, left, allDone };
}

// Names on the line are measured in the app's own font, and shortened only when they would touch a neighbour.
const FONT = (weight: number, size: number) => `${weight} ${size}px "Plus Jakarta Sans Variable", system-ui, sans-serif`;
let pen: CanvasRenderingContext2D | null | undefined;
function textWidth(s: string, font: string) {
  if (pen === undefined) pen = document.createElement('canvas').getContext('2d');
  if (!pen) return s.length * 7.6;
  pen.font = font;
  return pen.measureText(s).width;
}
function fitText(s: string, max: number, font: string) {
  if (textWidth(s, font) <= max) return s;
  let t = s;
  while (t.length > 1 && textWidth(t.trimEnd() + '…', font) > max) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}

// Where the stations sit on a line `w` pixels wide: the start dot, the stations, then the finish flag.
const lineX = (w: number, n: number) => {
  const first = 96, last = w - 104;
  return (i: number) => (n === 1 ? first : first + (i * (last - first)) / (n - 1));
};
// Names alternate below and above the line, so each needs room for two gaps between stations.
const roomPerName = (w: number, n: number) => (n === 1 ? 220 : Math.min(220, (2 * (w - 200)) / (n - 1) - 16));
// The metro line is drawn only when every stage's names get room to be read (about 18 characters); otherwise —
// phones, or a stage with many courses — the stations are listed top to bottom instead.
const MIN_ROOM = 140;

// The map's width, measured before it's painted (and again whenever it changes).
function useWidth() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, w] as const;
}

function StageLine({ sg, ix, focusId, practice, w }: { sg: StudyStage; ix: StudyIndex; focusId: string | null; practice: Set<string>; w: number | null }) {
  const { stations, litTo, fogFrom, left, allDone } = stageStations(sg, ix, focusId, practice);
  const flagNote = allDone ? 'Every station reached ⚑' : `${left} task${left === 1 ? '' : 's'} to the flag`;
  return (
    <div className="mt-4 first:mt-2" data-s="map-line" data-stage={sg.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h4 className="m-0 text-[15px] font-bold">{sg.title}</h4>
        {/* On the line, the flag's note sits here, clear of the names; the list says it at its finish line. */}
        <Meta>{litTo < 0 ? 'Nothing started here yet' : allDone ? 'Every station reached' : `Lit to ${stations[litTo].c.title}`}{w && !allDone ? ` · ${flagNote}` : ''}</Meta>
      </div>
      {w ? <MetroLine sg={sg} w={w} stations={stations} litTo={litTo} fogFrom={fogFrom} allDone={allDone} flagNote={flagNote} />
        : <StationList stations={stations} litTo={litTo} allDone={allDone} flagNote={flagNote} />}
    </div>
  );
}

// Wide screens: the stage as a metro line, drawn at the map's real width so names stay at reading size
// (shortened only if they'd touch a neighbour — the full name is the station's title and in its spoken label).
function MetroLine({ sg, w, stations, litTo, fogFrom, allDone, flagNote }: { sg: StudyStage; w: number; stations: Station[]; litTo: number; fogFrom: number; allDone: boolean; flagNote: string }) {
  const n = stations.length, X = lineX(w, n), y = 70, end = w - 40, room = roomPerName(w, n);
  const fogX = fogFrom < n ? (X(fogFrom - 1) + X(fogFrom)) / 2 : null;
  const font = (weight: number, size: number) => ({ font: FONT(weight, size) });
  // A name is centred on its station, nudged in so the first and last never run off the edge.
  const nameAt = (x: number, text: string, f: string) => { const half = textWidth(text, f) / 2; return Math.min(Math.max(x, half + 2), w - half - 2); };
  return (
    <svg width={w} height="140" viewBox={`0 0 ${w} 140`} className="block max-w-full h-auto mt-1" role="img" aria-label={`${sg.title}: ${stations.filter(s => s.st === 'done').length} of ${n} courses complete`}>
      <defs>
        <linearGradient id={`fog-${sg.id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--outline)" stopOpacity="0" /><stop offset=".3" stopColor="var(--outline)" stopOpacity=".55" /><stop offset="1" stopColor="var(--outline)" stopOpacity=".75" />
        </linearGradient>
      </defs>
      {/* The fog: a soft mist over the unexplored stretch (decorative — the names in it keep full contrast). */}
      {fogX !== null && <rect data-s="map-fog" x={fogX} y={y - 26} width={w - fogX} height="52" rx="26" fill={`url(#fog-${sg.id})`} />}
      <line x1="14" y1={y} x2={fogX ?? end} y2={y} strokeWidth="8" strokeLinecap="round" style={{ stroke: C.track }} />
      {fogX !== null && <line x1={fogX} y1={y} x2={end} y2={y} strokeWidth="5" strokeLinecap="round" strokeDasharray="1 11" style={{ stroke: C.ink3 }} />}
      {litTo >= 0 && <line x1="14" y1={y} x2={X(litTo)} y2={y} strokeWidth="8" strokeLinecap="round" style={{ stroke: C.teal }} />}
      <circle cx="14" cy={y} r="7" style={{ fill: C.ink3 }} />
      {stations.map((s, i) => {
        const x = X(i), above = i % 2 === 1, ly = above ? y - 30 : y + 36;
        const nameFont = FONT(s.st === 'now' ? 800 : 600, 14), name = fitText(s.c.title, room, nameFont);
        const subs = [s.st === 'now' ? 'you are here' : '', s.prac ? 'worth a revisit' : ''].filter(Boolean);
        // Above the line, the extra words go above the name; below it, under the name.
        const subY = (k: number) => (above ? ly - 16 * (subs.length - k) : ly + 16 * (k + 1));
        return (
          <a key={s.c.id} href={`#study/course/${encodeURIComponent(s.c.id)}`} data-s="map-st" data-id={s.c.id} data-st={s.st} data-fog={s.fog ? '1' : '0'} aria-label={`${s.c.title} — ${STATE_WORDS[s.st]}${s.fog ? ', in the fog' : ''}${s.prac ? ', worth a revisit' : ''}`}>
            <title>{s.c.title}</title>
            {s.st === 'now' && <circle cx={x} cy={y} r="20" style={{ fill: C.tealC }} />}
            {s.st === 'done' && <circle cx={x} cy={y} r="11" style={{ fill: C.teal }} />}
            {s.st === 'now' && <circle cx={x} cy={y} r="11" strokeWidth="5" style={{ fill: C.surface, stroke: C.teal }} />}
            {s.st === 'started' && <>
              <circle cx={x} cy={y} r="11" strokeWidth="3" style={{ fill: C.surface, stroke: C.teal }} />
              <path d={`M${x} ${y - 9.5} A 9.5 9.5 0 0 0 ${x} ${y + 9.5} Z`} style={{ fill: C.teal }} />
            </>}
            {s.st === 'ahead' && <circle cx={x} cy={y} r="11" strokeWidth="3" strokeDasharray={s.fog ? '3 3' : undefined} style={{ fill: C.surface, stroke: s.fog ? C.ink3 : C.track }} />}
            {s.prac && <circle cx={x} cy={y} r="16" fill="none" strokeWidth="2" strokeDasharray="3 4" style={{ stroke: C.learn }} />}
            {s.st === 'done' && <path d={`M${x - 5} ${y} L${x - 1.5} ${y + 4} L${x + 5.5} ${y - 4}`} strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ stroke: C.onTeal }} />}
            <text x={nameAt(x, name, nameFont)} y={ly} textAnchor="middle" style={{ fill: s.st === 'now' ? C.ink : C.ink2, ...font(s.st === 'now' ? 800 : 600, 14) }}>{name}</text>
            {subs.map((t, k) => <text key={t} x={nameAt(x, t, FONT(600, 12))} y={subY(k)} textAnchor="middle" style={{ fill: t === 'worth a revisit' ? C.learn : C.ink3, ...font(600, 12) }}>{t}</text>)}
          </a>
        );
      })}
      {/* The terminus: the stage's finish line (its note is in the stage's heading, so it never collides with a name). */}
      <g data-s="map-term" data-done={allDone ? '1' : '0'}>
        <title>{allDone ? 'Stage complete' : flagNote}</title>
        <rect x={end - 11} y={y - 11} width="22" height="22" rx="5" strokeWidth="2.5" style={{ fill: C.surface, stroke: allDone ? C.teal : C.ink2 }} />
        <path d={`M${end - 4} ${y + 6} L${end - 4} ${y - 6} M${end - 4} ${y - 6} L${end + 6} ${y - 3} L${end - 4} ${y}`} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: allDone ? C.teal : C.accent }} />
      </g>
    </svg>
  );
}

// Phones: the same stations top to bottom — a rail on the left, every name in full and readable.
function StationList({ stations, litTo, allDone, flagNote }: { stations: Station[]; litTo: number; allDone: boolean; flagNote: string }) {
  const dot = (s: Station) => {
    const base = 'absolute left-[3px] top-[14px] size-[18px] rounded-full border-[3px] box-border';
    if (s.st === 'done') return <span className={`${base} border-primary bg-primary flex items-center justify-center`} aria-hidden="true"><span className="block w-[7px] h-[4px] border-l-2 border-b-2 border-on-primary -rotate-45 -mt-px" /></span>;
    if (s.st === 'now') return <span className={`${base} border-[5px] border-primary bg-surface ring-4 ring-primary-container`} aria-hidden="true" />;
    if (s.st === 'started') return <span className={`${base} border-primary`} style={{ background: 'linear-gradient(90deg, var(--primary) 50%, var(--surface) 50%)' }} aria-hidden="true" />;
    return <span className={`${base} bg-surface ${s.fog ? 'border-dashed border-fg-3' : 'border-track'}`} aria-hidden="true" />;
  };
  return (
    <ol className="list-none p-0 m-0 mt-2" data-s="map-list">
      {stations.map((s, i) => (
        <li key={s.c.id} className={`relative pl-9 pb-3 min-h-11 ${s.fog ? 'map-fog rounded-tile' : ''}`}>
          {/* The rail down to the next station: lit up to where you stand, dotted into the fog. */}
          <span aria-hidden="true" className={`absolute left-[10px] top-[30px] bottom-[-14px] w-1 rounded-full ${i < litTo ? 'bg-primary' : s.fog || stations[i + 1]?.fog ? 'map-fog-rail' : 'bg-track'}`} />
          {dot(s)}
          <a href={`#study/course/${encodeURIComponent(s.c.id)}`} data-s="map-st" data-id={s.c.id} data-st={s.st} data-fog={s.fog ? '1' : '0'} className="block pt-2.5 no-underline text-fg">
            <span className={`block text-[15px] leading-snug ${s.st === 'now' ? 'font-extrabold' : 'font-semibold'}`}>{s.c.title}</span>
            <span className="block text-[13px] text-fg-3">
              {s.st === 'done' ? 'Complete' : s.st === 'now' ? 'You are here' : s.st === 'started' ? `Started · ${s.comp.done} of ${s.comp.total} tasks` : s.fog ? 'Ahead, in the fog' : 'Ahead'}
              {s.prac && <span className="text-learning"> · worth a revisit</span>}
            </span>
          </a>
        </li>
      ))}
      <li className="relative pl-9 min-h-11" data-s="map-term" data-done={allDone ? '1' : '0'}>
        <span aria-hidden="true" className={`absolute left-[3px] top-[10px] size-[18px] rounded-[5px] border-[2.5px] bg-surface text-[11px] leading-none flex items-center justify-center ${allDone ? 'border-primary text-primary' : 'border-fg-2 text-accent'}`}>⚑</span>
        <span className="block pt-1.5 text-[13px] font-bold text-fg-2">{allDone ? 'Stage complete ⚑' : `Finish line · ${flagNote}`}</span>
      </li>
    </ol>
  );
}

// The key, drawn with the same shapes as the stations (so it can't drift from the drawing).
function MapKey() {
  const dot = (body: ReactNode) => <svg width="18" height="18" viewBox="-9 -9 18 18" className="flex-none" aria-hidden="true">{body}</svg>;
  const items: { label: string; shape: ReactNode; cls?: string }[] = [
    { label: 'Done', shape: <><circle r="7" style={{ fill: C.teal }} /><path d="M-3.2 0 L-1 2.6 L3.6 -2.6" strokeWidth="1.8" fill="none" strokeLinecap="round" style={{ stroke: C.onTeal }} /></> },
    { label: 'You are here', shape: <><circle r="8.5" style={{ fill: C.tealC }} /><circle r="5" strokeWidth="3" style={{ fill: C.surface, stroke: C.teal }} /></> },
    { label: 'Started', shape: <><circle r="6.5" strokeWidth="2" style={{ fill: C.surface, stroke: C.teal }} /><path d="M0 -5.5 A 5.5 5.5 0 0 0 0 5.5 Z" style={{ fill: C.teal }} /></> },
    { label: 'Ahead', shape: <circle r="6.5" strokeWidth="2.2" style={{ fill: C.surface, stroke: C.track }} /> },
    { label: 'In the fog', shape: <circle r="6.5" strokeWidth="2" strokeDasharray="2.5 2.5" style={{ fill: C.surface, stroke: C.ink3 }} /> },
    { label: 'Worth a revisit', shape: <circle r="7.5" fill="none" strokeWidth="1.6" strokeDasharray="2.5 3" style={{ stroke: C.learn }} />, cls: 'text-learning' },
    { label: 'Finish line', shape: <><rect x="-7" y="-7" width="14" height="14" rx="3.5" strokeWidth="1.8" style={{ fill: C.surface, stroke: C.ink2 }} /><path d="M-2.5 4 L-2.5 -4 L4 -2 L-2.5 0" strokeWidth="1.5" fill="none" strokeLinejoin="round" style={{ stroke: C.accent }} /></> },
  ];
  return (
    <ul className="list-none p-0 m-0 mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-3 font-semibold" aria-hidden="true" data-s="map-key">
      {items.map(({ label, shape, cls }) => <li key={label} className={`inline-flex items-center gap-1.5 ${cls ?? ''}`}>{dot(shape)}{label}</li>)}
    </ul>
  );
}

export function MapView({ data, topicId }: { data: MyDayData; topicId: string }) {
  const st = data.study, k: DateKey = todayKey(), [measured, width] = useWidth();
  const ix = useMemo(() => stIndex(st), [st]);
  const topics = topicsOf(st);
  const sel = topics.find(t => t.id === topicId) ?? topics[0];
  const g = topicGlance(st, ix, sel.id);
  const stages = st.stages.filter(sg => topicOfStage(st, sg) === sel.id && sg.courses.some(c => !c.archived));
  const practice = useMemo(() => practiceCourses(st, ix), [st, ix]);
  const practiceHere = g ? st.concepts.map(c => ({ c, ev: conceptEvidence(st, c) })).filter(x => x.ev.status === 'practice' && x.c.taskIds.some(tid => { const e = ix.task.get(tid); return !!e && topicOfStage(st, e.stage) === sel.id; })) : [];
  const focusId = g?.next?.id ?? null, running = activeStudy(st);
  // One drawing for the whole map: the metro line when every stage fits at reading size, else the list.
  const lineW = width >= 480 && stages.every(sg => roomPerName(width, sg.courses.filter(c => !c.archived).length) >= MIN_ROOM) ? width : null;
  return (
    <>
      <Card>
        <BackLink to="study" label="Study" />
        <h2>Your map</h2>
        <Note className="m-0">Each stage is a line, each course a station — lit up to where you stand, with the unexplored still in the fog. The flag is the finish line: every task in the stage complete. It only ever moves forward.</Note>
      </Card>
      {topics.length > 1 && (
        <nav className="flex flex-wrap gap-2 mb-4" aria-label="Topics">
          {topics.map(t => (
            <a key={t.id || 'main'} aria-current={t.id === sel.id ? 'page' : undefined} data-s="map-topic" data-id={t.id}
              href={`#study/map/${t.id || 'main'}`}
              className={`inline-flex items-center min-h-11 px-4 rounded-full border text-[13px] font-bold no-underline ${t.id === sel.id ? 'bg-primary border-primary text-on-primary' : 'bg-surface border-outline text-fg-2'}`}>{t.title}</a>
          ))}
        </nav>
      )}
      {!st.stages.length ? (
        <Card><Note className="m-0">Set up your roadmap first — then this becomes your map. <InlineLink href="#study/roadmap">Open the roadmap</InlineLink></Note></Card>
      ) : !g || !stages.length ? (
        <Card><Note className="m-0">No courses in {sel.title} yet. <InlineLink href="#study/roadmap">Add one from the roadmap</InlineLink> and it will appear here as a station.</Note></Card>
      ) : (
        <>
          <Card aria-labelledby="map-line-h">
            <h3 id="map-line-h" className="sr-only">Where you stand in {sel.title}</h3>
            <p className="text-[15px] m-0" id="mapLine">
              {g.comp.total ? <>You're <strong>{g.comp.done} of {g.comp.total} tasks</strong> into {sel.title}</> : <>Nothing added to {sel.title} yet</>}
              {g.nextTask ? <> — next: <strong>{g.nextTask.title}</strong>{g.next ? <span className="text-fg-3"> · {g.next.title}</span> : null}</> : g.next ? <> — next: <strong>{g.next.title}</strong></> : null}
              . {studiedText(g.lastStudied, k)}.
            </p>
            {/* Act from where you stand: a short session on the next task (or back to the one running). */}
            {running ? <p className="text-[15px] mt-3 mb-0">A study session is running. <TextLink href="#study/session" data-action="map-session">Go back to it</TextLink></p>
              : g.next && <Button inline className="mt-3" data-action="map-start" onClick={() => startLearning(g.next!.id, g.nextTask ? g.nextTask.id : null, 15, true)}>Start 15 minutes{g.nextTask ? '' : ` on ${g.next.title}`}</Button>}
          </Card>
          <Card aria-labelledby="map-lines-h">
            <h3 id="map-lines-h">{sel.title}</h3>
            <div ref={measured}>
              {stages.map(sg => <StageLine key={sg.id} sg={sg} ix={ix} focusId={focusId} practice={practice} w={lineW} />)}
            </div>
            <MapKey />
          </Card>
          {practiceHere.length > 0 && (
            <Card aria-labelledby="map-prac-h">
              <h3 id="map-prac-h">Might benefit from more practice ({practiceHere.length})</h3>
              {practiceHere.map(x => (
                <div key={x.c.id} className="py-2 border-t border-outline first:border-t-0">
                  <InlineLink href={`#study/concept/${x.c.id}`}>{x.c.title}</InlineLink>
                  <div><Meta>{evidenceText(x.ev)}</Meta></div>
                </div>
              ))}
              <Note className="mt-2 mb-0">The same flags as on Progress &amp; history — shown here so the wobbles live on the map.</Note>
            </Card>
          )}
        </>
      )}
    </>
  );
}
