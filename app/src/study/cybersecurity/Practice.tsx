import { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Field, Select, TextInput, TextArea } from '../../components/Field';
import { update, updateSaved } from '../../data/storage';
import type { MyDayData } from '../../data/types';
import { CYBER_VERSION, lessonHref, type CyberAttempt } from '../../data/cybersecurity/types';
import { toast } from '../../data/toast';
import { Eyebrow, InlineLink } from '../parts';
import { activities, lessons, type Activity } from './catalogue';
import { beginAttempt, submitAttempt } from './learning';
import { Lines, LinkButton } from './parts';
import { accessLabel, practiceActivities, practiceCheckedOn, practiceVersion, relatedPractice, type Practice } from './practiceCatalogue';
import { answer, answerKey, authRows, logQuestions, networkConfig, networkScenarios, networkSignature, outcomes, practiceChecks, scopeCases, scopeChoices, setScenario, simulateNetwork } from './practiceRules';

const currentAttempt = (a: CyberAttempt) => a.curriculumVersion === CYBER_VERSION && a.rubricVersion === practiceVersion;
function progress(data: MyDayData, id: string) {
  const attempts = data.cybersecurity.attempts.filter(a => a.activityId === id && currentAttempt(a));
  if (attempts.some(a => !a.submittedAt)) return 'Resume your draft';
  const last = attempts.at(-1);
  if (!last) return 'Ready to try';
  return answer(last, 'outcome') === 'completed' ? 'Completion recorded by you' : answer(last, 'outcome') === 'blocked' ? 'Access problem recorded · try the alternative' : 'Attempt saved · you can retry';
}
function PracticeTiles({ data, items }: { data: MyDayData; items: Practice[] }) {
  return <div className="grid sm:grid-cols-2 gap-3">{items.map(p => <a key={p.id} href={lessonHref(p.id)} className="block rounded-tile border border-outline bg-surface p-4 no-underline text-fg hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary">
    <p className="text-xs text-primary font-semibold m-0">{accessLabel[p.access]} · about {p.minutes} min</p>
    <h3 className="my-2">{p.title}</h3><p className="text-sm text-fg-2 m-0">{p.instruction}</p>
    <p className="text-sm font-semibold mb-0">{progress(data, p.id)}</p>
  </a>)}</div>;
}
export function RelatedPractice({ data, ids }: { data: MyDayData; ids: string[] }) {
  const items = practiceActivities.filter(p => ids.some(id => relatedPractice(id).includes(p)));
  if (!items.length) return null;
  return <Card><h3>Try it in practice</h3><p className="text-sm text-fg-2">Specific assignments and small experiments. Choose one that fits your time and access.</p><PracticeTiles data={data} items={items} /></Card>;
}
export function PracticeIndex({ data }: { data: MyDayData }) {
  const [filter, setFilter] = useState('all'), [search, setSearch] = useState('');
  const items = practiceActivities.filter(p => (filter === 'all' || filter === 'local' && p.access === 'in_app' || filter === 'no-account' && ['in_app', 'no_account'].includes(p.access)) && [p.title, p.provider, ...p.lessonIds.map(id => lessons.get(id)?.title ?? '')].join(' ').toLowerCase().includes(search.toLowerCase()));
  return <>
    <Card tone="accent"><Eyebrow>Practice shelf · free resources first</Eyebrow><h2>Pick something to do</h2>
      <p>Short experiments in MyDay and specific assignments on learning sites. Open an activity, do the work, then save what you found.</p>
      <p className="text-sm text-fg-2">No API keys or MCP connection needed. Provider accounts stay on their own sites. MyDay records your check-in; it does not read or verify your provider progress.</p>
      <div className="grid sm:grid-cols-2 gap-3"><Field label="Access" htmlFor="practiceAccess"><Select id="practiceAccess" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All free-first activities</option><option value="local">Inside MyDay</option><option value="no-account">No personal account needed</option></Select></Field>
        <Field label="Find an activity" htmlFor="practiceSearch"><TextInput id="practiceSearch" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Linux, TryHackMe, logs…" /></Field></div>
    </Card>
    {items.length ? <PracticeTiles data={data} items={items} /> : <Card><p>No activities match. Try a broader search or change the access filter.</p></Card>}
    <p className="text-sm text-fg-2 mt-4">A curated starting set, with more reading linked from each curriculum lesson. Provider pages checked {practiceCheckedOn}; access can change. Each external assignment includes an alternative.</p>
  </>;
}

export function PracticeView({ data, activity }: { data: MyDayData; activity: Activity }) {
  const p = activity.practice!;
  const attempts = data.cybersecurity.attempts.filter(a => a.activityId === p.id);
  const draft = attempts.find(a => !a.submittedAt && currentAttempt(a));
  const [problem, setProblem] = useState('');
  const save = (fn: (a: CyberAttempt) => void) => {
    if (!draft) return;
    update(d => { const a = d.cybersecurity.attempts.find(x => x.id === draft.id); if (!a || a.submittedAt) return false; fn(a); });
  };
  function submit() {
    if (!draft) return;
    let error: string | null = null;
    const saved = updateSaved(d => { error = submitAttempt(d, draft.id); if (error) return false; }) === 'saved';
    setProblem(error ?? (saved ? '' : 'Could not save. Check the saving message and try again.'));
    if (saved) toast('Saved in your lab notebook.');
  }
  return <>
    <Card tone="accent"><Eyebrow>{p.provider} · about {p.minutes} min</Eyebrow><h2>{p.title}</h2><p>{p.instruction}</p>
      <p className="font-semibold">{accessLabel[p.access]}</p><p className="text-sm text-fg-2">{p.accessNote}</p>
      <ol className="list-decimal pl-5 space-y-2">{p.steps.map(s => <li key={s}>{s}</li>)}</ol>
      <p className="text-sm text-fg-2">{p.boundary}</p>
      {p.kind === 'external' && <p className="text-xs text-fg-3">Provider page checked {practiceCheckedOn}. Assignment instructions are written by MyDay; provider content and access may change.</p>}
    </Card>
    {p.fallbackId && <Card><h3>If this resource isn’t available</h3><p>Keep a note of the problem and try this alternative. It has its own notebook entry.</p><LinkButton to={'study/cybersecurity/' + p.fallbackId}>{activities.get(p.fallbackId)!.title}</LinkButton></Card>}
    {draft ? <Card aria-labelledby="practice-attempt-title">
      <h3 id="practice-attempt-title">Your attempt</h3>
      {p.url && <><a data-action="practice-open" href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-btn px-5 py-3 bg-primary text-on-primary font-semibold no-underline">Open {p.provider} ↗</a>
        <p className="text-sm text-fg-2">Opens a new tab. Return here to record your result; opening the link does not complete the assignment.</p></>}
      <div className="grid gap-4">
        {p.kind === 'scope' && <ScopeInputs attempt={draft} save={save} />}
        {p.kind === 'network' && <NetworkInputs attempt={draft} save={save} />}
        {p.kind === 'logs' && <LogInputs attempt={draft} save={save} />}
        {p.kind === 'external' && <Field label="How did the activity go?" htmlFor="practiceOutcome"><Select id="practiceOutcome" value={answer(draft, 'outcome')} onChange={e => save(a => { a.answers[answerKey('outcome')] = e.target.value; })}>
          <option value="">Choose when you return</option>{Object.entries(outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select></Field>}
        <div><h4>What to record</h4><Lines items={p.evidence} /></div>
        <Field label={p.kind === 'external' ? 'What you completed, observed or could not access' : 'Your explanation and observations'} htmlFor="practiceEvidence"><TextArea id="practiceEvidence" rows={4} maxLength={12000} value={draft.evidence} onChange={e => save(a => { a.evidence = e.target.value; })} placeholder="Explain what happened in your own words. Include limitations and any redacted evidence reference." /></Field>
        <Field label="Assistance used" htmlFor="practiceAssistance"><Select id="practiceAssistance" value={draft.assistance} onChange={e => save(a => { a.assistance = e.target.value as CyberAttempt['assistance']; })}><option value="independent">On my own</option><option value="hint">Hints or AI help</option><option value="guided">Notes, feedback or a walkthrough</option></Select></Field>
        <Field label="Did you stay within the stated scope and record your own observations?" htmlFor="practiceCritical"><Select id="practiceCritical" value={draft.criticalPassed === null ? '' : String(draft.criticalPassed)} onChange={e => save(a => { a.criticalPassed = e.target.value === '' ? null : e.target.value === 'true'; })}><option value="">Choose after checking</option><option value="true">Yes</option><option value="false">No, or still uncertain</option></Select></Field>
        <Field label="Where to pick up next (optional)" htmlFor="practiceResume"><TextArea id="practiceResume" rows={2} maxLength={1000} value={draft.resumePoint} onChange={e => save(a => { a.resumePoint = e.target.value; })} /></Field>
        {problem && <p role="alert">{problem}</p>}
        <Button variant="primary" data-action="practice-submit" onClick={submit}>{p.kind === 'external' ? 'Save my check-in' : 'Save attempt and check'}</Button>
        <p className="text-sm text-fg-2 m-0">Your draft saves as you work. Keep passwords, tokens and challenge flags out of your notebook. Unfinished or unsuccessful attempts can be saved too.</p>
      </div>
    </Card> : <Card><Button data-action="practice-begin" variant="primary" onClick={() => { if (update(d => { if (!beginAttempt(d, p.id)) return false; })) setProblem(''); }}>{attempts.length ? 'Start another attempt' : p.kind === 'external' ? 'Start this assignment' : 'Start this practice'}</Button></Card>}
    {[...attempts].reverse().filter(a => a.submittedAt || !currentAttempt(a)).map(a => <PracticeResult key={a.id} a={a} p={p} />)}
    <Card><h3>Connected lessons</h3><div className="grid gap-2">{p.lessonIds.map(id => <InlineLink key={id} href={lessonHref(id)}>{lessons.get(id)!.title}</InlineLink>)}</div></Card>
  </>;
}
type InputProps = { attempt: CyberAttempt; save: (fn: (a: CyberAttempt) => void) => void };
function ScopeInputs({ attempt: a, save }: InputProps) {
  return <>{scopeCases.map((q, i) => <Field key={q.id} label={`${i + 1}. ${q.prompt}`} htmlFor={q.id}><Select id={q.id} value={answer(a, q.id)} onChange={e => save(a => { a.answers[answerKey(q.id)] = e.target.value; })}>
    <option value="">Choose a next step</option>{Object.entries(scopeChoices).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
  </Select></Field>)}</>;
}
function NetworkInputs({ attempt: a, save }: InputProps) {
  const c = networkConfig(a), ran = answer(a, 'run') === networkSignature(c), result = simulateNetwork(c);
  return <>
    <Field label="Fault to investigate (changing this resets the simulated settings)" htmlFor="networkScenario"><Select id="networkScenario" value={c.scenario} onChange={e => save(a => setScenario(a, e.target.value as keyof typeof networkScenarios))}>{Object.entries(networkScenarios).map(([id, s]) => <option key={id} value={id}>{s.name}</option>)}</Select></Field>
    <div className="rounded-tile border border-outline p-3"><p className="font-semibold mt-0">Laptop → local router → training website</p><p className="text-sm text-fg-2 mb-0">Laptop 10.20.0.10/24 · Router 10.20.0.1 · training.example at 198.51.100.20. DNS is a service on the local network.</p></div>
    <div className="grid sm:grid-cols-3 gap-3">
      <Field label="Local DNS service" htmlFor="networkDns"><Select id="networkDns" value={c.dns} onChange={e => save(a => { a.answers[answerKey('dns')] = e.target.value; })}><option value="unavailable">Unavailable</option><option value="available">Available</option></Select></Field>
      <Field label="Laptop's default gateway" htmlFor="networkGateway"><Select id="networkGateway" value={c.gateway} onChange={e => save(a => { a.answers[answerKey('gateway')] = e.target.value; })}><option value="10.99.0.1">10.99.0.1</option><option value="10.20.0.1">10.20.0.1</option></Select></Field>
      <Field label="Outbound TCP 443" htmlFor="networkHttps"><Select id="networkHttps" value={c.https} onChange={e => save(a => { a.answers[answerKey('https')] = e.target.value; })}><option value="block">Blocked</option><option value="allow">Allowed</option></Select></Field>
    </div>
    <Button data-action="network-run" onClick={() => save(a => { a.answers[answerKey('run')] = networkSignature(networkConfig(a)); })}>Run connection test</Button>
    {ran && <section aria-live="polite" aria-label="Connection trace" className="rounded-tile bg-surface-3 p-4"><h4 className="mt-0">{result.connected ? 'Website reached in the simulation' : 'Connection stopped'}</h4><ol className="list-decimal pl-5 space-y-2">{result.trace.map(line => <li key={line}>{line}</li>)}</ol></section>}
    <p className="text-sm text-fg-2 m-0">This model omits DHCP, caching, packet loss and certificate failures. It assumes the remote server works. A successful connection is not a security assessment.</p>
  </>;
}
function LogInputs({ attempt: a, save }: InputProps) {
  const [filter, setFilter] = useState('');
  const rows = authRows.map((row, i) => ({ row, i })).filter(({ row }) => row.join(' ').toLowerCase().includes(filter.toLowerCase()));
  return <>
    <Field label="Filter the raw rows" htmlFor="logFilter"><TextInput id="logFilter" type="search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="e.g. demo-target, failure, auth-025" /></Field>
    <p className="text-sm m-0">Showing {rows.length} of {authRows.length} raw rows. Answer the questions for the entire file, including rows hidden by the filter.</p>
    <div className="overflow-auto max-h-96 rounded-tile border border-outline" tabIndex={0} role="region" aria-label="Synthetic sign-in events"><table className="w-full text-xs text-left whitespace-nowrap"><caption className="sr-only">Raw synthetic authentication file, including invalid and repeated rows</caption><thead><tr>{['Row', 'Event', 'Timestamp', 'User', 'Source', 'Result', 'Host'].map(h => <th key={h} scope="col" className="p-2 border-b border-outline">{h}</th>)}</tr></thead><tbody>{rows.map(({ row, i }) => <tr key={i}>{[String(i + 1), ...row].map((cell, j) => <td key={j} className="p-2 border-b border-outline">{cell || '(empty)'}</td>)}</tr>)}</tbody></table></div>
    <a className="text-primary min-h-11 py-2" href={import.meta.env.BASE_URL + 'cybersecurity/synthetic_auth.csv'} download>Download these raw rows as CSV</a>
    <div className="grid sm:grid-cols-2 gap-3">{logQuestions.map(q => <Field key={q.id} label={q.label} htmlFor={'log-' + q.id}><TextInput id={'log-' + q.id} inputMode="numeric" maxLength={3} value={answer(a, q.id)} onChange={e => save(a => { a.answers[answerKey(q.id)] = e.target.value; })} /></Field>)}</div>
    <p className="text-sm text-fg-2 m-0">A repeated event ID is counted once after validation. Compare timestamps by their instant, not just their displayed hour: offsets can differ.</p>
  </>;
}
function PracticeResult({ a, p }: { a: CyberAttempt; p: Practice }) {
  const current = currentAttempt(a), checks = current && a.submittedAt ? practiceChecks(a, p) : [];
  return <Card><Eyebrow>Notebook entry · {new Date(a.submittedAt ?? a.startedAt).toLocaleDateString('en-GB')}</Eyebrow>
    <h3>{p.kind === 'external' ? outcomes[answer(a, 'outcome') as keyof typeof outcomes] ?? 'Saved attempt' : a.inputVariant}</h3>
    <p className="text-sm text-fg-2">{p.kind === 'external' ? 'Reported by you · provider progress not verified' : 'Local practice · does not award verified mastery'} · {a.assistance} · {a.rubricVersion}</p>
    <p className="whitespace-pre-wrap">{a.evidence}</p><p className="text-sm text-fg-2">Scope and evidence check: {a.criticalPassed === true ? 'recorded as passed' : 'unresolved'}.</p>
    {a.resumePoint && <p>Next step: {a.resumePoint}</p>}
    {!current && <p>This entry uses an earlier activity version. Its original inputs are kept below and have not been regraded.</p>}
    {!!checks.length && <section aria-label="Practice feedback"><h4>{checks.filter(c => c.passed).length} of {checks.length} checks matched</h4><p className="text-sm text-fg-2">These checks cover the choices or counts only. Your explanation and real-world skill have not been assessed.</p>{checks.map(c => <div key={c.label} className="border-t border-outline py-3"><p className="font-semibold m-0">{c.passed ? 'Matched' : 'Review'} · {c.label}</p><p className="text-sm mb-0">{c.feedback}</p></div>)}</section>}
    {!!checks.length && p.kind === 'logs' && <p className="text-sm text-fg-2">Events auth-023 through auth-028 show repeated failures followed by success for demo-target. That warrants investigation; it does not establish who acted or prove a compromise. auth-001 includes an offset: its UTC time is 10:01.</p>}
    <details><summary className="text-primary cursor-pointer min-h-11 py-2">Inputs saved with this attempt</summary><ul className="list-disc pl-5 text-sm">{Object.entries(a.answers).filter(([key]) => key !== answerKey('run')).map(([key, value]) => {
      const name = key.replace('assessment.practice.', '');
      const scope = scopeCases.find(q => q.id === name);
      const label = scope ? scope.prompt : logQuestions.find(q => q.id === name)?.label ?? ({ outcome: 'Outcome', scenario: 'Network scenario', gateway: 'Default gateway', dns: 'Local DNS', https: 'TCP 443 rule' } as Record<string, string>)[name] ?? name;
      const shown = scope ? scopeChoices[value as keyof typeof scopeChoices] ?? value : name === 'outcome' ? outcomes[value as keyof typeof outcomes] ?? value : name === 'scenario' ? networkScenarios[value as keyof typeof networkScenarios]?.name ?? value : value;
      return <li key={key}>{label}: {shown}</li>;
    })}</ul></details>
  </Card>;
}
