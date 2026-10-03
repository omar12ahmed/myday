import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, TextInput } from '../components/Field';
import { getSnapshot, update } from '../data/storage';
import { toast } from '../data/toast';
import { addTopic, moveTopic, removeTopic, renameTopic, TOPIC_LIMITS, topicContents, topicsOf } from '../data/study/topics';
import type { MyDayData } from '../data/types';
import { Note } from './parts';

// The subjects you study, always visible above the roadmap: pick one to see its stages, or add another. In Edit mode
// the chosen topic can be renamed, moved or removed.
export function TopicsBar({ data, selected, onSelect, edit, onAdded }: {
  data: MyDayData; selected: string; onSelect: (id: string) => void; edit: boolean; onAdded: (id: string) => void;
}) {
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const st = data.study, ts = topicsOf(st), i = ts.findIndex(t => t.id === selected), cur = ts[i];

  function add() {
    let id: string | null = null;
    update(d => { id = addTopic(d.study, name); if (!id) return false; });
    if (!id) { toast((st.topics?.length ?? 0) >= TOPIC_LIMITS.topics ? `That's the most topics (${TOPIC_LIMITS.topics}).` : 'That name is empty or already used.'); return; }
    toast(`Added “${name.trim()}”. Add its first course below.`);
    setName(''); setAdding(false);
    onAdded(id);
  }
  async function remove() {
    const c = topicContents(st, cur.id);
    const what = [c.courses && `${c.courses} course${c.courses === 1 ? '' : 's'}`, c.tasks && `${c.tasks} task${c.tasks === 1 ? '' : 's'}${c.done ? ` (${c.done} done)` : ''}`].filter(Boolean).join(' and ');
    if (!(await confirm({ title: `Remove “${cur.title}”${what ? ` and its ${what}` : ''}?`, body: 'Concepts you\'ve made stay. A backup made with "Export my data" still has everything.', confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (update(d => (removeTopic(d.study, cur.id) ? undefined : false))) { toast('Removed.'); onSelect(topicsOf(data.study).find(t => t.id !== cur.id)!.id); }
  }

  return (
    <Card aria-labelledby="topics-h" id="studyTopics">
      <h3 id="topics-h" className="m-0 mb-2">Topics</h3>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Show the roadmap for">
        {ts.map(t => (
          <Button key={t.id || 'one'} inline variant={t.id === selected ? 'selected' : 'ghost'} aria-pressed={t.id === selected} data-s="topic" data-id={t.id}
            className="!min-h-11" onClick={() => onSelect(t.id)}>{t.title}</Button>
        ))}
        {!adding && <Button inline variant="ghost" className="!min-h-11" data-action="topic-add" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true" /> Add a topic</Button>}
      </div>
      {adding && (
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-3" onSubmit={e => { e.preventDefault(); add(); }}>
          <Field label="New topic" htmlFor="topicNew">
            <TextInput id="topicNew" value={name} maxLength={TOPIC_LIMITS.title} autoFocus onChange={e => setName(e.target.value)} placeholder="e.g. Spanish, Business, Cooking" />
          </Field>
          <span className="flex gap-2">
            <Button inline type="submit" variant="primary" data-action="topic-save" disabled={!name.trim()}>Add</Button>
            <Button inline variant="ghost" data-action="topic-cancel" onClick={() => { setAdding(false); setName(''); }}>Cancel</Button>
          </span>
        </form>
      )}
      {!st.topics?.length && !adding && <Note className="mt-2 mb-0">Your roadmap is one topic for now. Add another to study something else alongside it — each topic has its own stages and courses.</Note>}
      {edit && cur && (
        <div className="flex gap-2 items-center flex-wrap mt-3 pt-3 border-t border-outline" id="topicEdit">
          <CommitInput key={cur.title} type="text" maxLength={TOPIC_LIMITS.title} defaultValue={cur.title} aria-label="Topic name" data-s="topic-name" className="flex-[1_1_160px] min-w-0"
            onCommit={el => { let ok = false; update(d => { ok = renameTopic(d.study, cur.id, el.value); if (!ok) return false; }); if (!ok) el.value = cur.title; else { toast('Saved.'); if (cur.id === '') onSelect(topicsOf(getSnapshot().data.study)[0].id); } }} />
          <span className="flex gap-1.5">
            <Button inline variant="ghost" className="!px-0 !w-11" aria-label={`Move ${cur.title} left`} disabled={i <= 0} data-action="topic-move" data-d="-1" onClick={() => update(d => (moveTopic(d.study, cur.id, -1) ? undefined : false))}><ArrowLeft size={18} aria-hidden="true" /></Button>
            <Button inline variant="ghost" className="!px-0 !w-11" aria-label={`Move ${cur.title} right`} disabled={i < 0 || i >= ts.length - 1} data-action="topic-move" data-d="1" onClick={() => update(d => (moveTopic(d.study, cur.id, 1) ? undefined : false))}><ArrowRight size={18} aria-hidden="true" /></Button>
            <Button inline variant="ghost" className="!px-0 !w-11" aria-label={`Remove ${cur.title}`} disabled={ts.length < 2} data-action="topic-remove" onClick={remove}><X size={18} aria-hidden="true" /></Button>
          </span>
        </div>
      )}
    </Card>
  );
}
