// Going back a release with cloud sync on (opt-in: run it for a release that adds a sync record kind). Two devices
// on one disposable account in the local stand-in: one runs this release, the other the actual previous release
// (tests/run.sh builds MYDAY_PREVIOUS_SYNC_REF, by default the newest release tag before this commit, with sync
// pointed at the stand-in). Adaptive
// Study's `arabic_lesson` records must be left alone by a release that doesn't know them (before 1.47.0): not taken
// in, not changed, not deleted, and never stopping it syncing. A previous release that knows them takes them in like
// any other record; [2] and [3] check whichever applies. [7] does the same for Keep a word's `arabic_word` records
// (Keep a word), [9] for Practise again's `arabic_practice` records, [11] for the portfolio's entries and files, and
// [14] for Cybersecurity's lesson records (`cyber_lesson`).
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

    console.log('\n[14] Cybersecurity lesson records (cyber_lesson) are left alone by a release that doesn\u2019t know them');
    const knowsCyberLessons = /[`'"]cyber_lesson[`'"]/.test(builtText);
    console.log(`The previous release ${knowsCyberLessons ? 'knows' : 'doesn\u2019t know'} cyber_lesson records.`);
    const CL = 'lesson.authorised-scope';
    const cyberLesson = { id: CL, readyOn: today, revisit: { since: today, what: 'stop conditions' } };
    await now.returnToApp();
    await now.setData(`s => { s.cybersecurity.lessons = [${JSON.stringify(cyberLesson)}]; }`);
    check('this release sends the lesson record (Ready day and your flag) as its own record', await eventually(async () => { const r = await record('cyber_lesson', CL); return !!r && !r.deleted && eq(r.data, cyberLesson); }) && await synced(now), await record('cyber_lesson', CL));
    const sentCyberLesson = await record('cyber_lesson', CL);
    await before.returnToApp();
    check('the previous release syncs normally with that record in the account', await synced(before) && (await before.status()) === 'synced');
    if (knowsCyberLessons) check('\u2026and takes it in like any other record (it knows this kind)', await before.until(`(JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.lessons || []).length === 1`, 20000) && eq((await before.data()).cybersecurity.lessons, [cyberLesson]), (await before.data()).cybersecurity.lessons);
    else check('\u2026without taking it in: its saved data has no Cybersecurity lesson records', !((await before.data()).cybersecurity.lessons || []).length, (await before.data()).cybersecurity.lessons);
    await before.setData(`s => { s.cybersecurity.pathId = 'path.soc'; }`);
    check('a Cybersecurity change on the previous release (its learning path) syncs as usual', await eventually(async () => (await record('cybersecurity', 'preferences'))?.data?.pathId === 'path.soc') && await synced(before));
    check('\u2026and leaves the lesson record exactly as it was sent: same data, not deleted', eq(await record('cyber_lesson', CL), sentCyberLesson) && !(await record('cyber_lesson', CL)).deleted, await record('cyber_lesson', CL));
    await now.returnToApp();
    check('back on this release the learning path change arrives and the lesson is just as you left it', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.pathId === 'path.soc'`, 20000) && eq((await now.data()).cybersecurity.lessons, [cyberLesson]), (await now.data()).cybersecurity.lessons);
    await now.setData(`s => { s.cybersecurity.lessons = []; }`);
    check('removing the record here leaves a tombstone in the account', await eventually(async () => !!(await record('cyber_lesson', CL))?.deleted) && await synced(now));
    await before.returnToApp();
    if (knowsCyberLessons) check('\u2026which the previous release takes in as a removal, syncing normally', await synced(before) && await before.until(`!(JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.lessons || []).length`, 20000));
    else check('\u2026which the previous release ignores, syncing normally', await synced(before) && (await before.status()) === 'synced' && !((await before.data()).cybersecurity.lessons || []).length);

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
    // (The bundler may write the kind in backticks: look for it quoted any way, as [14] does.) A release that knows
    // research (1.77.0 on) takes the records in, saves the section itself and deletes a project's research with it.
    const knowsResearch = /[`'"]research[`'"]/.test(builtText);
    console.log(`The previous release ${knowsResearch ? 'knows' : 'doesn’t know'} research.`);
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
    if (knowsResearch) check('…and the research records too, exactly as sent (it knows that kind)', await before.until(`(() => { const r = JSON.parse(localStorage.getItem('${KEY}')).research?.items || []; return r.some(x => x.id === '${RQB}') && r.some(x => x.id === '${RFB}'); })()`, 25000)
      && same((await before.data()).research.items.find(x => x.id === RQB), rq) && same((await before.data()).research.items.find(x => x.id === RFB), rf), (await before.data()).research);
    else check('…but not the research records themselves: it ignores that kind', !(((await before.data()).research?.items) || []).some(x => x.projectId === PRS), (await before.data()).research);
    await before.setData(`s => { const p = s.projects.items.find(x => x.id === '${PRS}'); p.title = 'Researching a tea cart (renamed)'; p.stage = 'understand'; p.updatedAt = '${today}T12:45'; }`);
    check('a rename and stage change on the previous release reach the account, with the kind and tools as they were', await eventually(async () => { const p = (await record('project', PRS))?.data?.value ?? (await record('project', PRS))?.data; return p?.title === 'Researching a tea cart (renamed)' && p?.template === 'research' && eq(p?.tools, ['research', 'future-tool']); }) && await synced(before), (await record('project', PRS))?.data);
    check('…and the research records in the account are exactly as sent', same((await rrecord(RQB))?.data, sentQ.data) && same((await rrecord(RFB))?.data, sentF.data) && !(await rrecord(RQB)).deleted);
    // A save by the previous release keeps an unknown field of the section: one that knows research saves the section
    // itself (both records as they are); one that doesn't keeps the whole section unread (here, the question alone).
    await before.setData(knowsResearch ? `s => { s.research.futureSection = true; }` : `s => { s.research = { items: [${JSON.stringify(rq)}], futureSection: true }; }`);
    await before.open(BEFORE + '#today'); await before.until(`document.querySelector('[data-action=motion]')`, 15000);
    await before.click('[data-action=motion]'); await D.sleep(800);
    const keptSection = await before.data();
    check(knowsResearch ? 'a save by the previous release keeps both research records exactly, the section\'s unknown field and the project\'s tools' : 'a save by the previous release keeps a research section unread (its items and an unknown field) and the project\'s tools',
      same(keptSection.research?.items?.find(x => x.id === RQB), rq) && (!knowsResearch || same(keptSection.research?.items?.find(x => x.id === RFB), rf)) && keptSection.research?.futureSection === true && eq(keptSection.projects.items.find(p => p.id === PRS).tools, ['research', 'future-tool']), keptSection.research);
    await before.click('[data-action=motion]'); await D.sleep(500);
    await before.setData(knowsResearch ? `s => { delete s.research.futureSection; }` : `s => { delete s.research; }`); // (on a release that knows research, deleting the section would delete its records)
    await now.returnToApp();
    check('back on this release the title and stage arrive, and the kind, tools and research are as they were', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${PRS}')?.title === 'Researching a tea cart (renamed)'`, 25000) && same((await now.data()).research.items.find(x => x.id === RQB), rq) && same((await now.data()).research.items.find(x => x.id === RFB), rf) && same((await now.data()).projects.items.find(p => p.id === PRS).tools, ['research', 'future-tool']), (await now.data()).research.items.map(x => x.id));
    await now.open(NOW + `#projects/p/${PRS}/research`);
    check('its Research tab shows the question and the finding (a Research kind has the tab without the switch)', await now.until(`/Do commuters buy tea\\?/.test(document.querySelector('[data-s=research-questions]')?.textContent || '') && /Three of five said yes/.test(document.querySelector('[data-s=research-findings]')?.textContent || '')`, 15000), await now.text('#app'));

    console.log('  Deleting the project on the previous release');
    await before.open(BEFORE + '#projects/p/' + PRS); await before.until(`document.querySelector('[data-action=project-delete]')`, 15000);
    await before.click('[data-action=project-delete]'); await before.until(`document.querySelector('[data-action=dialog-confirm]')`); await before.answer(true);
    const projectGone = async () => (await S.owner(db, `select deleted from public.sync_records where user_id = $1 and kind = 'project' and id = $2`, [user, PRS])).rows[0]?.deleted === true;
    if (knowsResearch) check('the previous release deletes the project and its research with it (it knows that kind)', await eventually(projectGone) && await eventually(async () => (await rrecord(RQB))?.deleted === true && (await rrecord(RFB))?.deleted === true, 25000) && await synced(before), [await rrecord(RQB), await rrecord(RFB)]);
    else check('the previous release deletes the project; its research records stay in the account (it does not know them)', await eventually(projectGone) && await synced(before) && !(await rrecord(RQB)).deleted && !(await rrecord(RFB)).deleted);
    await now.returnToApp();
    check('back on this release the project\'s deletion arrives and its research goes with it', await now.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${PRS}') && !d.research.items.some(x => x.projectId === '${PRS}'); })()`, 30000), (await now.data()).research.items.length);
    check(knowsResearch ? '…and the account holds no live research for it' : '…and its research deletions are sent, so the account holds no live research for it', await eventually(async () => (await rrecord(RQB))?.deleted === true && (await rrecord(RFB))?.deleted === true, 25000), [await rrecord(RQB), await rrecord(RFB), await now.status()]);
    check('…and this release is fully in step again afterwards (nothing waiting, no conflict)', await synced(now) && (await now.status()) === 'synced', { status: await now.status(), sync: await now.ev(`(() => { const l = JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link || {}; return { out: Object.keys(l.out || {}), conflicts: Object.keys(l.conflicts || {}), rejected: Object.keys(l.rejected || {}) }; })()`) });

    console.log('\n[15] A task\'s steps and "Starts after" pass through the previous release unchanged (specs/projects-steps.md)');
    const knowsSteps = builtText.includes('steps-mark-done');
    console.log(`The previous release ${knowsSteps ? 'knows' : 'doesn’t know'} steps and "Starts after".`);
    const PST = 'pjStepsBack', TB = 'tkBoardsBack', TF = 'tkFrameBack';
    const stepsF = [{ id: 'tsback000001', text: 'Measure the wall', done: true, futureBit: { keep: ['step', 1] } }, { id: 'tsback000002', text: 'Cut the boards', done: false }];
    const TK15 = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 20, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: stamp, postponed: 0, blockers: [], letGoOn: null, projectId: PST, ...x });
    await now.returnToApp();
    await now.setData(`s => { s.projects.items.push({ id: '${PST}', title: 'Shed with steps', summary: '', stage: 'act', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}' });
      s.tasks.items.push(${JSON.stringify(TK15(TB, 'Order the boards', { createdAt: `${today}T09:05` }))}, ${JSON.stringify(TK15(TF, 'Build the frame', { steps: stepsF, after: [TB] }))}); }`);
    const stepFields = r => ({ steps: r?.steps, after: r?.after });
    check('this release sends the task with its steps (one with an extra key) and what it starts after, inside its task record', await eventually(async () => eq(stepFields((await record('task', TF))?.data), { steps: stepsF, after: [TB] })) && await synced(now), (await record('task', TF))?.data);
    await before.returnToApp();
    check('the previous release syncs normally and receives the task', await synced(before) && await before.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.id === '${TF}')`, 20000));
    const heldF = async () => (await before.data()).tasks.items.find(t => t.id === TF);
    check('…and its saved data holds both fields exactly, the extra key included', eq(stepFields(await heldF()), { steps: stepsF, after: [TB] }), stepFields(await heldF()));
    // The previous release's own task page: renaming it there (its title box saves when you leave it).
    await before.open(BEFORE + `#today/tasks/${TF}`); await before.until(`!!document.querySelector('#tTitle')`, 15000);
    await before.type('#tTitle', 'Build the frame (renamed)');
    check('a rename on the previous release\'s task page reaches the account', await eventually(async () => (await record('task', TF))?.data?.title === 'Build the frame (renamed)') && await synced(before), (await record('task', TF))?.data);
    check('…with the steps and what it starts after still exactly as sent', eq(stepFields((await record('task', TF))?.data), { steps: stepsF, after: [TB] }), stepFields((await record('task', TF))?.data));
    // Deleting the task it starts after, there: a release that doesn't know "Starts after" leaves the id behind.
    await before.open(BEFORE + `#today/tasks/${TB}`); await before.until(`!!document.querySelector('[data-action=task-delete]')`, 15000);
    await before.click('[data-action=task-delete]'); await before.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await before.answer(true);
    check('deleting "Order the boards" on the previous release reaches the account', await eventually(async () => (await record('task', TB))?.deleted === true) && await synced(before), await record('task', TB));
    if (knowsSteps) check('…which (knowing "Starts after") frees the frame: it no longer names it', await eventually(async () => !(await record('task', TF))?.data?.after));
    else check('…which (not knowing "Starts after") leaves the frame\'s `after` naming it', eq((await record('task', TF))?.data?.after, [TB]), (await record('task', TF))?.data?.after);
    await now.returnToApp();
    check('back on this release the new title arrives and the deleted task is gone; the steps are as they were', await now.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return d.tasks.items.find(t => t.id === '${TF}')?.title === 'Build the frame (renamed)' && !d.tasks.items.some(t => t.id === '${TB}'); })()`, 20000)
      && eq((await now.data()).tasks.items.find(t => t.id === TF).steps, stepsF), (await now.data()).tasks.items.find(t => t.id === TF));
    await now.open(NOW + '#today/tasks');
    check('…and nothing holds the frame now (a task that\'s gone doesn\'t count): no "Starts after" on its row, and it shows "1 of 2 steps"', await now.until(`(() => { const row = document.querySelector('.task-li[data-id="${TF}"]'); return !!row && !row.querySelector('[data-s=task-starts-after]') && row.querySelector('[data-s=task-steps]')?.textContent === '1 of 2 steps'; })()`, 10000), await now.text(`.task-li[data-id="${TF}"]`));
    await now.open(NOW + `#projects/p/${PST}`);
    check('…and it is the project\'s next step', await now.until(`document.querySelector('[data-s=next-title]')?.textContent === 'Build the frame (renamed)'`, 10000), await now.text('#projectNext'));
    check('…and this release is fully in step afterwards (nothing waiting, no conflict)', await synced(now) && (await now.status()) === 'synced', { status: await now.status() });

    console.log('\n[16] A course word’s revision card (lexeme.arabic-<lesson>-<n>) passes through a release that doesn’t have the word');
    const knowsCourseWords = builtText.includes('lexeme.arabic-greetings-address-1');
    console.log(`The previous release ${knowsCourseWords ? 'has' : 'doesn’t have'} the course words.`);
    const CW = 'lexeme.arabic-greetings-address-1:recognise', cwCard = { id: CW, addedOn: today, review: { reps: 0, interval: 0, lapses: 0, due: today } };
    const cwIn = d => (d.arabic.cards || []).find(c => c.id === CW);
    await now.returnToApp();
    await now.setData(`s => { s.arabic.cards = (s.arabic.cards || []).filter(c => c.id !== '${CW}'); s.arabic.cards.push(${JSON.stringify(cwCard)}); }`);
    check('this release sends the course word’s card as an ordinary arabic_card record', await eventually(async () => { const r = await record('arabic_card', CW); return !!r && !r.deleted && eq(r.data, cwCard); }) && await synced(now), await record('arabic_card', CW));
    const sentCw = await record('arabic_card', CW);
    await before.returnToApp();
    check('the previous release syncs normally with it in the account, and takes the card in like any other', await synced(before) && (await before.status()) === 'synced'
      && await before.until(`(JSON.parse(localStorage.getItem('${KEY}')).arabic.cards || []).some(c => c.id === '${CW}')`, 20000) && eq(cwIn(await before.data()), cwCard), cwIn(await before.data()));
    await before.setData(`s => { s.arabic.pathId = 'path.arabic-start'; }`);
    check('an Arabic change on the previous release (its learning path) syncs as usual', await eventually(async () => (await record('arabic', 'preferences'))?.data?.pathId === 'path.arabic-start') && await synced(before));
    check('…and leaves the card exactly as it was sent: not deleted, not changed', eq(await record('arabic_card', CW), sentCw), await record('arabic_card', CW));
    await now.returnToApp();
    check('back on this release the path change arrives and the card is as it was', await now.until(`JSON.parse(localStorage.getItem('${KEY}')).arabic.pathId === 'path.arabic-start'`, 20000) && eq(cwIn(await now.data()), cwCard), cwIn(await now.data()));
    await now.setData(`s => { s.arabic.cards = (s.arabic.cards || []).filter(c => c.id !== '${CW}'); }`);
    check('taking it out here leaves a deletion marker in the account', await eventually(async () => !!(await record('arabic_card', CW))?.deleted) && await synced(now));
    await before.returnToApp();
    check('…which the previous release takes in, syncing normally', await synced(before) && await before.until(`!(JSON.parse(localStorage.getItem('${KEY}')).arabic.cards || []).some(c => c.id === '${CW}')`, 20000));

    console.log('\n[17] The Overview cards hidden on a project (hiddenSections) pass through the previous release unchanged (specs/projects-sections.md)');
    const knowsSections = builtText.includes('section-open');
    console.log(`The previous release ${knowsSections ? 'knows' : 'doesn’t know'} optional sections.`);
    const PH = 'pjHideBack', hiddenSections = ['resources', 'newer-section'];
    const hideLinks = [{ id: 'rsHide01', title: 'Timber merchant', url: 'https://example.com/timber', addedOn: today }];
    const valueOf = r => r?.data?.value ?? r?.data;
    await now.returnToApp();
    await now.setData(`s => { s.projects.items.push({ id: '${PH}', title: 'Shed with a hidden card', summary: '', stage: 'act', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', resources: ${JSON.stringify(hideLinks)}, hiddenSections: ${JSON.stringify(hiddenSections)} }); }`);
    check('this release sends the project with the cards hidden on it (one from a newer MyDay too) inside its own record', await eventually(async () => eq(valueOf(await record('project', PH))?.hiddenSections, hiddenSections)) && await synced(now), valueOf(await record('project', PH)));
    await before.returnToApp();
    check('the previous release syncs normally and receives the project with hiddenSections exactly', await synced(before) && await before.until(`JSON.stringify(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${PH}')?.hiddenSections) === '${JSON.stringify(hiddenSections)}'`, 20000), (await before.data()).projects.items.find(p => p.id === PH));
    // The previous release's own project page: a new title (its box saves when you leave it).
    await before.open(BEFORE + `#projects/p/${PH}`); await before.until(`!!document.querySelector('[data-action=project-edit]')`, 15000);
    await before.click('[data-action=project-edit]'); await before.until(`!!document.querySelector('#projectTitleInput')`, 5000);
    await before.type('#projectTitleInput', 'Shed with a hidden card (renamed)');
    check('a rename on the previous release reaches the account with hiddenSections as they were', await eventually(async () => valueOf(await record('project', PH))?.title === 'Shed with a hidden card (renamed)' && eq(valueOf(await record('project', PH))?.hiddenSections, hiddenSections)) && await synced(before), valueOf(await record('project', PH)));
    await now.returnToApp();
    await now.open(NOW + `#projects/p/${PH}`);
    check('back on this release the new title arrives, Resources is still hidden ("Show Resources (1)"), and the newer id is kept', await now.until(`document.querySelector('#projectTitle')?.textContent === 'Shed with a hidden card (renamed)' && !document.querySelector('#projectResources') && (document.querySelector('[data-action=section-show][data-id=resources]')?.textContent || '') === 'Show Resources (1)'`, 20000)
      && eq((await now.data()).projects.items.find(p => p.id === PH).hiddenSections, hiddenSections), await now.text('#projectMore'));
    check('…and this release is fully in step afterwards (nothing waiting, no conflict)', await synced(now) && (await now.status()) === 'synced', { status: await now.status() });

    console.log('\n[18] A task\'s deadline details pass through the previous release unchanged (specs/projects-deadlines.md)');
    const knowsDeadlines = builtText.includes('deadline-kind');
    console.log(`The previous release ${knowsDeadlines ? 'knows' : 'doesn’t know'} deadline details.`);
    const PDL = 'pjDeadlineBack', TDL = 'tkDeadlineBack';
    const deadline = { kind: 'firm', from: 'The tribunal’s letter of 3 Oct', checkedBy: 'My adviser', checkedOn: today, futureBit: { keep: ['deadline', 1] } };
    await now.returnToApp();
    await now.setData(`s => { s.projects.items.push({ id: '${PDL}', title: 'Deposit dispute (deadline)', summary: '', stage: 'act', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', template: 'case', case: { timeline: [], evidence: [], issues: [] } });
      s.tasks.items.push({ id: '${TDL}', title: 'Send my witness statement', listId: '', category: 'admin', minutes: 15, due: '2026-12-20', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${stamp}', postponed: 0, blockers: [], letGoOn: null, projectId: '${PDL}', deadline: ${JSON.stringify(deadline)} }); }`);
    check('this release sends the task with its deadline details (one with an extra key) inside its task record', await eventually(async () => same((await record('task', TDL))?.data?.deadline, deadline)) && await synced(now), (await record('task', TDL))?.data);
    await before.returnToApp();
    check('the previous release syncs normally and receives the task with its deadline exactly', await synced(before) && await before.until(`!!JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${TDL}')?.deadline`, 20000)
      && same((await before.data()).tasks.items.find(t => t.id === TDL).deadline, deadline), (await before.data()).tasks.items.find(t => t.id === TDL)?.deadline);
    await before.open(BEFORE + `#today/tasks/${TDL}`); await before.until(`!!document.querySelector('#tTitle')`, 15000);
    await before.type('#tTitle', 'Send my witness statement (renamed)');
    check('a rename on the previous release\'s task page reaches the account with the deadline as it was', await eventually(async () => (await record('task', TDL))?.data?.title === 'Send my witness statement (renamed)' && same((await record('task', TDL))?.data?.deadline, deadline)) && await synced(before), (await record('task', TDL))?.data);
    await now.returnToApp();
    await now.open(NOW + `#today/tasks/${TDL}`);
    check('back on this release the title arrives and the Deadline card shows it firm, with where it comes from and who checked it', await now.until(`document.querySelector('#tTitle')?.value === 'Send my witness statement (renamed)' && document.querySelector('[data-action=deadline-kind][data-id=firm]')?.getAttribute('aria-pressed') === 'true' && document.querySelector('#tDlFrom')?.value === 'The tribunal’s letter of 3 Oct' && document.querySelector('#tDlBy')?.value === 'My adviser'`, 20000)
      && same((await now.data()).tasks.items.find(t => t.id === TDL).deadline, deadline), await now.text('#taskDeadline'));
    check('…and this release is fully in step afterwards (nothing waiting, no conflict)', await synced(now) && (await now.status()) === 'synced', { status: await now.status() });
    console.log('\n[19] A business idea\'s experiments and money pass through the previous release unchanged (specs/projects-business-tools.md)');
    const knowsMoney = builtText.includes('money-line-add');
    console.log(`The previous release ${knowsMoney ? 'knows' : 'doesn’t know'} experiments and money.`);
    const PBZ = 'pjBizBack', hex = id => Buffer.from(id, 'utf8').toString('hex');
    const ML = (id, label, dir, amount, x = {}) => ({ id, label, dir, amount, per: 'fixed', basis: 'guess', note: '', ...x });
    const money = { currency: 'USD', sale: 'order', saleValue: 30, perSale: [ML('mlB1', 'Commission', 'in', 8, { per: 'percent' }), ML('mlB2', 'Rider', 'out', 1.8, { basis: 'measured', futureBit: 1 })],
      monthly: [ML('mlB3', 'Office', 'out', 900)], startup: [ML('mlB4', 'Motorbike', 'out', 3000)], atSales: 600, forecast: { from: '2027-01', sales: [100, 120] },
      actual: [{ month: '2027-01', sales: 85, in: 280, out: 1050, note: 'rains' }], futureBit: { keep: ['money', 1] } };
    const experiment = { id: 'reBizBack', type: 'experiment', projectId: PBZ, title: 'Ask 20 shops (made up)', tests: [{ kind: 'assumption', id: 'asBack1' }], how: 'Two market days', expect: 'Fewer than 5 say yes',
      status: 'done', startedOn: today, doneOn: today, result: '7 of 20 said yes', conclusion: 'Try a lower price', taskId: null, findingId: 'rfBizBack', createdAt: stamp, updatedAt: stamp, futureBit: { keep: ['experiment', 1] } };
    const finding = { id: 'rfBizBack', type: 'finding', projectId: PBZ, text: '7 of 20 said yes', limits: '', on: today, sourceIds: [], about: [{ kind: 'assumption', id: 'asBack1', stance: 'contradicts' }], experimentId: 'reBizBack', createdAt: stamp, updatedAt: stamp };
    await now.returnToApp();
    await now.setData(`s => { s.projects.items.push({ id: '${PBZ}', title: 'Market delivery (made up)', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', template: 'business', tools: ['research'],
      model: { problem: 'Buyers can’t see stock', who: 'Offices', how: 'Commission', assumptions: [{ id: 'asBack1', text: 'Shops would pay to be listed', state: 'open', found: '', checkedOn: null, taskId: null, createdAt: '${stamp}' }], money: ${JSON.stringify(money)} } });
      s.research.items.push(${JSON.stringify(experiment)}, ${JSON.stringify(finding)}); }`);
    const modelOf = async () => (await record('project_model', hex(PBZ)))?.data?.value;
    check('this release sends the money inside the one page\'s record, the experiment as a research record and the finding with the experiment it came from', await eventually(async () => same((await modelOf())?.money, money)
      && same((await record('research', 'reBizBack'))?.data, experiment) && (await record('research', 'rfBizBack'))?.data?.experimentId === 'reBizBack') && await synced(now), { money: (await modelOf())?.money, exp: (await record('research', 'reBizBack'))?.data });
    await before.returnToApp();
    check('the previous release syncs normally and receives all three exactly', await synced(before) && await before.until(`!!JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${PBZ}')?.model?.money`, 20000)
      && same((await before.data()).projects.items.find(p => p.id === PBZ).model.money, money) && same((await before.data()).research.items.find(x => x.id === 'reBizBack'), experiment)
      && (await before.data()).research.items.find(x => x.id === 'rfBizBack')?.experimentId === 'reBizBack', (await before.data()).projects.items.find(p => p.id === PBZ)?.model);
    await before.open(BEFORE + `#projects/p/${PBZ}/model`); await before.until(`!!document.querySelector('#model-problem')`, 15000);
    await before.type('#model-problem', 'Buyers can’t see what shops have in stock');
    check('an edit on the previous release\'s Model tab reaches the account with the money as it was', await eventually(async () => (await modelOf())?.problem === 'Buyers can’t see what shops have in stock' && same((await modelOf())?.money, money)) && await synced(before), await modelOf());
    check('…and the experiment and finding are untouched in the account', same((await record('research', 'reBizBack'))?.data, experiment) && (await record('research', 'rfBizBack'))?.data?.experimentId === 'reBizBack');
    await now.returnToApp();
    await now.open(NOW + `#projects/p/${PBZ}/money`);
    check('back on this release: the edit arrives, and the Money tab works it out from the plan as it was ("1,500 orders a month": each leaves 0.60)', await now.until(`(document.querySelector('[data-s=break-even]')?.textContent || '') === '1,500 orders a month'`, 30000)
      && (await now.data()).projects.items.find(p => p.id === PBZ).model.problem === 'Buyers can’t see what shops have in stock' && same((await now.data()).projects.items.find(p => p.id === PBZ).model.money, money), await now.text('[data-s=money-break-even]'));
    await now.open(NOW + `#projects/p/${PBZ}/model`);
    check('…the experiment shows on the Model tab with its result, and its finding is there (no offer to save it again)', await now.until(`!!document.querySelector('[data-s=experiment][data-id=reBizBack] [data-s=experiment-result]') && !!document.querySelector('[data-s=experiment][data-id=reBizBack] [data-s=experiment-finding]') && !document.querySelector('[data-s=experiment-offer]')`, 15000), await now.text('#projectExperiments'));
    check('…and this release is fully in step afterwards (nothing waiting, no conflict)', await synced(now) && (await now.status()) === 'synced', { status: await now.status() });
    console.log('\n[20] Decisions backed by evidence and tasks toward milestones pass through the previous release unchanged (specs/projects-evidence-decisions.md)');
    const PEV = 'pjEvBack', TEV = 'tkEvBack';
    const decision = { id: 'dEvBack', question: 'Larch or pine?', options: [{ id: 'oLBack', text: 'Larch', pros: [], cons: [] }, { id: 'oPBack', text: 'Pine', pros: [], cons: [] }], chosen: 'oLBack', why: 'Lasts', decidedOn: today,
      chosenEvidence: { for: 2, against: 1, futureBit: 1 }, history: [{ id: 'dhEvBack', text: 'Pine', on: today, why: '', evidence: { for: 0, against: 1 } }], createdAt: stamp, updatedAt: stamp };
    const findingEv = { id: 'rfEvBack', type: 'finding', projectId: PEV, text: 'Larch lasts 25 years', limits: '', on: today, sourceIds: [], about: [{ kind: 'option', id: 'oLBack', stance: 'supports' }], createdAt: stamp, updatedAt: stamp };
    const expEv = { id: 'reEvBack', type: 'experiment', projectId: PEV, title: 'Try both woods', tests: [{ kind: 'option', id: 'oPBack' }], how: '', expect: '', status: 'planned', startedOn: null, doneOn: null, result: '', conclusion: '', taskId: null, createdAt: stamp, updatedAt: stamp };
    await now.returnToApp();
    await now.setData(`s => { s.projects.items.push({ id: '${PEV}', title: 'Garden shed (evidence)', summary: '', stage: 'decide', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', tools: ['research'],
      milestones: [{ id: 'mEvBack', title: 'Base laid', aim: null, reachedOn: null, createdAt: '${stamp}' }], decisions: [${JSON.stringify(decision)}] });
      s.tasks.items.push({ id: '${TEV}', title: 'Pour the slab', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${stamp}', postponed: 0, blockers: [], letGoOn: null, projectId: '${PEV}', milestoneId: 'mEvBack' });
      s.research.items.push(${JSON.stringify(findingEv)}, ${JSON.stringify(expEv)}); }`);
    // (A decision's previous choices are records of their own, project_choice.)
    const decOf = async () => (await record('project_decision', `${hex(PEV)}.${hex('dEvBack')}`))?.data?.value;
    const { history: _h, ...decisionOwn } = decision;
    const choiceOf = async id => (await record('project_choice', `${hex(PEV)}.${hex('dEvBack')}.${hex(id)}`))?.data?.value;
    check('this release sends the decision with its evidence (a previous choice\'s in its own record), the finding about an option, the experiment testing one and the task toward a milestone', await eventually(async () => same(await decOf(), decisionOwn)
      && same(await choiceOf('dhEvBack'), decision.history[0])
      && same((await record('research', 'rfEvBack'))?.data, findingEv) && same((await record('research', 'reEvBack'))?.data, expEv) && (await record('task', TEV))?.data?.milestoneId === 'mEvBack') && await synced(now), await decOf());
    await before.returnToApp();
    check('the previous release syncs normally and receives all four exactly', await synced(before) && await before.until(`!!JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${TEV}')?.milestoneId`, 20000)
      && same((await before.data()).projects.items.find(p => p.id === PEV).decisions[0], decision) && same((await before.data()).research.items.find(x => x.id === 'rfEvBack'), findingEv)
      && same((await before.data()).research.items.find(x => x.id === 'reEvBack'), expEv), (await before.data()).projects.items.find(p => p.id === PEV)?.decisions);
    await before.open(BEFORE + `#today/tasks/${TEV}`); await before.until(`!!document.querySelector('#tTitle')`, 15000);
    await before.type('#tTitle', 'Pour the slab (renamed)');
    check('a rename on the previous release\'s task page reaches the account with the milestone as it was', await eventually(async () => (await record('task', TEV))?.data?.title === 'Pour the slab (renamed)' && (await record('task', TEV))?.data?.milestoneId === 'mEvBack') && await synced(before));
    // The previous release thinks again: its history entry has no evidence, and the open decision keeps the old counts —
    // this release reads that as it is (nothing rewritten on load) and shows no evidence for an open decision.
    await before.open(BEFORE + `#projects/p/${PEV}/decisions`); await before.until(`!!document.querySelector('[data-action=dc-again]')`, 15000);
    await before.click('[data-action=dc-again]');
    const beforeDec = async () => (await before.data()).projects.items.find(p => p.id === PEV).decisions[0];
    check('"Think again" on the previous release reaches the account (the decision open, its last choice in the history)', await eventually(async () => (await decOf())?.chosen === null && (await beforeDec()).history?.length === 2) && await synced(before), await decOf());
    const afterBefore = await beforeDec();
    await now.returnToApp();
    await now.open(NOW + `#projects/p/${PEV}/decisions`);
    check('back on this release: the task\'s new title arrives with its milestone, the decision is open, with no evidence shown for a choice', await now.until(`!!document.querySelector('[data-action=opt-choose]')`, 30000)
      && (await now.data()).tasks.items.find(t => t.id === TEV).title === 'Pour the slab (renamed)' && (await now.data()).tasks.items.find(t => t.id === TEV).milestoneId === 'mEvBack' && !(await now.exists('[data-s=dc-evidence]')));
    check('…the decision reads exactly as the previous release saved it (loading rewrote nothing), and this release is in step', same((await now.data()).projects.items.find(p => p.id === PEV).decisions[0], afterBefore) && await synced(now) && (await now.status()) === 'synced', { status: await now.status() });

    console.log('\n[21] A project\'s area and how it ended pass through the previous release unchanged (specs/projects-areas-archive.md)');
    const PAR = 'pjAreaBack', PAD = 'pjDoneBack';
    const ending = { how: 'stopped', note: 'Too costly (made up)', on: today, futureBit: 1 };
    const areaBits = p => p && { area: p.area, areaColour: p.areaColour, finished: p.finished };
    const areaKept = { area: 'Home', areaColour: 'rose' }, areaDone = { ...areaKept, finished: ending };
    const pjOf = async id => (await record('project', id))?.data?.value;
    await now.returnToApp();
    await now.setData(`s => { s.projects.items.push({ id: '${PAR}', title: 'Kitchen shelves (made up)', summary: '', stage: 'organise', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', area: 'Home', areaColour: 'rose' },
      { id: '${PAD}', title: 'Weekend stall (made up)', summary: '', stage: 'organise', status: 'done', nextTaskId: null, commitmentIds: [], createdAt: '${stamp}', updatedAt: '${stamp}', area: 'Home', areaColour: 'rose', finished: ${JSON.stringify(ending)} }); }`);
    check('this release sends a project\'s area, its colour and how it ended (with a newer MyDay\'s extra key) in the project\'s record', await eventually(async () => same(areaBits(await pjOf(PAR)), areaKept) && same(areaBits(await pjOf(PAD)), areaDone)) && await synced(now), [areaBits(await pjOf(PAR)), areaBits(await pjOf(PAD))]);
    await before.returnToApp();
    check('the previous release syncs normally and holds all three exactly in its saved data', await synced(before) && await before.until(`!!JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${PAD}')?.finished`, 20000)
      && same(areaBits((await before.data()).projects.items.find(p => p.id === PAR)), areaKept) && same(areaBits((await before.data()).projects.items.find(p => p.id === PAD)), areaDone), areaBits((await before.data()).projects.items.find(p => p.id === PAD)));
    await before.open(BEFORE + `#projects/p/${PAR}`); await before.until(`!!document.querySelector('[data-action=project-edit]')`, 15000);
    await before.click('[data-action=project-edit]'); await before.until(`!!document.querySelector('#projectTitleInput')`, 5000);
    await before.type('#projectTitleInput', 'Kitchen shelves (renamed)');
    check('a rename on the previous release\'s project page reaches the account with the area and colour as they were', await eventually(async () => (await pjOf(PAR))?.title === 'Kitchen shelves (renamed)' && same(areaBits(await pjOf(PAR)), areaKept)) && await synced(before), await pjOf(PAR));
    // The previous release's "Open it again" knows nothing of the ending, so leaves it behind on an active project:
    // this release reads that as it is (nothing rewritten on load) and shows no ending for a project that isn't finished.
    await before.open(BEFORE + `#projects/p/${PAD}`); await before.until(`!!document.querySelector('[data-action=project-resume]')`, 15000);
    await before.click('[data-action=project-resume]');
    check('"Open it again" on the previous release reaches the account: active, with the area, colour and ending as they were', await eventually(async () => (await pjOf(PAD))?.status === 'active' && same(areaBits(await pjOf(PAD)), areaDone)) && await synced(before), await pjOf(PAD));
    const reopened = (await before.data()).projects.items.find(p => p.id === PAD);
    await now.returnToApp();
    await now.open(NOW + `#projects/p/${PAD}`);
    check('back on this release: the project is active again in Home, with no ending shown and no "In the archive"', await now.until(`(document.querySelector('#projectTitle')?.textContent || '') === 'Weekend stall (made up)' && !!document.querySelector('#projectTop [data-s=area-label]')`, 30000)
      && (await now.data()).projects.items.find(p => p.id === PAD).status === 'active' && !(await now.exists('[data-s=project-ended]')) && !(await now.text('#projectTop')).includes('In the archive'), await now.text('#projectTop'));
    check('…it reads exactly as the previous release saved it (loading rewrote nothing), the rename arrived with its area, and this release is in step', same((await now.data()).projects.items.find(p => p.id === PAD), reopened)
      && (await now.data()).projects.items.find(p => p.id === PAR).title === 'Kitchen shelves (renamed)' && same(areaBits((await now.data()).projects.items.find(p => p.id === PAR)), areaKept) && await synced(now) && (await now.status()) === 'synced', { status: await now.status() });
    await now.open(NOW + '#projects'); await now.until(`!!document.querySelector('[data-s=project-areas]')`, 15000);
    const homeChip = (await now.text('[data-action=area-pick][data-id=Home]')).replace(/\s+/g, ' ').trim();
    await now.click('[data-action=area-pick][data-id=Home]'); await now.until(`document.querySelector('[data-action=area-pick][data-id=Home]')?.getAttribute('aria-pressed') === 'true'`, 5000);
    check('…and the Projects home shows the area with its two projects, both on the board, and nothing in the archive from these', homeChip === 'Home 2'
      && await now.exists(`.project-card[data-id=${PAR}]`) && await now.exists(`.project-card[data-id=${PAD}]`) && !(await now.ev(`[...document.querySelectorAll('#projects-archive [data-s=archive-row]')].some(r => /Weekend stall|Kitchen shelves/.test(r.textContent))`)), homeChip);
    await now.click('[data-action=area-pick][data-id=all]');
    const result = summary(); console.log(`\n${result.pass} passed, ${result.fail} failed`);
    process.exitCode = result.fail ? 1 : 0;
  } finally {
    if (server) await server.close();
    if (downloads) fs.rmSync(downloads, { recursive: true, force: true });
  }
})().then(() => process.exit(process.exitCode || 0)).catch(e => { console.log('HARNESS:', e); process.exit(2); });
