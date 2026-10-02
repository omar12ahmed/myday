const fs = require('fs');
const { execSync, spawn } = require('child_process');
const T = require('./cdp.js');
const LS_PORT = process.env.MYDAY_LS_PORT || 5500; // Live Server check (tests/run.sh sets it)
// Saved data compared without the save signatures, which change on every save by design.
const noSaves = t => { const o = typeof t === 'string' ? JSON.parse(t) : JSON.parse(JSON.stringify(t)); delete o.saves; return JSON.stringify(o); };
const { openAt, ev, click, exists, text, data, setEnergy, toast, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const setVal = (sel, v, evt = 'change') => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel}'); el.value = ${JSON.stringify(String(v))}; el.dispatchEvent(new Event('${evt}', { bubbles: true })); })()`);
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const mydayKeys = () => ev(`Object.keys(localStorage).filter(k => k.startsWith('myday')).sort()`);
const toU = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const dd = (a, b) => Math.round((toU(a) - toU(b)) / 864e5);
const addD = (s, n) => new Date(toU(s) + n * 864e5).toISOString().slice(0, 10);
const CYC = ['day', 'day', 'day', 'day', 'off', 'off', 'off', 'off', 'night', 'night', 'night', 'night', 'off', 'off', 'off', 'off'];
const ANCHOR = '2026-11-02';
const expectType = d => CYC[((dd(d, ANCHOR) % 16) + 16) % 16];
const SHORT = { day: 'Day', night: 'Night', off: 'Off' };
const cell = d => ev(`(() => { const c = document.querySelector('.cal-cell[data-date="${d}"]'); if (!c) return null; const ch = c.querySelector('.rchip.cell'); return ch ? ch.textContent : (c.querySelector('.cal-off') ? 'Off' : ''); })()`);
const gridCells = () => ev(`[...document.querySelectorAll('.cal-cell')].map(c => [c.dataset.date, (c.querySelector('.rchip.cell') || {}).textContent || (c.querySelector('.cal-off') ? 'Off' : '')])`);
const calTitle = () => text('.cal-title');
async function gotoMonth(ym) {
  for (let i = 0; i < 40; i++) {
    const t = await ev(`(() => { const c = [...document.querySelectorAll('.cal-cell:not(.out)')][0]; return c ? c.dataset.date.slice(0, 7) : null; })()`);
    if (t === ym) return;
    await click(t < ym ? '[data-action=cal-next]' : '[data-action=cal-prev]');
  }
  throw new Error('could not reach ' + ym);
}
async function select(d) { await gotoMonth(d.slice(0, 7)); await click(`.cal-cell[data-date="${d}"]`); }
const details = () => text('#detailsCard');
const glance = () => ev(`[...document.querySelectorAll('.glance li')].map(li => li.querySelector('.g-time').textContent + ' | ' + li.querySelector('.g-label').textContent)`);
const props = () => ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.prop-when').textContent + ' | ' + li.querySelector('.title').textContent)`);
const payCell = (row, col) => text(`tr[data-row="${row}"] .${col}`);
async function waitFor(expr, ms = 15000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await sleep(200); } return false; }
const setTZ = async tz => { await T.send('Emulation.setTimezoneOverride', { timezoneId: '' }).catch(() => {}); await T.send('Emulation.setTimezoneOverride', { timezoneId: tz }); };
const lumHex = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const rgbToHex = rgb => '#' + rgb.match(/\d+/g).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
const contrast = (a, b) => { const [x, y] = [lumHex(a), lumHex(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// A clean rota + pay setup written straight into storage (used by the pay checks).
const PATTERN = `{ id: 'p1', effectiveFrom: null, anchor: '${ANCHOR}', cycle: ${JSON.stringify(CYC)}, times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 0, night: 0 } }`;

(async () => {
  await T.connect();
  await setTZ('Europe/London');
  T.setUrl('index.html');

  console.log('\n[20] Navigation');
  await openAt(2026, 11, 2, 9); await reset(); await openAt(2026, 11, 2, 9);
  const navLabels = await ev(`[...document.querySelectorAll('#nav .nav-item')].map(a => a.textContent.trim())`);
  check('navigation shows Today, Calendar, Pay, Health and Study', eq(navLabels, ['Today', 'Calendar', 'Pay', 'Health', 'Study']), navLabels);
  check('unfinished sections (Ideas) are not shown as controls', !(await ev(`/Ideas/.test(document.getElementById('nav').textContent)`)) && !(await exists('a[href="#ideas"]')));
  check('Today is marked as the current page', (await text('#nav [aria-current=page]')).trim() === 'Today');
  await click('a.nav-item[href="#calendar"]'); await sleep(300);
  check('Calendar opens from the navigation', (await ev('location.hash')) === '#calendar' && (await exists('.cal-grid')) && (await text('#nav [aria-current=page]')).trim() === 'Calendar');
  T.setUrl('index.html#calendar'); await openAt(2026, 11, 2, 9);
  check('a refresh stays on Calendar', await exists('.cal-grid'));
  T.setUrl('index.html#ideas'); await openAt(2026, 11, 2, 9);
  check('an unfinished section in the address falls back to Today', (await text('#nav [aria-current=page]')).trim() === 'Today' && !(await exists('.cal-grid')));
  T.setUrl('index.html#pay'); await openAt(2026, 11, 2, 9);
  check('Pay opens and asks for a pattern/rate gently', (await exists('.pay-table')) && (await text('.pay-notes')).includes('No shift pattern yet'));
  await ev('history.back()'); await sleep(400);

  console.log('\n[21] Shift pattern: setup, many cycles, month/year boundaries, overrides, versions');
  T.setUrl('index.html#calendar'); await openAt(2026, 11, 2, 9);
  await click('[data-action=pattern-new]');
  check('setup form defaults to 4 days, 4 off, 4 nights, 4 off', (await text('#pfCycle')).includes('16 days') && (await ev(`[...document.querySelectorAll('[data-pf=seg-type]')].map(s => s.value + ':' + document.querySelector('[data-pf=seg-count][data-i="' + s.dataset.i + '"]').value).join()`)) === 'day:4,off:4,night:4,off:4');
  await setVal('#pfAnchor', ANCHOR);
  await click('[data-action=pattern-save]');
  const pat = (await data()).rota.patterns;
  check('pattern saved as its own definition', pat.length === 1 && pat[0].anchor === ANCHOR && pat[0].effectiveFrom === null && eq(pat[0].cycle, CYC));
  for (const ym of ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-06']) {
    await gotoMonth(ym);
    const cells = await gridCells();
    const bad = cells.filter(([d, t]) => t !== SHORT[expectType(d)]);
    check(`${ym}: all 42 cells match the 16-day cycle (incl. days before the anchor and across year end)`, bad.length === 0, bad.slice(0, 3));
  }
  await select('2026-11-03');
  await setVal('#calPlanned', 'off');
  await gotoMonth('2026-11');
  check('changing one date (3 Nov → Off) only changes that date', (await cell('2026-11-03')) === 'Off' && (await cell('2026-11-04')) === 'Day' && (await cell('2026-11-18')) === 'Day' && (await cell('2026-11-10')) === 'Night');
  const ov1 = (await data()).rota;
  check('override stored separately from the pattern', ov1.overrides['2026-11-03'].planned.type === 'off' && ov1.patterns.length === 1 && eq(ov1.patterns[0].cycle, CYC));
  await select('2026-11-20');
  await setVal('#calPlanned', 'custom');
  await setVal('#calPLabel', 'Course');
  check('custom planned status with its own label and times', (await cell('2026-11-20')) === 'Course' && (await details()).includes('Course · 09:00–17:00'));
  // A future pattern change from 4 Jan 2027: new times and a different cycle.
  await click('[data-action=pattern-new]');
  await setVal('#pfFrom', '2027-01-04'); await setVal('#pfAnchor', '2027-01-04');
  await setVal('[data-pf=seg-count][data-i="0"]', 2); await setVal('[data-pf=seg-count][data-i="1"]', 2);
  await click('[data-action=seg-remove][data-i="3"]'); await click('[data-action=seg-remove][data-i="2"]');
  await setVal('#pfDayS', '08:00'); await setVal('#pfDayE', '20:00');
  check('editor preview shows the new 4-day cycle', (await text('#pfCycle')).includes('4 days'));
  await click('[data-action=pattern-save]');
  const pats = (await data()).rota.patterns;
  check('future change saved as a second version, the first kept', pats.length === 2 && pats[0].effectiveFrom === null && pats[1].effectiveFrom === '2027-01-04' && eq(pats[0].cycle, CYC));
  await gotoMonth('2027-01');
  const jan = await gridCells();
  const before = jan.filter(([d]) => d < '2027-01-04'), after = jan.filter(([d]) => d >= '2027-01-04' && d.slice(0, 7) === '2027-01');
  check('dates before 4 Jan still follow the old rota', before.every(([d, t]) => t === SHORT[expectType(d)]), before.filter(([d, t]) => t !== SHORT[expectType(d)]));
  check('from 4 Jan: 2 days, 2 off', after.every(([d, t]) => t === (dd(d, '2027-01-04') % 4 < 2 ? 'Day' : 'Off')), after.slice(0, 6));
  await select('2026-12-21');
  const dec21 = await details();
  await select('2027-01-04');
  check('old dates keep old times (07:00–19:00); new ones use 08:00–20:00', (expectType('2026-12-21') !== 'day' || dec21.includes('07:00–19:00')) && (await details()).includes('08:00–20:00'), [expectType('2026-12-21')]);
  check('earlier changes untouched by the new version', (await data()).rota.overrides['2026-11-03'].planned.type === 'off');
  check('the future change can be removed', await exists('[data-action=pattern-remove]'));
  await click('[data-action=pattern-remove]');
  check('…and removing it restores the original rota', (await data()).rota.patterns.length === 1);

  console.log('\n[22] Statuses, separate entries, colours and legend');
  await select('2026-11-04');
  await setVal('#calActual', 'sick');
  const o4 = (await data()).rota.overrides['2026-11-04'];
  check('sick: shown as Sick, planned Day shift kept', (await cell('2026-11-04')) === 'Sick' && o4.actual.status === 'sick' && !o4.planned && (await details()).includes('Day shift · 07:00–19:00'));
  await select('2026-11-05'); await setVal('#calActual', 'annual_leave');
  await select('2026-11-10'); await setVal('#calActual', 'cancelled');
  await select('2026-11-11'); await setVal('#calActual', 'custom'); await setVal('#calALabel', 'Training');
  check('annual leave, cancelled and custom statuses', (await cell('2026-11-05')) === 'Leave' && (await cell('2026-11-10')) === 'Cancel' && (await cell('2026-11-11')) === 'Training');
  await select('2026-11-12');
  await click('[data-action=entry-new][data-kind=unauthorised]');
  await setVal('#efStart', '2026-11-12T19:00', 'input'); await setVal('#efEnd', '2026-11-13T07:00', 'input');
  await click('[data-action=entry-save]');
  check('unauthorised absence for the whole night shift → black "Absent"', (await cell('2026-11-12')) === 'Absent' && rgbToHex(await ev(`getComputedStyle(document.querySelector('.cal-cell[data-date="2026-11-12"] .rchip.cell')).backgroundColor`)) === '#111111');
  await select('2026-11-13');
  await click('[data-action=entry-new][data-kind=unauthorised]');
  await setVal('#efStart', '2026-11-13T19:00', 'input'); await setVal('#efEnd', '2026-11-13T21:00', 'input');
  await click('[data-action=entry-save]');
  check('partial absence keeps the Night label and adds a UA mark', (await cell('2026-11-13')) === 'Night' && (await text('.cal-cell[data-date="2026-11-13"] .cal-marks')).includes('UA'));
  await select('2026-11-02');
  await click('[data-action=entry-new][data-kind=overtime]');
  check('overtime form starts when the shift ends', (await ev(`document.getElementById('efStart').value`)) === '2026-11-02T19:00');
  await setVal('#efEnd', '2026-11-02T17:00', 'input');
  await click('[data-action=entry-save]');
  check('overtime ending before it starts is refused', (await text('#efError')).includes('after the start'));
  await setVal('#efEnd', '2026-11-02T21:00', 'input');
  await click('[data-action=entry-save]');
  const ents = (await data()).rota.entries;
  check('overtime and absences are stored as separate entries with start/end', ents.length === 3 && ents.some(e => e.kind === 'overtime' && e.start === '2026-11-02T19:00' && e.end === '2026-11-02T21:00'));
  check('+OT mark on the day', (await text('.cal-cell[data-date="2026-11-02"] .cal-marks')).includes('+OT'));
  const legend = await text('ul.legend');
  check('legend lists every status with a text label', ['Day shift', 'Night shift', 'Off', 'Sick', 'Annual leave', 'Cancelled', 'Custom', 'Unauthorised absence', 'Overtime', 'Appointment', 'Bank holiday', 'Overlapping entries'].every(l => legend.includes(l)));
  const defaults = { day: '#2f8f4e', night: '#a8d5f7', sick: '#f5a3a3', unauthorised: '#111111' };
  const legendColours = await ev(`Object.fromEntries([...document.querySelectorAll('ul.legend li')].filter(li => li.querySelector('.rchip')).map(li => [li.querySelector('span:last-child').textContent, [getComputedStyle(li.querySelector('.rchip')).backgroundColor, getComputedStyle(li.querySelector('.rchip')).color]]))`);
  check('default colours: green days, light blue nights, light red sickness, black absence', rgbToHex(legendColours['Day shift'][0]) === defaults.day && rgbToHex(legendColours['Night shift'][0]) === defaults.night && rgbToHex(legendColours['Sick'][0]) === defaults.sick && rgbToHex(legendColours['Unauthorised absence'][0]) === defaults.unauthorised);
  const worst = Math.min(...Object.values(legendColours).map(([bg, fg]) => contrast(rgbToHex(bg), rgbToHex(fg))));
  check('every chip label is readable (≥ 4.5:1)', worst >= 4.5, worst.toFixed(2));
  check('chips keep a visible outline on dark backgrounds (black chip in dark theme)', (await ev(`getComputedStyle(document.querySelector('.cal-cell[data-date="2026-11-12"] .rchip.cell')).boxShadow`)) !== 'none');
  await setVal('[data-colour=day]', '#e8e070');
  const dayChip = await ev(`(() => { const c = getComputedStyle(document.querySelector('.cal-cell[data-date="2026-11-18"] .rchip.cell')); return [c.backgroundColor, c.color]; })()`);
  check('colours are configurable and the label colour adapts (yellow → black text)', rgbToHex(dayChip[0]) === '#e8e070' && rgbToHex(dayChip[1]) === '#000000' && (await data()).rota.colours.day === '#e8e070');
  await click('[data-action=colours-reset]');
  check('colours reset to defaults', (await data()).rota.colours.day === '#2f8f4e');

  console.log('\n[23] Appointments next to shifts, overlaps, and Today');
  await select('2026-11-02');
  await click('[data-action=cal-appt]');
  await ev(`document.getElementById('cfTitle').value = 'Dentist'`);
  await setVal('#cfStart', '2026-11-02T10:00', 'input'); await setVal('#cfEnd', '2026-11-02T11:00', 'input');
  await click('[data-action=commit-save]');
  check('appointment added from the calendar shows in the day details', (await details()).includes('Dentist'));
  const ovl = await ev(`[...document.querySelectorAll('#detailsCard .warn')].map(w => w.textContent)`);
  check('overlap detected between the appointment and the day shift', ovl.some(w => w.includes('Day shift') && w.includes('Dentist')), ovl);
  check('overlap mark on the month cell', (await text('.cal-cell[data-date="2026-11-02"] .cal-marks')).includes('!'));
  await click('[data-action=cal-view][data-v=agenda]');
  check('agenda view lists shifts, overtime and appointments', (await text('ul.agenda')).includes('Dentist') && (await text('ul.agenda')).includes('Overtime'));
  await click('[data-action=cal-view][data-v=month]');
  T.setUrl('index.html#today'); await openAt(2026, 11, 2, 7);
  const g1 = await glance();
  check("Today's timeline includes the rota shift, overtime and the appointment", g1.includes('07:00–19:00 | Day shift') && g1.includes('10:00–11:00 | Dentist') && g1.includes('19:00–21:00 | Overtime'), g1);
  check('free time only after work, overtime and travel', g1.filter(r => r.includes('Available')).length === 0 || g1.filter(r => r.includes('Available')).every(r => r.startsWith('21:30')), g1);
  check('context card mentions the rota shift', (await text('#slot-context')).includes('From your rota: Day shift'));
  await setVal('#latestTime', '23:00');
  await setEnergy(3); await click('[data-action=build]');
  const pp = await props();
  check('proposed tasks fit after work and overtime (from 21:30)', pp.length === 2 && pp[0].startsWith('21:30'), pp);
  await click('[data-action=prop-cancel]');
  await openAt(2026, 11, 14, 5);
  await setVal('#earliestTime', '05:00');
  const g14 = await glance();
  check("a night shift from yesterday blocks this morning (until 07:00 + travel)", g14[0] === 'yesterday 19:00 – 07:00 | Night shift' && g14.some(r => r.startsWith('07:30–')), g14);
  await setVal('#earliestTime', '08:00'); await setVal('#latestTime', '21:00');

  console.log('\n[24] Bank holidays from gov.uk');
  T.setUrl('index.html#calendar'); await openAt(2026, 11, 2, 9);
  const nightBefore = (await gotoMonth('2026-12'), await cell('2026-12-28'));
  const loaded = await waitFor(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')).bankHolidays; return !!(s.divisions && s.fetchedAt); })()`);
  const bh = (await data()).bankHolidays;
  check('loaded from gov.uk (real network request) and cached with a time', loaded && Object.keys(bh.divisions).length === 3 && bh.fetchedAt.startsWith('2026-11-02T'), bh.fetchedAt);
  await openAt(2026, 11, 2, 9, 5); await gotoMonth('2026-12');
  check('"last updated" shown', (await text('#bhStatus')).startsWith('Last updated from gov.uk on'), await text('#bhStatus'));
  check('Christmas Day and Boxing Day (substitute, 28 Dec) marked in England and Wales', (await exists('.cal-cell[data-date="2026-12-25"] .cal-bh')) && (await exists('.cal-cell[data-date="2026-12-28"] .cal-bh')));
  check('bank holidays never change shifts', (await cell('2026-12-28')) === nightBefore && nightBefore === 'Night');
  await gotoMonth('2026-11');
  check("St Andrew's Day isn't a bank holiday in England and Wales", !(await exists('.cal-cell[data-date="2026-11-30"] .cal-bh')));
  await setVal('#bhRegion', 'scotland');
  check("…but is in Scotland (region selector)", await exists('.cal-cell[data-date="2026-11-30"] .cal-bh'));
  await setVal('#bhRegion', 'england-and-wales');
  // Failure: the cached copy is kept and nothing is invented.
  const before24 = (await data()).bankHolidays.fetchedAt;
  T.setHandler(d => { if (d.method === 'Fetch.requestPaused') T.send('Fetch.failRequest', { requestId: d.params.requestId, errorReason: 'InternetDisconnected' }).catch(() => {}); });
  await T.send('Fetch.enable', { patterns: [{ urlPattern: 'https://www.gov.uk/*' }] });
  await click('[data-action=bh-refresh]'); await sleep(800);
  check('offline: clear message, saved copy kept and still used', (await text('#side-section')).includes("Couldn't reach gov.uk") && (await text('#side-section')).includes('Showing the saved copy') && (await data()).bankHolidays.fetchedAt === before24);
  await reset(); await openAt(2026, 11, 2, 9, 10); await sleep(800); await gotoMonth('2026-12');
  check('offline with no saved copy: no bank holidays invented', !(await exists('.cal-bh:not(ul.legend .cal-bh)')) || (await ev(`document.querySelectorAll('.cal-grid .cal-bh').length`)) === 0);
  check('…and it says so', (await text('#side-section')).includes('No bank holidays are shown until it loads'));
  T.setHandler(d => { if (d.method === 'Fetch.requestPaused') T.send('Fetch.fulfillRequest', { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from('{"foo":1}').toString('base64') }).catch(() => {}); });
  await click('[data-action=bh-refresh]'); await sleep(800);
  check('unexpected data from gov.uk is rejected, not stored', (await text('#side-section')).includes('gov.uk sent something unexpected') && (await data()).bankHolidays.divisions === null);
  T.setHandler(null); await T.send('Fetch.disable');
  // Loading from a file:// page and from Live Server.
  T.setUrl('file://' + S + '/srv/index.html#calendar'); await openAt(2026, 11, 2, 9);
  const fileOk = await waitFor(`(() => { try { const s = JSON.parse(localStorage.getItem('${KEY}')); return !!(s && s.bankHolidays.divisions); } catch (e) { return false; } })()`);
  check('works when opened as a local file (file://)', fileOk, await text('#side-section'));
  let ls;
  try {
    ls = spawn('npx', ['--yes', 'live-server', 'srv', '--port=' + LS_PORT, '--host=127.0.0.1', '--no-browser', '--quiet'], { cwd: S, stdio: 'ignore', detached: true });
    let up = false;
    for (let i = 0; i < 60 && !up; i++) { await sleep(1000); try { execSync('curl -sf http://127.0.0.1:' + LS_PORT + '/index.html -o /dev/null'); up = true; } catch (e) {} }
    T.setUrl('http://127.0.0.1:' + LS_PORT + '/index.html#calendar'); await openAt(2026, 11, 2, 9);
    const lsOk = up && await waitFor(`(() => { try { const s = JSON.parse(localStorage.getItem('${KEY}')); return !!(s && s.bankHolidays.divisions); } catch (e) { return false; } })()`);
    check('works through Live Server (live-server on 127.0.0.1:5500)', lsOk, up ? await text('#side-section') : 'live-server did not start');
  } finally { try { process.kill(-ls.pid); } catch (e) {} }
  T.setUrl('index.html#calendar');

  console.log('\n[25] Pay');
  await reset(); await openAt(2026, 11, 9, 9);
  await editStorage(`s => { s.rota.patterns = [${PATTERN}]; s.rota.overrides = { '2026-11-03': { actual: { status: 'sick' } } };
    s.rota.entries = [{ id: 'o1', kind: 'overtime', start: '2026-11-07T10:00', end: '2026-11-07T14:00', note: '' }, { id: 'u1', kind: 'unauthorised', start: '2026-11-05T07:00', end: '2026-11-05T09:00', note: '' }]; }`);
  T.setUrl('index.html#pay'); await openAt(2026, 11, 9, 9);
  await setVal('#pay-hourlyRate', '15'); await setVal('#pay-frequency', 'weekly'); await setVal('#pay-periodAnchor', ANCHOR);
  await setVal('#pay-averageWeeklyEarnings', '600');
  await ev(`document.querySelector('[data-pay="sl-plan2"]').click()`);
  await click('[data-action=pay-prev]');
  check('weekly period 2–8 Nov selected', (await text('#payPeriod')).includes('2 Nov') && (await text('#payPeriod')).includes('8 Nov'), await text('#payPeriod'));
  check('scheduled vs actual are labelled and explained', (await text('.pay-table thead')).includes('Scheduled') && (await text('.pay-table thead')).includes('Actual') && (await text('#app')).includes('Scheduled is what your rota says'));
  const got = {};
  for (const r of ['shifts', 'hours', 'overtimeHours', 'sickDays', 'basic', 'overtimePay', 'sickPay', 'gross', 'tax', 'ni', 'sl', 'net']) got[r] = [await payCell(r, 'sched'), await payCell(r, 'act')];
  const want = { shifts: ['4', '3'], hours: ['48 h', '34 h'], overtimeHours: ['0 h', '4 h'], sickDays: ['0', '1 (1)'], basic: ['£720.00', '£510.00'], overtimePay: ['£0.00', '£90.00'],
    sickPay: ['£0.00', '£30.81'], gross: ['£720.00', '£630.81'], tax: ['−£95.60', '−£77.60'], ni: ['−£38.24', '−£31.10'], sl: ['−£13.00', '−£5.00'], net: ['£573.16', '£517.11'] };
  for (const k of Object.keys(want)) check(`week 2–8 Nov — ${k}: scheduled ${want[k][0]}, actual ${want[k][1]}`, eq(got[k], want[k]), got[k]);
  check('unmarked past shifts are flagged as assumed', (await text('.pay-notes')).includes('3 past shifts not marked yet'));
  check('SSP explained (first day, flat rate vs 80% AWE)', (await text('.pay-notes')).includes('SSP used: £123.25 a week (flat rate; average weekly earnings £600.00, entered)'));
  await setVal('#pay-averageWeeklyEarnings', '100');
  check('SSP uses 80% of AWE when lower (£80 ÷ 4 days = £20.00)', (await payCell('sickPay', 'act')) === '£20.00');
  await setVal('#pay-averageWeeklyEarnings', '600');
  // Annual leave on 4 Nov
  await editStorage(`s => { s.rota.overrides['2026-11-04'] = { actual: { status: 'annual_leave' } }; }`);
  await openAt(2026, 11, 9, 9, 1); await click('[data-action=pay-prev]');
  check('annual leave paid as normal pay for the planned shift (12 h, £180)', (await payCell('leaveHours', 'act')) === '12 h' && (await payCell('leavePay', 'act')) === '£180.00' && (await payCell('basic', 'act')) === '£330.00');
  await ev(`document.querySelector('[data-pay="annualLeavePaid"]').click()`);
  check('…or unpaid if you say so', !(await exists('tr[data-row="leavePay"]')) || (await payCell('leavePay', 'act')) === '£0.00');
  await ev(`document.querySelector('[data-pay="annualLeavePaid"]').click()`);

  // Bank holidays: double pay, clock vs whole-shift, overtime on a bank holiday (real gov.uk data).
  await editStorage(`s => { s.rota.overrides = { '2026-12-31': { planned: { type: 'off' } } }; s.rota.entries = [{ id: 'o2', kind: 'overtime', start: '2026-12-28T10:00', end: '2026-12-28T12:00', note: '' }]; }`);
  T.setUrl('index.html#pay'); await openAt(2027, 1, 4, 9);
  const bhOk = await waitFor(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')).bankHolidays; return !!s.divisions; })()`);
  await openAt(2027, 1, 4, 9, 1);
  await click('[data-action=pay-prev]');
  check('week 28 Dec – 3 Jan selected', bhOk && (await text('#payPeriod')).includes('28 Dec'), await text('#payPeriod'));
  const bhRows = { bhHours: [await payCell('bhHours', 'sched'), await payCell('bhHours', 'act')], bhPremium: [await payCell('bhPremium', 'sched'), await payCell('bhPremium', 'act')], gross: [await payCell('gross', 'sched'), await payCell('gross', 'act')], overtimePay: await payCell('overtimePay', 'act') };
  check('bank holiday hours "on the day": 5 h of the 28 Dec night (19:00–24:00) at double pay; overtime that day topped up to double', eq(bhRows, { bhHours: ['5 h', '7 h'], bhPremium: ['£75.00', '£90.00'], gross: ['£615.00', '£675.00'], overtimePay: '£45.00' }), bhRows);
  await setVal('#pay-bankHolidayHours', 'shift');
  const bhShift = [await payCell('bhHours', 'sched'), await payCell('bhPremium', 'sched'), await payCell('gross', 'sched')];
  check('"whole shift" treatment: all 12 h of the 28 Dec night doubled', eq(bhShift, ['12 h', '£180.00', '£720.00']), bhShift);
  await setVal('#pay-bankHolidayHours', 'clock');

  // Daylight saving: clocks go back (25 Oct 2026) and forward (28 Mar 2027).
  await editStorage(`s => { s.rota.overrides = { '2026-10-24': { planned: { type: 'night' } }, '2027-03-27': { planned: { type: 'night' } } }; s.rota.entries = []; }`);
  T.setUrl('index.html#pay'); await openAt(2026, 11, 9, 9);
  for (let i = 0; i < 3; i++) await click('[data-action=pay-prev]');
  check('week 19–25 Oct: night across the clocks going back is 13 h (12 + 12 + 13 + 12 = 49 h)', (await text('#payPeriod')).includes('19 Oct') && (await payCell('hours', 'sched')) === '49 h', [await text('#payPeriod'), await payCell('hours', 'sched')]);
  for (let i = 0; i < 22; i++) await click('[data-action=pay-next]');
  check('week 22–28 Mar: night across the clocks going forward is 11 h (12 + 11 + 12 = 35 h)', (await text('#payPeriod')).includes('22 Mar') && (await payCell('hours', 'sched')) === '35 h', [await text('#payPeriod'), await payCell('hours', 'sched')]);

  // Monthly period across a year boundary: December 2026.
  await setVal('#pay-frequency', 'monthly'); await setVal('#pay-periodAnchor', '2026-11-01');
  await click('[data-action=pay-next]');
  let shiftsDec = 0; for (let d = '2026-12-01'; d <= '2026-12-31'; d = addD(d, 1)) if (expectType(d) !== 'off') shiftsDec++;
  check(`monthly December period: ${shiftsDec} shifts, ${shiftsDec * 12} h (no overrides that month)`, (await text('#payPeriod')).includes('1 Dec') && (await payCell('shifts', 'sched')) === String(shiftsDec) && (await payCell('hours', 'sched')) === `${shiftsDec * 12} h`, [await text('#payPeriod'), await payCell('shifts', 'sched')]);
  check('tax year shown for the period (2026/27)', (await text('.pay-notes')).includes('2026/27 rates'));

  // SSP before the April 2026 reform: 4-day period of incapacity, 3 waiting days, £118.75.
  await editStorage(`s => { s.rota.patterns = [{ id: 'p2', effectiveFrom: null, anchor: '2026-03-02', cycle: ${JSON.stringify(CYC)}, times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 0, night: 0 } }];
    s.rota.overrides = { '2026-03-02': { actual: { status: 'sick' } }, '2026-03-03': { actual: { status: 'sick' } }, '2026-03-04': { actual: { status: 'sick' } }, '2026-03-05': { actual: { status: 'sick' } }, '2026-04-06': { actual: { status: 'sick' } } };
    s.pay.frequency = 'weekly'; s.pay.periodAnchor = '2026-03-02'; s.pay.averageWeeklyEarnings = 600; }`);
  T.setUrl('index.html#pay'); await openAt(2026, 3, 9, 9);
  await click('[data-action=pay-prev]');
  check('before 6 April 2026: 4 sick days, first 3 are waiting days, 1 paid at £118.75 ÷ 4 = £29.69', (await payCell('sickDays', 'act')) === '4 (1)' && (await payCell('sickPay', 'act')) === '£29.69', [await payCell('sickDays', 'act'), await payCell('sickPay', 'act')]);
  check('waiting days explained', (await text('.pay-notes')).includes('waiting day (rules before 6 April 2026)'));
  await openAt(2026, 4, 13, 9); await click('[data-action=pay-prev]');
  check('from 6 April 2026: a single sick day is paid from day one — £123.25 ÷ 3 qualifying days = £41.08', (await text('#payPeriod')).includes('6 Apr') && (await payCell('sickPay', 'act')) === '£41.08', [await text('#payPeriod'), await payCell('sickPay', 'act')]);
  await openAt(2026, 3, 9, 9, 1); await click('[data-action=pay-prev]');
  check('…March 2026 period uses 2025/26 rates', (await text('.pay-notes')).includes('2025/26 rates'));
  await setVal('#pay-taxCode', 'K100');
  check('unsupported tax codes are explained, not guessed', (await text('.pay-notes')).includes("K tax codes aren't supported"));
  await setVal('#pay-taxCode', 'S1257L');
  check('Scottish tax codes use Scottish bands (no error)', !(await text('.pay-notes')).includes("isn't recognised"));

  console.log('\n[26] Saved data: migration from version 3 and export/import');
  await reset();
  T.setUrl('v3.html'); await openAt(2026, 11, 2, 9);
  await setEnergy(3); await click('[data-action=build]'); await click('[data-action=prop-apply]');
  await ev(`document.querySelector('#app .task input').click()`);
  await click('[data-action=commit-new][data-kind=appointment]');
  await ev(`document.getElementById('cfTitle').value = 'Physio'`);
  await setVal('#cfStart', '2026-11-03T10:00', 'input'); await setVal('#cfEnd', '2026-11-03T11:00', 'input');
  await click('[data-action=commit-save]');
  await click('#themeBtn'); await sleep(300);
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1500);
  fs.renameSync(S + '/dl/myday-export-2026-11-02.json', S + '/v3-export.json');
  const v3raw = JSON.parse(await ev(`localStorage.getItem('myday.data.v3')`));
  check('setup: the previous app saved schemaVersion 3 data', v3raw.schemaVersion === 3);
  T.setUrl('index.html'); await openAt(2026, 11, 2, 10);
  const m4 = await data();
  check('migrated to myday.data.v4; myday.data.v3 removed', m4 && m4.schemaVersion === 4 && eq(await mydayKeys(), [KEY]));
  check('tasks, completion, commitments, context and theme preserved', eq(m4.days, v3raw.days) && eq(m4.commitments, v3raw.commitments) && eq(m4.context, v3raw.context) && m4.settings.theme === 'light' && m4.days['2026-11-02'].tasks[0].done === true);
  check('new sections start empty, with defaults', m4.rota.patterns.length === 0 && m4.pay.hourlyRate === null && m4.bankHolidays.divisions === null);
  check('theme applied before paint after migration', (await ev('document.documentElement.dataset.theme')) === 'light');
  await reset(); await openAt(2026, 11, 2, 11);
  await setFile(S + '/v3-export.json');
  check('a version-3 export imports into the new app', (await data()).schemaVersion === 4 && (await data()).days['2026-11-02'].tasks[0].done === true);
  await editStorage(`s => { s.rota.patterns = [${PATTERN}]; s.rota.overrides = { '2026-11-03': { planned: { type: 'off' }, actual: { status: 'sick' } } }; s.rota.entries = [{ id: 'o9', kind: 'overtime', start: '2026-11-07T10:00', end: '2026-11-07T14:00', note: 'x' }]; s.pay.hourlyRate = 15; }`);
  await openAt(2026, 11, 2, 12);
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1500);
  const e4 = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-11-02.json', 'utf8'));
  check('export (v4) includes rota, pay and the bank holiday cache', e4.schemaVersion === 4 && e4.data.rota.patterns.length === 1 && e4.data.rota.entries.length === 1 && e4.data.pay.hourlyRate === 15 && 'bankHolidays' in e4.data);
  const snap = await ev(`localStorage.getItem('${KEY}')`);
  await reset(); await openAt(2026, 11, 2, 13);
  await setFile(S + '/dl/myday-export-2026-11-02.json');
  check('importing it restores everything exactly', noSaves(await ev(`localStorage.getItem('${KEY}')`)) === noSaves(snap));

  console.log('\n[27] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const h of ['calendar', 'pay', 'today']) {
    T.setUrl('index.html#' + h); await openAt(2026, 11, 2, 9);
    check(`phone: no sideways scrolling (${h})`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  }
  check('phone: navigation is a bottom bar', (await ev(`(() => { const r = document.getElementById('nav').getBoundingClientRect(); return r.bottom >= innerHeight - 1 && r.height >= 56; })()`)));
  await T.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  T.setUrl('index.html#calendar'); await openAt(2026, 11, 2, 9);
  check('desktop: navigation sits in the top bar', (await ev(`document.getElementById('nav').getBoundingClientRect().top`)) === 0);
  check('desktop: legend and settings in the side column', (await ev(`document.getElementById('side-section').getBoundingClientRect().left > document.getElementById('app').getBoundingClientRect().right`)));
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const s = T.summary();
  console.log(`\n${s.pass} passed, ${s.fail} failed`);
  process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
