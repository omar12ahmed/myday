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
const PLUS3 = (() => { const d = new Date(real); d.setDate(d.getDate() + 3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(); // a day for editing a proposal
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
  // (Only calls to the AI function count: another tab's background sync also reaches the stand-in, and is not what these checks are about.)
  const logBefore = aiCalls().length;
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
  check('practice mode made no AI request', aiCalls().length === logBefore);

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
  check('practice mode still made no AI request', aiCalls().length === logBefore);

  console.log('\n[2d] "Add what\'s on my mind" can put tasks into a list in Tasks (practice mode)');
  {
    const itemsL = () => mock.ev(`[...document.querySelectorAll('#mindItems .mind-item')].map(li => { const sel = li.querySelector('[data-s=mind-list]'); return { t: li.querySelector('.font-medium').textContent, on: li.querySelector('input').checked, sel: sel ? sel.value : null, label: sel ? sel.selectedOptions[0].textContent : null, h: sel ? Math.round(sel.getBoundingClientRect().height) : null, where: li.querySelector('[data-s=mind-where]')?.textContent || '' }; })`);
    const pickL = (key, value) => mock.ev(`(() => { const el = document.querySelectorAll('#mindItems [data-s=mind-list]')[${key}]; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('change', { bubbles: true })); return el.value; })()`);
    const openMind = async text => {
      await mock.click('[data-action=mind-open]'); await mock.until(`document.getElementById('mindText')`);
      await mock.type('#mindText', text);
      await mock.click('[data-action=mind-ask]'); await mock.until(`document.getElementById('mindCard')?.dataset.phase === 'review'`);
    };
    await open(mock, MOCK);
    await mock.setData(SEED.replace(/}$/, `  s.tasks.lists = []; s.tasks.items = []; s.queue = []; s.lists.admin = s.lists.admin.filter(x => x.id !== 'a-gp');\n}`)); await mock.until(`document.querySelector('[data-action=evening]')`);
    const before = await mock.data();
    await openMind('Moving house: book a van, pack the books, cancel the broadband\ncall the GP');
    let its = await itemsL();
    check('four tasks suggested; the three under the heading say "Where it goes": “New list: Moving house”, and the one on its own is on “Your queue”',
      its.length === 4 && its.filter(i => i.sel === 'new:Moving house' && i.label === 'New list: Moving house').length === 3 && /GP/i.test(its.find(i => i.sel === '').t) && its.find(i => i.sel === '').label === 'Your queue', its);
    check('the hint says 3 of these go into a new list, “Moving house”, in Tasks', /^3 of these go into a new list, “Moving house”, in Tasks\./.test(await mock.text('[data-s=mind-list-hint]')), await mock.text('[data-s=mind-list-hint]'));
    check('…each line says where it goes (a new list in Tasks, or the queue)', its.filter(i => /Goes into Tasks, in “Moving house” \(a new list\)/.test(i.where)).length === 3 && /Goes in your queue/.test(its.find(i => i.sel === '').where), its.map(i => i.where));
    check('nothing is saved before “Add”', eq((await mock.data()).tasks, before.tasks) && eq((await mock.data()).queue, before.queue));
    check('every “Where it goes” select is at least 44 px tall', its.every(i => i.h >= 44), its.map(i => i.h));
    await mock.click('[data-action=mind-add]'); await sleep(300);
    let after = await mock.data();
    const mhl = after.tasks.lists.filter(l => l.name === 'Moving house');
    const mhi = after.tasks.items.filter(t => mhl[0] && t.listId === mhl[0].id);
    check('Add: Tasks has one list “Moving house” with those 3 tasks, none with a date', mhl.length === 1 && after.tasks.lists.length === 1 && mhi.length === 3 && ['book a van', 'pack the books', 'cancel the broadband'].every(n => mhi.some(t => t.title.toLowerCase().includes(n))) && mhi.every(t => t.due === null), after.tasks);
    check('…and the one on its own went to the queue, not into Tasks', after.queue.length === 1 && /GP/i.test(after.queue[0].title) && after.queue[0].taskId === null && after.tasks.items.length === 3, after.queue);
    check('…the message names “Moving house” as a new list in Tasks, with Undo', (await mock.text('#toast')).includes('3 to “Moving house” (a new list in Tasks)') && (await mock.text('#toast')).includes('1 to your queue') && (await mock.exists('[data-action=mind-undo]')), await mock.text('#toast'));
    check('…today\'s plan and energy are untouched', eq(after.days, before.days) && eq(after.context, before.context));
    await mock.click('[data-action=mind-undo]'); await sleep(300);
    after = await mock.data();
    check('Undo: the 3 tasks and the new list are gone, and the GP task is gone from the queue', after.tasks.lists.length === 0 && after.tasks.items.length === 0 && after.queue.length === 0 && (await mock.text('#toast')).includes('Taken back'), { tasks: after.tasks, queue: after.queue });
    // A list they already have.
    await mock.setData(`s => { s.tasks.lists = [{ id: 'tlErr', name: 'Errands' }]; s.tasks.items = []; s.queue = []; }`); await mock.until(`document.querySelector('[data-action=evening]')`);
    await openMind('errands: buy stamps, post the parcel');
    its = await itemsL();
    check('with a Tasks list “Errands”, both tasks default to “Errands (in Tasks)”, and there is no “new list” hint', its.length === 2 && its.every(i => i.sel === 'id:tlErr' && i.label === 'Errands (in Tasks)') && !(await mock.exists('[data-s=mind-list-hint]')), its);
    await mock.click('[data-action=mind-add]'); await sleep(300);
    after = await mock.data();
    check('Add: both go into Errands, no new list is made, and the message says “in Tasks”', after.tasks.lists.length === 1 && after.tasks.items.length === 2 && after.tasks.items.every(t => t.listId === 'tlErr') && after.queue.length === 0 && (await mock.text('#toast')).includes('2 to “Errands” in Tasks'), [after.tasks, await mock.text('#toast')]);
    await mock.click('[data-action=mind-undo]'); await sleep(300);
    after = await mock.data();
    check('Undo takes the two tasks out and keeps your list “Errands”', after.tasks.items.length === 0 && eq(after.tasks.lists, [{ id: 'tlErr', name: 'Errands' }]));
    // Changing one task's select to the queue.
    await openMind('errands: buy stamps, post the parcel');
    await pickL(1, '');
    its = await itemsL();
    check('changing one task\'s “Where it goes” to “Your queue” updates its line', its[0].sel === 'id:tlErr' && its[1].sel === '' && /Goes in your queue/.test(its[1].where) && /Goes into Tasks, in “Errands”/.test(its[0].where), its);
    await mock.click('[data-action=mind-add]'); await sleep(300);
    after = await mock.data();
    check('Add: just that one goes to the queue; the other goes into Errands', after.queue.length === 1 && /post the parcel/i.test(after.queue[0].title) && after.tasks.items.length === 1 && /buy stamps/i.test(after.tasks.items[0].title) && after.tasks.items[0].listId === 'tlErr', [after.queue, after.tasks.items]);
    await mock.click('[data-action=mind-undo]'); await sleep(300);
    check('practice mode still made no AI request', aiCalls().length === logBefore);
  }

  console.log('\n[3] With an account: the ai-plan Edge Function (its real code, a mock model)');
  const D = await device('edge');
  await open(D, EDGE); await D.until(`localStorage.getItem('myday.data.v4')`); await D.setData(SEED); // once the app has saved its first copy
  check('signed out: MyDay asks you to sign in first (from 1.9.0), so AI help can\'t be reached, and nothing is sent', (await D.until(`document.getElementById('signInGate')`)) && !(await D.exists('[data-action=ai-open]')) && aiCalls().length === 0);
  await D.until(`document.getElementById('syncEmailInput')`);
  await D.type('#syncEmailInput', A.email); await D.type('#syncPassword', A.password); await D.click('[data-action=sync-signin]');
  await D.until(`!document.getElementById('signInGate')`, 15000); // combined with the account by itself, then MyDay opens
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

  console.log('\n[8b] AI help with notes (understand & connect, part 2)');
  setAi({ AI_MODEL: 'mock:good', AI_MIN_SECONDS_BETWEEN: '0' });
  const NP = (id, title, summary) => ({ id, title, summary, stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: TODAY + 'T08:00', updatedAt: TODAY + 'T08:00' });
  // Made-up notes written a few hours before the page's clock: AI help with notes leaves alone a note changed in the
  // last 5 minutes, and before 08:05 "today at 08:00" would still be to come (so this suite failed when run after midnight).
  const pad = n => String(n).padStart(2, '0'), hourBefore = new Date(base - 3 * 3600000); // (three hours, not one: when the clocks go back, the hour from 01:00 to 02:00 happens twice, and a written time one hour before "now" reads the same as now)
  const WRITTEN = `${hourBefore.getFullYear()}-${pad(hourBefore.getMonth() + 1)}-${pad(hourBefore.getDate())}T${pad(hourBefore.getHours())}:${pad(hourBefore.getMinutes())}`;
  const NN = (id, text, x = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: WRITTEN, updatedAt: WRITTEN, ...x });
  await D.ev(`localStorage.removeItem('myday.ai.connect')`);
  await D.setData(`s => { s.projects = { items: [${JSON.stringify(NP('pjPod', 'Start a podcast about nursing', 'Short episodes with nurses about shift work.'))}] };
    s.notes.items = [${[NN('nA', 'Friday meeting with Sam about the podcast'), NN('nPriv', 'Friday meeting with Sam about the podcast budget', { private: true }),
      NN('nPlaced', 'Podcast episode ideas: interview nurses about night shifts'), NN('nWifi', 'Wifi password is in the kitchen drawer')].map(x => JSON.stringify(x)).join(',')}];
    delete s.patterns.prefs.aiNotes; }`);
  const c0 = aiCalls().length;
  await D.ev(`location.hash = 'projects/notes'`); await D.until(`document.getElementById('aiNotes')`); await sleep(6500);
  check('off until you switch it on: nothing is sent (MyDay still places what it can by itself)', aiCalls().length === c0 && (await D.text('#aiNotes')).includes('Off')
    && (await D.data()).notes.items.find(n => n.id === 'nPlaced').linkedBy === 'rules');
  check('the card says exactly what would be sent, and how often', (await D.text('#aiNotes')).includes("never ones you've marked private") && (await D.text('#aiNotes')).includes('At most 2 times a day'));
  await D.click('[data-action=ai-notes]'); await sleep(200);
  check('switching it on is saved with your preferences (so it follows your account)', (await D.data()).patterns.prefs.aiNotes === true);
  const sawIt = await D.until(`(JSON.parse(localStorage.getItem('myday.data.v4')).notes.items.find(n => n.id === 'nA') || {}).aiSeen`, 45000);
  const toastC = await D.text('#toast');
  const sentC = aiCalls().slice(c0);
  const ctxC = sentC[0] && sentC[0].body.context;
  check('a moment later, one request through the function, signed in as you', sawIt && sentC.length === 1 && sentC[0].user === userA && ctxC.action === 'connect', sentC.length);
  check('what was sent: only the notes MyDay couldn\'t place — not the private one, not the one it placed itself — and the project\'s name and summary',
    eq(ctxC.notes.map(n => n.id).sort(), ['nA', 'nWifi']) && !JSON.stringify(ctxC).includes('budget') && !JSON.stringify(ctxC).includes('interview') && eq(ctxC.projects.map(p => p.title), ['Start a podcast about nursing']), ctxC);
  let dn = await D.data(), na = dn.notes.items.find(n => n.id === 'nA');
  check('"Friday meeting with Sam about the podcast" is placed in the podcast project, as AI help\'s link, with why and what kind of note it is',
    na.projectId === 'pjPod' && na.linkedBy === 'ai' && !!na.linkWhy && ['idea', 'task', 'question', 'reference', 'journal', 'other'].includes(na.aiKind), na);
  check('…the wifi note: looked at, no project; the private one: never sent, untouched', !dn.notes.items.find(n => n.id === 'nWifi').projectId && !!dn.notes.items.find(n => n.id === 'nWifi').aiSeen
    && !('aiSeen' in dn.notes.items.find(n => n.id === 'nPriv')) && !dn.notes.items.find(n => n.id === 'nPriv').projectId);
  check('…only links and labels: every note\'s words are as they were', dn.notes.items.find(n => n.id === 'nA').text === 'Friday meeting with Sam about the podcast');
  check('…a message says so', toastC.includes('AI help put 1 note in your projects'), toastC);
  check('"MyDay connected these" lists it with AI help\'s reason, and Undo', (await D.text('#noteConnected')).includes('AI help:'));
  await D.click('#noteConnected [data-action=connected-undo][data-id=nA]'); await sleep(300);
  dn = await D.data(); na = dn.notes.items.find(n => n.id === 'nA');
  check('Undo works the same: out, and never put back in that project', !na.projectId && na.notProjects.includes('pjPod'));
  await sleep(6000);
  check('…and it isn\'t sent again (its words haven\'t changed)', aiCalls().length === c0 + 1);
  await D.setData(`s => { s.notes.items.find(n => n.id === 'nWifi').text = 'Wifi password is in the kitchen drawer, and the podcast mic is in the loft'; }`);
  await D.ev(`location.hash = 'projects/notes'`); await sleep(7000);
  check('a note you change is looked at again (the second request today)', aiCalls().length === c0 + 2);
  await D.setData(`s => { s.notes.items.push(${JSON.stringify(NN('nLate', 'Another thought about the podcast guests list'))}); }`);
  await D.ev(`location.hash = 'projects/notes'`); await sleep(7000);
  check('at most twice a day on a device: the third waits until tomorrow', aiCalls().length === c0 + 2 && !(await D.data()).notes.items.find(n => n.id === 'nLate').aiSeen);
  await D.click('[data-action=ai-notes]'); await sleep(200);
  check('switching it off: saved, and said plainly', !('aiNotes' in (await D.data()).patterns.prefs) && (await D.text('#toast')).includes('nothing more will be sent'));
  await D.ev(`localStorage.removeItem('myday.ai.connect')`); await D.ev(`location.hash = 'projects/notes'`); await sleep(6000);
  check('…and nothing more is sent', aiCalls().length === c0 + 2);
  await D.ev(`location.hash = 'today'`);

  console.log('\n[8c] Revision cards from a note (practice mode: rules on this device, nothing sent)');
  {
    const NOTE = (id, text, x = {}) => ({ id, categoryId: '', title: 'DNS notes', text, pinned: false, createdAt: TODAY + 'T08:00', updatedAt: TODAY + 'T08:00', ...x });
    const TEXT = 'DNS turns names like example.com into IP addresses.\nDHCP leases are always permanent.\nAsk Sam about the router\nNAT lets many devices share one public IP address.';
    await mock.setData(`s => { s.notes.items.push(${JSON.stringify([NOTE('ntCards', TEXT), NOTE('ntClean', 'Retrieval practice means recalling from memory.\nSpacing reviews out over days helps memory.', { title: 'Study' }),
      NOTE('ntPriv', 'A private line that is long enough to be a card.', { private: true }), NOTE('ntLong', Array.from({ length: 61 }, (_, i) => 'Line number ' + i + '.').join('\n'))]).slice(1, -1)}); delete s.patterns.prefs.aiNotes; }`);
    const openNote = async id => { await mock.ev(`location.hash = 'projects/notes/${id}'`); await mock.until(`document.getElementById('noteEditor')`); await sleep(200); };
    const phase = () => mock.ev(`document.getElementById('noteCards')?.dataset.phase`);
    await openNote('ntCards');
    check('with "AI help with notes" off, a note offers no revision cards', !(await mock.exists('#noteCards')));
    await mock.setData(`s => { s.patterns.prefs.aiNotes = true; }`); await openNote('ntCards');
    check('switched on: the note offers "Make revision cards", saying it\'s practice mode and nothing is sent', await mock.exists('#noteCards [data-action="note-cards-ask"]') && (await mock.text('#noteCards')).includes('Nothing is sent anywhere'));
    await openNote('ntPriv');
    check('…but never on a private note', !(await mock.exists('#noteCards')));
    await openNote('ntLong');
    check('…and a note too long for one check says so instead of offering it', (await mock.text('[data-s="note-cards-problem"]')).includes('longer than one check can take') && !(await mock.exists('[data-action="note-cards-ask"]')));
    await openNote('ntCards');
    const before = await mock.data();
    await mock.click('[data-action="note-cards-ask"]'); await mock.until(`document.getElementById('noteCards')?.dataset.phase === 'flags'`, 8000);
    check('the check comes first: the doubtful line is shown with its reason, left out unless you say it\'s right', (await mock.ev(`[...document.querySelectorAll('[data-s="note-flag"]')].map(x => x.dataset.line).join()`)) === '2'
      && (await mock.text('[data-s="note-flag"]')).includes('DHCP leases are always permanent.') && (await mock.text('[data-s="note-flag"]')).includes('“always”') && (await mock.text('[data-action="note-cards-write"]')) === 'Make cards from the other 3 lines');
    await mock.click('[data-action="note-flag-use"]'); await sleep(100);
    check('"It\'s right, use it" brings the line back', (await mock.text('[data-action="note-cards-write"]')) === 'Make cards from all 4 lines' && (await mock.ev(`document.querySelector('[data-action="note-flag-use"]').getAttribute('aria-pressed')`)) === 'true');
    await mock.click('[data-action="note-flag-use"]'); await sleep(100);
    check('…and you can change your mind', (await mock.text('[data-action="note-cards-write"]')) === 'Make cards from the other 3 lines');
    check('nothing is saved by the check, and your note isn\'t changed', JSON.stringify((await mock.data()).notes) === JSON.stringify(before.notes) && (await mock.data()).study.concepts.length === before.study.concepts.length);
    await mock.click('[data-action="note-cards-write"]'); await mock.until(`document.getElementById('noteCards')?.dataset.phase === 'review'`, 8000);
    const fromLines = await mock.ev(`[...document.querySelectorAll('[data-s="note-card"]')].map(x => x.textContent.match(/From lines? ([\\d, ]+) of your note/)?.[1]).join('|')`);
    check('cards come only from the lines kept, each saying which line it came from (not the left-out line, not the reminder)', fromLines === '1|4', fromLines);
    check('…with who wrote and who checked them, and that one doubtful line was left out', (await mock.text('#noteCards')).includes('leaving out one doubtful line') && (await mock.text('#noteCards')).includes('checked by practice checker (no AI)'));
    await mock.click('[data-action="note-cards-add"]'); await sleep(300);
    let nc = (await mock.data()).study.concepts.filter(c => c.origin?.subject === 'note');
    check('Add: the cards become Study concepts due tomorrow, saying they came from this note', nc.length === 2 && nc.every(c => c.origin.noteId === 'ntCards' && c.review.due > TODAY && c.source.startsWith('AI-written from your note “DNS notes” by practice helper (no AI)')));
    check('…your note is still exactly as you wrote it', JSON.stringify((await mock.data()).notes) === JSON.stringify(before.notes));
    await mock.click('[data-action="note-cards-undo"]'); await sleep(300);
    check('Undo takes them out again', !(await mock.data()).study.concepts.some(c => c.origin?.subject === 'note'));
    await mock.click('[data-action="note-cards-ask"]'); await mock.until(`document.getElementById('noteCards')?.dataset.phase === 'flags'`, 8000);
    await mock.type('#noteText', ' Edited.'); await sleep(1200);
    await mock.click('[data-action="note-cards-write"]'); await sleep(300);
    check('if you change the note after its check, it asks you to check again (nothing is sent)', (await phase()) === 'error' && (await mock.text('#noteCards [role=alert]')).includes('changed since it was checked'));
    await openNote('ntClean');
    await mock.click('[data-action="note-cards-ask"]'); await mock.until(`document.getElementById('noteCards')?.dataset.phase === 'review'`, 8000);
    check('a note with nothing doubtful goes straight on to the cards', (await mock.ev(`document.querySelectorAll('[data-s="note-card"]').length`)) === 2 && !(await mock.exists('[data-s="note-flag"]')));
    check('no sideways scrolling', !(await mock.ev('document.documentElement.scrollWidth > innerWidth')));
    await mock.click('[data-action="note-cards-cancel"]'); await mock.ev(`location.hash = 'today'`);
  }

  console.log('\n[8d] Revision cards from a note, with an account: the real server, its 5-second pause between requests on');
  {
    setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model', AI_LEARN_PROVIDER: 'mock', AI_LEARN_MODEL: 'mock:good', AI_LEARN_LABEL: 'Learning model', AI_LEARN_MOCK_DELAY_MS: '150',
      AI_ROUTES: '{"note-check": "learn"}', AI_MIN_SECONDS_BETWEEN: '5' });
    const NOTE = (id, text) => ({ id, categoryId: '', title: 'Study notes', text, pinned: false, createdAt: TODAY + 'T08:00', updatedAt: TODAY + 'T08:00' });
    await D.setData(`s => { s.patterns.prefs.aiNotes = true; s.notes.items.push(${JSON.stringify([NOTE('ntPace1', 'Retrieval practice means recalling from memory.\nSpacing reviews out over days helps memory.'), NOTE('ntPace2', 'DHCP leases are always permanent.\nNAT lets many devices share one public IP address.')]).slice(1, -1)}); }`);
    await D.until(`!document.getElementById('signInGate')`, 15000);
    const run = async (id, tapWrite) => {
      await D.ev(`location.hash = 'projects/notes/${id}'`); await D.until(`document.querySelector('[data-action="note-cards-ask"]')`, 15000);
      const c0 = aiCalls().length, t0 = Date.now();
      await D.click('[data-action="note-cards-ask"]');
      if (tapWrite) { await D.until(`document.querySelector('[data-action="note-cards-write"]')`, 15000); await D.click('[data-action="note-cards-write"]'); }
      await D.until(`['review', 'error'].includes(document.getElementById('noteCards')?.dataset.phase)`, 30000);
      return { phase: await D.ev(`document.getElementById('noteCards')?.dataset.phase`), cards: await D.ev(`document.querySelectorAll('[data-s="note-card"]').length`), calls: aiCalls().slice(c0), ms: Date.now() - t0, text: (await D.text('#noteCards')).slice(0, 160) };
    };
    let r = await run('ntPace1', false);
    check('nothing doubtful, straight on to the cards: they come, without "Just a moment between requests"', r.phase === 'review' && r.cards === 2 && !r.text.includes('Just a moment'), r);
    // (With AI help with notes on, MyDay's automatic connecting may slip a request in between — which is another reason
    // the cards request can be told "too soon", and waits and tries again.)
    const noteCalls = r.calls.filter(c => /^note-/.test(c.body.context.action));
    check('…the check, then the cards, through the server — the cards after the pause', noteCalls.length === 2 && noteCalls[0].body.context.action === 'note-check' && noteCalls[1].body.context.action === 'note-cards' && r.ms >= 5000, r.calls.map(c => c.body.context.action));
    check('…written by one model and checked by the other', (await D.text('#noteCards')).includes('Written by Main model') && (await D.text('#noteCards')).includes('checked by Learning model'));
    await D.click('[data-action="note-cards-cancel"]'); await sleep(6000);
    r = await run('ntPace2', true);
    check('a doubtful line, and "Make cards" tapped at once: the cards still come', r.phase === 'review' && r.cards === 1 && !r.text.includes('Just a moment'), r);
    await D.click('[data-action="note-cards-cancel"]');
    await D.setData(`s => { s.notes.items = s.notes.items.filter(n => !n.id.startsWith('ntPace')); delete s.patterns.prefs.aiNotes; }`); await D.until(`!document.getElementById('signInGate')`, 15000);
    setAi({ AI_LEARN_PROVIDER: null, AI_LEARN_MODEL: null, AI_LEARN_LABEL: null, AI_LEARN_MOCK_DELAY_MS: null, AI_ROUTES: null, AI_LABEL: 'Mock planner', AI_MIN_SECONDS_BETWEEN: '0' });
    await D.ev(`location.hash = 'today'`);
  }

  console.log('\n[8e] "Explain it another way" in revision (practice mode, then through the real server code)');
  {
    const CON = (id, x = {}) => ({ id, title: 'Subnet masks', taskIds: [], createdOn: TODAY, kind: 'written', prompt: 'What does a subnet mask do?', answer: 'It shows which part of an address is the network and which the host.',
      explanation: 'Hosts compare network parts to decide whether a destination is local.', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null }, ...x });
    const toAnswer = async (Dv, typed) => {
      await Dv.ev(`location.hash = 'study/revise'`); await Dv.until(`document.querySelector('[data-action="s-rev-start"]')`, 10000);
      await Dv.click('[data-action="s-rev-start"]'); await Dv.until(`document.getElementById('revTyped')`, 10000);
      if (typed) await Dv.type('#revTyped', typed);
      await Dv.click('[data-action="s-rev-show"]'); await Dv.until(`document.querySelector('[data-s="another-way"]')`, 10000);
    };
    await mock.setData(`s => { s.study.concepts = s.study.concepts.filter(c => c.id !== 'cpMask'); s.study.concepts.push(${JSON.stringify(CON('cpMask'))}); }`);
    await toAnswer(mock, 'It hides your IP address');
    const before = await mock.data();
    check('once the answer is shown: "Explain it another way", saying what it sends', await mock.exists('[data-action="aw-ask"]') && (await mock.text('[data-s="another-way"]')).includes('Sends this question, its answer and your answer'));
    await mock.click('[data-action="aw-ask"]'); await mock.until(`document.querySelector('[data-s="aw-shown"]')`, 8000);
    check('the explanation comes back labelled (practice helper here), using your answer, with "Keep this explanation"', (await mock.text('[data-s="aw-shown"]')).includes('practice helper (no AI)') && (await mock.text('[data-s="aw-shown"]')).includes('It hides your IP address') && await mock.exists('[data-action="aw-keep"]'));
    check('…nothing is saved yet, and your answer and the schedule are untouched', JSON.stringify((await mock.data()).study) === JSON.stringify(before.study));
    await mock.click('[data-action="aw-keep"]'); await sleep(300);
    let kept = (await mock.data()).study.concepts.find(c => c.id === 'cpMask').anotherWay;
    check('"Keep": saved on the card with the model\'s name and the day', !!kept && kept.text.startsWith('Practice helper (no AI)') && kept.by === 'practice helper (no AI)' && kept.on === TODAY);
    check('…and shown on the card straight away, labelled AI-written, with "Remove it"', (await mock.text('[data-s="aw-kept"]')).includes('Your kept explanation · AI-written by practice helper (no AI)') && await mock.exists('[data-action="aw-remove"]'));
    await mock.click('[data-action="s-rev-rate"][data-v="again"]'); await sleep(300);
    await mock.setData(`s => { const c = s.study.concepts.find(x => x.id === 'cpMask'); c.review.due = '${TODAY}'; }`);
    await toAnswer(mock, '');
    check('next time the card comes up, its kept explanation is there under the answer', (await mock.text('[data-s="aw-kept"]')).includes('Practice helper (no AI)') && (await mock.text('[data-action="aw-ask"]')) === 'Explain it another way again');
    await mock.click('[data-action="aw-remove"]'); await sleep(300);
    check('"Remove it" takes it off the card (the card stays)', !('anotherWay' in (await mock.data()).study.concepts.find(c => c.id === 'cpMask')) && !(await mock.exists('[data-s="aw-kept"]')));
    await mock.ev(`location.hash = 'today'`);
    // Through the real server code (the stand-in), signed in: the app's request must be one the server accepts.
    setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model', AI_MIN_SECONDS_BETWEEN: '0' });
    await D.setData(`s => { s.study.concepts = s.study.concepts.filter(c => c.id !== 'cpMask'); s.study.concepts.push(${JSON.stringify(CON('cpMask'))}); }`); await D.until(`!document.getElementById('signInGate')`, 15000);
    const c0 = aiCalls().length;
    await toAnswer(D, 'It hides your IP address');
    await D.click('[data-action="aw-ask"]'); await D.until(`['shown', 'error'].includes(document.querySelector('[data-s="another-way"]')?.dataset.phase)`, 15000);
    const sentE = aiCalls().slice(c0).find(c => c.body.context.action === 'explain');
    check('with an account: the server accepts the app\'s request and answers (by the main model here)', (await D.ev(`document.querySelector('[data-s="another-way"]').dataset.phase`)) === 'shown' && (await D.text('[data-s="aw-shown"]')).includes('AI-written by Main model'), await D.text('[data-s="another-way"]'));
    check('…it sent the question, its answer and explanation, and your answer — nothing else', !!sentE && JSON.stringify(Object.keys(sentE.body.context).sort()) === JSON.stringify(['action', 'answer', 'explanation', 'outcome', 'question', 'subject', 'version', 'yourAnswer']) && sentE.body.context.yourAnswer === 'It hides your IP address', sentE && sentE.body.context);
    await D.click('[data-action="aw-close"]'); await D.ev(`location.hash = 'today'`);
    await D.setData(`s => { s.study.concepts = s.study.concepts.filter(c => c.id !== 'cpMask'); }`); await D.until(`!document.getElementById('signInGate')`, 15000);
  }

  console.log('\n[8f] Ask MyDay in the + Capture sheet (practice mode, then through the real server code)');
  {
    const at = `${TODAY}T09:00`;
    const PJ = { id: 'pjAsk', title: 'Coffee subscription', summary: 'Beans for small offices', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at };
    const NOTE = (id, text, x = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: at, updatedAt: at, ...x });
    const askSeed = `s => { s.projects.items = s.projects.items.filter(p => p.id !== 'pjAsk'); s.projects.items.push(${JSON.stringify(PJ)});
      s.notes.items = s.notes.items.filter(n => !['nAsk', 'nPriv'].includes(n.id)); s.notes.items.push(${JSON.stringify(NOTE('nAsk', 'Roasters sell per kilo', { projectId: 'pjAsk' }))}, ${JSON.stringify(NOTE('nPriv', 'A private worry about money', { private: true }))}); }`;
    const openAsk = async (Dv, hash, text) => {
      await Dv.ev(`location.hash = ${JSON.stringify(hash)}`); await sleep(300);
      await Dv.click('[data-action=capture-open]'); await Dv.until(`document.getElementById('captureText')`);
      await Dv.type('#captureText', text); await sleep(150);
    };
    const askGo = async Dv => { await Dv.click('[data-action=ask-go]'); await Dv.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 15000); return Dv.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`); };
    const closeSheet = Dv => Dv.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`);
    await seeded(mock, MOCK); await mock.setData(askSeed); await mock.until(`document.querySelector('#app')`);
    const logAsk = aiCalls().length;
    await openAsk(mock, 'projects/p/pjAsk', 'Break this into smaller steps');
    check('the + sheet offers Ask MyDay, showing what it sends from this page before you tap (the values themselves)', await mock.exists('[data-action=ask-go]') && (await mock.text('[data-s=ask-sends]')).includes('Project: Coffee subscription') && (await mock.text('[data-s=ask-sends]')).includes('0 tasks, 1 note title') && (await mock.text('#captureSheet')).includes('nothing you type is sent unless you tap Ask MyDay'));
    await mock.ev(`document.querySelector('[data-s=ask-sends-all] summary').click()`); await sleep(150);
    check('…and, expanded, everything: what you typed, the summary and note titles', await mock.ev(`document.querySelector('[data-s=ask-sends-all]').open`) && (await mock.text('[data-s=ask-sends-all]')).includes('Break this into smaller steps') && (await mock.text('[data-s=ask-sends-all]')).includes('Beans for small offices') && (await mock.text('[data-s=ask-sends-all]')).includes('Roasters sell per kilo'));
    check('…and answers: three steps, in this project, labelled as the practice helper', (await askGo(mock)) === 'shown' && (await mock.ev(`document.querySelectorAll('[data-s=ask-item]').length`)) === 3 && (await mock.text('[data-s=ask-panel]')).includes('practice helper (no AI)') && (await mock.text('[data-s=ask-panel]')).includes('in “Coffee subscription”'));
    const before8f = (await mock.data()).tasks.items.length;
    await mock.ev(`document.querySelectorAll('[data-s=ask-pick]')[2].click()`);
    await mock.ev(`(() => { const el = document.querySelectorAll('[data-s=ask-title]')[0]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'Decide what done means'); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    check('nothing is saved before Add', (await mock.data()).tasks.items.length === before8f && (await mock.text('[data-action=ask-add]')).trim() === 'Add 2');
    await mock.click('[data-action=ask-add]'); await sleep(250);
    const added = (await mock.data()).tasks.items.slice(before8f);
    check('Add saves only the ticked ones, with your edit, in the project', added.length === 2 && added[0].title === 'Decide what done means' && added.every(t => t.projectId === 'pjAsk') && (await mock.text('[data-s=ask-added]')).includes('Added 2 tasks'));
    await mock.click('[data-action=ask-undo]'); await sleep(250);
    check('…and Undo takes them back', (await mock.data()).tasks.items.length === before8f);
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'projects/notes/nPriv', 'Summarise this note');
    check('on a private note: the preview says the note isn\'t sent', (await mock.text('[data-s=ask-sends]')).includes('This note: not sent (private)') && !(await mock.text('[data-s=ask-sends]')).includes('private worry'));
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    await askGo(mock);
    check('several things at once: three tasks to tick', (await mock.ev(`[...document.querySelectorAll('[data-s=ask-title]')].map(i => i.value).join('|')`)) === 'Call the bank|Renew passport|Email Sam');
    await mock.ev(`document.querySelectorAll('[data-action=ask-edit]')[1].click()`); await sleep(150);
    const setF = (f, v) => mock.ev(`(() => { const el = document.querySelector('[data-s=ask-edit] [data-f=${f}]'); const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await setF('ask-date', PLUS3); await sleep(100); await setF('ask-time', '10:30'); await setF('ask-minutes', '45'); await setF('ask-list', 'learning'); await sleep(150);
    check('Edit on a card: a day, a time, the length and the list — shown on the card', (await mock.text('[data-s=ask-item]:nth-child(2)')).includes('10:30') && (await mock.text('[data-s=ask-item]:nth-child(2)')).includes('45 min · Learning'));
    await mock.click('[data-action=ask-edit-done]');
    const beforeEd = (await mock.data()).tasks.items.length;
    await mock.ev(`document.querySelectorAll('[data-s=ask-pick]')[0].click()`); await mock.ev(`document.querySelectorAll('[data-s=ask-pick]')[2].click()`);
    await mock.click('[data-action=ask-add]'); await sleep(250);
    const edited = (await mock.data()).tasks.items.slice(beforeEd);
    check('…and Add saves it as edited', edited.length === 1 && edited[0].title === 'Renew passport' && edited[0].due === PLUS3 && edited[0].time === '10:30' && edited[0].minutes === 45 && edited[0].category === 'learning', edited);
    await mock.click('[data-action=ask-undo]'); await sleep(200);
    await closeSheet(mock); await sleep(200);
    // Undo later, from + (the owner's choices of 30 Oct 2026): the last thing Ask did stays undoable at the top of + until
    // midnight, kept on this device; Undo then takes back only what's as Ask left it.
    check('with nothing from Ask today, + has no "last from Ask MyDay" line', await (async () => { await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`); const none = !(await mock.exists('[data-s=ask-last]')); await closeSheet(mock); await sleep(150); return none; })());
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    await askGo(mock);
    const beforeLast = (await mock.data()).tasks.items.length;
    await mock.click('[data-action=ask-add]'); await sleep(250);
    check('…while + is open after adding, the panel has its own Undo and the top line doesn\'t repeat it', await mock.exists('[data-s=ask-added] [data-action=ask-undo]') && !(await mock.exists('[data-s=ask-last]')));
    await closeSheet(mock); await sleep(200);
    await mock.setData(`s => { const t = s.tasks.items.find(x => x.title === 'Call the bank'); t.done = true; t.doneOn = '${TODAY}'; }`); // ticked since (and a reload)
    await mock.until(`document.querySelector('[data-action=capture-open]')`);
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`); await sleep(150);
    const lastLine = await mock.text('[data-s=ask-last]');
    check('reopening + (after a reload too): "Last from Ask MyDay, at HH:MM: added 3 tasks." with Undo, above the text field', /^Last from Ask MyDay, at \d\d:\d\d: added 3 tasks\./.test(lastLine) && await mock.exists('[data-s=ask-last] [data-action=ask-last-undo]')
      && await mock.ev(`!!(document.querySelector('[data-s=ask-last]').compareDocumentPosition(document.getElementById('captureText')) & Node.DOCUMENT_POSITION_FOLLOWING)`), lastLine);
    await mock.click('[data-action=ask-last-undo]'); await sleep(250);
    const afterLast = (await mock.data()).tasks.items;
    check('…Undo takes back what\'s as Ask left it and keeps the one you ticked, saying so', afterLast.length === beforeLast + 1 && afterLast.some(t => t.title === 'Call the bank' && t.done) && !afterLast.some(t => t.title === 'Renew passport' || t.title === 'Email Sam')
      && (await mock.text('#toast')).includes("Taken back, except one thing you've changed since."), [afterLast.slice(beforeLast).map(t => t.title), await mock.text('#toast')]);
    check('…and the line goes (one step of Undo)', !(await mock.exists('[data-s=ask-last]')));
    await closeSheet(mock); await sleep(150);
    await mock.setData(`s => { s.tasks.items = s.tasks.items.filter(t => t.title !== 'Call the bank'); }`);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    await askGo(mock); await mock.click('[data-action=ask-add]'); await sleep(250); await closeSheet(mock); await sleep(150);
    await mock.ev(`(() => { const x = JSON.parse(localStorage.getItem('myday.ask.lastUndo')); x.on = '2000-01-01'; localStorage.setItem('myday.ask.lastUndo', JSON.stringify(x)); })()`);
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`); await sleep(150);
    check('…kept only until midnight: from another day, no line (and it\'s forgotten)', !(await mock.exists('[data-s=ask-last]')) && (await mock.ev(`localStorage.getItem('myday.ask.lastUndo')`)) === null);
    await closeSheet(mock); await sleep(150);
    await mock.setData(`s => { s.tasks.items = s.tasks.items.filter(t => !['Call the bank', 'Renew passport', 'Email Sam'].includes(t.title)); }`);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    await askGo(mock);
    await mock.type('[data-s=ask-more]', 'and they are all for this week'); await mock.click('[data-action=ask-again]');
    await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && !!document.querySelector('[data-s=ask-now]')`, 10000); await sleep(150);
    const thread = () => mock.ev(`[...document.querySelectorAll('[data-s=ask-turn] summary')].map(s => s.textContent.trim())`);
    check('a reply is answered with the conversation above it: the first question folded to one line, the reply below (v25)', eq(await thread(), ['You: call the bank, renew passport and email Sam']) && (await mock.text('[data-s=ask-now]')) === 'You: and they are all for this week', [await thread(), await mock.text('[data-s=ask-now]')]);
    check('…and you can go on replying (no limit of its own; practice mode shows no count)', await mock.exists('[data-s=ask-more]') && !(await mock.exists('[data-s=ask-left]')));
    await mock.type('[data-s=ask-more]', 'make them all short'); await mock.click('[data-action=ask-again]');
    await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && document.querySelector('[data-s=ask-now]')?.textContent.includes('make them all short')`, 10000); await sleep(150);
    check('…a third message: two earlier exchanges folded, the newest answered in full, and still a reply box', (await thread()).length === 2 && await mock.exists('[data-s=ask-message]') && await mock.exists('[data-s=ask-more]'), await thread());
    await mock.ev(`document.querySelector('[data-s=ask-turn]').open = true`); await sleep(100);
    check('…an earlier exchange opens to its answer as it was shown, after "(Not added.)" when its suggestions weren\'t added', (await mock.text('[data-s=ask-turn]')).includes('(Not added.)'), await mock.text('[data-s=ask-turn]'));
    await mock.click('[data-action=ask-dismiss]'); await sleep(150);
    check('Dismiss starts over: the conversation is forgotten', (await mock.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'idle' && !(await mock.exists('[data-s=ask-thread]')));
    await askGo(mock);
    await mock.type('[data-s=ask-more]', 'and they are all for this week'); await mock.click('[data-action=ask-again]');
    await mock.until(`!!document.querySelector('[data-s=ask-now]') && document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown'`, 10000);
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    await askGo(mock); await mock.click('[data-action=ask-add]'); await sleep(250);
    check('after Add, you can still reply', (await mock.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'added' && await mock.exists('[data-s=ask-more]'));
    await mock.type('[data-s=ask-more]', 'which one first?'); await mock.click('[data-action=ask-again]');
    await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && !!document.querySelector('[data-s=ask-now]')?.textContent.includes('which one first')`, 10000);
    await mock.ev(`document.querySelector('[data-s=ask-turn]').open = true`); await sleep(100);
    check('…and the exchange you added from starts with what you did ("They added 3 tasks")', /^\s*You: .*\(They added 3 tasks\.\)/s.test(await mock.text('[data-s=ask-turn]')), await mock.text('[data-s=ask-turn]'));
    await mock.setData(`s => { s.tasks.items = s.tasks.items.filter(t => !['Call the bank', 'Renew passport', 'Email Sam'].includes(t.title)); }`);
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    check('…and so does closing the panel: opened again, the panel starts afresh', (await mock.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'idle' && !(await mock.exists('[data-s=ask-thread]')));
    // Today's conversation, kept on this device (specs/ask-keep-conversation.md).
    const phaseNow = () => mock.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`);
    check('…but + offers to carry it on today, at the top: "Your Ask MyDay conversation from 10:00 (2 messages)"', /^Your Ask MyDay conversation from \d\d:\d\d \(2 messages\)\.$/.test((await mock.text('[data-s=ask-kept] span')).trim()), await mock.text('[data-s=ask-kept]'));
    await mock.click('[data-action=ask-carry-on]'); await sleep(250);
    check('Carry on brings back the thread as it was kept, with the reply box ready (focused) and no suggestions to tick; the line goes', (await phaseNow()) === 'resumed' && (await thread()).length === 2 && !(await mock.exists('[data-s=ask-now]')) && !(await mock.exists('[data-action=ask-add]'))
      && (await mock.ev(`document.activeElement?.dataset?.s || ''`)) === 'ask-more' && !(await mock.exists('[data-s=ask-kept]')), [await thread(), await phaseNow()]);
    await mock.type('[data-s=ask-more]', 'and after that?'); await mock.click('[data-action=ask-again]');
    await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && !!document.querySelector('[data-s=ask-now]')?.textContent.includes('after that')`, 10000);
    check('…and a reply carries on from it, answered with the conversation above', (await thread()).length === 2 && (await mock.text('[data-s=ask-now]')) === 'You: and after that?' && await mock.exists('[data-s=ask-message]'), await thread());
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'calendar', 'call the bank, renew passport and email Sam');
    check('…kept again after that answer, and offered on another page too (3 messages)', /\(3 messages\)/.test(await mock.text('[data-s=ask-kept]')), await mock.text('[data-s=ask-kept]'));
    await askGo(mock);
    check('a new question hides the line and, answered, replaces the kept one', !(await mock.exists('[data-s=ask-kept]')) && (await phaseNow()) === 'shown');
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    check('…(now one message)', /\(one message\)/.test(await mock.text('[data-s=ask-kept]')), await mock.text('[data-s=ask-kept]'));
    await mock.click('[data-action=ask-carry-on]'); await sleep(250);
    await mock.click('[data-action=ask-dismiss]'); await sleep(150);
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    check('Start over forgets it: opened again, nothing to carry on', !(await mock.exists('[data-s=ask-kept]')) && (await mock.ev(`localStorage.getItem('myday.ask.conversation')`)) === null);
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam. ' + 'Some more about my week. '.repeat(30));
    await askGo(mock); await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'x');
    check('a first question longer than a request takes is still kept (as it was sent)', /\(one message\)/.test(await mock.text('[data-s=ask-kept]')), await mock.text('[data-s=ask-kept]'));
    await mock.click('[data-action=ask-carry-on]'); await sleep(200); await mock.click('[data-action=ask-dismiss]'); await sleep(150);
    await closeSheet(mock); await sleep(200);
    await mock.setData(`s => { s.tasks.items = s.tasks.items.filter(t => !['Call the bank', 'Renew passport', 'Email Sam'].includes(t.title)); }`);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    await askGo(mock); await mock.click('[data-action=ask-add]'); await sleep(250); await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'x');
    check('after Add, + offers both Undo and Carry on', await mock.exists('[data-action=ask-last-undo]') && await mock.exists('[data-action=ask-carry-on]'));
    await mock.click('[data-action=ask-last-undo]'); await sleep(250);
    check('…and Undo from + forgets the conversation too (it would say they were added)', !(await mock.exists('[data-s=ask-kept]')) && (await mock.ev(`localStorage.getItem('myday.ask.conversation')`)) === null);
    await closeSheet(mock); await sleep(200);
    // How you work (specs/ask-how-you-work.md): switched on in What MyDay has noticed; Ask keeps to your longest and counts what you do.
    await mock.setData(`s => { s.patterns.prefs.maxMinutes.admin = { value: 10, on: '2026-01-01', from: null, why: 'You chose this.' }; s.tasks.items = s.tasks.items.filter(t => !['Call the bank', 'Renew passport', 'Email Sam'].includes(t.title)); }`);
    await mock.ev(`location.hash = 'noticed'`); await mock.until(`!!document.querySelector('[data-action=ask-use]')`, 10000);
    check('nothing confirmed yet: MyDay doesn\'t ask', !(await mock.exists('[data-s=ask-offer]')));
    await mock.setData(`s => { s.patterns.answers['study-time'] = { said: 'yes', on: '2026-01-01', examples: 12, title: 'You study most between 07:00 and 09:00' }; }`);
    await mock.ev(`location.hash = 'noticed'`); await mock.until(`!!document.querySelector('[data-s=ask-offer]')`, 10000);
    check('once something is confirmed, MyDay asks once, in the moment: Shall Ask MyDay use this too?', (await mock.text('[data-s=ask-offer]')).includes('Shall Ask MyDay use this too?'));
    await mock.click('[data-action=ask-offer-no]'); await sleep(250);
    check('…Not now is remembered: it doesn\'t ask again, and it stays off', !(await mock.exists('[data-s=ask-offer]')) && !!(await mock.data()).patterns.prefs.askAsked && !(await mock.data()).patterns.prefs.askUse);
    check('What MyDay has noticed has "Let Ask MyDay use how you work", off until you switch it on', (await mock.ev(`document.querySelector('[data-action=ask-use]')?.getAttribute('aria-checked')`)) === 'false');
    await mock.click('[data-action=ask-use]'); await mock.until(`!!document.querySelector('[data-s=ask-use-lines]')`, 5000);
    check('…on: it lists exactly what Ask MyDay is sent now', (await mock.ev(`document.querySelector('[data-action=ask-use]')?.getAttribute('aria-checked')`)) === 'true' && (await mock.text('[data-s=ask-use-lines]')).includes('Admin tasks: 10 min at most'), await mock.text('[data-s=ask-use-lines]'));
    await mock.ev(`location.hash = 'today'`); await sleep(300);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    check('the "Sent to the AI" preview says how you work goes too', (await mock.text('[data-s=ask-sends]')).includes('How you work'), await mock.text('[data-s=ask-sends]'));
    await askGo(mock);
    const hwItems = await mock.ev(`[...document.querySelectorAll('[data-s=ask-item]')].map(li => li.textContent)`);
    check('its admin tasks are kept to your 10 minutes, and say so', hwItems.length >= 2 && hwItems.every(t => /10 min, as you prefer/.test(t)), hwItems);
    await mock.ev(`document.querySelectorAll('[data-s=ask-pick]')[1].click()`); await sleep(100);
    await mock.click('[data-action=ask-add]'); await sleep(300);
    let seen = (await mock.data()).patterns.askSeen ?? [];
    check('Add counts what you did with each: added or not, its list and minutes, never its words', seen.length === hwItems.length && seen.filter(x => x.added).length === hwItems.length - 1 && seen.every(x => x.category === 'admin' && x.proposed === 10)
      && !JSON.stringify(seen).includes('bank'), seen);
    await closeSheet(mock); await sleep(200);
    await mock.setData(`s => { s.tasks.items = s.tasks.items.filter(t => !['Call the bank', 'Renew passport', 'Email Sam'].includes(t.title)); }`);
    await openAsk(mock, 'today', 'call the bank, renew passport and email Sam');
    await askGo(mock); await mock.click('[data-action=ask-dismiss]'); await sleep(250);
    seen = (await mock.data()).patterns.askSeen ?? [];
    check('…and Dismiss counts them as not added', seen.length === 2 * hwItems.length && seen.slice(-hwItems.length).every(x => !x.added), seen.slice(-3));
    await closeSheet(mock); await sleep(200);
    await mock.ev(`location.hash = 'noticed'`); await mock.until(`!!document.querySelector('[data-action=ask-use]')`, 10000);
    await mock.click('[data-action=ask-use]'); await sleep(250);
    const offData = await mock.data();
    check('switched off: nothing more is sent, and what it counted is forgotten', !offData.patterns.prefs.askUse && !('askSeen' in offData.patterns) && !(await mock.exists('[data-s=ask-use-lines]')));
    await mock.setData(`s => { delete s.patterns.prefs.maxMinutes.admin; s.patterns.prefs.maxMinutes.admin = null; }`);
    await mock.ev(`location.hash = 'today'`); await sleep(300);
    await openAsk(mock, 'today', 'delete all my tasks');
    await askGo(mock);
    check('"delete all my tasks": it can\'t, says so kindly, and nothing changes', (await mock.text('[data-s=ask-message]')).includes("can't do that") && !(await mock.exists('[data-action=ask-add]')) && !(await mock.exists('[data-action=ask-action]')));
    await closeSheet(mock); await sleep(200);
    await openAsk(mock, 'today', 'Help me plan my day, I only have an hour');
    await askGo(mock);
    await mock.click('[data-action=ask-action]'); await mock.until(`document.getElementById('aiNote')`, 5000);
    check('planning today is handed to Help me adjust today, already filled in (nothing sent until you tap there)', !(await mock.exists('#captureSheet')) && (await mock.ev(`document.getElementById('aiNote').value`)) === 'Help me plan my day, I only have an hour' && (await mock.ev(`document.getElementById('aiCard').dataset.phase`)) === 'ask');
    await close(mock); await sleep(150);
    await mock.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await openAsk(mock, 'projects/p/pjAsk', 'Break this into smaller steps'); await askGo(mock);
    const smallAsk = await mock.ev(`[...document.querySelectorAll('[data-s=ask-panel] button, [data-s=ask-panel] input')].filter(b => b.offsetParent !== null && b.getBoundingClientRect().height < 44 && b.type !== 'checkbox').map(b => b.textContent.trim() || b.getAttribute('aria-label'))`);
    check('phone: the answer fits (nothing sideways) and its buttons are easy to tap', !(await mock.ev('document.documentElement.scrollWidth > innerWidth')) && !smallAsk.length, smallAsk);
    await closeSheet(mock); await mock.send('Emulation.clearDeviceMetricsOverride');
    check('practice mode made no AI request for it', aiCalls().length === logAsk);
    // Through the server's real code (the stand-in), signed in: the app's request must be one the server accepts.
    setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model', AI_MIN_SECONDS_BETWEEN: '0' });
    await D.setData(askSeed); await D.until(`!document.getElementById('signInGate')`, 15000);
    const c0 = aiCalls().length;
    await openAsk(D, 'projects/p/pjAsk', 'Break this into smaller steps');
    const phaseD = await askGo(D);
    const sentA = aiCalls().slice(c0).find(c => c.body.context.action === 'ask');
    check('with an account: the server accepts the app\'s request and answers (labelled with the model)', phaseD === 'shown' && (await D.text('[data-s=ask-panel]')).includes('AI-written by Main model'), [phaseD, await D.text('[data-s=ask-panel]')]);
    check('…it sent what you typed, the date, the page and that page\'s slice, and that it can look in your notes — no private note, nothing else', !!sentA && JSON.stringify(Object.keys(sentA.body.context).sort()) === JSON.stringify(['action', 'can', 'context', 'date', 'page', 'text', 'time', 'version', 'weekday'])
      && JSON.stringify(Object.keys(sentA.body.context.context).sort()) === JSON.stringify(['project', 'projects']) && !JSON.stringify(sentA.body).includes('private worry'), sentA && Object.keys(sentA.body.context));
    // A conversation through the server (v25): a reply sends what came before it; the server says how many requests are left.
    const usedD = async () => (await S.owner(db, 'select requests from public.ai_usage where user_id = $1', [userA])).rows[0].requests;
    setAi({ AI_DAILY_LIMIT: String(await usedD() + 4) });
    await D.type('[data-s=ask-more]', 'and make the first one shorter'); await D.click('[data-action=ask-again]');
    await D.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && !!document.querySelector('[data-s=ask-now]')`, 15000);
    const sentR = aiCalls().slice(-1)[0].body.context;
    check('a reply goes through the server with the conversation so far — the first question and its answer as shown — and the reply as the newest message (never the old single follow-up)',
      sentR.text === 'and make the first one shorter' && sentR.conversation?.earlier.length === 1 && sentR.conversation.earlier[0].asked === 'Break this into smaller steps' && sentR.conversation.earlier[0].answered.length > 20
      && sentR.conversation.leftOut === 0 && !('followUp' in sentR) && !JSON.stringify(sentR).includes('private worry'), sentR.conversation);
    check('…and with five or fewer left today, the panel says how many, as the server counted them', (await D.text('[data-s=ask-left]')).startsWith('3 requests left today'), await D.text('[data-s=ask-left]'));
    setAi({ AI_DAILY_LIMIT: String(await usedD() + 1) });
    await D.type('[data-s=ask-more]', 'thanks'); await D.click('[data-action=ask-again]');
    await D.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && !!document.querySelector('[data-s=ask-now]')?.textContent.includes('thanks')`, 15000);
    check('…and after the day\'s last one, no reply box: it says Ask MyDay is back tomorrow', !(await D.exists('[data-s=ask-more]')) && (await D.text('[data-s=ask-limit]')).includes('back tomorrow'), await D.text('[data-s=ask-panel]'));
    setAi({ AI_DAILY_LIMIT: '50' });
    // Carried on from + later: the reply sends the conversation as it was kept.
    await closeSheet(D); await sleep(200);
    await openAsk(D, 'today', 'x');
    await D.click('[data-action=ask-carry-on]'); await sleep(250);
    await D.type('[data-s=ask-more]', 'and one more thing'); await D.click('[data-action=ask-again]');
    await D.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && !!document.querySelector('[data-s=ask-now]')?.textContent.includes('one more thing')`, 15000);
    const sentK = aiCalls().slice(-1)[0].body.context;
    check('carried on from + later, a reply sends the conversation as it was kept: all three exchanges, the first after its "(Not added.)", and the page you\'re on now', sentK.text === 'and one more thing' && sentK.conversation?.earlier.length === 3
      && sentK.conversation.earlier[0].asked === 'Break this into smaller steps' && sentK.conversation.earlier[0].answered.startsWith('(Not added.)') && sentK.page === 'today', sentK.conversation);
    await closeSheet(D);
    await openAsk(D, 'projects/p/pjAsk', 'Break this into smaller steps');
    const beforePrivacyCalls = aiCalls().length;
    // Deliberately omit the storage event: the send path must catch up before it can send its old preview.
    await D.ev(`(() => { const s = JSON.parse(localStorage.getItem('myday.data.v4')); s.projects.items.find(p => p.id === 'pjAsk').private = true; localStorage.setItem('myday.data.v4', JSON.stringify(s)); })()`);
    await D.click('[data-action=ask-go]'); await sleep(800);
    check('a project made private after Capture opened is never sent, even before its storage event arrives', (await D.ev(`document.querySelector('[data-s=ask-panel]')?.dataset.phase`)) === 'error' && (await D.text('[data-s=ask-panel]')).includes('Close Capture and open it again') && aiCalls().length === beforePrivacyCalls);
    await closeSheet(D); await D.ev(`location.hash = 'today'`);
    await D.setData(`s => { s.projects.items = s.projects.items.filter(p => p.id !== 'pjAsk'); s.notes.items = s.notes.items.filter(n => !['nAsk', 'nPriv'].includes(n.id)); }`); await D.until(`!document.getElementById('signInGate')`, 15000);

    await mock.setData(askSeed);
    const privatiseElsewhere = () => mock.ev(`(() => { const oldValue = localStorage.getItem('myday.data.v4'); const s = JSON.parse(oldValue); s.projects.items.find(p => p.id === 'pjAsk').private = true; const newValue = JSON.stringify(s); localStorage.setItem('myday.data.v4', newValue); window.dispatchEvent(new StorageEvent('storage', { key: 'myday.data.v4', oldValue, newValue, storageArea: localStorage })); })()`);
    await openAsk(mock, 'projects/p/pjAsk', 'Break this into smaller steps');
    await mock.click('[data-action=ask-go]');
    await privatiseElsewhere();
    await sleep(800);
    check('a reply arriving after an external privacy change is discarded', (await mock.ev(`document.querySelector('[data-s=ask-panel]')?.dataset.phase`)) === 'error' && !(await mock.exists('[data-action=ask-add]')));
    await closeSheet(mock);
    await mock.setData(`s => { delete s.projects.items.find(p => p.id === 'pjAsk').private; }`);
    await openAsk(mock, 'projects/p/pjAsk', 'Break this into smaller steps'); await askGo(mock);
    const beforePrivateAdd = (await mock.data()).tasks.items.length;
    await privatiseElsewhere();
    await mock.click('[data-action=ask-add]'); await sleep(200);
    check('making a project private after a reply prevents applying the old proposal', (await mock.data()).tasks.items.length === beforePrivateAdd && (await mock.ev(`document.querySelector('[data-s=ask-panel]')?.dataset.phase`)) === 'error');
    await closeSheet(mock);
    await mock.setData(askSeed);
  }

  console.log('\n[8g] Ask MyDay on a Study course: "Plan this course with Ask", study tasks into the course, Undo');
  {
    const course = { id: 'coAsk', title: 'Pre-Security path', url: '', minutes: 30, listId: null, archived: false, modules: [{ id: 'mA', title: 'Networking', sections: [{ id: 'sA', title: 'How the web works', tasks: [{ id: 'tA', title: 'DNS in detail', minutes: 30, url: '', kind: 'learn', note: '', done: false, doneOn: null }] }] }] };
    await seeded(mock, MOCK);
    await mock.setData(`s => { s.study.stages = [{ id: 'sgA', title: 'Foundations', courses: [${JSON.stringify(course)}] }]; }`); await mock.until(`document.querySelector('#app')`);
    await mock.ev(`location.hash = 'study/course/coAsk'`); await mock.until(`document.querySelector('[data-action=s-ask-plan]')`, 5000);
    check('a course page offers "Plan this course with Ask"', (await mock.text('[data-action=s-ask-plan]')).includes('Plan this course with Ask'));
    await mock.click('[data-action=s-ask-plan]'); await mock.until(`document.getElementById('captureText')`, 5000);
    check('…which opens + with the request already typed, and shows the course\'s outline will be sent', (await mock.ev(`document.getElementById('captureText').value`)) === 'Break this course into study tasks' && (await mock.text('[data-s=ask-sends]')).includes('Course: Pre-Security path') && (await mock.text('[data-s=ask-sends]')).includes('1 module, 1 section, 1 task'));
    await mock.click('[data-action=ask-go]'); await mock.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 10000);
    check('…and answers with study tasks for its section', (await mock.ev(`[...document.querySelectorAll('[data-s=ask-item]')].map(x => x.dataset.type).join()`)) === 'study-task,study-task,study-task' && (await mock.text('[data-s=ask-panel]')).includes('in “How the web works”'));
    await mock.click('[data-action=ask-add]'); await sleep(250);
    const sec = async () => (await mock.data()).study.stages[0].courses[0].modules[0].sections[0].tasks;
    check('Add puts them into the course on your roadmap', (await sec()).length === 4 && (await sec())[3].kind === 'practical' && (await mock.text('[data-s=ask-added]')).includes('Added 3 study tasks'));
    await mock.click('[data-action=ask-undo]'); await sleep(250);
    check('…and Undo takes them back', (await sec()).length === 1);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(150);
    await mock.ev(`location.hash = 'today'`);
  }

  console.log('\n[8h] Ask MyDay can start a revision round');
  {
    await seeded(mock, MOCK);
    await mock.setData(`s => { s.study.concepts = [1, 2, 3].map(i => ({ id: 'cpAR' + i, title: 'Card ' + i, taskIds: [], createdOn: '${TODAY}', kind: 'written', prompt: 'Question ' + i + '?', answer: 'Answer', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 1, interval: 1, lapses: 0, due: '${TODAY}' } })); }`);
    await mock.until(`document.querySelector('#app')`);
    await mock.ev(`location.hash = 'study'`); await sleep(300);
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`);
    await mock.type('#captureText', 'should I revise first?'); await sleep(150);
    await mock.click('[data-action=ask-go]'); await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown'`, 10000);
    check('asked on Study with cards due: "Revise 3 cards now"', (await mock.text('[data-action=ask-action]')) === 'Revise 3 cards now');
    await mock.click('[data-action=ask-action]'); await sleep(400);
    check('…which starts the round on its first question', (await mock.ev('location.hash')) === '#study/revise' && !(await mock.exists('#captureSheet')) && (await mock.text('#app')).includes('Question 1?'));
    await mock.ev(`location.hash = 'today'`);
  }

  console.log('\n[8i] Ask MyDay changes something already saved: before → after, Apply, Undo');
  {
    await seeded(mock, MOCK);
    const tmr = (() => { const d = new Date(`${TODAY}T12:00`); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    await mock.setData(`s => { s.tasks.items.push({ id: 'tkCT', title: 'Pay council tax', listId: '', category: 'admin', minutes: 15, due: '${TODAY}', time: '09:30', notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${TODAY}T08:00', postponed: 0, blockers: [], letGoOn: null }); }`);
    await mock.until(`document.querySelector('#app')`);
    await mock.ev(`location.hash = 'today'`); await sleep(300);
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`);
    await mock.type('#captureText', 'move council tax to tomorrow'); await sleep(150);
    check('the Sends line says changes need a tap too', (await mock.text('[data-s=ask-sends]')).includes('until you tap Add or Apply'));
    await mock.click('[data-action=ask-go]'); await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown'`, 10000);
    const line = await mock.text('[data-s=ask-change] [data-s=ask-change-line]');
    check('one change card, its day before → after (its time kept)', (await mock.ev(`document.querySelectorAll('[data-s=ask-change]').length`)) === 1 && /^Day:/.test(line) && line.includes('09:30') && (await mock.text('[data-s=ask-change]')).includes('Pay council tax'), line);
    const due = () => mock.ev(`JSON.parse(localStorage.getItem('myday.data.v4')).tasks.items.find(t => t.id === 'tkCT').due`);
    check('…nothing changed yet', (await due()) === TODAY);
    check('…Apply is labelled with how many', (await mock.text('[data-action=ask-apply]')) === 'Apply 1');
    await mock.click('[data-action=ask-apply]'); await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'applied'`);
    check('Apply moves it to tomorrow and says so', (await due()) === tmr && (await mock.text('[data-s=ask-applied]')).includes('Changed “Pay council tax”'));
    await mock.click('[data-s=ask-applied] [data-action=ask-undo]'); await sleep(300);
    check('Undo puts it back on today, as it was', (await due()) === TODAY && (await mock.ev(`JSON.parse(localStorage.getItem('myday.data.v4')).tasks.items.find(t => t.id === 'tkCT').postponed`)) === 0);
    await mock.click('[data-action=capture-cancel]'); await sleep(200);
  }

  console.log('\n[8j] What MyDay knows');
  {
    await seeded(mock, MOCK);
    await mock.setData(`s => { s.notes.items.push({ id: 'nPv', categoryId: '', title: 'Diary', text: 'Private line', pinned: false, createdAt: '${TODAY}T08:00', updatedAt: '${TODAY}T08:00', private: true }); }`);
    await mock.until(`document.querySelector('#app')`);
    await mock.ev(`location.hash = 'today'`); await sleep(300);
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`);
    await mock.type('#captureText', 'hello'); await sleep(150);
    check('Ask\'s preview links to What MyDay knows', await mock.exists('[data-s=ask-sends] [data-action=ask-knows]'));
    await mock.click('[data-action=ask-knows]'); await sleep(400);
    check('…which closes the sheet and opens the page', (await mock.ev('location.hash')) === '#knows' && !(await mock.exists('#captureSheet')) && (await mock.text('#screenName')) === 'What MyDay knows');
    const page = await mock.text('#knows');
    check('it lists what Ask sends from each page, in the preview\'s own words', (await mock.text('#knowsAsk [data-page=today] dd')).startsWith('What you typed, the date, ') && (await mock.text('#knowsAsk [data-page=finance] dd')) === 'What you typed, the date.' && page.includes('Help me adjust today'));
    { const n = await mock.ev(`JSON.parse(localStorage.getItem('myday.data.v4')).notes.items.filter(n => n.private).length`), line = await mock.text('[data-s=knows-private]');
      check('…says private notes are never sent, and counts yours', line.startsWith('Notes you’ve marked private') && line.includes(`You have ${n === 1 ? 'one' : n} at the moment`), [line, n]); }
    check('…has the AI help with notes switch, which models do which job, and the limits', (await mock.exists('#knows [data-action=ai-notes]')) && page.includes('GLM-5.3-Flash') && page.includes('Gemini 3.8 Flash') && page.includes('20 AI requests a day'));
    check('…and says this copy uses the practice helper (nothing sent)', (await mock.text('[data-s=knows-mode]')).includes('practice helper'));
    check('it shows what MyDay keeps about how you work — your own preferences, to change in What MyDay has noticed', (await mock.text('[data-s=knows-prefs]')).includes('AI help with notes: ') && await mock.exists('#knowsKeeps [data-action=knows-noticed]'));
    check('the footer links to it too', await mock.exists('#footer [data-action=knows]'));
    check('nothing scrolls sideways on the page', !(await mock.ev('document.documentElement.scrollWidth > innerWidth')));
    await mock.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8k] "Break into smaller steps" on a task');
  {
    const at = `${TODAY}T08:00`;
    const TKS = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, ...x });
    await seeded(mock, MOCK);
    await mock.setData(`s => { s.tasks.lists = [{ id: 'tlW', name: 'Work' }]; s.projects.items.push({ id: 'pjSt', title: 'Home move', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${at}', updatedAt: '${at}' }); s.tasks.items.push(${JSON.stringify(TKS('tkSt', 'Book the removal van', { listId: 'tlW', projectId: 'pjSt' }))}, ${JSON.stringify(TKS('tkStD', 'Return the keys', { listId: 'tlW', done: true, doneOn: TODAY }))}); }`);
    await mock.until(`document.querySelector('#app')`);
    const tasks = async () => (await mock.data()).tasks.items;
    const parentBefore = JSON.stringify((await tasks()).find(t => t.id === 'tkSt'));
    const nBefore = (await tasks()).length;
    await mock.ev(`location.hash = 'today/tasks/tkSt'`); await mock.until(`document.querySelector('[data-action=task-ask-steps]')`, 5000);
    check('an open task\'s page offers "Break into smaller steps"', (await mock.text('[data-action=task-ask-steps]')).includes('Break into smaller steps'));
    await mock.click('[data-action=task-ask-steps]'); await mock.until(`document.getElementById('captureText')`, 5000);
    check('…which opens + with the request already typed, and nothing sent or added yet', (await mock.ev(`document.getElementById('captureText').value`)) === 'Break this into smaller steps' && (await tasks()).length === nBefore && !(await mock.exists('[data-s=ask-item]')));
    await mock.click('[data-action=ask-go]'); await mock.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 10000);
    check('Ask MyDay answers with step cards for the task\'s checklist (v23), and says they go into it', (await mock.ev(`[...document.querySelectorAll('[data-s=ask-item]')].filter(x => x.dataset.type === 'step').length`)) === 3 && (await mock.text('[data-s=ask-steps-where]')).includes('checklist of “Book the removal van”'), await mock.text('[data-s=ask-panel]'));
    check('…a step shows no list or minutes (it lives inside the task)', (await mock.ev(`[...document.querySelectorAll('[data-s=ask-item]')].every(x => !x.textContent.includes('list “Work”') && !/\\d+ min/.test(x.textContent))`)) === true);
    await mock.click('[data-action=ask-add]'); await sleep(250);
    const now = await tasks(), parentNow = now.find(t => t.id === 'tkSt');
    check('Add puts the steps into that task\'s checklist — no new tasks', now.length === nBefore && (parentNow.steps ?? []).length === 3 && parentNow.steps.every(st => !st.done), parentNow.steps);
    check('…and the task is otherwise unchanged', JSON.stringify((({ steps, updatedAt, ...t }) => t)(parentNow)) === JSON.stringify((({ steps, updatedAt, ...t }) => t)(JSON.parse(parentBefore))));
    await mock.click('[data-action=ask-undo]'); await sleep(250);
    check('Undo takes the steps back', (await tasks()).length === nBefore && JSON.stringify((await tasks()).find(t => t.id === 'tkSt')) === parentBefore);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(150);
    await mock.ev(`location.hash = 'today/tasks/tkStD'`);
    const doneShown = await mock.until(`document.getElementById('taskEditor') && document.querySelector('[data-action=task-toggle]')?.getAttribute('aria-pressed') === 'true'`, 5000);
    check('a done task\'s page has no such button', doneShown && !(await mock.exists('[data-action=task-ask-steps]')));
    await mock.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8l] Milestones and decisions with Ask MyDay; private projects');
  {
    const at = `${TODAY}T08:00`;
    const ms = (id, title) => ({ id, title, aim: null, reachedOn: null, createdAt: at });
    const op = (id, text, pros = [], cons = []) => ({ id, text, pros, cons });
    const dc = (id, question, options, chosen = null) => ({ id, question, options, chosen, why: chosen ? 'Fits' : '', decidedOn: chosen ? TODAY : null, createdAt: at, updatedAt: at });
    const TKP = { id: 'tkPv', title: 'Order the chairs', listId: '', category: 'admin', minutes: 15, due: TODAY, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, projectId: 'pjMs' };
    const PJ = { id: 'pjMs', title: 'Garden party', summary: 'A small party in June', stage: 'decide', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at,
      milestones: [ms('msE1', 'Pick a date')],
      decisions: [dc('dcV', 'Which venue?', [op('opV1', 'Town hall', ['Cheap']), op('opV2', 'Garden')]), dc('dcE', 'Which caterer?', [op('opE1', 'Soup van')]), dc('dcD', 'Which music?', [op('opD1', 'Band', ['Lively'])], 'opD1')] };
    await seeded(mock, MOCK);
    await mock.setData(`s => { s.projects.items.push(${JSON.stringify(PJ)}); s.tasks.items.push(${JSON.stringify(TKP)}); }`);
    await mock.until(`document.querySelector('#app')`);
    const proj = async () => (await mock.data()).projects.items.find(p => p.id === 'pjMs');
    const typed = () => mock.ev(`document.getElementById('captureText')?.value`);

    await mock.ev(`location.hash = 'projects/p/pjMs/milestones'`); await mock.until(`document.querySelector('[data-action=ms-ask]')`, 5000);
    check('the Milestones tab offers "Suggest milestones"', (await mock.text('[data-action=ms-ask]')).includes('Suggest milestones'));
    const before = await proj();
    await mock.click('[data-action=ms-ask]'); await mock.until(`document.getElementById('captureText')`, 5000);
    check('…which opens + with the request typed, the preview showing the project and "1 milestone", and nothing sent or added yet', (await typed()) === 'Suggest milestones for this project' && (await mock.text('[data-s=ask-sends]')).includes('Garden party') && (await mock.text('[data-s=ask-sends]')).includes('1 milestone') && !(await mock.exists('[data-s=ask-item]')) && eq((await proj()).milestones, before.milestones), await mock.text('[data-s=ask-sends]'));
    await mock.click('[data-action=ask-go]'); await mock.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 10000);
    check('Ask MyDay answers with milestone cards, which have no Edit link', (await mock.ev(`document.querySelectorAll('[data-s=ask-item][data-type=milestone]').length`)) === 3 && !(await mock.exists('[data-s=ask-item] [data-action=ask-edit]')), await mock.text('[data-s=ask-panel]'));
    await mock.click('[data-action=ask-add]'); await sleep(250);
    let after = await proj();
    check('Add puts them in the project\'s milestones, after the one it had', after.milestones.length === 4 && after.milestones[0].id === 'msE1' && after.milestones.slice(1).map(m => m.title).join('|') === 'Clear on what “done” looks like|The first real piece finished|Everything wrapped up', after.milestones.map(m => m.title));
    await mock.click('[data-action=ask-undo]'); await sleep(250);
    check('Undo takes them back exactly', eq((await proj()).milestones, before.milestones));
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);

    await mock.ev(`location.hash = 'projects/p/pjMs/decisions'`); await mock.until(`document.querySelector('[data-s=decision]')`, 5000);
    check('on the Decisions tab the open decision with a pro shows "What am I missing?"', (await mock.exists('[data-s=decision][data-id=dcV] [data-action=dc-ask]')) && (await mock.text('[data-s=decision][data-id=dcV] [data-action=dc-ask]')).includes('What am I missing?'));
    check('…a decision whose options have no pros or cons yet shows none', !(await mock.exists('[data-s=decision][data-id=dcE] [data-action=dc-ask]')));
    check('…and a decided one shows none', !(await mock.exists('[data-s=decision][data-id=dcD] [data-action=dc-ask]')));
    await mock.click('[data-s=decision][data-id=dcV] [data-action=dc-ask]'); await mock.until(`document.getElementById('captureText')`, 5000);
    check('…tapping it opens + with the request typed and the preview showing "Decision: Which venue?"', (await typed()) === 'What am I missing in “Which venue?”?' && (await mock.text('[data-s=ask-sends]')).includes('Decision: Which venue?') && !(await mock.exists('[data-s=ask-item]')), [await typed(), await mock.text('[data-s=ask-sends]')]);
    const beforeD = await proj();
    await mock.click('[data-action=ask-go]'); await mock.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 10000);
    const conTxt = await mock.ev(`document.querySelector('[data-s=ask-item][data-type=con]')?.textContent || ''`);
    check('Ask MyDay answers with a con card "for “Town hall”" and an option card, with no Edit link', conTxt.includes('for “Town hall”') && (await mock.exists('[data-s=ask-item][data-type=option]')) && !(await mock.exists('[data-s=ask-item] [data-action=ask-edit]')), await mock.text('[data-s=ask-panel]'));
    await mock.click('[data-action=ask-add]'); await sleep(250);
    const dcA = (await proj()).decisions.find(x => x.id === 'dcV');
    check('Add puts the con on that option and the new option in the decision', dcA.options.length === 3 && dcA.options[0].cons.length === 1 && dcA.options[2].text === 'Wait a month and decide then', dcA);
    await mock.click('[data-action=ask-undo]'); await sleep(250);
    const noStamp = l => l.map(({ updatedAt, ...x }) => x); // Undo, like adding, marks the decision as just changed; everything else is as it was
    check('Undo takes both back (the decision\'s options and points as they were)', eq(noStamp((await proj()).decisions), noStamp(beforeD.decisions)), (await proj()).decisions);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);

    check('before it is private, no lock shows and the switch is off', (await mock.ev(`document.querySelector('[data-action=project-private]').getAttribute('aria-checked')`)) === 'false' && !(await mock.exists('[data-s=project-private-hint]')));
    await mock.click('[data-action=project-private]'); await sleep(250);
    check('making it private: the switch shows on, the hint shows, and it is saved', (await mock.ev(`document.querySelector('[data-action=project-private]').getAttribute('aria-checked')`)) === 'true' && (await mock.exists('[data-s=project-private-hint]')) && (await proj()).private === true);
    check('…the decision\'s AI button is replaced by "Private project — AI help isn\'t offered here."', !(await mock.exists('[data-action=dc-ask]')) && (await mock.text('[data-s=ai-private]')) === 'Private project — AI help isn\'t offered here.');
    await mock.ev(`location.hash = 'projects/p/pjMs/milestones'`); await mock.until(`document.querySelector('#projectMilestones')`, 5000); await sleep(150);
    check('…and so is the milestones one', !(await mock.exists('[data-action=ms-ask]')) && (await mock.text('[data-s=ai-private]')) === 'Private project — AI help isn\'t offered here.');
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`); await mock.type('#captureText', 'hello'); await sleep(200);
    const sends = await mock.text('[data-s=ask-sends]');
    check('+ on its page: the preview says "This project: not sent (private)" and never names it', sends.includes('This project: not sent (private)') && !sends.includes('Garden party') && !sends.includes('Pick a date'), sends);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);

    await mock.ev(`location.hash = 'today'`); await mock.until(`document.querySelector('[data-action=capture-open]')`, 5000); await sleep(300);
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`); await mock.type('#captureText', 'hello'); await sleep(200);
    const sendsT = await mock.text('[data-s=ask-sends]');
    check('on Today the preview counts the items from private projects it left out, and never names the task or project', /2 items from private projects not sent/.test(sendsT) && !sendsT.includes('Order the chairs') && !sendsT.includes('Garden party'), sendsT);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);

    await mock.ev(`location.hash = 'projects'`); await mock.until(`document.querySelector('[data-id=pjMs]')`, 5000); await sleep(200);
    check('the project\'s board card shows the lock', await mock.exists('[data-s=project-private]'));
    await mock.ev(`location.hash = 'knows'`); await mock.until(`document.querySelector('[data-s=knows-private-projects]')`, 5000);
    const kp = await mock.text('[data-s=knows-private-projects]');
    check('What MyDay knows lists private projects and counts yours', kp.startsWith('Projects you’ve made private') && kp.includes('You have one at the moment'), kp);
    // No revision cards from a note in a private project (Private covers every AI feature but note filing).
    await mock.setData(`s => { s.patterns.prefs.aiNotes = true; s.projects.items.push({ id: 'pjHush', title: 'Quiet plans', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00', private: true }); s.notes.items.push({ id: 'ntInPriv', title: 'Hush', text: 'A line in a private project that is long enough to be a card.', categoryId: '', pinned: false, projectId: 'pjHush', createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' }); }`);
    await mock.ev(`location.hash = 'projects/notes/ntInPriv'`); await mock.until(`document.getElementById('noteEditor')`); await sleep(300);
    check('a note in a private project offers no revision cards', !!(await mock.exists('#noteEditor')) && !(await mock.exists('#noteCards')));
    await mock.setData(`s => { s.projects.items = s.projects.items.filter(p => p.id !== 'pjHush'); s.notes.items = s.notes.items.filter(n => n.id !== 'ntInPriv'); }`);
    await mock.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8m] Suggest what must be true on a business idea\'s one page');
  {
    const at = `${TODAY}T08:00`;
    const as = (id, text, state = 'open', found = '') => ({ id, text, state, found, checkedOn: state === 'open' ? null : TODAY, taskId: null, createdAt: at });
    const EX = [as('asX1', 'Cafes would pay to be listed', 'looks-true', 'Zorblat said yes on the phone'), as('asX2', 'Owners read messages in the morning', 'open')];
    const PJB = (id, title, model, x = {}) => ({ id, title, summary: 'A made-up directory', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, template: 'business', model, ...x });
    const M3 = { problem: 'Small cafes are hard to find', who: 'Students new to the town', how: 'A free map; cafes pay a small fee', assumptions: EX };
    const twelve = Array.from({ length: 12 }, (_, i) => as('asT' + i, 'Made-up belief number ' + i));
    await seeded(mock, MOCK);
    await mock.setData(`s => { s.projects.items.push(${JSON.stringify(PJB('pjB2', 'Cafe map two answers', { ...M3, how: '', assumptions: [] }))}, ${JSON.stringify(PJB('pjB3', 'Cafe map', M3))}, ${JSON.stringify(PJB('pjBP', 'Cafe map private', { ...M3, assumptions: [] }, { private: true }))}, ${JSON.stringify(PJB('pjB12', 'Cafe map twelve', { ...M3, assumptions: twelve }))}); }`);
    await mock.until(`document.querySelector('#app')`);
    const proj = async () => (await mock.data()).projects.items.find(p => p.id === 'pjB3');
    const model = async id => { await mock.ev(`location.hash = 'projects/p/${id}/model'`); await mock.until(`document.getElementById('projectModel')`, 5000); await sleep(200); };

    await model('pjB2');
    check('with only two of the three answers, the Model tab says to answer the first three questions and has no "Suggest what must be true" button', (await mock.text('[data-s=model-ai-wait]')) === 'Once the first three questions are answered, Ask MyDay can suggest what must be true.' && !(await mock.exists('[data-action=model-ask]')), await mock.text('[data-s=model-musts]'));
    await model('pjB3');
    check('with all three answered, the Model tab offers "Suggest what must be true" and no waiting line', (await mock.text('[data-action=model-ask]')).includes('Suggest what must be true') && !(await mock.exists('[data-s=model-ai-wait]')));
    await model('pjBP');
    check('on a private business idea there is no button, only "Private project — AI help isn\'t offered here."', !(await mock.exists('[data-action=model-ask]')) && (await mock.text('[data-s=ai-private]')) === 'Private project — AI help isn\'t offered here.');
    await model('pjB12');
    check('with 12 things already listed there is neither the button nor the waiting line', !(await mock.exists('[data-action=model-ask]')) && !(await mock.exists('[data-s=model-ai-wait]')));

    await model('pjB3');
    const before = await proj();
    await mock.click('[data-action=model-ask]'); await mock.until(`document.getElementById('captureText')`, 5000); await sleep(200);
    const typed = await mock.ev(`document.getElementById('captureText').value`);
    const sends = await mock.text('[data-s=ask-sends]');
    check('tapping it opens + with "Suggest what must be true for this idea to work" typed, and nothing added yet', typed === 'Suggest what must be true for this idea to work' && !(await mock.exists('[data-s=ask-item]')) && eq((await proj()).model, before.model), typed);
    check('the "Sent to the AI" preview has the chip "One page: 3 answers, 2 things that must be true"', sends.includes('One page: 3 answers, 2 things that must be true'), sends);
    check('…and "Show everything that\'s sent" lists the three answers and each thing with how it is turning out', ['Small cafes are hard to find', 'Students new to the town', 'A free map; cafes pay a small fee', 'Cafes would pay to be listed — looks true', 'Owners read messages in the morning — not checked yet'].every(s => sends.includes(s)), sends);
    check('…but never the text of what was found', !sends.includes('Zorblat'), sends);
    await mock.click('[data-action=ask-go]'); await mock.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 10000);
    check('Ask MyDay answers with 3 "must be true" cards, each saying "on your one page, not checked yet"', (await mock.ev(`document.querySelectorAll('[data-s=ask-item][data-type=must-be-true]').length`)) === 3 && (await mock.ev(`[...document.querySelectorAll('[data-s=ask-item][data-type=must-be-true]')].every(x => x.textContent.includes('on your one page, not checked yet'))`)) === true, await mock.text('[data-s=ask-panel]'));
    await mock.click('[data-action=ask-add]'); await sleep(250);
    const after = (await proj()).model.assumptions;
    check('Add puts them on the one page after the existing ones, in order, as not checked yet', after.length === 5 && after[0].id === 'asX1' && after[1].id === 'asX2' && after.slice(2).every(a => a.state === 'open') && after.slice(2).map(a => a.text).join('|') === 'The people it’s for would try something new for this|They would pay enough to cover what it costs|You can reach them without spending much', after.map(a => a.text));
    check('…the message says "Added 3 things that must be true."', (await mock.text('#toast')).includes('Added 3 things that must be true.'), await mock.text('#toast'));
    check('…and the Model tab lists them', (await mock.ev(`document.querySelectorAll('#projectModel [data-s=assumption]').length`)) === 5);
    await mock.click('[data-action=ask-undo]'); await sleep(250);
    const undone = (await proj()).model.assumptions;
    check('Undo takes the three back and leaves the existing two', eq(undone, EX) && (await mock.ev(`document.querySelectorAll('#projectModel [data-s=assumption]').length`)) === 2, undone.map(a => a.text));
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(150);

    await mock.ev(`location.hash = 'projects/p/pjB3'`); await mock.until(`document.querySelector('#app')`, 5000); await sleep(300);
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`); await mock.type('#captureText', 'hello'); await sleep(250);
    const sendsO = await mock.text('[data-s=ask-sends]');
    check('from the same project\'s Overview the preview has no "One page" chip and nothing of the answers', sendsO.includes('Cafe map') && !sendsO.includes('One page') && !sendsO.includes('Small cafes are hard to find') && !sendsO.includes('Students new'), sendsO);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(150);

    await mock.ev(`location.hash = 'knows'`); await mock.until(`document.getElementById('knows')`, 5000);
    const kn = await mock.text('#knows');
    check('What MyDay knows mentions "Suggest what must be true" and that what you found is never sent', kn.includes('Suggest what must be true') && kn.includes('never what you found'), kn.slice(0, 200));
    await mock.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8n] Summarise this on a project\'s dashboard');
  {
    const at = `${TODAY}T08:00`;
    const PJ = (id, title, x = {}) => ({ id, title, summary: 'A made-up plan', stage: 'act', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, ...x });
    const TK = { id: 'tkGl', title: 'Measure the shelf', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, projectId: 'pjGl' };
    await seeded(mock, MOCK);
    await mock.setData(`s => { s.projects.items.push(${JSON.stringify(PJ('pjGl', 'Shelf for the hall'))}, ${JSON.stringify(PJ('pjGp', 'Shelf private', { private: true }))}); s.tasks.items.push(${JSON.stringify(TK)}); }`);
    await mock.until(`document.querySelector('#app')`);

    await mock.ev(`location.hash = 'projects/p/pjGl'`); await mock.until(`document.querySelector('[data-action=glance-summary]')`, 5000);
    check('a project with an open task shows "Summarise this" in At a glance', (await mock.text('#projectGlance [data-action=glance-summary]')).includes('Summarise this'));
    await mock.click('[data-action=glance-summary]'); await mock.until(`document.getElementById('captureText')`, 5000); await sleep(200);
    check('tapping it opens + with "Summarise where this project is, and the one next step" typed, and nothing answered yet', (await mock.ev(`document.getElementById('captureText').value`)) === 'Summarise where this project is, and the one next step' && !(await mock.exists('[data-s=ask-message]')));
    await mock.click('[data-action=ask-go]'); await mock.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 10000);
    const msg = await mock.text('[data-s=ask-message]');
    check('Ask MyDay answers with a message naming the project and its first open task, and no cards', msg.includes('Practice helper (no AI)') && msg.includes('Shelf for the hall') && msg.includes('Measure the shelf') && (await mock.ev(`document.querySelectorAll('[data-s=ask-item]').length`)) === 0, msg);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);

    await mock.ev(`location.hash = 'projects/p/pjGp'`); await mock.until(`document.querySelector('#projectGlance')`, 5000); await sleep(200);
    check('on a private project At a glance says AI help is not offered here, instead of the button', !(await mock.exists('[data-action=glance-summary]')) && (await mock.text('#projectGlance [data-s=ai-private]')) === 'Private project — AI help isn\'t offered here.');
    await mock.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8o] See the pattern in the weekly review');
  {
    const at = `${TODAY}T08:00`;
    const PJ = (id, title, x = {}) => ({ id, title, summary: 'A made-up plan', stage: 'act', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, ...x });
    const DT = (id, title, projectId) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: true, doneOn: TODAY, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, projectId });
    await seeded(mock, MOCK);
    await mock.setData(`s => { s.projects.items = []; s.tasks.items = []; }`); await mock.until(`document.querySelector('#app')`);
    await mock.ev(`location.hash = 'review'`); await mock.until(`document.getElementById('reviewStep')`, 5000); await sleep(200);
    check('a quiet week has no "See the pattern" button', (await mock.exists('[data-s=review-quiet]')) && !(await mock.exists('[data-action=review-pattern]')));
    await mock.setData(`s => { s.projects.items.push(${JSON.stringify(PJ('pjWk', 'Garden shed'))}, ${JSON.stringify(PJ('pjWp', 'Shed private secret', { private: true }))});
      s.tasks.items.push(${JSON.stringify(DT('tkW1', 'Sweep the floor', 'pjWk'))}, ${JSON.stringify(DT('tkW2', 'Paint the door', 'pjWk'))},
        ${JSON.stringify(DT('tkW3', 'Hidden one', 'pjWp'))}, ${JSON.stringify(DT('tkW4', 'Hidden two', 'pjWp'))}, ${JSON.stringify(DT('tkW5', 'Hidden three', 'pjWp'))}); }`);
    await mock.ev(`location.hash = 'today'`); await sleep(200);
    await mock.ev(`location.hash = 'review'`); await mock.until(`document.querySelector('[data-s=review-moved]')`, 5000); await sleep(200);
    check('when something moved, step 1 offers "See the pattern"', (await mock.text('[data-action=review-pattern]')).includes('See the pattern'));
    await mock.click('[data-action=review-pattern]'); await mock.until(`document.getElementById('captureText')`, 5000); await sleep(250);
    check('tapping it opens + with "What pattern do you see in my week?" typed, and nothing answered yet', (await mock.ev(`document.getElementById('captureText').value`)) === 'What pattern do you see in my week?' && !(await mock.exists('[data-s=ask-message]')));
    const sendsW = await mock.text('[data-s=ask-sends]');
    check('the "Sent to the AI" preview has the chip "Your week: 1 project moved", counting only the project that is not private', sendsW.includes('Your week: 1 project moved'), sendsW);
    check('…and never names the private project or its tasks', !sendsW.includes('Shed private secret') && !sendsW.includes('Hidden'), sendsW);
    await mock.click('[data-action=ask-go]'); await mock.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 10000);
    const msgW = await mock.text('[data-s=ask-message]');
    check('Ask MyDay answers with a message from the practice helper naming the top project, and no cards', msgW.includes('Practice helper (no AI)') && msgW.includes('Garden shed') && !msgW.includes('Shed private secret') && (await mock.ev(`document.querySelectorAll('[data-s=ask-item]').length`)) === 0, msgW);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    await mock.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8p] A project\'s outcome, finish line and "where I left off" are never sent to Ask MyDay');
  {
    const at = `${TODAY}T09:00`;
    const OUT = 'Zebrafinch outcome: a hammock by the pond', FIN = 'Quokka finish line: both ropes tested', LEFT = 'Wombat note: waiting on the rope from the shop';
    const PJ = { id: 'pjLo', title: 'Pond hammock', summary: 'Beans of a plan', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at,
      outcome: OUT, finishedWhen: FIN, leftOff: { text: LEFT, at } };
    const hidden = t => !t.includes('Zebrafinch') && !t.includes('Quokka') && !t.includes('Wombat') && !t.includes('hammock by the pond') && !t.includes('ropes tested') && !t.includes('rope from the shop');
    const loSeed = `s => { s.projects.items = s.projects.items.filter(p => p.id !== 'pjLo'); s.projects.items.push(${JSON.stringify(PJ)}); }`;
    const openLo = async (Dv, text) => {
      await Dv.ev(`location.hash = 'projects/p/pjLo'`); await sleep(300);
      await Dv.click('[data-action=capture-open]'); await Dv.until(`document.getElementById('captureText')`);
      await Dv.type('#captureText', text); await sleep(150);
    };
    const goLo = async Dv => { await Dv.click('[data-action=ask-go]'); await Dv.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 15000); return Dv.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`); };
    await seeded(mock, MOCK); await mock.setData(loSeed); await mock.until(`document.querySelector('#app')`);
    await mock.ev(`location.hash = 'projects/p/pjLo'`); await mock.until(`document.querySelector('#projectLeftOff')`, 5000);
    check('the project page shows the three fields themselves', (await mock.text('[data-s=project-outcome]')).includes('Zebrafinch') && (await mock.text('[data-s=leftoff-text]')).includes('Wombat'));
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`);
    await mock.type('#captureText', 'Break this into smaller steps'); await sleep(200);
    await mock.ev(`document.querySelector('[data-s=ask-sends-all] summary').click()`); await sleep(150);
    const prevShort = await mock.text('[data-s=ask-sends]'), prevAll = await mock.text('[data-s=ask-sends-all]');
    check('Ask MyDay\'s preview names the project but none of the three texts, short or expanded', prevShort.includes('Pond hammock') && prevAll.includes('Beans of a plan') && hidden(prevShort) && hidden(prevAll), [prevShort, prevAll]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);

    setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model', AI_MIN_SECONDS_BETWEEN: '0' });
    await D.setData(loSeed); await D.until(`!document.getElementById('signInGate')`, 15000);
    const c0 = aiCalls().length;
    await openLo(D, 'Break this into smaller steps');
    const prevD = (await D.text('[data-s=ask-sends]'));
    const phase = await goLo(D);
    const sentLo = aiCalls().slice(c0).find(c => c.body.context.action === 'ask');
    const bodyLo = JSON.stringify(sentLo && sentLo.body);
    check('with an account, the request is sent and answered, and it does carry the project\'s title and summary', phase === 'shown' && !!sentLo && bodyLo.includes('Pond hammock') && bodyLo.includes('Beans of a plan'), [phase, bodyLo.slice(0, 300)]);
    check('…but the request body contains none of the outcome, the finish line or the note', !!sentLo && hidden(bodyLo) && !/outcome|finishedWhen|leftOff/.test(bodyLo), bodyLo);
    check('…and the preview shown for the same request had none of them', hidden(prevD), prevD);
    await D.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    await mock.ev(`location.hash = 'today'`); await D.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8q] Who a task is waiting on is never sent to Ask MyDay');
  {
    const at = `${TODAY}T09:00`;
    const ON = 'Narwhal joiner at the gate yard';
    const PJ = { id: 'pjWt', title: 'Garden gate', summary: 'A gate for the side path', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at };
    const TK = { id: 'tkWt', title: 'Fit the gate latch', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, projectId: 'pjWt',
      waiting: { on: ON, since: TODAY, until: '2026-12-30', chaseTaskId: 'tkChaseWt', futureBit: 'Okapi' } };
    // (Ask MyDay's offer to look at what you're waiting on, v21, names the lookup, never a wait: left aside here.)
    const offer = t => t.replace(/"can":\[[^\]]*\]/g, '"can":[]').replace(/If it needs to: what you’re waiting on/g, '').replace(/Or at the tasks you’ve marked as waiting[^.]*\./g, '')
      .replace(/Never who or what it’s waiting on[^.]*\./g, '').replace(/at what you’re waiting on/g, '');
    const hidden = t => !t.includes('Narwhal') && !t.includes('joiner') && !t.includes('Okapi') && !t.includes('tkChaseWt') && !/waiting/i.test(offer(t));
    const wtSeed = `s => { s.projects.items = s.projects.items.filter(p => p.id !== 'pjWt'); s.projects.items.push(${JSON.stringify(PJ)}); s.tasks.items = s.tasks.items.filter(t => t.id !== 'tkWt'); s.tasks.items.push(${JSON.stringify(TK)}); }`;
    const openWt = async (Dv, text) => {
      await Dv.ev(`location.hash = 'projects/p/pjWt'`); await sleep(300);
      await Dv.click('[data-action=capture-open]'); await Dv.until(`document.getElementById('captureText')`);
      await Dv.type('#captureText', text); await sleep(150);
    };
    await seeded(mock, MOCK); await mock.setData(wtSeed); await mock.until(`document.querySelector('#app')`);
    await mock.ev(`location.hash = 'projects/p/pjWt'`); await mock.until(`document.querySelector('#projectTasks')`, 5000);
    check('the project page shows the wait itself on the task row', (await mock.text('#projectTasks [data-s=task-waiting]')).includes('Narwhal joiner'), await mock.text('#projectTasks'));
    await mock.click('[data-action=capture-open]'); await mock.until(`document.getElementById('captureText')`);
    await mock.type('#captureText', 'Break this into smaller steps'); await sleep(200);
    await mock.ev(`document.querySelector('[data-s=ask-sends-all] summary').click()`); await sleep(150);
    const prevShort = await mock.text('[data-s=ask-sends]'), prevAll = await mock.text('[data-s=ask-sends-all]');
    check('Ask MyDay\'s preview names the project but nothing about who the task waits on, short or expanded', prevShort.includes('Garden gate') && prevAll.includes('A gate for the side path') && hidden(prevShort) && hidden(prevAll), [prevShort, prevAll]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);

    setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model', AI_MIN_SECONDS_BETWEEN: '0' });
    await D.setData(wtSeed); await D.until(`!document.getElementById('signInGate')`, 15000);
    const c0 = aiCalls().length;
    await openWt(D, 'Break this into smaller steps');
    const prevD = await D.text('[data-s=ask-sends]');
    await D.click('[data-action=ask-go]'); await D.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 15000);
    const phase = await D.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`);
    const sentWt = aiCalls().slice(c0).find(c => c.body.context.action === 'ask');
    const bodyWt = JSON.stringify(sentWt && sentWt.body);
    check('with an account, the request is sent and answered, and it does carry the project\'s title and summary', phase === 'shown' && !!sentWt && bodyWt.includes('Garden gate') && bodyWt.includes('A gate for the side path'), [phase, bodyWt.slice(0, 300)]);
    check('…but the request body contains neither the text of the wait nor the key "waiting"', !!sentWt && hidden(bodyWt) && !offer(bodyWt).includes('"waiting"') && !bodyWt.includes('chaseTaskId'), bodyWt);
    check('…and the preview shown for the same request had none of it', hidden(prevD), prevD);
    await D.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    await mock.ev(`location.hash = 'today'`); await D.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8r] Ask MyDay looks in your notes when an answer needs them (practice mode, then through the real server code)');
  {
    const at = `${TODAY}T09:00`;
    const NT = (id, title, text, x = {}) => ({ id, categoryId: '', title, text, pinned: false, createdAt: at, updatedAt: at, ...x });
    const PJ = (id, title, x = {}) => ({ id, title, summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, ...x });
    const lkSeed = `s => { s.patterns.prefs.aiNotes = true; s.projects.items = s.projects.items.filter(p => !['pjShedLk', 'pjHushLk', 'pjKilnLk'].includes(p.id));
      s.projects.items.push(${JSON.stringify(PJ('pjShedLk', 'Garden shed'))}, ${JSON.stringify(PJ('pjHushLk', 'Quiet plans', { private: true }))}, ${JSON.stringify(PJ('pjKilnLk', 'Pottery kiln', { decisions: [{ id: 'dKilnLk', question: 'Gas or electric?', options: [{ id: 'oGas', text: 'Gas', pros: ['Hotter'], cons: [] }, { id: 'oEl', text: 'Electric', pros: [], cons: [] }], chosen: null, why: '', decidedOn: null, createdAt: '2026-01-01T08:00', updatedAt: '2026-01-01T08:00' }] }))});
      s.tasks.items = s.tasks.items.filter(t => t.id !== 'tkWaitLk'); s.tasks.items.push({ id: 'tkWaitLk', title: 'Kiln shelves delivery', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-01-01T08:00', postponed: 0, blockers: [], letGoOn: null, projectId: 'pjKilnLk', waiting: { on: 'WHO-COURIER', since: '2026-01-01', until: null } });
      s.notes.items = s.notes.items.filter(n => !n.id.startsWith('nLk')); s.notes.items.push(${JSON.stringify(NT('nLkRack', 'Shed sizes', 'Leave room for a bike rack on the left wall.', { projectId: 'pjShedLk' }))},
        ${JSON.stringify(NT('nLkPriv', 'Walrus', 'my private bike rack worry', { private: true }))}, ${JSON.stringify(NT('nLkHush', 'Walrus two', 'a bike rack in the quiet plans', { projectId: 'pjHushLk' }))}); }`;
    const Q = 'What did I write about the bike rack?';
    const runLk = async (Dv, q = Q) => {
      await Dv.ev(`location.hash = 'today'`); await sleep(300);
      await Dv.click('[data-action=capture-open]'); await Dv.until(`document.getElementById('captureText')`);
      await Dv.type('#captureText', q); await sleep(150);
      const prev = await Dv.text('[data-s=ask-sends]');
      await Dv.click('[data-action=ask-go]'); await Dv.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 25000);
      return { prev, error: await Dv.text('[data-s=ask-panel] [role=alert]'), phase: await Dv.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`), looked: await Dv.text('[data-s=ask-looked]'),
        sources: await Dv.ev(`[...document.querySelectorAll('[data-s=ask-source]')].map(a => a.textContent + '|' + a.getAttribute('href'))`) };
    };
    await seeded(mock, MOCK); await mock.setData(lkSeed); await mock.until(`document.querySelector('#app')`);
    const pm = await runLk(mock);
    check('the preview says it may look across MyDay if needed (v24: in place of your notes)', pm.prev.includes('If needed, a look across MyDay'), pm.prev);
    check('practice mode: it looks across MyDay, and says so above the answer — one thing found, the two private ones only counted here, and when it was read', pm.phase === 'shown' && /^Looked across MyDay for “bike rack”: one thing — 2 private things left out\. Checked at \d\d:\d\d\.$/.test(pm.looked), pm.looked);
    check('…and the answer links the note it used', eq(pm.sources, ['Shed sizes|#projects/notes/nLkRack']), pm.sources);
    // The clock moves on 7 minutes: a follow-up answers from what was read the first time, and its line still says when.
    await mock.ev(`(() => { const D0 = Date; class D7 extends D0 { constructor(...a) { if (a.length) super(...a); else super(D0.now() + 420000); } static now() { return D0.now() + 420000; } } window.Date = D7; })()`);
    await mock.type('[data-s=ask-more]', 'and what did it cost?'); await mock.click('[data-action=ask-again]');
    await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && !!document.querySelector('[data-s=ask-now]')?.textContent.includes('what did it cost')`, 25000);
    const pmf = await mock.text('[data-s=ask-looked]');
    check('a reply 7 minutes later uses what was read the first time, and its line keeps that time', pmf === pm.looked, [pmf, pm.looked]);
    await mock.type('[data-s=ask-more]', 'Am I free on Thursday?'); await mock.click('[data-action=ask-again]');
    await mock.until(`document.querySelector('[data-s=ask-panel]')?.dataset.phase === 'shown' && !!document.querySelector('[data-s=ask-now]')?.textContent.includes('Thursday')`, 25000);
    const pmd = await mock.text('[data-s=ask-looked]');
    check('…and a reply about something else looks again (once per reply): its own line, read now', /^Looked at Thursday \d{1,2} \w+: /.test(pmd) && pmd.slice(-6) !== pm.looked.slice(-6), [pmd, pm.looked]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    const pdy = await runLk(mock, 'Am I free on Thursday?');
    check('practice mode: "Am I free on Thursday?" looks at that day and says so above the answer', pdy.phase === 'shown' && /^Looked at Thursday \d{1,2} \w+: /.test(pdy.looked) && pdy.sources.length === 0, [pdy.looked, pdy.error]);
    const hm = x => { const t = /Checked at (\d\d):(\d\d)\.$/.exec(x); return t ? Number(t[1]) * 60 + Number(t[2]) : NaN; };
    check('…and a new question\'s lookup says the new time (7 minutes on)', [7, 8].includes((hm(pdy.looked) - hm(pm.looked) + 1440) % 1440), [pm.looked, pdy.looked]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    const pdc = await runLk(mock, 'Which decisions am I putting off?');
    check('practice mode: "Which decisions am I putting off?" looks at your open decisions, says so above the answer and links the oldest (never what its pros say)', pdc.phase === 'shown' && /^Looked at your open decisions: (one decision|\d+ decisions)/.test(pdc.looked)
      && pdc.sources.some(x => x === 'Gas or electric?|#projects/p/pjKilnLk/decisions') && pdc.prev.includes('at your open decisions'), [pdc.looked, pdc.sources, pdc.error]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    const pwt = await runLk(mock, 'What am I waiting on?');
    check('practice mode: "What am I waiting on?" looks at what you\'re waiting on, says so above the answer and links the task (never who)', pwt.phase === 'shown' && /^Looked at what you’re waiting on: (one task|\d+ tasks)/.test(pwt.looked)
      && pwt.sources.some(x => x === 'Kiln shelves delivery|#today/tasks/tkWaitLk') && pwt.prev.includes('at what you’re waiting on') && !/WHO-COURIER/.test(pwt.looked + pwt.sources.join()), [pwt.looked, pwt.sources, pwt.error]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    const pst = await runLk(mock, 'What should I study next?');
    check('practice mode: "What should I study next?" from Today looks at the same next steps as the Study card, says so above the answer and links the next step', pst.phase === 'shown' && /^Looked at what to study next: /.test(pst.looked)
      && pst.sources.length > 0 && pst.sources.every(x => /\|#study/.test(x)) && pst.prev.includes('at what to study next'), [pst.looked, pst.sources, pst.error]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    // (v23) The task page's "Break into smaller steps" fills that task's checklist (practice mode): steps to tick, added there.
    await mock.ev(`location.hash = 'today/tasks/tkWaitLk'`); await mock.until(`!!document.querySelector('[data-action=task-ask-steps]')`, 15000);
    await mock.click('[data-action=task-ask-steps]'); await mock.until(`!!document.querySelector('[data-action=ask-go]')`, 10000); await sleep(200);
    await mock.click('[data-action=ask-go]'); await mock.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase)`, 25000);
    const stepItems = await mock.ev(`[...document.querySelectorAll('[data-s=ask-item]')].map(li => li.dataset.type)`);
    await mock.click('[data-action=ask-add]'); await sleep(400);
    const kiln = (await mock.data()).tasks.items.find(t => t.id === 'tkWaitLk');
    check('practice mode: "Break into smaller steps" on a task offers steps for its checklist, and Add puts them there (no new tasks)', stepItems.length === 3 && stepItems.every(t => t === 'step') && (kiln.steps ?? []).length === 3, [stepItems, kiln.steps]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    const ppj = await runLk(mock, "What's next on the pottery kiln?");
    const plink = await mock.ev(`document.querySelector('[data-s=ask-project]')?.getAttribute('href') || ''`);
    check('practice mode: "What\'s next on the pottery kiln?" from Today looks at that project, says so above the answer and links it', ppj.phase === 'shown' && /^Looked at your project “Pottery kiln”: /.test(ppj.looked) && plink === '#projects/p/pjKilnLk' && ppj.prev.includes('at one of your projects'), [ppj.looked, plink, ppj.error, ppj.prev]);
    await mock.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);

    // At the server's real pace (5 seconds between requests): the second request waits its turn rather than being refused.
    setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model', AI_MIN_SECONDS_BETWEEN: '5' });
    await D.setData(lkSeed); await D.until(`!document.getElementById('signInGate')`, 15000);
    await sleep(5500); // the last section's request may have been under 5 seconds ago
    const c0 = aiCalls().length;
    const pd = await runLk(D);
    const sent = aiCalls().slice(c0).filter(c => c.body?.context?.action === 'ask'), bodies = sent.map(c => JSON.stringify(c.body));
    check('with an account, through the real server code at its 5-second pace: two requests — the question, then what was found', pd.phase === 'shown' && sent.length === 2 && !('lookup' in sent[0].body.context) && sent[1].body.context.lookup?.query === 'bike rack', [pd.error, sent.map(c => Object.keys(c.body.context))]);
    check('…the second carries the note that may reach AI by name and reference (never its id or link), never the private ones — not even how many matched', bodies[1]?.includes('Shed sizes') && bodies[1]?.includes('"ref":"r1"') && !bodies[1]?.includes('nLkRack') && !bodies[1]?.includes('#projects/notes')
      && bodies.every(b => !/Walrus|nLkPriv|nLkHush|leftOut|Quiet plans|worry/.test(b)), bodies[1]);
    check('…and the answer shows what it looked for and links the note it used (its link kept on the device)', pd.looked.startsWith('Looked across MyDay for “bike rack”') && eq(pd.sources, ['Shed sizes|#projects/notes/nLkRack']), [pd.looked, pd.sources]);
    await D.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(5500); // the server's pace again
    const c1 = aiCalls().length;
    const pdp = await runLk(D, "What's next on the pottery kiln?");
    const sentP = aiCalls().slice(c1).filter(c => c.body?.context?.action === 'ask'), bodiesP = sentP.map(c => JSON.stringify(c.body));
    check('…and a look at a project at that pace too: two requests, the second carrying that project — never the private one, nor a private note', pdp.phase === 'shown' && sentP.length === 2 && sentP[1].body.context.lookup?.tool === 'project'
      && sentP[1].body.context.lookup.query === 'pjKilnLk' && bodiesP.every(b => !/Walrus|nLkPriv|nLkHush|leftOut|heldNotes|Quiet plans|worry/.test(b)), [pdp.looked, pdp.error, sentP.length]);
    await D.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await sleep(200);
    setAi({ AI_MIN_SECONDS_BETWEEN: '0' });
    await mock.ev(`location.hash = 'today'`); await D.ev(`location.hash = 'today'`); await sleep(200);
  }

  console.log('\n[8s] "Check my answer" under a lesson check (practice mode, then through the real server code)');
  {
    const LESSON = 'lesson.arabic-relative-clauses', Q2 = 'assessment.arabic-relative-clauses-check.q2', CYB = 'assessment.learning-evidence-check';
    const qSel = `[data-ar-question="${Q2}"]`, ansSel = `[data-s="ar-answer"][data-q="${Q2}"]`, panel = `${qSel} [data-s="check-answer"]`;
    const blurType = (Dv, sel, value) => Dv.type(sel, value).then(() => Dv.ev(`document.querySelector(${JSON.stringify(sel)}).blur()`)).then(() => sleep(250));
    // Opens the lesson, starts the standard session and goes to its Check step.
    const arabicSession = async (Dv, url) => {
      await Dv.open(url + '#study/arabic/' + LESSON); await Dv.until(`document.querySelector('[data-action="ar-begin"]')`, 15000);
      await Dv.ev(`document.querySelector('[data-s="ar-variant"][value="standard"]')?.click()`); await sleep(150);
      await Dv.click('[data-action="ar-begin"]'); await Dv.until(`document.querySelector('[data-ar-session="open"]')`, 10000);
      await Dv.ev(`document.querySelector('[data-action="ar-step"][data-v="check"]')?.click()`); await sleep(400);
      await Dv.until(`document.querySelector(${JSON.stringify(qSel)})`, 10000);
    };
    const partsShown = Dv => Dv.ev(`['hint', 'example', 'explanation', 'follow-up', 'follow-answer'].filter(p => document.querySelector('[data-s="ca-' + p + '"]')).join()`);
    const focused = Dv => Dv.ev(`document.activeElement?.dataset?.s || ''`);
    const ORDER = ['hint', 'example', 'explanation', 'follow-up', 'follow-answer'];
    const phaseOf = (Dv, sel) => Dv.ev(`document.querySelector(${JSON.stringify(sel)})?.dataset.phase || ''`);
    const waitPhase = (Dv, sel, ms = 15000) => Dv.until(`['shown', 'error'].includes(document.querySelector(${JSON.stringify(sel)})?.dataset.phase)`, ms);
    const logBefore8s = aiCalls().length;

    await arabicSession(mock, MOCK);
    check('Arabic check, before any answer is written: no "Check my answer"', !(await mock.exists(panel)) && !(await mock.exists(`${qSel} [data-action="ca-ask"]`)));
    await blurType(mock, ansSel, 'The book.');
    await mock.until(`document.querySelector(${JSON.stringify(panel + ' [data-action="ca-ask"]')})`, 5000);
    check('…after writing "The book." and leaving the box, "Check my answer" appears with the line saying what it sends', (await mock.text(`${panel} [data-action="ca-ask"]`)) === 'Check my answer' && (await mock.text(panel)).includes('Sends the lesson’s objectives and teaching, the skills it builds on, the question, its reference answer (and what else counts) and your answer — nothing else.'), await mock.text(panel));
    const savedBefore = await mock.ev(`localStorage.getItem('myday.data.v4')`);
    await mock.click(`${panel} [data-action="ca-ask"]`); await waitPhase(mock, panel);
    check('asking gives a reply labelled as the practice helper, with only the hint showing', (await phaseOf(mock, panel)) === 'shown' && (await mock.text(`${panel} [data-s="ca-shown"] .lbl`)) === 'Check my answer · practice helper (no AI)' && (await partsShown(mock)) === 'hint' && (await mock.text(`${panel} [data-s="ca-hint"]`)).includes('Practice helper (no AI)'), [await phaseOf(mock, panel), await partsShown(mock)]);
    check('…and the hint takes focus as it arrives (the button pressed has gone)', (await focused(mock)) === 'ca-hint', await focused(mock));
    const stepLog = [];
    for (let i = 1; i < 5; i++) {
      const label = await mock.text(`${panel} [data-action="ca-next"]`);
      await mock.click(`${panel} [data-action="ca-next"]`); await sleep(150);
      stepLog.push({ label, step: await mock.ev(`document.querySelector(${JSON.stringify(panel)}).dataset.step`), shown: await partsShown(mock), focus: await focused(mock) });
    }
    check('each "next" button reveals exactly one more part, in order (example, explanation, follow-up question, its answer)', stepLog.every((s, i) => s.step === String(i + 1) && s.shown === ORDER.slice(0, i + 2).join()), stepLog);
    check('…the buttons read "Show an example", "Show the explanation", "Try a follow-up question", "Show its answer"', eq(stepLog.map(s => s.label), ['Show an example', 'Show the explanation', 'Try a follow-up question', 'Show its answer']), stepLog.map(s => s.label));
    check('…focus moves to each new part as it appears', eq(stepLog.map(s => s.focus), ORDER.slice(1).map(p => 'ca-' + p)), stepLog.map(s => s.focus));
    check('…after the last part there is no next button', !(await mock.exists(`${panel} [data-action="ca-next"]`)) && (await mock.exists(`${panel} [data-action="ca-close"]`)));
    check('the suggested mark is "Right" (the answer equals the reference), only a suggestion, and without "Use this mark" before the reference answer is shown', (await mock.ev(`document.querySelector(${JSON.stringify(panel + ' [data-s="ca-mark"]')})?.dataset.v`)) === 'right' && (await mock.text(`${panel} [data-s="ca-mark"]`)).includes('Suggested mark: Right') && (await mock.text(`${panel} [data-s="ca-mark"]`)).includes('only a suggestion') && !(await mock.exists(`${panel} [data-action="ca-use-mark"]`)));
    check('asking and revealing every part saved nothing: the saved data is byte-for-byte what it was', (await mock.ev(`localStorage.getItem('myday.data.v4')`)) === savedBefore);
    check('practice mode made no AI request for it', aiCalls().length === logBefore8s);
    // Look at the reference answer, then ask again.
    await mock.click(`${panel} [data-action="ca-close"]`); await sleep(100);
    check('"Close" puts the panel back to asking, with focus on "Check my answer"', (await phaseOf(mock, panel)) === 'idle' && await mock.exists(`${panel} [data-action="ca-ask"]`) && (await mock.ev(`document.activeElement?.dataset?.action || ''`)) === 'ca-ask');
    await mock.click(`${qSel} [data-action="ar-reveal"]`); await mock.until(`document.querySelector(${JSON.stringify(qSel + ' [data-ar-mark]')})`, 8000);
    await mock.click(`${panel} [data-action="ca-ask"]`); await waitPhase(mock, panel);
    await mock.click(`${panel} [data-action="ca-next"]`); await sleep(120); await mock.click(`${panel} [data-action="ca-next"]`); await sleep(150);
    check('with the reference answer shown, the suggestion from the explanation step on has "Use this mark"', (await mock.ev(`document.querySelector(${JSON.stringify(panel)}).dataset.step`)) === '2' && (await mock.text(`${panel} [data-action="ca-use-mark"]`)) === 'Use this mark');
    check('…and before tapping it the question has no mark', (await mock.ev(`document.querySelector(${JSON.stringify(qSel + ' [data-ar-mark]')}).dataset.arMark`)) === 'none');
    await mock.click(`${panel} [data-action="ca-use-mark"]`); await sleep(300);
    check('"Use this mark" sets the question to Right with a hint, and says so', (await mock.ev(`document.querySelector(${JSON.stringify(qSel + ' [data-ar-mark]')}).dataset.arMark`)) === 'right:hint' && (await mock.text('#toast')).includes('Marked right. You can change it under “How did it go?”.'), [await mock.ev(`document.querySelector(${JSON.stringify(qSel + ' [data-ar-mark]')}).dataset.arMark`), await mock.text('#toast')]);

    // The usual build: AI off.
    await arabicSession(plain, PLAIN);
    await blurType(plain, ansSel, 'The book.');
    check('in the usual build (AI off) the answer is saved but there is no "Check my answer"', ((await plain.data()).arabic.attempts.slice(-1)[0].answers[Q2] === 'The book.') && !(await plain.exists('[data-action="ca-ask"]')) && !(await plain.exists('[data-s="check-answer"]')));

    // Cybersecurity notebook.
    const cyAns = async Dv => Dv.ev(`document.querySelector('textarea[id^="assessment"]').id`);
    await mock.ev(`location.hash = 'study/cybersecurity/${CYB}'`); await mock.until(`document.querySelector('[data-action=cyber-begin]')`, 10000);
    await mock.click('[data-action=cyber-begin]'); await mock.until(`document.querySelector('textarea[id^="assessment"]')`, 8000);
    const cid = await cyAns(mock), cSel = `[id="${cid}"]`;
    check('Cybersecurity check with an attempt begun and nothing written: no "Check my answer"', !(await mock.exists('[data-s="check-answer"]')));
    await blurType(mock, cSel, 'Evidence means something I can observe.');
    await mock.until(`document.querySelector('[data-action="ca-ask"]')`, 5000);
    check('after writing an answer the panel appears, saying what it sends', await mock.exists('[data-s="check-answer"][data-phase="idle"]') && (await mock.text('[data-s="check-answer"]')).includes('Sends the lesson’s objectives and teaching, the skills it builds on, the question, its reference answer and your answer — nothing else.'), await mock.text('[data-s="check-answer"]'));
    const cySaved = await mock.ev(`localStorage.getItem('myday.data.v4')`);
    await mock.click('[data-action="ca-ask"]'); await waitPhase(mock, '[data-s="check-answer"]');
    check('asking gives the practice helper\'s hint, with the "Assistance used" line, and then more parts one at a time', (await phaseOf(mock, '[data-s="check-answer"]')) === 'shown' && (await mock.text('[data-s="ca-shown"]')).includes('practice helper (no AI)') && (await mock.text('[data-s="ca-shown"]')).includes('Used hints or AI help') && (await partsShown(mock)) === 'hint', await partsShown(mock));
    await mock.click('[data-action="ca-next"]'); await sleep(150);
    check('…"Show an example" reveals the example and moves focus to it', (await partsShown(mock)) === 'hint,example' && (await focused(mock)) === 'ca-example');
    check('…and there is no "Use this mark" in the notebook, and nothing was saved by asking', !(await mock.exists('[data-action="ca-use-mark"]')) && (await mock.ev(`localStorage.getItem('myday.data.v4')`)) === cySaved);
    await mock.click('[data-action="ca-close"]');
    await blurType(mock, cSel, 'password: hunter2xyz');
    await mock.click('[data-action="ca-ask"]'); await waitPhase(mock, '[data-s="check-answer"]');
    const cyErr = await mock.text('[data-s="check-answer"] [role=alert]');
    check('an answer with a password written out is refused with a kind message, and no reply is shown', (await phaseOf(mock, '[data-s="check-answer"]')) === 'error' && cyErr.includes('Your answer has what looks like a password or key written out. Take it out first: your answer is sent to AI.') && !(await mock.exists('[data-s="ca-shown"]')), cyErr);
    check('…with focus on its "Try again"', (await mock.ev(`document.activeElement?.dataset?.action || ''`)) === 'ca-ask' && (await mock.ev(`document.activeElement?.textContent || ''`)) === 'Try again');
    check('…and still no AI request', aiCalls().length === logBefore8s);
    await mock.ev(`location.hash = 'today'`);

    // With an account: the real server code, a mock model.
    setAi({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model', AI_MIN_SECONDS_BETWEEN: '0' });
    await D.ev(`location.hash = 'today'`); await sleep(300);
    await arabicSession(D, EDGE);
    await blurType(D, ansSel, 'The book.');
    await D.until(`document.querySelector(${JSON.stringify(panel + ' [data-action="ca-ask"]')})`, 8000);
    const k0 = aiCalls().length;
    await D.click(`${panel} [data-action="ca-ask"]`); await waitPhase(D, panel, 20000);
    const ar8 = await D.text(`${panel} [data-s="ca-shown"] .lbl`);
    check('with an account, an Arabic check comes back shown, labelled "AI-written by Main model, not checked by your course"', (await phaseOf(D, panel)) === 'shown' && ar8 === 'Check my answer · AI-written by Main model, not checked by your course', [await phaseOf(D, panel), ar8, await D.text(`${panel} [role=alert]`)]);
    check('…it was one request to the server, signed in as you', aiCalls().slice(k0).length === 1 && aiCalls().slice(k0)[0].user === userA, aiCalls().slice(k0).map(c => c.user));
    await D.ev(`location.hash = 'study/cybersecurity/${CYB}'`); await D.until(`document.querySelector('[data-action=cyber-begin]')`, 10000);
    await D.click('[data-action=cyber-begin]'); await D.until(`document.querySelector('textarea[id^="assessment"]')`, 8000);
    await blurType(D, `[id="${await cyAns(D)}"]`, 'Evidence means something I can observe.');
    await D.until(`document.querySelector('[data-action="ca-ask"]')`, 5000);
    await D.click('[data-action="ca-ask"]'); await waitPhase(D, '[data-s="check-answer"]', 20000);
    const cy8 = await D.text('[data-s="ca-shown"] .lbl');
    check('…and a Cybersecurity check comes back shown, labelled "AI-written by Main model, not checked by your course"', (await phaseOf(D, '[data-s="check-answer"]')) === 'shown' && cy8 === 'Check my answer · AI-written by Main model, not checked by your course', [cy8, await D.text('[data-s="check-answer"] [role=alert]')]);
    await D.ev(`location.hash = 'today'`); await sleep(200);
    await mock.ev(`location.hash = 'today'`);
  }

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
