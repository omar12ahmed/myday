import { useEffect, useRef, useState } from 'react';
import { AI_MODE, askModel } from '../../ai/request';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field, TextArea } from '../../components/Field';
import type { Lesson } from './catalogue';
import { tutorReply } from './tutorReply';

export function TutorCard({ lesson }: { lesson: Lesson }) {
  const [question, setQuestion] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [reply, setReply] = useState<ReturnType<typeof tutorReply>>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  if (AI_MODE === 'off') return null;
  async function ask() {
    if (busy || !question.trim()) return;
    request.current?.abort();
    const ctrl = new AbortController(); request.current = ctrl;
    setBusy(true); setReply(null); setError('');
    const result = await askModel({ version: 1, action: 'tutor', curriculumVersion: '1.0.0', lessonId: lesson.id, question: question.trim() }, ctrl.signal);
    if (ctrl.signal.aborted) return;
    setBusy(false);
    if (!result.ok) { setError(result.message); return; }
    const checked = tutorReply(result.text, lesson.id);
    if (!checked) setError('The explanation was not in the expected format. Try again, or continue with the lesson.');
    else setReply(checked);
  }
  return <Card><h3>{AI_MODE === 'mock' ? 'Practice helper (no AI)' : 'Ask for an explanation'}</h3>
    <p className="text-sm text-fg-2">Sends this question and the selected lesson to your configured AI. Your notebook, answers and other Myday data are not sent. AI explanations can be wrong and never grade your work.</p>
    <Field label="What would help you understand this lesson?" htmlFor="cyberTutorQuestion"><TextArea id="cyberTutorQuestion" rows={3} maxLength={1000} value={question} onChange={e => setQuestion(e.target.value)} /></Field>
    <Button className="mt-3" data-action="cyber-ask" disabled={busy || !question.trim()} onClick={() => { void ask(); }}>{busy ? 'Thinking…' : 'Explain this to me'}</Button>
    {busy && <p role="status" className="text-sm text-fg-2">Preparing an explanation for this lesson.</p>}
    {error && <p role="alert">{error}</p>}
    {reply && <div className="mt-4 border-t border-outline pt-3"><p className="text-xs text-fg-3">{AI_MODE === 'mock' ? 'Rules-only practice response' : 'AI explanation · not independently verified'}</p><p className="whitespace-pre-wrap">{reply.explanation}</p><p><strong>Try next:</strong> {reply.nextStep}</p><p className="text-sm text-fg-2">If you use this help during an attempt, record “Used hints or AI help”.</p></div>}
  </Card>;
}
