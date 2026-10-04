// Capture: what's spotted in what you type (app/src/capture/parse.ts, bundled for Node, with the real chrono-node and
// compromise), on examples — dates and times (UK order, "the 14th", ranges), titles without the date's words, what it
// looks like (appointment, task, idea, note), the list a task fits, people, and the note collection it might fit.
// "Now" is Sunday 4 October 2026, 09:00, UK time. No browser; nothing is saved.
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
process.env.TZ = 'Europe/London';

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const P = await import(pathToFileURL(await bundle(path.join(ROOT, 'app/src/capture/parse.ts'), path.join(os.tmpdir(), `myday-capture-${process.pid}`))).href);
  const fromApp = m => require(require.resolve(m, { paths: [path.join(ROOT, 'app')] }));
  const libs = { chrono: fromApp('chrono-node'), nlp: fromApp('compromise') };
  const now = new Date(2026, 9, 4, 9, 0);
  const cols = ['Lifestyle', 'Business ideas', 'Health & fitness', 'Money', 'Study & career', 'Personal'].map((name, i) => ({ id: 'c' + i, name }));
  const col = id => (cols.find(c => c.id === id) || {}).name || null;
  const parse = t => P.parseCapture(t, now, libs, cols);
  const show = c => ({ kind: c.kind, title: c.title, date: c.date, time: c.time, endTime: c.endTime, category: c.category, people: c.people, collection: col(c.collection) });
  const is = (t, want) => { const got = show(parse(t)); const ok = Object.entries(want).every(([k, v]) => JSON.stringify(got[k]) === JSON.stringify(v)); check(`"${t}" → ${Object.entries(want).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(', ')}`, ok, got); };

  console.log('\n[1] Times and dates → the Calendar, or a dated task');
  is('call GP tomorrow at 10am', { kind: 'appointment', title: 'Call GP', date: '2026-10-05', time: '10:00', endTime: null, category: 'health' });
  is('dentist on the 14th at 3pm', { kind: 'appointment', title: 'Dentist', date: '2026-10-14', time: '15:00' });
  is('dentist on the 2nd at 9am', { kind: 'appointment', date: '2026-11-02', time: '09:00' }); // the 2nd has passed this month
  is('meeting with Jo next Tuesday 2-3pm', { kind: 'appointment', title: 'Meeting with Jo', date: '2026-10-06', time: '14:00', endTime: '15:00', people: ['Jo'] });
  is('gym at 6pm', { kind: 'appointment', title: 'Gym', date: '2026-10-04', time: '18:00' });
  is('pay rent by Friday', { kind: 'task', title: 'Pay rent', date: '2026-10-09', time: null, category: 'admin' });
  is('revise subnetting tonight', { kind: 'task', title: 'Revise subnetting', date: '2026-10-04', time: null, category: 'learning' });
  is('4/10 bins out', { kind: 'task', title: 'Bins out', date: '2026-10-04' });

  console.log('\n[2] Tasks without a date');
  is('renew passport', { kind: 'task', title: 'Renew passport', date: null, category: 'admin' });
  is('buy milk', { kind: 'task', title: 'Buy milk', date: null });
  is('need to email the landlord', { kind: 'task', title: 'Email the landlord' });
  is('book physio', { kind: 'task', title: 'Book physio', category: 'health' });

  console.log('\n[3] Ideas and notes');
  is('app idea: shift-swap finder for nurses', { kind: 'idea', collection: 'Business ideas' });
  is('what if MyDay could read my rota from a photo', { kind: 'idea' });
  is('wifi password is in the drawer', { kind: 'note', date: null, collection: null });
  is('Sam called about the car', { kind: 'note', people: ['Sam'] });
  is('protein shake after the gym helps me recover', { kind: 'note', collection: 'Health & fitness' });
  is('my monthly budget is £1,200', { kind: 'note', collection: 'Money' });
  const renamed = P.parseCapture('ideas for the allotment this spring', now, libs, [{ id: 'g', name: 'Allotment' }]);
  check('a collection you named yourself is suggested when its name appears', renamed.collection === 'g', renamed);
  check('nothing typed: a note with no date', parse('   hello   ').kind === 'note' && parse('   hello   ').text === 'hello');
  check('the date\'s words are kept for you to see ("tomorrow at 10am")', parse('call GP tomorrow at 10am').when === 'tomorrow at 10am');

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
