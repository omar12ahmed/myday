// Going back a release with cloud sync on (opt-in: run it for a release that adds a sync record kind). Two devices
// on one disposable account in the local stand-in: one runs this release, the other the actual previous release
// (tests/run.sh builds MYDAY_PREVIOUS_SYNC_REF, v1.45.2 by default, with sync pointed at the stand-in). Adaptive
// Study's `arabic_lesson` records must be left alone by the release that doesn't know them: not taken in, not
// changed, not deleted, and never stopping it syncing. Made-up data only.
const fs = require('fs'), os = require('os'), path = require('path');
const { isDeepStrictEqual: eq } = require('node:util');
const D = require('./cdp-devices.js'), S = require('./supabase-standin.js');
const { check, summary } = require('./cdp.js');
const HTTP = process.env.MYDAY_HTTP_PORT || 8765, SUPA = Number(process.env.MYDAY_SUPA_PORT || 54329);
const NOW = `http://127.0.0.1:${HTTP}/sync/index.html`, BEFORE = `http://127.0.0.1:${HTTP}/previous-sync/index.html`, KEY = 'myday.data.v4';
const ACCOUNT = { email: 'going-back@example.test', password: 'disposable-going-back-password' };
let server, downloads;
async function eventually(fn, ms = 15000) {
  const end = Date.now() + ms;
  do { if (await fn()) return true; await D.sleep(100); } while (Date.now() < end);
  return false;
}
const synced = d => eventually(async () => await d.ev(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`));
async function signIn(d, url) {
  await d.open(url);
  if (!await d.until(`!!document.querySelector('#syncEmailInput')`)) throw Error('Disposable sign-in gate absent on ' + d.name);
  await d.type('#syncEmailInput', ACCOUNT.email); await d.type('#syncPassword', ACCOUNT.password);
  await d.click('[data-action=sync-signin]');
  return await d.until(`!!document.querySelector('#nav') && !document.querySelector('#signInGate')`, 20000) && await synced(d);
}
(async () => {
  try {
    const db = await S.createDb(); server = await S.start(db, SUPA);
    const user = await S.addUser(db, ACCOUNT.email, ACCOUNT.password);
    const record = async (kind, id) => (await S.owner(db, 'select data, deleted, version from public.sync_records where user_id = $1 and kind = $2 and id = $3', [user, kind, id])).rows[0];
    await D.connect(); downloads = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-going-back-'));
    const now = await D.device('this-release', path.join(downloads, 'now')), before = await D.device('previous-release', path.join(downloads, 'before'));

    console.log('\n[1] This release sends your place on a lesson as its own record');
    check('this release signs in to the stand-in account', await signIn(now, NOW + '#study/arabic'));
    const today = await now.today(), L = 'lesson.arabic-fusha-register';
    const place = { id: L, readyOn: today, revisit: { since: today, what: 'register words' },
      marks: { 'assessment.arabic-fusha-register-check.q1': { outcome: 'right', support: 'own', on: today, attemptId: 'aaBack' } } };
    await now.setData(`s => {
      s.arabic.attempts.push({ id: 'aaBack', lessonId: '${L}', curriculumVersion: '1.1.2', variant: 'standard', startedAt: '${today}T08:00:00.000Z', finishedAt: '${today}T08:30:00.000Z', help: 'independent', practised: ['reading'], answers: {}, revealed: [], revisit: '' });
      s.arabic.lessons = [${JSON.stringify(place)}];
    }`);
    check('the lesson record reaches the account', await eventually(async () => { const r = await record('arabic_lesson', L); return !!r && !r.deleted && eq(r.data, place); }) && await synced(now));
    const sent = await record('arabic_lesson', L);

    console.log('\n[2] The previous release leaves it alone');
    check('the previous release signs in and finishes syncing with that record in the account', await signIn(before, BEFORE + '#study/arabic'));
    check('…without taking it in: its saved data has no lesson places', !('lessons' in (await before.data()).arabic));
    check('…and it receives everything else, the session included', (await before.data()).arabic.attempts.some(a => a.id === 'aaBack'));
    check('…and leaves the record in the account exactly as it was sent', eq(await record('arabic_lesson', L), sent));
    await before.setData(`s => { s.arabic.pathId = 'path.arabic-a1'; }`);
    check('an Arabic change on the previous release syncs as usual', await eventually(async () => (await record('arabic', 'preferences'))?.data?.pathId === 'path.arabic-a1') && await synced(before));
    check('…and still leaves the lesson record untouched', eq(await record('arabic_lesson', L), sent));

    console.log('\n[3] Back on this release');
    await now.returnToApp();
    check('the change made on the previous release arrives', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).arabic.pathId === 'path.arabic-a1'`, 20000));
    check('…and your place on the lesson is just as you left it', eq((await now.data()).arabic.lessons, [place]));
    await now.setData(`s => { s.arabic.lessons = []; }`);
    check('removing it here leaves a tombstone in the account', await eventually(async () => !!(await record('arabic_lesson', L))?.deleted) && await synced(now));
    await before.returnToApp();
    check('…which the previous release ignores, syncing normally', await synced(before) && (await before.status()) === 'synced' && !('lessons' in (await before.data()).arabic));
    const result = summary(); console.log(`\n${result.pass} passed, ${result.fail} failed`);
    process.exitCode = result.fail ? 1 : 0;
  } finally {
    if (server) await server.close();
    if (downloads) fs.rmSync(downloads, { recursive: true, force: true });
  }
})().then(() => process.exit(process.exitCode || 0)).catch(e => { console.log('HARNESS:', e); process.exit(2); });
