import '@fontsource-variable/noto-naskh-arabic';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { cardRef, rateCard, removeCards, type CardRef } from '../../data/arabic/cards';
import { keptById } from '../../data/arabic/words';
import type { ArabicCard } from '../../data/arabic/types';
import { update } from '../../data/storage';
import type { MyDayData } from '../../data/types';
import { InlineLink, Note } from '../parts';
import { Question, type Asked } from '../RevisionView';
import { skipQuestion, type Round } from '../round';
import { Ar, Mixed } from './Ar';
import { lessonIndex } from './catalogue';
import { PractiseQuestion } from './PractiseQuestion';
import { Pronunciation, PronunciationControls } from './Pronunciation';
import checksJson from './data/checks.json';
import { isCourseWord, wordById } from './courseWords';
import { WordNote } from './WordNote';

// An Arabic card in a revision round, asked like any other question: a word (a starter word or one from a lesson) one way round, a lesson check,
// a word you kept one way round, or a lesson to practise again (PractiseQuestion.tsx). You compare your answer yourself; MyDay never marks Arabic (the course's own
// answers are examples, and vowel marks are optional unless the question is about them).
type Answers = Record<string, { answer: string; variation: string }>;
const checks = checksJson as Record<string, { prompt: string; lesson: string }>;

export default function ArabicQuestion({ data, r, at, card }: { data: MyDayData; r: Round; at: number; card: ArabicCard }) {
  const ref = cardRef(card.id), needsAnswers = ref.kind === 'check';
  const [answers, setAnswers] = useState<Answers | null>(null), [failed, setFailed] = useState(false);
  // A check's reference answer is loaded with the question, but stays off the page until you ask for it.
  useEffect(() => {
    if (!needsAnswers) return;
    let live = true;
    import('./data/answers.json').then(m => { if (live) setAnswers(m.default as Answers); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [needsAnswers]);
  if (ref.kind === 'practice') return lessonIndex[ref.lessonId]
    ? <Pronunciation><PronunciationControls /><PractiseQuestion data={data} r={r} at={at} card={card} lessonId={ref.lessonId} /></Pronunciation>
    : <Gone card={card} at={at} kept={false} />;
  const q = asked(data, card, ref, answers);
  if (q === 'gone') return <Gone card={card} at={at} kept={ref.kind === 'kept'} />;
  if (!q) return <Card><p role="status" className="m-0">{failed ? 'The answers couldn’t be opened. Check your connection and try again.' : 'Opening…'}</p></Card>;
  return <Pronunciation><PronunciationControls /><Question data={data} r={r} at={at} q={q} /></Pronunciation>;
}

function asked(data: MyDayData, card: ArabicCard, ref: Exclude<CardRef, { kind: 'practice' }>, answers: Answers | null): Asked | 'gone' | null {
  const base = { id: card.id, kind: 'written' as const, choices: [], correct: null, hint: '', notesUrl: '', arabic: true, interval: card.review.interval };
  const saving = (title: string): Asked['save'] => (d, k, a, rating) => rateCard(d, card.id, title, k, a, rating);
  // A word you kept: your own meaning and note, nothing from the course, and no AI explanation (your words stay yours).
  if (ref.kind === 'kept') {
    const w = keptById(data, ref.wordId);
    if (!w) return 'gone';
    const note = w.note ? <span dir="auto">{w.note}</span> : null, back = <Note><InlineLink href="#study/arabic/vocabulary">Your words</InlineLink></Note>;
    const notYet = <>This one hasn’t clicked yet, which is normal for a new word. Say it once more, slowly, out loud if you can, and read your note.</>;
    if (ref.side === 'recognise') {
      const title = `${w.ar} → ${w.meaning}`;
      return { ...base, title, path: 'Arabic · a word you kept', notYet, save: saving(title), after: back,
        prompt: <><Ar className="block text-[34px] leading-normal">{w.ar}</Ar>What does it mean?</>,
        answer: w.meaning, answerLabel: 'Your meaning', explanation: note, explanationLabel: 'Your note' };
    }
    const title = `${w.meaning} → ${w.ar}`;
    return { ...base, title, path: 'Arabic · a word you kept, from memory', notYet, save: saving(title), after: back,
      prompt: <>Write it in Arabic: “{w.meaning}”</>, answer: <Ar className="text-[28px]">{w.ar}</Ar>, answerLabel: 'In Arabic', explanation: note, explanationLabel: 'Your note' };
  }
  if (ref.kind === 'word') {
    const w = wordById(ref.lexemeId);
    if (!w) return 'gone';
    const course = isCourseWord(w) ? w : null;
    const example = <><Ar>{w.example_ar}</Ar>{'\n'}{w.example_meaning_en}{course && <>{'\n'}<WordNote text={course.note} /></>}</>, exampleText = `${w.example_ar} — ${w.example_meaning_en}`;
    const notYet = <>This one hasn’t clicked yet, which is normal for a new word. Read its example once more, slowly, out loud if you can; at the end of the round there’s a link back to the starter words.</>;
    if (ref.side === 'recognise') {
      const title = `${w.form_ar} → ${w.meaning_en}`;
      return { ...base, title, path: course ? 'Arabic · a word from a lesson' : 'Arabic · starter word', notYet, save: saving(title), explain: { subject: 'arabic', question: `What does ${w.form_ar} mean?`, answer: `${w.meaning_en} (${w.part_of_speech.replace('_', ' ')})`, explanation: exampleText },
        prompt: <><Ar className="block text-[34px] leading-normal">{w.form_ar}</Ar>What does it mean?</>,
        answer: `${w.meaning_en} · ${w.part_of_speech.replace('_', ' ')}`, answerLabel: 'Meaning', explanation: example, explanationLabel: 'Example' };
    }
    const title = `${w.meaning_en} → ${w.form_ar}`;
    return { ...base, title, path: 'Arabic · write it from memory', notYet, save: saving(title), explain: { subject: 'arabic', question: `Write it in Arabic: “${w.meaning_en}”`, answer: w.form_ar, explanation: exampleText },
      prompt: <>Write it in Arabic: “{w.meaning_en}”</>,
      answer: <Ar className="text-[28px]">{w.form_ar}</Ar>, answerLabel: 'In Arabic', explanation: example, explanationLabel: 'Example' };
  }
  const c = checks[ref.questionId];
  if (!c) return 'gone';
  if (!answers) return null;
  const a = answers[ref.questionId];
  if (!a) return 'gone';
  const title = `${c.lesson} · check ${/\.q(\d+)$/.exec(ref.questionId)?.[1] ?? ''}`.trim();
  return { ...base, title, path: `Arabic · ${c.lesson}`, save: saving(title), explain: { subject: 'arabic', question: c.prompt, answer: a.answer, explanation: a.variation },
    notYet: <>This one hasn’t clicked yet, which is normal for something new. Read the reference answer once more, slowly; at the end of the round there’s a link back to its lesson.</>,
    prompt: <Mixed text={c.prompt} />,
    answer: <Mixed text={a.answer} />, answerLabel: 'Reference answer', explanation: <Mixed text={a.variation} />, explanationLabel: 'What also counts',
    after: <Note><InlineLink href={'#study/arabic/' + ref.lessonId}>Open its lesson</InlineLink></Note> };
}

// A card whose word or question an update of the course removed (or a word you removed on another device): nothing
// is lost, and a course card is yours to take out.
function Gone({ card, at, kept }: { card: ArabicCard; at: number; kept: boolean }) {
  const remove = () => { update(d => { if (!removeCards(d, [card.id])) return false; }); skipQuestion(at); };
  if (kept) return <Card tone="accent" data-ar-gone="">
    <h2>This word is no longer in your words</h2>
    <p>It was removed, perhaps on another device. Your past answers to it stay in your history.</p>
    <Button variant="primary" data-action="ar-gone-skip" onClick={() => skipQuestion(at)}>Next question</Button>
  </Card>;
  // Either an update took it out, or a newer MyDay on another device added it (a word from a lesson this version
  // doesn't have yet): skipping keeps it for that device, so Skip comes first.
  return <Card tone="accent" data-ar-gone="">
    <h2>This one isn’t in this version of the course</h2>
    <p>An update may have taken it out, or a newer version of MyDay on another device added it. Skip it to keep it for that device; your past answers to it stay in your history either way.</p>
    <div className="grid sm:grid-cols-2 gap-3">
      <Button variant="primary" data-action="ar-gone-skip" onClick={() => skipQuestion(at)}>Skip for now</Button>
      <Button variant="ghost" data-action="ar-gone-remove" onClick={remove}>Take it out of revision</Button>
    </div>
  </Card>;
}
