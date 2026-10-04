// The final migration checks for the NEW app (app/, built into app/dist), across every section:
// - the shared controls (task lists, export/import, animations, theme, the storage note) on every section;
// - a representative backup with records from every section survives import → export → import exactly,
//   and the current MyDay (index.html, served beside it) opens it and the new app reopens what it saved;
// - both apps save the same messy, every-section data identically (unknown parts are kept);
// - unreadable data is never left out silently, and blocked storage says so;
// - Ideas (only a placeholder in the current MyDay) and any unknown sections are kept exactly;
// - navigation and deep links, keyboard access, phone layout, all three themes, persistence after reload.
// - data saved by the release published before the new app (tests/fixtures/myday-release-2026-10-02) opens
//   in the new app unchanged, and that release can still open what the new app saves (going back).
// Older backups (v1, v2, v3), corrupted saves and newer/older-version data are checked in app-today [9]-[10]
// and app-storage [1]-[4].
const fs = require('fs');
const T = require('./cdp.js');
const noSaves = t => { const o = typeof t === 'string' ? JSON.parse(t) : JSON.parse(JSON.stringify(t)); delete o.saves; return JSON.stringify(o); };
const { openAt, ev, click, exists, text, setFile, check, sleep, send, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const D = () => ev(`JSON.parse(localStorage.getItem('${KEY}'))`);
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const go = async (hash, y = 2026, m = 11, d = 2, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const nav = async hash => { await ev(`location.hash = ${JSON.stringify(hash)}`); await sleep(250); };
const texts = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(e => e.textContent.trim())`);
const setVal = (sel, v, evt = 'change') => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(String(v))});
  el.dispatchEvent(new Event('input', { bubbles: true })); if (${JSON.stringify(evt)} === 'change') el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const answer = async yes => { await sleep(150); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(200); };
const setTZ = async tz => { await send('Emulation.setTimezoneOverride', { timezoneId: '' }).catch(() => {}); await send('Emulation.setTimezoneOverride', { timezoneId: tz }); };
// A real key press (trusted, as from a keyboard).
const KEYS = { Tab: 9, Enter: 13, Escape: 27, ' ': 32 };
async function press(key, shift = false) {
  const base = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: KEYS[key], nativeVirtualKeyCode: KEYS[key], modifiers: shift ? 8 : 0 };
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown' }, base, key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}));
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base));
  await sleep(60);
}
const focused = () => ev(`(() => { const a = document.activeElement; return a ? (a.id || a.getAttribute('data-action') || a.getAttribute('href') || a.tagName) : ''; })()`);
const contrastOf = sel => ev(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 0;
  const rgb = c => c.match(/[\\d.]+/g).map(Number);
  const lum = c => { const [r, g, b] = rgb(c).slice(0, 3).map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  let bg = null; for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; const a = rgb(c); if (a.length < 4 || a[3] > 0.9) { bg = c; break; } }
  if (!bg) bg = getComputedStyle(document.body).backgroundColor;
  const [x, y] = [lum(getComputedStyle(el).color), lum(bg)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); })()`);
const clearDl = () => { for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f); };
const exportNow = async () => { clearDl(); await click('[data-action=export]'); await sleep(1500); return JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-11-02.json', 'utf8')); };
const importFile = async path => { await setFile(path); await sleep(200); await answer(true); };
// JSON with keys in a fixed order (the two apps may write keys in a different order).
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, key) => { o[key] = x[key]; return o; }, {}) : x));
const finish = () => {
  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const s = T.summary();
  console.log(`\n${s.pass} passed, ${s.fail} failed`);
  process.exit(s.fail ? 1 : 0);
};

// ---------- A representative record set: something in every section ----------
const ROTA = { patterns: [{ id: 'p1', effectiveFrom: null, anchor: '2026-11-02', cycle: ['day', 'day', 'day', 'day', 'off', 'off', 'off', 'off', 'night', 'night', 'night', 'night', 'off', 'off', 'off', 'off'], times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 30, night: 30 } }],
  overrides: { '2026-11-03': { planned: { type: 'off' }, actual: { status: 'annual_leave' } } }, entries: [{ id: 'o1', kind: 'overtime', start: '2026-11-07T10:00', end: '2026-11-07T14:00', note: 'cover' }], colours: { day: '#2f8f4e' } };
const STUDY = { stages: [{ id: 'sgF', title: 'Foundations', courses: [{ id: 'coP', title: 'Pre-Security', url: 'https://tryhackme.com/', minutes: 30, listId: 'l1', archived: false, modules: [{ id: 'mdN', title: 'Networking', sections: [{ id: 'scW', title: 'The web', tasks: [{ id: 'tkD', title: 'DNS in detail', minutes: 40, url: '', kind: 'learn', note: '', done: true, doneOn: '2026-10-30' }] }] }] }] }],
  concepts: [{ id: 'cpW', title: 'What DNS does', taskIds: ['tkD'], createdOn: '2026-10-30', kind: 'written', prompt: 'What does DNS do?', answer: 'Names to addresses', explanation: '', choices: [], correct: null, hint: '', source: '', note: 'Net/DNS', review: { reps: 1, interval: 4, lapses: 0, due: '2026-11-03' } }],
  sessions: [{ id: 's1', courseId: 'coP', taskId: 'tkD', title: 'Pre-Security · DNS in detail', date: '2026-10-30', startedAt: '2026-10-30T09:00', plannedMin: 30, short: false, status: 'done', runningSince: null, activeMs: 1800000, endedAt: '2026-10-30T09:30', checkin: { conceptIds: ['cpW'], clarity: 'partly', takeaway: 'DNS maps names', question: '', note: '' }, taskDone: true, todayUid: null }],
  reviews: [{ id: 'r1', conceptId: 'cpW', title: 'What DNS does', date: '2026-10-30', at: '2026-10-30T12:00', kind: 'written', outcome: 'right', graded: 'self', chosen: null, support: 'own', rating: 'good', gap: 4, due: '2026-11-03' }], settings: { vault: 'Notes', showClock: true } };
const set = more => Object.assign({ reps: null, weight: null, loadMode: 'none', load: null, durationMin: null, distanceKm: null, done: true }, more);
const WORKOUT = { exercises: [{ id: 'xB', name: 'Bench press', type: 'strength', archived: false }, { id: 'xP', name: 'Pull-ups', type: 'bodyweight', archived: false }],
  templates: [{ id: 'tU', name: 'Upper body', minutes: 45, archived: false, items: [{ id: 'i1', exerciseId: 'xB', sets: 3, restSec: 90, reps: 8, weight: 40, loadMode: 'none', load: null, durationMin: null, distanceKm: null }, { id: 'i2', exerciseId: 'xP', sets: 2, restSec: 90, reps: 6, weight: null, loadMode: 'assisted', load: 20, durationMin: null, distanceKm: null }] }],
  schedule: { mode: 'weekdays', weekdays: { 4: 'tU' }, sequence: [], next: 0, restDays: 1, since: '2026-10-01' }, planned: { '2026-11-05': { templateId: 'tU', time: '19:30', status: 'planned', source: 'proposal' } },
  sessions: [{ id: 'w1', date: '2026-10-29', templateId: 'tU', templateName: 'Upper body', startedAt: '2026-10-29T18:00', finishedAt: '2026-10-29T18:45', status: 'short', plannedDate: '2026-10-29', editedAt: null,
    exercises: [{ key: 'k1', exerciseId: 'xB', name: 'Bench press', type: 'strength', plan: { sets: 3, restSec: 90, reps: 8, weight: 40, loadMode: 'none', load: null, durationMin: null, distanceKm: null }, prefill: 'plan', sets: [set({ reps: 8, weight: 42.5 }), set({ reps: 8, weight: 40, done: false })] }] }],
  activeId: null, restTimer: { enabled: true, seconds: 90 }, rest: null };
const FOOD = { prefs: { exclude: ['pork'], dislikes: ['olives'], maxMinutes: 40, batchOnly: false },
  recipes: { rOwn: { id: 'rOwn', source: 'manual', title: 'Lentil soup', sourceUrl: '', sourceName: 'Gran', mealDbUrl: '', video: '', thumb: '', category: '', area: '', tags: [], ingredients: [{ name: 'red lentils', measure: '250 g' }, { name: 'stock', measure: '1 l' }], instructions: 'Simmer for 20 minutes.\nBlend.', servings: 4, servingsSource: 'recipe', prepMin: 10, cookMin: 25, effort: 'easy', batch: true, nutrition: { kcal: 310, protein: 18, carbs: null, fat: 5 }, nutritionSource: 'user', savedAt: '2026-10-20T09:00' } },
  favourites: ['rOwn'], want: [{ id: 'wa1', recipeId: 'rOwn', servings: 4, addedOn: '2026-11-01' }], cooked: [{ id: 'c1', recipeId: 'rOwn', title: 'Lentil soup', date: '2026-10-25', servings: 4 }],
  shopping: [{ id: 'sh1', name: 'red lentils', family: 'g', amount: 250, unit: '', text: '', category: 'Cupboard', checked: false, recipes: ['Lentil soup'], manual: false }, { id: 'sh2', name: 'garlic', family: null, amount: null, unit: '', text: '1-2 cloves', category: 'Fruit & veg', checked: true, recipes: [], manual: true }],
  cooking: { recipeId: 'rOwn', step: 1, servings: 4, startedAt: '2026-11-02T08:00', timer: null } };
const TODAY_PARTS = `s.lists.admin.push({ id: 'a9', title: 'Post office', minutes: 15 });
  s.days['2026-11-01'] = { energy: 3, rest: false, builtAt: '2026-11-01T08:00', checkedIn: true, tasks: [{ uid: 'u1', taskId: 'l1', category: 'learning', title: 'Learning', minutes: 30, baseMinutes: 30, done: true, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null }] };
  s.queue = [{ qid: 'q1', taskId: 'a1', category: 'admin', title: 'Laundry', minutes: 15, fromDate: '2026-11-01', sourceUid: 'u2' }];
  s.commitments = [{ id: 'c1', kind: 'appointment', title: 'Dentist', start: '2026-11-04T10:00', end: '2026-11-04T10:30', prepMinutes: 15 }];
  s.context['2026-11-02'] = { energy: 4, sleep: { start: '2026-11-01T23:00', end: '2026-11-02T07:00', estimatedHours: null } };
  s.settings.earliestTime = '07:30'; s.settings.motion = 'off'; s.celebratedOn = '2026-11-01';
  s.rota = ${JSON.stringify(ROTA)}; s.pay.hourlyRate = 15.5; s.pay.taxCode = '1257L'; s.bankHolidays.region = 'scotland';
  s.study = ${JSON.stringify(STUDY)}; s.health = { workout: ${JSON.stringify(WORKOUT)}, food: ${JSON.stringify(FOOD)}, futureHealthPart: { kept: true } };
  s.finance = { ratesSetOn: '2026-10-01', debts: [{ id: 'd1', direction: 'owe', person: 'Sam', amount: 40, note: 'tickets', since: '2026-10-20' }], expenses: [{ id: 'e1', name: 'Rent', amount: 650 }] };
  s.ideas = { items: [{ id: 'i1', text: 'An idea saved by a future MyDay' }] }; s.futureSection = { notes: ['kept'] };`;

(async () => {
  await T.connect();
  await setTZ('Europe/London');

  // ------------------------------------------------------------------
  console.log('\n[60] Shared controls on every section');
  await go('today'); await reset(); await go('today');
  for (const sec of ['today', 'calendar', 'finance', 'health', 'study']) {
    await nav(sec);
    const ok = (await exists('#footer [data-action=export]')) && (await exists('#footer [data-action=import]')) && (await exists('#footer [data-action=edit]')) && (await exists('#footer [data-action=motion]')) && (await text('#footer .storage-note')) === 'Saved only in this browser.';
    check(`#${sec}: Edit task lists, Export, Import, Animations and the storage note are at the bottom`, ok);
  }
  await nav('calendar'); await click('#footer [data-action=edit]'); await sleep(300);
  check('Edit task lists from another section opens Today\'s list editor', (await ev('location.hash')) === '#today' && (await text('#app')).includes('Your task lists') && (await exists('[data-action=add][data-cat=admin]')), await ev('location.hash'));
  await click('[data-action=back]'); await sleep(150);
  await nav('study'); await click('#footer [data-action=motion]'); await sleep(150);
  check('Animations can be switched from any section (saved)', (await D()).settings.motion === 'off' && (await text('#footer [data-action=motion]')).startsWith('Animations: Off'));
  await click('#footer [data-action=motion]'); await sleep(150);
  const themes = [];
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(150); themes.push((await D()).settings.theme); }
  check('the theme button goes through all three themes, and each is saved', eq([...themes].sort(), ['auto', 'dark', 'light']), themes);
  await go('study', 2026, 11, 2, 9, 5);
  check('…and the theme is applied straight away after a reload (no flash)', (await ev('document.documentElement.dataset.theme')) === themes[2]);

  // ------------------------------------------------------------------
  console.log('\n[61] A representative backup with every section: import → export → import');
  await go('today'); await reset(); await go('today');
  await editStorage(`s => { ${TODAY_PARTS} }`);
  await go('today', 2026, 11, 2, 9, 1);
  await click('#themeBtn'); await sleep(150); await click('#themeBtn'); await sleep(150); await click('#themeBtn'); await sleep(150); // saved once by the new app
  const B = await exportNow();
  fs.writeFileSync(S + '/representative.json', JSON.stringify(B));
  const secs = ['lists', 'queue', 'days', 'nudge', 'settings', 'commitments', 'context', 'rota', 'pay', 'bankHolidays', 'health', 'study', 'finance', 'ideas', 'futureSection'];
  check('the backup has every section, with its records', secs.every(k => k in B.data) && B.data.days['2026-11-01'].tasks.length === 1 && B.data.queue.length === 1 && B.data.commitments.length === 1 && B.data.rota.entries.length === 1 && B.data.study.reviews.length === 1 && B.data.health.workout.sessions.length === 1 && B.data.health.food.shopping.length === 2 && B.data.ideas.items.length === 1, secs.filter(k => !(k in B.data)));
  check('…including unknown parts (ideas, a future section, an unknown part of Health)', eq(B.data.ideas, { items: [{ id: 'i1', text: 'An idea saved by a future MyDay' }] }) && eq(B.data.futureSection, { notes: ['kept'] }) && eq(B.data.health.futureHealthPart, { kept: true }));
  await reset(); await go('today', 2026, 11, 2, 10);
  await importFile(S + '/representative.json');
  check('importing it into an empty browser restores every record exactly', noSaves(await D()) === noSaves(B.data));
  const B2 = await exportNow();
  check('exporting again gives the same records', noSaves(B2.data) === noSaves(B.data) && B2.schemaVersion === 4);
  await importFile(S + '/representative.json');
  check('importing over existing data replaces it exactly (asked first)', noSaves(await D()) === noSaves(B.data));
  // Every section shows its records in the new app…
  await go('calendar', 2026, 11, 2, 10, 5); const calOk = (await text('#app')).includes('Day');
  await go('finance', 2026, 11, 2, 10, 5); const payOk = (await text('#rates summary')).includes('£15.50 an hour') && (await text('#owedCard')).includes('Sam') && (await text('#expensesCard')).includes('£650.00 a month');
  await go('study', 2026, 11, 2, 10, 5); const studyOk = (await text('#app')).includes('Pre-Security');
  await go('health/workout', 2026, 11, 2, 10, 5); const wOk = (await text('#app')).includes('Upper body');
  await go('health/food', 2026, 11, 2, 10, 5); const fOk = (await text('.next-card')).includes('Lentil soup');
  check('…and every section shows them (Calendar, Finance, Study, Workout, Food)', calOk && payOk && studyOk && wOk && fOk, [calOk, payOk, studyOk, wOk, fOk]);
  // …and the current MyDay opens the same saved data, saves it, and the new app reopens it.
  // (Opening Calendar and Pay may have added the bank holiday list from gov.uk, so compare with the data as it is now.)
  const beforeLive = await D();
  T.setUrl('index.html#health/food'); await openAt(2026, 11, 2, 11);
  check('the current MyDay opens it (cooking to resume, same recipes)', (await text('.next-card')).includes('Lentil soup'));
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(200); }
  const afterLive = await D();
  const strip = o => { const c = JSON.parse(noSaves(o)); delete c.health.futureHealthPart; return canon(c); };
  const diffs = (a, b, path = '') => { if (JSON.stringify(a) === JSON.stringify(b)) return []; if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return [path + ': ' + JSON.stringify(a).slice(0, 80) + ' vs ' + JSON.stringify(b).slice(0, 80)]; return [...new Set(Object.keys(a).concat(Object.keys(b)))].flatMap(k => diffs(a[k], b[k], path + '.' + k)); };
  check('…saves it with every record the new app wrote (only the unknown part of Health is left out by the current MyDay)', strip(afterLive) === strip(beforeLive) && !('futureHealthPart' in afterLive.health), diffs(JSON.parse(strip(afterLive)), JSON.parse(strip(beforeLive))).slice(0, 6));
  check('…and keeps ideas and future sections', eq(afterLive.ideas, B.data.ideas) && eq(afterLive.futureSection, B.data.futureSection));
  await go('study', 2026, 11, 2, 12);
  check('the new app reopens what the current MyDay saved', (await text('#app')).includes('Pre-Security') && (await D()).health.food.recipes.rOwn.title === 'Lentil soup');

  // ------------------------------------------------------------------
  console.log('\n[62] Both apps save the same messy data the same way (every section)');
  const MESSY = `s => { ${TODAY_PARTS}
    s.lists.health.push({ id: 'h9', title: '' }, 'junk'); s.queue.push({ qid: 'q2' }); s.commitments.push({ id: 'c2', kind: 'appointment', title: 'No times' });
    s.days['bad-date'] = { tasks: [] }; s.study.sessions.push({ id: 's1', date: 'nope' }); s.health.workout.templates.push({ id: 'tX' });
    s.health.food.shopping.push({ name: '' }); s.rota.entries.push({ id: 'o2', kind: 'overtime', start: 'later' }); s.settings.gapMinutes = 9999; }`;
  async function seedAndSave(url) {
    await go('today', 2026, 11, 2, 9, 0, url); await reset(); await go('today', 2026, 11, 2, 9, 0, url);
    await editStorage(MESSY);
    await go('today', 2026, 11, 2, 9, 0, url);
    for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); }
    return D();
  }
  const liveAll = await seedAndSave('index.html'), newAll = await seedAndSave(APP);
  const seedIds = new Set();
  JSON.stringify(liveAll).replace(/"(id|uid|qid|key)":"([^"]*)"/g, (m, k, v) => { seedIds.add(v); return m; });
  const mask = o => { const c = JSON.parse(noSaves(o)); delete c.health.futureHealthPart; return canon(JSON.parse(JSON.stringify(c, (k, v) => (['id', 'uid', 'qid', 'key'].includes(k) && typeof v === 'string' && /^[a-z]{1,3}[0-9a-z]{10,}$/.test(v) ? 'NEW' : v)))); };
  // The new app adds Notes and Goal (1.3.0), which the current MyDay keeps unread: compared on their own, below.
  // …and (from 1.11.0) its default theme is light, where the current MyDay's is dark: compared on its own too.
  const newCmp = { ...newAll, settings: { ...newAll.settings, theme: liveAll.settings.theme } }; delete newCmp.notes; delete newCmp.fitness; delete newCmp.tasks; delete newCmp.patterns;
  check('the whole saved file matches the current MyDay\'s, section by section', !('notes' in liveAll) && !('fitness' in liveAll) && !('tasks' in liveAll) && !('patterns' in liveAll) && mask(liveAll) === mask(newCmp), (() => { const a = JSON.parse(mask(liveAll)), b = JSON.parse(mask(newCmp)); return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])); })());
  check('…except the default theme, on purpose: light in the new app (its warm look), dark in the current MyDay', newAll.settings.theme === 'light' && liveAll.settings.theme === 'dark', [newAll.settings.theme, liveAll.settings.theme]);
  check('…the new app adds Notes: the starter categories and no notes', newAll.notes.items.length === 0 && newAll.notes.categories.map(c => c.name).join() === 'Lifestyle,Business ideas,Health & fitness,Money,Study & career,Personal');
  check('…and Goal: no goal yet, kg and cm', eq(newAll.fitness, { units: 'metric', answers: null, setOn: null }));
  check('…and Tasks: no lists and no tasks', eq(newAll.tasks, { lists: [], items: [] }));
  check('…and What MyDay has noticed: no preferences and no answers', eq(newAll.patterns, { prefs: { maxMinutes: { learning: null, admin: null, health: null }, maxTasks: null }, answers: {} }));
  check('…while the new app also keeps the unknown part of Health', eq(newAll.health.futureHealthPart, { kept: true }));

  // ------------------------------------------------------------------
  console.log('\n[63] Unreadable or unavailable data is never replaced silently');
  await go('today'); await reset(); await go('today');
  await editStorage(`s => { ${TODAY_PARTS} s.study = 'damaged into text'; s.lists.learning = 'also damaged'; s.commitments.push({ id: 'c3', kind: 'appointment', title: 'No times' }); }`);
  const rawBefore = await ev(`localStorage.getItem('${KEY}')`);
  await go('today', 2026, 11, 2, 9, 30);
  check('when some saved entries can\'t be read, MyDay says so, with how many', (await exists('.load-issue')) && (await text('.load-issue h2')) === "3 saved entries couldn't be read" && (await text('.load-issue')).includes("they'll be gone from this browser the next time MyDay saves"), await text('.load-issue'));
  check('…and nothing has been saved over them yet', (await ev(`localStorage.getItem('${KEY}')`)) === rawBefore);
  await nav('calendar');
  check('…the message stays on every section until you close it', await exists('.load-issue'));
  clearDl(); await click('[data-action=load-issue-download]'); await sleep(1200);
  const copyName = fs.readdirSync(S + '/dl').find(f => f.startsWith('myday-saved-copy-'));
  check('"Download a copy" saves the data exactly as it was, including what couldn\'t be read', !!copyName && fs.readFileSync(S + '/dl/' + copyName, 'utf8') === rawBefore, copyName);
  await click('[data-action=load-issue-dismiss]'); await sleep(150);
  check('…and OK closes the message', !(await exists('.load-issue')));
  await go('today', 2026, 11, 2, 9, 31);
  await editStorage(`s => { s.study = 7; }`);
  await go('today', 2026, 11, 2, 9, 32);
  check('a single damaged section is reported too', (await text('.load-issue h2')) === "1 saved entry couldn't be read");
  // Blocked storage
  await reset();
  T.setUrl(APP + '#today');
  const blocker = (await send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });` })).identifier;
  await openAt(2026, 11, 2, 9);
  check('blocked storage: MyDay still works and says changes won\'t be kept', (await text('#toast')).includes("isn't letting MyDay save") && (await text('#footer .storage-note')) === 'Saving is unavailable in this browser.' && (await exists('#energy')));
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocker });

  // ------------------------------------------------------------------
  console.log('\n[64] Ideas (a placeholder in the current MyDay) and unknown sections');
  await go('today'); await reset(); await go('today');
  check('there is no Ideas section in either app\'s navigation', !(await texts('#nav .nav-item')).some(t => /idea/i.test(t)));
  await go('ideas');
  check('#ideas opens Today (nothing unfinished looks like a working control)', (await text('#nav [aria-current=page]')).trim() === 'Today');
  await editStorage(`s => { s.ideas = { items: [{ id: 'i1', text: 'From a future MyDay', status: 'later' }] }; }`);
  await go('today', 2026, 11, 2, 9, 1);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(150); }
  check('an "ideas" record is kept exactly through saves', eq((await D()).ideas, { items: [{ id: 'i1', text: 'From a future MyDay', status: 'later' }] }));

  // ------------------------------------------------------------------
  console.log('\n[65] Navigation and deep links');
  await go('today'); await reset(); await go('today');
  await editStorage(`s => { ${TODAY_PARTS} }`);
  await go('today', 2026, 11, 2, 9, 1);
  for (const sec of ['calendar', 'finance', 'health', 'study', 'today']) {
    await click(`#nav a[href="#${sec}"]`); await sleep(250);
    check(`the navigation opens ${sec}, marked as the current page`, (await ev('location.hash')) === '#' + sec && (await text('#nav [aria-current=page]')).trim().toLowerCase() === sec);
  }
  await ev('history.back()'); await sleep(300);
  check('the browser\'s Back button returns to the previous section', (await ev('location.hash')) === '#study' && (await text('#nav [aria-current=page]')).trim() === 'Study');
  const deep = { 'calendar': '.cal-grid', 'finance': '#workPay', 'health/workout/schedule': '#schMode', 'health/food/shopping': '#shopAdd', 'health/food/cook': '#cookStep', 'study/roadmap': '[data-action=s-edit]', 'study/concepts': '[data-action=s-concept-new]', 'study/progress': '.week' };
  for (const [h, sel] of Object.entries(deep)) {
    await go(h, 2026, 11, 2, 9, 2);
    check(`a link straight to #${h} opens it after a reload`, await exists(sel));
  }

  // ------------------------------------------------------------------
  console.log('\n[66] Keyboard');
  await go('today', 2026, 11, 2, 9, 3);
  await ev('document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0)');
  const order = [];
  for (let i = 0; i < 8; i++) { await press('Tab'); order.push(await focused()); }
  check('Tab reaches the Focus mode switch, the theme button and then each section in the navigation', order[0] === 'focus-mode' && order[1] === 'themeBtn' && eq(order.slice(2, 8), ['#today', '#calendar', '#inbox', '#finance', '#health', '#study']), order);
  check('…with a visible focus outline', (await ev(`getComputedStyle(document.activeElement).outlineStyle`)) !== 'none');
  await ev(`document.querySelector('#nav a[href="#finance"]').focus()`); await press('Enter'); await sleep(250);
  check('Enter on a navigation link opens that section', (await ev('location.hash')) === '#finance');
  await ev(`document.getElementById('themeBtn').focus()`); const th0 = (await D()).settings.theme; await press('Enter'); await sleep(150);
  check('the theme button works from the keyboard', (await D()).settings.theme !== th0);
  await nav('health/food/recipe/rOwn'); await ev(`document.querySelector('[data-action=h-cook-start]').focus()`); await press(' '); await sleep(300);
  check('buttons work with the space bar too (Start cooking)', (await ev('location.hash')) === '#health/food/cook');
  await click('[data-action=h-cook-stop]'); await sleep(250);
  check('a question opens with keyboard focus inside it', (await ev(`!!document.activeElement.closest('dialog')`)));
  await press('Escape'); await sleep(200);
  check('…and Escape closes it, as "No" (still cooking)', !(await ev(`!!document.querySelector('dialog[open]')`)) && !!(await D()).health.food.cooking);
  await go('health/food/shopping', 2026, 11, 2, 9, 4);
  await ev(`document.getElementById('shopAdd').focus()`); await send('Input.insertText', { text: '2 lemons' }); await press('Enter'); await sleep(200);
  check('Enter in a box adds what you typed (shopping list)', (await D()).health.food.shopping.some(x => x.name === 'lemons'));

  // ------------------------------------------------------------------
  console.log('\n[67] Phone layout across every section');
  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 740, deviceScaleFactor: 2, mobile: true });
  const routes = ['today', 'calendar', 'finance', 'health/workout', 'health/workout/schedule', 'health/food', 'health/food/recipe/rOwn', 'health/food/shopping', 'health/food/cook', 'study', 'study/roadmap', 'study/progress'];
  const tooWide = [], tooSmall = [];
  for (const r of routes) {
    await go(r, 2026, 11, 2, 15);
    if (await ev('document.documentElement.scrollWidth > innerWidth')) tooWide.push(r);
    const small = await ev(`[...document.querySelectorAll('#footer button, #nav a')].filter(b => b.getClientRects().length && b.getBoundingClientRect().height < 44).length`);
    if (small) tooSmall.push(r);
  }
  check('a small phone (360 px wide): nothing scrolls sideways on any section', tooWide.length === 0, tooWide);
  check('…and the navigation and footer buttons are easy to tap (44 px or more)', tooSmall.length === 0, tooSmall);
  await send('Emulation.clearDeviceMetricsOverride');

  // ------------------------------------------------------------------
  console.log('\n[68] All three themes across every section');
  for (const theme of ['light', 'auto', 'dark']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    const bad = [];
    for (const r of ['today', 'calendar', 'finance', 'health/workout', 'health/food', 'study']) {
      await go(r, 2026, 11, 2, 15);
      const ok = (await ev('document.documentElement.dataset.theme')) === theme && (await contrastOf('#app h2')) >= 4.5 && (await contrastOf('#footer [data-action=export]')) >= 4.5;
      if (!ok) bad.push(r);
    }
    check(`theme "${theme}": applied on every section, headings and buttons readable`, bad.length === 0, bad);
  }
  await go('today', 2026, 11, 2, 15);
  const bgDark = await ev(`getComputedStyle(document.body).backgroundColor`);
  await editStorage(`s => { s.settings.theme = 'light'; }`); await go('today', 2026, 11, 2, 15, 1);
  check('dark and light really differ', (await ev(`getComputedStyle(document.body).backgroundColor`)) !== bgDark);

  // ------------------------------------------------------------------
  console.log('\n[69] A change in every section is still there after a reload');
  await go('today', 2026, 11, 2, 16);
  await setVal('#energy', '2'); await sleep(150); // saved when you let go of the slider
  await nav('calendar'); await setVal('#bhRegion', 'northern-ireland'); await sleep(150);
  await nav('finance'); await setVal('#rate-hourly', '16.25'); await sleep(150);
  await nav('health/workout/schedule'); await setVal('#schMode', 'sequence'); await sleep(150);
  await nav('health/food/prefs'); await setVal('#prefDis', 'olives, coriander'); await sleep(150);
  await nav('study/settings'); await setVal('#stVault', 'My Vault'); await sleep(150);
  await go('today', 2026, 11, 2, 16, 10);
  const s9 = await D();
  check('Today (energy), Calendar (bank holiday region), Finance (rate), Workout (schedule), Food (preferences) and Study (vault) all kept', s9.context['2026-11-02'].energy === 2 && s9.bankHolidays.region === 'northern-ireland' && s9.pay.hourlyRate === 16.25 && s9.health.workout.schedule.mode === 'sequence' && eq(s9.health.food.prefs.dislikes, ['olives', 'coriander']) && s9.study.settings.vault === 'My Vault',
    [s9.context['2026-11-02'] && s9.context['2026-11-02'].energy, s9.bankHolidays.region, s9.pay.hourlyRate, s9.health.workout.schedule.mode, s9.health.food.prefs.dislikes, s9.study.settings.vault]);
  await nav('finance'); const payShown = await ev(`document.getElementById('rate-hourly').value`);
  await nav('study/settings'); const vaultShown = await ev(`document.getElementById('stVault').value`);
  check('…and shown on their screens', payShown === '16.25' && vaultShown === 'My Vault');

  // ------------------------------------------------------------------
  console.log('\n[70] Data saved by the previously published release');
  const PREV = 'prev.html';
  await go('today', 2026, 11, 2, 9, 0, PREV); await reset(); await go('today', 2026, 11, 2, 9, 0, PREV);
  await editStorage(`s => { ${TODAY_PARTS} delete s.study; delete s.finance; delete s.ideas; delete s.futureSection; delete s.health.futureHealthPart; }`);
  await go('today', 2026, 11, 2, 9, 1, PREV);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); } // saved in that release's own way
  const P = await D();
  check('setup: the previous release saved its data (shifts, pay, workouts, recipes, shopping)', P.schemaVersion === 4 && P.rota.patterns.length === 1 && P.pay.hourlyRate === 15.5 && P.health.workout.templates.length === 1 && !!P.health.food.recipes.rOwn && P.health.food.shopping.length === 2 && !('study' in P));
  await go('today', 2026, 11, 2, 9, 2);
  check('the new app opens it with nothing unreadable (no notice)', !(await exists('.load-issue')) && (await exists('#energy')));
  await go('health/food', 2026, 11, 2, 9, 3); const pf = (await text('.next-card')).includes('Lentil soup');
  await go('health/workout', 2026, 11, 2, 9, 3); const pw = (await text('#app')).includes('Upper body');
  await go('finance', 2026, 11, 2, 9, 3); const pp = (await text('#rates summary')).includes('£13.85 an hour') && (await D()).pay.hourlyRate === 13.85; // first visit to Finance: your rates are saved
  await go('study', 2026, 11, 2, 9, 3); const ps = (await exists('.st-setup-row')) || (await text('#app')).includes('Set up your study roadmap');
  check('…and shows its records (Food, Workout); Finance saves your rates on its first visit; Study starts at set-up, as that release had no Study', pf && pw && pp && ps, [pf, pw, pp, ps]);
  await go('today', 2026, 11, 2, 9, 4);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); }
  const N = await D();
  // (Opening Pay may have added the bank holiday list from gov.uk; that downloaded copy isn't a record of yours.)
  const without = (o, keys) => { const c = JSON.parse(noSaves(o)); for (const k of keys) delete c[k]; delete c.bankHolidays.divisions; delete c.bankHolidays.fetchedAt; return canon(c); };
  const d70 = (a, b, path = '') => { if (JSON.stringify(a) === JSON.stringify(b)) return []; if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return [path]; return [...new Set(Object.keys(a).concat(Object.keys(b)))].flatMap(k => d70(a[k], b[k], path + '.' + k)); };
  // Opening Finance the first time saved your rates into the pay settings; everything else must be exactly as that release saved it.
  const RATES = ['hourlyRate', 'overtimeMultiplier', 'bankHolidayMultiplier', 'nightMultiplier', 'taxCode', 'niCategory', 'studentLoans', 'frequency', 'periodAnchor', 'annualLeavePaid', 'cancelledPaid', 'sickPay'];
  const payRest = o => { const c = { ...o.pay }; for (const k of RATES) delete c[k]; return JSON.stringify(c); };
  check('the new app saves every record exactly as that release had it (it adds an empty Study, Finance, Notes, Goal, Tasks and What MyDay has noticed; Finance\'s first visit saves your rates)',
    without(N, ['study', 'finance', 'notes', 'fitness', 'tasks', 'patterns', 'pay']) === without(P, ['study', 'finance', 'notes', 'fitness', 'tasks', 'patterns', 'pay']) && payRest(N) === payRest(P) && N.pay.taxCode === '1241T' && N.study.stages.length === 0 && N.finance.debts.length === 0 && N.finance.ratesSetOn === '2026-11-02' && N.notes.items.length === 0 && N.fitness.answers === null && eq(N.tasks, { lists: [], items: [] }) && eq(N.patterns.answers, {}),
    d70(JSON.parse(without(N, ['study', 'finance', 'notes', 'fitness', 'tasks', 'patterns', 'pay'])), JSON.parse(without(P, ['study', 'finance', 'notes', 'fitness', 'tasks', 'patterns', 'pay']))).slice(0, 6));
  await go('health/workout', 2026, 11, 2, 9, 5, PREV);
  check('going back: the previous release still opens what the new app saved', (await text('#app')).includes('Upper body'));
  await editStorage(`s => { s.study = { stages: [{ id: 'sg1', title: 'Foundations', courses: [] }] }; }`);
  await go('today', 2026, 11, 2, 9, 6, PREV);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); }
  check('…but it has no Study, so its next save leaves Study out (export before going back)', !('study' in (await D())));

  finish();
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
