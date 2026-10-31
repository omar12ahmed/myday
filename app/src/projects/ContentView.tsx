import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select, TextInput } from '../components/Field';
import { BackLink, ExternalLink, LinkButton } from '../components/parts';
import {
  addClip, addExample, addIdea, addLine, addOption, addPost, addResult, addVideo, chooseOption, CONTENT_LIMITS, contentOf, deleteVideo, editLine, editVideo,
  isPosted, lineTask, makeVideo, moveLine, nextPost, OPTION_KINDS, PLATFORMS, platformLabel, postTask, removeClip, removeExample, removeLine, removeOption,
  removePost, removeResult, RESULT_FIELDS, RESULT_LABEL, resultWords, setPostDay, setStep, stepCounts, stepLabel, stepOf, STEPS, stillOpen, tickLine, tooBig, videoById, videoOf,
  type LineList, type ResultField, type Video,
} from '../data/content';
import { isDateKey, shortDate, todayKey } from '../data/dates';
import { filesLeaving } from '../data/files';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { ContentItem, ContentStep, DateKey, MyDayData, Project } from '../data/types';
import { FilesCard } from '../files/FilesCard';

// Content projects (specs/projects-content.md): a channel's or series' ideas and videos, planning first. The rules are
// in data/content.ts. Never sent to AI in this release.
const enc = encodeURIComponent;
const videoHref = (p: Project, id?: string) => `#projects/p/${enc(p.id)}/videos${id ? `/${enc(id)}` : ''}`;
const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const save = (fn: (d: MyDayData) => boolean) => update(d => (fn(d) ? undefined : false));

// ---------- The Overview's card ----------
// How many at each step and the next planned post day, opening the Videos tab.
export function ContentCard({ data, p }: { data: MyDayData; p: Project }) {
  const n = stepCounts(data, p.id), next = nextPost(data, p.id), k = todayKey();
  const parts = STEPS.filter(s => n[s.id]).map(s => `${n[s.id]} ${s.id === 'idea' ? (n[s.id] === 1 ? 'idea' : 'ideas') : s.label.toLowerCase()}`);
  return (
    <Card aria-labelledby="pjContentH" id="projectContent">
      <h3 id="pjContentH" className="m-0">Videos</h3>
      <p className="m-0 mt-2 text-[15px]" data-s="content-counts">{parts.length ? parts.join(' · ') : 'No ideas or videos yet — start with an idea.'}</p>
      {next && <p className="m-0 mt-1 text-[15px] text-fg-2" data-s="content-next-post">Next post: “{videoOf(next.video).title}” {next.day === k ? 'today' : shortDate(next.day)}</p>}
      <a href={videoHref(p)} className="inline-flex items-center min-h-11 mt-1 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4" data-action="content-open">Open Videos</a>
    </Card>
  );
}

// ---------- The Videos tab ----------
export function VideosView({ data, p, videoId }: { data: MyDayData; p: Project; videoId?: string }) {
  if (videoId) {
    const v = videoById(data, videoId);
    if (!v || v.projectId !== p.id) return <Card><p className="m-0">That video isn’t here any more.</p><BackLink to={`projects/p/${p.id}/videos`} label="Videos" /></Card>;
    return <VideoPage key={v.id} data={data} p={p} v={v} />;
  }
  const { ideas, videos } = contentOf(data, p.id);
  return (
    <>
      <IdeasCard p={p} ideas={ideas} />
      <VideoList data={data} p={p} videos={videos} />
    </>
  );
}

// The ideas bank: rough ideas, a title and a line each, newest first; "Make this a video" when you're ready.
function IdeasCard({ p, ideas }: { p: Project; ideas: ContentItem[] }) {
  const [title, setTitle] = useState(''), [line, setLine] = useState('');
  function add() {
    if (!save(d => !!addIdea(d, p.id, title, line))) return;
    setTitle(''); setLine(''); toast('Idea kept.'); focusSoon('ideaNew');
  }
  return (
    <Card aria-labelledby="ideasH" id="contentIdeas">
      <h3 id="ideasH" className="m-0">Ideas <span className="text-fg-3 font-normal tabular-nums">{ideas.length}</span></h3>
      <p className="m-0 mt-1 text-sm text-fg-2">Rough is fine. Nothing here is decided until you make it a video.</p>
      <form className="grid gap-2 mt-3" onSubmit={e => { e.preventDefault(); add(); }} data-s="idea-form">
        <Field label="An idea" htmlFor="ideaNew"><TextInput id="ideaNew" value={title} maxLength={CONTENT_LIMITS.title} placeholder="e.g. A day at the Hargeisa livestock market" onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="A line about it (optional)" htmlFor="ideaLine"><TextInput id="ideaLine" value={line} maxLength={CONTENT_LIMITS.notes} onChange={e => setLine(e.target.value)} /></Field>
        <div><Button inline type="submit" variant="primary" data-action="idea-add" disabled={!title.trim()}><Plus size={18} aria-hidden="true" /> Keep this idea</Button></div>
      </form>
      {ideas.length > 0 && (
        <ul className="list-none p-0 m-0 mt-3">
          {ideas.map(x => { const v = videoOf(x); return (
            <li key={x.id} className="border-t border-outline py-2 flex flex-wrap items-center gap-x-3 gap-y-1" data-s="idea" data-id={x.id}>
              <a href={videoHref(p, x.id)} className="flex-1 min-w-[12rem] min-h-11 py-1 text-fg no-underline hover:underline underline-offset-4 break-words">
                <span className="block font-medium">{v.title}</span>{v.notes && <span className="block text-sm text-fg-2">{v.notes}</span>}
              </a>
              <Button inline variant="ghost" data-action="idea-make" aria-label={`Make “${v.title}” a video`} onClick={() => { if (save(d => makeVideo(d, x.id))) { toast('Now a video, in Planning.'); location.hash = videoHref(p, x.id); } }}>Make this a video</Button>
            </li>
          ); })}
        </ul>
      )}
    </Card>
  );
}

// Your videos by step, each with its planned post day and what's still open; one tap moves it a step on or back.
function VideoList({ data, p, videos }: { data: MyDayData; p: Project; videos: ContentItem[] }) {
  const [title, setTitle] = useState('');
  const k = todayKey(), steps = STEPS.filter(s => s.id !== 'idea');
  function add() {
    let id: string | null = null;
    if (!save(d => !!(id = addVideo(d, p.id, title)))) return;
    setTitle(''); location.hash = videoHref(p, id!);
  }
  function move(x: ContentItem, by: -1 | 1) {
    const i = STEPS.findIndex(s => s.id === stepOf(data, x)), to = STEPS[i + by];
    if (to && save(d => setStep(d, x.id, to.id))) toast(`Moved to ${to.label}.`);
  }
  return (
    <Card aria-labelledby="videosH" id="contentVideos">
      <h3 id="videosH" className="m-0">Videos <span className="text-fg-3 font-normal tabular-nums">{videos.length}</span></h3>
      <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-3" onSubmit={e => { e.preventDefault(); add(); }}>
        <Field label="A new video" htmlFor="videoNew"><TextInput id="videoNew" value={title} maxLength={CONTENT_LIMITS.title} placeholder="A working title" onChange={e => setTitle(e.target.value)} /></Field>
        <Button inline type="submit" variant="tonal" data-action="video-add" disabled={!title.trim()}><Plus size={18} aria-hidden="true" /> Add</Button>
      </form>
      {steps.map(s => {
        const here = videos.filter(x => stepOf(data, x) === s.id);
        if (!here.length) return null;
        return (
          <section key={s.id} aria-labelledby={`step-${s.id}`} className="mt-4" data-s="video-step" data-id={s.id}>
            <h4 id={`step-${s.id}`} className="m-0 text-[15px]">{s.label} <span className="text-fg-3 font-normal tabular-nums">{here.length}</span></h4>
            <ul className="list-none p-0 m-0">
              {here.map(x => { const v = videoOf(x), open = stillOpen(x), i = STEPS.findIndex(t => t.id === s.id); return (
                <li key={x.id} className="border-t border-outline first:border-t-0 py-2 flex flex-wrap items-center gap-x-2 gap-y-1" data-s="video-row" data-id={x.id}>
                  <a href={videoHref(p, x.id)} className="flex-1 min-w-[12rem] min-h-11 py-1 text-fg no-underline hover:underline underline-offset-4 break-words">
                    <span className="block font-medium">{v.title || 'Untitled video'}</span>
                    <span className="block text-sm text-fg-2">{[v.postOn && !isPosted(data, x) ? `Post ${v.postOn === k ? 'today' : shortDate(v.postOn)}` : '', ...open].filter(Boolean).join(' · ') || stepLabel(s.id)}</span>
                  </a>
                  {i > 1 && <Button inline variant="ghost" aria-label={`Move “${v.title}” back to ${STEPS[i - 1].label}`} data-action="video-back" onClick={() => move(x, -1)}><ArrowLeft size={18} aria-hidden="true" /></Button>}
                  {i < STEPS.length - 1 && <Button inline variant="ghost" aria-label={`Move “${v.title}” on to ${STEPS[i + 1].label}`} data-action="video-on" onClick={() => move(x, 1)}><ArrowRight size={18} aria-hidden="true" /></Button>}
                </li>
              ); })}
            </ul>
          </section>
        );
      })}
    </Card>
  );
}

// ---------- A video's page, planning first ----------
function VideoPage({ data, p, v: item }: { data: MyDayData; p: Project; v: ContentItem }) {
  const confirm = useConfirm(), v = videoOf(item), step = stepOf(data, item);
  const edit = (patch: Parameters<typeof editVideo>[2]) => save(d => editVideo(d, item.id, patch));
  async function remove() {
    if (!await confirm({ title: 'Delete this video?', body: 'Its planning, script, transcript, links and results go with it; its tasks stay. Its uploads go to Recently deleted.', confirmLabel: 'Delete', cancelLabel: 'Keep it' })) return;
    if (save(d => { filesLeaving(d, { kind: 'video', id: item.id }); return deleteVideo(d, item.id); })) { toast('Video deleted.'); location.hash = videoHref(p); }
  }
  return (
    <div className="grid gap-3" data-s="video-page" data-id={item.id}>
      <BackLink to={`projects/p/${p.id}/videos`} label="Videos" />
      <Card aria-labelledby="videoTitleH" id="videoHead">
        <h3 id="videoTitleH" tabIndex={-1} className="m-0 text-[22px] break-words">{v.title || 'Untitled video'}</h3>
        <p className="m-0 mt-1 text-sm text-fg-2" data-s="video-step-now">{step === 'idea' ? 'An idea, not decided yet' : stepLabel(step)}{v.postOn && !isPosted(data, item) ? ` · post ${shortDate(v.postOn)}` : ''}</p>
        {tooBig(item) && <p className="m-0 mt-2 text-[15px]" data-s="video-too-big">This video is too big to sync — shorten its transcript or script. It’s still saved on this device.</p>}
        <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="Its step">
          {STEPS.map(s => <Button key={s.id} inline variant={step === s.id ? 'selected' : 'ghost'} aria-pressed={step === s.id} className="!min-h-11" data-action="video-step" data-id={s.id}
            onClick={() => { if (save(d => setStep(d, item.id, s.id as ContentStep))) toast(s.id === 'idea' ? 'Back to an idea.' : `Now ${s.label}.`); }}>{s.label}</Button>)}
        </div>
      </Card>
      <Card aria-labelledby="ideaH" id="videoIdea">
        <h3 id="ideaH" className="m-0">The idea</h3>
        <div className="grid gap-3 mt-3">
          <Field label="Title" htmlFor="videoTitle"><CommitInput id="videoTitle" key={v.title} defaultValue={v.title} maxLength={CONTENT_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = v.title; return; } edit({ title: el.value }); }} /></Field>
          <Field label="Hook — the first few seconds" htmlFor="videoHook"><CommitInput id="videoHook" key={v.hook} defaultValue={v.hook} maxLength={CONTENT_LIMITS.hook} onCommit={el => edit({ hook: el.value })} /></Field>
          <Field label="Notes from when it was an idea" htmlFor="videoNotes"><CommitTextarea id="videoNotes" key={v.notes} rows={3} defaultValue={v.notes} maxLength={CONTENT_LIMITS.notes} onCommit={el => edit({ notes: el.value })} /></Field>
        </div>
      </Card>
      <OptionsCard v={v} />
      <ExamplesCard v={v} />
      <MakeCard data={data} v={v} />
      <Card aria-labelledby="scriptH" id="videoScript">
        <h3 id="scriptH" className="m-0">Script and transcript</h3>
        <div className="grid gap-3 mt-3">
          <Field label="Script" htmlFor="videoScriptText"><CommitTextarea id="videoScriptText" key={`s${v.script.length}`} rows={8} defaultValue={v.script} maxLength={CONTENT_LIMITS.script} onCommit={el => edit({ script: el.value })} /></Field>
          <Field label="Transcript (pasted in)" htmlFor="videoTranscript"><CommitTextarea id="videoTranscript" key={`t${v.transcript.length}`} rows={8} defaultValue={v.transcript} maxLength={CONTENT_LIMITS.transcript} onCommit={el => edit({ transcript: el.value })} /></Field>
        </div>
      </Card>
      <ClipsCard data={data} v={v} />
      <PostingCard data={data} v={v} />
      <ResultsCard v={v} />
      <div><Button inline variant="ghost" data-action="video-delete" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Delete video</Button></div>
    </div>
  );
}

// Options still open: candidate titles, hooks, angles and thumbnail ideas side by side; "Choose this" when you're ready.
function OptionsCard({ v }: { v: Video }) {
  const [kind, setKind] = useState('title'), [words, setWords] = useState(''), [note, setNote] = useState('');
  function add() {
    if (!save(d => !!addOption(d, v.id, kind, words, note))) return;
    setWords(''); setNote(''); toast('Added — it stays open until you choose.'); focusSoon('optionNew');
  }
  return (
    <Card aria-labelledby="optionsH" id="videoOptions">
      <h3 id="optionsH" className="m-0">Options still open</h3>
      <p className="m-0 mt-1 text-sm text-fg-2">Try a few titles, hooks, angles or thumbnail ideas side by side. Choose when you’re ready — the others stay, not chosen.</p>
      {OPTION_KINDS.map(k => {
        const list = v.options.filter(o => o.kind === k.id);
        if (!list.length) return null;
        return (
          <section key={k.id} className="mt-3" data-s="option-kind" data-id={k.id} aria-label={k.label}>
            <h4 className="m-0 text-[15px]">{k.label}</h4>
            <ul className="list-none p-0 m-0">
              {[...list.filter(o => o.chosen), ...list.filter(o => !o.chosen)].map(o => (
                <li key={o.id} className="border-t border-outline first:border-t-0 py-2 flex flex-wrap items-center gap-x-2" data-s="option" data-id={o.id} data-chosen={o.chosen ? 'yes' : 'no'}>
                  <span className="flex-1 min-w-[12rem] break-words"><span className="block">{o.text}{o.chosen && <span className="ml-2 text-sm font-semibold text-primary">Chosen</span>}</span>{o.note && <span className="block text-sm text-fg-2">{o.note}</span>}</span>
                  <Button inline variant={o.chosen ? 'selected' : 'ghost'} aria-pressed={!!o.chosen} data-action="option-choose" onClick={() => { if (save(d => chooseOption(d, v.id, o.id))) toast(o.chosen ? 'Not chosen now — still open.' : `Chosen. The others stay, not chosen.`); }}>{o.chosen ? <><Check size={16} aria-hidden="true" /> Chosen</> : 'Choose this'}</Button>
                  <Button inline variant="ghost" aria-label={`Remove “${o.text}”`} data-action="option-remove" onClick={() => save(d => removeOption(d, v.id, o.id))}><Trash2 size={16} aria-hidden="true" /></Button>
                </li>
              ))}
            </ul>
            {list.some(o => o.chosen) && list.length > 1 && <p className="m-0 text-sm text-fg-3">{plural(list.filter(o => !o.chosen).length, 'other')} not chosen.</p>}
          </section>
        );
      })}
      <form className="grid gap-2 mt-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-end" onSubmit={e => { e.preventDefault(); add(); }} data-s="option-form">
        <Field label="Kind" htmlFor="optionKind"><Select id="optionKind" value={kind} onChange={e => setKind(e.target.value)}>{OPTION_KINDS.map(k => <option key={k.id} value={k.id}>{k.one[0].toUpperCase() + k.one.slice(1)}</option>)}</Select></Field>
        <Field label="Another option" htmlFor="optionNew"><TextInput id="optionNew" value={words} maxLength={CONTENT_LIMITS.option} onChange={e => setWords(e.target.value)} /></Field>
        <Field label="A note (optional)" htmlFor="optionNote" className="sm:col-span-2"><TextInput id="optionNote" value={note} maxLength={CONTENT_LIMITS.note} onChange={e => setNote(e.target.value)} /></Field>
        <div className="sm:col-span-2"><Button inline type="submit" variant="tonal" data-action="option-add" disabled={!words.trim()}><Plus size={18} aria-hidden="true" /> Add option</Button></div>
      </form>
    </Card>
  );
}

// Examples to learn from: another creator's video, what you like about it, and a moment.
function ExamplesCard({ v }: { v: Video }) {
  const [url, setUrl] = useState(''), [note, setNote] = useState(''), [at, setAt] = useState('');
  function add() {
    if (!save(d => !!addExample(d, v.id, url, note, at))) { toast('That doesn’t look like a web address.'); return; }
    setUrl(''); setNote(''); setAt(''); toast('Example kept.'); focusSoon('exampleUrl');
  }
  return (
    <Card aria-labelledby="examplesH" id="videoExamples">
      <h3 id="examplesH" className="m-0">Examples to learn from</h3>
      {v.examples.length > 0 && (
        <ul className="list-none p-0 m-0 mt-2">
          {v.examples.map(x => (
            <li key={x.id} className="border-t border-outline first:border-t-0 py-2 flex flex-wrap items-start gap-x-2" data-s="example" data-id={x.id}>
              <span className="flex-1 min-w-[12rem] break-words"><ExternalLink href={x.url}>{x.title || x.url}</ExternalLink>{(x.at || x.note) && <span className="block text-sm text-fg-2">{[x.at, x.note].filter(Boolean).join(' — ')}</span>}</span>
              <Button inline variant="ghost" aria-label="Remove this example" data-action="example-remove" onClick={() => save(d => removeExample(d, v.id, x.id))}><Trash2 size={16} aria-hidden="true" /></Button>
            </li>
          ))}
        </ul>
      )}
      <form className="grid gap-2 mt-3" onSubmit={e => { e.preventDefault(); add(); }} data-s="example-form">
        <Field label="A video's link" htmlFor="exampleUrl"><TextInput id="exampleUrl" type="url" inputMode="url" value={url} maxLength={CONTENT_LIMITS.url} placeholder="https://…" onChange={e => setUrl(e.target.value)} /></Field>
        <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <Field label="A moment (optional)" htmlFor="exampleAt"><TextInput id="exampleAt" value={at} maxLength={CONTENT_LIMITS.at} placeholder="0:12" onChange={e => setAt(e.target.value)} /></Field>
          <Field label="What you like about it (optional)" htmlFor="exampleNote"><TextInput id="exampleNote" value={note} maxLength={CONTENT_LIMITS.note} placeholder="How they open" onChange={e => setNote(e.target.value)} /></Field>
        </div>
        <div><Button inline type="submit" variant="tonal" data-action="example-add" disabled={!url.trim()}><Plus size={18} aria-hidden="true" /> Add example</Button></div>
      </form>
    </Card>
  );
}

// How to make it: an outline of beats, a shot list, what you need, and steps — a shot or step becomes a task.
const LISTS: { id: LineList; label: string; add: string; placeholder: string; tick?: string }[] = [
  { id: 'outline', label: 'Outline', add: 'Add a beat', placeholder: 'e.g. Open on the gate at dawn' },
  { id: 'shots', label: 'Shot list', add: 'Add a shot', placeholder: 'e.g. Market shots', tick: 'Filmed' },
  { id: 'needs', label: 'What you need', add: 'Add something', placeholder: 'e.g. Clip-on microphone', tick: 'Have it' },
  { id: 'steps', label: 'Steps', add: 'Add a step', placeholder: 'e.g. Ask the stall owner first', tick: 'Done' },
];
function MakeCard({ data, v }: { data: MyDayData; v: Video }) {
  return (
    <Card aria-labelledby="makeH" id="videoMake">
      <h3 id="makeH" className="m-0">How to make it</h3>
      {LISTS.map(l => <LineSection key={l.id} data={data} v={v} list={l} />)}
    </Card>
  );
}
function LineSection({ data, v, list }: { data: MyDayData; v: Video; list: typeof LISTS[number] }) {
  const [text, setText] = useState(''), [where, setWhere] = useState(''), [gear, setGear] = useState(''), [tasking, setTasking] = useState<string | null>(null), [day, setDay] = useState('');
  const lines = v[list.id], k = todayKey(), inputId = `line-${list.id}`;
  function add() {
    if (!save(d => !!addLine(d, v.id, list.id, text, { where, gear }))) return;
    setText(''); setWhere(''); setGear(''); focusSoon(inputId);
  }
  function task(lineId: string) {
    const due = isDateKey(day) ? day as DateKey : null;
    let r = null as ReturnType<typeof lineTask>;
    if (save(d => { r = lineTask(d, v.id, list.id as 'shots' | 'steps', lineId, due); return typeof r === 'string' && r !== 'already'; })) {
      toast(`Added to this project’s tasks${due ? ` for ${due === k ? 'today' : shortDate(due)}` : ''}.`); setTasking(null); setDay('');
    }
  }
  return (
    <section className="mt-4" data-s="line-list" data-id={list.id} aria-labelledby={`${inputId}H`}>
      <h4 id={`${inputId}H`} className="m-0 text-[15px]">{list.label} {lines.length > 0 && <span className="text-fg-3 font-normal tabular-nums">{list.tick ? `${lines.filter(x => x.done).length} of ${lines.length}` : lines.length}</span>}</h4>
      {lines.length > 0 && (
        <ol className={`p-0 m-0 mt-1 ${list.id === 'outline' ? 'list-decimal pl-6' : 'list-none'}`}>
          {lines.map((x, i) => {
            const t = x.taskId ? data.tasks.items.find(y => y.id === x.taskId) : undefined;
            return (
              <li key={x.id} className="border-t border-outline first:border-t-0 py-1.5" data-s="line" data-id={x.id}>
                <div className="flex flex-wrap items-center gap-x-2">
                  {list.tick && <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={!!x.done} aria-label={`${list.tick}: ${x.text}`} data-action="line-tick" onChange={() => save(d => tickLine(d, v.id, list.id, x.id))} />}
                  <CommitInput aria-label={`${list.label}: ${x.text}`} className="flex-1 min-w-[10rem]" key={x.text} defaultValue={x.text} maxLength={CONTENT_LIMITS.line} onCommit={el => { if (!el.value.trim()) { el.value = x.text; return; } save(d => editLine(d, v.id, list.id, x.id, { text: el.value })); }} />
                  {list.id === 'outline' && <>
                    <Button inline variant="ghost" aria-label="Move up" disabled={i === 0} data-action="line-up" onClick={() => save(d => moveLine(d, v.id, 'outline', x.id, -1))}>↑</Button>
                    <Button inline variant="ghost" aria-label="Move down" disabled={i === lines.length - 1} data-action="line-down" onClick={() => save(d => moveLine(d, v.id, 'outline', x.id, 1))}>↓</Button>
                  </>}
                  {(list.id === 'shots' || list.id === 'steps') && (t ? <a href={`#today/tasks/${enc(t.id)}`} className="inline-flex items-center min-h-11 text-sm text-primary font-semibold no-underline" data-s="line-task">A task{t.due ? ` · ${shortDate(t.due)}` : ''}</a>
                    : <LinkButton className="text-sm" data-action="line-task" aria-expanded={tasking === x.id} onClick={() => setTasking(tasking === x.id ? null : x.id)}>Make a task</LinkButton>)}
                  <Button inline variant="ghost" aria-label={`Remove “${x.text}”`} data-action="line-remove" onClick={() => save(d => removeLine(d, v.id, list.id, x.id))}><Trash2 size={16} aria-hidden="true" /></Button>
                </div>
                {list.id === 'shots' && (x.where || x.gear) && <p className="m-0 text-sm text-fg-2">{[x.where && `Where: ${x.where}`, x.gear && `With: ${x.gear}`].filter(Boolean).join(' · ')}</p>}
                {tasking === x.id && (
                  <div className="flex flex-wrap items-end gap-2 mt-1" data-s="line-task-form">
                    <Field label="On a day (optional)" htmlFor={`lineDay-${x.id}`}><TextInput id={`lineDay-${x.id}`} type="date" className="!w-auto" min={k} value={day} onChange={e => setDay(e.target.value)} /></Field>
                    <Button inline variant="primary" data-action="line-task-add" onClick={() => task(x.id)}>Add task</Button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <form className="flex flex-wrap items-end gap-2 mt-2" onSubmit={e => { e.preventDefault(); add(); }}>
        <Field label={list.add} htmlFor={inputId} className="flex-1 min-w-[12rem]"><TextInput id={inputId} value={text} maxLength={CONTENT_LIMITS.line} placeholder={list.placeholder} onChange={e => setText(e.target.value)} /></Field>
        {list.id === 'shots' && <>
          <Field label="Where (optional)" htmlFor="shotWhere"><TextInput id="shotWhere" value={where} maxLength={CONTENT_LIMITS.where} onChange={e => setWhere(e.target.value)} /></Field>
          <Field label="With (optional)" htmlFor="shotGear"><TextInput id="shotGear" value={gear} maxLength={CONTENT_LIMITS.where} onChange={e => setGear(e.target.value)} /></Field>
        </>}
        <Button inline type="submit" variant="tonal" data-action="line-add" aria-label={list.add} disabled={!text.trim()}><Plus size={18} aria-hidden="true" /></Button>
      </form>
    </section>
  );
}

// Clips and thumbnails: links (with a moment or span) and uploads (the video's own files).
function ClipsCard({ data, v }: { data: MyDayData; v: Video }) {
  const [url, setUrl] = useState(''), [label, setLabel] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState('');
  function add() {
    if (!save(d => !!addClip(d, v.id, url, label, from, to))) { toast('That doesn’t look like a web address.'); return; }
    setUrl(''); setLabel(''); setFrom(''); setTo(''); toast('Clip kept.'); focusSoon('clipUrl');
  }
  return (
    <>
      <Card aria-labelledby="clipsH" id="videoClips">
        <h3 id="clipsH" className="m-0">Clips</h3>
        {v.clips.length > 0 && (
          <ul className="list-none p-0 m-0 mt-2">
            {v.clips.map(c => (
              <li key={c.id} className="border-t border-outline first:border-t-0 py-2 flex flex-wrap items-start gap-x-2" data-s="clip" data-id={c.id}>
                <span className="flex-1 min-w-[12rem] break-words">{c.url ? <ExternalLink href={c.url}>{c.label || c.url}</ExternalLink> : c.label}{(c.from || c.to) && <span className="block text-sm text-fg-2">{[c.from, c.to].filter(Boolean).join('–')}</span>}</span>
                <Button inline variant="ghost" aria-label="Remove this clip" data-action="clip-remove" onClick={() => save(d => removeClip(d, v.id, c.id))}><Trash2 size={16} aria-hidden="true" /></Button>
              </li>
            ))}
          </ul>
        )}
        <form className="grid gap-2 mt-3" onSubmit={e => { e.preventDefault(); add(); }} data-s="clip-form">
          <Field label="A clip's link (Drive, Photos, CapCut…)" htmlFor="clipUrl"><TextInput id="clipUrl" type="url" inputMode="url" value={url} maxLength={CONTENT_LIMITS.url} placeholder="https://…" onChange={e => setUrl(e.target.value)} /></Field>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
            <Field label="What it is (optional)" htmlFor="clipLabel"><TextInput id="clipLabel" value={label} maxLength={CONTENT_LIMITS.label} placeholder="Market shot" onChange={e => setLabel(e.target.value)} /></Field>
            <Field label="From" htmlFor="clipFrom"><TextInput id="clipFrom" value={from} maxLength={CONTENT_LIMITS.at} placeholder="0:42" onChange={e => setFrom(e.target.value)} /></Field>
            <Field label="To" htmlFor="clipTo"><TextInput id="clipTo" value={to} maxLength={CONTENT_LIMITS.at} placeholder="0:58" onChange={e => setTo(e.target.value)} /></Field>
          </div>
          <div><Button inline type="submit" variant="tonal" data-action="clip-add" disabled={!url.trim()}><Plus size={18} aria-hidden="true" /> Add clip</Button></div>
        </form>
      </Card>
      <FilesCard data={data} owner={{ kind: 'video', id: v.id }} area="content" />
    </>
  );
}

// Posting: the planned post day (its "Post: …" task), and where it went up.
function PostingCard({ data, v }: { data: MyDayData; v: Video }) {
  const [platform, setPlatform] = useState('youtube'), [url, setUrl] = useState(''), [on, setOn] = useState(todayKey() as string);
  const t = postTask(data, v.item), k = todayKey();
  function add() {
    if (!save(d => !!addPost(d, v.id, platform, url, isDateKey(on) ? on as DateKey : null))) { toast('That doesn’t look like a web address.'); return; }
    setUrl(''); toast(`Posted on ${platformLabel(platform)} — kept.`);
  }
  return (
    <Card aria-labelledby="postH" id="videoPosting">
      <h3 id="postH" className="m-0">Posting</h3>
      <Field label="Planned post day" htmlFor="videoPostOn" className="mt-3">
        <TextInput id="videoPostOn" type="date" className="!w-auto" value={v.postOn ?? ''} onChange={e => { const day = e.target.value; if (save(d => setPostDay(d, v.id, isDateKey(day) ? day as DateKey : null))) toast(isDateKey(day) ? `“Post: ${v.title}” is on ${day === k ? 'today' : shortDate(day as DateKey)}.` : 'No post day now.'); }} />
      </Field>
      {t && <p className="m-0 text-sm text-fg-2" data-s="post-task">{isPosted(data, v.item) ? 'Posted — its task is done.' : <>Its task: <a href={`#today/tasks/${enc(t.id)}`} className="text-primary font-semibold">“{t.title}”</a></>}</p>}
      <h4 className="m-0 mt-4 text-[15px]">Where it went up</h4>
      {v.posts.length > 0 && (
        <ul className="list-none p-0 m-0 mt-1">
          {v.posts.map(x => (
            <li key={x.id} className="border-t border-outline first:border-t-0 py-2 flex flex-wrap items-center gap-x-2" data-s="post" data-id={x.id}>
              <span className="flex-1 min-w-[12rem] break-words">{x.url ? <ExternalLink href={x.url}>{platformLabel(x.platform)}</ExternalLink> : platformLabel(x.platform)}{isDateKey(x.on) && <span className="text-sm text-fg-2"> · {shortDate(x.on)}</span>}</span>
              <Button inline variant="ghost" aria-label={`Remove ${platformLabel(x.platform)}`} data-action="post-remove" onClick={() => save(d => removePost(d, v.id, x.id))}><Trash2 size={16} aria-hidden="true" /></Button>
            </li>
          ))}
        </ul>
      )}
      <form className="grid gap-2 mt-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-end" onSubmit={e => { e.preventDefault(); add(); }} data-s="post-form">
        <Field label="Where" htmlFor="postPlatform"><Select id="postPlatform" value={platform} onChange={e => setPlatform(e.target.value)}>{PLATFORMS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</Select></Field>
        <Field label="Its link (optional)" htmlFor="postUrl"><TextInput id="postUrl" type="url" inputMode="url" value={url} maxLength={CONTENT_LIMITS.url} onChange={e => setUrl(e.target.value)} /></Field>
        <Field label="Day" htmlFor="postOn"><TextInput id="postOn" type="date" className="!w-auto" value={on} onChange={e => setOn(e.target.value)} /></Field>
        <div className="sm:col-span-3"><Button inline type="submit" variant="tonal" data-action="post-add"><Plus size={18} aria-hidden="true" /> Add where it went up</Button></div>
      </form>
    </Card>
  );
}

// Results, typed in when you like, and what worked and what didn't. No scores, no comparisons.
function ResultsCard({ v }: { v: Video }) {
  const [platform, setPlatform] = useState('youtube'), [on, setOn] = useState(todayKey() as string), [nums, setNums] = useState<Partial<Record<ResultField, string>>>({});
  const edit = (patch: Parameters<typeof editVideo>[2]) => save(d => editVideo(d, v.id, patch));
  function add() {
    const parsed = Object.fromEntries(RESULT_FIELDS.map(f => [f, nums[f]?.trim() ? Number(nums[f]!.replace(/[,\s]/g, '')) : null]));
    if (!save(d => !!addResult(d, v.id, platform, isDateKey(on) ? on as DateKey : null, parsed))) { toast('Add at least one number (whole numbers, none below 0).'); return; }
    setNums({}); toast('Results kept.');
  }
  return (
    <Card aria-labelledby="resultsH" id="videoResults">
      <h3 id="resultsH" className="m-0">Results</h3>
      {v.results.length > 0 && (
        <ul className="list-none p-0 m-0 mt-2">
          {v.results.map(r => (
            <li key={r.id} className="border-t border-outline first:border-t-0 py-2 flex flex-wrap items-center gap-x-2" data-s="result" data-id={r.id}>
              <span className="flex-1 min-w-[12rem]"><span className="font-semibold">{platformLabel(r.platform)}{isDateKey(r.on) ? ` · ${shortDate(r.on)}` : ''}</span><span className="block text-sm text-fg-2 tabular-nums">{resultWords(r)}</span></span>
              <Button inline variant="ghost" aria-label="Remove these results" data-action="result-remove" onClick={() => save(d => removeResult(d, v.id, r.id))}><Trash2 size={16} aria-hidden="true" /></Button>
            </li>
          ))}
        </ul>
      )}
      <form className="grid gap-2 mt-3" onSubmit={e => { e.preventDefault(); add(); }} data-s="result-form">
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-[10rem_auto]">
          <Field label="Where" htmlFor="resultPlatform"><Select id="resultPlatform" value={platform} onChange={e => setPlatform(e.target.value)}>{PLATFORMS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</Select></Field>
          <Field label="As of" htmlFor="resultOn"><TextInput id="resultOn" type="date" className="!w-auto" value={on} onChange={e => setOn(e.target.value)} /></Field>
        </div>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
          {RESULT_FIELDS.map(f => <Field key={f} label={RESULT_LABEL[f]} htmlFor={`result-${f}`}><TextInput id={`result-${f}`} inputMode="numeric" value={nums[f] ?? ''} maxLength={15} onChange={e => setNums(n => ({ ...n, [f]: e.target.value }))} /></Field>)}
        </div>
        <div><Button inline type="submit" variant="tonal" data-action="result-add"><Plus size={18} aria-hidden="true" /> Add results</Button></div>
      </form>
      <div className="grid gap-3 mt-4">
        <Field label="What worked" htmlFor="videoWorked"><CommitTextarea id="videoWorked" key={v.worked} rows={2} defaultValue={v.worked} maxLength={CONTENT_LIMITS.words} onCommit={el => edit({ worked: el.value })} /></Field>
        <Field label="What didn’t" htmlFor="videoDidnt"><CommitTextarea id="videoDidnt" key={v.didnt} rows={2} defaultValue={v.didnt} maxLength={CONTENT_LIMITS.words} onCommit={el => edit({ didnt: el.value })} /></Field>
      </div>
    </Card>
  );
}
