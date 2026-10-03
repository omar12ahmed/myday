import { Target } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { Field, TextInput } from '../components/Field';
import { Choice, Choices, ExternalLink, LinkButton, Note } from '../components/parts';
import { todayKey } from '../data/dates';
import {
  ACTIVITY, cmToFtIn, fitnessOf, ftInToCm, GOAL_LABEL, GOALS, kgToStLb, plan, restDaysFor, showWeight, stLbToKg,
  type Condition, type FitnessData, type GoalAnswers,
} from '../data/goals';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { go } from './route';

const START: GoalAnswers = { goal: 'health', age: 30, sex: 'unsaid', heightCm: 170, weightKg: 70, activity: 'onFeet', experience: 'new', days: 3, equipment: 'none', pace: 'gentle', pregnant: false, eatingDisorder: 'no', conditions: [] };
type Step = 'goal' | 'you' | 'days' | 'training' | 'pace' | 'health';
const stepsFor = (a: GoalAnswers): Step[] => ['goal', 'you', 'days', 'training', ...(['lose', 'gain', 'recomp'].includes(a.goal) ? ['pace' as const] : []), 'health'];

// Health → Goal: choose a goal, answer a few questions (one at a time), and get a plan. Nothing is saved until
// "See my plan"; your answers stay on this device.
export function GoalView({ data }: { data: MyDayData }) {
  const fit = fitnessOf(data);
  const [draft, setDraft] = useState<GoalAnswers | null>(null); // answers being changed (null: show the plan, or the start)
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState<FitnessData['units']>(fit.units);
  const confirm = useConfirm();

  if (!draft && fit.answers) {
    return <PlanView data={data} onChange={() => { setDraft({ ...fit.answers! }); setStep(0); }}
      onRemove={async () => {
        if (!(await confirm({ title: 'Remove your goal and answers?', body: 'Your workouts, recipes and everything else stay as they are.', confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
        if (update(d => { d.fitness = { ...fitnessOf(d), answers: null, setOn: null }; })) toast('Goal removed.');
      }} />;
  }
  if (!draft) {
    return (
      <Card aria-labelledby="goal-h" id="goalIntro">
        <h2 id="goal-h" className="flex items-center gap-2"><Target size={20} aria-hidden="true" className="text-primary" /> Your goal</h2>
        <p className="text-[15px] text-fg-2">Pick a goal and answer a few quick questions. You'll get a plan: roughly how much to eat, how much protein, how often to train and what to focus on — worked out from public guidance, and easy to change.</p>
        <div className="grid gap-2.5">
          {GOALS.map(g => (
            <Button key={g.id} data-s="goal" data-id={g.id} className="!justify-start !text-left !h-auto py-3" onClick={() => { setDraft({ ...START, goal: g.id }); setStep(1); }}>
              <span><span className="block font-semibold">{g.label}</span><span className="block text-sm text-fg-2 font-normal">{g.hint}</span></span>
            </Button>
          ))}
        </div>
        <Note className="mt-3 mb-0 text-sm">Your answers stay on this device — they aren't synced or sent anywhere.</Note>
      </Card>
    );
  }

  const steps = stepsFor(draft), cur = steps[Math.min(step, steps.length - 1)], last = step >= steps.length - 1;
  const set = (patch: Partial<GoalAnswers>) => setDraft(d => ({ ...d!, ...patch }));
  const valid = cur !== 'you' || (draft.age >= 18 && draft.age <= 100 && draft.heightCm >= 120 && draft.heightCm <= 230 && draft.weightKg >= 30 && draft.weightKg <= 300);
  function save() {
    if (update(d => { d.fitness = { ...fitnessOf(d), units, answers: draft!, setOn: todayKey() }; })) {
      setDraft(null);
      toast('Your plan is ready.');
      window.scrollTo(0, 0);
    }
  }
  const under18 = cur === 'you' && draft.age > 0 && draft.age < 18;

  return (
    <Card aria-labelledby="goalq-h" id="goalQuestions" data-step={cur}>
      <p className="text-xs font-bold tracking-[.08em] uppercase text-fg-3 m-0 mb-1">Step {step + 1} of {steps.length} · {GOAL_LABEL[draft.goal]}</p>
      {cur === 'goal' && (
        <Q id="goalq-h" title="What's your goal?">
          <div className="grid gap-2.5">
            {GOALS.map(g => (
              <Choice key={g.id} on={draft.goal === g.id} data-s="goal" data-id={g.id} className="!justify-start !text-left !h-auto py-3 !min-w-0" onClick={() => set({ goal: g.id })}>
                <span><span className="block font-semibold">{g.label}</span><span className="block text-sm font-normal">{g.hint}</span></span>
              </Choice>
            ))}
          </div>
        </Q>
      )}
      {cur === 'you' && (
        <Q id="goalq-h" title="About you" note="Used only to estimate how much energy your body uses.">
          <div className="grid gap-3">
            <Field label="Age" htmlFor="gAge"><NumberBox id="gAge" value={draft.age} onChange={v => set({ age: v })} min={18} max={100} /></Field>
            {under18 && <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 m-0">This plan is for adults (18 and over). For under-18s, the NHS's advice is at least 60 minutes of activity a day — a GP or school nurse can help with anything more.</p>}
            <div><p className="text-sm font-semibold m-0 mb-1.5">Sex (for the calorie formula)</p>
              <Choices label="Sex">{(['female', 'male', 'unsaid'] as const).map(s => <Choice key={s} on={draft.sex === s} data-s="sex" data-id={s} onClick={() => set({ sex: s })}>{{ female: 'Female', male: 'Male', unsaid: 'Prefer not to say' }[s]}</Choice>)}</Choices></div>
            <div><p className="text-sm font-semibold m-0 mb-1.5">Units</p>
              <Choices label="Units">{(['metric', 'imperial'] as const).map(u => <Choice key={u} on={units === u} data-s="units" data-id={u} onClick={() => setUnits(u)}>{u === 'metric' ? 'kg and cm' : 'stone and feet'}</Choice>)}</Choices></div>
            {units === 'metric' ? (
              <>
                <Field label="Height (cm)" htmlFor="gH"><NumberBox id="gH" value={draft.heightCm} onChange={v => set({ heightCm: v })} min={120} max={230} /></Field>
                <Field label="Weight (kg)" htmlFor="gW"><NumberBox id="gW" value={draft.weightKg} onChange={v => set({ weightKg: v })} min={30} max={300} step="0.1" /></Field>
              </>
            ) : (
              <>
                <TwoBoxes label="Height" a={{ id: 'gFt', unit: 'ft', value: cmToFtIn(draft.heightCm).ft }} b={{ id: 'gIn', unit: 'in', value: cmToFtIn(draft.heightCm).inch }}
                  onChange={(ft, inch) => set({ heightCm: ftInToCm(ft, inch) })} />
                <TwoBoxes label="Weight" a={{ id: 'gSt', unit: 'st', value: kgToStLb(draft.weightKg).st }} b={{ id: 'gLb', unit: 'lb', value: kgToStLb(draft.weightKg).lb }}
                  onChange={(st, lb) => set({ weightKg: stLbToKg(st, lb) })} />
              </>
            )}
          </div>
        </Q>
      )}
      {cur === 'days' && (
        <Q id="goalq-h" title="How active are your days?" note="On a typical work day — including your shifts.">
          <div className="grid gap-2.5">
            {ACTIVITY.map(x => (
              <Choice key={x.id} on={draft.activity === x.id} data-s="activity" data-id={x.id} className="!justify-start !text-left !h-auto py-3 !min-w-0" onClick={() => set({ activity: x.id })}>
                <span><span className="block font-semibold">{x.label}</span><span className="block text-sm font-normal">{x.hint}</span></span>
              </Choice>
            ))}
          </div>
        </Q>
      )}
      {cur === 'training' && (
        <Q id="goalq-h" title="Your training">
          <p className="text-sm font-semibold m-0 mb-1.5">Experience with strength training</p>
          <Choices label="Experience">{(['new', 'some', 'experienced'] as const).map(e => <Choice key={e} on={draft.experience === e} data-s="experience" data-id={e} onClick={() => set({ experience: e })}>{{ new: 'New to it', some: 'Some', experienced: 'Experienced' }[e]}</Choice>)}</Choices>
          <p className="text-sm font-semibold m-0 mb-1.5">Days a week you could train</p>
          <Choices label="Days a week">{[1, 2, 3, 4, 5, 6, 7].map(n => <Choice key={n} on={draft.days === n} data-s="days" data-id={String(n)} className="!min-w-11 !flex-none" onClick={() => set({ days: n })}>{n}</Choice>)}</Choices>
          <p className="text-sm font-semibold m-0 mb-1.5">Where</p>
          <Choices label="Where">{(['gym', 'home', 'none'] as const).map(e => <Choice key={e} on={draft.equipment === e} data-s="equipment" data-id={e} onClick={() => set({ equipment: e })}>{{ gym: 'A gym', home: 'Home, some equipment', none: 'No equipment' }[e]}</Choice>)}</Choices>
        </Q>
      )}
      {cur === 'pace' && (
        <Q id="goalq-h" title="What pace suits you?" note="Gentle is easier to keep up alongside work and shifts.">
          <Choices label="Pace">{(['gentle', 'steady'] as const).map(p => <Choice key={p} on={draft.pace === p} data-s="pace" data-id={p} onClick={() => set({ pace: p })}>
            {p === 'gentle' ? (draft.goal === 'gain' ? 'Gentle (lean gain)' : 'Gentle') : (draft.goal === 'gain' ? 'Steady (faster gain)' : 'Steady')}</Choice>)}</Choices>
          <Note className="m-0">{draft.goal === 'gain' ? 'Gentle adds less fat along the way; steady builds a little faster.' : 'Gentle: about 0.25–0.5 kg a week. Steady: about 0.5–1 kg a week (the NHS\'s healthy range).'}</Note>
        </Q>
      )}
      {cur === 'health' && (
        <Q id="goalq-h" title="A few health questions" note="So the plan is safe for you. Answering is private — it stays on this device.">
          <p className="text-sm font-semibold m-0 mb-1.5">Are you pregnant or breastfeeding?</p>
          <Choices label="Pregnant or breastfeeding">{[false, true].map(v => <Choice key={String(v)} on={draft.pregnant === v} data-s="pregnant" data-id={String(v)} onClick={() => set({ pregnant: v })}>{v ? 'Yes' : 'No'}</Choice>)}</Choices>
          <p className="text-sm font-semibold m-0 mb-1.5">Have you ever had an eating disorder?</p>
          <Choices label="Eating disorder">{(['no', 'yes', 'unsaid'] as const).map(v => <Choice key={v} on={draft.eatingDisorder === v} data-s="ed" data-id={v} onClick={() => set({ eatingDisorder: v })}>{{ no: 'No', yes: 'Yes', unsaid: 'Prefer not to say' }[v]}</Choice>)}</Choices>
          <p className="text-sm font-semibold m-0 mb-1.5">Any of these? (tick any)</p>
          <div className="grid gap-1.5 mb-2">
            {(['diabetes', 'kidney', 'heart', 'other'] as Condition[]).map(c => (
              <label key={c} className="flex items-center gap-3 min-h-11 cursor-pointer">
                <input type="checkbox" className="size-[22px] accent-primary" data-s="condition" data-id={c} checked={draft.conditions.includes(c)}
                  onChange={e => set({ conditions: e.target.checked ? [...draft.conditions, c] : draft.conditions.filter(x => x !== c) })} />
                {{ diabetes: 'Diabetes', kidney: 'A kidney condition', heart: 'A heart condition', other: 'Another condition affecting diet or exercise' }[c]}
              </label>
            ))}
          </div>
        </Q>
      )}
      <div className="flex flex-wrap gap-2.5 mt-4">
        {last ? <Button variant="primary" data-action="goal-save" disabled={!valid} onClick={save}>See my plan</Button>
          : <Button variant="primary" data-action="goal-next" disabled={!valid || under18} onClick={() => setStep(step + 1)}>Next</Button>}
        <Button variant="ghost" data-action="goal-back" onClick={() => (step === 0 ? setDraft(null) : setStep(step - 1))}>{step === 0 ? 'Cancel' : 'Back'}</Button>
      </div>
    </Card>
  );
}

function Q({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return <><h2 id={id} className="mb-1">{title}</h2>{note && <Note className="mt-0">{note}</Note>}<div className="mt-3">{children}</div></>;
}
function NumberBox({ id, value, onChange, min, max, step }: { id: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: string }) {
  const [text, setText] = useState(String(value));
  return <TextInput id={id} type="number" inputMode="decimal" min={min} max={max} step={step ?? '1'} value={text} className="!w-32"
    onChange={e => { setText(e.target.value); const n = Number(e.target.value); onChange(Number.isFinite(n) ? n : 0); }} />;
}
function TwoBoxes({ label, a, b, onChange }: { label: string; a: { id: string; unit: string; value: number }; b: { id: string; unit: string; value: number }; onChange: (x: number, y: number) => void }) {
  const [x, setX] = useState(String(a.value)), [y, setY] = useState(String(b.value));
  const send = (nx: string, ny: string) => onChange(Number(nx) || 0, Number(ny) || 0);
  return (
    <fieldset className="border-0 p-0 m-0"><legend className="text-sm font-semibold mb-1.5">{label}</legend>
      <span className="flex gap-3 items-center">
        <label className="flex items-center gap-1.5"><TextInput id={a.id} type="number" inputMode="numeric" value={x} className="!w-24" aria-label={`${label}, ${a.unit}`} onChange={e => { setX(e.target.value); send(e.target.value, y); }} /> {a.unit}</label>
        <label className="flex items-center gap-1.5"><TextInput id={b.id} type="number" inputMode="numeric" value={y} className="!w-24" aria-label={`${label}, ${b.unit}`} onChange={e => { setY(e.target.value); send(x, e.target.value); }} /> {b.unit}</label>
      </span>
    </fieldset>
  );
}

// ---------- The plan ----------
function PlanView({ data, onChange, onRemove }: { data: MyDayData; onChange: () => void; onRemove: () => void }) {
  const fit = fitnessOf(data), a = fit.answers!, p = plan(a);
  const w = data.health.workout;
  const restDays = restDaysFor(p.sessions);
  const scheduleMatches = w.schedule.mode === 'sequence' && w.schedule.restDays === restDays;
  const confirm = useConfirm();
  async function suggestSchedule() {
    const body = w.templates.length
      ? `Your workouts (${w.templates.map(t => t.name).join(', ')}) in order, with ${restDays} rest day${restDays === 1 ? '' : 's'} between — about ${p.sessions} a week. Nothing is booked until you confirm a proposal in Workout.`
      : 'You have no workouts yet: add one in Workout first (e.g. a full-body session).';
    if (!w.templates.length) { await confirm({ title: 'Add a workout first', body, confirmLabel: 'OK' }); return; }
    if (!(await confirm({ title: `Train about ${p.sessions} times a week?`, body, confirmLabel: 'Set my schedule', cancelLabel: 'Not now' }))) return;
    if (update(d => { const s = d.health.workout.schedule; s.mode = 'sequence'; s.restDays = restDays; if (!s.sequence.length) s.sequence = d.health.workout.templates.map(t => t.id); })) {
      toast('Schedule set. Workout will propose sessions to fit your days.');
      go('health/workout/schedule');
    }
  }
  const box = (id: string, title: string, children: ReactNode) => <Card aria-labelledby={id} id={`plan-${id}`}><h3 id={id}>{title}</h3>{children}</Card>;
  return (
    <>
      <Card aria-labelledby="plan-h" id="goalPlan">
        <h2 id="plan-h" className="flex items-center gap-2"><Target size={20} aria-hidden="true" className="text-primary" /> {GOAL_LABEL[a.goal]}</h2>
        <p className="text-[15px] text-fg-2 m-0">Your plan, from your answers ({a.age}, {showWeight(a.weightKg, fit.units)}, {ACTIVITY.find(x => x.id === a.activity)!.label.toLowerCase()}, up to {a.days} day{a.days === 1 ? '' : 's'} a week). Estimates from public guidance — not medical advice.</p>
        <div className="flex flex-wrap gap-2.5 mt-3">
          <Button inline data-action="goal-change" onClick={onChange}>Change my answers</Button>
          <Button inline variant="ghost" data-action="goal-remove" onClick={onRemove}>Remove</Button>
        </div>
      </Card>
      {p.caution && <Card id="goalCaution"><p role="note" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 m-0">{p.caution}</p></Card>}
      {p.calories && box('pCal', 'Calories', <>
        <p className="text-[28px] font-bold m-0 tabular-nums" data-s="kcal">{p.calories.low.toLocaleString('en-GB')}–{p.calories.high.toLocaleString('en-GB')} <span className="text-base font-semibold text-fg-2">kcal a day</span></p>
        <Note className="mb-0">{p.calorieNote}</Note></>)}
      {p.protein && box('pPro', 'Protein', <>
        <p className="text-[28px] font-bold m-0 tabular-nums" data-s="protein">{p.protein.low}–{p.protein.high} <span className="text-base font-semibold text-fg-2">g a day</span></p>
        <Note className="mb-0">{p.proteinNote}</Note></>)}
      {box('pCarb', 'Carbs and fats', <>
        {p.fat && <p className="m-0 mb-1.5 text-[15px]"><strong>Fats:</strong> about {p.fat.low}–{p.fat.high} g a day (olive oil, nuts, oily fish).</p>}
        <Note className="m-0">{p.carbsNote}</Note></>)}
      {box('pTrain', 'Training', <>
        <p className="m-0 text-[15px]" data-s="focus"><strong>Focus:</strong> {p.focus}.</p>
        <p className="m-0 mt-1.5 text-[15px]" data-s="sessions"><strong>Strength:</strong> {p.sessions} session{p.sessions === 1 ? '' : 's'} a week. {p.sessionStyle}</p>
        <p className="m-0 mt-1.5 text-[15px]"><strong>Cardio:</strong> {p.cardio}</p>
        <div className="mt-3">
          {scheduleMatches ? <Note className="m-0">Your workout schedule already fits this (in order, {restDays} rest day{restDays === 1 ? '' : 's'} between).</Note>
            : <Button inline data-action="goal-schedule" onClick={suggestSchedule}>Suggest a workout schedule</Button>}
        </div></>)}
      {box('pProg', 'Progress and checking in', <><p className="m-0 text-[15px]">{p.progress}</p><Note className="mb-0">{p.checkIn}</Note></>)}
      {box('pShift', 'Working shifts', <ul className="list-disc pl-5 m-0 text-[15px] grid gap-1">{p.shiftTips.map(t => <li key={t}>{t}</li>)}</ul>)}
      <Card>
        <details><summary className="min-h-11 flex items-center cursor-pointer text-[15px] font-semibold">Where these figures come from</summary>
          <ul className="list-disc pl-5 m-0 text-sm text-fg-2 grid gap-1">
            <li>Calories: the Mifflin–St Jeor equation (1990) for the energy your body uses at rest, times an activity factor for your days. Everyone differs by a few hundred kcal — the weekly check-in corrects for that.</li>
            <li>Weight loss: 0.5–1 kg a week from about 600 kcal a day less (<ExternalLink href="https://assets.nhs.uk/tools/download-panels/data/weight-loss/pdf/all-weeks.pdf">NHS 12-week weight loss guide</ExternalLink>).</li>
            <li>Protein: 1.4–2.0 g/kg a day for people who exercise (<ExternalLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/">ISSN position stand, 2017</ExternalLink>); gains level off around 1.6 g/kg, up to about 2.2 (Morton et al., 2018).</li>
            <li>Activity: at least 150 minutes of moderate activity a week and strengthening on 2 days (<ExternalLink href="https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/">NHS guidelines</ExternalLink>).</li>
          </ul>
        </details>
        <LinkButton className="mt-1" data-action="goal-change-2" onClick={onChange}>Change my answers</LinkButton>
      </Card>
    </>
  );
}
