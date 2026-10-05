import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CommitInput, CommitTextarea, Field, Select } from '../../components/Field';
import { update, updateSaved } from '../../data/storage';
import { toast } from '../../data/toast';
import type { MyDayData } from '../../data/types';
import type { CyberAttempt } from '../../data/cybersecurity/types';
import { CYBER_VERSION, lessonHref } from '../../data/cybersecurity/types';
import { BackLink, Eyebrow, InlineLink } from '../parts';
import { curriculum, environments, lessons, skills, type Activity } from './catalogue';
import { attemptScore, beginAttempt, submitAttempt } from './learning';
import { Lines } from './parts';
import { RelatedPractice } from './Practice';

export function ActivityView({ data, activity }: { data: MyDayData; activity: Activity }) {
  const lesson = [...lessons.values()].find(l => [l.practical_task_id, l.knowledge_check_id, l.mini_challenge_id].includes(activity.id));
  const lab = curriculum.labs.find(l => l.id === activity.id), project = curriculum.projects.find(p => p.id === activity.id);
  const attempts = data.cybersecurity.attempts.filter(a => a.activityId === activity.id);
  const draft = attempts.find(a => !a.submittedAt && a.curriculumVersion === CYBER_VERSION);
  const [problem, setProblem] = useState('');
  const save = (fn: (a: CyberAttempt) => void) => {
    if (!draft) return;
    update(d => { const a = d.cybersecurity.attempts.find(a => a.id === draft.id); if (!a || a.submittedAt) return false; fn(a); });
  };
  function submit() {
    if (!draft) return;
    let error: string | null = null;
    const saved = updateSaved(d => { error = submitAttempt(d, draft.id); if (error) return false; }) === 'saved';
    setProblem(error ?? (saved ? '' : 'Could not save this attempt. Check the saving message and try again.'));
    if (saved) toast('Attempt saved. Your evidence stays in the notebook.');
  }
  return <>
    <Card>
      <BackLink to={lesson ? 'study/cybersecurity/' + lesson.id : 'study/cybersecurity'} label={lesson?.title ?? 'Learning map'} />
      <Eyebrow>{project ? 'Portfolio project' : lab ? 'Lab bench' : 'Learning activity'}</Eyebrow><h2>{activity.title}</h2><p>{activity.instruction}</p>
      {lab && <><h3>Inputs</h3><p>{lab.inputs}</p><p className="text-sm text-fg-2">{lab.input_provision}</p><h3>Steps</h3><Lines items={lab.steps} /><p><strong>Reset:</strong> {lab.reset}</p><p>{lab.estimated_minutes.minimum}–{lab.estimated_minutes.maximum} minutes, split into checkpoints as needed.</p></>}
      {project && <><p>{project.estimated_hours.minimum}–{project.estimated_hours.maximum} hours, split into checkpoints.</p><h3>Required skill evidence</h3><ul className="list-disc pl-5">{project.required_skills.map(s => <li key={s.skill_id}><InlineLink href={lessonHref(skills.get(s.skill_id)!.taught_by_lesson_ids[0])}>{skills.get(s.skill_id)!.name}</InlineLink> — {s.min_mastery}/100; not verified here</li>)}</ul><p>{project.portfolio_value}</p><p>{project.retake_rule}</p></>}
      <h3>What to record</h3><Lines items={activity.expected} />
      <h3>Scope and evidence checks</h3><Lines items={activity.critical} />
      {!!activity.rubric.length && <><h3>How the task is assessed</h3><ul className="list-disc pl-5">{activity.rubric.map(r => <li key={r.criterion} className="my-2"><strong>{r.criterion} · weight {r.weight}</strong>{r.pass_evidence && <p className="text-sm text-fg-2 m-0">{r.pass_evidence}</p>}</li>)}</ul></>}
      {!!activity.environmentIds.length && <details><summary className="min-h-11 py-2 cursor-pointer text-primary">Suitable environments</summary>{activity.environmentIds.map(id => { const e = environments.get(id)!; return <div key={id}><h4>{e.name}</h4><p>{e.compute} · {e.cost_note}</p><p className="text-sm text-fg-2">{e.boundary}. {e.evidence_limit}.</p></div>; })}</details>}
    </Card>
    <RelatedPractice data={data} ids={[activity.id, ...activity.skillIds.flatMap(id => skills.get(id)?.taught_by_lesson_ids ?? [])]} />
    {draft ? <Card aria-labelledby="cyber-attempt-title">
      <h3 id="cyber-attempt-title">Your attempt</h3><p className="text-sm text-fg-2">Fields save when you leave them. Keep only redacted observations or references to your files; do not paste passwords or personal data.</p>
      <div className="grid gap-4" key={draft.id}>
        <Field label="Input or scenario tried" htmlFor="cyberVariant"><CommitInput id="cyberVariant" maxLength={200} defaultValue={draft.inputVariant} onCommit={el => save(a => { a.inputVariant = el.value; })} placeholder="e.g. first baseline, changed file, second scenario" /></Field>
        {!!activity.environmentIds.length && <Field label="Environment used" htmlFor="cyberEnvironment"><Select id="cyberEnvironment" value={draft.environmentId} onChange={e => save(a => { a.environmentId = e.target.value; })}>{activity.environmentIds.map(id => <option key={id} value={id}>{environments.get(id)!.name}</option>)}</Select></Field>}
        <Field label="Assistance used" htmlFor="cyberAssistance"><Select id="cyberAssistance" value={draft.assistance} onChange={e => save(a => { a.assistance = e.target.value as CyberAttempt['assistance']; })}>
          <option value="independent">On my own</option><option value="hint">Used hints or AI help</option><option value="guided">Followed notes or a walkthrough</option>
        </Select></Field>
        {activity.questions.map(q => <Field key={q.id} label={q.prompt} htmlFor={q.id}><CommitTextarea id={q.id} rows={3} maxLength={4000} defaultValue={draft.answers[q.id] ?? ''} onCommit={el => save(a => { a.answers[q.id] = el.value; })} /></Field>)}
        <Field label="Observed result, evidence and limitations" htmlFor="cyberEvidence"><CommitTextarea id="cyberEvidence" rows={6} maxLength={12000} defaultValue={draft.evidence} onCommit={el => save(a => { a.evidence = el.value; })} placeholder="What happened? What did you check? What failed or remains uncertain? A redacted file reference can help." /></Field>
        {!!activity.rubric.length && <fieldset className="border border-outline rounded-tile p-3 grid gap-3"><legend className="px-1 font-semibold">Your provisional rubric assessment</legend>
          <p className="text-sm text-fg-2 m-0">Score the observable evidence for each criterion. This is a self-assessment, not verified skill mastery.</p>
          {activity.rubric.map((r, i) => <Field key={r.criterion} label={`${r.criterion} (weight ${r.weight})`} htmlFor={'cyberScore' + i}><Select id={'cyberScore' + i} value={draft.rubricScores[i] ?? 0} onChange={e => save(a => { a.rubricScores[i] = Number(e.target.value); })}>
            <option value={0}>0 — not demonstrated yet</option><option value={25}>25 — limited evidence</option><option value={50}>50 — partly demonstrated</option><option value={75}>75 — mostly demonstrated</option><option value={100}>100 — fully demonstrated</option>
          </Select></Field>)}
        </fieldset>}
        <Field label="Did all scope and evidence checks pass?" htmlFor="cyberCritical"><Select id="cyberCritical" value={draft.criticalPassed === null ? '' : String(draft.criticalPassed)} onChange={e => save(a => { a.criticalPassed = e.target.value === '' ? null : e.target.value === 'true'; })}>
          <option value="">Choose after checking</option><option value="true">Yes, with evidence</option><option value="false">No, or still uncertain</option>
        </Select></Field>
        <Field label="Where to resume / next step" htmlFor="cyberResume"><CommitTextarea id="cyberResume" rows={2} maxLength={1000} defaultValue={draft.resumePoint} onCommit={el => save(a => { a.resumePoint = el.value; })} /></Field>
        {problem && <p role="alert" className="text-fg-2">{problem}</p>}
        <Button variant="primary" data-action="cyber-submit" onClick={submit}>Submit this attempt</Button>
        <p className="text-sm text-fg-2 m-0">Incomplete or unsuccessful work can be submitted too. After submission, start another attempt to retry or correct a result.</p>
      </div>
    </Card> : <Card><Button variant="primary" data-action="cyber-begin" onClick={() => { if (update(d => { if (!beginAttempt(d, activity.id)) return false; })) setProblem(''); }}>{attempts.length ? 'Start a fresh attempt' : 'Start an attempt'}</Button></Card>}
    {[...attempts].reverse().filter(a => a.submittedAt).map(a => <Result key={a.id} attempt={a} activity={activity} />)}
  </>;
}
function Result({ attempt: a, activity }: { attempt: CyberAttempt; activity: Activity }) {
  const score = attemptScore(a, activity);
  return <Card><Eyebrow>Notebook entry · {new Date(a.submittedAt!).toLocaleDateString('en-GB')}</Eyebrow><h3>{a.inputVariant}</h3>
    <p className="text-sm text-fg-2">{a.assistance} · self-assessed · curriculum {a.curriculumVersion} · rubric {a.rubricVersion}</p>
    <p className="whitespace-pre-wrap">{a.evidence}</p>
    {activity.questions.map(q => <div key={q.id}><h4>{q.prompt}</h4><p className="whitespace-pre-wrap">{a.answers[q.id] ?? 'No answer recorded'}</p></div>)}
    {score !== null && <><p className="font-semibold">Provisional task score: {Math.round(score)}/100</p><p className="text-sm text-fg-2">Sum of each criterion score × its weight ÷ 100.{activity.practical && a.assistance !== 'independent' ? ' Assisted practical work is capped at 60.' : ''}{!a.criticalPassed ? ' An unresolved scope or evidence check makes the result 0.' : ''} This does not award mastery or satisfy prerequisite thresholds.</p><details><summary className="min-h-11 py-2 cursor-pointer text-primary">Show calculation</summary><Lines items={activity.rubric.map((r, i) => `${r.criterion}: ${a.rubricScores[i] ?? 0} × ${r.weight} ÷ 100 = ${((a.rubricScores[i] ?? 0) * r.weight / 100).toFixed(2)}`)} /></details></>}
    <p className="text-sm text-fg-2">Scope and evidence checks: {a.criticalPassed ? 'recorded as passed' : 'unresolved'}.</p>
    {a.resumePoint && <p>Next step: {a.resumePoint}</p>}
    {!!activity.questions.length && a.curriculumVersion === CYBER_VERSION && <>
      {a.answerRevealed ? <AnswerGuide activity={activity} /> : <Button data-action="cyber-answers" onClick={() => update(d => {
        const saved = d.cybersecurity.attempts.find(x => x.id === a.id);
        if (!saved?.submittedAt) return false;
        saved.answerRevealed = true;
      })}>Compare with the answer guide</Button>}
    </>}
  </Card>;
}
function AnswerGuide({ activity }: { activity: Activity }) {
  const [answers, setAnswers] = useState<Record<string, string> | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    import('./answers.json').then(x => { if (active) setAnswers(x.default); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  return <section aria-label="Answer guide" className="border-t border-outline mt-4 pt-3"><h3>Answer guide</h3>
    <p className="text-sm text-fg-2">For self-study after your attempt. Explain any correction in your own words; viewing this guide is not a pass.</p>
    {failed ? <p role="alert">Couldn’t load the guide. Reopen this activity to try again.</p> : !answers ? <p role="status">Opening the guide…</p> : activity.questions.map(q => <p key={q.id}>{answers[q.id]}</p>)}
  </section>;
}
