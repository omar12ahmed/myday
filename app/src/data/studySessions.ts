// Finished Study sessions, for Today's learning count and garden. Ported from the current MyDay.
// READ-ONLY: the Study section hasn't moved to the new app yet, so this file never changes study data.
import { isDateKey } from './dates';
import { isObj, listOf } from './normalize';
import type { DateKey, MyDayData } from './types';

interface Session { date: DateKey; todayUid: string | null }

// Finished sessions, checked the same way as the current MyDay (bad or repeated entries are ignored).
function finishedSessions(data: MyDayData): Session[] {
  const study = data.study, out: Session[] = [], seen = new Set<string>();
  if (!isObj(study)) return out;
  for (const x of listOf(study.sessions)) {
    if (!isObj(x) || typeof x.id !== 'string' || !x.id || seen.has(x.id) || !isDateKey(x.date)) continue;
    seen.add(x.id);
    if (x.status === 'active') continue;
    out.push({ date: x.date, todayUid: typeof x.todayUid === 'string' ? x.todayUid : null });
  }
  return out;
}

// Did a Study session finish on day k? (Counts as a learning day.)
export const studiedOn = (data: MyDayData, k: DateKey) => finishedSessions(data).some(s => s.date === k);

// Finished Study sessions that didn't also tick a Today task (so nothing is counted twice).
export const studyOnlySessions = (data: MyDayData) => finishedSessions(data).filter(s => !s.todayUid).length;
