import { RotateCcw } from 'lucide-react';
import { Button } from '../../components/Button';
import { useConfirm } from '../../components/confirm';
import { addCyberCards, cyberCardOf, removeCyberCards } from '../../data/cybersecurity/cards';
import { shortDate, todayKey } from '../../data/dates';
import { update } from '../../data/storage';
import { aiCyberCards, dueIds, nextDueDate } from '../../data/study/queue';
import type { MyDayData } from '../../data/types';
import { startRevision } from '../actions';

// A lesson's knowledge-check questions in revision: bring them back (nothing is added by itself), see when they come
// back, or take them out. Used on the lesson page and on the knowledge check itself.
export function CheckRevision({ data, ids }: { data: MyDayData; ids: string[] }) {
  const confirm = useConfirm();
  if (!ids.length) return null;
  const k = todayKey(), inRev = ids.filter(id => cyberCardOf(data, id)), missing = ids.filter(id => !cyberCardOf(data, id));
  const next = inRev.map(id => cyberCardOf(data, id)!.review.due).filter((x): x is string => !!x).sort()[0];
  const add = () => update(d => { if (!addCyberCards(d, missing, todayKey())) return false; });
  async function takeOut() {
    if (await confirm({ title: 'Take these checks out of revision?', body: 'Your past answers stay in your history. If you bring them back, they start afresh.', confirmLabel: 'Take them out', cancelLabel: 'Keep them' }))
      update(d => { if (!removeCyberCards(d, inRev)) return false; });
  }
  return <div className="border-t border-outline pt-3 mt-4" data-cy-checks={inRev.length ? 'in' : 'out'}>
    {inRev.length > 0
      ? <p className="text-sm m-0 mb-2">{missing.length ? `${inRev.length} of this lesson's checks are` : `This lesson's ${ids.length === 1 ? 'check is' : 'checks are'}`} in your revision{next ? (next <= k ? ': ready now' : `: next back on ${shortDate(next)}`) : ''}.</p>
      : <p className="text-sm text-fg-2 m-0 mb-2">Want this lesson's {ids.length === 1 ? 'check' : `${ids.length} checks`} to come back? In revision {ids.length === 1 ? 'it returns' : 'they return'} tomorrow, then at growing gaps, with the course's reference answers.</p>}
    <div className="flex flex-wrap gap-2">
      {missing.length > 0 && <Button inline variant={inRev.length ? 'ghost' : 'tonal'} data-action="cy-checks-add" onClick={add}>{inRev.length ? 'Add the rest' : 'Bring these checks back in revision'}</Button>}
      {inRev.length > 0 && <Button inline variant="ghost" data-action="cy-checks-remove" onClick={takeOut}>Take them out of revision</Button>}
    </div>
  </div>;
}

// On the learning map: what's in your Cybersecurity revision, and a round of just Cybersecurity when some is ready.
export function CyberRevisionGlance({ data }: { data: MyDayData }) {
  const k = todayKey(), cards = data.cybersecurity.cards, ai = aiCyberCards(data);
  if (!cards.length && !ai.length) return null;
  const due = dueIds(data, k, 'cybersecurity').length, next = nextDueDate(data, k, 'cybersecurity');
  const what = [cards.length && `${cards.length} lesson ${cards.length === 1 ? 'check' : 'checks'}`, ai.length && `${ai.length} AI-written ${ai.length === 1 ? 'card' : 'cards'}`].filter(Boolean).join(' and ');
  return <div className="rounded-tile bg-surface p-4 border border-outline mt-4" data-cy-revision={due ? 'due' : 'later'}>
    <h3 className="flex items-center gap-2 mt-0"><RotateCcw size={20} aria-hidden="true" />Revision</h3>
    <p className="text-[15px]">In your revision: {what}. {due ? `${due} ready now.` : next ? `Next back on ${shortDate(next)}.` : ''}</p>
    {due > 0 && <Button variant="primary" data-action="cy-revise" onClick={() => startRevision('cybersecurity')}>Revise Cybersecurity</Button>}
  </div>;
}
