import { ArrowDown, ArrowLeftRight, X } from 'lucide-react';
import { useContext, useState } from 'react';
import { Card } from '../../components/Card';
import { Ar, Mixed } from './Ar';
import { PlayButton } from './Listen';
import { FAMILIES as families, type Family } from './families';
import { PronunciationContext } from './pronunciationContext';
import texts from './data/texts.json';

// Word families on the vocabulary page (1.38.0): which starter words share a root, from MyDay's own authored file
// (content/teaching/arabic/word-families.json, checked at every build by app/scripts/validate-families.mjs). For
// noticing, not testing: tapping a word shows its note and can take you to it in the list below, where its revision
// buttons are. Nothing here is saved.
const byId = new Map(texts.lexicon.map(w => [w.id, w]));
// A meaning short enough for a chip, keeping what tells two forms apart: "you (m)", "please (f)".
const short = (m: string) => m.replace(/, (masculine singular|to a male)$/, ' (m)').replace(/, (feminine singular|to a female)$/, ' (f)').replace(/, choose by context$/, '');

// A root in its own right-to-left run (so the hyphens don't reorder), with its reading when readings are shown.
export function Root({ f, reading = true }: { f: Pick<Family, 'root_ar' | 'root_reading'>; reading?: boolean }) {
  const enabled = useContext(PronunciationContext).enabled && reading;
  return <span className="whitespace-nowrap"><bdi lang="ar" dir="rtl" className="ar-inline">{f.root_ar}</bdi>
    {enabled && <span className="ar-transliteration" data-ar-transliteration="" dir="ltr" lang="ar-Latn"> ({f.root_reading})</span>}</span>;
}
// A note in English with Arabic in it: a root written like ك-ت-ب is shown whole, as a root (not letter by letter).
const ROOT = /[\u0621-\u064A](?:-[\u0621-\u064A]){2}/g;
function Note({ text }: { text: string }) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(ROOT)) {
    const f = families.families.find(x => x.root_ar === m[0]);
    if (!f) continue;
    if (m.index > last) out.push(<Mixed key={last} text={text.slice(last, m.index)} />);
    out.push(<Root key={'r' + m.index} f={f} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Mixed key={last} text={text.slice(last)} />);
  return <>{out}</>;
}

export function WordFamilies() {
  const [open, setOpen] = useState<string | null>(null);
  if (!families.families.length) return null;
  const inFamilies = families.families.reduce((a, f) => a + f.members.length, 0), alone = families.standing_alone;
  return (
    <Card aria-labelledby="ar-families-h" data-ar-families="">
      <h3 id="ar-families-h">Word families</h3>
      <p className="text-[15px]">Words that share a root. Arabic grows words from three-letter roots: {families.families.length} roots connect {inFamilies} of
        your {texts.lexicon.length} starter words — and one building pattern, <Mixed text="مَـ" /> “the place where…”, turns up in two of them.</p>
      <div className="grid gap-3 sm:grid-cols-2 mt-3">
        {families.families.map((f, i) => <FamilyCard key={f.id} f={f} wide={i === 0} open={open} onOpen={setOpen} />)}
      </div>
      <Group title="Their relatives aren’t in this list yet" ids={alone.relatives_not_here} s="ar-alone-relatives"
        note="Each of these has a root, but no other word from it is among your starter words. Lessons and texts will bring some." />
      <Group title="Small words — not built from roots" ids={alone.small_words} s="ar-alone-small"
        note="Pronouns, little linking words, question words and set phrases work differently: they don’t grow from roots the way nouns and verbs do." />
    </Card>
  );
}

function FamilyCard({ f, wide, open, onOpen }: { f: Family; wide: boolean; open: string | null; onOpen: (id: string | null) => void }) {
  const here = open && f.members.includes(open) ? open : null;
  const also = (f as { also_in_examples?: { form_ar: string; meaning_en: string; note_en: string }[] }).also_in_examples ?? [];
  return (
    <section className={`rounded-tile border border-outline bg-surface-3 p-3.5 ${wide ? 'sm:col-span-2' : ''}`} aria-label={`The ${f.root_ar} family, “${f.theme_en}”`} data-ar-family={f.id}>
      <p className="m-0 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[22px]"><Root f={f} /></span>
        <span className="text-sm text-fg-2">“{f.theme_en}” · {f.members.length} of your words</span>
      </p>
      <ul className="list-none p-0 m-0 mt-2 flex flex-wrap gap-2">
        {f.members.map(id => {
          const w = byId.get(id)!, on = here === id, paired = f.pair?.includes(id);
          return <li key={id}>
            <button type="button" aria-pressed={on} aria-controls={`ar-family-note-${f.id}`} data-ar-family-word={id}
              onClick={() => onOpen(on ? null : id)}
              className={`inline-flex items-center gap-2 min-h-11 px-3 rounded-btn border text-left cursor-pointer ${on ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline bg-surface hover:bg-surface-2 text-fg'}`}>
              <Ar className="text-[20px]" showReading={false}>{w.form_ar}</Ar>
              <span className="text-sm">{short(w.meaning_en)}</span>
              {paired && <ArrowLeftRight size={14} aria-label="one of a pair" className="text-fg-3 flex-none" />}
            </button>
          </li>;
        })}
      </ul>
      <div id={`ar-family-note-${f.id}`} aria-live="polite">
        {here && <WordNote f={f} id={here} onClose={() => onOpen(null)} />}
      </div>
      <p className="text-[15px] m-0 mt-2.5" data-ar-family-pattern=""><span className="font-semibold">Pattern: </span><Note text={f.pattern_en} /></p>
      {also.length > 0 && <div className="mt-1.5">
        <p className="text-sm font-semibold m-0">Also in your examples:</p>
        {also.map(x => <p key={x.form_ar} className="text-sm text-fg-2 m-0 mt-0.5" data-ar-family-also=""><Ar showReading>{x.form_ar}</Ar> {x.meaning_en} — <Note text={x.note_en} /></p>)}
      </div>}
    </section>
  );
}

// One word's note: the word with its reading and meaning, why it's in the family, and a way to its place in the list.
function WordNote({ f, id, onClose }: { f: Family; id: string; onClose: () => void }) {
  const w = byId.get(id)!, note = (f.word_notes as Record<string, string | undefined>)[id];
  function show() {
    const li = document.querySelector<HTMLElement>(`[data-ar-word="${CSS.escape(id)}"]`);
    if (!li) return;
    li.scrollIntoView({ block: 'center' });
    li.focus({ preventScroll: true });
  }
  return (
    <div className="mt-2.5 rounded-tile bg-surface border border-outline px-3 py-2.5" data-ar-family-note={id}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Ar block className="text-[26px] m-0">{w.form_ar}</Ar>
          <p className="text-sm text-fg-2 m-0">{w.meaning_en} · {w.part_of_speech.replace('_', ' ')}</p>
        </div>
        <PlayButton text={w.form_ar} name={`${id}:word`} label={w.form_ar} />
        <button type="button" onClick={onClose} aria-label="Close this note" className="flex-none grid place-items-center size-11 rounded-btn text-fg-2 hover:bg-surface-2 cursor-pointer"><X size={18} aria-hidden="true" /></button>
      </div>
      {note && <p className="text-[15px] m-0 mt-1.5"><Note text={note} /></p>}
      <button type="button" onClick={show} data-action="ar-family-show" className="inline-flex items-center gap-1.5 min-h-11 mt-1 text-primary font-semibold text-[15px] bg-transparent border-0 p-0 cursor-pointer hover:underline underline-offset-4">
        <ArrowDown size={16} aria-hidden="true" /> Show it in the list, with its revision buttons</button>
    </div>
  );
}

function Group({ title, ids, note, s }: { title: string; ids: string[]; note: string; s: string }) {
  return (
    <section className="mt-4" aria-label={title} data-s={s}>
      <h4 className="m-0 text-[15px] font-semibold">{title} <span className="text-fg-3 font-normal tabular-nums">· {ids.length}</span></h4>
      <p className="text-sm text-fg-2 m-0 mt-0.5">{note}</p>
      <ul className="list-none p-0 m-0 mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {ids.map(id => { const w = byId.get(id)!; return <li key={id} className="text-sm text-fg-2"><Ar className="text-[18px] text-fg" showReading={false}>{w.form_ar}</Ar> {short(w.meaning_en)}</li>; })}
      </ul>
    </section>
  );
}
