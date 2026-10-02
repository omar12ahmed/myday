import { useEffect, useRef, useState } from 'react';
import { ENERGY_LABEL } from '../data/plan';
import type { Energy } from '../data/types';

// The 1–5 energy slider. The label updates while you drag; the value is only saved when you let go
// (the browser's "change" event), so dragging past 2 on the way to 4 doesn't save 2 and 3 too.
// Remount it with a new `key` to show a value saved elsewhere.
export function EnergySlider({ initial, onCommit, onMove }: { initial: Energy; onCommit: (v: Energy) => void; onMove?: (v: Energy) => void }) {
  const [shown, setShown] = useState<Energy>(initial);
  const ref = useRef<HTMLInputElement>(null);
  const commit = useRef(onCommit);
  useEffect(() => { commit.current = onCommit; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = () => commit.current(Number(el.value) as Energy);
    el.addEventListener('change', done);
    return () => el.removeEventListener('change', done);
  }, []);

  return (
    <>
      <p id="energyLabel" className="text-xl font-bold text-center my-1 tabular-nums" aria-hidden="true">{shown} · {ENERGY_LABEL[shown]}</p>
      <input
        ref={ref}
        id="energy"
        type="range"
        min={1}
        max={5}
        step={1}
        value={shown}
        aria-label="Energy from 1 to 5"
        aria-valuetext={`${shown}, ${ENERGY_LABEL[shown]}`}
        className="energy-range"
        style={{ '--fill': `${(shown - 1) * 25}%` } as React.CSSProperties}
        onChange={e => { const v = Number(e.target.value) as Energy; setShown(v); onMove?.(v); }}
      />
      <div className="flex justify-between text-fg-3 text-sm px-3 mb-2.5" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
      <p className="text-[15px] text-fg-2 m-0">Your rating is always yours — MyDay never changes it based on sleep or anything else.</p>
    </>
  );
}
