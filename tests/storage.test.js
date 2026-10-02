const T = require('./cdp.js');
const { ev, click, exists, text, check, sleep } = T;
const KEY = 'myday.data.v4';
const D = () => ev(`JSON.parse(localStorage.getItem('${KEY}'))`);
// Writes storage directly, the way another tab would — without this page hearing about it.
const otherTabWrites = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const go = async (hash, h = 9) => { T.setUrl('index.html#' + hash); await T.openAt(2026, 11, 2, h); };
(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });

  console.log('\n[60] One copy never saves over another tab\'s newer data');
  await go('study'); await ev('localStorage.clear()'); await go('study');
  await click('[data-action=s-setup][data-with="1"]'); await sleep(200);
  await otherTabWrites(`s => { s.study.stages[0].title = 'Renamed in another tab'; s.lists.admin.push({ id: 'a9', title: 'Post office', minutes: 15 }); }`);
  await ev(`location.hash = '#today'`); await sleep(250);
  await click('[data-action=skip]'); await sleep(300); // this copy still holds the old data
  let s = await D();
  check('the other tab\'s changes are kept (not overwritten)', s.study.stages[0].title === 'Renamed in another tab' && s.lists.admin.some(x => x.id === 'a9'));
  check('…this copy\'s change is not written over it', !s.days['2026-11-02']);
  check('…and it says so, kindly', (await text('#toast')).includes("wasn't saved") && (await text('#toast')).includes('please try it again'));
  await ev(`location.hash = '#study/roadmap'`); await sleep(250);
  check('this copy now shows the newer data', (await text('#app')).includes('Renamed in another tab'));
  await ev(`location.hash = '#today'`); await sleep(250);
  await click('[data-action=skip]'); await sleep(300);
  s = await D();
  check('trying again works, keeping both', !!s.days['2026-11-02'] && s.days['2026-11-02'].rest && s.study.stages[0].title === 'Renamed in another tab');

  console.log('\n[61] Copies keep each other up to date');
  await ev('localStorage.clear()'); await go('today');
  await ev(`(() => { const f = document.createElement('iframe'); f.id = 'b'; f.src = location.href.split('#')[0] + '#study'; f.style.cssText = 'width:400px;height:600px'; document.body.appendChild(f); })()`);
  await sleep(1200);
  await ev(`frames[0].document.querySelector('[data-action=s-setup][data-with="1"]').click()`); await sleep(400);
  check('when another tab saves, this one updates by itself', (await text('#toast')).includes('Updated with changes from another tab'));
  await click('[data-action=skip]'); await sleep(300);
  s = await D();
  check('…so its next save keeps the other tab\'s work (roadmap + rest day)', s.study.stages.length === 4 && !!s.days['2026-11-02']);
  await ev(`document.getElementById('b').remove()`);
  await otherTabWrites(`s => { s.lists.admin.push({ id: 'a8', title: 'Bank', minutes: 10 }); }`);
  await ev(`document.dispatchEvent(new Event('visibilitychange'))`); await sleep(250);
  await click('[data-action=edit]'); await sleep(200);
  check('coming back to a tab also picks up newer data', (await ev(`[...document.querySelectorAll('.edit-row input.t')].some(i => i.value === 'Bank')`)));
  await click('[data-action=back]'); await sleep(150);

  console.log('\n[62] Data from a newer version of MyDay is never overwritten');
  await otherTabWrites(`s => { s.schemaVersion = 5; s.newThing = 1; }`);
  await ev(`location.hash = '#study'`); await sleep(200);
  await ev(`(() => { const b = document.querySelector('[data-action=s-setup]') || document.querySelector('[data-action=s-focus]') || document.querySelector('#nav a'); b.click(); })()`);
  await ev(`location.hash = '#today'`); await sleep(200);
  await ev(`document.dispatchEvent(new Event('visibilitychange'))`); await sleep(250);
  s = await D();
  check('the newer save is left exactly as it was', s.schemaVersion === 5 && s.newThing === 1);
  check('…and this copy explains and stops saving', (await text('#app')).includes('saved by a newer version of MyDay in another tab'));

  console.log('\n[63] Normal use in one tab is unaffected');
  await ev('localStorage.clear()'); await go('today');
  await T.setEnergy(4); await click('[data-action=build]'); await sleep(150); await click('[data-action=prop-apply]'); await sleep(200);
  await ev(`document.querySelector('#app .task input').click()`); await sleep(200);
  await click('[data-action=edit]'); await click('[data-action=add][data-cat=admin]'); await sleep(150); await click('[data-action=back]'); await sleep(150);
  s = await D();
  check('several saves in a row all land, with no "another tab" message', s.days['2026-11-02'].tasks.some(t => t.done) && s.lists.admin.length === 5 && !(await text('#toast')).includes('another tab'));
  await go('today', 10);
  check('…and are still there after a reload', (await D()).days['2026-11-02'].tasks.some(t => t.done) && (await ev(`document.querySelectorAll('#app .task input:checked').length`)) === 1);

  console.log('\n[64] Two tabs save at the same moment (localStorage has no locking)');
  // Copy B checks the saved data, then its write is held back until copy A has also checked and written.
  await ev('localStorage.clear()'); await go('today');
  await ev(`(() => { const f = document.createElement('iframe'); f.id = 'b'; f.src = location.href.split('#')[0] + '#today'; document.body.appendChild(f); })()`);
  await sleep(1200);
  await ev(`(() => { const st = frames[0].localStorage, real = frames[0].Storage.prototype.setItem; window.__releaseB = null;
    frames[0].Storage.prototype.setItem = function (k, v) { if (k === '${KEY}' && !window.__releaseB) { window.__releaseB = () => real.call(st, k, v); return; } return real.call(this, k, v); }; })()`);
  await ev(`frames[0].document.querySelector('[data-action=edit]').click()`); await sleep(150);
  await ev(`frames[0].document.querySelector('[data-action=add][data-cat=admin]').click()`); await sleep(150);
  await click('[data-action=edit]'); await sleep(150);
  await click('[data-action=add][data-cat=health]'); await sleep(150);
  check('A\'s change is saved first', (await D()).lists.health.length === 4);
  await ev('window.__releaseB()'); await sleep(400);
  s = await D();
  check('B\'s delayed write still replaces it — this cannot be prevented with localStorage', s.lists.health.length === 3 && s.lists.admin.length === 5);
  check('…but it is never silent: A says its last change was replaced', (await text('#toast')).includes('Another tab replaced your last change here'));
  check('…and A now shows the data that was actually kept (3 health, 5 admin tasks)', (await ev(`document.querySelectorAll('.edit-row[data-cat=health]').length`)) === 3 && (await ev(`document.querySelectorAll('.edit-row[data-cat=admin]').length`)) === 5);
  await ev(`document.getElementById('b').remove()`);
  await click('[data-action=back]'); await sleep(150);

  console.log('\n[65] Saved fields this version does not know about');
  await ev('localStorage.clear()'); await go('today');
  await otherTabWrites(`s => { s.futureSection = { notes: ['kept'] }; }`);
  await go('today', 10);
  await click('[data-action=skip]'); await sleep(200);
  s = await D();
  check('an unknown top-level section is kept exactly when MyDay saves', s.futureSection && s.futureSection.notes[0] === 'kept' && !!s.days['2026-11-02']);
  for (const f of require('fs').readdirSync(T.S + '/dl')) require('fs').unlinkSync(T.S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1200);
  const exp = JSON.parse(require('fs').readFileSync(T.S + '/dl/myday-export-2026-11-02.json', 'utf8'));
  check('…and it is included in exports', exp.data.futureSection && exp.data.futureSection.notes[0] === 'kept');
  await ev(`localStorage.setItem('${KEY}', localStorage.getItem('${KEY}').replace('{', '{"__proto__":{"polluted":true},'))`);
  check('(test setup: the saved text now has a "__proto__" key)', (await ev(`localStorage.getItem('${KEY}')`)).includes('"__proto__"'));
  await go('today', 11);
  await click('[data-action=edit]'); await click('[data-action=add][data-cat=admin]'); await sleep(150); await click('[data-action=back]'); await sleep(150);
  check('a "__proto__" key is not copied: nothing is polluted and it is not saved back', !(await ev('({}).polluted')) && !(await ev(`localStorage.getItem('${KEY}')`)).includes('__proto__') && (await D()).lists.admin.length === 5);

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
