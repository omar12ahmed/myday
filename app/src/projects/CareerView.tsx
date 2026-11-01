import { Briefcase, CalendarPlus, Plus, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select, TextInput } from '../components/Field';
import { Choice, Choices } from '../components/parts';
import {
  addApplication, addInterview, addQuestion, addRole, applicationsOf, applicationWhen, CAREER_LIMITS, careerGlance, careerItem, CLOSE_REASONS, closeApplication, companyOf,
  editApplication, editInterview, editRole, followUp, INTERVIEW_KINDS, interviewKindLabel, interviewsOf, interviewTask, isApplication, isOpen, portfolioOfRole, prepareDay,
  questionsOf, removeInterview, removeItem, removeQuestion, roleTitle, rolesOf, setClosedWhy, setStage, stageLabel, stageOf, STAGES, tickQuestion, togglePortfolio,
} from '../data/career';
import { shortDate, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { TASK_LIMITS } from '../data/tasks';
import { toast } from '../data/toast';
import type { CareerApplication, CareerInterview, CareerRole, CareerStage, DateKey, MyDayData, Project } from '../data/types';
import { tabHref } from './planText';

// Career projects (specs/projects-career.md): the Overview's card, the Applications tab (the roles you're aiming for,
// then your applications by stage, each with its interviews), and Needs you's "Heard back?" answers. The rules are in
// data/career.ts. A closed application says why in your words — never counted as a rejection. Never sent to AI.
// A row's editor is drawn only while it's open.
const enc = encodeURIComponent;
const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const save = (fn: (d: MyDayData) => boolean) => update(d => (fn(d) ? undefined : false));
const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const tidy = (s: string, max: number) => Array.from(s.trim()).slice(0, max).join('');
const ROW_LINK = 'inline-flex items-center min-h-11 text-fg no-underline hover:underline underline-offset-4';
const nameOf = (a: CareerApplication) => (a.title ? `${companyOf(a)} — ${a.title}` : companyOf(a));

// ---------- The Overview ----------
export function CareerCard({ data, p }: { data: MyDayData; p: Project }) {
  const g = careerGlance(data, p), n = g.next;
  return (
    <Card aria-labelledby="careerH" data-s="career-card">
      <h3 id="careerH" className="m-0 flex items-center gap-2"><Briefcase size={20} aria-hidden="true" className="text-primary" /> Career at a glance</h3>
      <ul className="list-none p-0 m-0 mt-1 grid text-[15px]">
        <li><a href={tabHref(p, 'applications')} className={ROW_LINK} data-s="cr-open">{g.open ? [`${plural(g.open, 'application')} open`, g.interviewing && `${g.interviewing} interviewing`, g.offers && plural(g.offers, 'offer')].filter(Boolean).join(' · ') : 'No applications open'}</a></li>
        <li><a href={tabHref(p, 'applications')} className={ROW_LINK} data-s="cr-next">{n ? `Next interview: ${companyOf(n.application)} — ${shortDate(n.interview.on)}${n.interview.at ? ` at ${n.interview.at}` : ''}` : 'No interview coming up'}</a></li>
        <li><a href={tabHref(p, 'applications')} className={ROW_LINK} data-s="cr-roles">{g.roles ? `${plural(g.roles, 'role')} you’re aiming for` : 'No roles yet — name the ones you’re aiming for'}</a></li>
      </ul>
    </Card>
  );
}

// ---------- Closing gently: why, in your words ----------
// Tap a reason or write your own; Close keeps it and the day. `onDone` after closing (or cancelling: false).
function CloseForm({ a, onDone }: { a: CareerApplication; onDone: (closed: boolean) => void }) {
  const [why, setWhy] = useState(''), id = `closeWhy-${a.id}`;
  function close(w: string) {
    if (save(d => closeApplication(d, a.id, w))) { toast(`Closed${w.trim() ? ` — ${tidy(w, CAREER_LIMITS.why)}` : ''}.`); onDone(true); }
  }
  return (
    <form className="grid gap-2 rounded-tile border border-outline p-3 mt-2" onSubmit={e => { e.preventDefault(); close(why); }} data-s="close-form">
      <p className="m-0 text-[15px]">Why, in your words? <span className="text-fg-2">(It’s only for you.)</span></p>
      <Choices label={`Why “${nameOf(a)}” closed`}>
        {CLOSE_REASONS.map(r => <Choice key={r} on={why === r} data-action="close-why" data-why={r} onClick={() => setWhy(r)}>{r}</Choice>)}
      </Choices>
      <Field label="Or your own words" htmlFor={id}><TextInput id={id} value={CLOSE_REASONS.includes(why) ? '' : why} maxLength={CAREER_LIMITS.why} onChange={e => setWhy(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2.5">
        <Button inline type="submit" variant="primary" data-action="close-confirm" aria-label={`Close “${nameOf(a)}”`}>Close it</Button>
        <Button inline variant="ghost" data-action="close-cancel" onClick={() => onDone(false)}>Not now</Button>
      </div>
    </form>
  );
}

// ---------- Needs you: "Heard back from Acme?" ----------
export function FollowUpActions({ data, applicationId }: { data: MyDayData; applicationId: string }) {
  const [closing, setClosing] = useState(false), x = careerItem(data, applicationId);
  if (!x || !isApplication(x)) return null;
  const a = x;
  function follow() {
    if (save(d => !!followUp(d, a.id))) { toast(`Task added: “${tidy(`Follow up: ${companyOf(a)}`, TASK_LIMITS.title)}”, for today.`); focusSoon('needs-h'); }
    else toast('Couldn’t add the task just now.');
  }
  if (closing) return <CloseForm a={a} onDone={closed => { setClosing(false); focusSoon(closed ? 'needs-h' : `followClose-${a.id}`); }} />;
  return (
    <div className="flex flex-wrap gap-2" data-s="follow-up">
      <Button inline variant="tonal" data-action="follow-up" aria-label={`Follow up with ${companyOf(a)} — make a task`} onClick={follow}>Follow up</Button>
      <Button inline variant="ghost" id={`followClose-${a.id}`} data-action="follow-close" aria-label={`Close “${nameOf(a)}”`} onClick={() => { setClosing(true); focusSoon(`closeWhy-${a.id}`); }}>Close it</Button>
    </div>
  );
}

// ---------- The Applications tab ----------
const ORDER: CareerStage[] = ['interviewing', 'offer', 'applied', 'interested'];
function useOpened() {
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string, open: boolean) => setOpened(o => { if (o.has(id) === open) return o; const n = new Set(o); if (open) n.add(id); else n.delete(id); return n; });
  return [opened, toggle] as const;
}
export function ApplicationsView({ data, p }: { data: MyDayData; p: Project }) {
  const all = applicationsOf(data, p.id), roles = rolesOf(data, p.id), [opened, setOpen] = useOpened();
  const open = all.filter(isOpen), closed = all.filter(a => !isOpen(a));
  const row = (a: CareerApplication) => <ApplicationRow key={a.id} data={data} a={a} roles={roles} open={opened.has(a.id)} onToggle={o => setOpen(a.id, o)} />;
  return (
    <>
      <RolesCard data={data} p={p} roles={roles} />
      <Card aria-labelledby="appsH" id="projectApplications">
        <h2 id="appsH" tabIndex={-1} className="flex items-center gap-2"><Briefcase size={22} aria-hidden="true" className="text-primary" /> Applications {open.length > 0 && <span className="text-fg-3 font-normal text-[18px]">{open.length} open</span>}</h2>
        <ApplicationForm p={p} roles={roles} full={all.length >= CAREER_LIMITS.applications} />
        {open.length ? ORDER.map(st => {
          const here = open.filter(a => stageOf(a) === st);
          return here.length > 0 && (
            <section key={st} className="mt-3" aria-labelledby={`appsStage-${st}`} data-s="app-group" data-stage={st}>
              <h3 id={`appsStage-${st}`} className="m-0 text-[15px]">{stageLabel(st)} <span className="text-fg-3 font-normal tabular-nums">{here.length}</span></h3>
              <ul className="list-none p-0 m-0">{here.map(row)}</ul>
            </section>
          );
        }) : <p className="m-0 mt-3 text-[15px] text-fg-2" data-s="apps-none">No applications open.</p>}
        {/* (Open ones of a stage this version doesn't know are listed with Interested.) */}
        {open.some(a => !ORDER.includes(stageOf(a) as CareerStage)) && <ul className="list-none p-0 m-0 mt-3">{open.filter(a => !ORDER.includes(stageOf(a) as CareerStage)).map(row)}</ul>}
        {closed.length > 0 && (
          <details className="mt-3" data-s="apps-closed"><summary className="cursor-pointer min-h-11 flex items-center text-fg-2 font-semibold">Closed ({closed.length})</summary>
            <ul className="list-none p-0 m-0">{closed.map(row)}</ul>
          </details>
        )}
      </Card>
    </>
  );
}

// Roles you're aiming for, with the work that shows it (your Cybersecurity portfolio, by reference).
function RolesCard({ data, p, roles }: { data: MyDayData; p: Project; roles: CareerRole[] }) {
  const confirm = useConfirm(), [title, setTitle] = useState(''), [opened, setOpen] = useOpened(), full = roles.length >= CAREER_LIMITS.roles;
  function add() {
    let id: string | null = null;
    if (!save(d => !!(id = addRole(d, p.id, title)))) { if (full) toast(`That’s ${CAREER_LIMITS.roles} roles — as many as one project keeps.`); return; }
    setTitle(''); toast('Role added.'); setOpen(id!, false); focusSoon('roleNew');
  }
  async function remove(r: CareerRole) {
    if (!(await confirm({ title: 'Remove this role?', body: `“${roleTitle(r)}”. Applications for it keep everything else.`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (save(d => removeItem(d, r.id))) { toast('Role removed.'); focusSoon('rolesH'); }
  }
  const portfolio = data.cybersecurity.portfolio ?? [];
  return (
    <Card aria-labelledby="rolesH" id="projectRoles">
      <h2 id="rolesH" tabIndex={-1} className="flex items-center gap-2"><Target size={22} aria-hidden="true" className="text-primary" /> Roles you’re aiming for</h2>
      {roles.length > 0 ? (
        <ul className="list-none p-0 m-0" data-s="roles">
          {roles.map(r => {
            const shows = portfolioOfRole(data, r), on = new Set(shows.map(e => e.id)), name = roleTitle(r);
            return (
              <li key={r.id} className="border-t border-outline first:border-t-0" data-s="role" data-id={r.id} data-aside={r.aside ? 'yes' : 'no'}>
                <details open={opened.has(r.id)} onToggle={e => setOpen(r.id, (e.currentTarget as HTMLDetailsElement).open)}>
                  <summary className="cursor-pointer min-h-11 py-2 flex flex-col justify-center" data-action="role-open">
                    <span className="font-semibold break-words">{name}</span>
                    <span className="text-sm text-fg-2" data-s="role-line">{[r.aside ? 'Set aside' : 'Aiming for it', shows.length && `${plural(shows.length, 'piece')} of work that shows it`].filter(Boolean).join(' · ')}</span>
                  </summary>
                  {opened.has(r.id) && (
                    <div className="pb-3 grid gap-2">
                      <Field label="Role" htmlFor={`roleTitle-${r.id}`}><CommitInput id={`roleTitle-${r.id}`} key={r.title} defaultValue={r.title} maxLength={CAREER_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = r.title; return; } save(d => editRole(d, r.id, { title: el.value })); }} /></Field>
                      <Field label="Notes (optional)" htmlFor={`roleNotes-${r.id}`}><CommitTextarea id={`roleNotes-${r.id}`} aria-label={`Notes (optional), for “${name}”`} rows={2} key={r.notes ?? ''} defaultValue={r.notes ?? ''} maxLength={CAREER_LIMITS.notes} onCommit={el => save(d => editRole(d, r.id, { notes: el.value }))} /></Field>
                      <fieldset className="border-0 p-0 m-0" data-s="role-portfolio">
                        <legend className="text-sm font-semibold mb-1">Work that shows it<span className="sr-only">, for “{name}”</span></legend>
                        {portfolio.length ? <ul className="list-none p-0 m-0">{portfolio.map(e => (
                          <li key={e.id} className="min-h-11 flex items-center"><label className="flex items-center gap-2 cursor-pointer py-1 min-w-0"><input type="checkbox" className="size-5 flex-none accent-[var(--primary)]" checked={on.has(e.id)} data-action="role-portfolio" value={e.id}
                            onChange={() => { if (!save(d => togglePortfolio(d, r.id, e.id)) && !on.has(e.id)) toast(`That’s ${CAREER_LIMITS.portfolio} pieces of work — as many as one role keeps.`); }} /><span className="break-words">{e.title}</span></label></li>))}</ul>
                          : <p className="m-0 text-sm text-fg-2">Your Cybersecurity portfolio has no entries yet — they’re added in Study, and stay there.</p>}
                      </fieldset>
                      <div className="flex flex-wrap gap-2">
                        <Button inline variant="ghost" data-action="role-aside" aria-label={r.aside ? `Aim for “${name}” again` : `Set “${name}” aside`} onClick={() => { if (save(d => editRole(d, r.id, { aside: !r.aside }))) toast(r.aside ? 'Aiming for it again.' : 'Set aside — it stays here.'); }}>{r.aside ? 'Aim for it again' : 'Set aside'}</Button>
                        <Button inline variant="ghost" data-action="role-remove" aria-label={`Remove “${name}”`} onClick={() => remove(r)}><Trash2 size={16} aria-hidden="true" /> Remove</Button>
                      </div>
                    </div>
                  )}
                </details>
              </li>
            );
          })}
        </ul>
      ) : <p className="m-0 text-[15px] text-fg-2" data-s="roles-none">Name the roles you’re aiming for — “SOC analyst”, “Junior penetration tester” — and the work that shows you can do them.</p>}
      <form className="flex flex-wrap items-end gap-2 mt-2" onSubmit={e => { e.preventDefault(); add(); }} data-s="role-form">
        <Field label="A role you’re aiming for" htmlFor="roleNew" className="flex-1 min-w-[12rem]"><TextInput id="roleNew" value={title} maxLength={CAREER_LIMITS.title} placeholder="e.g. SOC analyst" onChange={e => setTitle(e.target.value)} /></Field>
        <Button inline type="submit" variant="tonal" data-action="role-add" aria-label="Add the role" disabled={!title.trim() || full}><Plus size={18} aria-hidden="true" /></Button>
      </form>
    </Card>
  );
}

// (Its own state, so typing here doesn't redraw the list.)
function ApplicationForm({ p, roles, full }: { p: Project; roles: CareerRole[]; full: boolean }) {
  const [company, setCompany] = useState(''), [title, setTitle] = useState(''), [roleId, setRoleId] = useState(''), [applied, setApplied] = useState(false), [on, setOn] = useState(todayKey());
  function add() {
    if (!save(d => !!addApplication(d, p.id, { company, title, roleId: roleId || null }, applied ? (on || todayKey()) as DateKey : null))) { if (full) toast(`That’s ${CAREER_LIMITS.applications} applications — as many as one project keeps.`); return; }
    setCompany(''); setTitle(''); setApplied(false); setOn(todayKey()); toast(applied ? 'Application added, at Applied.' : 'Application added, at Interested.'); focusSoon('appCompany');
  }
  const live = roles.filter(r => !r.aside);
  return (
    <form className="grid gap-2 mt-3 rounded-card border border-outline bg-surface p-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); add(); }} data-s="app-form">
      <Field label="Company" htmlFor="appCompany"><TextInput id="appCompany" value={company} maxLength={CAREER_LIMITS.company} placeholder="e.g. Acme Security" onChange={e => setCompany(e.target.value)} /></Field>
      <Field label="The role, as advertised (optional)" htmlFor="appTitle"><TextInput id="appTitle" value={title} maxLength={CAREER_LIMITS.title} placeholder="e.g. Junior SOC analyst" onChange={e => setTitle(e.target.value)} /></Field>
      {live.length > 0 && <Field label="For which of your roles (optional)" htmlFor="appRole"><Select id="appRole" value={roleId} onChange={e => setRoleId(e.target.value)}><option value="">None in particular</option>{live.map(r => <option key={r.id} value={r.id}>{roleTitle(r)}</option>)}</Select></Field>}
      <div className="grid gap-2 sm:col-span-2 sm:grid-cols-[auto_auto] sm:justify-start sm:items-end">
        <label className="inline-flex items-center gap-2 min-h-11 cursor-pointer"><input type="checkbox" className="size-5 accent-[var(--primary)]" checked={applied} onChange={e => setApplied(e.target.checked)} data-action="app-applied" /> I’ve applied</label>
        {applied && <Field label="On" htmlFor="appAppliedOn"><TextInput id="appAppliedOn" type="date" className="!w-auto" value={on} max={todayKey()} onChange={e => setOn(e.target.value)} /></Field>}
      </div>
      <div className="sm:col-span-2"><Button inline type="submit" variant="primary" data-action="app-add" disabled={!company.trim() || full}><Plus size={18} aria-hidden="true" /> Add</Button></div>
    </form>
  );
}

function ApplicationRow({ data, a, roles, open, onToggle }: { data: MyDayData; a: CareerApplication; roles: CareerRole[]; open: boolean; onToggle: (open: boolean) => void }) {
  const confirm = useConfirm(), [closing, setClosing] = useState(false), st = stageOf(a), name = nameOf(a);
  async function remove() {
    if (!(await confirm({ title: 'Remove this application?', body: `“${name}” and its interviews. Its tasks stay. To keep it but put it away, close it instead.`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (save(d => removeItem(d, a.id))) { toast('Application removed.'); focusSoon('appsH'); }
  }
  // Moving it on regroups the list: focus stays on the row (its summary), wherever it lands.
  function move(to: CareerStage) {
    if (!save(d => setStage(d, a.id, to))) return;
    toast(`Now at ${stageLabel(to)}.`); focusSoon(`appStage-${a.id}-${to}`);
  }
  const role = a.roleId ? roles.find(r => r.id === a.roleId) : undefined;
  return (
    <li className="border-t border-outline first:border-t-0" data-s="application" data-id={a.id} data-stage={st}>
      <details open={open} onToggle={e => onToggle((e.currentTarget as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer min-h-11 py-2 flex flex-col justify-center" data-action="app-open">
          <span className="font-semibold break-words">{name}</span>
          <span className="text-sm text-fg-2" data-s="app-line">{[stageLabel(st), applicationWhen(a), role && `for ${roleTitle(role)}`].filter(Boolean).join(' · ')}</span>
        </summary>
        {open && (
          <div className="pb-3 grid gap-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Company" htmlFor={`appCompany-${a.id}`}><CommitInput id={`appCompany-${a.id}`} key={a.company} defaultValue={a.company} maxLength={CAREER_LIMITS.company} onCommit={el => { if (!el.value.trim()) { el.value = a.company; return; } save(d => editApplication(d, a.id, { company: el.value })); }} /></Field>
              <Field label="The role, as advertised" htmlFor={`appTitle-${a.id}`}><CommitInput id={`appTitle-${a.id}`} aria-label={`The role, as advertised, for ${companyOf(a)}`} key={a.title ?? ''} defaultValue={a.title ?? ''} maxLength={CAREER_LIMITS.title} onCommit={el => save(d => editApplication(d, a.id, { title: el.value }))} /></Field>
              {roles.length > 0 && <Field label="For which of your roles" htmlFor={`appRole-${a.id}`}><Select id={`appRole-${a.id}`} aria-label={`For which of your roles, for ${companyOf(a)}`} value={role ? role.id : ''} onChange={e => save(d => editApplication(d, a.id, { roleId: e.target.value || null }))}><option value="">None in particular</option>{roles.map(r => <option key={r.id} value={r.id}>{roleTitle(r)}{r.aside ? ' (set aside)' : ''}</option>)}</Select></Field>}
              <Field label="The advert or application (a link)" htmlFor={`appUrl-${a.id}`}><CommitInput id={`appUrl-${a.id}`} aria-label={`The advert or application (a link), for ${companyOf(a)}`} inputMode="url" spellCheck={false} key={a.url ?? ''} defaultValue={a.url ?? ''} maxLength={CAREER_LIMITS.url}
                onCommit={el => { if (!save(d => editApplication(d, a.id, { url: el.value })) && el.value.trim() && el.value.trim() !== (a.url ?? '')) { toast('That isn’t a web address — nothing changed.'); el.value = a.url ?? ''; } }} /></Field>
              <Field label="Who you’re in touch with" htmlFor={`appContact-${a.id}`}><CommitInput id={`appContact-${a.id}`} aria-label={`Who you’re in touch with, for ${companyOf(a)}`} key={a.contact ?? ''} defaultValue={a.contact ?? ''} maxLength={CAREER_LIMITS.contact} onCommit={el => save(d => editApplication(d, a.id, { contact: el.value }))} /></Field>
            </div>
            <Field label="Notes" htmlFor={`appNotes-${a.id}`}><CommitTextarea id={`appNotes-${a.id}`} aria-label={`Notes, for ${companyOf(a)}`} rows={2} key={a.notes ?? ''} defaultValue={a.notes ?? ''} maxLength={CAREER_LIMITS.notes} onCommit={el => save(d => editApplication(d, a.id, { notes: el.value }))} /></Field>
            {st === 'closed' ? (
              <div className="grid gap-2" data-s="app-closed">
                <Field label="Why it closed" htmlFor={`appWhy-${a.id}`}><CommitInput id={`appWhy-${a.id}`} aria-label={`Why it closed, for ${companyOf(a)}`} key={a.closedWhy ?? ''} defaultValue={a.closedWhy ?? ''} maxLength={CAREER_LIMITS.why} onCommit={el => save(d => setClosedWhy(d, a.id, el.value))} /></Field>
                <div><Button inline variant="tonal" data-action="app-reopen" aria-label={`Open “${name}” again`} onClick={() => { if (save(d => setStage(d, a.id, a.appliedOn ? 'applied' : 'interested'))) { toast('Open again.'); focusSoon('appsH'); } }}>Open it again</Button></div>
              </div>
            ) : (<>
              <Choices label={`Where “${name}” is at`}>
                {STAGES.filter(s => s.id !== 'closed').map(s => <Choice key={s.id} id={`appStage-${a.id}-${s.id}`} on={st === s.id} data-action="app-stage" data-stage={s.id} onClick={() => move(s.id)}>{s.label}</Choice>)}
              </Choices>
              {a.appliedOn && <Field label="Applied on" htmlFor={`appAppliedOn-${a.id}`} className="max-w-xs"><CommitInput id={`appAppliedOn-${a.id}`} aria-label={`Applied on, for ${companyOf(a)}`} type="date" className="!w-auto" key={a.appliedOn} defaultValue={a.appliedOn} max={todayKey()} onCommit={el => { if (!el.value) { el.value = a.appliedOn!; return; } save(d => editApplication(d, a.id, { appliedOn: el.value as DateKey })); }} /></Field>}
              {closing ? <CloseForm a={a} onDone={closed => { setClosing(false); focusSoon(closed ? 'appsH' : `appClose-${a.id}`); }} />
                : <div><Button inline variant="ghost" id={`appClose-${a.id}`} data-action="app-close" aria-label={`Close “${name}”`} onClick={() => { setClosing(true); focusSoon(`closeWhy-${a.id}`); }}>Close it</Button></div>}
            </>)}
            <Interviews data={data} a={a} />
            <div><Button inline variant="ghost" data-action="app-remove" aria-label={`Remove “${name}”`} onClick={remove}><Trash2 size={16} aria-hidden="true" /> Remove</Button></div>
          </div>
        )}
      </details>
    </li>
  );
}

// ---------- An application's interviews ----------
function Interviews({ data, a }: { data: MyDayData; a: CareerApplication }) {
  const list = interviewsOf(a), [on, setOn] = useState(''), [at, setAt] = useState(''), [kind, setKind] = useState(''), full = list.length >= CAREER_LIMITS.interviews, company = companyOf(a);
  function add() {
    let iid: string | null = null;
    if (!save(d => !!(iid = addInterview(d, a.id, on as DateKey, { at: at || null, kind: kind || null })))) { if (full) toast(`That’s ${CAREER_LIMITS.interviews} interviews — as many as one application keeps.`); return; }
    const due = prepareDay(on as DateKey);
    toast(due ? `Interview added — “${tidy(`Prepare for ${company} interview`, TASK_LIMITS.title)}” is on ${shortDate(due)}.` : 'Interview added.');
    setOn(''); setAt(''); setKind(''); focusSoon(`ivPrep-${iid}`);
  }
  return (
    <section className="mt-1" aria-labelledby={`ivH-${a.id}`} data-s="interviews">
      <h4 id={`ivH-${a.id}`} tabIndex={-1} className="m-0 text-[15px]">Interviews<span className="sr-only"> with {company}</span></h4>
      {list.length > 0 && <ul className="list-none p-0 m-0">{list.map(iv => <InterviewRow key={iv.id} data={data} a={a} iv={iv} />)}</ul>}
      <form className="flex flex-wrap items-end gap-2 mt-1" onSubmit={e => { e.preventDefault(); add(); }} data-s="iv-form">
        <Field label="An interview on" htmlFor={`ivNewOn-${a.id}`}><TextInput id={`ivNewOn-${a.id}`} aria-label={`An interview with ${company} on`} type="date" className="!w-auto" value={on} onChange={e => setOn(e.target.value)} /></Field>
        <Field label="At (optional)" htmlFor={`ivNewAt-${a.id}`}><TextInput id={`ivNewAt-${a.id}`} aria-label={`At (optional), for the interview with ${company}`} type="time" className="!w-auto" value={at} onChange={e => setAt(e.target.value)} /></Field>
        <Field label="How (optional)" htmlFor={`ivNewKind-${a.id}`}><Select id={`ivNewKind-${a.id}`} aria-label={`How (optional), for the interview with ${company}`} className="!w-auto" value={kind} onChange={e => setKind(e.target.value)}><option value="">—</option>{INTERVIEW_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</Select></Field>
        <Button inline type="submit" variant="tonal" data-action="iv-add" aria-label={`Add the interview with ${company}`} disabled={!on || full}><CalendarPlus size={18} aria-hidden="true" /> Add</Button>
      </form>
    </section>
  );
}
function InterviewRow({ data, a, iv }: { data: MyDayData; a: CareerApplication; iv: CareerInterview }) {
  const confirm = useConfirm(), t = interviewTask(data, iv), qs = questionsOf(iv), [q, setQ] = useState(''), company = companyOf(a);
  const when = `${shortDate(iv.on)}${iv.at ? ` at ${iv.at}` : ''}`;
  async function remove() {
    if (!(await confirm({ title: 'Remove this interview?', body: `${company}, ${when}. Its Prepare task stays.`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (save(d => removeInterview(d, a.id, iv.id))) { toast('Interview removed.'); focusSoon(`ivH-${a.id}`); }
  }
  function addQ() {
    if (!save(d => !!addQuestion(d, a.id, iv.id, q))) { if (qs.length >= CAREER_LIMITS.questions) toast(`That’s ${CAREER_LIMITS.questions} questions — plenty for one interview.`); return; }
    setQ(''); focusSoon(`qNew-${iv.id}`);
  }
  return (
    <li className="border-t border-outline first:border-t-0 py-2 grid gap-2" data-s="interview" data-id={iv.id}>
      <p className="m-0 font-medium" data-s="iv-line">{[when, interviewKindLabel(iv.kind)].filter(Boolean).join(' · ')}</p>
      {t && <p className="m-0 text-sm text-fg-2" data-s="iv-task">Its task: <a href={`#today/tasks/${enc(t.task.id)}`} className="inline-flex items-center min-h-11 text-primary underline-offset-4 hover:underline">{t.task.title}</a>{t.done ? ' — done' : t.task.due ? ` — ${shortDate(t.task.due)}` : ''}</p>}
      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="On" htmlFor={`ivOn-${iv.id}`}><CommitInput id={`ivOn-${iv.id}`} aria-label={`On, for the interview with ${company}`} type="date" className="!w-auto" key={iv.on} defaultValue={iv.on} onCommit={el => { if (!el.value) { el.value = iv.on; return; } save(d => editInterview(d, a.id, iv.id, { on: el.value as DateKey })); }} /></Field>
        <Field label="At" htmlFor={`ivAt-${iv.id}`}><CommitInput id={`ivAt-${iv.id}`} aria-label={`At, for the interview with ${company}`} type="time" className="!w-auto" key={iv.at ?? ''} defaultValue={iv.at ?? ''} onCommit={el => save(d => editInterview(d, a.id, iv.id, { at: el.value || null }))} /></Field>
        <Field label="How" htmlFor={`ivKind-${iv.id}`}><Select id={`ivKind-${iv.id}`} aria-label={`How, for the interview with ${company}`} className="!w-auto" value={iv.kind ?? ''} onChange={e => save(d => editInterview(d, a.id, iv.id, { kind: e.target.value || null }))}><option value="">—</option>{INTERVIEW_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</Select></Field>
      </div>
      <Field label="Prep notes" htmlFor={`ivPrep-${iv.id}`}><CommitTextarea id={`ivPrep-${iv.id}`} aria-label={`Prep notes, for the interview with ${company}`} rows={3} key={iv.prep ?? ''} defaultValue={iv.prep ?? ''} maxLength={CAREER_LIMITS.prep} placeholder="What they do, what the role needs, stories that show you can" onCommit={el => save(d => editInterview(d, a.id, iv.id, { prep: el.value }))} /></Field>
      <fieldset className="border-0 p-0 m-0" data-s="iv-questions">
        <legend className="text-sm font-semibold mb-1">Questions to ask<span className="sr-only"> {company}</span></legend>
        {qs.length > 0 && <ul className="list-none p-0 m-0">{qs.map(x => (
          <li key={x.id} className="flex items-center gap-2" data-s="question" data-id={x.id} data-done={x.done ? 'yes' : 'no'}>
            <label className="flex items-center gap-2 flex-1 min-w-0 min-h-11 cursor-pointer"><input type="checkbox" className="size-5 flex-none accent-[var(--primary)]" checked={!!x.done} aria-label={`Asked: ${x.text}`} data-action="question-tick" onChange={() => save(d => tickQuestion(d, a.id, iv.id, x.id))} /><span className="break-words">{x.text}</span></label>
            <Button inline variant="ghost" aria-label={`Remove the question “${x.text}”`} data-action="question-remove" onClick={() => { if (save(d => removeQuestion(d, a.id, iv.id, x.id))) focusSoon(`qNew-${iv.id}`); }}><Trash2 size={16} aria-hidden="true" /></Button>
          </li>))}</ul>}
        <form className="flex flex-wrap items-end gap-2 mt-1" onSubmit={e => { e.preventDefault(); addQ(); }}>
          <Field label="Add a question" htmlFor={`qNew-${iv.id}`} className="flex-1 min-w-[12rem]"><TextInput id={`qNew-${iv.id}`} aria-label={`Add a question to ask ${company}`} value={q} maxLength={CAREER_LIMITS.question} placeholder="e.g. What does a good first month look like?" onChange={e => setQ(e.target.value)} /></Field>
          <Button inline type="submit" variant="tonal" data-action="question-add" aria-label={`Add the question for ${company}`} disabled={!q.trim()}><Plus size={18} aria-hidden="true" /></Button>
        </form>
      </fieldset>
      <Field label="How it went (afterwards)" htmlFor={`ivWent-${iv.id}`}><CommitTextarea id={`ivWent-${iv.id}`} aria-label={`How it went, for the interview with ${company}`} rows={2} key={iv.went ?? ''} defaultValue={iv.went ?? ''} maxLength={CAREER_LIMITS.went} onCommit={el => save(d => editInterview(d, a.id, iv.id, { went: el.value }))} /></Field>
      <div><Button inline variant="ghost" data-action="iv-remove" aria-label={`Remove the interview with ${company} on ${when}`} onClick={remove}><Trash2 size={16} aria-hidden="true" /> Remove</Button></div>
    </li>
  );
}
