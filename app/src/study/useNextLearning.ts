import { useEffect, useMemo, useState } from 'react';
import type { MyDayData } from '../data/types';

// The Arabic and Cybersecurity catalogues are large, so nextLearning.ts (which needs them) loads on demand, away from
// the first bundle. Once loaded it's kept, and `pick` runs straight away on new data. Null while loading; undefined if
// it couldn't load or work out (it tries again when your data next changes). `pick` should be defined once, outside
// the component.
type NextLearning = typeof import('./nextLearning');
let loaded: NextLearning | null = null;
let loading: Promise<NextLearning> | null = null;

export function useNextLearning<T>(data: MyDayData, pick: (m: NextLearning, data: MyDayData) => T): T | null | undefined {
  const [mod, setMod] = useState<NextLearning | null>(loaded);
  const [failed, setFailed] = useState<MyDayData | null>(null);
  useEffect(() => {
    if (mod) return;
    let live = true;
    (loading ??= import('./nextLearning')).then(m => { loaded = m; if (live) setMod(m); })
      .catch(() => { loading = null; if (live) setFailed(data); });
    return () => { live = false; };
  }, [mod, data]);
  return useMemo(() => {
    if (!mod) return failed === data ? undefined : null;
    try { return pick(mod, data); } catch (e) { console.error('MyDay: the next step could not be worked out', e); return undefined; }
  }, [mod, data, pick, failed]);
}
