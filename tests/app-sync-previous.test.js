// Going back a release with cloud sync on (opt-in: run it for a release that adds a sync record kind). Two devices
// on one disposable account in the local stand-in: one runs this release, the other the actual previous release
// (tests/run.sh builds MYDAY_PREVIOUS_SYNC_REF, by default the newest release tag before this commit, with sync
// pointed at the stand-in). Adaptive
// Study's `arabic_lesson` records must be left alone by a release that doesn't know them (before 1.47.0): not taken
// in, not changed, not deleted, and never stopping it syncing. A previous release that knows them takes them in like
// any other record; [2] and [3] check whichever applies. [7] does the same for Keep a word's `arabic_word` records
// (Keep a word). Made-up data only.
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

    // Does the previous release know arabic_lesson (1.47.0 and later)? Its built code names every kind it syncs.
    const assets = path.join('srv', 'previous-sync', 'assets');
    const knows = fs.readdirSync(assets).some(f => f.endsWith('.js') && fs.readFileSync(path.join(assets, f), 'utf8').includes('arabic_lesson'));
    console.log(`The previous release ${knows ? 'knows' : 'doesn\u2019t know'} arabic_lesson records.`);

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
    if (knows) check('…and takes it in like any other record (it knows this kind)', eq((await before.data()).arabic.lessons, [place]));
    else check('…without taking it in: its saved data has no lesson places', !('lessons' in (await before.data()).arabic));
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
    if (knows) check('…which the previous release takes in as a removal, syncing normally', await synced(before) && (await before.status()) === 'synced'
      && await before.until(`!(JSON.parse(localStorage.getItem('${KEY}')).arabic.lessons || []).length`, 20000));
    else check('…which the previous release ignores, syncing normally', await synced(before) && (await before.status()) === 'synced' && !('lessons' in (await before.data()).arabic));

    console.log('\n[4] A project\'s outcome, finish line and "where I left off" pass through the previous release unchanged');
    const P = 'pjLeftOff', stamp = `${today}T09:00`;
    const leftOff = { text: 'Stopped after phoning the bakery about the oven quote.', at: stamp, futureBit: { keep: ['this', 1] } };
    const own = { outcome: 'A bakery stall that opens on Saturdays', finishedWhen: 'The first Saturday market day has run', leftOff };
    await now.setData(`s => { s.projects.items.push({ id: '${P}', title: 'Saturday bakery stall', summary: 'Selling bread at the market.', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', outcome: ${JSON.stringify(own.outcome)}, finishedWhen: ${JSON.stringify(own.finishedWhen)}, leftOff: ${JSON.stringify(leftOff)} }); }`);
    const fieldsOf = r => { const v = r?.value ?? r; return { outcome: v?.outcome, finishedWhen: v?.finishedWhen, leftOff: v?.leftOff }; };
    check('a project with an outcome, a finish line and a note with an extra key reaches the account', await eventually(async () => eq(fieldsOf((await record('project', P))?.data), own)) && await synced(now), fieldsOf((await record('project', P))?.data));
    await before.returnToApp();
    check('the previous release receives the project', await before.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.id === '${P}')`, 20000));
    const held = (await before.data()).projects.items.find(p => p.id === P);
    check('…and its saved data holds the outcome, the finish line and the note exactly, extra key included', eq(fieldsOf(held), own), fieldsOf(held));
    await before.setData(`s => { const p = s.projects.items.find(x => x.id === '${P}'); p.title = 'Saturday bakery stall (renamed)'; p.stage = 'understand'; p.updatedAt = '${today}T10:00'; }`);
    check('a title and stage change on the previous release reaches the account', await eventually(async () => { const r = (await record('project', P))?.data?.value; return r?.title === 'Saturday bakery stall (renamed)' && r?.stage === 'understand'; }) && await synced(before), (await record('project', P))?.data);
    const after = (await record('project', P))?.data;
    check('…with the outcome, the finish line and the note still exactly as sent', eq(fieldsOf(after), own), fieldsOf(after));
    check('…and the previous release still holds all three in its own saved data', eq(fieldsOf((await before.data()).projects.items.find(p => p.id === P)), own));
    await now.open(NOW + `#projects/p/${P}`); await now.returnToApp();
    check('this release receives the new title and stage', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${P}')?.title === 'Saturday bakery stall (renamed)'`, 20000));
    const back = (await now.data()).projects.items.find(p => p.id === P);
    check('…with the outcome, the finish line and the note unchanged in its saved data', eq(fieldsOf(back), own) && back.stage === 'understand', fieldsOf(back));
    check('the project shows the updated title', await now.until(`document.querySelector('#projectTitle')?.textContent === 'Saturday bakery stall (renamed)'`, 10000), await now.text('#projectTitle'));
    check('…the outcome line', (await now.text('[data-s=project-outcome]')).includes(own.outcome), await now.text('[data-s=project-outcome]'));
    check('…and the "Where I left off" card with the note', (await now.text('#projectLeftOff')).includes('Where I left off') && (await now.text('[data-s=leftoff-text]')) === leftOff.text, await now.text('#projectLeftOff'));
    console.log('\n[5] A task that is waiting on someone passes through the previous release unchanged');
    const TW = 'tkWaitBack';
    const waiting = { on: 'Priya at the furniture shop', since: today, until: '2026-12-30', chaseTaskId: 'tkChaseBack', futureBit: { keep: ['this', 1] } };
    await now.setData(`s => { s.tasks.items.push({ id: '${TW}', title: 'Ask about the armchair', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${stamp}', postponed: 0, blockers: [], letGoOn: null, waiting: ${JSON.stringify(waiting)} }); }`);
    check('a waiting task, with an extra key inside the wait, reaches the account with the wait unchanged', await eventually(async () => eq((await record('task', TW))?.data?.waiting, waiting)) && await synced(now), (await record('task', TW))?.data);
    await before.returnToApp();
    check('the previous release receives the task', await before.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.id === '${TW}')`, 20000));
    const heldTask = () => before.data().then(d => d.tasks.items.find(t => t.id === TW));
    check('…and its saved data holds the wait exactly, extra key included', eq((await heldTask()).waiting, waiting), (await heldTask()).waiting);
    await before.setData(`s => { const t = s.tasks.items.find(x => x.id === '${TW}'); t.title = 'Ask about the green armchair'; t.due = '2026-12-05'; }`);
    check('a title and date change on the previous release reaches the account', await eventually(async () => { const r = (await record('task', TW))?.data; return r?.title === 'Ask about the green armchair' && r?.due === '2026-12-05'; }) && await synced(before), (await record('task', TW))?.data);
    check('…with the wait still exactly as sent', eq((await record('task', TW))?.data?.waiting, waiting), (await record('task', TW))?.data?.waiting);
    check('…and the previous release still holds the wait in its own saved data', eq((await heldTask()).waiting, waiting));
    await now.open(NOW + `#today/tasks/${TW}`); await now.returnToApp();
    check('this release receives the new title and date', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${TW}')?.title === 'Ask about the green armchair'`, 20000));
    const backTask = (await now.data()).tasks.items.find(t => t.id === TW);
    check('…with the wait unchanged in its saved data', eq(backTask.waiting, waiting) && backTask.due === '2026-12-05', backTask);
    check('the task page shows the wait card for it', await now.until(`document.querySelector('[data-s=waiting-line]')?.textContent.startsWith('Waiting on Priya at the furniture shop')`, 10000), await now.text('#taskWaiting'));

    console.log('\n[6] A project\'s Learning links pass through the previous release unchanged');
    const PL = 'pjLearnBack', ARABIC = 'lesson.arabic-fusha-register', ARABIC_TITLE = 'What Fuṣḥā means and where it is used';
    const studyLinks = [
      { kind: 'arabic', id: ARABIC, title: ARABIC_TITLE, why: 'For the trip next spring', addedOn: today, futureBit: { keep: ['this', 1] } },
      { kind: 'course', id: 'coGoneBack', title: 'A course removed since', addedOn: today },
      { kind: 'video', id: 'vdFuture', title: 'A kind from a newer MyDay', addedOn: today, speed: 2 },
      { kind: 'cyber', id: 'lesson.learning-evidence', title: 'Learning through evidence', why: 'For the lab', addedOn: today, futureBit: { keep: ['cyber'] } }];
    const linksOf = r => { const v = r?.value ?? r; return v?.studyLinks; };
    await now.setData(`s => { s.projects.items.push({ id: '${PL}', title: 'Learning for the trip', summary: 'Greetings and numbers.', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', studyLinks: ${JSON.stringify(studyLinks)} }); }`);
    check('a project with learning links (one with an extra key, one of a newer kind, and a Cybersecurity lesson) reaches the account with the links unchanged', await eventually(async () => eq(linksOf((await record('project', PL))?.data), studyLinks)) && await synced(now), linksOf((await record('project', PL))?.data));
    await before.returnToApp();
    check('the previous release receives the project', await before.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.id === '${PL}')`, 20000));
    check('…and its saved data holds the links exactly, extra keys included', eq(linksOf((await before.data()).projects.items.find(p => p.id === PL)), studyLinks), linksOf((await before.data()).projects.items.find(p => p.id === PL)));
    await before.setData(`s => { const p = s.projects.items.find(x => x.id === '${PL}'); p.title = 'Learning for the trip (renamed)'; p.stage = 'understand'; p.updatedAt = '${today}T11:00'; }`);
    check('a title and stage change on the previous release reaches the account', await eventually(async () => { const r = (await record('project', PL))?.data?.value; return r?.title === 'Learning for the trip (renamed)' && r?.stage === 'understand'; }) && await synced(before), (await record('project', PL))?.data);
    check('…with the links still exactly as sent', eq(linksOf((await record('project', PL))?.data), studyLinks), linksOf((await record('project', PL))?.data));
    check('…and the previous release still holds them in its own saved data', eq(linksOf((await before.data()).projects.items.find(p => p.id === PL)), studyLinks));
    await now.open(NOW + `#projects/p/${PL}`); await now.returnToApp();
    check('this release receives the new title and stage', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${PL}')?.title === 'Learning for the trip (renamed)'`, 20000));
    const backPl = (await now.data()).projects.items.find(p => p.id === PL);
    check('…with the learning links unchanged in its saved data', eq(backPl.studyLinks, studyLinks) && backPl.stage === 'understand', backPl.studyLinks);
    check('the Learning card shows the lesson\'s real title and its reason', await now.until(`document.querySelector('#projectLearning')?.textContent.includes(${JSON.stringify(ARABIC_TITLE)}) && document.querySelector('#projectLearning')?.textContent.includes('Why: For the trip next spring')`, 15000), await now.text('#projectLearning'));
    check('…and the Cybersecurity lesson with its title, "Cybersecurity lesson", its why and a status from Study', await now.until(`(() => { const t = document.querySelector('#projectLearning')?.textContent || ''; return t.includes('Cybersecurity lesson') && t.includes('Learning through evidence') && t.includes('Why: For the lab') && t.includes('Not started'); })()`, 15000), await now.text('#projectLearning'));
    check('…the course removed since as "No longer in Study", and the newer kind as "Open it in a newer MyDay"', (await now.text('#projectLearning')).includes('No longer in Study') && (await now.text('#projectLearning')).includes('Open it in a newer MyDay'), await now.text('#projectLearning'));

    console.log('\n[7] A word you kept (arabic_word) is left alone by a release that doesn\'t know it');
    const knowsWords = fs.readdirSync(assets).some(f => f.endsWith('.js') && fs.readFileSync(path.join(assets, f), 'utf8').includes('arabic_word'));
    console.log(`The previous release ${knowsWords ? 'knows' : 'doesn\u2019t know'} arabic_word records.`);
    const word = { id: 'kwprevious01', ar: 'بَيْتٌ', meaning: 'house', note: 'from the profile', from: 'asset.arabic-profile', addedOn: today,
      recognise: { reps: 0, interval: 0, lapses: 0, due: today }, write: null };
    await now.returnToApp();
    await now.setData(`s => { s.arabic.words = [${JSON.stringify(word)}]; }`);
    check('this release sends the word as its own record', await eventually(async () => { const r = await record('arabic_word', word.id); return !!r && !r.deleted && eq(r.data, word); }) && await synced(now));
    const sentWord = await record('arabic_word', word.id);
    await before.returnToApp();
    check('the previous release syncs normally with that record in the account', await synced(before) && (await before.status()) === 'synced');
    if (knowsWords) check('…and takes it in like any other record (it knows this kind)', eq((await before.data()).arabic.words, [word]));
    else check('…without taking it in: its saved data has no kept words', !('words' in (await before.data()).arabic));
    await before.setData(`s => { s.arabic.pathId = 'path.arabic-core-b2'; }`);
    check('an Arabic change on the previous release syncs as usual', await eventually(async () => (await record('arabic', 'preferences'))?.data?.pathId === 'path.arabic-core-b2') && await synced(before));
    check('…and leaves the word record exactly as it was sent', eq(await record('arabic_word', word.id), sentWord));
    await now.returnToApp();
    check('back on this release the word is just as you kept it', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).arabic.pathId === 'path.arabic-core-b2'`, 20000) && eq((await now.data()).arabic.words, [word]));
    await now.setData(`s => { s.arabic.words = []; }`);
    check('removing it here leaves a tombstone in the account', await eventually(async () => !!(await record('arabic_word', word.id))?.deleted) && await synced(now));
    await before.returnToApp();
    if (knowsWords) check('…which the previous release takes in as a removal, syncing normally', await synced(before) && await before.until(`!(JSON.parse(localStorage.getItem('${KEY}')).arabic.words || []).length`, 20000));
    else check('…which the previous release ignores, syncing normally', await synced(before) && (await before.status()) === 'synced' && !('words' in (await before.data()).arabic));
    const result = summary(); console.log(`\n${result.pass} passed, ${result.fail} failed`);
    process.exitCode = result.fail ? 1 : 0;
  } finally {
    if (server) await server.close();
    if (downloads) fs.rmSync(downloads, { recursive: true, force: true });
  }
})().then(() => process.exit(process.exitCode || 0)).catch(e => { console.log('HARNESS:', e); process.exit(2); });
