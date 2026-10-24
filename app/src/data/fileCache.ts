// Portfolio files kept on this device for viewing offline (specs/study-home-and-lessons.md §10): IndexedDB, because
// localStorage can't hold them. Only bytes you've already opened or exported are kept, by file id, and they're never
// synced, exported in a backup or sent anywhere. Signing out (sync/engine.ts signOutHere) clears it, as with the rest of
// MyDay's data. Everything here fails quietly: without IndexedDB (a private window, say) files simply open online.
const DB = 'myday-files', STORE = 'bytes';
let opening: Promise<IDBDatabase | null> | null = null;
function db(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return opening ??= new Promise(resolve => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { opening = null; resolve(null); };
      req.onblocked = () => { opening = null; resolve(null); };
    } catch { opening = null; resolve(null); }
  });
}
function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | null> {
  return db().then(d => new Promise<T | null>(resolve => {
    if (!d) return resolve(null);
    try {
      const tx = d.transaction(STORE, mode), req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req ? (req.result ?? null) : null);
      tx.onerror = tx.onabort = () => resolve(null);
    } catch { resolve(null); }
  }));
}
export interface Cached { type: string; bytes: ArrayBuffer }
export const cachedFile = (id: string) => run<Cached | undefined>('readonly', s => s.get(id)).then(x => x ?? null);
export const cacheFile = (id: string, c: Cached) => run('readwrite', s => { s.put(c, id); }).then(() => undefined);
export const forgetCached = (ids: string[]) => run('readwrite', s => { for (const id of ids) s.delete(id); }).then(() => undefined);
// Closes this page's connection first (an open one would hold the deletion up).
export async function clearFileCache(): Promise<void> {
  const open = opening; opening = null;
  (await open)?.close();
  await new Promise<void>(resolve => {
    if (typeof indexedDB === 'undefined') return resolve();
    try { const req = indexedDB.deleteDatabase(DB); req.onsuccess = req.onerror = req.onblocked = () => resolve(); } catch { resolve(); }
  });
}
