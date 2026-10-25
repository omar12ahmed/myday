// Going back a release with cloud sync on (opt-in: run it for a release that adds a sync record kind). Two devices
// on one disposable account in the local stand-in: one runs this release, the other the actual previous release
// (tests/run.sh builds MYDAY_PREVIOUS_SYNC_REF, by default the newest release tag before this commit, with sync
// pointed at the stand-in). Adaptive
// Study's `arabic_lesson` records must be left alone by a release that doesn't know them (before 1.47.0): not taken
// in, not changed, not deleted, and never stopping it syncing. A previous release that knows them takes them in like
// any other record; [2] and [3] check whichever applies. [7] does the same for Keep a word's `arabic_word` records
// (Keep a word), [9] for Practise again's `arabic_practice` records, and [11] for the portfolio's entries and files.
// Made-up data only.
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
    if (knowsWords) check('…and takes it in like any other record (it knows this kind)', await before.until(`(JSON.parse(localStorage.getItem('${KEY}')).arabic.words || []).length === 1`, 20000) && eq((await before.data()).arabic.words, [word]), (await before.data()).arabic.words);
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

    console.log('\n[8] A project\'s web links (resources) pass through the previous release unchanged');
    const PR = 'pjResourcesBack';
    const resources = [
      { id: 'rsBack1', title: 'Timber merchant', url: 'https://example-timber.co.uk/oak', note: 'Ask about offcuts', addedOn: today, futureBit: { keep: ['links', 1] } },
      { id: 'rsBack2', title: '', url: 'https://www.example.org/guide', addedOn: today }];
    const resOf = r => { const v = r?.value ?? r; return v?.resources; };
    await now.setData(`s => { s.projects.items.push({ id: '${PR}', title: 'Shed links', summary: 'Pages for the shed.', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', resources: ${JSON.stringify(resources)} }); }`);
    check('a project with web links (one with an extra key) reaches the account with the links unchanged', await eventually(async () => eq(resOf((await record('project', PR))?.data), resources)) && await synced(now), resOf((await record('project', PR))?.data));
    await before.returnToApp();
    check('the previous release receives the project', await before.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.id === '${PR}')`, 20000));
    check('…and its saved data holds the links exactly, extra key included', eq(resOf((await before.data()).projects.items.find(p => p.id === PR)), resources), resOf((await before.data()).projects.items.find(p => p.id === PR)));
    await before.setData(`s => { const p = s.projects.items.find(x => x.id === '${PR}'); p.title = 'Shed links (renamed)'; p.stage = 'understand'; p.updatedAt = '${today}T12:00'; }`);
    check('a title and stage change on the previous release reaches the account', await eventually(async () => { const r = (await record('project', PR))?.data?.value; return r?.title === 'Shed links (renamed)' && r?.stage === 'understand'; }) && await synced(before), (await record('project', PR))?.data);
    check('…with the links still exactly as sent', eq(resOf((await record('project', PR))?.data), resources), resOf((await record('project', PR))?.data));
    check('…and the previous release still holds them in its own saved data', eq(resOf((await before.data()).projects.items.find(p => p.id === PR)), resources));
    await now.open(NOW + `#projects/p/${PR}`); await now.returnToApp();
    check('this release receives the new title and stage', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${PR}')?.title === 'Shed links (renamed)'`, 20000));
    const backPr = (await now.data()).projects.items.find(p => p.id === PR);
    check('…with the links unchanged in its saved data', eq(backPr.resources, resources) && backPr.stage === 'understand', backPr.resources);
    check('the Resources card shows both links: the titled one with its site and note, and the untitled one by its site', await now.until(`(() => { const t = document.querySelector('#projectResources')?.textContent || ''; return t.includes('Timber merchant') && t.includes('example-timber.co.uk') && t.includes('Note: Ask about offcuts') && t.includes('example.org'); })()`, 15000), await now.text('#projectResources'));
    check('…and each link opens its address in a new tab', await now.ev(`[...document.querySelectorAll('#projectResources [data-s=resource-link]')].map(a => a.getAttribute('href') + '|' + a.target).join()`) === 'https://example-timber.co.uk/oak|_blank,https://www.example.org/guide|_blank', await now.ev(`[...document.querySelectorAll('#projectResources [data-s=resource-link]')].map(a => a.getAttribute('href'))`));

    console.log('\n[9] A lesson to practise again (arabic_practice) is left alone by a release that doesn\'t know it');
    const knowsPractice = fs.readdirSync(assets).some(f => f.endsWith('.js') && fs.readFileSync(path.join(assets, f), 'utf8').includes('arabic_practice'));
    console.log(`The previous release ${knowsPractice ? 'knows' : 'doesn\u2019t know'} arabic_practice records.`);
    const practice = { id: 'lesson.arabic-fusha-register', tried: today, addedOn: today, review: { reps: 0, interval: 7, lapses: 0, due: today } };
    await now.returnToApp();
    await now.setData(`s => { s.arabic.practice = [${JSON.stringify(practice)}]; }`);
    check('this release sends the lesson to practise again as its own record', await eventually(async () => { const r = await record('arabic_practice', practice.id); return !!r && !r.deleted && eq(r.data, practice); }) && await synced(now));
    const sentPractice = await record('arabic_practice', practice.id);
    await before.returnToApp();
    check('the previous release syncs normally with that record in the account', await synced(before) && (await before.status()) === 'synced');
    if (knowsPractice) check('…and takes it in like any other record (it knows this kind)', await before.until(`(JSON.parse(localStorage.getItem('${KEY}')).arabic.practice || []).length === 1`, 20000) && eq((await before.data()).arabic.practice, [practice]), (await before.data()).arabic.practice);
    else check('…without taking it in: its saved data has no practice records', !('practice' in (await before.data()).arabic));
    await before.setData(`s => { s.arabic.pathId = 'path.arabic-core-b2'; s.arabic.lessons = [{ id: 'lesson.arabic-fusha-register', readyOn: '${today}' }]; }`);
    check('an Arabic change on the previous release, on the same lesson, syncs as usual', await eventually(async () => (await record('arabic_lesson', 'lesson.arabic-fusha-register'))?.data?.readyOn === today) && await synced(before));
    check('…and leaves the practice record exactly as it was sent', eq(await record('arabic_practice', practice.id), sentPractice));
    await now.returnToApp();
    check('back on this release the lesson to practise again is just as it was, beside the Ready mark', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).arabic.lessons?.some(l => l.readyOn === '${today}')`, 20000) && eq((await now.data()).arabic.practice, [practice]));
    await now.setData(`s => { s.arabic.practice = []; s.arabic.lessons = []; }`);
    check('clearing it here leaves a tombstone in the account', await eventually(async () => !!(await record('arabic_practice', practice.id))?.deleted) && await synced(now));
    await before.returnToApp();
    if (knowsPractice) check('…which the previous release takes in as a removal, syncing normally', await synced(before) && await before.until(`!(JSON.parse(localStorage.getItem('${KEY}')).arabic.practice || []).length`, 20000));
    else check('…which the previous release ignores, syncing normally', await synced(before) && (await before.status()) === 'synced' && !('practice' in (await before.data()).arabic));

    console.log('\n[10] Attached files (a project\'s and a note\'s fileIds, the files section and a file record) pass through the previous release unchanged');
    const knowsFiles = fs.readdirSync(assets).some(f => f.endsWith('.js') && /[`'"]file[`'"]\s*[,:\]]/.test(fs.readFileSync(path.join(assets, f), 'utf8')) && fs.readFileSync(path.join(assets, f), 'utf8').includes('fileIds'));
    console.log(`The previous release ${knowsFiles ? 'knows' : 'doesn’t know'} attached files.`);
    const PF = 'pjFilesBack', NF = 'ntFilesBack', FID = 'flback000001';
    const fileRec = { id: FID, name: 'Timber quote.pdf', type: 'application/pdf', size: 4321, sha256: 'e'.repeat(64), area: 'project', state: 'kept', addedOn: today, futureBit: { keep: ['file', 1] } };
    await now.returnToApp();
    await now.setData(`s => { s.files = { items: [${JSON.stringify(fileRec)}] };
      s.projects.items.push({ id: '${PF}', title: 'Shed papers', summary: 'With a quote attached.', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', fileIds: ['${FID}'] });
      s.notes.items.push({ id: '${NF}', categoryId: '', title: 'Shed notes', text: 'Measurements.', pinned: false, createdAt: '${stamp}', updatedAt: '${stamp}', fileIds: ['${FID}'] }); }`);
    check('this release sends the file as its own record, and the project and note with their file ids', await eventually(async () => eq((await record('file', FID))?.data, fileRec) && eq(((await record('project', PF))?.data?.value ?? (await record('project', PF))?.data)?.fileIds, [FID]) && eq((await record('note', NF))?.data?.fileIds, [FID])) && await synced(now), [await record('file', FID), await record('note', NF)]);
    const sentFile = await record('file', FID);
    await before.returnToApp();
    check('the previous release syncs normally with those records in the account', await synced(before) && (await before.status()) === 'synced');
    check('…and receives the project and the note with their file ids exactly', await before.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); const p = d.projects.items.find(x => x.id === '${PF}'), n = d.notes.items.find(x => x.id === '${NF}'); return !!p && !!n && JSON.stringify(p.fileIds) === '["${FID}"]' && JSON.stringify(n.fileIds) === '["${FID}"]'; })()`, 20000), JSON.stringify((await before.data()).projects.items.find(p => p.id === PF)));
    if (knowsFiles) check('…and the file record itself (it knows this kind)', eq((await before.data()).files?.items, [fileRec]));
    else check('…but not the file record itself: it ignores that kind (no files section of its own)', !('files' in (await before.data())) || !(await before.data()).files.items?.length);
    await before.setData(`s => { const p = s.projects.items.find(x => x.id === '${PF}'); p.title = 'Shed papers (renamed)'; p.stage = 'understand'; p.updatedAt = '${today}T12:30'; const n = s.notes.items.find(x => x.id === '${NF}'); n.text = 'Measurements, edited on the previous release.'; n.updatedAt = '${today}T12:30'; }`);
    check('a rename, a stage change and a note edit on the previous release reach the account', await eventually(async () => { const p = (await record('project', PF))?.data?.value, n = (await record('note', NF))?.data; return p?.title === 'Shed papers (renamed)' && /edited on the previous release/.test(n?.text || ''); }) && await synced(before));
    check('…with the project\'s and note\'s file ids, and the file record, exactly as sent', eq((await record('project', PF))?.data?.value?.fileIds, [FID]) && eq((await record('note', NF))?.data?.fileIds, [FID]) && eq(await record('file', FID), sentFile));
    // The previous release keeps an unknown top-level section through its own saves (a footer button saves settings).
    await before.setData(`s => { s.files = { items: [${JSON.stringify(fileRec)}], futureSection: true }; }`);
    await before.open(BEFORE + '#today'); await before.until(`document.querySelector('[data-action=motion]')`, 15000);
    await before.click('[data-action=motion]'); await D.sleep(800);
    const saved = await before.data();
    check('a save by the previous release keeps the files section unread (its record and an unknown field) and the file ids', eq(saved.files?.items?.[0], fileRec) && saved.files?.futureSection === true && eq(saved.projects.items.find(p => p.id === PF).fileIds, [FID]), saved.files);
    await before.click('[data-action=motion]'); await D.sleep(500);
    await now.returnToApp();
    check('back on this release the title and stage arrive, and the file ids and the file record are as they were', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${PF}')?.title === 'Shed papers (renamed)'`, 20000) && eq((await now.data()).files.items.find(f => f.id === FID), fileRec) && eq((await now.data()).projects.items.find(p => p.id === PF).fileIds, [FID]) && eq((await now.data()).notes.items.find(n => n.id === NF).fileIds, [FID]));
    await now.open(NOW + `#projects/p/${PF}`);
    check('the project\'s Files card lists the file, which is still in the account', await now.until(`document.querySelector('#files-project')?.textContent.includes('Timber quote.pdf')`, 15000) && eq(await record('file', FID), sentFile), await now.text('#files-project'));
    console.log('\n[11] A Cybersecurity portfolio entry and its file are left alone by a release that doesn\'t know the portfolio, even 30+ days on');
    const builtText = fs.readdirSync(assets).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(assets, f), 'utf8')).join('\n');
    const knowsPortfolio = /[`'"]cyber_portfolio[`'"]/.test(builtText);
    console.log(`The previous release ${knowsPortfolio ? 'knows' : 'doesn\u2019t know'} the portfolio.`);
    const PE = 'pfback000001', PFID = 'flpfback0001', CTRL = 'flctrl000001';
    const old = new Date(Date.now() - 40 * 86400000), oldDay = `${old.getFullYear()}-${String(old.getMonth() + 1).padStart(2, '0')}-${String(old.getDate()).padStart(2, '0')}`;
    const entry = { id: PE, attemptId: 'caBack', activityId: 'exercise.learning-evidence', title: 'Baseline evidence', evidence: 'Compared two runs.', note: '', reviewedOn: today, fileIds: [PFID] };
    const pfRec = { id: PFID, name: 'Baseline.png', type: 'image/png', size: 2048, sha256: 'f'.repeat(64), area: 'portfolio', state: 'kept', addedOn: today };
    await now.returnToApp();
    await now.setData(`s => { s.cybersecurity.portfolio = [${JSON.stringify(entry)}]; s.files.items.push(${JSON.stringify(pfRec)}); }`);
    check('this release sends the entry as its own record, and its file as a file record', await eventually(async () => eq((await record('cyber_portfolio', PE))?.data, entry) && eq((await record('file', PFID))?.data, pfRec)) && await synced(now));
    await before.returnToApp();
    check('the previous release syncs normally with them in the account', await synced(before) && (await before.status()) === 'synced');
    if (knowsPortfolio) check('…and takes the entry in like any other record (it knows this kind)', await before.until(`(JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.portfolio || []).length === 1`, 20000));
    else check('…without taking the entry in: its saved data has no portfolio', !('portfolio' in (await before.data()).cybersecurity));
    check('…while the file record arrives there as it is', await before.until(`(JSON.parse(localStorage.getItem('${KEY}')).files?.items || []).some(f => f.id === '${PFID}')`, 20000));
    // A file nothing lists, in an area the previous release does judge, so its tidy can be seen to have run (it runs a
    // minute after the page opens, then every ten).
    const ctrl = (id, name) => JSON.stringify({ ...pfRec, id, area: 'project', name, type: 'application/pdf' });
    await before.setData(`s => { s.files.items.push(${ctrl(CTRL, 'Control.pdf')}); }`);
    await before.open(BEFORE + '?reload=' + Date.now() + '#today'); await before.returnToApp();
    check('the previous release\'s own tidy ran (it marked the file nothing lists)', await before.until(`(JSON.parse(localStorage.getItem('${KEY}')).files?.items || []).find(f => f.id === '${CTRL}')?.deletedOn === '${today}'`, 150000));
    const unmarked = (await before.data()).files.items.find(f => f.id === PFID);
    check('…and never marked the portfolio file, though nothing it knows lists it', !!unmarked && !('deletedOn' in unmarked) && unmarked.state === 'kept', unmarked);
    // As if an even older device had marked it long ago, so any version that judged it would delete it for good now.
    await before.setData(`s => { const f = s.files.items.find(x => x.id === '${PFID}'); f.deletedOn = '${oldDay}'; s.files.items.push(${ctrl(CTRL + '2', 'Control 2.pdf')}); }`);
    await before.open(BEFORE + '?reload=' + Date.now() + '#today'); await before.returnToApp();
    check('a later tidy of the previous release ran too', await before.until(`(JSON.parse(localStorage.getItem('${KEY}')).files?.items || []).find(f => f.id === '${CTRL}2')?.deletedOn === '${today}'`, 150000));
    const kept = (await before.data()).files.items.find(f => f.id === PFID);
    // A previous release that knows the portfolio sees the entry list the file, so its tidy rightly clears the old mark.
    if (knowsPortfolio) check('…and, knowing the portfolio, kept the file its entry lists: the old mark cleared, not deleted for good, not forgotten', !!kept && !('deletedOn' in kept) && kept.state === 'kept' && !(await record('file', PFID))?.deleted, kept);
    else check('…and left the portfolio file exactly as it was 40 days on: not deleted for good, not forgotten, its mark untouched', !!kept && kept.deletedOn === oldDay && kept.state === 'kept' && !(await record('file', PFID))?.deleted, kept);
    await now.returnToApp();
    check('back on this release the entry still lists its file, and the file is there', await now.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return (d.cybersecurity.portfolio || []).some(e => e.id === '${PE}' && (e.fileIds || []).includes('${PFID}')) && d.files.items.some(f => f.id === '${PFID}'); })()`, 20000));

    console.log('\n[12] Delete everything: an older release cannot write back to a wiped account (one that knows the wipe clears itself instead) (specs/delete-everything.md)');
    const knowsWipe = fs.readdirSync(assets).some(f => f.endsWith('.js') && fs.readFileSync(path.join(assets, f), 'utf8').includes('sync_push_v3'));
    console.log(`The previous release ${knowsWipe ? 'knows' : 'doesn’t know'} Delete everything.`);
    const ctl = async (name, body = {}) => (await fetch(`http://127.0.0.1:${SUPA}/__standin/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
    const rowsOf = async () => (await S.owner(db, 'select kind, id, deleted from public.sync_records where user_id = $1', [user])).rows;
    await ctl('backup-reset');
    await now.returnToApp(); await synced(now);
    const wasHolding = (await rowsOf()).length;
    check('(test setup: the account holds records from the earlier sections)', wasHolding > 3, wasHolding);
    await S.as(db, user, q => q('select public.sync_wipe($1::uuid)', [user]));
    check('(test setup: the account was wiped with Delete everything; it holds nothing now)', (await rowsOf()).length === 0 && Number((await S.owner(db, 'select epoch from public.sync_accounts where user_id = $1', [user])).rows[0].epoch) === 1);
    // The two devices rejoin the emptied account one after the other: this release first, then the previous release once
    // this one is synced. (Releases 1.73.0 to 1.75.0 could show a conflict over the starter note collections when two
    // devices rejoined at the same moment — each uploads fresh starters with random ids; fixed from 1.76.0, so a race
    // is tested in app-sync, with both devices on this release.)
    await now.returnToApp();
    await now.until(`!!document.querySelector('[data-s=wiped-notice]')`, 40000);
    await synced(now);
    if (knowsWipe) {
      await before.setData(`s => { s.projects.items.push({ id: 'pjOldCopy', title: 'Old copy on the previous release', summary: '', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}' }); }`);
      await before.open(BEFORE + '#today');
      check('a previous release that knows Delete everything clears itself at its next sync and says so', await before.until(`!!document.querySelector('[data-s=wiped-notice]')`, 40000) && /Everything was deleted from another device on /.test(await before.text('[data-s=wiped-notice]')), await before.text('#app'));
      check('…its old copy is gone, and nothing of it reaches the account', (await before.data()).projects.items.every(p => p.id !== 'pjOldCopy') && !(await rowsOf()).some(x => ['project', 'note', 'task', 'day', 'session'].includes(x.kind) || x.id === 'pjOldCopy'), (await rowsOf()).map(x => `${x.kind}:${x.id}`));
    } else {
      await before.setData(`s => { s.projects.items.push({ id: 'pjOldCopy', title: 'Old copy on the previous release', summary: '', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}' }); }`);
      await before.open(BEFORE + '#sync');
      check('the previous release\'s next push is refused, with a message that says to update (not "sign in again")', await before.until(`/This account was cleared with Delete everything\\. Update MyDay to sync it\\./.test(document.body.textContent)`, 40000), await before.text('#syncScreen'));
      check('…it shows as a problem to fix, and does not ask to sign in again', /The cloud refused the request/.test(await before.text('#syncScreen')) && !/Please sign in again/i.test(await before.text('#syncScreen')), await before.text('#syncScreen'));
      await D.sleep(1500);
      check('nothing of its copy reaches the account: no project, note, task or day, and not the old project (the only rows are the other device\'s fresh start)', !(await rowsOf()).some(x => ['project', 'note', 'task', 'day', 'session'].includes(x.kind) || x.id === 'pjOldCopy') && !(await rowsOf()).some(x => x.deleted), (await rowsOf()).map(x => `${x.kind}:${x.id}`));
      await before.open(BEFORE + '#backups'); await before.until(`document.querySelector('[data-action=backup-now]')`, 15000);
      await before.click('[data-action=backup-now]'); await D.sleep(2500);
      const bk = await ctl('backup-objects');
      check('its backup is refused (409) and stores nothing', Array.isArray(bk) && bk.filter(o => o.key.startsWith(user + '/')).length === 0 && !(await before.text('#toast')).includes('Backed up'), [bk, await before.text('#toast')]);
    }
    if (!knowsWipe) {
      await before.open(NOW + '#today');
      check('this release, on the same device profile, clears the old copy and says so', await before.until(`!!document.querySelector('[data-s=wiped-notice]')`, 40000) && /Everything was deleted from another device on /.test(await before.text('[data-s=wiped-notice]')), await before.text('#app'));
      check('…its data is a fresh start (the old project is gone) and it rejoins the account', (await before.data()).projects.items.every(p => p.id !== 'pjOldCopy') && await synced(before) && (await before.status()) === 'synced', await before.status());
      check('…and now it can write: its starter records reach the account, but never the old project', await eventually(async () => (await rowsOf()).length > 0) && !(await rowsOf()).some(x => x.id === 'pjOldCopy'));
    } else await before.open(NOW + '#today');
    await before.open(NOW + '#backups'); await before.until(`document.querySelector('[data-action=backup-now]')`, 15000);
    await before.click('[data-action=backup-now]');
    check('and its backup works again (it sends the account\'s epoch)', await eventually(async () => ((await ctl('backup-objects')) || []).some(o => o.key.startsWith(user + '/')), 15000));

    check('after the wipe section, this release is fully in step (the two devices rejoined one after the other: no conflict over starter records)', await synced(now) && (await now.status()) === 'synced', { status: await now.status(), sync: await now.ev(`(() => { const l = JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link || {}; return { out: Object.keys(l.out || {}), conflicts: Object.fromEntries(Object.entries(l.conflicts || {}).map(([k, c]) => [k, JSON.stringify(c.content).slice(0, 300)])) }; })()`) });
    console.log('\n[13] A project\'s research (its tools, its Research kind, the research section and the research records) passes through the previous release unchanged');
    const knowsResearch = fs.readdirSync(assets).some(f => f.endsWith('.js') && fs.readFileSync(path.join(assets, f), 'utf8').includes('projectResearch') || fs.readFileSync(path.join(assets, f), 'utf8').includes('"research"'));
    console.log(`The previous release ${knowsResearch ? 'might know' : 'doesn’t know'} research.`);
    const PRS = 'pjResBack', RQB = 'rqback000001', RFB = 'rfback000001';
    const rq = { id: RQB, type: 'question', projectId: PRS, text: 'Do commuters buy tea?', conclusion: '', answeredOn: null, createdAt: stamp, updatedAt: stamp, futureBit: { keep: ['research', 1] } };
    const rf = { id: RFB, type: 'finding', projectId: PRS, text: 'Three of five said yes', limits: 'Small sample', on: today, sourceIds: [], about: [{ kind: 'question', id: RQB, stance: 'supports' }, { kind: 'newer', id: 'z1', stance: 'doubts' }], createdAt: stamp, updatedAt: stamp };
    const canon = v => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v);
    const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
    const rrecord = async id => (await S.owner(db, `select data, deleted from public.sync_records where user_id = $1 and kind = 'research' and id = $2`, [user, id])).rows[0];
    await before.open(BEFORE + '#today'); await before.until(`!!document.querySelector('#nav')`, 20000); // (the previous release, again: the section before ended on this one)
    await now.returnToApp();
    await now.setData(`s => { s.projects.items.push({ id: '${PRS}', title: 'Researching a tea cart', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', template: 'research', tools: ['research', 'future-tool'] });
      s.research.items.push(${JSON.stringify(rq)}, ${JSON.stringify(rf)}); }`);
    check('this release sends the research as its own records, and the project with its kind and tools', await eventually(async () => same((await rrecord(RQB))?.data, rq) && same((await rrecord(RFB))?.data, rf)) && await eventually(async () => { const p = (await record('project', PRS))?.data?.value ?? (await record('project', PRS))?.data; return p?.template === 'research' && eq(p?.tools, ['research', 'future-tool']); }), [await rrecord(RQB), await rrecord(RFB), await record('project', PRS), await now.status()]);
    const sentQ = await rrecord(RQB), sentF = await rrecord(RFB);
    await before.returnToApp();
    check('the previous release syncs normally with those records in the account', await synced(before) && (await before.status()) === 'synced');
    check('…and receives the project with its kind and tools exactly (a kind it does not know is kept)', await before.until(`(() => { const p = JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(x => x.id === '${PRS}'); return !!p && p.template === 'research' && JSON.stringify(p.tools) === '["research","future-tool"]'; })()`, 25000), JSON.stringify((await before.data()).projects.items.find(p => p.id === PRS)));
    check('…but not the research records themselves: it ignores that kind', !(((await before.data()).research?.items) || []).some(x => x.projectId === PRS), (await before.data()).research);
    await before.setData(`s => { const p = s.projects.items.find(x => x.id === '${PRS}'); p.title = 'Researching a tea cart (renamed)'; p.stage = 'understand'; p.updatedAt = '${today}T12:45'; }`);
    check('a rename and stage change on the previous release reach the account, with the kind and tools as they were', await eventually(async () => { const p = (await record('project', PRS))?.data?.value ?? (await record('project', PRS))?.data; return p?.title === 'Researching a tea cart (renamed)' && p?.template === 'research' && eq(p?.tools, ['research', 'future-tool']); }) && await synced(before), (await record('project', PRS))?.data);
    check('…and the research records in the account are exactly as sent', same((await rrecord(RQB))?.data, sentQ.data) && same((await rrecord(RFB))?.data, sentF.data) && !(await rrecord(RQB)).deleted);
    await before.setData(`s => { s.research = { items: [${JSON.stringify(rq)}], futureSection: true }; }`);
    await before.open(BEFORE + '#today'); await before.until(`document.querySelector('[data-action=motion]')`, 15000);
    await before.click('[data-action=motion]'); await D.sleep(800);
    const keptSection = await before.data();
    check('a save by the previous release keeps a research section unread (its items and an unknown field) and the project\'s tools', same(keptSection.research?.items?.[0], rq) && keptSection.research?.futureSection === true && eq(keptSection.projects.items.find(p => p.id === PRS).tools, ['research', 'future-tool']), keptSection.research);
    await before.click('[data-action=motion]'); await D.sleep(500);
    await before.setData(`s => { delete s.research; }`);
    await now.returnToApp();
    check('back on this release the title and stage arrive, and the kind, tools and research are as they were', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${PRS}')?.title === 'Researching a tea cart (renamed)'`, 25000) && same((await now.data()).research.items.find(x => x.id === RQB), rq) && same((await now.data()).research.items.find(x => x.id === RFB), rf) && same((await now.data()).projects.items.find(p => p.id === PRS).tools, ['research', 'future-tool']), (await now.data()).research.items.map(x => x.id));
    await now.open(NOW + `#projects/p/${PRS}/research`);
    check('its Research tab shows the question and the finding (a Research kind has the tab without the switch)', await now.until(`/Do commuters buy tea\\?/.test(document.querySelector('[data-s=research-questions]')?.textContent || '') && /Three of five said yes/.test(document.querySelector('[data-s=research-findings]')?.textContent || '')`, 15000), await now.text('#app'));

    console.log('  Deleting the project on the previous release');
    await before.open(BEFORE + '#projects/p/' + PRS); await before.until(`document.querySelector('[data-action=project-delete]')`, 15000);
    await before.click('[data-action=project-delete]'); await before.until(`document.querySelector('[data-action=dialog-confirm]')`); await before.answer(true);
    check('the previous release deletes the project; its research records stay in the account (it does not know them)', await eventually(async () => (await S.owner(db, `select deleted from public.sync_records where user_id = $1 and kind = 'project' and id = $2`, [user, PRS])).rows[0]?.deleted === true) && await synced(before) && !(await rrecord(RQB)).deleted && !(await rrecord(RFB)).deleted);
    await now.returnToApp();
    check('back on this release the project\'s deletion arrives and its research goes with it', await now.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${PRS}') && !d.research.items.some(x => x.projectId === '${PRS}'); })()`, 30000), (await now.data()).research.items.length);
    check('…and its research deletions are sent, so the account holds no live research for it', await eventually(async () => (await rrecord(RQB))?.deleted === true && (await rrecord(RFB))?.deleted === true, 25000), [await rrecord(RQB), await rrecord(RFB), await now.status()]);
    check('…and this release is fully in step again afterwards (nothing waiting, no conflict)', await synced(now) && (await now.status()) === 'synced', { status: await now.status(), sync: await now.ev(`(() => { const l = JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link || {}; return { out: Object.keys(l.out || {}), conflicts: Object.keys(l.conflicts || {}), rejected: Object.keys(l.rejected || {}) }; })()`) });
    const result = summary(); console.log(`\n${result.pass} passed, ${result.fail} failed`);
    process.exitCode = result.fail ? 1 : 0;
  } finally {
    if (server) await server.close();
    if (downloads) fs.rmSync(downloads, { recursive: true, force: true });
  }
})().then(() => process.exit(process.exitCode || 0)).catch(e => { console.log('HARNESS:', e); process.exit(2); });
