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
  check('"What MyDay has noticed" in the footer opens it (the side menu marks its own link, not Today: 1.99.0)', (await hash()) === '#noticed' && (await text('#noticed-h')).includes('What MyDay has noticed') && (await ev(`[...document.querySelectorAll('#nav [aria-current=page]')].map(a => a.textContent.trim()).join()`)) === 'What MyDay has noticed');
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
  await go('today/tasks', 2026, 10, 16, 9);
  check('in Tasks, a task moved 3 times says "Something in the way?"; others don\'t', (await text('.task-row[data-id=tkStuck] [data-s=stuck]')) === 'Something in the way?' && !(await exists('.task-row[data-id=tkFine] [data-s=stuck]')));
  await go('today', 2026, 10, 16, 9, 5);
  check('…on Today too ("Due today")', (await text('#dueToday .due-li[data-id=tkStuck] [data-s=stuck]')) === 'Something in the way?');
  await go('today/tasks/tkStuck', 2026, 10, 16, 9, 10);
  check('opening it asks "What\'s getting in the way?", kindly', (await exists('#stuckCard')) && (await text('[data-s=stuck-intro]')) === "This one has moved 3 times. That's useful to know, not a problem — let's change the task, not push harder.");
  check('…with eight answers, including "I\'m waiting on someone or something" after the missing-something one', eq(await ev(`[...document.querySelectorAll('[data-s=blocker]')].map(b => b.textContent)`), ["It's too big", "I don't know where to start", "It's boring", "I'm too tired for it", "I'm missing something I need", "I'm waiting on someone or something", "It doesn't matter any more", 'Something else']));
  await click('[data-s=blocker][data-id=start]'); await sleep(150);
  check('…and, with AI help off in this build, there is no "Think it through with Ask MyDay" link', (await exists('#stuckText')) && !(await exists('[data-action=stuck-ask]')) && !(await exists('[data-s=stuck-ask]')));
  check('"I don\'t know where to start" asks for the very first step (and waits for it)', (await text('label[for=stuckText]')) === "What's the very first step?" && (await ev(`document.querySelector('[data-action=unstick]').disabled`)));
  await type('#stuckText', 'find the latest bill'); await click('[data-action=unstick]'); await sleep(300);
  let items = (await data()).tasks.items;
  const step = items.find(x => x.title === 'find the latest bill');
  t = items.find(x => x.id === 'tkStuck');
  check('…that step becomes a 10-minute task for today; the whole task waits under Any time; the answer is kept', step && step.minutes === 10 && step.due === '2026-10-16' && t.due === null && t.postponed === 0 && eq(t.blockers, [{ reason: 'start', on: '2026-10-16' }]), [step, t]);
  check('…it says so, and the question has gone', (await text('#toast')).includes('Added “find the latest bill” for today (10 min). “Sort out the bills” waits under Any time.') && !(await exists('#stuckCard')));
  await go('today/tasks/tkFine', 2026, 10, 16, 9, 15);
  check('a task that isn\'t stuck doesn\'t ask — but "Something in the way?" is there', !(await exists('#stuckCard')) && (await exists('[data-action=task-stuck]')));
  await click('[data-action=task-stuck]'); await sleep(200);
  await click('[data-s=blocker][data-id=tired]'); await sleep(150);
  check('"I\'m too tired for it" offers the weekend when there\'s no rota (Sat 17 Oct)', (await text('[data-action=unstick]')) === 'Move it to Sat 17 Oct');
  await click('[data-s=blocker][data-id=notneeded]'); await sleep(150);
  await click('[data-action=unstick]'); await sleep(300);
  t = (await data()).tasks.items.find(x => x.id === 'tkFine');
  check('"It doesn\'t matter any more" → let go, said kindly', t.letGoOn === '2026-10-16' && (await text('#toast')).includes("Deciding something doesn't matter any more is useful too.") && (await text('[data-action=task-toggle]')) === 'Let go — bring it back');
  await go('today/tasks', 2026, 10, 16, 9, 20);
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
    for (const h of ['noticed', 'today/tasks/tkFine']) {
      await go(h, 2026, 10, 16, 11);
      if (h !== 'noticed') { await click('[data-action=task-stuck]'); await sleep(200); }
      check(`phone (${theme}), #${h}: nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
      const small = await ev(`[...document.querySelectorAll('#app button, #app select, #app input')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44)`);
      check(`phone (${theme}), #${h}: every button and field is at least 44 × 44 px`, small.length === 0, small.slice(0, 5));
    }
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[8] Help me start (AI help off in this build)');
  {
    const TODAY = '2026-10-16', TOMORROW = '2026-10-17';
    const base = { listId: '', category: 'admin', minutes: 30, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-01T10:00', due: null, postponed: 0, blockers: [], letGoOn: null };
    const proj = { id: 'pjHs', title: 'Paint the hall', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00', leftOff: { text: 'Bought the paint and a roller', at: '2026-10-14T18:00' } };
    const tk = (id, title, extra = {}) => ({ ...base, id, title, ...extra });
    // Starts the scenario afresh: these tasks (and project), today's plan built or not, no timer.
    const scene = async (items, { built = false, projects = [] } = {}) => {
      await editStorage(`s => { s.tasks = { lists: [], items: ${JSON.stringify(items)} }; s.projects.items = ${JSON.stringify(projects)}; delete s.timer;
        s.days = ${built ? JSON.stringify({ [TODAY]: { energy: 4, rest: false, builtAt: TODAY + 'T08:00', checkedIn: false, tasks: [] } }) : '{}'}; }`);
    };
    const open = async id => { await go('today/tasks/' + id, 2026, 10, 16, 9, 30); await click('[data-action=task-help-start]'); await sleep(200); };
    const pick = async a => { await click(`[data-s=start-answer][data-id=${a}]`); await sleep(120); };
    const chosen = () => ev(`[...document.querySelectorAll('[data-s=start-answer]')].filter(b => b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-checked') === 'true' || b.classList.contains('on') || b.dataset.on === 'true').map(b => b.dataset.id)`);
    const item = async id => (await data()).tasks.items.find(x => x.id === id);

    const notes = 'Quote is at https://example.com/hall-paint?ref=1. Colours are in the folder.';
    const steps = [{ id: 'st1', text: 'Buy masking tape', done: true }, { id: 'st2', text: 'Move the shoe rack', done: false }, { id: 'st3', text: 'Sand the doors', done: false }];
    await scene([tk('tkHs', 'Start the hall', { projectId: 'pjHs', notes, steps, due: TODAY })], { projects: [proj] });
    await go('today/tasks/tkHs', 2026, 10, 16, 9, 30);
    check('an open task\'s page has a "Help me start" button, and no card until you tap it', (await text('[data-action=task-help-start]')) === 'Help me start' && !(await exists('#startCard')));
    await click('[data-action=task-help-start]'); await sleep(200);
    check('tapping it opens the card, "Let’s get started"', (await exists('#startCard')) && (await text('#startCard h3')) === 'Let’s get started', await text('#startCard h3'));
    check('…with seven answers in order: too big, don\'t know where to start, can\'t get going, want it perfect, too tired, pulled away, boring',
      eq(await ev(`[...document.querySelectorAll('[data-s=start-answer]')].map(b => b.dataset.id)`), ['big', 'start', 'going', 'perfect', 'tired', 'pulled', 'boring']), await ev(`[...document.querySelectorAll('[data-s=start-answer]')].map(b => b.textContent)`));
    check('…and none of them chosen', eq(await chosen(), []), await chosen());
    check('Open it: a link to its project, "Open “Paint the hall”"', (await ev(`(() => { const a = [...document.querySelectorAll('[data-s=start-open] a')].find(x => x.textContent === 'Open “Paint the hall”'); return a && a.getAttribute('href'); })()`)) === '#projects/p/pjHs');
    check('…where you left off: "Last time you wrote: “Bought the paint and a roller”"', (await text('[data-s=start-open]')).includes('Last time you wrote: “Bought the paint and a roller”'), await text('[data-s=start-open]'));
    check('…the link in its notes (without the full stop after it), opening in a new tab, and saying so', eq(await ev(`(() => { const a = [...document.querySelectorAll('[data-s=start-open] a')].find(x => x.textContent.startsWith('Open the link in its notes')); return a && [a.getAttribute('href'), a.target, a.textContent.includes('(opens in a new tab)')]; })()`), ['https://example.com/hall-paint?ref=1', '_blank', true]), await text('[data-s=start-open]'));
    check('…its notes, and the next step that isn\'t ticked: "Next step: Move the shoe rack"', (await text('[data-s=start-notes]')) === notes && (await text('[data-s=start-next]')) === 'Next step: Move the shoe rack', [await text('[data-s=start-notes]'), await text('[data-s=start-next]')]);

    await scene([tk('tkBare', 'Tidy the drawer', { due: TODAY })]);
    await open('tkBare');
    check('a task with no project, link, notes or steps says "Get out what you need for it — nothing more yet."', (await text('[data-s=start-open]')).includes('Get out what you need for it — nothing more yet.') && !(await exists('[data-s=start-next]')), await text('[data-s=start-open]'));

    // Answers.
    await scene([tk('tkPf', 'Write the report', { due: TODAY })], { built: true });
    await open('tkPf');
    await pick('perfect');
    check('choosing "I want it perfect" shows "A rough first try still counts as started."', (await text('[data-s=start-rough]')) === 'A rough first try still counts as started.' && eq(await chosen(), ['perfect']), await chosen());
    await pick('perfect');
    check('tapping the same choice again un-chooses it, and the line goes', eq(await chosen(), []) && !(await exists('[data-s=start-rough]')), await chosen());
    await pick('going'); await pick('tired');
    check('choosing one and then another leaves only the last chosen', eq(await chosen(), ['tired']), await chosen());
    check('nothing is kept until you act', eq((await item('tkPf')).blockers, []), (await item('tkPf')).blockers);
    await click('[data-action=start-carry-on]'); await sleep(250);
    check('"Carry on" keeps only the last answer, and closes the card', eq((await item('tkPf')).blockers, [{ reason: 'tired', on: TODAY }]) && !(await exists('#startCard')), (await item('tkPf')).blockers);

    // Tick off.
    await scene([tk('tkTk', 'Clear the hall', { due: TODAY, steps })], { built: true });
    await open('tkTk');
    check('with no answer chosen, "Start for 5 minutes" comes before "Tick off: Move the shoe rack"', (await ev(`document.querySelector('#startCard [data-action=start-five]').compareDocumentPosition(document.querySelector('#startCard [data-action=start-tick]')) & Node.DOCUMENT_POSITION_FOLLOWING`)) > 0);
    await pick('start');
    check('with "I don\'t know where to start" chosen, "Tick off: Move the shoe rack" is offered', (await text('[data-action=start-tick]')) === 'Tick off: Move the shoe rack', await text('[data-action=start-tick]'));
    check('…as the first of the two buttons (the main one)', (await ev(`document.querySelector('#startCard [data-action=start-tick]').compareDocumentPosition(document.querySelector('#startCard [data-action=start-five]')) & Node.DOCUMENT_POSITION_FOLLOWING`)) > 0);
    await click('[data-action=start-tick]'); await sleep(250);
    const tkd = await item('tkTk');
    check('tapping it ticks that step, leaves the others, and keeps the answer', eq(tkd.steps.map(s => s.done), [true, true, false]) && eq(tkd.blockers, [{ reason: 'start', on: TODAY }]), tkd);
    check('…and the next step is now the one after it', (await text('[data-s=start-next]')) === 'Next step: Sand the doors', await text('[data-s=start-next]'));

    // Start for 5 minutes.
    await scene([tk('tkFive', 'Sort the post', { due: TODAY })], { built: true });
    await open('tkFive');
    await pick('pulled');
    await click('[data-action=start-five]'); await sleep(400);
    let dd = await data(), f5 = dd.tasks.items.find(x => x.id === 'tkFive');
    check('"Start for 5 minutes" puts the task on today\'s plan', f5.plannedOn === TODAY && !!f5.planUid && dd.days[TODAY].tasks.some(x => x.uid === f5.planUid), f5);
    check('…and starts the timer for it: kind "start", 5 minutes (300 seconds)', dd.timer && dd.timer.kind === 'start' && dd.timer.durationSec === 300 && dd.timer.uid === f5.planUid, dd.timer);
    check('…keeping the answer as { reason: "other", kind: "pulled" }', eq(f5.blockers, [{ reason: 'other', on: TODAY, kind: 'pulled' }]), f5.blockers);
    check('…and goes to Today, where the timer card shows', (await hash()) === '#today' && (await exists('#timerCard')), await hash());
    check('the timer card says "Just five minutes. You can stop after — starting is the hard part."', (await text('#timerCard')).includes('Just five minutes. You can stop after — starting is the hard part.'), await text('#timerCard'));
    await editStorage(`s => { s.timer.finished = true; s.timer.startedAt = null; s.timer.accumulatedMs = 300000; }`);
    await go('today', 2026, 10, 16, 9, 40);
    check('when the five minutes are done it says "Five minutes done — you started, and that\'s the hardest part."', (await text('#timerCard')).includes('Five minutes done — you started, and that\'s the hardest part.'), await text('#timerCard'));
    check('…and offers "Keep going · 25 min" (the task\'s 30 minutes less the five)', (await text('[data-action=timer-keep]')) === 'Keep going · 25 min', await text('[data-action=timer-keep]'));
    await click('[data-action=timer-keep]'); await sleep(300);
    check('…and keeping going starts a focus timer of 25 minutes', (await data()).timer.kind === 'focus' && (await data()).timer.durationSec === 1500, (await data()).timer);
    await editStorage(`s => { s.timer = { uid: s.tasks.items.find(x => x.id === 'tkFive').planUid, dayKey: '${TODAY}', kind: 'start', durationSec: 120, startedAt: null, accumulatedMs: 120000, finished: true }; }`);
    await go('today', 2026, 10, 16, 9, 45);
    check('Today\'s own two-minute start reads as before: "Two minutes done — …" and "Keep going · 28 min"', (await text('#timerCard')).includes('Two minutes done — you started, and that\'s the hardest part.') && (await text('[data-action=timer-keep]')) === 'Keep going · 28 min', [await text('#timerCard'), await text('[data-action=timer-keep]')]);

    // The timer's already going, or belongs to another task.
    const planned = (uid, id) => ({ ...task(uid, 'admin', 30, false), taskId: id });
    const running = (uid, dur = 1500) => `s => { s.timer = { uid: '${uid}', dayKey: '${TODAY}', kind: 'focus', durationSec: ${dur}, startedAt: new Date(2026, 9, 16, 9, 29, 50).getTime(), accumulatedMs: 0, finished: false }; }`;
    await scene([tk('tkOwn', 'Mend the fence', { due: TODAY, plannedOn: TODAY, planUid: 'puOwn' })], { built: true });
    await editStorage(`s => { s.days['${TODAY}'].tasks.push(${JSON.stringify(planned('puOwn', 'tkOwn'))}); }`); await editStorage(running('puOwn'));
    await open('tkOwn');
    const before = (await data()).timer;
    await click('[data-action=start-five]'); await sleep(400);
    check('when this task\'s own timer is already going, it isn\'t restarted, and says so', eq((await data()).timer, before) && (await text('#toast')).includes('Its timer is already going'), [(await data()).timer, await text('#toast')]);
    await scene([tk('tkSw', 'Post the parcel', { due: TODAY, plannedOn: TODAY, planUid: 'puSw' }), tk('tkOther', 'Mow the lawn', { due: TODAY, plannedOn: TODAY, planUid: 'puOther' })], { built: true });
    await editStorage(`s => { s.days['${TODAY}'].tasks.push(${JSON.stringify(planned('puSw', 'tkSw'))}, ${JSON.stringify(planned('puOther', 'tkOther'))}); }`); await editStorage(running('puOther'));
    await open('tkSw');
    await click('[data-action=start-five]'); await sleep(400);
    const sw = (await data()).timer;
    check('when another task\'s timer is running, it switches to this task for five minutes, and says so', sw.uid === 'puSw' && sw.kind === 'start' && sw.durationSec === 300 && (await text('#toast')).includes('Switched the timer to this task: five minutes'), [sw, await text('#toast')]);

    await scene([tk('tkNoPlan', 'Fold the washing', { due: TODAY })]);
    await open('tkNoPlan');
    check('with no plan built, there is no "Start for 5 minutes", and it says to build the day first', !(await exists('[data-action=start-five]')) && (await text('[data-s=start-no-timer]')).includes('build your day'), await text('[data-s=start-no-timer]'));

    // From Today's plan: Help me start on the Up next task only, opening its page with the card open (focus on it).
    await scene([tk('tkUp', 'Call the plumber', { due: TODAY, plannedOn: TODAY, planUid: 'puUp' }), tk('tkNext2', 'Sort the post', { due: TODAY, plannedOn: TODAY, planUid: 'puNext2' })], { built: true });
    await editStorage(`s => { s.days['${TODAY}'].tasks.push(${JSON.stringify(planned('puUp', 'tkUp'))}, ${JSON.stringify(planned('puNext2', 'tkNext2'))}); }`);
    await go('today', 2026, 10, 16, 9, 30); await sleep(300);
    const helps = await ev(`[...document.querySelectorAll('[data-action=help-start]')].map(b => b.dataset.uid)`);
    check('Today\'s plan offers "Help me start" on the Up next task only', helps.length === 1 && helps[0] === 'puUp' && (await ev(`document.querySelector('.task.next input')?.dataset.uid`)) === 'puUp', helps);
    await click('[data-action=help-start]'); await sleep(500);
    check('…which opens that task\'s page with Help me start open, focus on "Let’s get started"', (await ev('location.hash')) === '#today/tasks/tkUp' && await exists('#startCard')
      && (await ev(`document.activeElement?.id || ''`)) === 'start-h', [await ev('location.hash'), await ev(`document.activeElement?.id || ''`)]);
    await go('today', 2026, 10, 16, 9, 30); await sleep(300);
    await go('today/tasks/tkUp', 2026, 10, 16, 9, 30); await sleep(300);
    check('…and only that once: opening the task again later, the card waits for your tap', !(await exists('#startCard')) && await exists('[data-action=task-help-start]'));
    await editStorage(`s => { s.tasks.items.find(x => x.id === 'tkUp').letGoOn = '${TODAY}'; }`);
    await go('today', 2026, 10, 16, 9, 30); await sleep(300);
    check('a task you\'ve let go gets no "Help me start", even while it\'s still Up next', !(await exists('[data-action=help-start]')));

    // Later, make it smaller, let it go.
    await scene([tk('tkLater', 'Book the plumber', { due: TODAY, postponed: 1 })], { built: true });
    await open('tkLater');
    await click('[data-action=start-later]'); await sleep(250);
    const lt = await item('tkLater');
    check('"Later": due tomorrow, its moves unchanged, and the card closes', lt.due === TOMORROW && lt.postponed === 1 && !(await exists('#startCard')), lt);
    check('…and focus goes back to "Help me start"', (await ev(`document.activeElement?.dataset?.action || ''`)) === 'task-help-start', await ev(`document.activeElement?.outerHTML.slice(0, 100)`));

    await scene([tk('tkSm', 'Clear the garage', { due: TODAY, postponed: 2 })], { built: true });
    await open('tkSm');
    await click('[data-action=start-smaller]'); await sleep(200);
    check('"Make it smaller" asks for a first 10-minute piece', await exists('#startPiece'));
    check('…and "Add it for today" waits for something to be written', await ev(`document.querySelector('[data-action=start-smaller-go]').disabled`));
    await type('#startPiece', 'clear just the workbench'); await click('[data-action=start-smaller-go]'); await sleep(300);
    dd = await data();
    const piece = dd.tasks.items.find(x => x.title === 'clear just the workbench'), orig = dd.tasks.items.find(x => x.id === 'tkSm');
    check('writing it adds a 10-minute task for today', piece && piece.minutes === 10 && piece.due === TODAY, piece);
    check('…the original waits under Any time with its moves started again, and no answer is kept (none was chosen)', orig.due === null && orig.postponed === 0 && eq(orig.blockers, []) && !(await exists('#startCard')), orig);

    await scene([tk('tkSm2', 'Clear the shed', { due: TODAY })], { built: true });
    await open('tkSm2'); await pick('perfect');
    await click('[data-action=start-smaller]'); await sleep(150); await type('#startPiece', 'clear the top shelf'); await click('[data-action=start-smaller-go]'); await sleep(300);
    check('"Make it smaller" with "I want it perfect" chosen keeps exactly that answer, not "too big"', eq((await item('tkSm2')).blockers, [{ reason: 'other', on: TODAY, kind: 'perfect' }]), (await item('tkSm2')).blockers);

    await scene([tk('tkLg', 'Renew the old licence', { due: TODAY })], { built: true });
    await open('tkLg');
    await click('[data-action=start-let-go]'); await sleep(250);
    const lg = await item('tkLg');
    check('"Let it go" with no answer chosen: the task is let go today, no answer is kept, and the card closes', lg.letGoOn === TODAY && eq(lg.blockers, []) && !(await exists('#startCard')), lg);
    await scene([tk('tkLg2', 'Cancel the old magazine', { due: TODAY })], { built: true });
    await open('tkLg2'); await pick('perfect');
    await click('[data-action=start-let-go]'); await sleep(250);
    check('"Let it go" with "I want it perfect" chosen keeps exactly that answer, not "doesn\'t matter any more"', eq((await item('tkLg2')).blockers, [{ reason: 'other', on: TODAY, kind: 'perfect' }]) && (await item('tkLg2')).letGoOn === TODAY, (await item('tkLg2')).blockers);

    await scene([tk('tkCo', 'Water the plants', { due: TODAY })], { built: true });
    await open('tkCo');
    await click('[data-action=start-carry-on]'); await sleep(200);
    check('"Carry on" with no answer closes the card and changes nothing on the task', !(await exists('#startCard')) && eq((await item('tkCo')).blockers, []) && (await item('tkCo')).due === TODAY, await item('tkCo'));

    await scene([tk('tkStuck2', 'Sort out the bills', { due: TODAY, postponed: 3 })], { built: true });
    await go('today/tasks/tkStuck2', 2026, 10, 16, 9, 30);
    check('a stuck task still shows its Stuck card', await exists('#stuckCard'));
    await click('[data-action=task-help-start]'); await sleep(200); await pick('perfect'); await click('[data-action=start-carry-on]'); await sleep(300);
    check('keeping an answer from Help me start doesn\'t hide the Stuck card during the visit', (await exists('#stuckCard')) && eq((await item('tkStuck2')).blockers, [{ reason: 'other', on: TODAY, kind: 'perfect' }]), (await item('tkStuck2')).blockers);

    await scene([tk('tkNoAsk', 'Plan the trip', { due: TODAY })]);
    await open('tkNoAsk');
    await pick('start');
    check('with AI help off in this build, "I don\'t know where to start" has no "Think it through with Ask MyDay"', !(await exists('[data-action=start-ask]')) && !(await exists('[data-s=start-ask]')));

    // What helps you start: kept, learned and confirmed; help that steps back (specs/help-me-start.md §6).
    const ago = n => { const d = new Date(2026, 9, 16 - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const seenOf = async () => (await pats()).startSeen;
    const onlyFields = (x, keys) => eq(Object.keys(x).sort(), keys.slice().sort());
    const clearSeen = () => editStorage(`s => { delete s.patterns.startSeen; delete s.patterns.answers['start-way:admin:five']; }`);

    await clearSeen();
    await scene([tk('tkRecStep', 'Clear the hall', { due: TODAY, steps })], { built: true });
    await open('tkRecStep'); await pick('start');
    await click('[data-action=start-tick]'); await sleep(250);
    let ss = await seenOf();
    check('ticking off the next step in Help me start records one use: way "step", the kind of work, the task and today', ss && ss.length === 1 && ss[0].way === 'step' && ss[0].category === 'admin' && ss[0].taskId === 'tkRecStep' && ss[0].on === TODAY, ss);
    check('…and only those fields, never any words', ss && onlyFields(ss[0], ['way', 'category', 'taskId', 'on']), ss);

    await clearSeen();
    await scene([tk('tkRecFive', 'Sort the post', { due: TODAY })], { built: true });
    await open('tkRecFive');
    await click('[data-action=start-five]'); await sleep(400);
    ss = await seenOf();
    check('"Start for 5 minutes" records one use: way "five", the kind of work, the task and today, and nothing else', ss && ss.length === 1 && ss[0].way === 'five' && ss[0].category === 'admin' && ss[0].taskId === 'tkRecFive' && ss[0].on === TODAY && onlyFields(ss[0], ['way', 'category', 'taskId', 'on']), ss);
    check('the task has not been touched yet while its five minutes are still running', !(await item('tkRecFive')).touched, (await item('tkRecFive')).touched);
    await editStorage(`s => { s.timer.startedAt = s.timer.startedAt - 301000; }`);
    await go('today', 2026, 10, 16, 9, 30); await sleep(2500);
    const fin = await data();
    check('when the five-minute start runs to the end, the task is marked touched today', fin.timer.finished === true && eq((await item('tkRecFive')).touched, [TODAY]), [fin.timer, (await item('tkRecFive')).touched]);

    await clearSeen();
    await scene([tk('tkRecLate', 'Post the form', { due: TODAY })], { built: true });
    await open('tkRecLate');
    await click('[data-action=start-five]'); await sleep(400);
    await editStorage(`s => { s.timer.startedAt = s.timer.startedAt - 400000; }`);
    await go('today', 2026, 10, 16, 9, 30); await sleep(2500);
    check('a five-minute start that ended long ago, found finished when MyDay is opened again, does not mark the task touched', (await data()).timer.finished === true && !(await item('tkRecLate')).touched, [(await data()).timer, (await item('tkRecLate')).touched]);

    await clearSeen();
    await scene([tk('tkRecLater', 'Book the plumber', { due: TODAY })], { built: true });
    await open('tkRecLater');
    await click('[data-action=start-five]'); await sleep(400);
    await open('tkRecLater');
    await click('[data-action=start-five]'); await sleep(400);
    ss = await seenOf();
    check('using "Start for 5 minutes" twice the same day on one task is recorded once', ss && ss.length === 1 && ss[0].way === 'five' && ss[0].excused === undefined, ss);
    await open('tkRecLater');
    await click('[data-action=start-later]'); await sleep(300);
    ss = await seenOf();
    check('"Later" afterwards marks that day\'s use excused (it counts neither for nor against a way)', ss && ss.length === 1 && ss[0].excused === true, ss);
    await clearSeen();
    await scene([tk('tkRecGo', 'Cancel the paper', { due: TODAY, steps })], { built: true });
    await open('tkRecGo'); await pick('start');
    await click('[data-action=start-tick]'); await sleep(250);
    await click('[data-action=start-let-go]'); await sleep(300);
    ss = await seenOf();
    check('"Let it go" afterwards marks that day\'s use of it excused too', ss && ss.length === 1 && ss[0].way === 'step' && ss[0].excused === true, ss);

    await clearSeen();
    await scene([tk('tkRecSm', 'Clear the garage', { due: TODAY, postponed: 2 })], { built: true });
    await open('tkRecSm');
    await click('[data-action=start-smaller]'); await sleep(200);
    await type('#startPiece', 'clear just the workbench'); await click('[data-action=start-smaller-go]'); await sleep(300);
    const madeP = (await data()).tasks.items.find(x => x.title === 'clear just the workbench');
    ss = await seenOf();
    check('"Make it smaller" and "Add it for today" records one use: way "smaller", the kind of work, the task, today and the new piece\'s id', ss && ss.length === 1 && madeP && ss[0].way === 'smaller' && ss[0].category === 'admin' && ss[0].taskId === 'tkRecSm' && ss[0].on === TODAY && ss[0].pieceId === madeP.id, [ss, madeP && madeP.id]);
    check('…and only those fields, never the words of the piece', ss && onlyFields(ss[0], ['way', 'category', 'taskId', 'on', 'pieceId']) && !JSON.stringify(ss).includes('workbench'), ss);

    // The confirmed way comes first.
    await clearSeen();
    const doneBefore = (id, n) => tk(id, 'Past admin ' + id, { touched: [ago(n)] });
    const pastAdmin = [2, 3, 4, 5, 6].map(n => doneBefore('tkPa' + n, n));
    const confirm = `s => { s.patterns.startSeen = ${JSON.stringify([2, 3, 4, 5, 6].map(n => ({ on: ago(n), way: 'five', category: 'admin', taskId: 'tkPa' + n })))};
      s.patterns.answers['start-way:admin:five'] = { said: 'yes', on: '${ago(1)}', examples: 5, title: 'Five-minute starts work for you on admin tasks' }; }`;
    await scene([...pastAdmin, tk('tkAd', 'File the receipts', { due: TODAY }), tk('tkLn', 'Read the chapter', { due: TODAY, category: 'learning' })], { built: true });
    await editStorage(confirm);
    await open('tkAd');
    check('with "a five-minute start" confirmed for admin, an admin task\'s Help me start says "What’s worked for you before: a five-minute start."', (await text('[data-s=start-worked]')) === 'What’s worked for you before: a five-minute start.', await text('[data-s=start-worked]'));
    const firstAct = () => ev(`(() => { let el = [...document.querySelectorAll('#startCard h4')].find(h => h.textContent === 'One small act'); while (el && el.tagName !== 'DIV') el = el.nextElementSibling; const b = el && el.querySelector('button'); return b && b.dataset.action; })()`);
    check('…and "Start for 5 minutes" is the first of the small acts', (await firstAct()) === 'start-five', await firstAct());
    await open('tkLn');
    check('a learning task, with nothing confirmed for learning, has no "What’s worked for you before" line', !(await exists('[data-s=start-worked]')) && (await exists('#startCard')));
    await editStorage(`s => { s.patterns.startSeen.forEach(x => { x.way = 'smaller'; }); delete s.patterns.answers['start-way:admin:five']; s.patterns.answers['start-way:admin:smaller'] = { said: 'yes', on: '${ago(1)}', examples: 5, title: 'Starting with a 10-minute piece works for you on admin tasks' }; }`);
    await open('tkAd');
    check('with a 10-minute piece confirmed, it is the first small act, "A 10-minute piece"', (await firstAct()) === 'start-piece' && (await text('[data-action=start-piece]')) === 'A 10-minute piece' && (await text('[data-s=start-worked]')) === 'What’s worked for you before: starting with a 10-minute piece.', [await firstAct(), await text('[data-s=start-worked]')]);
    await click('[data-action=start-piece]'); await sleep(200);
    check('…tapping it opens the box for the piece and the button goes', (await exists('#startPiece')) && !(await exists('[data-action=start-piece]')));
    await editStorage(`s => { delete s.patterns.answers['start-way:admin:smaller']; s.patterns.answers['start-way:admin:five'] = { said: 'no', on: '${ago(1)}', examples: 5, title: 'x' }; }`);
    await open('tkAd');
    check('…and an admin task has none once that way isn\'t confirmed', !(await exists('[data-s=start-worked]')) && (await exists('#startCard')));
    await clearSeen();

    // Help that steps back, in What MyDay has noticed.
    const doneAdmin = n => [1, 2, 3, 4, 5].slice(0, n).map(i => tk('tkDa' + i, 'Done admin ' + i, { done: true, doneOn: ago(i + 1), due: ago(i + 1), postponed: 0 }));
    await scene(doneAdmin(5));
    await go('noticed', 2026, 10, 16, 9, 30); await sleep(300);
    check('with the last 5 done admin tasks all done on time without moving, What MyDay has noticed says so: "Admin tasks have been getting done on time lately…"', (await exists('[data-s=start-easier]')) && (await text('[data-s=start-easier]')) === 'Admin tasks have been getting done on time lately: your last 5 were done without moving, so MyDay isn’t offering help with them on Today. Help me start is still on every task.', await ev(`document.querySelector('[data-s=start-easier]')?.textContent`));
    await scene(doneAdmin(4));
    await go('noticed', 2026, 10, 16, 9, 30); await sleep(300);
    check('…with only 4 done admin tasks it says nothing about it', !(await exists('[data-s=start-easier]')));
    await scene(doneAdmin(5));
    await editStorage(`s => { s.patterns.prefs.startOffers = false; }`);
    await go('noticed', 2026, 10, 16, 9, 30); await sleep(300);
    check('…and with start offers off it isn\'t shown, since there are none to stop', !(await exists('[data-s=start-easier]')));
    await editStorage(`s => { delete s.patterns.prefs.startOffers; }`);

    // Forgetting what it has learned, when only the uses of Help me start exist.
    await scene([]);
    await editStorage(`s => { s.patterns.startSeen = [{ on: '${ago(2)}', way: 'five', category: 'admin', taskId: 'tkX' }]; s.patterns.answers = {}; delete s.patterns.askSeen; }`);
    await go('noticed', 2026, 10, 16, 9, 30); await sleep(300);
    check('with only uses of Help me start kept, "Forget everything it has learned…" is offered, and says it covers when you used Help me start', (await exists('[data-action=forget-learned]')) && (await text('#forgetLearned')).includes('when you used Help me start'), await ev(`document.querySelector('#forgetLearned')?.textContent`));
    await click('[data-action=forget-learned]'); await sleep(150); await click('[data-action=forget-learned-yes]'); await sleep(300);
    check('…and forgetting clears them', !('startSeen' in (await pats())), await pats());
  }

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
