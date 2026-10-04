import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, TextInput } from '../components/Field';
import { BackLink, Note } from '../components/parts';
import { addCategory, moveCategory, NOTE_LIMITS, removeCategory, renameCategory } from '../data/notes';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// Your note collections: rename, reorder, add and remove. Removing one never removes notes — they go back to the Inbox.
export function CategoriesView({ data }: { data: MyDayData }) {
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const cats = data.notes.categories;
  const notesIn = (id: string) => data.notes.items.filter(n => n.categoryId === id).length;

  async function remove(id: string, label: string) {
    const n = notesIn(id);
    const ok = await confirm({ title: `Remove “${label}”?`, body: n ? `${n === 1 ? 'Its note goes' : `Its ${n} notes go`} back to your Inbox. No notes are deleted.` : 'It has no notes.', confirmLabel: 'Remove', cancelLabel: 'Keep it' });
    if (!ok) return;
    let moved = 0;
    update(d => { const r = removeCategory(d.notes, id); moved = r.moved; if (!r.removed) return false; });
    toast(moved ? `Removed. ${moved} note${moved === 1 ? '' : 's'} back in your Inbox.` : 'Removed.');
  }
  function add() {
    let ok = false;
    update(d => { ok = addCategory(d.notes, name) !== null; if (!ok) return false; });
    if (ok) { toast(`Added “${name.trim()}”.`); setName(''); }
    else toast(cats.length >= NOTE_LIMITS.categories ? `That's the most categories (${NOTE_LIMITS.categories}).` : 'That name is empty or already used.');
  }

  return (
    <>
      <BackLink to="projects/notes" label="Notes" />
      <Card aria-labelledby="ncat-h">
        <h2 id="ncat-h">Collections</h2>
        <Note className="mt-0">Optional places to file notes. Rename, reorder, add or remove them; removing one puts its notes back in your Inbox — nothing is deleted.</Note>
        <ul className="list-none p-0 m-0" id="noteCats">
          {cats.map((c, i) => (
            <li key={c.id} className="ncat-row grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center py-2.5 border-t border-outline first:border-t-0" data-id={c.id}>
              <CommitInput type="text" defaultValue={c.name} key={c.name} maxLength={NOTE_LIMITS.categoryName} aria-label={`Name of ${c.name}`} data-field="name"
                onCommit={el => { const v = el.value.trim(); let ok = false; update(d => { ok = renameCategory(d.notes, c.id, v); if (!ok) return false; }); if (!ok) el.value = c.name; else toast('Saved.'); }} />
              <span className="flex gap-1.5">
                <Button inline className="!px-3" aria-label={`Move ${c.name} up`} disabled={i === 0} data-action="ncat-up" onClick={() => update(d => (moveCategory(d.notes, c.id, -1) ? undefined : false))}><ArrowUp size={18} aria-hidden="true" /></Button>
                <Button inline className="!px-3" aria-label={`Move ${c.name} down`} disabled={i === cats.length - 1} data-action="ncat-down" onClick={() => update(d => (moveCategory(d.notes, c.id, 1) ? undefined : false))}><ArrowDown size={18} aria-hidden="true" /></Button>
                <Button inline className="!px-3" aria-label={`Remove ${c.name}`} data-action="ncat-remove" onClick={() => remove(c.id, c.name)}><X size={18} aria-hidden="true" /></Button>
              </span>
              <span className="col-span-2 text-sm text-fg-3 -mt-1">{notesIn(c.id)} note{notesIn(c.id) === 1 ? '' : 's'}</span>
            </li>
          ))}
        </ul>
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-3" onSubmit={e => { e.preventDefault(); add(); }}>
          <Field label="New collection" htmlFor="ncatNew">
            <TextInput id="ncatNew" value={name} maxLength={NOTE_LIMITS.categoryName} onChange={e => setName(e.target.value)} placeholder="e.g. Travel" />
          </Field>
          <Button inline type="submit" data-action="ncat-add" disabled={!name.trim()}>Add</Button>
        </form>
      </Card>
    </>
  );
}
