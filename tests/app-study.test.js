// Study in the NEW app (app/, built into app/dist): the checks from study.test.js, adapted, plus what the
// move asked for: no duplicate sessions or double-counted learning days (double taps, reloads, redraws),
// phone layouts and all three themes, and side-by-side checks that the new app saves Study data and shows
// progress exactly as the current MyDay (index.html, served beside it) does for the same data.
// Differences these checks expect: confirmations are asked in the page; checkboxes and radio buttons are
// clicked (React only notices a real click); Export is on Today.
const fs = require('fs');
const T = require('./cdp.js');
// Saved data compared without the save signatures, which change on every save by design.
const noSaves = t => { const o = typeof t === 'string' ? JSON.parse(t) : JSON.parse(JSON.stringify(t)); delete o.saves; return JSON.stringify(o); };
const { openAt, ev, click, exists, text, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const STOP = Number(process.env.STOP || 99); // run sections up to this number (for testing increments)
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const D = () => ev(`JSON.parse(localStorage.getItem('${KEY}'))`);
const SD = async () => (await D()).study;
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const go = async (hash, y = 2026, m = 11, d = 2, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const nav = async hash => { await ev(`location.hash = ${JSON.stringify(hash)}`); await sleep(250); };
const texts = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(e => e.textContent.trim())`);
const flat = s => String(s).replace(/\s+/g, ''); // compared without spacing (the two apps lay out text differently)
// React only notices a value set through the browser's own setter, followed by the events typing makes.
const setVal = (sel, v, evt = 'change') => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(String(v))});
  el.dispatchEvent(new Event('input', { bubbles: true })); if (${JSON.stringify(evt)} === 'change') el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const typeActive = v => ev(`(() => { const el = document.activeElement; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(v)});
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const clickText = (sel, txt) => ev(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find(x => x.textContent.trim().startsWith(${JSON.stringify(txt)})); if (!b) throw new Error('no button ${txt.replace(/'/g, '')}'); b.click(); })()`);
const answer = async yes => { await sleep(150); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(200); };
const setTZ = async tz => { await T.send('Emulation.setTimezoneOverride', { timezoneId: '' }).catch(() => {}); await T.send('Emulation.setTimezoneOverride', { timezoneId: tz }); };
const near = (txt, min) => { const [m, sec] = String(txt).split(':').map(Number); return Math.abs(m * 60 + sec - min * 60) <= 3; }; // clock within 3 s
const allTasks = st => st.stages.flatMap(sg => sg.courses.flatMap(c => c.modules.flatMap(m => m.sections.flatMap(s => s.tasks))));
const course = (st, title) => st.stages.flatMap(sg => sg.courses).find(c => c.title === title);
const exportNow = async () => {
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1500);
  return JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-11-02.json', 'utf8'));
};
const importFile = async path => { await setFile(path); await sleep(200); await answer(true); };
// Contrast of an element's text against the first solid background behind it.
const contrastOf = sel => ev(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 0;
  const rgb = c => c.match(/[\\d.]+/g).map(Number);
  const lum = c => { const [r, g, b] = rgb(c).slice(0, 3).map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  let bg = null; for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; const a = rgb(c); if (a.length < 4 || a[3] > 0.9) { bg = c; break; } }
  if (!bg) bg = getComputedStyle(document.body).backgroundColor;
  const [x, y] = [lum(getComputedStyle(el).color), lum(bg)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); })()`);
const finish = () => {
  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const s = T.summary();
  console.log(`\n${s.pass} passed, ${s.fail} failed`);
  process.exit(s.fail ? 1 : 0);
};

// Test data shared by several sections.
const task = (id, title, minutes) => ({ id, title, minutes, url: '', kind: 'learn', note: '', done: false, doneOn: null });
const roadmap = { stages: [{ id: 'sgF', title: 'Foundations', courses: [
  { id: 'coP', title: 'TryHackMe: Pre-Security path', url: 'https://tryhackme.com/', minutes: 30, listId: 'l1', archived: false, modules: [{ id: 'mdN', title: 'Networking basics', sections: [{ id: 'scW', title: 'How the web works', tasks: [task('tkD', 'DNS in detail', 40), task('tkH', 'HTTP in detail', 30)] }] }] },
  { id: 'coE', title: 'Empty course', url: '', minutes: 25, listId: null, archived: false, modules: [] }] }],
  concepts: [{ id: 'cpR', title: 'DNS records', taskIds: ['tkD'] }] };
const learnTask = { uid: 'u1', taskId: 'l1', category: 'learning', title: 'TryHackMe: Pre-Security path — one section', minutes: 30, baseMinutes: 30, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null };
const C = (id, title, more) => Object.assign({ id, title, taskIds: [], createdOn: '2026-10-01', kind: 'written', prompt: '', answer: '', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null } }, more);
const concepts = [
  C('cpW', 'What DNS does', { taskIds: ['tkD'], prompt: 'What does DNS do?', answer: 'Translates names to IP addresses', explanation: 'Resolvers ask name servers on your behalf', hint: 'Think of a phone book', note: 'Networking/DNS basics' }),
  C('cpM', 'HTTPS port', { kind: 'choice', prompt: 'Which port does HTTPS use by default?', choices: ['80', '443', '22', ''], correct: 1, explanation: 'HTTPS uses TCP port 443.' }),
  C('cpN', 'Subnet masks'),
  C('cpOld', 'Packets', { prompt: 'What is a packet?', answer: 'A small unit of data', review: { reps: 1, interval: 4, lapses: 0, due: '2026-10-20' } }),
  C('cpM2', 'SSH port', { kind: 'choice', prompt: 'Which port does SSH use by default?', choices: ['21', '22', '25', '53'], correct: 1 }),
  C('cpA', 'IP addresses', { prompt: 'What is an IP address?', explanation: 'A number that identifies a device on a network' }),
  C('cpB', 'Routers', { prompt: 'What does a router do?', answer: 'Forwards packets between networks' }),
];
// Progress data: two courses' worth of sessions, check-ins and reviews.
const pr = JSON.parse(JSON.stringify(roadmap));
pr.stages[0].courses[0].modules[0].sections[0].tasks.push({ id: 'tkP', title: 'Build a DNS lookup script', minutes: 60, url: '', kind: 'practical', note: '', done: true, doneOn: '2026-10-30' });
pr.stages[0].courses[0].modules[0].sections[0].tasks[0].done = true; pr.stages[0].courses[0].modules[0].sections[0].tasks[0].doneOn = '2026-10-28';
const sess = (id, date, mins, clarity, extra) => Object.assign({ id, courseId: 'coP', taskId: 'tkD', title: 'TryHackMe: Pre-Security path · DNS in detail', date, startedAt: date + 'T09:00', plannedMin: 30, short: false, status: 'done', runningSince: null, activeMs: mins * 60000, endedAt: date + 'T10:00', checkin: clarity ? { conceptIds: ['cpX'], clarity, takeaway: '', question: '', note: '' } : null, taskDone: null, todayUid: null }, extra);
pr.sessions = [sess('s1', '2026-10-28', 25, 'understand'), sess('s2', '2026-10-30', 15, 'notyet', { short: true }), sess('s3', '2026-11-01', 40, null)];
const rv = (id, cid, date, outcome, support, rating) => ({ id, conceptId: cid, title: cid, date, at: date + 'T12:00', kind: 'written', outcome, graded: outcome === 'notsure' ? null : 'self', chosen: null, support, rating, gap: 1, due: '2026-11-03' });
pr.reviews = [rv('r1', 'cpX', '2026-10-21', 'right', 'own', 'good'), rv('r2', 'cpY', '2026-10-27', 'partly', 'own', 'hard'), rv('r3', 'cpX', '2026-10-27', 'right', 'hint', 'good'), rv('r4', 'cpY', '2026-11-02', 'wrong', 'own', 'again')];
pr.concepts = [C('cpX', 'Name resolution', { prompt: 'What resolves names?', answer: 'DNS', review: { reps: 2, interval: 4, lapses: 0, due: '2026-11-03' } }), C('cpY', 'TTL', { prompt: 'What is a TTL?', answer: 'How long a record may be cached', review: { reps: 2, interval: 1, lapses: 1, due: '2026-11-02' } })];

(async () => {
  await T.connect();
  await setTZ('Europe/London');

  // ------------------------------------------------------------------
  console.log('\n[40] Study tab and first-time setup');
  await go('today'); await reset(); await go('today');
  await editStorage(`s => { s.lists.admin.push({ id: 'a9', title: 'Post office', minutes: 15 }); delete s.study; }`);
  const before = await D();
  await go('study');
  check('navigation shows Study as moved to the new app (no "not in the new app yet")', eq(await texts('#nav .nav-item'), ['Today', 'Calendar', 'Inbox', 'Finance', 'Health', 'Study']) && (await text('#nav [aria-current=page]')).trim() === 'Study' && (await ev(`document.querySelector('#nav a[href="#study"]').getAttribute('aria-label')`)) === 'Study');
  const rows = await texts('.st-setup-row .check span');
  check('setup proposes your learning-list items as courses (suffix like "— one section" dropped)', eq(rows, ['TryHackMe: Pre-Security path', 'OverTheWire Bandit', 'HTB Academy: Networking module', 'HTB Academy: Web Requests module']), rows);
  const guesses = await ev(`[...document.querySelectorAll('select[data-s=setup-stage]')].map(s => s.value)`);
  check('stage guesses come from the titles (Foundations, Practical, Foundations, Web)', eq(guesses, ['Foundations', 'Practical Development', 'Foundations', 'Web']), guesses);
  check('the proposal saves nothing by itself', !('study' in (await D())));
  await setVal('select[data-s=setup-stage][data-i="1"]', 'Security Fundamentals');
  await click('input[data-s=setup-keep][data-i="2"]'); await sleep(80);
  await click('[data-action=s-setup][data-with="1"]'); await sleep(200);
  let st = await SD();
  check('creates the four starter stages, in order', eq(st.stages.map(s => s.title), ['Foundations', 'Web', 'Security Fundamentals', 'Practical Development']));
  check('…with your choices: Bandit moved to Security Fundamentals, Networking left out', eq(st.stages.map(s => s.courses.map(c => c.title)), [['TryHackMe: Pre-Security path'], ['HTB Academy: Web Requests module'], ['OverTheWire Bandit'], []]));
  check('courses keep a link to the list item and its minutes; no modules or tasks are invented', course(st, 'OverTheWire Bandit').listId === 'l2' && course(st, 'OverTheWire Bandit').minutes === 20 && allTasks(st).length === 0 && st.stages.every(s => s.courses.every(c => c.modules.length === 0)));
  check('the friendly message is shown', (await text('#toast')).includes('Your roadmap is ready'));
  const after = await D();
  const others = o => { const c = JSON.parse(JSON.stringify(o)); delete c.study; delete c.saves; return c; };
  check('every existing record is unchanged (same key, learning list untouched)', eq(others(after), others(before)) && eq(await ev(`Object.keys(localStorage).filter(k => k.startsWith('myday'))`), [KEY]));
  check('dashboard: empty course says so, with no percentage', (await text('#stFocus')).includes('TryHackMe: Pre-Security path') && (await text('#stFocus')).includes('no sections or tasks yet') && (await text('#app')).includes('No tasks added yet') && !(await text('#app')).includes('%'));

  if (STOP < 41) return finish();
  // ------------------------------------------------------------------
  console.log('\n[41] Roadmap: editing and completion');
  await nav('study/roadmap');
  await click('[data-action=s-edit]'); await sleep(150);
  const pre = course(await SD(), 'TryHackMe: Pre-Security path');
  await click(`[data-action=s-add][data-level=module][data-parent="${pre.id}"]`); await sleep(150);
  check('adding opens a name box ready to type', (await ev(`document.activeElement && document.activeElement.dataset.s`)) === 'title' && (await ev('document.activeElement.value')) === 'New module');
  await typeActive('Networking basics'); await sleep(100);
  const mod = course(await SD(), 'TryHackMe: Pre-Security path').modules[0];
  check('…and the name is saved', mod.title === 'Networking basics');
  await click(`[data-action=s-add][data-level=section][data-parent="${mod.id}"]`); await sleep(150);
  await typeActive('How the web works'); await sleep(100);
  const sec = course(await SD(), 'TryHackMe: Pre-Security path').modules[0].sections[0];
  for (const name of ['DNS in detail', 'HTTP in detail', 'Putting it together']) {
    await click(`[data-action=s-add][data-level=task][data-parent="${sec.id}"]`); await sleep(150);
    await typeActive(name); await sleep(100);
  }
  st = await SD();
  const tasks = allTasks(st);
  check('outline saved: course → module → section → 3 tasks, each with the course\'s usual minutes', eq(tasks.map(t => t.title), ['DNS in detail', 'HTTP in detail', 'Putting it together']) && tasks.every(t => t.minutes === 30 && !t.done && t.kind === 'learn'), tasks.map(t => t.title));
  await click(`[data-action=s-move][data-id="${tasks[2].id}"][data-d="-1"]`); await sleep(120);
  check('↑ reorders within the section', eq(allTasks(await SD()).map(t => t.title), ['DNS in detail', 'Putting it together', 'HTTP in detail']));
  await click(`[data-action=s-move][data-id="${tasks[2].id}"][data-d="1"]`); await sleep(120);
  await setVal(`input[data-s=title][data-id="${tasks[0].id}"]`, '   '); await sleep(100);
  check('an empty name is not saved (and the box shows the name again)', allTasks(await SD())[0].title === 'DNS in detail' && (await ev(`document.querySelector('input[data-s=title][data-id="${tasks[0].id}"]').value`)) === 'DNS in detail');
  await click('[data-action=s-edit]'); await sleep(150);
  await click(`input[data-s=task-done][data-id="${tasks[0].id}"]`); await sleep(150);
  st = await SD();
  check('ticking a task marks it complete with today\'s local date', allTasks(st)[0].done && allTasks(st)[0].doneOn === '2026-11-02');
  check('completion: 1 of 3 (33%)', (await text('#app')).includes('1 of 3 tasks complete (33%)'));
  await click(`input[data-s=task-done][data-id="${tasks[1].id}"]`); await sleep(150);
  check('completion rounds down: 2 of 3 is 66%, so 100% only ever means all done', (await text('#app')).includes('2 of 3 tasks complete (66%)'));
  check('the roadmap labels completion as not mastery', (await text('#app')).includes("it isn't a measure of mastery"));
  await nav('study');
  check('dashboard shows the next task with its path and time', (await text('#stFocus')).includes('Putting it together') && (await text('#stFocus')).includes('Foundations › Networking basics › How the web works') && (await text('#stFocus')).includes('About 30 min'));
  await nav('study/task/' + tasks[2].id);
  await setVal('#tkMin', '45'); await sleep(80); await setVal('#tkKind', 'practical'); await sleep(80); await setVal('#tkUrl', 'javascript:alert(1)'); await sleep(120);
  st = await SD();
  check('task details save; unsafe links are refused (with a message)', allTasks(st)[2].minutes === 45 && allTasks(st)[2].kind === 'practical' && allTasks(st)[2].url === '' && (await text('#toast')).includes('Links need to start with http:// or https://'));
  await setVal('#tkUrl', 'https://tryhackme.com/'); await sleep(100);
  check('…and a normal link is kept', allTasks(await SD())[2].url === 'https://tryhackme.com/');
  await setVal('#tkMin', '9999'); await sleep(100);
  check('…and minutes outside 5–600 aren\'t saved (the box shows the saved number again)', allTasks(await SD())[2].minutes === 45 && (await ev(`document.getElementById('tkMin').value`)) === '45');
  await setVal('#tkMin', '45'); await sleep(100);
  await nav('study');
  check('dashboard reflects it (45 min · Practical, link to open)', (await text('#stFocus')).includes('About 45 min · Practical') && (await exists('#stFocus a[href="https://tryhackme.com/"][target=_blank]')));
  // Second course with a task, to test focus switching and moving between sections.
  await nav('study/roadmap'); await click('[data-action=s-edit]'); await sleep(120);
  const web = course(await SD(), 'HTB Academy: Web Requests module');
  await click(`[data-action=s-add][data-level=module][data-parent="${web.id}"]`); await sleep(150);
  const wmod = course(await SD(), 'HTB Academy: Web Requests module').modules[0];
  await click(`[data-action=s-add][data-level=section][data-parent="${wmod.id}"]`); await sleep(150);
  const wsec = course(await SD(), 'HTB Academy: Web Requests module').modules[0].sections[0];
  await click(`[data-action=s-add][data-level=task][data-parent="${wsec.id}"]`); await sleep(150);
  await click('[data-action=s-edit]'); await sleep(120);
  await nav('study/task/' + tasks[1].id);
  await setVal('#tkSec', wsec.id); await sleep(120);
  st = await SD();
  check('a task can move to another section (and its course\'s completion follows it)', course(st, 'HTB Academy: Web Requests module').modules[0].sections[0].tasks.length === 2 && course(st, 'TryHackMe: Pre-Security path').modules[0].sections[0].tasks.length === 2);
  await nav('study/topic/main'); // the topic's page lists its courses (the roadmap has no topics yet: "main")
  await click(`#topicCourses [data-action=s-focus][data-id="${web.id}"]`); await sleep(250);
  check('switching focus (from the topic\'s page) puts the other course on the dashboard', (await SD()).focusCourseId === web.id && (await text('#stFocus')).includes('HTB Academy: Web Requests module') && (await text('#stFocus')).includes('New task'));
  await nav('study/course/' + web.id);
  await click('input[data-s=archived]'); await sleep(120);
  await nav('study');
  check('an archived course leaves the dashboard (focus falls back)', !(await text('#stFocus')).includes('Web Requests') && (await text('#stFocus')).includes('TryHackMe'));
  await nav('study/course/' + web.id); await click('input[data-s=archived]'); await sleep(120);
  await setVal('#coStage', (await SD()).stages[0].id); await sleep(120);
  check('a course can move to another stage', (await SD()).stages[0].courses.map(c => c.title).includes('HTB Academy: Web Requests module'));
  // Remove a section with tasks: asks first, says how many.
  await nav('study/roadmap'); await click('[data-action=s-edit]'); await sleep(120);
  await click(`[data-action=s-del][data-id="${wsec.id}"]`); await sleep(200);
  const asked = await text('#dialog-title');
  check('removing a section asks first (in the page) and says how many tasks go with it', asked.includes('and the 2 tasks in it'), asked);
  await answer(false);
  check('…Keep it leaves everything in place', allTasks(await SD()).some(t => t.title === 'HTTP in detail'));
  await click(`[data-action=s-del][data-id="${wsec.id}"]`); await answer(true);
  check('…and Remove removes them', !allTasks(await SD()).some(t => t.title === 'HTTP in detail'));
  await click('[data-action=s-edit]'); await sleep(100);
  await go('study', 2026, 11, 2, 10);
  check('everything is still there after a reload (your chosen focus stays, even with no tasks left)', (await text('#stFocus')).includes('HTB Academy: Web Requests module') && (await text('#stFocus')).includes('no sections or tasks yet') && allTasks(await SD()).length === 2);

  if (STOP < 42) return finish();
  // ------------------------------------------------------------------
  console.log('\n[42] Saved data: export/import and older backups');
  await nav('today');
  const exp = await exportNow();
  check('export includes Study', exp.schemaVersion === 4 && exp.data.study && exp.data.study.stages.length === 4);
  const snap = await ev(`localStorage.getItem('${KEY}')`);
  await reset(); await go('study', 2026, 11, 2, 11);
  await importFile(S + '/dl/myday-export-2026-11-02.json');
  check('import restores everything exactly', noSaves(await ev(`localStorage.getItem('${KEY}')`)) === noSaves(snap));
  check('…and the Study screen shows it straight away', (await text('#stFocus')).includes('HTB Academy: Web Requests module'));
  const old = JSON.parse(JSON.stringify(exp)); delete old.data.study;
  fs.writeFileSync(S + '/old-export.json', JSON.stringify(old));
  await importFile(S + '/old-export.json');
  check('a backup from before Study imports fine (Study starts empty)', (await SD()).stages.length === 0 && (await exists('.st-setup-row')));
  const messy = JSON.parse(JSON.stringify(exp));
  const s0 = messy.data.study.stages[0];
  s0.courses[0].modules[0].sections[0].tasks.push({ id: 'x', title: '' }, { id: s0.courses[0].modules[0].sections[0].tasks[0].id, title: 'Same id', minutes: 'lots' });
  messy.data.study.focusCourseId = 'nope';
  fs.writeFileSync(S + '/messy.json', JSON.stringify(messy));
  await importFile(S + '/messy.json');
  st = await SD();
  const ids = [];
  st.stages.forEach(sg => { ids.push(sg.id); sg.courses.forEach(c => { ids.push(c.id); c.modules.forEach(m => { ids.push(m.id); m.sections.forEach(sc => { ids.push(sc.id); sc.tasks.forEach(t => ids.push(t.id)); }); }); }); });
  check('damaged entries are dropped, repeated ids made unique, bad numbers defaulted', allTasks(st).length === 3 && new Set(ids).size === ids.length && allTasks(st)[2].minutes === 30 && st.focusCourseId === null, allTasks(st).map(t => [t.title, t.minutes]));

  if (STOP < 43) return finish();
  // ------------------------------------------------------------------
  console.log('\n[43] Learning sessions and check-in');
  await go('today', 2026, 11, 2, 9); await reset(); await go('today', 2026, 11, 2, 9);
  await editStorage(`s => { s.study = ${JSON.stringify(roadmap)}; s.commitments = [{ id: 'c1', kind: 'appointment', title: 'GP', start: '2026-11-02T10:00', end: '2026-11-02T11:00' }]; s.context = { '2026-11-02': { energy: 4, sleep: { start: null, end: null, estimatedHours: null } } }; s.days['2026-11-02'] = { energy: 4, rest: false, builtAt: '', checkedIn: false, tasks: [${JSON.stringify(learnTask)}] }; }`);
  await go('study', 2026, 11, 2, 9);
  check('suggested length fits the free time before your next appointment (30 min before GP)', (await text('#stLen')) === '30' && (await text('#stFocus')).includes('30 min free before GP'), await text('#stFocus'));
  await editStorage(`s => { s.context['2026-11-02'].energy = 2; }`);
  await go('study', 2026, 11, 2, 9);
  check('…and is shorter on a low-energy day (energy 2 → 20 min), saying why', (await text('#stLen')) === '20' && (await text('#stFocus')).includes('energy 2 today'));
  await click('[data-action=s-len][data-d="5"]'); await sleep(100);
  check('you can change it (+5 → 25, shown as your choice)', (await text('#stLen')) === '25' && (await text('#stFocus')).includes('Your choice'));
  check('a shorter alternative is offered', await exists('#stFocus [data-action=s-start][data-short="1"]'));
  check('nothing is saved just by looking', !((await SD()).sessions || []).length);
  await click('#stFocus [data-action=s-start]:not([data-short])'); await sleep(250);
  let ses = (await SD()).sessions;
  check('Start opens the session screen and saves the session', (await ev('location.hash')) === '#study/session' && ses.length === 1 && ses[0].status === 'active' && ses[0].taskId === 'tkD' && ses[0].plannedMin === 25 && (await SD()).activeId === ses[0].id);
  check('…with the clock at zero and the plan shown', near(await text('#stClock'), 0) && (await text('.st-session')).includes('Planned: 25 min'));
  await ev('window.__setNow(2026, 11, 2, 9, 10)'); await sleep(1300);
  check('the clock keeps time (10 min later)', near(await text('#stClock'), 10), await text('#stClock'));
  await go('study/session', 2026, 11, 2, 9, 12);
  check('a refresh keeps the session running (12 min)', near(await text('#stClock'), 12), await text('#stClock'));
  await click('[data-action=s-pause]'); await sleep(150);
  let a = (await SD()).sessions[0];
  check('Pause stops the clock with 12 min banked', a.runningSince === null && Math.abs(a.activeMs - 12 * 60000) < 5000 && (await text('.st-session .eyebrow')).includes('paused'));
  await ev('window.__setNow(2026, 11, 2, 9, 40)'); await sleep(1300);
  check('…and it stays stopped while paused', near(await text('#stClock'), 12));
  await go('study/session', 2026, 11, 2, 9, 41);
  check('…even after a refresh while paused', near(await text('#stClock'), 12) && (await exists('[data-action=s-resume]')));
  await click('[data-action=s-resume]'); await sleep(150);
  await ev('window.__setNow(2026, 11, 2, 9, 55)'); await sleep(1300);
  check('after resuming, reaching the planned time is noted gently (26 min)', near(await text('#stClock'), 26) && (await text('#stReached')).includes("That's the 25 minutes you planned"), await text('#stClock'));
  await click('[data-action=s-finish]'); await sleep(250);
  a = (await SD()).sessions[0];
  check('Finish saves the time (26 min, not counting the pause) and opens the check-in', a.status === 'done' && Math.abs(a.activeMs - 26 * 60000) < 5000 && a.endedAt === '2026-11-02T09:55' && (await SD()).activeId === null && (await ev('location.hash')) === '#study/checkin/' + a.id, a);
  check('the check-in says it is optional', (await text('#app')).includes('Everything here is optional'));
  check('concepts linked to the task are offered to pick', eq(await texts('.st-pick'), ['DNS records']));
  await click('[data-action=s-ci-concept][data-id=cpR]'); await sleep(100);
  await ev(`document.getElementById('ciNew').value = 'Resolvers'`); await click('[data-action=s-ci-add]'); await sleep(150);
  await ev(`document.getElementById('ciNew').value = 'dns RECORDS'`); await click('[data-action=s-ci-add]'); await sleep(150);
  let st2 = await SD();
  const resolvers = st2.concepts.find(c => c.title === 'Resolvers');
  check('you can add a concept; it is linked to the task and picked', resolvers && eq(resolvers.taskIds, ['tkD']) && st2.sessions[0].checkin.conceptIds.includes(resolvers.id) && st2.sessions[0].checkin.conceptIds.includes('cpR'));
  check('the same name again does not make a duplicate', st2.concepts.length === 2);
  check('picking concepts adds no question or answer (nothing is made up)', st2.concepts.every(c => !c.prompt && !c.answer && !c.explanation));
  await click('[data-action=s-ci-clarity][data-v=partly]'); await sleep(100);
  await click('[data-action=s-ci-task][data-v="1"]'); await sleep(100);
  await clickText('details summary', 'Add a takeaway'); await setVal('#ciTake', 'DNS maps names to addresses'); await sleep(80); await setVal('#ciNote', 'Networking/DNS'); await sleep(100);
  st2 = await SD();
  const dnsTask = allTasks(st2).find(t => t.id === 'tkD');
  check('task completion, clarity and the session are kept as separate records', dnsTask.done && dnsTask.doneOn === '2026-11-02' && st2.sessions[0].taskDone === true && st2.sessions[0].checkin.clarity === 'partly' && st2.sessions[0].checkin.takeaway === 'DNS maps names to addresses' && st2.sessions[0].checkin.note === 'Networking/DNS');
  check('the chosen answers show as pressed', (await text('[data-action=s-ci-clarity][aria-pressed=true]')) === 'Partly understand' && (await text('[data-action=s-ci-task][aria-pressed=true]')) === "Yes, it's complete");
  check('the matching learning task on today\'s plan is offered, not ticked automatically', (await exists('[data-action=s-tick-today]')) && !(await D()).days['2026-11-02'].tasks[0].done);
  await click('[data-action=s-tick-today]'); await sleep(150);
  check('…and ticked when you ask, linked to this session', (await D()).days['2026-11-02'].tasks[0].done && (await SD()).sessions[0].todayUid === 'u1' && (await text('#app')).includes("is ticked on today's plan"));
  await click('[data-action=s-ci-done]'); await sleep(250);
  check('Done returns to the dashboard; the next task is now HTTP in detail', (await ev('location.hash')) === '#study' && (await text('#stFocus')).includes('HTTP in detail'));
  await nav('today'); await sleep(150);
  check('a ticked Today task and a Study session on the same day count as one learning day', (await text('#streak')).includes('Learning days in the last 7: 1'));
  check('…and grow one leaf in the garden, not two', (await text('#gardenCaption')).startsWith('1 learning session '));
  await nav('study'); await click('#stFocus [data-action=s-start][data-short="1"]'); await sleep(250);
  check('the shorter alternative starts a 15-minute session', (await SD()).sessions[1].plannedMin === 15 && (await SD()).sessions[1].short === true);
  await nav('study/roadmap');
  check('only one session at a time: no Start buttons while one is in progress', !(await exists('[data-action=s-start]')));
  await nav('study');
  check('the dashboard shows the session in progress first', (await text('.next-card')).includes('In progress') && (await text('#stFocus')).includes('A session is in progress'));
  await nav('study/session'); await click('[data-action=s-finish]'); await sleep(250);
  await click('[data-action=s-ci-skip]'); await sleep(250);
  st2 = await SD();
  check('Skip leaves no check-in, and the session still counts', st2.sessions[1].status === 'done' && st2.sessions[1].checkin === null && st2.sessions[1].taskDone === null);
  await nav('today'); await sleep(150);
  check('a second session that day: still one learning day, now two leaves', (await text('#streak')).includes('Learning days in the last 7: 1') && (await text('#gardenCaption')).startsWith('2 learning sessions'));
  await editStorage(`s => { s.study.focusCourseId = 'coE'; }`);
  await go('study', 2026, 11, 3, 9);
  check('a course with no tasks yet can still have a session', (await text('#stFocus')).includes('You can still start a session'));
  await click('#stFocus [data-action=s-start]:not([data-short])'); await sleep(250);
  st2 = await SD();
  check('…recorded against the course, on its local date', st2.sessions[2].courseId === 'coE' && st2.sessions[2].taskId === null && st2.sessions[2].title === 'Empty course' && st2.sessions[2].date === '2026-11-03');
  await click('[data-action=s-discard]'); await sleep(200);
  check('Discard asks first, in the page', (await text('#dialog-title')) === 'Discard this session?');
  await answer(false);
  check('…Keep it keeps the session', (await SD()).sessions.length === 3 && !!(await SD()).activeId);
  await click('[data-action=s-discard]'); await answer(true);
  st2 = await SD();
  check('…and Discard removes it', st2.sessions.length === 2 && st2.activeId === null && (await ev('location.hash')) === '#study');
  await nav('today'); await sleep(150);
  check('…so it does not count: 3 Nov is not a learning day (still 1 in the last 7)', (await text('#streak')).includes('Learning days in the last 7: 1'));

  if (STOP < 44) return finish();
  // ------------------------------------------------------------------
  console.log('\n[44] Concepts and revision');
  await go('today', 2026, 11, 2, 9); await reset(); await go('today', 2026, 11, 2, 9);
  const rm = JSON.parse(JSON.stringify(roadmap)); rm.concepts = concepts;
  await editStorage(`s => { s.study = ${JSON.stringify(rm)}; }`);
  await go('study', 2026, 11, 2, 9);
  const secrets = concepts.flatMap(c => [c.answer, c.explanation, c.hint]).filter(Boolean);
  const leaks = () => ev(`(() => { const t = document.body.textContent; return ${JSON.stringify(secrets)}.filter(x => t.includes(x)); })()`);
  check('dashboard previews concept names only (oldest due first) — no answers', (await text('#stRevision')).includes('Ready to revise: Packets, What DNS does, HTTPS port and more') && !(await leaks()).length, await leaks());
  check('…says which concepts still need a revision question', (await text('#stRevision')).includes('1 concept needs a revision question'));
  await click('[data-action=s-rev-start]'); await sleep(250);
  check('revision starts with one question, in a round of 5', (await ev('location.hash')) === '#study/revise' && (await text('.st-q .eyebrow')) === 'Question 1 of 5' && (await text('.st-prompt')) === 'What is a packet?');
  check('the answer, explanation and hints are not on the page yet', !(await leaks()).length, await leaks());
  await setVal('#revTyped', 'a chunk of data', 'input');
  await click('[data-action=s-rev-show]'); await sleep(120);
  check('Show the answer reveals it next to what you typed', (await text('.st-q')).includes('A small unit of data') && (await text('.st-yours')).includes('a chunk of data'));
  check('written answers are self-assessed, and it says so', (await text('.st-q')).includes("Self-assessed — MyDay doesn't mark written answers"));
  check('the schedule is shown on the buttons (Good → in 10 days after a 4-day gap)', eq((await texts('.st-rate .meta')), ['tomorrow', 'in 5 days', 'in 10 days']), await texts('.st-rate .meta'));
  check('nothing is saved until you choose when it comes back', !((await SD()).reviews || []).length);
  await click('[data-action=s-rev-self][data-v=right]'); await sleep(80); await click('[data-action=s-rev-rate][data-v=good]'); await sleep(150);
  let sd = await SD();
  const pk = sd.concepts.find(c => c.id === 'cpOld');
  check('Good: next review in 10 days, on a local date', pk.review.due === '2026-11-12' && pk.review.interval === 10 && pk.review.reps === 2);
  check('…and the answer is recorded as self-assessed, on your own', sd.reviews.length === 1 && sd.reviews[0].outcome === 'right' && sd.reviews[0].graded === 'self' && sd.reviews[0].support === 'own' && sd.reviews[0].rating === 'good' && sd.reviews[0].date === '2026-11-02');
  check('question 2: What does DNS do? (nothing typed carried over)', (await text('.st-prompt')) === 'What does DNS do?' && !(await leaks()).length && (await ev(`document.getElementById('revTyped').value`)) === '');
  await click('[data-action=s-rev-hint]'); await sleep(100);
  check('Show a hint reveals only the hint', (await text('.st-hint')).includes('Think of a phone book') && !(await text('#app')).includes('Translates names'));
  await click('[data-action=s-rev-notsure]'); await sleep(100);
  check('Not sure reveals the explanation, without asking you to mark yourself', (await text('.st-q')).includes('Resolvers ask name servers') && !(await exists('[data-action=s-rev-self]')));
  check('using the hint is noted (Used a hint is preselected)', (await text('[data-action=s-rev-support][aria-pressed=true]')) === 'Used a hint');
  await click('[data-action=s-rev-rate][data-v=again]'); await sleep(150);
  sd = await SD();
  const w = sd.concepts.find(c => c.id === 'cpW');
  check('Again: back tomorrow; first-time lapses are not counted against you', w.review.due === '2026-11-03' && w.review.interval === 1 && w.review.lapses === 0 && sd.reviews[1].outcome === 'notsure' && sd.reviews[1].graded === null && sd.reviews[1].support === 'hint');
  check('question 3 is multiple choice: choices shown, nothing marked', (await text('.st-prompt')) === 'Which port does HTTPS use by default?' && eq(await texts('.st-choice'), ['80', '443', '22']) && !(await exists('.st-choice.right')) && !(await text('.st-q')).includes('✓'));
  await click('[data-action=s-rev-choose][data-i="0"]'); await sleep(120);
  check('a wrong choice is checked against the stored answer and shown', (await text('.st-verdict')).startsWith('Not this time') && (await text('.st-choice.right')).includes('443') && (await text('.st-choice.wrong')).includes('80'));
  await click('[data-action=s-rev-rate][data-v=hard]'); await sleep(150);
  sd = await SD();
  check('…recorded as not right (automatic), Hard → in 2 days', sd.reviews[2].outcome === 'wrong' && sd.reviews[2].graded === 'auto' && sd.reviews[2].chosen === 0 && sd.concepts.find(c => c.id === 'cpM').review.due === '2026-11-04');
  await click('[data-action=s-rev-choose][data-i="1"]'); await sleep(120);
  check('a right choice: "Correct — matches the stored answer"', (await text('.st-verdict')).startsWith('Correct') && (await SD()).reviews.length === 3);
  await click('[data-action=s-rev-rate][data-v=good]'); await sleep(150);
  check('question 5 of 5', (await text('.st-q .eyebrow')) === 'Question 5 of 5');
  await click('[data-action=s-rev-show]'); await sleep(80); await click('[data-action=s-rev-support][data-v=notes]'); await sleep(80); await click('[data-action=s-rev-self][data-v=partly]'); await sleep(80); await click('[data-action=s-rev-rate][data-v=good]'); await sleep(150);
  check('after 5, the round ends with a calm summary and another round on offer', (await text('#app')).includes('5 reviewed') && (await text('#app')).includes('Recalled on your own: 2') && (await exists('[data-action=s-rev-start]')));
  await click('[data-action=s-rev-start]'); await sleep(150);
  check('another round has just the 1 that is left', (await text('.st-q .eyebrow')) === 'Question 1 of 1');
  await click('a.btn-link[href="#study"]'); await sleep(200);
  check('Stop for now saves nothing for an unanswered question', (await SD()).reviews.length === 5);
  sd = await SD();
  check('the review sessions don\'t touch post-learning clarity (separate records)', sd.sessions.every(x => !x.checkin) && sd.reviews.every(r => !('clarity' in r)));
  check('every attempt is kept with its schedule (5 reviews, each with its gap and due date)', sd.reviews.every(r => r.gap >= 1 && /^\d{4}-\d\d-\d\d$/.test(r.due)) && eq(sd.reviews.map(r => r.conceptId), ['cpOld', 'cpW', 'cpM', 'cpM2', 'cpA']), sd.reviews.map(r => r.conceptId));
  await go('study/revise', 2026, 11, 2, 9, 30);
  check('a reload keeps your saved attempts and doesn\'t restart any review interval', eq((await SD()).reviews.length, 5) && (await SD()).concepts.find(c => c.id === 'cpOld').review.interval === 10 && (await text('#app')).includes('1 ready to revise'));
  // Labels
  await nav('study/concepts');
  const cRows = await texts('.c-row');
  check('concepts list: the one without a question is listed to fix first', (await text('#app')).includes('Need a revision question (1)') && cRows[0].startsWith('Subnet masks'));
  check('cautious labels: Recalled independently / Needs practice / Practising / Introduced', cRows.some(r => r.startsWith('Packets') && r.includes('Recalled independently')) && cRows.some(r => r.startsWith('What DNS does') && r.includes('Needs practice')) && cRows.some(r => r.startsWith('HTTPS port') && r.includes('Needs practice')) && cRows.some(r => r.startsWith('IP addresses') && r.includes('Practising')) && cRows.some(r => r.startsWith('Routers') && r.includes('Introduced')), cRows);
  await nav('study/concept/cpOld');
  check('one good answer is not overstated: "not enough evidence yet"', (await text('#app')).includes('recalled on your own 1 time') && (await text('#app')).includes('not enough evidence yet to say more') && !/master/i.test(await text('#app')));
  // Missed days: no backlog
  await go('study/revise', 2026, 12, 20, 9);
  // (The footer is left out: its release number, e.g. "MyDay 1.7.0", isn't a count.)
  const revText = await ev(`(() => { const c = document.getElementById('app').cloneNode(true); c.querySelector('#footer')?.remove(); return c.textContent; })()`);
  check('after weeks away: still just one round of 5 — no backlog count', revText.includes('A round of 5 is ready.') && !/\b[6-9] ready|\b7\b/.test(revText));
  // Concept editor
  await nav('study/concepts'); await click('[data-action=s-concept-new]'); await sleep(300);
  check('+ New opens the new concept with its name ready to type', (await ev('document.activeElement && document.activeElement.id')) === 'cp-title' && (await text('#app')).includes('Needs a revision question'));
  const nid = (await ev('location.hash')).split('/')[2];
  await setVal('#cp-title', 'Default gateway'); await sleep(80); await setVal('#cp-kind', 'choice'); await sleep(120);
  await setVal('#cp-prompt', 'What is a default gateway?'); await sleep(80);
  await setVal('input[data-s=cp-choice][data-i="0"]', 'The router used for other networks'); await sleep(80); await setVal('input[data-s=cp-choice][data-i="1"]', 'A firewall rule'); await sleep(80);
  await click('input[data-s=cp-correct][value="3"]'); await sleep(120);
  check('only a filled-in choice can be marked correct', (await SD()).concepts.find(c => c.id === nid).correct === null && !(await ev(`document.querySelector('input[data-s=cp-correct][value="3"]').checked`)));
  await click('input[data-s=cp-correct][value="0"]'); await sleep(120);
  check('with a question and a marked answer it is ready for revision', (await SD()).concepts.find(c => c.id === nid).correct === 0 && !(await text('#app')).includes('Needs a revision question'));
  await setVal('#cpLink', 'tkH'); await click(`[data-action=s-cp-link][data-id="${nid}"]`); await sleep(120);
  check('…and can be linked to a task', eq((await SD()).concepts.find(c => c.id === nid).taskIds, ['tkH']));
  await nav('study/task/tkH');
  check('linked concepts show on the task', (await text('#app')).includes('Default gateway'));
  await ev(`document.getElementById('tkConcept').value = 'ARP'`); await click('[data-action=s-task-concept]'); await sleep(150);
  check('…and you can add one from the task', (await SD()).concepts.some(c => c.title === 'ARP' && eq(c.taskIds, ['tkH'])));
  // Obsidian
  await nav('study/settings'); await setVal('#stVault', 'My Vault'); await sleep(100);
  await nav('study/concept/cpW');
  check('Open in Obsidian uses a correctly encoded URI', (await ev(`document.querySelector('a[href^="obsidian://"]').getAttribute('href')`)) === 'obsidian://open?vault=My%20Vault&file=Networking%2FDNS%20basics');
  await nav('study/settings');
  check('…and says MyDay cannot read the vault', (await text('#app')).includes("can't read or change anything in your vault"));
  await go('study/revise', 2026, 11, 3, 9);
  await click('[data-action=s-rev-start]'); await sleep(150);
  await ev(`(() => { const a = document.querySelector('a[data-rev-notes]'); if (!a) throw new Error('no notes link'); document.addEventListener('click', e => e.preventDefault(), { once: true, capture: true }); a.click(); })()`); await sleep(80);
  await click('[data-action=s-rev-show]'); await sleep(100);
  check('opening your notes during a question is recorded as "Checked notes"', (await text('[data-action=s-rev-support][aria-pressed=true]')) === 'Checked notes');
  // Removing a concept keeps its review history
  await nav('study/concept/cpM');
  await click('[data-action=s-cp-del][data-id=cpM]'); await answer(true);
  sd = await SD();
  check('removing a concept asks first, then keeps its past reviews', !sd.concepts.some(c => c.id === 'cpM') && sd.reviews.filter(r => r.conceptId === 'cpM').length === 1 && (await ev('location.hash')) === '#study/concepts');
  // Daylight-saving: review dates are calendar days
  await reset(); await go('today', 2026, 10, 24, 9);
  const dst = JSON.parse(JSON.stringify(roadmap)); dst.concepts = [C('cpT', 'Time zones', { prompt: 'What is UTC?', answer: 'Coordinated Universal Time' })];
  await editStorage(`s => { s.study = ${JSON.stringify(dst)}; }`);
  await go('study/revise', 2026, 10, 24, 23, 30);
  await click('[data-action=s-rev-start]'); await sleep(120); await click('[data-action=s-rev-show]'); await sleep(100); await click('[data-action=s-rev-rate][data-v=good]'); await sleep(150);
  check('review dates are local calendar days across the clock change (24 Oct + 4 → 28 Oct)', (await SD()).concepts[0].review.due === '2026-10-28' && (await SD()).reviews[0].date === '2026-10-24');

  if (STOP < 45) return finish();
  // ------------------------------------------------------------------
  console.log('\n[45] Progress, history, the Today card, and saving everything');
  await go('today', 2026, 11, 2, 9); await reset(); await go('today', 2026, 11, 2, 9);
  await nav('study/progress');
  check('with nothing recorded, progress says there isn\'t enough evidence (no made-up numbers)', (await text('#app')).includes("isn't enough evidence to show recall") && (await text('#app')).includes('No courses yet') && (await text('#app')).includes('Learning days in the last 7: 0'));
  await editStorage(`s => { s.study = ${JSON.stringify(pr)}; }`);
  await go('study/progress', 2026, 11, 2, 9);
  const P = await text('#app');
  check('learning days: sessions on 28 Oct, 30 Oct and 1 Nov → 3 in the last 7', P.includes('Learning days in the last 7: 3'));
  check('completion counts tracked tasks only: 2 of 3 complete (66%)', P.includes('2 of 3 tasks complete (66%)'));
  check('practical work completed is listed with its date', P.includes('Practical work completed (1)') && P.includes('Build a DNS lookup script') && P.includes('Fri 30 Oct'));
  check('after-learning clarity is your own report, counted separately', P.includes('Understand: 1 · Partly understand: 0 · Not yet: 1') && P.includes('separate from how revision went'));
  const weekRows = await ev(`[...document.querySelectorAll('.st-recall tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim()).join('|'))`);
  check('recall over time, by week: on your own / with help / not yet', weekRows.length === 8 && weekRows[5] === 'Mon 19 Oct|1|1|0|0' && weekRows[6] === 'Mon 26 Oct|2|0|2|0' && weekRows[7] === 'Mon 2 Nov|1|0|0|1', weekRows);
  check('concepts that may need practice are named, with the evidence', P.includes('Might benefit from more practice (1)') && (await ev(`[...document.querySelectorAll('.c-row a')].map(a => a.textContent).join('|')`)) === 'TTL' && P.includes('last Mon 2 Nov: Not right'));
  const hist = await texts('#app .plain-list li strong');
  check('study history: sessions and revision days, newest first', eq(hist, ['Mon 2 Nov', 'Sun 1 Nov', 'Fri 30 Oct', 'Wed 28 Oct', 'Tue 27 Oct', 'Wed 21 Oct']), hist);
  check('no mastery claims or readiness scores anywhere', !/master|readiness|ready for the exam/i.test(P));
  // Many sessions: the history shows 12, with "Show all".
  await editStorage(`s => { for (let i = 0; i < 14; i++) s.study.sessions.push(${JSON.stringify(sess('m', '2026-10-01', 20, null))}); s.study.sessions.slice(-14).forEach((x, i) => { x.id = 'm' + i; x.date = '2026-10-' + String(2 + i).padStart(2, '0'); x.startedAt = x.date + 'T09:00'; }); }`);
  await go('study/progress', 2026, 11, 2, 9);
  check('a long history shows the newest 12, with "Show all"', (await ev(`document.querySelectorAll('#app .plain-list li strong').length`)) === 12 && (await exists('[data-action=s-history-all]')));
  await click('[data-action=s-history-all]'); await sleep(120);
  check('…and Show all shows every entry (17 sessions and 3 revision days)', (await ev(`document.querySelectorAll('#app .plain-list li strong').length`)) === 20);
  await editStorage(`s => { s.study = ${JSON.stringify(pr)}; }`);
  // Today card
  await go('today', 2026, 11, 2, 9);
  check('Today shows a Study card only for what is waiting: revision ready', (await text('#slot-study')).includes('Revision ready') && (await text('#slot-study')).includes('1 question'));
  await click('#slot-study [data-action=s-rev-start]'); await sleep(300);
  check('…and Revise goes straight to the first question', (await ev('location.hash')) === '#study/revise' && (await text('.st-prompt')) === 'What is a TTL?');
  await go('study', 2026, 11, 2, 9);
  await click('#stFocus [data-action=s-start]:not([data-short])'); await sleep(250);
  await nav('today'); await sleep(150);
  check('…and a session in progress, with Resume', (await text('#slot-study')).includes('Study session in progress') && (await exists('#slot-study a[href="#study/session"]')));
  check('nothing was added to today\'s task list', !(await D()).days['2026-11-02']);
  await editStorage(`s => { s.study.concepts = []; s.study.activeId = null; s.study.sessions = s.study.sessions.filter(x => x.status === 'done'); }`);
  await go('today', 2026, 11, 2, 9);
  check('…and no Study card when nothing is waiting', !(await text('#slot-study')).trim());
  // Export / import round trip with sessions, concepts and reviews — and every other section
  await editStorage(`s => { s.study = ${JSON.stringify(pr)}; s.health = { workout: { templates: [{ id: 't1', name: 'Legs', minutes: 45 }] }, food: { shopping: [{ id: 'sh1', text: 'Oats', checked: false }] } }; s.futureSection = { kept: true }; }`);
  await go('today', 2026, 11, 2, 9);
  const ex2 = await exportNow();
  check('export includes sessions, concepts and reviews', ex2.data.study.sessions.length === 3 && ex2.data.study.concepts.length === 2 && ex2.data.study.reviews.length === 4);
  check('…and every other section (Health, unknown sections, the day plan, the rota)', ex2.data.health.workout.templates[0].name === 'Legs' && ex2.data.futureSection.kept === true && 'rota' in ex2.data && 'days' in ex2.data && 'lists' in ex2.data);
  await reset(); await go('study', 2026, 11, 2, 10);
  await importFile(S + '/dl/myday-export-2026-11-02.json');
  check('…and importing it restores all of it exactly', noSaves(await D()) === noSaves(ex2.data));

  if (STOP < 49) return finish();
  // ------------------------------------------------------------------
  console.log('\n[49] Layout');
  await reset(); await go('today', 2026, 11, 2, 15);
  const lay = JSON.parse(JSON.stringify(roadmap));
  lay.concepts = concepts;
  lay.sessions = [{ id: 'ssL', courseId: 'coP', taskId: 'tkD', title: 'TryHackMe: Pre-Security path · DNS in detail', date: '2026-11-02', startedAt: '2026-11-02T09:00', plannedMin: 30, short: false, status: 'done', runningSince: null, activeMs: 600000, endedAt: '2026-11-02T09:10', checkin: { conceptIds: ['cpW'], clarity: 'partly', takeaway: '', question: '', note: '' }, taskDone: null, todayUid: null }];
  await editStorage(`s => { s.study = ${JSON.stringify(lay)}; }`);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const noSideways = async label => check(`phone: no sideways scrolling (${label})`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  for (const h of ['study', 'study/roadmap', 'study/course/coP', 'study/task/tkD', 'study/checkin/ssL', 'study/concepts', 'study/concept/cpM', 'study/settings', 'study/revise', 'study/progress']) {
    await go(h, 2026, 11, 2, 15);
    await noSideways(h);
  }
  await go('study', 2026, 11, 2, 15);
  check('phone: Start learning is visible without scrolling', await ev(`(() => { const r = document.querySelector('#stFocus [data-action=s-start]').getBoundingClientRect(); return r.bottom <= innerHeight - 76 && r.top >= 0; })()`));
  check('phone: every Study button is at least 44 px tall', await ev(`[...document.querySelectorAll('#app button, #app a.btn-link')].every(b => b.getBoundingClientRect().height >= 44)`), await ev(`[...document.querySelectorAll('#app button, #app a.btn-link')].filter(b => b.getBoundingClientRect().height < 44).map(b => b.textContent.trim()).slice(0, 5)`));
  await go('study/revise', 2026, 11, 2, 15);
  await click('[data-action=s-rev-start]'); await sleep(150); await noSideways('revision question');
  await click('[data-action=s-rev-notsure]'); await sleep(100); await noSideways('revealed answer and rating');
  await go('study', 2026, 11, 2, 15); await click('#stFocus [data-action=s-start]:not([data-short])'); await sleep(250); await noSideways('learning session');
  await go('study/roadmap', 2026, 11, 2, 15); await click('[data-action=s-edit]'); await sleep(150); await noSideways('roadmap while editing');
  await T.send('Emulation.clearDeviceMetricsOverride');

  // ------------------------------------------------------------------
  console.log('\n[50] No duplicates: double taps, reloads and redraws');
  await go('today', 2026, 11, 2, 9); await reset(); await go('today', 2026, 11, 2, 9);
  await editStorage(`s => { s.study = ${JSON.stringify(roadmap)}; s.days['2026-11-02'] = { energy: 3, rest: false, builtAt: '', checkedIn: false, tasks: [${JSON.stringify(learnTask)}] }; }`);
  await go('study', 2026, 11, 2, 9);
  await ev(`(() => { const b = document.querySelector('#stFocus [data-action=s-start]:not([data-short])'); b.click(); b.click(); b.click(); })()`); await sleep(250);
  check('three quick taps on Start make one session', (await SD()).sessions.length === 1);
  await go('study', 2026, 11, 2, 9, 5);
  check('after a reload, the dashboard offers the session in progress, not a new one', (await text('.next-card')).includes('In progress') && !(await exists('#stFocus [data-action=s-start]')));
  await nav('study/roadmap');
  check('…and the roadmap offers no Start while it runs', !(await exists('[data-action=s-start]')));
  await nav('study/session');
  await ev(`(() => { const b = document.querySelector('[data-action=s-finish]'); b.click(); b.click(); })()`); await sleep(250);
  let sd5 = await SD();
  check('two quick taps on Finish finish it once', sd5.sessions.length === 1 && sd5.sessions[0].status === 'done' && sd5.activeId === null);
  await go('study/checkin/' + sd5.sessions[0].id, 2026, 11, 2, 9, 40);
  check('reloading the check-in shows the same session (nothing new saved)', (await text('#app')).includes('Quick check-in') && (await SD()).sessions.length === 1);
  await click('[data-action=s-tick-today]'); await sleep(150);
  await ev(`(() => { const b = document.querySelector('[data-action=s-tick-today]'); if (b) b.click(); })()`); await sleep(150);
  check('ticking today\'s task links it once', (await D()).days['2026-11-02'].tasks.filter(t => t.done).length === 1 && (await SD()).sessions[0].todayUid === 'u1');
  await nav('today'); await sleep(150);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(200); } // redraws everything (and saves) three times
  await go('today', 2026, 11, 2, 18);
  check('after redraws and a reload: still 1 learning day and 1 leaf (the session and the tick count once)', (await text('#streak')).includes('Learning days in the last 7: 1') && (await text('#gardenCaption')).startsWith('1 learning session '), [await text('#streak h2'), await text('#gardenCaption')]);
  check('…and still exactly one saved session', (await SD()).sessions.length === 1);
  await go('today', 2026, 11, 4, 9);
  check('two days later the day still counts once in the rolling 7', (await text('#streak')).includes('Learning days in the last 7: 1'));

  // ------------------------------------------------------------------
  console.log('\n[51] Themes');
  await go('today', 2026, 11, 2, 9); await reset(); await go('today', 2026, 11, 2, 9);
  const th = JSON.parse(JSON.stringify(roadmap)); th.concepts = concepts;
  await editStorage(`s => { s.study = ${JSON.stringify(th)}; }`);
  for (const theme of ['light', 'auto', 'dark']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    await go('study', 2026, 11, 2, 9);
    const okDash = (await ev('document.documentElement.dataset.theme')) === theme && (await contrastOf('#stFocus h2')) >= 4.5 && (await contrastOf('#stFocus [data-action=s-start]:not([data-short])')) >= 4.5 && (await contrastOf('#stFocus .st-next')) >= 4.5;
    check(`theme "${theme}": dashboard applied and readable (headings and Start ≥ 4.5:1)`, okDash, [await contrastOf('#stFocus h2'), await contrastOf('#stFocus [data-action=s-start]:not([data-short])')]);
    await click('[data-action=s-rev-start]'); await sleep(200);
    await click('[data-action=s-rev-show]'); await sleep(120);
    const okRev = (await contrastOf('.st-prompt')) >= 4.5 && (await contrastOf('.st-answer p')) >= 4.5 && (await contrastOf('[data-action=s-rev-rate][data-v=good]')) >= 4.5 && (await contrastOf('[data-action=s-rev-rate][data-v=again]')) >= 4.5;
    check(`theme "${theme}": revision question, answer and rating buttons readable`, okRev, [await contrastOf('.st-prompt'), await contrastOf('.st-answer p'), await contrastOf('[data-action=s-rev-rate][data-v=good]')]);
  }

  // ------------------------------------------------------------------
  console.log('\n[52] Same data, same results as the current MyDay');
  // Messy saved Study data: both apps must keep exactly the same records and drop the same bad ones.
  const mz = JSON.parse(JSON.stringify(pr));
  const mt = mz.stages[0].courses[0].modules[0].sections[0].tasks;
  mt.push({ id: 'tkD', title: 'Duplicate id', minutes: 'lots' }, { id: 'tkE', title: '   ' }, { id: 'tkL', title: 'x'.repeat(300), minutes: 9999, kind: 'weird', url: 'javascript:alert(1)', done: 'yes' });
  mz.stages.push({ id: 'sgB', title: 'Second', courses: [{ id: 'coB', title: 'Course B', modules: 'nope', archived: 1 }], extra: 'field' }, 'not a stage');
  mz.concepts.push(C('cpZ', 'Too many choices', { kind: 'choice', choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], correct: 9, taskIds: ['tkD', 'gone'] }), { title: 'No id' }, 7);
  mz.sessions.push({ id: 's1', date: '2026-10-29' }, { id: 'sBad', date: 'yesterday' }, sess('a1', '2026-11-02', 5, null, { status: 'active', runningSince: null }), sess('a2', '2026-11-02', 6, null, { status: 'active', runningSince: null }));
  mz.activeId = 'a2';
  mz.reviews.push({ id: 'rBad', conceptId: 'cpX', date: '2026-11-01', rating: 'excellent' }, { id: 'rNo', date: '2026-11-01', rating: 'good' });
  mz.focusCourseId = 'gone'; mz.settings = { vault: 'V'.repeat(200) }; mz.unknownStudyField = { kept: '?' };
  const seedIds = new Set(JSON.stringify(mz).match(/"id":"[^"]*"/g).map(x => x.slice(6, -1)));
  const maskNew = o => JSON.stringify(o, (k, v) => (k === 'id' && typeof v === 'string' && !seedIds.has(v) ? 'NEW' : v));
  async function seedAndSave(url) {
    await go('today', 2026, 11, 2, 9, 0, url); await reset(); await go('today', 2026, 11, 2, 9, 0, url);
    await editStorage(`s => { s.study = ${JSON.stringify(mz)}; s.days['2026-10-31'] = { energy: 3, rest: false, builtAt: '', checkedIn: true, tasks: [${JSON.stringify(Object.assign({}, learnTask, { uid: 'u9', done: true }))}] }; }`);
    await go('today', 2026, 11, 2, 9, 0, url);
    for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); } // three saves; the theme ends where it began
    return (await D()).study;
  }
  const liveSt = await seedAndSave('index.html'), newSt = await seedAndSave(APP);
  check('Study is saved exactly as the current MyDay saves it (same records kept, same bad ones dropped)', maskNew(liveSt) === maskNew(newSt), [maskNew(liveSt).slice(0, 300), maskNew(newSt).slice(0, 300)]);
  T.setUrl('index.html#study/progress'); await openAt(2026, 11, 2, 12);
  // 28 Oct, 30 Oct, 1 Nov (sessions), 31 Oct (a Today tick) and 2 Nov (the extra in-progress session,
  // which both apps finish when loading, as only one can be in progress).
  check('the current MyDay opens the Study data the new app saved (progress intact)', (await text('#app')).includes('Learning days in the last 7: 5') && (await text('#app')).includes('Recall over time'), await texts('#app h3'));
  check('…with only one session in progress, and every finished session and review kept', newSt.sessions.filter(s => s.status === 'active').length === 1 && ['s1', 's2', 's3'].every(id => newSt.sessions.some(s => s.id === id)) && ['r1', 'r2', 'r3', 'r4'].every(id => newSt.reviews.some(r => r.id === id)));
  // The same screens, side by side: the dashboard, revision preview, concept labels, progress and Today's count.
  async function screensIn(url) {
    const out = {};
    await go('today', 2026, 11, 2, 9, 0, url); await reset(); await go('today', 2026, 11, 2, 9, 0, url);
    const both = JSON.parse(JSON.stringify(pr)); both.concepts = both.concepts.concat(concepts);
    await editStorage(`s => { s.study = ${JSON.stringify(both)}; s.commitments = [{ id: 'c1', kind: 'appointment', title: 'GP', start: '2026-11-02T10:00', end: '2026-11-02T11:00' }]; s.context = { '2026-11-02': { energy: 2, sleep: { start: null, end: null, estimatedHours: null } } }; s.days['2026-10-31'] = { energy: 3, rest: false, builtAt: '', checkedIn: true, tasks: [${JSON.stringify(Object.assign({}, learnTask, { uid: 'u9', done: true }))}] }; }`);
    await go('today', 2026, 11, 2, 9, 0, url);
    out.streak = ((await text('#streak')).match(/Learning days in the last 7: \d+/) || [''])[0]; out.garden = flat(await text('#gardenCaption'));
    await go('study', 2026, 11, 2, 9, 0, url);
    out.focus = [await text('#stFocus h2'), await text('#stFocus .st-path'), await text('#stFocus .st-next'), await text('#stLen')].map(flat);
    out.revision = flat(await text('#stRevision'));
    await go('study/concepts', 2026, 11, 2, 9, 0, url);
    out.concepts = (await texts('.c-row')).map(flat);
    await go('study/progress', 2026, 11, 2, 9, 0, url);
    out.heads = (await texts('#app h3')).map(flat);
    out.weeks = await ev(`[...document.querySelectorAll('.st-recall tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim()).join('|'))`);
    out.history = (await texts('#app .plain-list li')).map(flat);
    return out;
  }
  const liveS = await screensIn('index.html'), newS = await screensIn(APP);
  for (const k of Object.keys(liveS)) check(`${k}: the same as the current MyDay`, eq(liveS[k], newS[k]), [liveS[k], newS[k]]);

  finish();
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
