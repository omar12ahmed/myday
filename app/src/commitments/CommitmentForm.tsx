import { X } from 'lucide-react';
import { Button } from '../components/Button';
import { Field, Select, TextInput } from '../components/Field';
import { fmtRange } from '../data/dates';
import { KIND_LABEL } from '../data/schedule';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { Commitment } from '../data/types';
import { applyCommitment, checkCommitment, type CommitForm } from './commitForm';

// The form for adding or editing a work shift or appointment (Today's context card and the Calendar).
export function CommitmentForm({ form, setForm, onSaved }: { form: CommitForm; setForm: (f: CommitForm | null) => void; onSaved: () => void }) {
  function save() {
    const err = checkCommitment(form);
    if (err) { setForm({ ...form, error: err }); return; }
    if (!update(d => applyCommitment(d, form))) return; // another tab saved first: it says so, and the form stays open
    setForm(null);
    onSaved();
    toast('Saved.');
  }
  return (
    <div id="cForm" className="c-form bg-surface-2 border border-outline rounded-tile p-4 mt-2.5" data-key={form.key}>
      <h4 className="mt-0">{form.id ? 'Edit commitment' : form.kind === 'work' ? 'New work shift' : 'New appointment'}</h4>
      <div className="grid gap-3">
        <Field label="Type" htmlFor="cfKind">
          <Select id="cfKind" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value === 'work' ? 'work' : 'appointment' })}>
            <option value="work">Work shift</option><option value="appointment">Appointment</option>
          </Select>
        </Field>
        <Field label="Title" htmlFor="cfTitle">
          <TextInput id="cfTitle" type="text" value={form.title} placeholder={form.kind === 'work' ? 'Work shift' : 'e.g. Dentist'} autoFocus onChange={e => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Starts" htmlFor="cfStart">
          <TextInput id="cfStart" type="datetime-local" value={form.start} onChange={e => setForm({ ...form, start: e.target.value.slice(0, 16) })} />
        </Field>
        <Field label="Ends" htmlFor="cfEnd">
          <TextInput id="cfEnd" type="datetime-local" value={form.end} onChange={e => setForm({ ...form, end: e.target.value.slice(0, 16) })} />
        </Field>
      </div>
      <p className="text-[15px] text-fg-2 mt-2">A night shift can end the next day — just pick the next date.</p>
      <p id="cfError" role="alert" className={form.error ? 'warn bg-warn-c text-on-warn-c rounded-lg px-2.5 py-1 text-sm' : 'sr-only'}>{form.error ?? ''}</p>
      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
        <Button variant="primary" data-action="commit-save" onClick={save}>Save</Button>
        <Button variant="ghost" data-action="commit-cancel" onClick={() => setForm(null)}>Cancel</Button>
      </div>
    </div>
  );
}

// A list of commitments with Edit and Remove buttons. `k` is the day they're shown from ("tomorrow 06:00").
export function CommitmentRows({ list, k, onEdit, onDelete }: { list: Commitment[]; k: string; onEdit: (c: Commitment) => void; onDelete: (c: Commitment) => void }) {
  return list.map(c => (
    <div key={c.id} className="c-row flex justify-between items-center gap-2.5 py-2.5 border-t border-outline first:border-t-0">
      <div className="min-w-0">
        <span className={`chip inline-flex text-xs font-bold tracking-[.04em] uppercase px-[9px] py-0.5 rounded-full ${c.kind === 'work' ? 'bg-work-c text-work' : 'bg-appt-c text-appt'}`}>{KIND_LABEL[c.kind]}</span>
        <p className="title m-0 mt-1">{c.title}</p>
        <p className="meta m-0 text-sm text-fg-3 tabular-nums">{fmtRange(c.start, c.end, k)}</p>
      </div>
      <div className="flex gap-1.5 flex-none">
        <Button inline data-action="commit-edit" data-id={c.id} onClick={() => onEdit(c)}>Edit</Button>
        <Button inline data-action="commit-del" data-id={c.id} aria-label={`Remove ${c.title}`} onClick={() => onDelete(c)}><X size={18} aria-hidden="true" /></Button>
      </div>
    </div>
  ));
}
