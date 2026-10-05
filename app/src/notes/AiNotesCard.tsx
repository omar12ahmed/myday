import { Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AI_MODE } from '../ai/request';
import { setAiNotes } from '../data/patterns/saved';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { AI_CONNECT_PER_DAY } from '../shell/aiConnect';

// "AI help with notes" (1.15.0): off until you switch it on, with exactly what it sends said up front. Only shown when
// this copy of MyDay has AI help at all.
export function AiNotesCard({ data }: { data: MyDayData }) {
  if (AI_MODE === 'off') return null;
  const on = !!data.patterns.prefs.aiNotes;
  const set = (v: boolean) => { if (update(d => (setAiNotes(d.patterns, v) ? undefined : false))) toast(v ? 'AI help with notes is on.' : 'AI help with notes is off — nothing more will be sent.'); };
  return (
    <Card aria-labelledby="ainotes-h" id="aiNotes">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="ainotes-h" className="m-0 flex items-center gap-2"><Sparkles size={18} aria-hidden="true" className="text-primary" /> AI help with notes</h3>
        <Button inline variant={on ? 'selected' : 'tonal'} role="switch" aria-checked={on} data-action="ai-notes" onClick={() => set(!on)}>{on ? 'On' : 'Off'}</Button>
      </div>
      <p className="text-[15px] text-fg-2 m-0 mt-2">
        {on ? 'AI help places the notes MyDay can\'t place by itself, and says what kind of note each is. Its links are listed here with Undo, like MyDay\'s own.'
          : 'Let AI help place the notes MyDay can\'t place by itself, in the right project — with Undo, like MyDay\'s own links.'}
      </p>
      <p className="text-sm text-fg-3 m-0 mt-2">
        What's sent: a few notes at a time (never ones you've marked private, or ones already in a project) and your open projects' names and summaries, to the AI service used by MyDay's AI help. At most {AI_CONNECT_PER_DAY} times a day on each device; a note is sent again only if you change it.
      </p>
    </Card>
  );
}
