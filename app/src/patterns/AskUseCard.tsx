import { Sparkles } from 'lucide-react';
import { howYouWork } from '../ai/askContext';
import { AI_MODE } from '../ai/request';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { setAskUse } from '../data/patterns/saved';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// "Let Ask MyDay use how you work" (1.108.0, specs/ask-how-you-work.md): off until you switch it on. On, Ask MyDay is
// sent what you've confirmed here (your preferences, and the patterns you said are right), its suggestions are kept to
// your longest task for each list, and MyDay counts what you do with them, so it can show you patterns about them here.
// Off again: nothing more is sent, and what it counted is forgotten. Only shown when this copy of MyDay has AI help.
export function AskUseCard({ data }: { data: MyDayData }) {
  if (AI_MODE === 'off') return null;
  const on = !!data.patterns.prefs.askUse, lines = howYouWork(data), seen = data.patterns.askSeen?.length ?? 0;
  const set = (v: boolean) => { if (update(d => (setAskUse(d.patterns, v) ? undefined : false))) toast(v ? 'Ask MyDay can use how you work.' : 'Ask MyDay no longer uses how you work: nothing more is sent, and what it counted is forgotten.'); };
  return (
    <Card aria-labelledby="askuse-h" id="askUse">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="askuse-h" className="m-0 flex items-center gap-2"><Sparkles size={18} aria-hidden="true" className="text-primary" /> Let Ask MyDay use how you work</h3>
        <Button inline variant={on ? 'selected' : 'tonal'} role="switch" aria-checked={on} data-action="ask-use" onClick={() => set(!on)}>{on ? 'On' : 'Off'}</Button>
      </div>
      <p className="text-[15px] text-fg-2 m-0 mt-2">
        {on ? 'Ask MyDay is sent what you’ve confirmed here, and keeps the tasks it suggests to your longest for each list. MyDay also counts what you do with its suggestions, so it can show you a pattern about them here for you to confirm.'
          : 'Let Ask MyDay use what you’ve confirmed here (your preferences and the patterns you said are right) and learn from what you do with its suggestions.'}
      </p>
      {on && <>
        <p className="text-sm font-semibold m-0 mt-3">What it’s sent now</p>
        <ul className="m-0 pl-5 text-[15px] text-fg-2" data-s="ask-use-lines">
          {lines.length ? lines.map(l => <li key={l}>{l}</li>) : <li>Nothing yet: set a preference below, or say a pattern is right.</li>}
        </ul>
        <p className="text-sm text-fg-3 m-0 mt-2" data-s="ask-use-seen">Counted so far: {seen === 1 ? 'one suggestion' : `${seen} suggestions`} (what you did with them, never their words).</p>
      </>}
      <p className="text-sm text-fg-3 m-0 mt-2">Never sent: what a pattern is based on, patterns you said no to or haven’t answered, your name, or anything private.</p>
    </Card>
  );
}
