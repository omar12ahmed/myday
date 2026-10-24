import { ArrowUpRight, BookOpen, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Saying } from '../components/Saying';
import { Field, Select, TextInput } from '../components/Field';
import { fmtDuration, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { ROUND_SIZE, STARTER_STAGES } from '../data/study/common';
import { dueIds } from '../data/study/queue';
import { DAILY_ENOUGH, dueConcepts, questionReady, reviewedOn } from '../data/study/revision';
import { applySetup, completion, completionText, proposeSetup, stIndex, taskPath, type SetupRow, type StudyIndex } from '../data/study/roadmap';
import { addTopic, studiedText, TOPIC_LIMITS, topicGlance, topicOfStage, topicPath, topicsOf, type TopicGlance } from '../data/study/topics';
import { activeStudy, sessionMinutes } from '../data/study/sessions';
import { focusableCourses } from '../data/study/yourFocus';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { focusOn, startRevision } from './actions';
import { optionAction, roadmapOption, type LearningOption } from './courseOption';
import { FocusSelect } from './FocusSelect';
import type { LearningGlance } from './nextLearning';
import { Bar, Eyebrow, ExternalLink, InlineLink, Meta, Row, Summary, TextLink } from './parts';
import { StartBlock } from './StartBlock';
import { LessonOption } from './StudyTodayCard';
import { useNextLearning } from './useNextLearning';
import { CyberCard } from './cybersecurity/CyberCard';
import { ArabicCard } from './arabic/ArabicCard';
import { StudyTabs } from './StudyTabs';

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
      <p className="text-[15px] text-fg-2">Bring your own courses and organise them into small, manageable steps. Add the details as you learn.</p>
      {rows.length > 0 && (
        <details className="group my-4 rounded-tile bg-surface-2 px-3">
          <Summary>Review {rows.length} suggested courses</Summary>
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
        </details>
      )}
      <p className="text-sm text-fg-2 mt-3">Start with your learning list or an empty roadmap. You can rename and organise its stages any time.</p>
      <div className="grid gap-2.5">
        {rows.length > 0 && <Button variant="primary" data-action="s-setup" data-with="1" onClick={() => create(true)}>Create my roadmap</Button>}
        <Button variant={rows.length ? 'tonal' : 'primary'} data-action="s-setup" data-with="0" onClick={() => create(false)}>Start with empty stages</Button>
      </div>
    </Card>
  );
}

// ---------- Now: one card with your focus's next step ----------
// A Study session already under way replaces it: pick up where you left off.
function SessionNow({ cur }: { cur: NonNullable<ReturnType<typeof activeStudy>> }) {
  return (
    <Card tone="accent" className="next-card" id="stNow" data-now="session" aria-labelledby="now-h">
      <Eyebrow>Pick up where you left off</Eyebrow>
      <h2 id="now-h">{cur.title}</h2>
      <p className="text-[15px] text-fg-2">{cur.runningSince ? 'In progress' : 'In progress · paused'} · {sessionMinutes(cur)} min so far</p>
      <a className="inline-flex items-center justify-center min-h-tap w-full rounded-btn bg-primary text-on-primary font-[650] shadow-raised no-underline" href="#study/session" data-action="study-now">{cur.runningSince ? 'Back to the session' : 'Resume'}</a>
    </Card>
  );
}

const Why = ({ text }: { text: string }) => (
  <details className="mt-2 mb-1" data-s="option-why"><summary className="cursor-pointer min-h-11 flex items-center text-primary font-semibold text-[15px]">Why this?</summary>
    <p className="text-[15px] text-fg-2 mt-0 mb-1">{text}</p></details>
);

// Folded under the Now card, as on Today: the other subjects' next steps (opening one makes it your focus) and the
// focus choice itself, for one of your own courses by name.
function OtherSubjects({ data, others }: { data: MyDayData; others: LearningOption[] }) {
  return (
    <details className="rounded-tile border border-outline p-3 mt-4" data-s="study-other-subjects">
      <summary className="cursor-pointer min-h-11 flex items-center text-primary font-semibold">Choose another subject</summary>
      {others.length > 0 && <div className="grid gap-2 mt-2">{others.map(o => <LessonOption key={o.subject} option={o} />)}</div>}
      <div className="mt-3"><FocusSelect data={data} id="studyFocusHome" /></div>
    </details>
  );
}

// Your focus's next step: the first of the same options as Today's Study card (nextLearning.ts), so both say the
// same, with "Why this?". One of your courses keeps its session length and Start here.
function FocusNow({ data, now, others, ix, lengths, setLength }: {
  data: MyDayData; now: LearningOption; others: LearningOption[] | null; ix: StudyIndex; lengths: Record<string, number>; setLength: (key: string, m: number) => void;
}) {
  const st = data.study;
  // Your focus is your courses, but none has a task left (or you haven't added one): the next step is in another
  // subject, and says so.
  const elsewhere = st.settings.primarySubject === 'roadmap' && now.subject !== 'roadmap', noCourses = !focusableCourses(ix).length;
  const more = others && <OtherSubjects data={data} others={others} />;
  if (now.subject === 'roadmap') {
    const e = ix.course.get(now.courseId!), t = now.taskId ? ix.task.get(now.taskId)?.node ?? null : null;
    if (!e) return null;
    const c = e.node, comp = completion(ix.courseTasks.get(c.id)!), link = (t && t.url) || c.url;
    const topic = st.topics?.length ? topicsOf(st).find(x => x.id === topicOfStage(st, e.stage))?.title : undefined;
    return (
      <Card tone="accent" id="stFocus" className="next-card" data-now="roadmap" aria-labelledby="focus-h">
        <Eyebrow>Your focus{topic ? ` · ${topic}` : ''}</Eyebrow>
        <h2 id="focus-h" className="st-course-title">{c.title}</h2>
        {t && <>
          <p className="st-path text-[13px] text-fg-3 m-0 mt-1">{taskPath(ix, t.id)}</p>
          <p className="st-next text-[19px] font-[650] mt-1.5 mb-0.5">{t.title}</p>
          <p className="text-[15px] text-fg-2 m-0">About {fmtDuration(t.minutes)}{t.kind === 'practical' ? ' · Practical' : ''}</p>
        </>}
        {!t && <p className="text-[15px] mt-2 mb-0">This course has no sections or tasks yet. You can still start a session and add them later. <InlineLink href="#study/roadmap">Add its modules and sections</InlineLink></p>}
        <Why text={now.why} />
        <StartBlock data={data} course={c} task={t} lengths={lengths} setLength={setLength} />
        {link && <div className="mt-1"><ExternalLink href={link}>Open the course link</ExternalLink></div>}
        {comp.total > 0 && (
          <div className="mt-3 pt-3 border-t border-outline" data-s="focus-completion">
            <p className="text-[15px] m-0">{completionText(comp)}</p>
            <Bar c={comp} />
            <p className="text-sm text-fg-3 m-0 mt-1">Counts tasks you've marked complete — not how well you know them.</p>
          </div>
        )}
        {more}
      </Card>
    );
  }
  return (
    <Card tone="accent" id="stFocus" className="next-card" data-now={now.subject} aria-labelledby="focus-h">
      <Eyebrow>{now.resume ? 'Pick up where you left off' : elsewhere ? 'Up next' : 'Your focus'} · {now.label}</Eyebrow>
      <h2 id="focus-h">{now.title}</h2>
      {elsewhere && <p className="text-[15px] m-0 mb-2" data-s="focus-elsewhere">{noCourses ? 'You haven’t added a course of your own yet' : 'None of your courses has a task left to do'}, so here’s your next lesson in {now.label}. <InlineLink href="#study/roadmap">{noCourses ? 'Add a course' : 'Add tasks'}</InlineLink></p>}
      <p className="text-[15px] text-fg-2 m-0" data-s="option-detail">{now.detail}</p>
      {/* Only Arabic's length follows your energy and free time; a Cybersecurity lesson's is its usual length. */}
      <p className="text-sm text-fg-3 m-0 mt-1">About {now.minutes} min{now.subject === 'arabic' && !now.resume ? ' suits today' : ''}</p>
      <Why text={now.why} />
      {now.revise ? <div className="grid gap-2.5 mt-2">
          <Button variant="primary" data-action="study-now" onClick={() => { focusOn(now); startRevision(now.revise); }}><RotateCcw size={18} aria-hidden="true" /> {optionAction(now)}</Button>
          <TextLink href={now.href} className="justify-center" data-action="option-lesson">Go to the lesson</TextLink>
        </div>
        : <a className="inline-flex items-center justify-center min-h-tap w-full rounded-btn bg-primary text-on-primary font-[650] shadow-raised no-underline mt-2" href={now.href} onClick={() => focusOn(now)} data-action="study-now">{optionAction(now)}</a>}
      {more}
    </Card>
  );
}

// ---------- Worth a look: at most three gentle offers, none when there's nothing ----------
// Never a backlog, nothing "overdue": revision ready (unless today's gentle stop is reached), a session left open in
// another subject, an Arabic lesson that needs revision, concepts still without a question.
interface Offer { key: string; title: string; detail?: string; href?: string; run?: () => void; label: string }
function offers(data: MyDayData, glance: LearningGlance | null, now: LearningOption | null, k: string): Offer[] {
  const st = data.study, out: Offer[] = [];
  const isNow = (href: string) => now?.href === href;
  if (glance?.arabic.open && !isNow('#study/arabic/' + encodeURIComponent(glance.arabic.open.id)))
    out.push({ key: 'arabic-open', title: 'A session is open in Arabic', detail: glance.arabic.open.title, href: '#study/arabic/' + encodeURIComponent(glance.arabic.open.id), label: 'Pick it up' });
  const cyber = glance?.options.find(o => o.subject === 'cybersecurity' && o.resume);
  if (cyber && !isNow(cyber.href)) out.push({ key: 'cyber-open', title: 'A session is open in Cybersecurity', detail: cyber.title, href: cyber.href, label: 'Pick it up' });
  // When the Now card is Arabic revision, its cards aren't offered again here.
  const arabic = now?.revise ? 0 : dueIds(data, k, 'arabic').length, due = dueIds(data, k).length - (now?.revise ? dueIds(data, k, 'arabic').length : 0);
  if (due > 0 && reviewedOn(st, k) < DAILY_ENOUGH) {
    const concepts = dueConcepts(st, k), cyberDue = dueIds(data, k, 'cybersecurity').length;
    const names = concepts.slice(0, 3).map(c => c.title).join(', ') + (concepts.length > 3 ? ' and more' : '');
    const cards = [arabic && `${arabic} Arabic card${arabic === 1 ? '' : 's'}`, cyberDue && `${cyberDue} Cybersecurity check${cyberDue === 1 ? '' : 's'}`].filter(Boolean).join(' and ');
    out.push({ key: 'revision', title: `Revision ready: ${due > ROUND_SIZE ? `a round of ${ROUND_SIZE}` : `${due} question${due === 1 ? '' : 's'}`}`,
      detail: names && cards ? `${names}, plus ${cards}` : names || cards, run: () => startRevision(), label: 'Revise' });
  }
  for (const l of glance?.arabic.needs ?? []) if (!isNow('#study/arabic/' + encodeURIComponent(l.id)))
    out.push({ key: 'needs-' + l.id, title: `${l.title} needs revision`, href: '#study/arabic/' + encodeURIComponent(l.id), label: 'Open lesson' });
  const needQ = st.concepts.filter(c => !questionReady(c)).length;
  if (needQ) out.push({ key: 'questions', title: `${needQ} concept${needQ === 1 ? ' needs' : 's need'} a revision question`, href: '#study/concepts', label: 'Add questions' });
  return out.slice(0, 3);
}
function WorthALook({ items }: { items: Offer[] }) {
  if (!items.length) return null;
  return (
    <Card aria-labelledby="worth-h" data-s="worth-a-look">
      <h3 id="worth-h">Worth a look</h3>
      {items.map(o => (
        <Row key={o.key}>
          <div className="min-w-0" data-worth={o.key} id={o.key === 'revision' ? 'stRevision' : undefined}>
            <strong className="block">{o.title}</strong>{o.detail && <Meta>{o.detail}</Meta>}
          </div>
          {o.run ? <Button inline className="flex-none" data-action={o.key === 'revision' ? 's-rev-start' : undefined} onClick={o.run}><RotateCcw size={18} aria-hidden="true" /> {o.label}</Button>
            : <TextLink href={o.href} className="flex-none" data-ar-resume={o.key === 'arabic-open' ? '' : undefined}>{o.label}</TextLink>}
        </Row>
      ))}
    </Card>
  );
}

// ---------- Explore: your map, then your subjects as tiles, each with its places in counts ----------
function ReadingTile({ data }: { data: MyDayData }) {
  const books = data.reading.books.filter(b => !b.finishedOn), reading = books.filter(b => b.page > 0).length;
  return (
    <a href="#study/reading" data-s="reading-tile" className="study-tile block bg-surface border border-outline rounded-card shadow-card p-4 mb-4 text-fg no-underline hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary">
      <span className="flex items-center gap-2.5 text-[18px] font-semibold"><BookOpen size={18} strokeWidth={1.6} aria-hidden="true" className="text-fg-3" />Reading</span>
      <span className="block text-[15px] mt-1.5 text-fg-2">{books.length ? `${books.length} book${books.length === 1 ? '' : 's'} on the go${reading ? ` · ${reading} started` : ''}` : 'The books you’re reading, where you are and your notes.'}</span>
    </a>
  );
}

// With no roadmap yet: a quiet way to bring your own courses (the roadmap page offers the setup).
function SetupTile() {
  return (
    <a href="#study/roadmap" data-s="setup-tile" className="study-tile block bg-surface border border-dashed border-outline-strong rounded-card p-4 mb-4 text-fg no-underline hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary">
      <span className="flex items-center gap-2.5 text-[18px] font-semibold"><Plus size={18} aria-hidden="true" className="text-primary" />Your own courses</span>
      <span className="block text-[15px] mt-1.5 text-fg-2">Bring a course of your own (a book, an app or a class) and take it in small steps.</span>
    </a>
  );
}

const pickGlance = (m: typeof import('./nextLearning'), d: MyDayData) => m.learningGlance(d);

// The opening screen on three levels (specs/study-home-and-lessons.md §4): Now (your focus's next step, the same as
// Today's), Worth a look (a few gentle offers), Explore (your map and subjects); Manage folded at the bottom.
export function Dashboard({ data, lengths, setLength }: { data: MyDayData; lengths: Record<string, number>; setLength: (key: string, m: number) => void }) {
  const st = data.study, ix = stIndex(st), cur = activeStudy(st), k = todayKey();
  const glance = useNextLearning(data, pickGlance);
  // One of your courses needs no catalogue, so it shows before the guided subjects have loaded.
  const now = glance?.options[0] ?? (st.settings.primarySubject === 'roadmap' ? roadmapOption(data) : null);
  const items = offers(data, glance ?? null, cur ? null : now, k);
  const glances = st.stages.length ? topicsOf(st).map(t => topicGlance(st, ix, t.id)!).filter(Boolean) : [];
  // The guided course is the single Cybersecurity entry. Older roadmap courses remain accessible inside it.
  const cyberTopics = glances.filter(g => g.topic.title.trim().toLowerCase() === 'cybersecurity');

  return (
    <div className="study-home">
      <StudyTabs on="courses" />
      <Saying place="study" className="mb-5" />
      <div className={items.length ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-x-6 lg:items-start' : 'lg:max-w-[760px]'}>
        <div className="min-w-0">
          {cur ? <SessionNow cur={cur} />
            : now ? <FocusNow data={data} now={now} others={glance ? glance.options.slice(1) : null} ix={ix} lengths={lengths} setLength={setLength} />
            : <Card tone="accent" className="next-card min-h-[200px]" id="stFocus" data-now={glance === undefined ? 'unavailable' : 'loading'}><Eyebrow>Your focus</Eyebrow>
              <p role="status" className="text-[15px] text-fg-2">{glance === undefined ? 'Your next step couldn’t be worked out just now. Every subject below still opens, and it tries again as you go.' : 'Finding your next step…'}</p></Card>}
        </div>
        {items.length > 0 && <div className="min-w-0"><WorthALook items={items} /></div>}
      </div>

      <section aria-labelledby="explore-h" id="studyHome" className="mt-2 mb-4">
        <h3 id="explore-h" className="px-1">Explore</h3>
        {st.stages.length > 0 && <a href="#study/map" data-s="study-map-link" className="flex items-center justify-between gap-3 min-h-12 mb-4 px-4 py-3 rounded-card border border-outline bg-surface text-fg no-underline hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary">
          <span><strong className="block">Your map</strong><span className="text-sm text-fg-2">Your courses as a map, each stage a line and each course a station, for exploring and the long view.</span></span>
          <ArrowUpRight size={19} aria-hidden="true" className="flex-none text-primary" />
        </a>}
        <div className="grid gap-x-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
          <ArabicCard counts={glance?.arabic} />
          <CyberCard roadmaps={cyberTopics} counts={glance?.cyber} />
          {glances.filter(g => !cyberTopics.includes(g)).map(g => <TopicCard key={g.topic.id || 'main'} g={g} k={k} />)}
          <ReadingTile data={data} />
          {st.stages.length > 0 ? <AddTopicCard data={data} /> : <SetupTile />}
        </div>
      </section>

      <Card aria-label="Manage Study" className="py-2 lg:py-2">
        <details className="group" data-s="study-manage">
          <Summary>Manage: the whole roadmap, concepts, progress and settings</Summary>
          <nav className="st-links flex flex-wrap gap-x-5 pb-2" aria-label="Manage Study">
            <TextLink href="#study/roadmap">Whole roadmap</TextLink><TextLink href="#study/concepts">Concepts</TextLink>
            <TextLink href="#study/progress">Progress &amp; history</TextLink><TextLink href="#study/settings">Settings and reset</TextLink>
          </nav>
        </details>
      </Card>
    </div>
  );
}

// One topic on the home page: its next step, progress and when you last studied it. The whole card opens its page.
function TopicCard({ g, k }: { g: TopicGlance; k: string }) {
  return (
    <a href={'#' + topicPath(g.topic.id)} className="topic-card block bg-surface border border-outline rounded-card shadow-card p-4 mb-4 text-fg no-underline hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary" data-id={g.topic.id}>
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
      <button type="button" className="topic-add flex items-center justify-center gap-2 w-full min-h-[88px] mb-4 rounded-card border border-dashed border-outline-strong bg-transparent text-primary font-semibold text-[15px] cursor-pointer hover:bg-surface-2"
        data-action="topic-add" onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Add a topic</button>
    );
  }
  return (
    <form className="topic-add rounded-card border border-outline bg-surface p-4 mb-4" onSubmit={e => { e.preventDefault(); add(); }}>
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
