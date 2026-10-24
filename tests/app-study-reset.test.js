// Study reset against disposable accounts in the local PostgreSQL/Auth stand-in. No live service or user data.
const fs = require('fs'), os = require('os'), path = require('path');
const { isDeepStrictEqual } = require('node:util');
const D = require('./cdp-devices.js'), S = require('./supabase-standin.js');
const { check, summary } = require('./cdp.js');
const HTTP = process.env.MYDAY_HTTP_PORT || 8765, SUPA = Number(process.env.MYDAY_SUPA_PORT || 54329);
const APP = `http://127.0.0.1:${HTTP}/sync/index.html`, KEY = 'myday.data.v4';
const ACCOUNT = { email: 'study-reset@example.test', password: 'disposable-reset-password' };
const eq = isDeepStrictEqual;
const raw = d => d.ev(`localStorage.getItem('${KEY}')`);
let server, downloads;
async function eventually(fn, ms = 15000) {
  const end = Date.now() + ms;
  do { if (await fn()) return true; await D.sleep(100); } while (Date.now() < end);
  return false;
}
async function synced(d) {
  return eventually(async () => await d.ev(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`));
}
(async () => {
  try {
    const db = await S.createDb(); server = await S.start(db, SUPA);
    const user = await S.addUser(db, ACCOUNT.email, ACCOUNT.password);
    const record = async (kind, id) => (await S.owner(db, 'select data, deleted, version from public.sync_records where user_id = $1 and kind = $2 and id = $3', [user, kind, id])).rows[0];
    await D.connect(); downloads = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-study-reset-'));
    const mac = await D.device('reset-mac', path.join(downloads, 'mac')), phone = await D.device('reset-phone', path.join(downloads, 'phone'));
    for (const device of [mac, phone]) {
      await device.open(APP + '#study/settings');
      if (!await device.until(`!!document.querySelector('#syncEmailInput')`)) throw Error('Disposable sign-in gate absent');
      await device.type('#syncEmailInput', ACCOUNT.email); await device.type('#syncPassword', ACCOUNT.password);
      await device.click('[data-action=sync-signin]');
      check(device.name + ' signs into the local stand-in', await device.until(`!!document.querySelector('#nav') && !document.querySelector('#signInGate')`) && await synced(device));
    }
    const today = await mac.today();
    await mac.setData(`s => {
      const review = { reps: 3, interval: 10, lapses: 1, due: '${today}' };
      s.study.topics = [{ id: 'tpReset', title: 'Practice' }];
      s.study.stages = [{ id: 'sgReset', title: 'Start here', topicId: 'tpReset', courses: [{ id: 'coReset', title: 'A saved course', url: '', minutes: 20, listId: null, archived: false,
        modules: [{ id: 'mdReset', title: 'A module', sections: [{ id: 'scReset', title: 'A section', tasks: [{ id: 'tkReset', title: 'A completed task', minutes: 20, url: '', kind: 'learn', note: 'Keep this course note', done: true, doneOn: '${today}' }] }] }] }] }];
      s.study.concepts = [{ id: 'cpReset', title: 'DNS', taskIds: ['tkReset'], createdOn: '${today}', kind: 'written', prompt: 'What resolves names?', answer: 'DNS', explanation: 'Keep this explanation', choices: [], correct: null, hint: '', source: '', note: 'Keep this note', review }];
      s.study.sessions = [{ id: 'ssReset', courseId: 'coReset', taskId: 'tkReset', title: 'A completed session', date: '${today}', startedAt: '${today}T09:00', plannedMin: 20, short: false, status: 'done', runningSince: null, activeMs: 1200000, endedAt: '${today}T09:20', checkin: { conceptIds: ['cpReset'], clarity: 'understand', takeaway: 'In the backup', question: '', note: '' }, taskDone: true, todayUid: null }];
      s.study.reviews = [{ id: 'rvReset', conceptId: 'cpReset', title: 'DNS', date: '${today}', at: '${today}T09:30', kind: 'written', outcome: 'right', graded: 'self', chosen: null, support: 'own', rating: 'good', gap: 2, due: '${today}' }];
      s.study.focusCourseId = 'coReset'; s.study.activeId = null;
      s.arabic.attempts = [{ id: 'aaReset', lessonId: 'lesson.arabic-fusha-register', curriculumVersion: '1.1.1', variant: 'standard', startedAt: '${today}T08:00', finishedAt: '${today}T08:20', help: 'independent', practised: ['reading'], answers: { 'assessment.arabic-fusha-register-check.q1': 'An answer in the backup' }, revealed: [], revisit: 'A practice note in the backup' }];
      s.cybersecurity.attempts = [{ id: 'caReset', activityId: 'exercise.learning-evidence', curriculumVersion: '1.0.0', rubricVersion: '1.0.0', startedAt: '${today}T08:00', submittedAt: '${today}T08:20', inputVariant: 'Made-up practice', environmentId: '', assistance: 'independent', evidence: 'Evidence in the backup', answers: {}, rubricScores: [], criticalPassed: true, resumePoint: 'A resume note', answerRevealed: false, assessor: 'self', verified: false }];
      s.arabic.cards = [{ id: 'lexeme.arabic-seed-001:recognise', addedOn: '${today}', review }];
      s.arabic.lessons = [{ id: 'lesson.arabic-fusha-register', readyOn: '${today}', revisit: { since: '${today}', what: 'Keep for the restore' } }];
      s.cybersecurity.cards = [{ id: 'assessment.learning-evidence-check.q1', addedOn: '${today}', review }];
      s.notes.items.push({ id: 'ntReset', categoryId: '', title: 'Separate note', text: 'This must stay', pinned: false, createdAt: '${today}T08:00', updatedAt: '${today}T08:00' });
    }`);
    const removed = [['session', 'ssReset'], ['review', 'rvReset'], ['arabic_attempt', 'aaReset'], ['arabic_lesson', 'lesson.arabic-fusha-register'], ['cyber_attempt', 'caReset']];
    check('all kinds of learning history reach the account before resetting', await eventually(async () => (await Promise.all(removed.map(([kind, id]) => record(kind, id)))).every(r => r && !r.deleted)));
    await phone.returnToApp();
    check('the second device receives the original learning history', await phone.until(`JSON.parse(localStorage.getItem('${KEY}')).study.sessions.some(s => s.id === 'ssReset') && JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.attempts.some(a => a.id === 'caReset')`));
    await synced(mac); await synced(phone);
    check('reset starts disabled', await mac.ev(`document.querySelector('[data-action=study-reset]').disabled`));

    async function checkedBackup(label) {
      // Headless Chrome may reuse the same suggested filename for successive exports.
      for (const name of fs.readdirSync(mac.dir)) fs.unlinkSync(path.join(mac.dir, name));
      const before = await mac.data();
      await mac.click('[data-action=study-backup]');
      let file, backup;
      if (!await eventually(async () => {
        file = fs.readdirSync(mac.dir).find(name => !name.endsWith('.crdownload'));
        try { if (file) backup = JSON.parse(fs.readFileSync(path.join(mac.dir, file), 'utf8')); } catch { return false; }
        return !!backup;
      })) throw Error('Backup download did not complete');
      check(label + ': the downloaded file is a complete backup of current data', backup.format === 'myday-export' && eq(backup.data, before), { format: backup.format, differentSections: Object.keys(before).filter(key => !eq(backup.data?.[key], before[key])) });
      check(label + ': requesting a download alone does not authorise reset', await mac.ev(`document.querySelector('[data-action=study-reset]').disabled`));
      await mac.click('[data-action=study-backup-verified]');
      check(label + ': checking the backup enables reset', await mac.until(`!!document.querySelector('[data-action=study-reset]:not(:disabled)')`));
      return { file: path.join(mac.dir, file), backup };
    }
    await checkedBackup('First backup');
    const beforeCancel = await raw(mac);
    await mac.click('[data-action=study-reset]'); await mac.until(`!!document.querySelector('dialog[open]')`);
    check('the confirmation explains which authored history will be removed', /check-ins/.test(await mac.text('dialog[open]')) && /notebook attempts and evidence/.test(await mac.text('dialog[open]')));
    await mac.answer(false);
    check('cancelling reset changes no saved bytes', await raw(mac) === beforeCancel);
    await mac.ev(`window.resetSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === '${KEY}') throw new DOMException('Test quota', 'QuotaExceededError'); return window.resetSetItem.call(this, k, v); };`);
    await mac.click('[data-action=study-reset]'); await mac.until(`!!document.querySelector('dialog[open]')`); await mac.answer(true);
    check('a failed save leaves every saved byte and visible progress intact', await raw(mac) === beforeCancel && await mac.ev(`document.querySelector('#toast').textContent.includes('progress is unchanged')`) && await mac.ev(`document.querySelector('[data-action=study-reset]').disabled === false`));
    await mac.ev('Storage.prototype.setItem = window.resetSetItem; delete window.resetSetItem');
    check('the failed reset sends no session deletion to the account', (await record('session', 'ssReset')).deleted === false);

    async function remoteSession(id) {
      await phone.setData(`s => { s.study.sessions.push({ ...s.study.sessions.find(s => s.id === 'ssReset'), id: '${id}', title: 'New progress from another device' }); }`);
      if (!await eventually(async () => { const r = await record('session', id); return r && !r.deleted; })) throw Error('Remote fixture did not reach account');
      await mac.returnToApp();
      if (!await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).study.sessions.some(s => s.id === '${id}')`)) throw Error('Remote progress did not reach resetting device');
      await synced(mac); await synced(phone);
    }
    await remoteSession('ssAfterBackup');
    check('progress arriving after backup disables reset until a new checked backup', await mac.ev(`document.querySelector('[data-action=study-reset]').disabled && !document.querySelector('[data-action=study-backup-verified]')`));
    await checkedBackup('Updated backup');
    await mac.click('[data-action=study-reset]'); await mac.until(`!!document.querySelector('dialog[open]')`);
    await remoteSession('ssDuringConfirm');
    await mac.answer(true);
    check('progress arriving during confirmation blocks reset and keeps the new records', await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).study.sessions.length === 3 && document.querySelector('[data-action=study-reset]').disabled`) && /fresh backup/.test(await mac.text('#toast')));
    check('the stale confirmation sends no history deletions', (await Promise.all(removed.map(([kind, id]) => record(kind, id)))).every(r => r && !r.deleted));

    const restore = await checkedBackup('Final backup'), beforeReset = await mac.data();
    await mac.click('[data-action=study-reset]'); await mac.until(`!!document.querySelector('dialog[open]')`); await mac.answer(true);
    check('a confirmed reset clears each kind of local learning history', await mac.until(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); return !s.study.sessions.length && !s.study.reviews.length && !s.arabic.attempts.length && !s.arabic.lessons.length && !s.cybersecurity.attempts.length; })()`));
    const reset = await mac.data();
    check('the outline, concept questions and separate notes remain', reset.study.stages[0].courses[0].modules[0].sections[0].tasks[0].done === false && reset.study.concepts[0].prompt === beforeReset.study.concepts[0].prompt && eq(reset.notes, beforeReset.notes));
    check('revision cards remain with fresh schedules', reset.arabic.cards[0].review.reps === 0 && reset.cybersecurity.cards[0].review.due === null && reset.study.concepts[0].review.reps === 0);
    const unrelated = data => { const copy = { ...data }; for (const key of ['saves', 'study', 'arabic', 'cybersecurity']) delete copy[key]; return copy; };
    check('every unrelated MyDay section is unchanged', eq(unrelated(reset), unrelated(beforeReset)));
    check('all removed history becomes account deletion markers', await eventually(async () => (await Promise.all([...removed, ['session', 'ssAfterBackup'], ['session', 'ssDuringConfirm']].map(([kind, id]) => record(kind, id)))).every(r => r?.deleted)));
    await phone.returnToApp();
    check('the second device receives all deletions and fresh schedules', await phone.until(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); return !s.study.sessions.length && !s.study.reviews.length && !s.arabic.attempts.length && !s.arabic.lessons?.length && !s.cybersecurity.attempts.length && s.arabic.cards[0]?.review.reps === 0; })()`));
    check('the second device keeps separate notes and course content', (await phone.data()).notes.items.some(n => n.id === 'ntReset') && (await phone.data()).study.stages[0].courses[0].modules[0].sections[0].tasks[0].note === 'Keep this course note');
    await synced(mac); await synced(phone);

    await mac.send('DOM.enable');
    const { root } = await mac.send('DOM.getDocument');
    const { nodeId } = await mac.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#importFile' });
    await mac.send('DOM.setFileInputFiles', { nodeId, files: [restore.file] });
    if (!await mac.until(`!!document.querySelector('dialog[open]')`)) throw Error('Backup import confirmation absent');
    await mac.answer(true);
    check('the downloaded backup restores the original Study and attempt content through Import', await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).study.sessions.length === 3`) && eq((await mac.data()).study, restore.backup.data.study) && eq((await mac.data()).arabic, restore.backup.data.arabic) && eq((await mac.data()).cybersecurity, restore.backup.data.cybersecurity));
    check('restored history replaces account deletion markers', await eventually(async () => (await Promise.all(removed.map(([kind, id]) => record(kind, id)))).every(r => r && !r.deleted)));
    await phone.returnToApp();
    check('restored learning records and schedules reach the second device', await phone.until(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); return s.study.sessions.length === 3 && s.study.reviews.some(r => r.id === 'rvReset') && s.arabic.attempts.some(a => a.id === 'aaReset') && s.cybersecurity.attempts.some(a => a.id === 'caReset') && s.arabic.cards[0]?.review.reps === 3; })()`));
    await mac.open(APP + '#study/settings'); await phone.returnToApp();
    check('restored progress stays after reloading without duplicate records', (await mac.data()).study.sessions.length === 3 && new Set((await phone.data()).study.sessions.map(s => s.id)).size === 3);
    const result = summary(); console.log(`\n${result.pass} passed, ${result.fail} failed`);
    process.exitCode = result.fail ? 1 : 0;
  } finally {
    if (server) await server.close();
    if (downloads) fs.rmSync(downloads, { recursive: true, force: true });
  }
})().then(() => process.exit(process.exitCode || 0)).catch(e => { console.log('HARNESS:', e); process.exit(2); });
