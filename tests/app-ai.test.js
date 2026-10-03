// "Help me adjust today" in the browser, end to end, with made-up data only:
//   - the usual build (no AI set up): nothing changes;
//   - practice mode (VITE_AI=mock): no account, no network, simple rules instead of AI;
//   - with an account (VITE_AI=edge): the app → the ai-plan Edge Function's real code in the Supabase stand-in
//     (sign-in, limits in the database) → a mock model. NOT a real model and NOT a real Supabase project.
// Checks: suggestions are only saved after "Use this plan", rules hold, stale suggestions are refused, Undo works,
// failures leave the plan alone, limits are explained, nothing private is sent or logged, and the layout fits.
const T = require('./cdp-devices.js');
const S = require('./supabase-standin.js');
const { check, summary } = require('./cdp.js');
const { sleep } = T;

const HTTP = process.env.MYDAY_HTTP_PORT || 8765, SUPA = Number(process.env.MYDAY_SUPA_PORT || 54329);
const PLAIN = `http://127.0.0.1:${HTTP}/app/dist/index.html`, MOCK = `http://127.0.0.1:${HTTP}/aimock/index.html`, EDGE = `http://127.0.0.1:${HTTP}/sync/index.html`;
const A = { email: 'ai-test-a@example.test', password: 'disposable-ai-a' };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// The page clock: today, at 10:00 (or now, if that's earlier), so there's always day left to plan. Never ahead of
// the real time, so sign-in tokens never look expired.
const real = new Date(), at10 = new Date(real.getFullYear(), real.getMonth(), real.getDate(), 10, 0);
const base = Math.min(real.getTime(), at10.getTime());
const TODAY = `${real.getFullYear()}-${String(real.getMonth() + 1).padStart(2, '0')}-${String(real.getDate()).padStart(2, '0')}`;
const clockScript = `(() => { const RD = Date, base = ${base}, start = RD.now(); class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(base + (RD.now() - start)); } static now() { return base + (RD.now() - start); } } window.Date = FD; })();`;

const task = (uid, title, category, minutes, x = {}) => ({ uid, taskId: 'list-' + uid, category, title, minutes, baseMinutes: minutes, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null, ...x });
const SEED = `s => {
  s.days['${TODAY}'] = { energy: 2, rest: false, builtAt: '${TODAY}T08:00', checkedIn: false, tasks: ${JSON.stringify([task('ta', 'Course section', 'learning', 30), task('tb', 'Batch cook', 'admin', 45), task('tc', 'Gym', 'health', 60)])} };
  s.context['${TODAY}'] = { energy: 2, sleep: { start: null, end: null, estimatedHours: 7 } };
  s.commitments = [{ id: 'c1', kind: 'appointment', title: 'Dentist Dr Who', start: '${TODAY}T18:00', end: '${TODAY}T18:30' }];
}`;

(async () => {
  const db = await S.createDb();
  const srv = await S.start(db, SUPA);
  const userA = await S.addUser(db, A.email, A.password);
  const aiCalls = () => srv.log.filter(e => e.path === '/functions/v1/ai-plan');
  const setAi = o => Object.assign(srv.aiEnv, o);
  await T.connect();

  async function device(name) {
    const D = await T.device(name, require('os').tmpdir() + '/myday-ai-' + name);
    await D.send('Page.addScriptToEvaluateOnNewDocument', { source: clockScript });
    return D;
  }
  const open = async (D, url) => { await D.open(url + '#today'); await D.until(`document.querySelector('#app')`); };
  const seeded = async (D, url) => { await open(D, url); await D.setData(SEED); await D.until(`document.querySelector('[data-action=evening]')`); };
  const ask = async (D, note = '') => {
    if (!(await D.exists('#aiCard'))) { await D.click('[data-action=ai-open]'); await D.until(`document.getElementById('aiCard')`); }
    if (!(await D.exists('#aiNote'))) { await D.click('[data-action=ai-retry], [data-action=ai-again]'); await D.until(`document.getElementById('aiNote')`); }
    if (note) await D.type('#aiNote', note);
    await D.click('[data-action=ai-ask]');
    await D.until(`['review', 'error'].includes(document.getElementById('aiCard')?.dataset.phase)`, 15000);
    return D.ev(`document.getElementById('aiCard').dataset.phase`);
  };
  const close = D => D.ev(`document.querySelector('[data-action=ai-cancel]')?.click()`);
  const plan = async D => (await D.data()).days[TODAY];

  console.log('\n[1] Without AI set up, nothing changes');
  const plain = await device('plain');
  await seeded(plain, PLAIN);
  check('the usual build has no "Help me adjust today"', !(await plain.exists('[data-action=ai-open]')) && (await plain.exists('[data-action=review]')));

  console.log('\n[2] Practice mode (no account, no AI, nothing sent)');
  const mock = await device('mock');
  await seeded(mock, MOCK);
  const logBefore = srv.log.length;
  check('"Help me adjust today" is on the plan, as a secondary action', await mock.ev(`(() => { const b = document.querySelector('[data-action=ai-open]'); return !!b && b.dataset.variant !== 'primary'; })()`));
  await mock.click('[data-action=ai-open]'); await mock.until(`document.getElementById('aiNote')`);
  check('it explains it\'s practice mode and nothing is sent anywhere', (await mock.text('#aiCard')).includes('Practice mode') && (await mock.text('#aiCard')).includes('Nothing is sent anywhere'));
  const before = await mock.data();
  check('the reply is reviewed first', (await ask(mock, 'I slept badly and only have 20 minutes')) === 'review' && (await mock.text('#aiCard')).includes('not saved yet') && (await mock.text('#aiCard')).includes('practice planner'));
  check('…energy 2: one small task suggested, the others shown as waiting in the queue', (await mock.ev(`document.querySelectorAll('#aiPriorities .ai-item').length`)) === 1 && (await mock.text('#aiLater')).includes('Waits in your queue'));
  check('nothing is saved before "Use this plan"', eq((await mock.data()).days, before.days) && eq((await mock.data()).queue, before.queue));
  await mock.click('[data-action=ai-use]'); await sleep(300);
  let after = await mock.data();
  const p0 = after.days[TODAY];
  check('"Use this plan" saves it: one task, at most 20 minutes, the others in the queue', p0.tasks.length === 1 && p0.tasks[0].minutes <= 20 && after.queue.length === 2, p0.tasks.map(t => [t.title, t.minutes]));
  check('…the task lists, the task\'s usual length and the energy rating are unchanged', eq(after.lists, before.lists) && p0.tasks[0].baseMinutes === before.days[TODAY].tasks.find(t => t.uid === p0.tasks[0].uid).baseMinutes && p0.energy === 2 && after.context[TODAY].energy === 2);
  check('…and it says so, with Undo', (await mock.text('#toast')).includes('Plan updated') && (await mock.exists('[data-action=ai-undo]')));
  await mock.click('[data-action=ai-undo]'); await sleep(300);
  after = await mock.data();
  check('Undo puts the plan and the queue back exactly', eq(after.days[TODAY], before.days[TODAY]) && eq(after.queue, before.queue) && (await mock.text('#toast')).includes('Put back'));
  check('practice mode contacted no server', srv.log.length === logBefore);

  console.log('\n[2b] "Add what\'s on my mind" (practice mode)');
  const MIND_SEED = SEED.replace(/}$/, `  s.lists.admin.push({ id: 'a-gp', title: 'Call the GP', minutes: 10 });\n}`);
  await open(mock, MOCK); await mock.setData(MIND_SEED); await mock.until(`document.querySelector('[data-action=evening]')`);
  check('"Add what\'s on my mind" is on the plan, as a secondary action', await mock.ev(`(() => { const b = document.querySelector('[data-action=mind-open]'); return !!b && b.dataset.variant !== 'primary'; })()`));
  await mock.click('[data-action=mind-open]'); await mock.until(`document.getElementById('mindText')`);
  check('it says what\'s sent (here: nothing — practice mode)', (await mock.text('#mindCard')).includes('Practice mode') && (await mock.text('#mindCard')).includes('Nothing is sent anywhere'));
  const beforeMind = await mock.data();
  await mock.type('#mindText', "car insurance renewal\ncall the GP\nI'm so tired this week\nstretch every morning");
  await mock.click('[data-action=mind-ask]'); await mock.until(`document.getElementById('mindCard')?.dataset.phase === 'review'`);
  const items = await mock.ev(`[...document.querySelectorAll('#mindItems .mind-item')].map(li => ({ t: li.querySelector('.font-medium').textContent, on: li.querySelector('input').checked, already: li.querySelector('.mind-already')?.textContent || '' }))`);
  check('three small tasks suggested; "Call the GP" is already on the Admin list, so it starts unticked', items.length === 3 && items.find(i => /GP/i.test(i.t)).on === false && /Admin list/.test(items.find(i => /GP/i.test(i.t)).already) && items.filter(i => i.on).length === 2, items);
  check('the feeling isn\'t made a task — it\'s listed back under "Not turned into tasks"', (await mock.text('#mindNotTasks')).includes("so tired"));
  check('nothing is saved before "Add"', eq((await mock.data()).lists, beforeMind.lists) && eq((await mock.data()).queue, beforeMind.queue));
  check('"stretch every morning" is suggested as repeating; the others one-off', await mock.ev(`(() => { const li = [...document.querySelectorAll('#mindItems .mind-item')].find(l => /stretch/i.test(l.textContent)); return li.querySelector('[data-s=mind-repeat]').getAttribute('aria-pressed') === 'true'; })()`));
  check('the button says how many will be added', (await mock.text('[data-action=mind-add]')).includes('Add 2 tasks'));
  await mock.click('[data-action=mind-add]'); await sleep(300);
  let afterMind = await mock.data();
  const qMind = afterMind.queue.find(q => /insurance/i.test(q.title));
  check('"Add": the one-off goes to the queue (no list of its own), the repeating one to the end of the Health list', qMind && qMind.taskId === null && qMind.queuedOn === TODAY && /stretch/i.test(afterMind.lists.health[afterMind.lists.health.length - 1].title), { queue: afterMind.queue, health: afterMind.lists.health.slice(-1) });
  check('…"Call the GP" isn\'t added twice; today\'s plan, energy and the other lists are untouched', afterMind.lists.admin.filter(x => /GP/i.test(x.title)).length === 1 && eq(afterMind.days, beforeMind.days) && eq(afterMind.context, beforeMind.context) && eq(afterMind.lists.learning, beforeMind.lists.learning));
  check('…and it says so, with Undo', (await mock.text('#toast')).includes('Added 2 tasks') && (await mock.exists('[data-action=mind-undo]')));
  await mock.click('[data-action=mind-undo]'); await sleep(300);
  afterMind = await mock.data();
  check('Undo takes back exactly what was added', eq(afterMind.lists, beforeMind.lists) && eq(afterMind.queue, beforeMind.queue) && (await mock.text('#toast')).includes('Taken back'));
  await mock.setData(`s => { delete s.days['${TODAY}']; }`); await mock.until(`document.querySelector('[data-action=build]')`);
  check('before the day is built it\'s there too (queued tasks are picked first when you build)', await mock.exists('#slot-energy [data-action=mind-open]'));
  check('practice mode still contacted no server', srv.log.length === logBefore);

  console.log('\n[3] With an account: the ai-plan Edge Function (its real code, a mock model)');
  const D = await device('edge');
  await seeded(D, EDGE);
  check('signed out: it asks you to sign in, and nothing is sent', (await ask(D)) === 'error' && (await D.text('#aiCard')).includes('Sign in to use AI help') && aiCalls().length === 0);
  await close(D);
  await D.ev(`location.hash = 'sync'`); await D.until(`document.getElementById('syncEmailInput')`);
  await D.type('#syncEmailInput', A.email); await D.type('#syncPassword', A.password); await D.click('[data-action=sync-signin]');
  await D.until(`document.getElementById('syncScreen').dataset.phase === 'setup'`);
  await D.ev(`location.hash = 'today'`); await D.until(`document.querySelector('[data-action=ai-open]')`);
  const before3 = await D.data();
  check('signed in: a suggestion comes back from the server', (await ask(D, 'only 20 minutes please')) === 'review' && (await D.text('#aiCard')).includes('Mock planner'));
  const sent = aiCalls().slice(-1)[0];
  check('…the request was signed in as you, with today\'s context', sent && sent.user === userA && sent.body.context.date === TODAY && sent.body.context.note === 'only 20 minutes please');
  check('…appointment names aren\'t sent (only "appointment" and its time)', !JSON.stringify(sent.body).includes('Dentist') && sent.body.context.busy.some(b => b.kind === 'appointment'));
  check('…the server logs no content (just an outcome and a time)', srv.aiLog.every(l => /^ai-plan \S+ \d{3} \d+ms$/.test(l)) && !srv.aiLog.join(' ').includes('20 minutes'), srv.aiLog);
  await D.click('[data-action=ai-cancel]'); await sleep(150);
  check('"Not now" closes it, and nothing was saved', !(await D.exists('#aiCard')) && eq((await D.data()).days, before3.days));

  console.log('\n[4] A model breaking the rules: corrected before you see it');
  setAi({ AI_MODEL: 'mock:sloppy' });
  check('the suggestion still keeps to energy 2: one task, from the plan', (await ask(D)) === 'review' && (await D.ev(`document.querySelectorAll('#aiPriorities .ai-item').length`)) === 1 && !(await D.text('#aiCard')).includes('made-up'));
  check('…what was corrected is listed in plain words', (await D.text('#aiAdjusted summary')).startsWith('Adjusted to fit MyDay') && (await D.text('#aiAdjusted')).includes('energy 2'));
  check('…and the pushy explanation is replaced with a gentle one', !(await D.text('#aiExplanation')).includes('should') && (await D.text('#aiExplanation')).includes('completely fine'));
  check('…its minutes kept small (20 at most)', await D.ev(`/^\\s*(5|10|15|20) min/.test(document.querySelector('#aiPriorities .ai-minutes').textContent)`), await D.text('#aiPriorities .ai-minutes'));
  await close(D);

  console.log('\n[5] Replies that can\'t be used, and failures: the plan is left alone');
  const keep = JSON.stringify((await D.data()).days[TODAY]);
  for (const [what, setup, phrase] of [
    ['a reply that isn\'t JSON', () => setAi({ AI_MODEL: 'mock:invalid' }), "couldn't be used"],
    ['a reply whose JSON stops half-way', () => setAi({ AI_MODEL: 'mock:partial' }), "couldn't be used"],
    ['a reply cut off at the length limit', () => setAi({ AI_MODEL: 'mock:truncated' }), "Couldn't get a suggestion just now"],
    ['the model failing', () => setAi({ AI_MODEL: 'mock:error' }), "Couldn't get a suggestion just now"],
    ['the server failing (503)', () => { setAi({ AI_MODEL: 'mock:good' }); srv.faults.push({ path: '/functions/v1/ai-plan', mode: 'error', times: 1 }); }, "Couldn't get a suggestion just now"],
    ['AI not set up on the server', () => setAi({ AI_PROVIDER: 'none' }), "isn't set up on the server"],
  ]) {
    setup();
    const ph = await ask(D);
    check(`${what}: a kind message, and the plan is unchanged`, ph === 'error' && (await D.text('#aiCard')).includes(phrase) && JSON.stringify((await D.data()).days[TODAY]) === keep, await D.text('#aiCard'));
    await close(D);
  }
  setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good' });
  await D.offline(true);
  check('offline: "check your connection", and the plan is unchanged', (await ask(D)) === 'error' && (await D.text('#aiCard')).includes('check your connection') && JSON.stringify((await D.data()).days[TODAY]) === keep);
  await close(D); await D.offline(false);
  await D.click('[data-action=review]'); await D.until(`document.getElementById('proposalCard')`);
  check('the ordinary planner still works (Review my plan)', await D.exists('#proposalCard'));
  await D.click('[data-action=prop-cancel]'); await sleep(150);

  console.log('\n[6] Limits');
  const used = (await S.owner(db, 'select requests from public.ai_usage where user_id = $1', [userA])).rows[0].requests;
  setAi({ AI_DAILY_LIMIT: String(used) }); // today's allowance, all used
  check('over the daily limit: "That\'s all the AI suggestions for today"', (await ask(D)) === 'error' && (await D.text('#aiCard')).includes("That's all the AI suggestions for today"));
  await close(D);
  setAi({ AI_DAILY_LIMIT: '50', AI_MIN_SECONDS_BETWEEN: '3600' });
  check('asking again straight away: "Just a moment between requests"', (await ask(D)) === 'error' && (await D.text('#aiCard')).includes('Just a moment'));
  await close(D);
  setAi({ AI_MIN_SECONDS_BETWEEN: '0' });

  console.log('\n[7] A suggestion made before the plan changed is never used');
  await ask(D);
  await D.ev(`document.querySelector('#app .task input').click()`); await sleep(300); // a task ticked meanwhile
  const ticked = JSON.stringify((await D.data()).days[TODAY]);
  await D.click('[data-action=ai-use]'); await sleep(300);
  check('"Use this plan" is refused: your plan changed since', (await D.text('#aiCard')).includes('Your plan changed since this suggestion') && JSON.stringify((await D.data()).days[TODAY]) === ticked);
  await close(D);

  console.log('\n[8] Saved, and still there after a reload');
  await ask(D);
  await D.click('[data-action=ai-use]'); await sleep(300);
  const saved = await plan(D);
  await D.open(EDGE + '#today');
  check('the adjusted plan is saved like any other change', eq(await plan(D), saved) && saved.tasks.some(t => t.done));
  check('…(Undo is for straight after: it isn\'t offered after a reload)', !(await D.exists('[data-action=ai-undo]')));

  console.log('\n[8b] "Add what\'s on my mind" with an account (the Edge Function\'s real code, a mock model)');
  await D.ev(`location.hash = 'today'`); await sleep(200);
  setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good' });
  const callsBefore = aiCalls().length;
  await D.click('[data-action=mind-open]'); await D.until(`document.getElementById('mindText')`);
  check('it says exactly what\'s sent: what you write and today\'s date — not your lists or plan', (await D.text('#mindCard')).includes("what you write here and today's date"));
  await D.type('#mindText', 'book the dentist, revise subnetting');
  await D.click('[data-action=mind-ask]'); await D.until(`['review', 'error'].includes(document.getElementById('mindCard')?.dataset.phase)`);
  check('a suggestion comes back through the function, for review', (await D.ev(`document.getElementById('mindCard').dataset.phase`)) === 'review' && (await D.ev(`document.querySelectorAll('#mindItems .mind-item').length`)) === 2 && aiCalls().length === callsBefore + 1);
  await D.click('[data-action=mind-cancel]'); await sleep(150);

  console.log('\n[9] Layout');
  await D.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await D.ev(`location.hash = 'today'`);
  await mock.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await seeded(mock, MOCK);
  await ask(mock, 'tired');
  check('phone: the suggestion fits (nothing scrolls sideways)', !(await mock.ev('document.documentElement.scrollWidth > innerWidth')));
  const small = await mock.ev(`[...document.querySelectorAll('#aiCard button, #aiCard textarea, #aiCard summary')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 20), h: Math.round(r.height) }; }).filter(x => x.h < 44)`);
  check('phone: its buttons are easy to tap (44 px or more)', small.length === 0, small);
  await mock.ev(`document.querySelector('[data-action=ai-cancel]')?.click()`); await sleep(150);
  await mock.click('[data-action=mind-open]'); await mock.until(`document.getElementById('mindText')`);
  await mock.type('#mindText', 'car insurance renewal, call the dentist about the appointment next week, revise subnetting and VLANs for the exam, stretch every morning');
  await mock.click('[data-action=mind-ask]'); await mock.until(`document.getElementById('mindCard')?.dataset.phase === 'review'`);
  check('phone: "Add what\'s on my mind" fits too (nothing scrolls sideways)', !(await mock.ev('document.documentElement.scrollWidth > innerWidth')));
  const smallM = await mock.ev(`[...document.querySelectorAll('#mindCard button, #mindCard textarea, #mindCard summary, #mindCard label')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 20), h: Math.round(r.height) }; }).filter(x => x.h < 44)`);
  check('phone: its ticks and buttons are easy to tap (44 px or more)', smallM.length === 0, smallM);

  const errs = [plain, mock, D].flatMap(x => x.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.text));
  check('no JavaScript errors', errs.length === 0, errs.slice(0, 3));
  await srv.close();
  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
