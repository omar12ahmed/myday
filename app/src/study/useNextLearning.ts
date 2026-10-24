import { useEffect, useMemo, useState } from 'react';
import type { MyDayData } from '../data/types';

// The Arabic and Cybersecurity catalogues are large, so nextLearning.ts (which needs them) loads on demand, away from
// the first bundle. Once loaded it's kept, and `pick` runs straight away on new data. Null until then (and if it
// can't load). `pick` should be defined once, outside the component.
type NextLearning = typeof import('./nextLearning');
let loaded: NextLearning | null = null;
let loading: Promise<NextLearning> | null = null;

export function useNextLearning<T>(data: MyDayData, pick: (m: NextLearning, data: MyDayData) => T): T | null {
  const [mod, setMod] = useState<NextLearning | null>(loaded);
  useEffect(() => {
    if (mod) return;
    let live = true;
    (loading ??= import('./nextLearning')).then(m => { loaded = m; if (live) setMod(m); }).catch(() => { loading = null; });
    return () => { live = false; };
  }, [mod]);
  return useMemo(() => (mod ? pick(mod, data) : null), [mod, data, pick]);
}
