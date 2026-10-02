// Reading saved data.
// While the new app is a preview, it only READS: nothing in it writes to localStorage, so it can't
// change or damage the data the current MyDay saves. Saving will come in a later stage.
import { isObj, normalize, SCHEMA_VERSION } from './normalize';
import type { MyDayData } from './types';

export const STORAGE_KEY = 'myday.data.v4'; // the same key the current MyDay uses
// Data from older versions of MyDay. The current MyDay updates it to the key above when it opens.
const OLDER_KEYS = ['myday.data.v3', 'myday.data.v2', 'myday.tasks', 'myday.days', 'myday.nudge', 'myday.meta'];
const EXPORT_FORMAT = 'myday-export';

export type Loaded =
  | { status: 'ok'; data: MyDayData; dropped: number } // dropped = entries that couldn't be read and were skipped
  | { status: 'empty' }                               // nothing saved in this browser at this address
  | { status: 'older' }                               // only data from an older version of MyDay
  | { status: 'problem'; message: string };

function read(key: string): string | null {
  return localStorage.getItem(key); // may throw if the browser blocks storage
}

// Turns data in the version-4 shape into a result, the same way the current MyDay checks it on start-up.
function check(parsed: unknown, newerMessage: string): Loaded {
  if (!isObj(parsed) || typeof parsed.schemaVersion !== 'number') {
    return { status: 'problem', message: "The saved data is in a format this version doesn't recognise." };
  }
  if (parsed.schemaVersion > SCHEMA_VERSION) return { status: 'problem', message: newerMessage };
  if (![2, 3, SCHEMA_VERSION].includes(parsed.schemaVersion)) {
    return { status: 'problem', message: "The saved data is in a format this version doesn't recognise." };
  }
  const report = { dropped: 0 };
  try {
    return { status: 'ok', data: normalize(parsed, report), dropped: report.dropped };
  } catch {
    return { status: 'problem', message: "The saved data looks damaged and can't be read." };
  }
}

export function loadSaved(): Loaded {
  try {
    const raw = read(STORAGE_KEY);
    if (raw === null) return OLDER_KEYS.some(k => read(k) !== null) ? { status: 'older' } : { status: 'empty' };
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch {
      return { status: 'problem', message: "The saved data looks damaged and can't be read." };
    }
    return check(parsed, 'The saved data comes from a newer version of MyDay.');
  } catch {
    return { status: 'problem', message: "This browser isn't letting MyDay read its saved data." };
  }
}

// Reads a backup made with "Export my data" in the current MyDay. It is only shown, never saved.
export function readBackup(text: string): Loaded {
  let obj: unknown;
  try { obj = JSON.parse(text); } catch {
    return { status: 'problem', message: "That file isn't readable JSON." };
  }
  if (!isObj(obj)) return { status: 'problem', message: "That file isn't a MyDay export." };
  if (obj.format !== EXPORT_FORMAT) {
    return OLDER_KEYS.slice(2).some(k => k in obj)
      ? { status: 'problem', message: 'That backup is from the first version of MyDay. Import it in the current MyDay, then export a new one.' }
      : { status: 'problem', message: "That file isn't a MyDay export." };
  }
  const data = obj.data;
  if (!isObj(data) || data.schemaVersion !== obj.schemaVersion || !isObj(data.lists) || !isObj(data.days)) {
    return { status: 'problem', message: 'That file is missing parts MyDay needs.' };
  }
  const result = check(data, 'That file came from a newer version of MyDay.');
  if (result.status === 'ok') result.data.timer = null; // a running timer from another device doesn't make sense here
  return result;
}
