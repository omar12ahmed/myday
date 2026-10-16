import { useMemo } from 'react';
import { Card } from '../components/Card';
import { todayKey } from '../data/dates';
import { completion, stIndex, type StudyIndex } from '../data/study/roadmap';
import { conceptEvidence, evidenceText } from '../data/study/revision';
import { studiedText, topicGlance, topicOfStage, topicsOf } from '../data/study/topics';
import type { DateKey, MyDayData, StudyCourse, StudyData, StudyStage } from '../data/types';
import { BackLink, InlineLink, Meta, Note } from './parts';

// Your map (milestone 5): each stage is a line, each course a station, lit up to where you stand.
// The terminus is the stage's finish line; a dashed blue ring marks a course whose concepts might
// benefit from more practice (the same flag as on Progress). Derived entirely from the roadmap,
// sessions and reviews — nothing extra is saved, nothing counts down, nothing is graded.
// Stations open their course. Design: design-directions/map-2-stations.html ("Stations", picked 16 Oct 2026).

type StationState = 'done' | 'now' | 'started' | 'ahead';

const TEAL = 'var(--primary)', TEAL_C = 'var(--primary-container)', TRACK = 'var(--track)',
  INK2 = 'var(--fg-2)', INK3 = 'var(--fg-3)', LEARN = 'var(--learning)', ACCENT = 'var(--accent)';

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

// One metro line: the stage's courses in order, the line lit up to the furthest station reached.
function StageLine({ sg, ix, focusId, practice }: { sg: StudyStage; ix: StudyIndex; focusId: string | null; practice: Set<string> }) {
  const courses = sg.courses.filter(c => !c.archived);
  const stats = courses.map(c => ({ c, comp: completion(ix.courseTasks.get(c.id) ?? []), st: stationState(ix, c, focusId) }));
  const litTo = stats.reduce((m, s, i) => (s.st === 'ahead' ? m : i), -1);
  const X = (i: number) => (courses.length === 1 ? 240 : 130 + (i * 720) / (courses.length - 1));
  const left = stats.reduce((a, s) => a + (s.comp.total - s.comp.done), 0);
  // A course with no tasks added doesn't block the finish line — there's nothing to complete in it.
  const allDone = stats.some(s => s.comp.total > 0) && stats.every(s => s.comp.total === 0 || s.st === 'done');
  const y = 78; // the line's height; labels alternate above and below
  return (
    <div className="mt-4 first:mt-2" data-s="map-line" data-stage={sg.id}>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="m-0 text-[15px] font-bold">{sg.title}</h4>
        <Meta>{litTo < 0 ? 'Nothing started here yet' : allDone ? 'Every station reached' : `Lit to ${stats[litTo].c.title}`}</Meta>
      </div>
      <svg viewBox="0 0 980 150" className="block w-full h-auto" role="img" aria-label={`${sg.title}: ${stats.filter(s => s.st === 'done').length} of ${courses.length} courses complete`}>
        <line x1="30" y1={y} x2="930" y2={y} stroke={TRACK} strokeWidth="8" strokeLinecap="round" style={{ stroke: TRACK }} />
        {litTo >= 0 && <line x1="30" y1={y} x2={X(litTo)} y2={y} strokeWidth="8" strokeLinecap="round" style={{ stroke: TEAL }} />}
        <circle cx="30" cy={y} r="7" style={{ fill: INK3 }} />
        {stats.map((s, i) => {
          const x = X(i), above = i % 2 === 1, ly = above ? y - 34 : y + 34, prac = practice.has(s.c.id);
          return (
            <a key={s.c.id} href={`#study/course/${encodeURIComponent(s.c.id)}`} data-s="map-st" data-id={s.c.id} data-st={s.st} aria-label={`${s.c.title} — ${s.st === 'done' ? 'complete' : s.st === 'now' ? 'you are here' : s.st === 'started' ? 'started' : 'ahead'}`}>
              {s.st === 'now' && <circle cx={x} cy={y} r="20" style={{ fill: TEAL_C }} />}
              {s.st === 'done' && <circle cx={x} cy={y} r="11" style={{ fill: TEAL }} />}
              {s.st === 'now' && <circle cx={x} cy={y} r="11" fill="#fff" strokeWidth="5" style={{ stroke: TEAL }} />}
              {s.st === 'started' && <circle cx={x} cy={y} r="11" fill="#fff" strokeWidth="3" style={{ stroke: TEAL }} />}
              {s.st === 'ahead' && <circle cx={x} cy={y} r="11" fill="#fff" strokeWidth="3" style={{ stroke: TRACK }} />}
              {prac && <circle cx={x} cy={y} r="16" fill="none" strokeWidth="2" strokeDasharray="3 4" style={{ stroke: LEARN }} />}
              {s.st === 'done' && <path d={`M${x - 5} ${y} L${x - 1.5} ${y + 4} L${x + 5.5} ${y - 4}`} stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
              <text x={x} y={ly} textAnchor="middle" style={{ fill: s.st === 'now' ? 'var(--fg)' : s.st === 'done' ? INK3 : INK2, font: `${s.st === 'now' ? 800 : 600} 12.5px 'Plus Jakarta Sans', sans-serif` }}>{s.c.title}</text>
              {s.st === 'now' && <text x={x} y={ly + 14} textAnchor="middle" style={{ fill: INK3, font: `600 10.5px 'Plus Jakarta Sans', sans-serif` }}>you are here</text>}
              {prac && !above && <text x={x} y={ly + 14} textAnchor="middle" style={{ fill: LEARN, font: `600 10.5px 'Plus Jakarta Sans', sans-serif` }}>worth a revisit</text>}
            </a>
          );
        })}
        {/* The terminus: the stage's finish line. */}
        <g data-s="map-term" data-done={allDone ? '1' : '0'}>
          <rect x="919" y={y - 11} width="22" height="22" rx="5" fill="#fff" strokeWidth="2.5" style={{ stroke: allDone ? TEAL : INK2 }} />
          <path d={`M930 ${y - 8} L930 ${y - 20} M930 ${y - 20} L942 ${y - 17} L930 ${y - 13}`} strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ stroke: allDone ? TEAL : ACCENT }} />
          <text x="930" y={y + 34} textAnchor="end" style={{ fill: allDone ? TEAL : INK3, font: `700 11px 'Plus Jakarta Sans', sans-serif` }}>{allDone ? 'Stage complete ⚑' : `${left} task${left === 1 ? '' : 's'} to the flag`}</text>
        </g>
      </svg>
    </div>
  );
}

export function MapView({ data, topicId }: { data: MyDayData; topicId: string }) {
  const st = data.study, k: DateKey = todayKey();
  const ix = useMemo(() => stIndex(st), [st]);
  const topics = topicsOf(st);
  const sel = topics.find(t => t.id === topicId) ?? topics[0];
  const g = topicGlance(st, ix, sel.id);
  const stages = st.stages.filter(sg => topicOfStage(st, sg) === sel.id && sg.courses.some(c => !c.archived));
  const practice = useMemo(() => practiceCourses(st, ix), [st, ix]);
  const practiceHere = g ? st.concepts.map(c => ({ c, ev: conceptEvidence(st, c) })).filter(x => x.ev.status === 'practice' && x.c.taskIds.some(tid => { const e = ix.task.get(tid); return !!e && topicOfStage(st, e.stage) === sel.id; })) : [];
  const focusId = g?.next?.id ?? null;
  return (
    <>
      <Card>
        <BackLink to="study" label="Study" />
        <h2>Your map</h2>
        <Note className="m-0">Each stage is a line, each course a station — lit up to where you stand. The flag is the finish line: every task in the stage complete. It only ever moves forward.</Note>
      </Card>
      {topics.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Topics">
          {topics.map(t => (
            <a key={t.id || 'main'} role="tab" aria-selected={t.id === sel.id} data-s="map-topic" data-id={t.id}
              href={`#study/map/${t.id || 'main'}`}
              className={`px-4 py-2 rounded-full border text-[13px] font-bold no-underline ${t.id === sel.id ? 'bg-primary border-primary text-on-primary' : 'bg-surface border-outline text-fg-2'}`}>{t.title}</a>
          ))}
        </div>
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
          </Card>
          <Card aria-labelledby="map-lines-h">
            <h3 id="map-lines-h">{sel.title}</h3>
            {stages.map(sg => <StageLine key={sg.id} sg={sg} ix={ix} focusId={focusId} practice={practice} />)}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-fg-3 font-semibold" aria-hidden="true">
              <span>● Done</span><span>◉ You are here</span><span>◐ Started</span><span>○ Ahead</span>
              <span className="text-learning">◌ Worth a revisit</span><span>⚑ Finish line</span>
            </div>
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
