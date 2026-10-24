import { BookmarkPlus } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '../../components/Button';
import { Field, TextInput } from '../../components/Field';
import { todayKey } from '../../data/dates';
import { update } from '../../data/storage';
import { AR_MAX, keepWord, keptWord, MEANING_MAX, NOTE_MAX, wordsIn } from '../../data/arabic/words';
import type { MyDayData } from '../../data/types';
import { InlineLink } from '../parts';
import { Ar } from './Ar';
import { starterFor } from './starter';

// "Keep a word" (specs/study-home-and-lessons.md §6): under a lesson's examples or a reading text. Tap the word (the
// sentence's words, punctuation left out, vowel marks as written), give your meaning (the course's is filled in for
// a starter word), and it comes back in revision from tomorrow. Nothing is saved until "Keep it".
export function KeepAWord({ data, sentences, from }: { data: MyDayData; sentences: string[]; from?: string }) {
  const [open, setOpen] = useState(false), [word, setWord] = useState<string | null>(null);
  const [meaning, setMeaning] = useState(''), [note, setNote] = useState(''), [kept, setKept] = useState<string | null>(null);
  const id = useId();
  const lists = sentences.map(s => wordsIn(s)).filter(ws => ws.length);
  if (!lists.length) return null;
  const starter = word ? starterFor(word) : null, already = word ? keptWord(data, word) : null;
  const choose = (w: string) => { setWord(w); setMeaning(starterFor(w)?.meaning_en ?? ''); setNote(''); setKept(null); };
  const save = () => {
    if (!word) return;
    const k = todayKey();
    if (update(d => { if (!keepWord(d, { ar: word, meaning, note, from }, k)?.added) return false; })) { setKept(word); setWord(null); }
  };
  if (!open) return <Button inline variant="ghost" className="mt-2" data-action="ar-keep-open" onClick={() => setOpen(true)}><BookmarkPlus size={18} aria-hidden="true" /> Keep a word</Button>;
  return <div className="rounded-tile border border-outline bg-surface px-4 py-3 mt-3" data-ar-keep="">
    {kept && <p role="status" className="text-[15px] mt-0" data-ar-kept="">Kept <Ar>{kept}</Ar>. It comes back in revision from tomorrow, Arabic → meaning. <InlineLink href="#study/arabic/vocabulary">Your words</InlineLink></p>}
    {!word ? <>
      <p className="text-sm text-fg-2 mt-0">Tap the word you want to keep.</p>
      {lists.map((ws, i) => <div key={i} className="flex flex-wrap gap-1.5 mb-2" dir="rtl">{ws.map(w => {
        const have = !!keptWord(data, w);
        return <button key={w} type="button" data-action="ar-keep-word" data-v={w} aria-label={have ? `${w}, already in your words` : w} onClick={() => choose(w)}
          className={`ar min-h-11 px-3 rounded-btn border text-[20px] cursor-pointer ${have ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline bg-surface-2 text-fg'}`}><bdi lang="ar">{w}</bdi></button>;
      })}</div>)}
      <Button inline variant="ghost" onClick={() => setOpen(false)}>Close</Button>
    </> : already ? <>
      <p className="text-[15px] mt-0" data-ar-keep-already=""><Ar>{word}</Ar> is already in your words: {already.meaning}.</p>
      <Button inline variant="ghost" onClick={() => setWord(null)}>Choose another word</Button>
    </> : <form onSubmit={e => { e.preventDefault(); save(); }} data-ar-keep-form="">
      <Ar block className="text-[30px] m-0">{word}</Ar>
      {starter && <p className="text-sm text-fg-2">One of the starter words: the course’s meaning is filled in; change it if you like. Example: <Ar>{starter.example_ar}</Ar> {starter.example_meaning_en}</p>}
      <div className="grid gap-3 mt-2">
        <Field label="Your meaning" htmlFor={id + 'm'}><TextInput id={id + 'm'} data-s="ar-keep-meaning" maxLength={MEANING_MAX} required value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="e.g. house" /></Field>
        <Field label="A note (optional)" htmlFor={id + 'n'}><TextInput id={id + 'n'} data-s="ar-keep-note" maxLength={NOTE_MAX} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. heard in the greetings lesson" /></Field>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Button inline type="submit" variant="primary" data-action="ar-keep-save" disabled={!meaning.trim() || word.length > AR_MAX}>Keep it</Button>
        <Button inline variant="ghost" onClick={() => setWord(null)}>Back</Button>
      </div>
    </form>}
  </div>;
}
