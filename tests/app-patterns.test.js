// What MyDay has noticed, in the new app: the page (from the footer on every screen; a quiet line on Today only when
// there's something new), a pattern from a made-up history with its "Why?", "Yes — do that" (it becomes a
// preference), "Not really", "Forget my answer"; your preferences; Build my day using them in the open (a note and a
// "Why?"; fewer tasks); tasks that keep moving ("What's getting in the way?": the first step as today's task, let it
// go and bring it back, the next day off); saved data (export, the current MyDay keeping it); layout on phones.
const fs = require('fs');
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const hash = () => ev('location.hash');
const pats = async () => (await data()).patterns;
const K = '2026-10-15'; // a Thursday
const before = n => { const d = new Date(2026, 9, 15 - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// A made-up history: 16 checked-in days, one learning task each — 9 of 25 min (7 ticked off), 7 of 60 min (2 ticked
// off); and sleep and energy for 6 of them (short nights: energy 2; 8 hours: energy 4).
const task = (uid, category, minutes, done) => ({ uid, taskId: null, category, title: `Study ${minutes}`, minutes, baseMinutes: minutes, done, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null });
const history = { days: {}, context: {} };
for (let i = 1; i <= 16; i++) {
  const short = i <= 9;
  history.days[before(i)] = { energy: 3, rest: false, builtAt: before(i) + 'T08:00', checkedIn: true, tasks: [task('h' + i, 'learning', short ? 25 : 60, short ? i <= 7 : i <= 11)] };
}
for (let i = 1; i <= 6; i++) history.context[before(i)] = { energy: i <= 3 ? 2 : 4, sleep: { start: null, end: null, estimatedHours: i <= 3 ? 5 : 8 } };
const seed = `s => { const h = ${JSON.stringify(history)}; Object.assign(s.days, h.days); Object.assign(s.context, h.context);
  s.lists.learning = [{ id: 'L1', title: 'Pharmacology', minutes: 60 }]; s.lists.admin = [{ id: 'A1', title: 'Emails', minutes: 15 }]; s.lists.health = [{ id: 'H1', title: 'Walk', minutes: 30 }]; }`;

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] The page, before there\'s anything to notice');
  await go('today', 2026, 10, 15); await reset(); await go('today', 2026, 10, 15);
  check('nothing on Today about it', !(await exists('#noticedLink')));
  await click('[data-action=noticed]'); await sleep(300);
  check('"What MyDay has noticed" in the footer opens it (Today stays current in the bar)', (await hash()) === '#noticed' && (await text('#noticed-h')).includes('What MyDay has noticed') && (await ev(`document.querySelector('#nav [aria-current=page]').textContent.trim()`)) === 'Today');
  check('…it says what it looks at, that nothing is sent, and that nothing changes unless you say so', /nothing is sent anywhere/.test(await text('#app')) && /changes nothing unless you say so/.test(await text('#app')) && /Patterns, not judgements/.test(await text('#app')));
  check('…nothing to show yet, said kindly', (await text('#noticedEmpty')).includes('Nothing to show yet'));
  check('…your preferences: no limits to start with', (await ev(`['learning','admin','health'].map(c => document.getElementById('prefMin-' + c).value).join() + '|' + document.getElementById('prefTasks').value`)) === ',,|');

  console.log('\n[2] A pattern from your history');
  await editStorage(seed);
  await go('today', 2026, 10, 15, 9, 5);
  check('Today: one quiet line, "2 new" (shorter learning tasks, and sleep and energy)', (await text('#noticedLink')).includes('MyDay noticed something about how you work') && (await text('#noticedLink')).includes('2 new'), await text('#noticedLink'));
  await click('[data-action=noticed-open]'); await sleep(300);
  const card = '.pattern[data-id="size:learning"]';
  check('the pattern: "Shorter learning tasks get done more often", an early sign, 16 examples since its first day', (await text(`${card} h3`)) === 'Shorter learning tasks get done more often' && (await text(`${card} .eyebrow`)) === 'Early sign · 16 examples since Tue 29 Sept', await text(`${card} .eyebrow`));
  check('…its evidence is behind "Why?"', (await ev(`document.querySelector('${card} .why-text').hidden`)));
  await click(`${card} [data-action=why]`); await sleep(150);
  check('…"Why?" shows it, in numbers', !(await ev(`document.querySelector('${card} .why-text').hidden`)) && (await text(`${card} .why-text`)) === 'In the last 8 weeks, 7 of 9 learning tasks of 25 min or less were ticked off, compared with 2 of 7 longer ones.');
  check('…and says what MyDay could do with it', (await text(`${card} [data-s=use]`)) === "If that's right, MyDay can: Keep learning tasks to 25 min or less when building my day.");
  await click(`${card} [data-action=pattern-use]`); await sleep(300);
  let pt = await pats();
  check('"Yes — do that": your answer, and a preference for learning tasks of up to 25 min, with what it was based on', pt.answers['size:learning'].said === 'yes' && pt.answers['size:learning'].examples === 16
    && pt.prefs.maxMinutes.learning.value === 25 && pt.prefs.maxMinutes.learning.from === 'size:learning' && pt.prefs.maxMinutes.learning.why.startsWith('MyDay noticed: In the last 8 weeks, 7 of 9'), pt);
  check('…it moves to "You said these are right"; the preference shows 25 min, and where it came from', (await text('#noticedYes')).includes('Shorter learning tasks get done more often') && (await ev(`document.getElementById('prefMin-learning').value`)) === '25'
    && (await text('#prefsCard [data-s=pref-from]')).includes('Learning: from “Shorter learning tasks get done more often”'));
  const sleepCard = '.pattern[data-id="sleep-energy"]';
  check('another one, with nothing to change: "Your energy is usually lower after a short night" — "That\'s right" or "Not really"', (await text(`${sleepCard} h3`)) === 'Your energy is usually lower after a short night' && !(await exists(`${sleepCard} [data-action=pattern-use]`)) && (await exists(`${sleepCard} [data-action=pattern-yes]`)));
  await click(`${sleepCard} [data-action=pattern-no]`); await sleep(300);
  check('"Not really" → hidden, and it says it won\'t come back without clearly more evidence', !(await exists(sleepCard)) && (await pats()).answers['sleep-energy'].said === 'no' && (await text('#toast')).includes("won't show this again unless there's clearly more evidence"));
  await go('today', 2026, 10, 15, 9, 10);
  check('Today: the quiet line has gone (nothing new)', !(await exists('#noticedLink')));

  console.log('\n[3] Build my day uses it, in the open');
  await ev(`(() => { const el = document.getElementById('energy'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '4'); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await click('[data-action=build]'); await sleep(300);
  const learn = `[...document.querySelectorAll('#proposalCard .prop-item')].find(li => li.textContent.includes('Pharmacology'))`;
  check('the learning task: "25 min (shortened from 60)", with a note', (await ev(`${learn}.querySelector('.meta').textContent`)).includes('25 min (shortened from 60)') && (await ev(`${learn}.querySelector('.why-note').textContent`)).includes('Shortened to 25 min — your length for learning tasks.'));
  await ev(`${learn}.querySelector('[data-action=why]').click()`); await sleep(150);
  check('…and "Why?" shows what it\'s based on', (await ev(`${learn}.querySelector('.why-text').textContent`)).startsWith('MyDay noticed: In the last 8 weeks, 7 of 9 learning tasks'));
  check('…other tasks unchanged, with no note', (await ev(`[...document.querySelectorAll('#proposalCard .prop-item')].filter(li => !li.textContent.includes('Pharmacology')).every(li => !li.querySelector('.why-note'))`)));
  await click('[data-action=prop-apply]'); await sleep(300);
  let t = (await data()).days[K].tasks.find(x => x.title === 'Pharmacology');
  check('applied: 25 min, keeping that it was 60', t.minutes === 25 && t.baseMinutes === 60);

  console.log('\n[4] Your preferences');
  await go('noticed', 2026, 10, 15, 9, 20);
  await type('#prefTasks', '1'); await sleep(250);
  check('"Most tasks in a day: Just 1" is saved, as your own choice', (await pats()).prefs.maxTasks.value === 1 && (await pats()).prefs.maxTasks.why === 'You chose this in What MyDay has noticed.');
  await go('today', 2026, 10, 16, 8);
  await ev(`(() => { const el = document.getElementById('energy'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '5'); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await click('[data-action=build]'); await sleep(300);
  check('Build my day at energy 5 proposes 1 task, and says why ("1 task today, as you chose (your energy allows 3).")', (await ev(`document.querySelectorAll('#proposalCard .prop-item').length`)) === 1 && (await text('#proposalCard')).includes('1 task today, as you chose (your energy allows 3).') && (await text('#proposalCard')).includes('room for 1 task'));
  await click('[data-action=prop-cancel]'); await sleep(200);
  await go('noticed', 2026, 10, 16, 8, 5);
  await type('#prefTasks', ''); await type('#prefMin-admin', '15'); await sleep(250);
  pt = await pats();
  check('back to "as my energy allows"; a length for admin tasks', pt.prefs.maxTasks === null && pt.prefs.maxMinutes.admin.value === 15);
  await click('#noticedYes [data-action=pattern-forget]'); await sleep(300);
  check('"Forget my answer": the pattern is new again; your preference stays', !(await exists('#noticedYes')) && (await exists('.pattern[data-id="size:learning"]')) && (await pats()).prefs.maxMinutes.learning.value === 25);
  check('…and since 25 min is already your choice, it says so', (await text('.pattern[data-id="size:learning"] [data-s=use]')).endsWith('when building my day (you already chose this).'));

  console.log('\n[5] A task that keeps moving');
  await editStorage(`s => { const base = { listId: '', category: 'admin', minutes: 30, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-01T10:00', blockers: [], letGoOn: null };
    s.tasks.items.push({ ...base, id: 'tkStuck', title: 'Sort out the bills', due: '2026-10-16', postponed: 3 }, { ...base, id: 'tkFine', title: 'Return the parcel', due: '2026-10-18', postponed: 0 }); }`);
  await go('inbox/tasks', 2026, 10, 16, 9);
  check('in Tasks, a task moved 3 times says "Something in the way?"; others don\'t', (await text('.task-row[data-id=tkStuck] [data-s=stuck]')) === 'Something in the way?' && !(await exists('.task-row[data-id=tkFine] [data-s=stuck]')));
  await go('today', 2026, 10, 16, 9, 5);
  check('…on Today too ("Due today")', (await text('#dueToday .due-li[data-id=tkStuck] [data-s=stuck]')) === 'Something in the way?');
  await go('inbox/tasks/tkStuck', 2026, 10, 16, 9, 10);
  check('opening it asks "What\'s getting in the way?", kindly', (await exists('#stuckCard')) && (await text('[data-s=stuck-intro]')) === "This one has moved 3 times. That's useful to know, not a problem — let's change the task, not push harder.");
  check('…with seven answers', eq(await ev(`[...document.querySelectorAll('[data-s=blocker]')].map(b => b.textContent)`), ["It's too big", "I don't know where to start", "It's boring", "I'm too tired for it", "I'm missing something I need", "It doesn't matter any more", 'Something else']));
  await click('[data-s=blocker][data-id=start]'); await sleep(150);
  check('"I don\'t know where to start" asks for the very first step (and waits for it)', (await text('label[for=stuckText]')) === "What's the very first step?" && (await ev(`document.querySelector('[data-action=unstick]').disabled`)));
  await type('#stuckText', 'find the latest bill'); await click('[data-action=unstick]'); await sleep(300);
  let items = (await data()).tasks.items;
  const step = items.find(x => x.title === 'find the latest bill');
  t = items.find(x => x.id === 'tkStuck');
  check('…that step becomes a 10-minute task for today; the whole task waits under Any time; the answer is kept', step && step.minutes === 10 && step.due === '2026-10-16' && t.due === null && t.postponed === 0 && eq(t.blockers, [{ reason: 'start', on: '2026-10-16' }]), [step, t]);
  check('…it says so, and the question has gone', (await text('#toast')).includes('Added “find the latest bill” for today (10 min). “Sort out the bills” waits under Any time.') && !(await exists('#stuckCard')));
  await go('inbox/tasks/tkFine', 2026, 10, 16, 9, 15);
  check('a task that isn\'t stuck doesn\'t ask — but "Something in the way?" is there', !(await exists('#stuckCard')) && (await exists('[data-action=task-stuck]')));
  await click('[data-action=task-stuck]'); await sleep(200);
  await click('[data-s=blocker][data-id=tired]'); await sleep(150);
  check('"I\'m too tired for it" offers the weekend when there\'s no rota (Sat 17 Oct)', (await text('[data-action=unstick]')) === 'Move it to Sat 17 Oct');
  await click('[data-s=blocker][data-id=notneeded]'); await sleep(150);
  await click('[data-action=unstick]'); await sleep(300);
  t = (await data()).tasks.items.find(x => x.id === 'tkFine');
  check('"It doesn\'t matter any more" → let go, said kindly', t.letGoOn === '2026-10-16' && (await text('#toast')).includes("Deciding something doesn't matter any more is useful too.") && (await text('[data-action=task-toggle]')) === 'Let go — bring it back');
  await go('inbox/tasks', 2026, 10, 16, 9, 20);
  await click('[data-action=tasks-done-toggle]'); await sleep(200);
  check('…it\'s under Done, marked "Let go"', (await text('#tasks-done .task-row[data-id=tkFine] [data-s=let-go]')) === 'Let go');
  await click('[data-s=task-done][data-id=tkFine]'); await sleep(300);
  check('…unticking brings it back', (await data()).tasks.items.find(x => x.id === 'tkFine').letGoOn === null);

  console.log('\n[6] Saved data');
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  await click('[data-action=export]'); await sleep(1200);
  const exported = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-16.json', 'utf8'));
  check('"Export my data" includes your preferences and answers', eq(exported.data.patterns, await pats()));
  const savedNew = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  T.setUrl('index.html#today'); await openAt(2026, 10, 16, 10);
  await click('#themeBtn'); await sleep(300);
  const afterClassic = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  check('the current MyDay keeps them, and the tasks\' new fields, exactly when it saves', afterClassic.settings.theme !== savedNew.settings.theme && eq(afterClassic.patterns, savedNew.patterns) && eq(afterClassic.tasks, savedNew.tasks));
  check('…and today\'s plan with the shortened task as an ordinary plan task', afterClassic.days[K].tasks.find(x => x.title === 'Pharmacology').minutes === 25);

  console.log('\n[7] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const theme of ['dark', 'light']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    for (const h of ['noticed', 'inbox/tasks/tkFine']) {
      await go(h, 2026, 10, 16, 11);
      if (h !== 'noticed') { await click('[data-action=task-stuck]'); await sleep(200); }
      check(`phone (${theme}), #${h}: nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
      const small = await ev(`[...document.querySelectorAll('#app button, #app select, #app input')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44)`);
      check(`phone (${theme}), #${h}: every button and field is at least 44 × 44 px`, small.length === 0, small.slice(0, 5));
    }
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
