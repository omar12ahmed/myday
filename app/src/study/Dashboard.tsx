import { Minus, Play, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Select } from '../components/Field';
import { fmtDuration, shortDate, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { STARTER_STAGES } from '../data/study/common';
import { dueConcepts, nextReviewDate, questionReady } from '../data/study/revision';
import { applySetup, completion, completionText, focusCourse, nextTaskIn, proposeSetup, stIndex, taskPath, type SetupRow } from '../data/study/roadmap';
import { activeStudy, sessionMinutes, suggestLength } from '../data/study/sessions';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { setFocus, startLearning, startRevision } from './actions';
import { Bar, Eyebrow, ExternalLink, InlineLink, Summary, TextLink } from './parts';

// ---------- First-time setup: a proposal from your learning list; nothing is saved until you choose ----------
export function SetupCard({ data }: { data: MyDayData }) {
  const [rows, setRows] = useState<SetupRow[]>(() => proposeSetup(data.lists.learning));
  const change = (i: number, fn: (r: SetupRow) => void) => setRows(rs => rs.map((r, j) => { if (j !== i) return r; const c = { ...r }; fn(c); return c; }));
  function create(withCourses: boolean) {
    if (update(d => { if (!applySetup(d.study, withCourses ? rows : null)) return false; })) toast('Your roadmap is ready — add modules and sections whenever you like.');
  }
  return (
    <Card tone="accent" className="next-card">
      <Eyebrow>Getting started</Eyebrow>
      <h2>Set up your study roadmap</h2>
      <p className="text-[15px]">It's a simple outline: stages, then courses, modules, sections and tasks. MyDay doesn't fill in course contents — you add modules and sections as you reach them.</p>
      {rows.length > 0 && (
        <>
          <h3>From your learning list</h3>
          <p className="text-[15px] text-fg-2">Each one becomes a course. The stages are a first guess from the titles — change any before saving.</p>
          {rows.map((r, i) => (
            <div key={r.listId} className="st-setup-row grid grid-cols-1 min-[480px]:grid-cols-[minmax(0,1fr)_minmax(0,12em)] gap-x-2.5 gap-y-1 items-center py-1.5 border-t border-outline">
              <label className="check flex items-center gap-2.5 min-h-11 text-[15px]">
                <input type="checkbox" data-s="setup-keep" data-i={i} className="size-[22px] accent-primary flex-none" checked={r.keep} onChange={e => change(i, x => { x.keep = e.target.checked; })} /> <span>{r.title}</span>
              </label>
              <Select data-s="setup-stage" data-i={i} aria-label={`Stage for ${r.title}`} value={r.stage} onChange={e => change(i, x => { if (STARTER_STAGES.includes(e.target.value)) x.stage = e.target.value; })}>
                {STARTER_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          ))}
        </>
      )}
      <p className="text-[15px] text-fg-2 mt-3">Starter stages: {STARTER_STAGES.join(', ')}. Rename, reorder or remove them any time.</p>
      <div className="grid gap-2.5">
        {rows.length > 0 && <Button variant="primary" data-action="s-setup" data-with="1" onClick={() => create(true)}>Create my roadmap</Button>}
        <Button variant={rows.length ? 'tonal' : 'primary'} data-action="s-setup" data-with="0" onClick={() => create(false)}>Start with empty stages</Button>
      </div>
    </Card>
  );
}

// A small revision preview: concept names only (never answers), and a separate button to start.
function RevisionCard({ data }: { data: MyDayData }) {
  const st = data.study, k = todayKey();
  if (!st.concepts.length) return null;
  const due = dueConcepts(st, k), needQ = st.concepts.filter(c => !questionReady(c)).length, nextDate = nextReviewDate(st, k);
  return (
    <Card id="stRevision" aria-labelledby="rev-h">
      <h3 id="rev-h">Revision</h3>
      {due.length ? (
        <>
          <p className="text-[15px]">Ready to revise: {due.slice(0, 3).map(c => c.title).join(', ')}{due.length > 3 ? ' and more' : ''}.</p>
          <Button data-action="s-rev-start" onClick={startRevision}><RotateCcw size={18} aria-hidden="true" /> Start revision</Button>
        </>
      ) : <p className="text-[15px] text-fg-2 m-0">Nothing to revise right now{nextDate ? ` — next on ${shortDate(nextDate)}` : ''}.</p>}
      {needQ > 0 && <p className="text-[15px] text-fg-2 mt-2.5 mb-0">{needQ} concept{needQ === 1 ? ' needs' : 's need'} a revision question. <InlineLink href="#study/concepts">Add questions</InlineLink></p>}
    </Card>
  );
}

// The opening screen: what to do next, ready to start. Everything else is one tap away.
export function Dashboard({ data, lengths, setLength }: { data: MyDayData; lengths: Record<string, number>; setLength: (key: string, m: number) => void }) {
  const st = data.study;
  if (!st.stages.length) return <SetupCard data={data} />;
  const ix = stIndex(st), c = focusCourse(st, ix);
  if (!c) {
    return (
      <Card tone="accent" className="next-card"><Eyebrow>Current focus</Eyebrow><h2>No courses yet</h2>
        <p className="text-[15px] text-fg-2">Add a course to one of your stages to get started.</p>
        <TextLink href="#study/roadmap">Open the roadmap</TextLink></Card>
    );
  }
  const t = nextTaskIn(ix, c), comp = completion(ix.courseTasks.get(c.id)!);
  const link = (t && t.url) || c.url, cur = activeStudy(st);
  const others = [...ix.course.values()].map(e => e.node).filter(x => x !== c && !x.archived);

  // The length for a session: your choice this visit, or the suggestion (energy, free time).
  const startBlock = (base: number) => {
    const sug = suggestLength(data, base), key = t ? t.id : c.id, m = lengths[key] || sug.minutes;
    return (
      <>
        <div className="st-len flex items-center justify-center gap-4 mt-3.5 mb-1.5" role="group" aria-label="Session length">
          <button type="button" className="size-12 rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer disabled:opacity-40" data-action="s-len" data-d="-5" aria-label="5 minutes shorter" disabled={m <= 5} onClick={() => setLength(key, Math.max(5, m - 5))}><Minus size={20} aria-hidden="true" /></button>
          <span className="text-lg min-w-[4.5em] text-center"><strong id="stLen" className="text-[26px] tabular-nums">{m}</strong> min</span>
          <button type="button" className="size-12 rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer disabled:opacity-40" data-action="s-len" data-d="5" aria-label="5 minutes longer" disabled={m >= 240} onClick={() => setLength(key, Math.min(240, m + 5))}><Plus size={20} aria-hidden="true" /></button>
        </div>
        <p className="text-[15px] text-fg-2 text-center mb-2.5">{lengths[key] ? 'Your choice.' : sug.why.length ? `Suggested: ${sug.why.join(' · ')}.` : `The ${t ? 'task' : 'course'}'s usual length.`} Change it if you like.</p>
        <div className="grid gap-2.5">
          <Button variant="primary" data-action="s-start" onClick={() => startLearning(c.id, t ? t.id : null, m, false)}><Play size={18} aria-hidden="true" /> Start learning · {m} min</Button>
          {m > 15 && <Button data-action="s-start" data-short="1" onClick={() => startLearning(c.id, t ? t.id : null, 15, true)}>Just 15 minutes</Button>}
        </div>
      </>
    );
  };

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-x-6 lg:items-start">
      <div className="min-w-0">
        {cur && (
          <Card tone="accent" className="next-card">
            <Eyebrow>In progress{cur.runningSince ? '' : ' · paused'}</Eyebrow>
            <h2>{cur.title}</h2>
            <p className="text-[15px] text-fg-2">{sessionMinutes(cur)} min so far</p>
            <a className="inline-flex items-center justify-center min-h-tap w-full rounded-btn bg-primary text-on-primary font-[650] shadow-raised" href="#study/session">{cur.runningSince ? 'Back to the session' : 'Resume'}</a>
          </Card>
        )}
        <Card tone="accent" id="stFocus" className="next-card" aria-labelledby="focus-h">
          <Eyebrow>Current focus</Eyebrow>
          <h2 id="focus-h" className="st-course-title">{c.title}</h2>
          {cur ? <p className="text-[15px]">A session is in progress — finish or resume it before starting another.</p>
            : t ? (
              <>
                <p className="st-path text-[13px] text-fg-3 m-0 mt-1">{taskPath(ix, t.id)}</p>
                <p className="st-next text-[19px] font-[650] mt-1.5 mb-0.5">{t.title}</p>
                <p className="text-[15px] text-fg-2 m-0">About {fmtDuration(t.minutes)}{t.kind === 'practical' ? ' · Practical' : ''}</p>
                {startBlock(t.minutes)}
              </>
            ) : !comp.total ? (
              <>
                <p className="text-[15px]">This course has no sections or tasks yet. You can still start a session and add them later.</p>
                {startBlock(c.minutes)}
                <TextLink href="#study/roadmap">Add its modules and sections</TextLink>
              </>
            ) : <p className="text-[15px]">Every task in this course is marked complete.</p>}
          {link && <div className="mt-1"><ExternalLink href={link}>Open the course link</ExternalLink></div>}
        </Card>
        <Card aria-labelledby="comp-h">
          <h3 id="comp-h">Course completion</h3>
          <p className="text-[15px] m-0">{completionText(comp)}</p>
          <Bar c={comp} />
          <p className="text-[15px] text-fg-2 mt-1.5 mb-0">Counts tasks you've marked complete — not how well you know them.</p>
        </Card>
      </div>
      <div className="min-w-0">
        <RevisionCard data={data} />
        <Card aria-label="More in Study">
          <nav className="st-links flex flex-wrap gap-x-5" aria-label="Study">
            <TextLink href="#study/roadmap">Roadmap</TextLink><TextLink href="#study/concepts">Concepts</TextLink>
            <TextLink href="#study/progress">Progress &amp; history</TextLink><TextLink href="#study/settings">Settings</TextLink>
          </nav>
          {others.length > 0 && (
            <details className="group mt-1">
              <Summary>Other courses ({others.length})</Summary>
              {others.map(o => (
                <div key={o.id} className="c-row flex justify-between items-center gap-2.5 py-2.5 border-t border-outline">
                  <div className="min-w-0"><strong>{o.title}</strong><div className="text-sm text-fg-3">{completionText(completion(ix.courseTasks.get(o.id)!))}</div></div>
                  <Button inline className="flex-none" data-action="s-focus" data-id={o.id} onClick={() => setFocus(o.id)}>Focus on this</Button>
                </div>
              ))}
            </details>
          )}
        </Card>
      </div>
    </div>
  );
}
