import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { rateCard } from '../../data/arabic/cards';
import { practiceGap } from '../../data/arabic/practice';
import type { ArabicCard } from '../../data/arabic/types';
import type { MyDayData } from '../../data/types';
import { InlineLink, Note } from '../parts';
import { Question, type Asked } from '../RevisionView';
import type { Round } from '../round';
import { Prose } from '../teaching/TeachingLesson';
import { useTeaching } from '../teaching/useTeaching';
import { Mixed } from './Ar';
import { lessonIndex, loadModule, type ModuleContent } from './catalogue';

// A lesson to practise again (specs/study-home-and-lessons.md §9), in a revision round: its own "Try it" and mini
// challenge, done again from memory, with the explained answer hidden until you ask. You compare and mark it as
// usual; it comes back on Practise again's own gaps (7, 21, 60, then 180 days). Never an AI-written task.
export function PractiseQuestion({ data, r, at, card, lessonId }: { data: MyDayData; r: Round; at: number; card: ArabicCard; lessonId: string }) {
  const entry = lessonIndex[lessonId];
  const [content, setContent] = useState<ModuleContent | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadModule(entry.module_id).then(c => { if (live) setContent(c); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [entry.module_id]);
  const teaching = useTeaching('arabic-fusha', lessonId);
  const l = content?.lessons.find(x => x.id === lessonId);
  if (failed || !content || (!teaching.lesson && !teaching.missing))
    return <Card><p role="status" className="m-0">{failed ? 'This lesson couldn’t be opened. Check your connection and try again.' : 'Opening…'}</p></Card>;
  const challenge = l ? content.exercises.find(e => e.id === l.mini_challenge_id) : undefined, t = teaching.lesson;
  const title = `${entry.title} · practise again`;
  const q: Asked = {
    id: card.id, kind: 'written', title, path: 'Arabic · practise again', choices: [], correct: null, hint: '', notesUrl: '', arabic: true,
    interval: card.review.interval, gap: practiceGap,
    prompt: <>{entry.title}: do it again, from memory</>,
    task: <div className="grid gap-3" data-rev-practice={lessonId}>
      <p className="text-[15px] text-fg-2 m-0">Before you look at the lesson, have a go, in your head, on paper or below. Then compare.</p>
      {t && <div data-rev-practice-try=""><h3 className="text-[17px] mt-0 mb-1">Try it</h3><p className="leading-relaxed m-0"><Prose text={t.practice} /></p></div>}
      {challenge && <div data-rev-practice-challenge=""><h3 className="text-[17px] mt-0 mb-1">Mini challenge · {challenge.estimated_minutes} min</h3><p className="m-0"><Mixed text={challenge.instruction} /></p></div>}
    </div>,
    answer: t ? <Prose text={t.solution} /> : 'This lesson has no set answer for its Try: compare with its explanation and examples.', answerLabel: 'Try it: the explained answer',
    explanation: challenge ? <>{challenge.expected_evidence.map((e, i) => <span key={i} className="block">• <Mixed text={e} /></span>)}</> : null,
    explanationLabel: 'Mini challenge: what to produce',
    after: <Note><InlineLink href={'#study/arabic/' + lessonId}>Open the lesson</InlineLink> for its voice, the practical task and the rest.</Note>,
    notYet: <>This hasn’t clicked yet, which is normal for a skill. Read the lesson’s explanation and worked example again, slowly; it comes back to practise in a week.</>,
    save: (d, k, a, rating) => rateCard(d, card.id, title, k, a, rating),
  };
  return <Question data={data} r={r} at={at} q={q} />;
}
