import { ListPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { Energy, QueueItem } from '../data/types';
import { EnergySlider } from './EnergySlider';
import { QueueNote } from './QueueNote';

// The top of the morning screen: energy, then "Build my day" right below it.
export function MorningCard({ energy, queue, onEnergy, onBuild, onSkip, onMind }: {
  energy: Energy;
  queue: QueueItem[];
  onEnergy: (v: Energy) => void;
  onBuild: (v: Energy) => void;
  onSkip: () => void;
  onMind?: () => void; // "Add what's on my mind" (only when AI help is set up) — queued tasks are picked first when you build
}) {
  const [value, setValue] = useState<Energy>(energy);
  return (
    <Card id="slot-energy" aria-labelledby="energy-h">
      <h2 id="energy-h">How's your energy today?</h2>
      <EnergySlider key={energy} initial={energy} onCommit={onEnergy} onMove={setValue} />
      <div id="slot-actions" className="grid gap-2.5 mt-5">
        <Button variant="primary" data-action="build" onClick={() => onBuild(value)}>Build my day</Button>
        <Button data-action="skip" onClick={onSkip}>Skip today — make it a rest day</Button>
        {onMind && <Button inline className="w-full" data-action="mind-open" onClick={onMind}><ListPlus size={18} aria-hidden="true" /> Add what's on my mind</Button>}
      </div>
      <p className="text-[15px] text-fg-2 mt-3 mb-0">
        Building shows a proposal first — nothing is saved until you apply it. A rest day never resets your learning count.
      </p>
      <QueueNote queue={queue} prefix="Waiting in your queue (picked first, within today's limit):" />
    </Card>
  );
}
