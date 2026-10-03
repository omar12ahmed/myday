// Finance in the new app (it replaced Pay): your rates saved once, work pay worked out from the Calendar (and
// changing when you pick up overtime or a shift is cancelled), monthly expenses, money owed, what's left over,
// saved data (export/import, damaged entries, the current MyDay keeping it), and layout.
const fs = require('fs');
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
// Types into a field the way a person does (React sees it); `change` too, for fields saved when you finish them.
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const answer = async yes => { await sleep(150); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(200); };
const rows = sel => ev(`Object.fromEntries([...document.querySelectorAll('${sel} [data-row]')].map(r => [r.dataset.row, (r.lastElementChild || r).textContent]))`);
const pay = () => rows('#workPay'), left = () => rows('#leftOver');
const fin = async () => (await data()).finance;
const money = n => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
const PATTERN = `{ id: 'p1', effectiveFrom: null, anchor: '2026-10-01', cycle: ['day','day','day','day','off','off','off','off','night','night','night','night','off','off','off','off'],
  times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 30, night: 30 } }`;
const BH = `{ region: 'england-and-wales', fetchedAt: 'WHEN', divisions: { 'england-and-wales': [{ date: '2026-12-25', title: 'Christmas Day' }, { date: '2026-12-28', title: 'Boxing Day (substitute day)' }], scotland: [], 'northern-ireland': [] } }`;

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] Finance replaces Pay, and your rates are saved once');
  await go('today', 2026, 10, 15); await reset(); await go('today', 2026, 10, 15);
  await editStorage(`s => { s.rota.patterns = [${PATTERN}]; s.bankHolidays = ${BH.replace('WHEN', '2026-10-15T08:00')};
    s.pay.averageWeeklyEarnings = 321; s.pay.bankHolidayHours = 'clock'; s.pay.taxCode = '1257L'; s.pay.hourlyRate = 11; }`);
  await go('today', 2026, 10, 15, 9, 1);
  check('the navigation says Finance where it said Pay', eq(await ev(`[...document.querySelectorAll('#nav .nav-item')].map(a => a.textContent.trim())`), ['Today', 'Calendar', 'Finance', 'Health', 'Study']));
  check('nothing is changed before Finance is opened', (await data()).pay.hourlyRate === 11 && (await fin()).ratesSetOn === null);
  await click('#nav a[href="#finance"]'); await sleep(400);
  const p = (await data()).pay;
  check('opening Finance saves your rates: £13.85 an hour, overtime at the normal rate, bank holidays ×2, tax code 1241T, NI A, Plan 2, calendar months',
    p.hourlyRate === 13.85 && p.overtimeMultiplier === 1 && p.bankHolidayMultiplier === 2 && p.taxCode === '1241T' && p.niCategory === 'A' && eq(p.studentLoans, { plan1: false, plan2: true, plan4: false, plan5: false, postgrad: false }) && p.frequency === 'monthly' && p.periodAnchor === '2026-10-01', p);
  check('…says so in a message', (await text('#toast')).includes('Your rates are set'), await text('#toast'));
  check('…and leaves the other pay settings as they were', p.averageWeeklyEarnings === 321 && p.bankHolidayHours === 'clock' && (await fin()).ratesSetOn === '2026-10-15');
  await editStorage(`s => { s.pay.hourlyRate = 14.10; }`);
  await go('finance', 2026, 10, 15, 9, 2);
  check('…only once: a later change is kept', (await data()).pay.hourlyRate === 14.1);
  await editStorage(`s => { s.pay.hourlyRate = 13.85; }`);
  await go('pay', 2026, 10, 15, 9, 3);
  check('the old #pay address opens Finance', (await exists('#workPay')) && (await text('#nav [aria-current=page]')).trim() === 'Finance');
  const shown = await text('#app');
  check('only what you asked for: no settings card, no scheduled-vs-actual table, no hours or sick pay rules', !/Pay settings|Scheduled|Paid hours|Sick pay|Average weekly earnings/.test(shown));
  check('your rates are folded away at the bottom (closed), with a one-line summary', (await ev(`document.getElementById('rates').open`)) === false && (await text('#rates summary')).includes('£13.85 an hour · tax code 1241T · NI A · Plan 2'), await text('#rates summary'));

  console.log('\n[2] Work pay for the month, from the shifts on the Calendar');
  // October 2026: 4 days, 4 off, 4 nights, 4 off from 1 Oct → 16 shifts (8 by the 15th), 11.5 paid hours each.
  const gross16 = 16 * 11.5 * 13.85; // £2,548.40
  let w = await pay();
  check('the pay period is this calendar month', (await text('#finPeriod')) === 'October 2026' && (await text('#workPay')).includes('This month'));
  check('shifts worked so far: 8, and 8 more planned this month', w.shifts === '8' && /\+ 8 more planned/.test(w.toCome || ''), w);
  check(`gross pay for the month: 16 shifts × 11.5 h × £13.85 = ${money(gross16)}`, w.gross === money(gross16), w.gross);
  check('Income Tax −£302.60 (1241T), National Insurance −£120.03 (category A), student loan −£8.00 (Plan 2)', w.tax === '−£302.60' && w.ni === '−£120.03' && w.sl === '−£8.00', w);
  check('take-home (est.) £2,117.77', w.net === '£2,117.77', w.net);
  check('labelled as an estimate, with the tax year and where the rules come from', (await text('.fin-notes')).includes('Estimate for this month on its own, using 2026/27 tax rules from gov.uk'));
  // Picking up overtime in the Calendar: 22 Oct (a day off), 08:00–14:00.
  await go('calendar', 2026, 10, 15, 9, 4);
  await click('.cal-cell[data-date="2026-10-22"]'); await sleep(150);
  await click('[data-action=entry-new][data-kind=overtime]'); await sleep(100);
  await type('#efStart', '2026-10-22T08:00'); await type('#efEnd', '2026-10-22T14:00');
  await click('[data-action=entry-save]'); await sleep(200);
  await click('#nav a[href="#finance"]'); await sleep(300);
  w = await pay();
  check('after picking up 6 h of overtime in the Calendar: 9 more planned, including 1 overtime', /\+ 9 more planned/.test(w.toCome || '') && /including 1 overtime/.test(w.overtime || ''), w);
  check(`…paid at the normal rate: gross goes up by 6 × £13.85 = £83.10`, w.gross === money(gross16 + 83.10), w.gross);
  // A shift cancelled in the Calendar: 17 Oct.
  await go('calendar', 2026, 10, 15, 9, 5);
  await click('.cal-cell[data-date="2026-10-17"]'); await sleep(150);
  await type('#calActual', 'cancelled'); await sleep(200);
  await click('#nav a[href="#finance"]'); await sleep(300);
  w = await pay();
  check('after a shift is cancelled in the Calendar: one fewer planned, and its pay is gone', /\+ 8 more planned/.test(w.toCome || '') && w.gross === '£2,472.23', w);
  // Bank holidays at double pay: 4 h of overtime on Christmas Day.
  await editStorage(`s => { s.rota.entries.push({ id: 'xmas', kind: 'overtime', start: '2026-12-25T09:00', end: '2026-12-25T13:00', note: '' }); }`);
  await go('finance', 2026, 10, 15, 9, 6);
  const decWith = async () => { await click('[data-action=fin-next]'); await click('[data-action=fin-next]'); return pay(); };
  const dWith = await decWith();
  await editStorage(`s => { s.rota.entries = s.rota.entries.filter(e => e.id !== 'xmas'); }`);
  await go('finance', 2026, 10, 15, 9, 7);
  const dWithout = await decWith();
  const toNum = v => Number(v.replace(/[£,]/g, ''));
  check('December: 4 h of overtime on Christmas Day add 4 × £13.85 × 2 = £110.80 (bank holidays are double)', (await text('#finPeriod')) === 'December 2026' && Math.abs(toNum(dWith.gross) - toNum(dWithout.gross) - 110.80) < 0.005, [dWith.gross, dWithout.gross]);
  check('a future month says "Shifts planned"', (await text('#workPay [data-row=shifts]')).startsWith('Shifts planned'));
  await click('[data-action=fin-now]'); await sleep(100);
  check('"Back to this month" returns to October', (await text('#finPeriod')) === 'October 2026' && !(await exists('[data-action=fin-now]')));
  // Changing a rate under "Rates" updates the figures straight away.
  await ev(`document.getElementById('rates').open = true`);
  await type('#rate-hourly', '14.50'); await sleep(150);
  w = await pay();
  check('a pay rise under "Rates" (£14.50) updates the month straight away and is saved', (await data()).pay.hourlyRate === 14.5 && w.gross === money(Math.round((15 * 11.5 * 14.5 + 6 * 14.5) * 100) / 100), w.gross);
  await type('#rate-hourly', 'abc'); await sleep(150);
  check('…something that isn\'t an amount is refused, kindly, and the rate stays', (await data()).pay.hourlyRate === 14.5 && (await text('#toast')).includes('hourly rate in pounds'));
  await type('#rate-loan', 'none'); await sleep(150);
  check('no student loan: its line disappears', !(await exists('#workPay [data-row=sl]')) && !(await data()).pay.studentLoans.plan2);
  await type('#rate-loan', 'plan2'); await type('#rate-hourly', '13.85'); await sleep(150);
  await type('#rate-periodDay', '26'); await sleep(150);
  check('a pay month starting on the 26th: "Sat 26 Sept – Sun 25 Oct"', (await text('#finPeriod')) === 'Sat 26 Sept – Sun 25 Oct' && (await data()).pay.periodAnchor === '2026-10-26', await text('#finPeriod'));
  await type('#rate-periodDay', '1'); await sleep(150);
  check('…and back to calendar months', (await text('#finPeriod')) === 'October 2026');

  console.log('\n[3] Monthly expenses');
  await type('#expName', 'Rent'); await type('#expAmount', '650'); await click('[data-action=exp-add]'); await sleep(150);
  await type('#expName', 'Phone'); await type('#expAmount', '£25.50'); await click('[data-action=exp-add]'); await sleep(150);
  let f = await fin();
  check('two expenses added (amounts with or without £)', eq(f.expenses.map(e => [e.name, e.amount]), [['Rent', 650], ['Phone', 25.5]]));
  check('…the fields are cleared, and the total is £675.50 a month', (await ev(`document.getElementById('expName').value + document.getElementById('expAmount').value`)) === '' && (await text('[data-total=expenses]')) === '£675.50 a month');
  await type('#expName', 'Gym'); await type('#expAmount', 'abc'); await click('[data-action=exp-add]'); await sleep(100);
  check('an amount that isn\'t one is explained beside the form, and nothing is added', (await text('#expError')).includes('Enter an amount in pounds') && (await fin()).expenses.length === 2);
  await type('#expName', ''); await type('#expAmount', '30'); await click('[data-action=exp-add]'); await sleep(100);
  check('…so is a missing name', (await text('#expError')).includes('What is the expense') && (await fin()).expenses.length === 2);
  await type('#expName', 'Gym'); await type('#expAmount', '30');
  await ev(`(() => { const b = document.querySelector('[data-action=exp-add]'); b.click(); b.click(); })()`); await sleep(200);
  check('a double tap adds it once', (await fin()).expenses.filter(e => e.name === 'Gym').length === 1);
  const rentId = (await fin()).expenses[0].id;
  await type(`.exp-row[data-id="${rentId}"] input.amount`, '700'); await sleep(100);
  await type(`.exp-row[data-id="${rentId}"] input.name`, 'Rent and bills'); await sleep(100);
  f = await fin();
  check('an amount and a name can be changed in place', f.expenses[0].amount === 700 && f.expenses[0].name === 'Rent and bills' && (await text('[data-total=expenses]')) === '£755.50 a month');
  const gymId = f.expenses.find(e => e.name === 'Gym').id;
  await click(`[data-action=exp-remove][data-id="${gymId}"]`); await answer(false);
  check('removing asks first ("Keep it" keeps it)', (await fin()).expenses.length === 3);
  await click(`[data-action=exp-remove][data-id="${gymId}"]`); await answer(true);
  check('…and "Remove" removes it', (await fin()).expenses.length === 2 && (await text('[data-total=expenses]')) === '£725.50 a month');

  console.log('\n[4] Money owed, both ways');
  await type('#debtWho', 'Sam'); await type('#debtAmount', '40'); await type('#debtNote', 'concert tickets'); await click('[data-action=debt-add]'); await sleep(150);
  await click('[data-action=debt-owed]'); await sleep(50);
  check('the form follows the choice ("Who from" for money owed to you)', (await text('label[for=debtWho]')) === 'Who from');
  await type('#debtWho', 'Aisha'); await type('#debtAmount', '15'); await click('[data-action=debt-add]'); await sleep(150);
  f = await fin();
  check('added: you owe Sam £40 (with a note and the date), Aisha owes you £15', eq(f.debts.map(d => [d.direction, d.person, d.amount, d.note, d.since]), [['owe', 'Sam', 40, 'concert tickets', '2026-10-15'], ['owed', 'Aisha', 15, '', '2026-10-15']]));
  check('…in the right lists, with totals each way', (await text('[data-list=owe]')).includes('Sam') && (await text('[data-list=owed]')).includes('Aisha') && (await text('[data-total=owe]')) === 'You owe £40.00' && (await text('[data-total=owed]')) === "You're owed £15.00");
  await type('#debtWho', ''); await type('#debtAmount', '5'); await click('[data-action=debt-add]'); await sleep(100);
  check('who is needed (asked kindly)', (await text('#debtError')) === 'Who owes you?' && (await fin()).debts.length === 2);
  await type('#debtAmount', ''); await sleep(50);
  const samId = f.debts[0].id, aishaId = f.debts[1].id;
  await type(`.debt-row[data-id="${samId}"] input.amount`, '25'); await sleep(100);
  check('a part-payment: the amount can be changed in place (£25 left)', (await fin()).debts[0].amount === 25 && (await text('[data-total=owe]')) === 'You owe £25.00');
  await type(`.debt-row[data-id="${samId}"] input.amount`, '0'); await sleep(100);
  check('…zero isn\'t accepted as an amount (that\'s what "Settled" is for)', (await fin()).debts[0].amount === 25 && (await text('#toast')).includes('Settled'));
  await click(`[data-action=debt-settle][data-id="${aishaId}"]`); await sleep(150);
  check('settling asks first, in plain words', (await text('dialog')).includes('Aisha paid back £15.00?'));
  await answer(false);
  check('…"Not yet" keeps it', (await fin()).debts.length === 2);
  await click(`[data-action=debt-settle][data-id="${aishaId}"]`); await answer(true);
  check('…"Yes, settled" takes it off the list', (await fin()).debts.length === 1 && (await text('[data-list=owed]')).includes('Nobody owes you anything'));

  console.log('\n[5] What\'s left over');
  w = await pay(); let l = await left();
  const net = toNum(w.net), exp = 725.5;
  check('take-home minus monthly expenses', l.takeHome === w.net && l.expenses === '−£725.50' && l.left === money(Math.round((net - exp) * 100) / 100), l);
  check('…and money owed isn\'t counted in it (it says so)', (await text('#leftOver')).includes("Money owed isn't included"));
  await type('#expName', 'Holiday'); await type('#expAmount', '5000'); await click('[data-action=exp-add]'); await sleep(150);
  l = await left();
  check('when expenses are more than take-home, it says so plainly (no judgement)', l.left.startsWith('−£') && (await text('#leftOver')).includes("Expenses are more than this month's estimated take-home"), l);
  const holId = (await fin()).expenses.find(e => e.name === 'Holiday').id;
  await click(`[data-action=exp-remove][data-id="${holId}"]`); await answer(true);

  console.log('\n[6] Saved data: kept, exported, imported, and safe in the current MyDay');
  const before = await ev(`localStorage.getItem('${KEY}')`);
  await go('finance', 2026, 10, 15, 10);
  check('everything is still there after a reload', eq((await data()).finance, JSON.parse(before).finance) && (await text('[data-total=expenses]')) === '£725.50 a month');
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  await click('[data-action=export]'); await sleep(1200);
  const exported = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-15.json', 'utf8'));
  check('"Export my data" includes Finance', eq(exported.data.finance, (await data()).finance));
  await reset(); await go('today', 2026, 10, 15, 11);
  await setFile(S + '/dl/myday-export-2026-10-15.json'); await sleep(200); await answer(true);
  check('importing it brings Finance back exactly', eq((await data()).finance, exported.data.finance) && eq((await data()).pay, exported.data.pay));
  await editStorage(`s => { s.finance.debts.push({ id: 'x', direction: 'sideways', person: 'Nobody', amount: 5 }, { id: 'y', direction: 'owe', person: '', amount: 5 }, { id: 'z', direction: 'owe', person: 'Lee', amount: -3 });
    s.finance.expenses.push({ id: 'q', name: 'Ok', amount: 12.345 }, { id: 'r', name: 'No amount' }); s.finance.futureField = { kept: true }; }`);
  await go('finance', 2026, 10, 15, 12);
  check('damaged Finance entries are left out — and counted, with a copy offered (never silently)', (await text('#load-issue-h')) === "4 saved entries couldn't be read" && (await ev(`document.querySelectorAll('.debt-row').length`)) === 1 && (await ev(`document.querySelectorAll('.exp-row').length`)) === 3, await text('#load-issue-h'));
  await click('#themeBtn'); await sleep(250); await click('#themeBtn'); await sleep(250); await click('#themeBtn'); await sleep(250); // the next saves
  f = await fin();
  check('…after the next save: the good entries kept, amounts to the penny (12.345 → 12.35), unknown Finance fields kept', f.debts.length === 1 && f.expenses.length === 3 && f.expenses[2].amount === 12.35 && eq(f.futureField, { kept: true }), f);
  const savedNew = await ev(`localStorage.getItem('${KEY}')`);
  T.setUrl('index.html#today'); await openAt(2026, 10, 15, 13);
  await click('#themeBtn'); await sleep(250); await click('#themeBtn'); await sleep(250); await click('#themeBtn'); await sleep(250); // the current MyDay saves three times
  const savedLive = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  check('the current MyDay opens and saves this data, keeping Finance exactly as it was', eq(savedLive.finance, JSON.parse(savedNew).finance));
  check('…and its Pay shows the same rates (£13.85, 1241T)', savedLive.pay.hourlyRate === 13.85 && savedLive.pay.taxCode === '1241T');

  console.log('\n[7] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const theme of ['dark', 'light']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    await go('finance', 2026, 10, 15, 14);
    await ev(`document.getElementById('rates').open = true`);
    check(`phone (${theme}): nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  }
  const small = await ev(`[...document.querySelectorAll('#app button, #app input, #app select, #app summary')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id || b.className).trim().slice(0, 24), h: Math.round(r.height), w: Math.round(r.width) }; }).filter(x => x.h < 44 || x.w < 44)`);
  check('phone: every button and field is at least 44 px', small.length === 0, small.slice(0, 5));
  await T.send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 800, deviceScaleFactor: 1, mobile: false });
  await go('finance', 2026, 9, 30, 15); // "Wednesday 30 September", a long date
  const hdr = await ev(`(() => { const d = document.getElementById('date').getBoundingClientRect(), n = document.getElementById('nav').getBoundingClientRect(), t = document.getElementById('themeBtn').getBoundingClientRect(); return { d: d.right, n: n.left, nr: n.right, t: t.left }; })()`);
  check('wide screens: the sections bar never runs into a long date, or the theme button', hdr.n > hdr.d + 8 && hdr.nr < hdr.t, hdr);
  check('wide screens: two columns, nothing scrolls sideways', !(await ev('document.documentElement.scrollWidth > innerWidth')) && (await ev(`document.getElementById('expensesCard').getBoundingClientRect().left > document.getElementById('workPay').getBoundingClientRect().right`)));
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
