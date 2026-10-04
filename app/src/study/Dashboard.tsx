import { Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, Select, TextInput } from '../components/Field';
import { fmtDuration, shortDate, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { STARTER_STAGES } from '../data/study/common';
import { dueConcepts, nextReviewDate, questionReady } from '../data/study/revision';
import { applySetup, completion, completionText, focusCourse, nextTaskIn, proposeSetup, stIndex, taskPath, type SetupRow } from '../data/study/roadmap';
import { addTopic, studiedText, TOPIC_LIMITS, topicGlance, topicPath, topicsOf, type TopicGlance } from '../data/study/topics';
import { activeStudy, sessionMinutes } from '../data/study/sessions';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { startRevision } from './actions';
import { Bar, Eyebrow, ExternalLink, InlineLink, TextLink } from './parts';
import { StartBlock } from './StartBlock';

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

// The opening screen, like a home page: what's in progress, what's up next (ready to start), and your topics
// (e.g. Cybersecurity, Arabic) — each with its next step and progress, one tap from its own page.
export function Dashboard({ data, lengths, setLength }: { data: MyDayData; lengths: Record<string, number>; setLength: (key: string, m: number) => void }) {
  const st = data.study;
  if (!st.stages.length) return <SetupCard data={data} />;
  const ix = stIndex(st), c = focusCourse(st, ix), cur = activeStudy(st), k = todayKey();
  const glances = topicsOf(st).map(t => topicGlance(st, ix, t.id)!).filter(Boolean);
  const named = !!st.topics?.length;
  const focusTopic = c ? glances.find(g => g.isFocus) : undefined;
  const t = c ? nextTaskIn(ix, c) : null, comp = c ? completion(ix.courseTasks.get(c.id)!) : null;
  const link = c ? (t && t.url) || c.url : '';

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
        {c ? (
          <Card tone="accent" id="stFocus" className="next-card" aria-labelledby="focus-h">
            <Eyebrow>Current focus{named && focusTopic ? ` · ${focusTopic.topic.title}` : ''}</Eyebrow>
            <h2 id="focus-h" className="st-course-title">{c.title}</h2>
            {cur ? <p className="text-[15px]">A session is in progress — finish or resume it before starting another.</p>
              : t ? (
                <>
                  <p className="st-path text-[13px] text-fg-3 m-0 mt-1">{taskPath(ix, t.id)}</p>
                  <p className="st-next text-[19px] font-[650] mt-1.5 mb-0.5">{t.title}</p>
                  <p className="text-[15px] text-fg-2 m-0">About {fmtDuration(t.minutes)}{t.kind === 'practical' ? ' · Practical' : ''}</p>
                  <StartBlock data={data} course={c} task={t} lengths={lengths} setLength={setLength} />
                </>
              ) : !comp!.total ? (
                <>
                  <p className="text-[15px]">This course has no sections or tasks yet. You can still start a session and add them later.</p>
                  <StartBlock data={data} course={c} task={null} lengths={lengths} setLength={setLength} />
                  <TextLink href="#study/roadmap">Add its modules and sections</TextLink>
                </>
              ) : <p className="text-[15px]">Every task in this course is marked complete.</p>}
            {link && <div className="mt-1"><ExternalLink href={link}>Open the course link</ExternalLink></div>}
            {comp!.total > 0 && (
              <div className="mt-3 pt-3 border-t border-outline" data-s="focus-completion">
                <p className="text-[15px] m-0">{completionText(comp!)}</p>
                <Bar c={comp!} />
                <p className="text-sm text-fg-3 m-0 mt-1">Counts tasks you've marked complete — not how well you know them.</p>
              </div>
            )}
          </Card>
        ) : (
          <Card tone="accent" className="next-card"><Eyebrow>Current focus</Eyebrow><h2>No courses yet</h2>
            <p className="text-[15px] text-fg-2">Add a course to one of your topics to get started.</p></Card>
        )}
        <section aria-labelledby="topics-home-h" id="studyHome" className="mb-4">
          <h3 id="topics-home-h" className="px-1 mt-5">Your topics</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {glances.map(g => <TopicCard key={g.topic.id || 'main'} g={g} k={k} />)}
            <AddTopicCard data={data} />
          </div>
        </section>
      </div>
      <div className="min-w-0">
        <RevisionCard data={data} />
        <Card aria-label="More in Study">
          <nav className="st-links flex flex-wrap gap-x-5" aria-label="Study">
            <TextLink href="#study/roadmap">Whole roadmap</TextLink><TextLink href="#study/concepts">Concepts</TextLink>
            <TextLink href="#study/progress">Progress &amp; history</TextLink><TextLink href="#study/settings">Settings</TextLink>
          </nav>
        </Card>
      </div>
    </div>
  );
}

// One topic on the home page: its next step, progress and when you last studied it. The whole card opens its page.
function TopicCard({ g, k }: { g: TopicGlance; k: string }) {
  return (
    <a href={'#' + topicPath(g.topic.id)} className="topic-card block bg-surface border border-outline rounded-card shadow-card p-4 text-fg no-underline hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary" data-id={g.topic.id}>
      <span className="flex items-start justify-between gap-2">
        <span className="topic-title text-[18px] font-semibold leading-snug min-w-0 break-words">{g.topic.title}</span>
        {g.isFocus && <span className="flex-none text-xs font-bold tracking-[.06em] uppercase px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container" data-s="topic-focus">Focus</span>}
      </span>
      <span className="block text-[15px] mt-1.5 text-fg-2" data-s="topic-next">
        {!g.next ? 'No courses yet — add the first one.' : g.nextTask ? <>Next: <span className="text-fg font-medium">{g.nextTask.title}</span> <span className="text-fg-3">· {g.next.title}</span></> : <>{g.next.title}{g.comp.total && g.comp.done === g.comp.total ? ' — all tasks complete' : ''}</>}
      </span>
      {g.comp.total > 0 && <Bar c={g.comp} />}
      {g.courses.length > 0 && <span className="flex flex-wrap justify-between gap-x-3 text-sm text-fg-3 mt-1 tabular-nums">
        <span data-s="topic-comp">{g.comp.total ? `${g.comp.done} of ${g.comp.total} tasks · ${g.courses.length} course${g.courses.length === 1 ? '' : 's'}` : `No tasks added yet · ${g.courses.length} course${g.courses.length === 1 ? '' : 's'}`}</span>
        <span data-s="topic-last">{studiedText(g.lastStudied, k)}</span>
      </span>}
    </a>
  );
}

// "+ Add a topic" at the end of the topics: a name, then straight to its page to add its first course.
function AddTopicCard({ data }: { data: MyDayData }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  function add() {
    let id: string | null = null;
    update(d => { id = addTopic(d.study, name); if (!id) return false; });
    if (!id) { toast((data.study.topics?.length ?? 0) >= TOPIC_LIMITS.topics ? `That's the most topics (${TOPIC_LIMITS.topics}).` : 'That name is empty or already used.'); return; }
    toast(`Added “${name.trim()}”.`);
    location.hash = topicPath(id);
  }
  if (!adding) {
    return (
      <button type="button" className="topic-add flex items-center justify-center gap-2 min-h-[88px] rounded-card border border-dashed border-outline-strong bg-transparent text-primary font-semibold text-[15px] cursor-pointer hover:bg-surface-2"
        data-action="topic-add" onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Add a topic</button>
    );
  }
  return (
    <form className="topic-add rounded-card border border-outline bg-surface p-4" onSubmit={e => { e.preventDefault(); add(); }}>
      <Field label="New topic" htmlFor="topicNew">
        <TextInput id="topicNew" value={name} maxLength={TOPIC_LIMITS.title} autoFocus onChange={e => setName(e.target.value)} placeholder="e.g. Arabic, Business, Cooking" />
      </Field>
      <span className="flex gap-2 mt-2.5">
        <Button inline type="submit" variant="primary" data-action="topic-save" disabled={!name.trim()}>Add</Button>
        <Button inline variant="ghost" data-action="topic-cancel" onClick={() => { setAdding(false); setName(''); }}>Cancel</Button>
      </span>
      {!data.study.topics?.length && <p className="text-sm text-fg-2 m-0 mt-2">Your roadmap so far becomes the first topic; nothing in it changes.</p>}
    </form>
  );
}
