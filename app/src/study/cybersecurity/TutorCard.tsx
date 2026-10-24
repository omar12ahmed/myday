import { useEffect, useRef, useState } from 'react';
import { AI_MODE, askModel } from '../../ai/request';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field, TextArea } from '../../components/Field';
import { readTutorSteps, type TutorSteps } from '../../../../supabase/functions/_shared/ai/tutor-shape';
import { NEXT_PART, useMoveFocus } from '../reveal';
import { RevealParts } from '../RevealParts';
import type { Lesson } from './catalogue';

type Phase = { at: 'idle' } | { at: 'asking' } | { at: 'shown'; asked: string; r: TutorSteps; by: string; step: number } | { at: 'error'; message: string };
const IDLE: Phase = { at: 'idle' };

// The Cybersecurity tutor, with graduated help (specs/study-home-and-lessons.md §12): your question and the lesson go
// to the AI server (a version-2 request), and the reply comes in parts shown one at a time as you ask — a hint first,
// then an example, the explanation, a follow-up question and its answer. Where parts don't fit (someone else's target,
// answer keys, a mark, a question away from the lesson) it's one plain reply with a next step. Nothing is saved.
export function TutorCard({ lesson }: { lesson: Lesson }) {
  const [question, setQuestion] = useState(''), [phase, setPhase] = useState<Phase>(IDLE);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const { root, part, moveTo } = useMoveFocus(phase, '[data-action="cyber-ask"]');
  if (AI_MODE === 'off') return null;
  const busy = phase.at === 'asking', step = phase.at === 'shown' ? phase.step : -1;
  async function ask() {
    const q = question.trim();
    if (busy || !q) return;
    request.current?.abort();
    const ctrl = new AbortController(); request.current = ctrl;
    setPhase({ at: 'asking' });
    try {
      const result = await askModel({ version: 2, action: 'tutor', curriculumVersion: '1.0.0', lessonId: lesson.id, question: q }, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (!result.ok) { setPhase({ at: 'error', message: result.message }); return; }
      const r = readTutorSteps(result.text, lesson.id);
      if (!r) { setPhase({ at: 'error', message: 'The explanation was not in the expected format. Try again, or continue with the lesson.' }); return; }
      moveTo('part'); setPhase({ at: 'shown', asked: q, r, by: result.model, step: 0 });
    } catch {
      if (!ctrl.signal.aborted) setPhase({ at: 'error', message: 'Couldn’t get an explanation just now — try again, or continue with the lesson.' });
    }
  }
  const next = () => { if (phase.at === 'shown') { moveTo('part'); setPhase({ ...phase, step: phase.step + 1 }); } };
  return <Card><div ref={root} data-s="tutor" data-phase={phase.at} data-step={step}>
    <h3>{AI_MODE === 'mock' ? 'Practice helper (no AI)' : 'Ask for an explanation'}</h3>
    <p className="text-sm text-fg-2">Sends this question and the selected lesson to your configured AI. Your notebook, answers and other Myday data are not sent. AI explanations can be wrong and never grade your work.</p>
    <Field label="What would help you understand this lesson?" htmlFor="cyberTutorQuestion"><TextArea id="cyberTutorQuestion" rows={3} maxLength={1000} value={question} onChange={e => setQuestion(e.target.value)} /></Field>
    <Button className="mt-3" data-action="cyber-ask" disabled={busy || !question.trim()} onClick={() => { void ask(); }}>{busy ? 'Thinking…' : 'Explain this to me'}</Button>
    {busy && <p role="status" className="text-sm text-fg-2">Preparing an explanation for this lesson.</p>}
    {phase.at === 'error' && <p role="alert">{phase.message}</p>}
    {phase.at === 'shown' && <div className="mt-4 border-t border-outline pt-3" data-s="tutor-reply" data-kind={phase.r.kind}>
      <p className="text-xs text-fg-3 m-0">{AI_MODE === 'mock' ? 'Rules-only practice response' : `AI explanation · AI-written by ${phase.by}, not checked by your course`}</p>
      <p className="text-sm text-fg-2 mt-1 mb-0 break-words">You asked: “{phase.asked}”</p>
      {phase.r.kind === 'plain' ? <>
        <div ref={part} tabIndex={-1} className="mt-2 outline-none" data-s="tu-plain"><p className="m-0 whitespace-pre-wrap">{phase.r.explanation}</p></div>
        <p><strong>Try next:</strong> {phase.r.nextStep}</p>
      </> : <>
        <RevealParts r={phase.r} step={step} focus={part} prefix="tu" />
        {step < NEXT_PART.length && <Button inline variant="tonal" className="mt-2" data-action="tu-next" onClick={next}>{NEXT_PART[step]}</Button>}
      </>}
      <p className="text-sm text-fg-2">If you use this help during an attempt, record “Used hints or AI help”.</p>
    </div>}
  </div></Card>;
}
