import { useState, type KeyboardEvent } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { Field, TextArea, TextInput } from '../components/Field';
import { LinkButton, Note } from '../components/parts';
import { addResource, editResource, removeResource, RESOURCE_LIMITS, resourceName, siteOf, webAddress, type ResourceInput } from '../data/projectResources';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { Project, ProjectResource } from '../data/types';

// "Resources" (specs/projects-resources.md): web links you keep with a project — each opens in a new tab, with its
// site and your note. Only web addresses are kept; removing one asks first, since the link and note are your words.

const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const NOT_AN_ADDRESS = 'That doesn’t look like a web address. Try something like example.com/page.';

export function ResourcesCard({ p }: { p: Project }) {
  const list = p.resources ?? [];
  const [adding, setAdding] = useState(false);
  return (
    <Card aria-labelledby="projectResourcesH" id="projectResources">
      <h3 id="projectResourcesH">Resources</h3>
      {list.length > 0 && <ul className="list-none p-0 m-0">{list.map(r => <ResourceRow key={r.id} p={p} r={r} />)}</ul>}
      {list.length === 0 && !adding && <Note className="mt-0">Keep the links you need for this project: a supplier’s page, a guide, a form.</Note>}
      {adding ? <ResourceForm p={p} onDone={() => { setAdding(false); focusSoon('resourceAdd'); }} />
        : list.length < RESOURCE_LIMITS.resources ? <Button inline id="resourceAdd" className={list.length ? 'mt-3' : ''} data-action="resource-add" onClick={() => { setAdding(true); focusSoon('resourceUrl-new'); }}>Add a link</Button>
        : <Note className="mb-0 mt-3">{RESOURCE_LIMITS.resources} links is the most a project can have.</Note>}
    </Card>
  );
}

function ResourceRow({ p, r }: { p: Project; r: ProjectResource }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false), editId = `resourceEdit-${r.id}`, name = resourceName(r);
  async function remove() {
    if (!(await confirm({ title: `Remove “${name}”?`, body: 'The link and your note go; the page itself isn’t affected.', confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (update(d => (removeResource(d, p.id, r.id) ? undefined : false))) { toast('Link removed.'); focusSoon('resourceAdd'); }
  }
  return (
    <li className="border-t border-outline first:border-t-0 py-2" data-s="resource" data-id={r.id}>
      {editing ? <ResourceForm p={p} r={r} onDone={() => { setEditing(false); focusSoon(editId); }} /> : (<>
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="block min-h-11 py-1 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2" data-s="resource-link">
          <span className="block font-medium text-primary break-words">{name} <span aria-hidden="true">↗</span><span className="sr-only">(opens in a new tab)</span></span>
          {r.title && <span className="block text-sm text-fg-3 break-all" data-s="resource-site">{siteOf(r.url)}</span>}
        </a>
        {r.note && <p className="m-0 mt-1 text-[15px] text-fg-2 break-words" data-s="resource-note">Note: {r.note}</p>}
        <div className="flex flex-wrap gap-x-5">
          <LinkButton className="text-[15px]" id={editId} data-action="resource-edit" aria-label={`Edit “${name}”`} onClick={() => { setEditing(true); focusSoon(`resourceUrl-${r.id}`); }}>Edit</LinkButton>
          <LinkButton className="text-[15px]" data-action="resource-remove" aria-label={`Remove “${name}”`} onClick={remove}>Remove</LinkButton>
        </div>
      </>)}
    </li>
  );
}

// Adding a link, or editing one (r): the web address, then an optional title and note. Escape or Cancel closes it.
function ResourceForm({ p, r, onDone }: { p: Project; r?: ProjectResource; onDone: () => void }) {
  const key = r?.id ?? 'new';
  const [url, setUrl] = useState(r?.url ?? ''), [title, setTitle] = useState(r?.title ?? ''), [note, setNote] = useState(r?.note ?? '');
  const [error, setError] = useState('');
  function save() {
    const whole = webAddress(url);
    if (!whole) { setError(NOT_AN_ADDRESS); focusSoon(`resourceUrl-${key}`); return; }
    if ((p.resources ?? []).some(x => x.id !== r?.id && x.url === whole)) { setError('That link is already kept in this project.'); focusSoon(`resourceUrl-${key}`); return; }
    const input: ResourceInput = { url, title, note };
    if (r) { if (update(d => (editResource(d, p.id, r.id, input) ? undefined : false))) toast('Saved.'); onDone(); return; }
    let id: string | null = null;
    if (update(d => { id = addResource(d, p.id, input); if (!id) return false; })) { toast(`Kept “${title.trim() || siteOf(whole)}”.`); onDone(); }
  }
  const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.nativeEvent.isComposing) onDone(); };
  return (
    <form className={r ? '' : 'mt-3'} data-s="resource-form" onSubmit={e => { e.preventDefault(); save(); }} onKeyDown={esc}>
      <div className="grid gap-3 mb-3">
        <Field label="Web address" htmlFor={`resourceUrl-${key}`}>
          <TextInput id={`resourceUrl-${key}`} inputMode="url" autoComplete="url" spellCheck={false} value={url} maxLength={RESOURCE_LIMITS.url}
            placeholder="e.g. example.com/page" aria-invalid={!!error} aria-describedby={error ? `resourceErr-${key}` : undefined} onChange={e => { setUrl(e.target.value); setError(''); }} />
        </Field>
        {error && <p className="m-0 text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2" id={`resourceErr-${key}`} role="alert" data-s="resource-error">{error}</p>}
        <Field label="Title (optional)" htmlFor={`resourceTitle-${key}`}>
          <TextInput id={`resourceTitle-${key}`} value={title} maxLength={RESOURCE_LIMITS.title} placeholder="e.g. Timber merchant" onChange={e => setTitle(e.target.value)} />
        </Field>
        <Field label="Note (optional)" htmlFor={`resourceNote-${key}`}>
          <TextArea id={`resourceNote-${key}`} rows={2} value={note} maxLength={RESOURCE_LIMITS.note} placeholder="e.g. Ask about offcuts" onChange={e => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button inline type="submit" variant="primary" data-action="resource-save" disabled={!url.trim()}>{r ? 'Save' : 'Add'}</Button>
        <Button inline variant="ghost" data-action="resource-cancel" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
