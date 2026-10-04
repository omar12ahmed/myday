import { Lightbulb } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput, Field, Select } from '../components/Field';
import { BackLink, Eyebrow, Note } from '../components/parts';
import { Why } from '../components/Why';
import { shortDate, todayKey } from '../data/dates';
import { noticed, type Pattern, type Shown } from '../data/patterns/notice';
import { answerPattern, CATEGORIES, forgetAnswer, MINUTE_CHOICES, NAME_MAX, setMaxMinutes, setMaxTasks, setName } from '../data/patterns/saved';
import { CAT_LABEL } from '../data/plan';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// What MyDay has noticed (#noticed): patterns from your own history, each with its evidence ("Why?"), for you to
// confirm or dismiss — and your preferences, which always come first. See data/patterns/.
export function NoticedScreen({ data }: { data: MyDayData }) {
  const { fresh, confirmed } = noticed(data, todayKey());
  return (
    <div className="max-w-[720px] mx-auto">
      <BackLink to="today" label="Today" />
      <Card aria-labelledby="noticed-h">
        <h2 id="noticed-h" className="flex items-center gap-2"><Lightbulb size={22} aria-hidden="true" className="text-primary" /> What MyDay has noticed</h2>
        <p className="text-[15px] m-0">Patterns in how you actually work — from your own plans, study sessions, energy and sleep — so MyDay can fit itself to you, rather than the other way round.</p>
        <Note className="mb-0 mt-2">Patterns, not judgements. They're worked out on this device and nothing is sent anywhere. MyDay waits for a few weeks of examples, only counts days you used it, and changes nothing unless you say so.</Note>
      </Card>
      {fresh.length > 0 ? fresh.map(s => <PatternCard key={s.id} data={data} s={s} />) : (
        <Card id="noticedEmpty">
          <p className="text-[15px] text-fg-2 m-0">{confirmed.length ? 'Nothing new to show right now.' : 'Nothing to show yet. As you plan days, tick things off and do the evening check-in, MyDay starts to notice what works for you.'}</p>
        </Card>
      )}
      {confirmed.length > 0 && (
        <Card aria-labelledby="noticed-yes-h" id="noticedYes">
          <h3 id="noticed-yes-h">You said these are right</h3>
          <ul className="list-none p-0 m-0">
            {confirmed.map(s => (
              <li key={s.id} className="pattern-yes border-t border-outline first:border-t-0 py-3" data-id={s.id}>
                <p className="m-0 font-medium">{s.title}</p>
                {s.p ? <Why why={s.p.why} /> : <p className="text-sm text-fg-2 m-0 mt-1" data-s="lapsed">Less clear lately — there isn't enough recent evidence for it any more.</p>}
                <Button inline variant="ghost" className="mt-1" data-action="pattern-forget" data-id={s.id}
                  onClick={() => { if (update(d => (forgetAnswer(d.patterns, s.id) ? undefined : false))) toast('Your answer is forgotten. Your preferences stay as they are.'); }}>Forget my answer</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <PrefsCard data={data} />
    </div>
  );
}

function labelForUse(data: MyDayData, p: Pattern) {
  const u = p.use!;
  const now = u.kind === 'maxMinutes' ? data.patterns.prefs.maxMinutes[u.category]?.value : data.patterns.prefs.maxTasks?.value;
  const target = u.kind === 'maxMinutes' ? u.minutes : u.count;
  const was = now === undefined ? '' : now === target ? ' (you already chose this)' : u.kind === 'maxMinutes' ? ` (instead of ${now} min)` : ` (instead of ${now})`;
  return `${u.label}${was}`;
}

function PatternCard({ data, s }: { data: MyDayData; s: Shown }) {
  const p = s.p!;
  const said = (yes: boolean, use = false) => {
    const ok = update(d => {
      answerPattern(d.patterns, p.id, yes ? 'yes' : 'no', p.examples, p.title);
      if (use && p.use) {
        const why = `MyDay noticed: ${p.why}`;
        if (p.use.kind === 'maxMinutes') setMaxMinutes(d.patterns, p.use.category, p.use.minutes, p.id, why);
        else setMaxTasks(d.patterns, p.use.count, p.id, why);
      }
    });
    if (ok) toast(use ? 'Done — Build my day will use it, and say so. You can change it under Your preferences.' : yes ? 'Noted.' : "Noted — MyDay won't show this again unless there's clearly more evidence.");
  };
  return (
    <Card className="pattern" data-id={p.id} aria-labelledby={`pt-${p.id}`}>
      <Eyebrow>{s.again ? 'Noticed again' : p.strength === 'clear' ? 'Clear pattern' : 'Early sign'} · {p.examples} example{p.examples === 1 ? '' : 's'} since {shortDate(p.since)}</Eyebrow>
      <h3 id={`pt-${p.id}`} className="pattern-title mt-1.5 mb-1 !text-[18px] !font-semibold !normal-case !tracking-normal !text-fg leading-snug">{p.title}</h3>
      <Why why={p.why} />
      {p.tip && <p className="text-[15px] text-fg-2 m-0 mt-2">{p.tip}</p>}
      {p.use && <p className="text-[15px] m-0 mt-2" data-s="use">If that's right, MyDay can: <strong>{labelForUse(data, p)}</strong>.</p>}
      <p className="text-[15px] font-semibold m-0 mt-3">Does this sound right?</p>
      <div className="flex flex-wrap gap-2.5 mt-2">
        {p.use ? <>
          <Button inline variant="primary" data-action="pattern-use" onClick={() => said(true, true)}>Yes — do that</Button>
          <Button inline data-action="pattern-yes" onClick={() => said(true)}>Yes, but change nothing</Button>
        </> : <Button inline variant="primary" data-action="pattern-yes" onClick={() => said(true)}>That's right</Button>}
        <Button inline variant="ghost" data-action="pattern-no" onClick={() => said(false)}>Not really</Button>
      </div>
    </Card>
  );
}

// Your preferences: they always come before anything MyDay notices.
function PrefsCard({ data }: { data: MyDayData }) {
  const prefs = data.patterns.prefs;
  const from = (id: string | null) => (id ? data.patterns.answers[id]?.title || null : null);
  return (
    <Card aria-labelledby="prefs-h" id="prefsCard">
      <h3 id="prefs-h">Your preferences</h3>
      <Note className="mt-0">These always come first. Build my day uses them and says so, with a "Why?".</Note>
      {/* The name Today's greeting uses (saved with your preferences, so it's on every device you sign in on). */}
      <Field label="What MyDay calls you" htmlFor="prefName" className="mb-4">
        <CommitInput key={prefs.name ?? ''} id="prefName" defaultValue={prefs.name ?? ''} maxLength={NAME_MAX} autoComplete="given-name" placeholder="Optional"
          onCommit={el => { if (update(d => (setName(d.patterns, el.value) ? undefined : false))) toast(el.value.trim() ? 'Saved.' : 'Name removed — the greeting just says hello.'); }} />
      </Field>
      <p className="text-[15px] font-semibold m-0 mb-1">Longest task when building my day</p>
      <div className="grid gap-1">
        {CATEGORIES.map(c => (
          <div key={c} className="grid grid-cols-[minmax(0,1fr)_minmax(0,11rem)] gap-3 items-center">
            <label htmlFor={`prefMin-${c}`} className="text-[15px]">{CAT_LABEL[c]}</label>
            <Select id={`prefMin-${c}`} className="min-w-0" value={prefs.maxMinutes[c]?.value ?? ''} onChange={e => {
              const v = e.target.value ? Number(e.target.value) : null;
              if (update(d => (setMaxMinutes(d.patterns, c, v) ? undefined : false))) toast('Saved.');
            }}>
              <option value="">No limit</option>
              {[...new Set([...MINUTE_CHOICES, ...(prefs.maxMinutes[c] ? [prefs.maxMinutes[c]!.value] : [])])].sort((a, b) => a - b).map(m => <option key={m} value={m}>{m} min</option>)}
            </Select>
          </div>
        ))}
      </div>
      {CATEGORIES.map(c => from(prefs.maxMinutes[c]?.from ?? null) && <p key={c} className="text-sm text-fg-2 m-0 mt-2" data-s="pref-from">{CAT_LABEL[c]}: from “{from(prefs.maxMinutes[c]!.from)}”.</p>)}
      <Field label="Most tasks in a day" htmlFor="prefTasks" className="mt-4">
        <Select id="prefTasks" value={prefs.maxTasks?.value ?? ''} onChange={e => {
          const v = e.target.value ? Number(e.target.value) : null;
          if (update(d => (setMaxTasks(d.patterns, v) ? undefined : false))) toast('Saved.');
        }}>
          <option value="">As my energy allows (up to 3)</option>
          <option value="2">At most 2</option>
          <option value="1">Just 1</option>
        </Select>
      </Field>
      {from(prefs.maxTasks?.from ?? null) && <p className="text-sm text-fg-2 m-0 mt-2" data-s="pref-from">From “{from(prefs.maxTasks!.from)}”.</p>}
      <Note className="mb-0 mt-3">Shorter tasks keep how long they were, so the plan shows e.g. "25 min (shortened from 60)". Fewer tasks never means more: your energy's limit still applies.</Note>
    </Card>
  );
}

// The quiet line on Today when there's something new (nothing else interrupts you).
export function NoticedLink({ data, k }: { data: MyDayData; k: string }) {
  const n = noticed(data, k).fresh.length;
  if (!n) return null;
  return (
    <Card id="noticedLink" className="!py-1.5">
      <a href="#noticed" className="flex items-center gap-2.5 min-h-11 text-fg no-underline font-medium" data-action="noticed-open">
        <Lightbulb size={20} aria-hidden="true" className="text-primary flex-none" />
        <span className="flex-1">MyDay noticed something about how you work</span>
        <span className="text-primary font-semibold text-[15px] tabular-nums whitespace-nowrap">{n} new ›</span>
      </a>
    </Card>
  );
}
