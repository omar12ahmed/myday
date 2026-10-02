// Saving in the NEW app (app/, built into app/dist): the same checks as storage.test.js, adapted,
// plus checks that the new app and the current MyDay (index.html) share saved data safely.
const T = require('./cdp.js');
const { ev, click, exists, text, check, sleep } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const D = () => ev(`JSON.parse(localStorage.getItem('${KEY}'))`);
const raw = () => ev(`localStorage.getItem('${KEY}')`);
// Writes storage directly, the way another tab would — without this page hearing about it.
const otherTabWrites = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const go = async (h = 9, url = APP) => { T.setUrl(url); await T.openAt(2026, 11, 2, h); };
const setEnergy = v => ev(`(() => { const el = document.getElementById('energy'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '${v}'); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const addIframe = (url, id = 'b') => ev(`(() => { const f = document.createElement('iframe'); f.id = '${id}'; f.src = new URL(${JSON.stringify(url)}, location.href).href; f.style.cssText = 'width:400px;height:600px'; document.body.appendChild(f); })()`);
const inFrame = js => ev(`(() => { const w = frames[0], document = w.document; return (${js}); })()`);
const titles = () => ev(`[...document.querySelectorAll('#app .task .title')].map(e => e.textContent)`);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });

  console.log('\n[1] Nothing is saved before the saved data has been loaded and checked');
  await go(); await ev('localStorage.clear()');
  await ev(`localStorage.setItem('${KEY}', '{"schemaVersion":4, broken')`);
  await go();
  check('unreadable data: recovery screen, and the saved text is left exactly as it was', (await text('#app h2')) === "Your saved data couldn't be opened" && (await raw()) === '{"schemaVersion":4, broken');
  await ev(`localStorage.setItem('${KEY}', JSON.stringify({ schemaVersion: 9, lists: {}, days: {} }))`);
  await go();
  check('newer-version data: explained, and never overwritten', (await text('#app')).includes('saved by a newer version of MyDay') && (await D()).schemaVersion === 9);
  await ev(`localStorage.clear(); localStorage.setItem('myday.data.v3', JSON.stringify({ schemaVersion: 3, lists: {}, days: {} }))`);
  await go();
  check('older-version data only: the new app writes nothing (the current MyDay updates it)', (await raw()) === null && (await text('#app h2')) === 'Your data needs a quick update first');
  await ev('localStorage.clear()');

  console.log('\n[2] One copy never saves over another tab\'s newer data');
  await go(); await go();
  await otherTabWrites(`s => { s.lists.admin.push({ id: 'a9', title: 'Post office', minutes: 15 }); s.rota = { patterns: [], overrides: {}, entries: [], colours: { day: '#123456' } }; }`);
  await click('[data-action=skip]'); await sleep(300); // this copy still holds the old data
  let s = await D();
  check('the other tab\'s changes are kept (not overwritten)', s.lists.admin.some(x => x.id === 'a9') && s.rota.colours.day === '#123456');
  check('…this copy\'s change is not written over it', !s.days['2026-11-02']);
  check('…and it says so, kindly', (await text('#toast')).includes("wasn't saved") && (await text('#toast')).includes('please try it again'), await text('#toast'));
  await click('[data-action=edit]'); await sleep(150);
  check('this copy now shows the newer data', await ev(`[...document.querySelectorAll('.edit-row input.t')].some(i => i.value === 'Post office')`));
  await click('[data-action=back]'); await sleep(150);
  await click('[data-action=skip]'); await sleep(300);
  s = await D();
  check('trying again works, keeping both', !!s.days['2026-11-02'] && s.days['2026-11-02'].rest && s.lists.admin.some(x => x.id === 'a9'));

  console.log('\n[3] Copies keep each other up to date');
  await ev('localStorage.clear()'); await go();
  await addIframe('/' + APP + '#today'); await sleep(1500);
  await inFrame(`(() => { const el = document.getElementById('energy'); Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, '4'); el.dispatchEvent(new w.Event('input', { bubbles: true })); })()`);
  await inFrame(`document.querySelector('[data-action=build]').click()`); await sleep(150);
  await inFrame(`document.querySelector('[data-action=prop-apply]').click()`); await sleep(500);
  check('when another tab saves, this one updates by itself', (await text('#toast')).includes('Updated with changes from another tab') && (await titles()).length === 3, await text('#toast'));
  await ev(`document.querySelector('#app .task input').click()`); await sleep(300);
  s = await D();
  check('…so its next save keeps the other tab\'s work (the plan + this tick)', s.days['2026-11-02'].tasks.length === 3 && s.days['2026-11-02'].tasks[0].done);
  await ev(`document.getElementById('b').remove()`);
  await otherTabWrites(`s => { s.lists.admin.push({ id: 'a8', title: 'Bank', minutes: 10 }); }`);
  await ev(`document.dispatchEvent(new Event('visibilitychange'))`); await sleep(250);
  await click('[data-action=edit]'); await sleep(200);
  check('coming back to a tab also picks up newer data', await ev(`[...document.querySelectorAll('.edit-row input.t')].some(i => i.value === 'Bank')`));
  await otherTabWrites(`s => { s.lists.admin.push({ id: 'a7', title: 'Post', minutes: 10 }); }`);
  await ev(`document.dispatchEvent(new Event('visibilitychange'))`); await sleep(250);
  check('…and you stay where you were (still editing your lists)', (await exists('.edit-row')) && await ev(`[...document.querySelectorAll('.edit-row input.t')].some(i => i.value === 'Post')`));
  await click('[data-action=back]'); await sleep(150);

  console.log('\n[4] Data from a newer version of MyDay is never overwritten');
  await otherTabWrites(`s => { s.schemaVersion = 5; s.newThing = 1; }`);
  await ev(`document.dispatchEvent(new Event('visibilitychange'))`); await sleep(250);
  s = await D();
  check('the newer save is left exactly as it was', s.schemaVersion === 5 && s.newThing === 1);
  check('…and this copy explains and stops saving', (await text('#app')).includes('saved by a newer version of MyDay in another tab'));

  console.log('\n[5] Normal use in one tab is unaffected');
  await ev('localStorage.clear()'); await go();
  await setEnergy(4); await click('[data-action=build]'); await sleep(150); await click('[data-action=prop-apply]'); await sleep(200);
  await ev(`document.querySelector('#app .task input').click()`); await sleep(200);
  await click('[data-action=edit]'); await click('[data-action=add][data-cat=admin]'); await sleep(150); await click('[data-action=back]'); await sleep(150);
  s = await D();
  check('several saves in a row all land, with no "another tab" message', s.days['2026-11-02'].tasks.some(t => t.done) && s.lists.admin.length === 5 && !(await text('#toast')).includes('another tab'));
  check('every save is numbered and signed', s.saves.seq >= 4 && s.saves.log.length === s.saves.seq && s.saves.log.every(x => /^\d+\.\w+$/.test(x)), s.saves);
  await go(10);
  check('…and are still there after a reload', (await D()).days['2026-11-02'].tasks.some(t => t.done) && (await ev(`document.querySelectorAll('#app .task input:checked').length`)) === 1);

  console.log('\n[6] Two tabs save at the same moment (localStorage has no locking)');
  // Copy B checks the saved data, then its write is held back until copy A has also checked and written.
  await ev('localStorage.clear()'); await go();
  await addIframe('/' + APP + '#today'); await sleep(1500);
  await ev(`(() => { const st = frames[0].localStorage, real = frames[0].Storage.prototype.setItem; window.__releaseB = null;
    frames[0].Storage.prototype.setItem = function (k, v) { if (k === '${KEY}' && !window.__releaseB) { window.__releaseB = () => real.call(st, k, v); return; } return real.call(this, k, v); }; })()`);
  await inFrame(`document.querySelector('[data-action=edit]').click()`); await sleep(150);
  await inFrame(`document.querySelector('[data-action=add][data-cat=admin]').click()`); await sleep(150);
  await click('[data-action=edit]'); await sleep(150);
  await click('[data-action=add][data-cat=health]'); await sleep(150);
  check('A\'s change is saved first', (await D()).lists.health.length === 4);
  await ev('window.__releaseB()'); await sleep(500);
  s = await D();
  check('B\'s delayed write still replaces it — this cannot be prevented with localStorage', s.lists.health.length === 3 && s.lists.admin.length === 5);
  check('…but it is never silent: A says its last change was replaced', (await text('#toast')).includes('Another tab replaced your last change here'), await text('#toast'));
  check('…and A now shows the data that was actually kept (3 health, 5 admin tasks)', (await ev(`document.querySelectorAll('.edit-row[data-cat=health]').length`)) === 3 && (await ev(`document.querySelectorAll('.edit-row[data-cat=admin]').length`)) === 5);
  await ev(`document.getElementById('b').remove()`);
  await click('[data-action=back]'); await sleep(150);

  console.log('\n[7] Saved fields and sections the new app does not handle yet are kept exactly');
  await ev('localStorage.clear()'); await go();
  const sections = {
    rota: { patterns: [{ id: 'p1', effectiveFrom: null, anchor: '2026-10-01', cycle: ['day', 'off'], times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 30, night: 0 } }], overrides: { '2026-11-05': { planned: { type: 'off' } } }, entries: [], colours: { day: '#2f8f4e' } },
    pay: { hourlyRate: 12.21, taxCode: '1257L', pension: { percent: 5 } },
    bankHolidays: { region: 'scotland', fetchedAt: '2026-10-01T09:00', divisions: null },
    health: { workout: { templates: [{ id: 't1', name: 'Legs', minutes: 45 }], sessions: [], planned: {}, schedule: { mode: 'off' } }, food: { shopping: [{ id: 's1', text: 'Oats', checked: false }] } },
    study: { stages: [{ id: 'st1', title: 'Networking' }], sessions: [{ id: 'x1', date: '2026-11-01', status: 'done', todayUid: null }] },
    futureSection: { notes: ['kept'] },
  };
  await otherTabWrites(`s => Object.assign(s, ${JSON.stringify(sections)})`);
  const before = await D();
  await go(10);
  await setEnergy(3); await click('[data-action=build]'); await click('[data-action=prop-apply]'); await sleep(150);
  await ev(`document.querySelector('#app .task input').click()`); await sleep(150);
  await click('#themeBtn'); await sleep(300);
  await click('[data-action=edit]'); await click('[data-action=add][data-cat=admin]'); await sleep(150); await click('[data-action=back]'); await sleep(150);
  s = await D();
  check('health (not in the new app yet) is byte-for-byte unchanged after many saves', JSON.stringify(s.health) === JSON.stringify(before.health));
  // Rota, pay, bank holidays and Study are now handled by the new app: checked on load exactly as the
  // current MyDay does (app-calendar-pay [26] and app-study [52] compare the two side by side), so every
  // valid record is kept.
  check('study: the stage and the finished session are kept (filled out with the usual empty parts)',
    s.study.stages.length === 1 && s.study.stages[0].id === 'st1' && s.study.stages[0].title === 'Networking' && s.study.sessions.length === 1 && s.study.sessions[0].id === 'x1' && s.study.sessions[0].date === '2026-11-01' && s.study.sessions[0].status === 'done', s.study);
  check('rota: pattern, one-date change and colour kept exactly', JSON.stringify(s.rota.patterns) === JSON.stringify(before.rota.patterns) && JSON.stringify(s.rota.overrides) === JSON.stringify(before.rota.overrides) && s.rota.colours.day === '#2f8f4e');
  check('pay and bank holidays: every setting kept (rate, tax code, region, saved date)', s.pay.hourlyRate === 12.21 && s.pay.taxCode === '1257L' && s.bankHolidays.region === 'scotland' && s.bankHolidays.fetchedAt === null);
  check('an unknown top-level section is kept exactly too', JSON.stringify(s.futureSection) === JSON.stringify({ notes: ['kept'] }));
  check('a finished Study session counts towards the learning days (read, not changed)', (await text('#streak h2')).endsWith(': 2'), await text('#streak h2'));
  for (const f of require('fs').readdirSync(T.S + '/dl')) require('fs').unlinkSync(T.S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1200);
  const exp = JSON.parse(require('fs').readFileSync(T.S + '/dl/myday-export-2026-11-02.json', 'utf8'));
  check('…and all of it is included in exports', ['rota', 'pay', 'bankHolidays', 'health', 'study', 'futureSection'].every(k => JSON.stringify(exp.data[k]) === JSON.stringify(s[k])));
  await ev(`localStorage.setItem('${KEY}', localStorage.getItem('${KEY}').replace('{', '{"__proto__":{"polluted":true},'))`);
  check('(test setup: the saved text now has a "__proto__" key)', (await raw()).includes('"__proto__"'));
  await go(11);
  await click('[data-action=edit]'); await click('[data-action=add][data-cat=admin]'); await sleep(150); await click('[data-action=back]'); await sleep(150);
  check('a "__proto__" key is not copied: nothing is polluted and it is not saved back', !(await ev('({}).polluted')) && !(await raw()).includes('__proto__'));

  console.log('\n[8] The current MyDay and the new app share saved data');
  await ev('localStorage.clear()'); await go(9, APP);
  await setEnergy(5); await click('[data-action=build]'); await click('[data-action=prop-apply]'); await sleep(150);
  await ev(`document.querySelectorAll('#app .task input')[1].click()`); await sleep(150);
  const newAppTitles = await titles();
  await go(10, 'index.html');
  check('a plan built in the new app opens in the current MyDay, unchanged', eq(await ev(`[...document.querySelectorAll('#app .task .title')].map(e => e.textContent)`), newAppTitles));
  check('…including what was ticked off', eq(await ev(`[...document.querySelectorAll('#app .task input')].map(i => i.checked)`), [false, true, false]));
  await ev(`document.querySelectorAll('#app .task input')[0].click()`); await sleep(200);
  await click('[data-action=edit]'); await click('[data-action=add][data-cat=health]'); await sleep(150); await click('[data-action=back]'); await sleep(150);
  await go(11, APP);
  check('changes made in the current MyDay show in the new app', eq(await ev(`[...document.querySelectorAll('#app .task input')].map(i => i.checked)`), [true, true, false]) && (await D()).lists.health.length === 4);
  check('…and the data is still version 4, one key', (await D()).schemaVersion === 4 && eq(await ev(`Object.keys(localStorage).filter(k => k.startsWith('myday'))`), [KEY]));
  await addIframe('../../index.html#today'); await sleep(1500);
  await inFrame(`document.querySelectorAll('#app .task input')[2].click()`); await sleep(500);
  check('the current MyDay saving in another tab → the new app updates by itself', (await text('#toast')).includes('Updated with changes from another tab') && (await ev(`document.querySelectorAll('#app .task input:checked').length`)) === 3, await text('#toast'));
  await click('[data-action=edit]'); await click('[data-action=add][data-cat=learning]'); await sleep(400);
  check('…and the current MyDay picks up the new app\'s save too (no data lost either way)', (await inFrame(`document.querySelector('#toast').textContent`)).includes('another tab') && (await D()).lists.learning.length === 5);
  await ev(`document.getElementById('b').remove()`);

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
