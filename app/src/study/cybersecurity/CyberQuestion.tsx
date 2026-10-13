import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { lessonOfCheck, rateCyberCard, removeCyberCards } from '../../data/cybersecurity/cards';
import { lessonHref, type CyberCard } from '../../data/cybersecurity/types';
import { update } from '../../data/storage';
import type { MyDayData } from '../../data/types';
import { InlineLink, Note } from '../parts';
import { Question, type Asked } from '../RevisionView';
import { skipQuestion, type Round } from '../round';
import checksJson from './checks.json';

// A Cybersecurity knowledge-check question in a revision round, asked like any other: you compare your answer with
// the course's reference answer yourself (MyDay doesn't mark written answers).
const checks = checksJson as Record<string, { prompt: string; lesson: string }>;

export default function CyberQuestion({ data, r, at, card }: { data: MyDayData; r: Round; at: number; card: CyberCard }) {
  const [answers, setAnswers] = useState<Record<string, string> | null>(null), [failed, setFailed] = useState(false);
  // The reference answer is loaded with the question, but stays off the page until you ask for it.
  useEffect(() => {
    let live = true;
    import('./answers.json').then(m => { if (live) setAnswers(m.default as Record<string, string>); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, []);
  const c = checks[card.id];
  if (!c || (answers && !answers[card.id])) return <Gone card={card} at={at} />;
  if (!answers) return <Card><p role="status" className="m-0">{failed ? 'The answers couldn’t be opened. Check your connection and try again.' : 'Opening…'}</p></Card>;
  const n = /\.q(\d+)$/.exec(card.id)?.[1] ?? '', title = `${c.lesson} · check ${n}`.trim();
  const q: Asked = {
    id: card.id, kind: 'written', title, path: `Cybersecurity · ${c.lesson}`, prompt: c.prompt, choices: [], correct: null, hint: '',
    answer: answers[card.id], answerLabel: 'Reference answer', explanation: null, explanationLabel: '',
    after: <Note><InlineLink href={lessonHref(lessonOfCheck(card.id))}>Open its lesson</InlineLink></Note>,
    notYet: <>This one hasn’t clicked yet, which is normal for something new. Read the reference answer once more, slowly; at the end of the round there’s a link back to its lesson.</>,
    notesUrl: '', interval: card.review.interval,
    save: (d, k, a, rating) => rateCyberCard(d, card.id, title, k, a, rating),
  };
  return <Question data={data} r={r} at={at} q={q} />;
}

// A question an update of the course removed: nothing is lost, and it's yours to take out.
function Gone({ card, at }: { card: CyberCard; at: number }) {
  const remove = () => { update(d => { if (!removeCyberCards(d, [card.id])) return false; }); skipQuestion(at); };
  return <Card tone="accent" data-cy-gone="">
    <h2>This one is no longer in the course</h2>
    <p>An update to the course took it out. Your past answers to it stay in your history.</p>
    <div className="grid sm:grid-cols-2 gap-3">
      <Button variant="primary" data-action="cy-gone-remove" onClick={remove}>Take it out of revision</Button>
      <Button variant="ghost" data-action="cy-gone-skip" onClick={() => skipQuestion(at)}>Skip for now</Button>
    </div>
  </Card>;
}
