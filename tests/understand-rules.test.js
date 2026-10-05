// Understanding notes on the device (app/src/data/understand.ts, 1.13.0), on the app's own code bundled for Node, with
// made-up projects and notes: the words that count (common words left out, plurals and -ing endings matched, any
// script), which project a note clearly belongs to (and the notes that don't belong anywhere, share only one word, or
// could belong to several — none of those linked), the reason in the note's own words, "might belong here", related
// notes, Undo (never put back in that project) and Keep, done projects left out, the same links whatever order the
// notes are in, nothing marked as changed, a second look changing nothing, reading the saved link fields, and speed.
// No browser.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = o => JSON.parse(JSON.stringify(o));

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = path.join(os.tmpdir(), `myday-understand-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const src = p => JSON.stringify(path.join(ROOT, 'app/src/data', p));
  fs.writeFileSync(path.join(dir, 'kit.ts'), [`export * from ${src('understand')};`, `export { freshState, normalize } from ${src('normalize')};`].join('\n'));
  const K = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);

  // ---- Made-up data ----
  const P = (id, title, summary, status = 'active') => ({ id, title, summary, stage: 'explore', status, nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' });
  const N = (id, text, extra = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: '2026-10-02T09:00', updatedAt: '2026-10-02T09:00', ...extra });
  const world = () => {
    const d = K.freshState();
    d.projects.items = [
      P('pjCoffee', 'Coffee subscription for offices', 'Fresh coffee beans delivered to small offices every fortnight, priced per kilo.'),
      P('pjFlat', 'Move to a flat closer to work', 'Rent under £900 a month, near the hospital, two bedrooms.'),
      P('pjArabic', 'Learn Arabic for travel', 'Basic Arabic conversation and the alphabet before the trip to Jordan.'),
      P('pjPod', 'Start a podcast about nursing', 'Short episodes with nurses about shift work.'),
    ];
    d.notes.items = [
      // Clearly one project's
      N('nCompet', 'Competitors: Pact coffee and Grind deliver coffee to offices'),
      N('nRoast', 'Roasters: two local roasters sell beans per kilo for about £12'),
      N('nView', 'Flat viewing Saturday: 2 bedrooms, rent £850, 10 min from the hospital'),
      N('nAlpha', 'Arabic alphabet: 28 letters, practise writing them before Jordan'),
      N('nEpis', 'Podcast episode ideas: interview nurses about night shifts'),
      N('nMachine', 'The office coffee machine broke again'),
      // Not any project's
      N('nWifi', 'Wifi password is in the kitchen drawer'),
      N('nSam', 'Coffee with Sam on Friday'),
      N('nShop', 'Buy milk, bread and eggs'),
      N('nGP', 'Book GP appointment about my knee'),
      N('nGift', "Gift ideas for mum's birthday: scarf, book"),
      // Share just one word with a project (often an everyday one)
      N('xRota', 'Meeting at work about the new hospital rota'),
      N('xCafe', 'Two coffees and a cake at the cafe'),
      N('xRent', 'Pay rent and council tax'),
      N('xParty', 'Office party on Friday, bring snacks'),
      N('xShift', 'Swap my night shift on Thursday'),
      N('xBeans', 'Baked beans and toast for dinner'),
      N('xKilo', 'Lost a kilo this week, gym going well'),
      N('xWork', 'Work drinks Friday near the office'),
      // Could be several
      N('nMix', 'Coffee for the podcast guests'),
      N('nTrip', 'Call mum about her trip to Jordan'),
      N('nBlank', '   '),
    ];
    return d;
  };
  const best = (d, id) => K.projectMatches(d, d.notes.items.find(n => n.id === id))[0] ?? null;

  console.log('\n[1] The words that count');
  check('common words are left out; plurals and -ing endings match', eq(K.words('The offices are roasting beans and the roasters deliver!').map(w => w.stem), ['offic', 'roast', 'bean', 'roaster', 'deliver']), K.words('The offices are roasting beans and the roasters deliver!').map(w => w.stem));
  check('…each with the word as you wrote it', eq(K.words('Offices').map(w => [w.stem, w.word]), [['offic', 'offices']]) && eq(K.words('nursing nurses').map(w => w.stem), ['nurs', 'nurs']));
  check('any script (Arabic, accents) — not only English letters', eq(K.words('مرحبا café').map(w => w.stem), ['مرحبا', 'café']));
  check('numbers, prices and very short words don\'t count', eq(K.words('£850 on 2 by 10am ok'), []), K.words('£850 on 2 by 10am ok'));

  console.log('\n[2] Which project a note clearly belongs to');
  const d = world();
  const expect = { nCompet: 'pjCoffee', nRoast: 'pjCoffee', nView: 'pjFlat', nAlpha: 'pjArabic', nEpis: 'pjPod', nMachine: 'pjCoffee', nTrip: 'pjArabic' };
  for (const [nid, pid] of Object.entries(expect)) {
    const b = best(d, nid);
    check(`"${d.notes.items.find(n => n.id === nid).text}" → ${d.projects.items.find(p => p.id === pid).title}`, b && b.project.id === pid && b.sure, b && { p: b.project.id, score: +b.score.toFixed(3), words: b.words, sure: b.sure });
  }
  check('the reason is in the note\'s own words: "coffee · offices · …"', best(d, 'nCompet').why.startsWith('coffee · ') && best(d, 'nCompet').why.includes('offices'), best(d, 'nCompet').why);

  console.log('\n[3] …and the notes that aren\'t linked');
  const links = K.connections(d);
  for (const nid of ['nWifi', 'nShop', 'nGP', 'nGift', 'xRota', 'xCafe', 'xRent', 'xParty', 'xShift', 'xBeans', 'xKilo', 'xWork']) check(`"${d.notes.items.find(n => n.id === nid).text}": no project`, !links.some(l => l.noteId === nid) && !(best(d, nid)?.sure));
  check('"Coffee with Sam on Friday" shares one word with the coffee business: offered, not linked', !links.some(l => l.noteId === 'nSam') && best(d, 'nSam')?.project.id === 'pjCoffee' && !best(d, 'nSam').sure);
  check('"Coffee for the podcast guests" could be either project: not linked', !links.some(l => l.noteId === 'nMix') && K.projectMatches(d, d.notes.items.find(n => n.id === 'nMix')).length >= 2);
  check('a blank note: nothing', !links.some(l => l.noteId === 'nBlank') && K.projectMatches(d, d.notes.items.find(n => n.id === 'nBlank')).length === 0);
  check('exactly the seven clear notes are linked', eq(links.map(l => l.noteId).sort(), Object.keys(expect).sort()), links.map(l => l.noteId));
  check('"Might belong here" (the coffee business): near-misses like "Coffee with Sam" — not notes about to be linked, nor the wifi password', (() => { const m = K.mightBelong(d, d.projects.items[0], 10).map(x => x.note.id); return m.includes('nSam') && !m.includes('nCompet') && !m.includes('nWifi'); })(), K.mightBelong(d, d.projects.items[0], 10).map(x => x.note.id));

  console.log('\n[4] Making the links');
  const d2 = world(), before = clone(d2);
  const made = K.connect(d2);
  const cof = d2.notes.items.find(n => n.id === 'nCompet');
  check('seven links made, each saying MyDay made it and why', made === 7 && cof.projectId === 'pjCoffee' && cof.linkedBy === 'rules' && cof.linkWhy === best(world(), 'nCompet').why, cof);
  check('nothing is marked as changed (no project or note "changed" time moves), so every device makes the same note', eq(d2.projects.items.map(p => p.updatedAt), before.projects.items.map(p => p.updatedAt)) && eq(d2.notes.items.map(n => n.updatedAt), before.notes.items.map(n => n.updatedAt)));
  check('a second look changes nothing', K.connect(d2) === 0);
  const d3 = world(); d3.notes.items.reverse(); d3.projects.items.reverse(); K.connect(d3);
  const linkOf = x => Object.fromEntries(x.notes.items.filter(n => n.projectId).map(n => [n.id, [n.projectId, n.linkWhy]]).sort(([a], [b]) => a.localeCompare(b)));
  check('the same links whatever order notes and projects are in', eq(linkOf(d2), linkOf(d3)), [linkOf(d2), linkOf(d3)]);
  check('a note you have open is left until you leave it', !K.connections(world(), 'nCompet').some(l => l.noteId === 'nCompet'));
  check('"MyDay connected these": the links it made', K.madeByMyDay(d2).length === 7);

  console.log('\n[5] Undo, Keep, and your choices');
  check('Undo: the note leaves the project…', K.unlink(d2, 'nCompet') && !('projectId' in cof) && !('linkedBy' in cof) && !('linkWhy' in cof) && eq(cof.notProjects, ['pjCoffee']));
  check('…and MyDay never puts it back in that project', K.connect(d2) === 0 && !cof.projectId && !K.projectMatches(d2, cof).some(m => m.project.id === 'pjCoffee'));
  const roast = d2.notes.items.find(n => n.id === 'nRoast');
  check('Keep: the link stays and becomes yours', K.keepLink(d2, 'nRoast') && roast.projectId === 'pjCoffee' && !('linkedBy' in roast) && K.madeByMyDay(d2).length === 5);
  const d4 = world(); d4.projects.items[0].status = 'done'; d4.projects.items[1].status = 'paused';
  check('done projects get no new notes; paused ones still can', !K.connections(d4).some(l => l.projectId === 'pjCoffee') && K.connections(d4).some(l => l.projectId === 'pjFlat'));
  const d5 = world(); d5.notes.items.find(n => n.id === 'nView').projectId = 'pjArabic';
  check('a note already in a project (yours) is never moved', !K.connections(d5).some(l => l.noteId === 'nView') && (K.connect(d5), d5.notes.items.find(n => n.id === 'nView').projectId === 'pjArabic'));

  console.log('\n[6] Related notes');
  const rel = K.relatedNotes(d, d.notes.items.find(n => n.id === 'nCompet')).map(r => r.note.id);
  check('related to the competitors note: the office coffee machine (first), not the wifi password or the shopping', rel[0] === 'nMachine' && !rel.includes('nWifi') && !rel.includes('nShop'), rel);
  check('…with the words they share', K.relatedNotes(d, d.notes.items.find(n => n.id === 'nCompet'))[0].why.includes('coffee'));
  check('a note on its own has no related notes', K.relatedNotes(d, d.notes.items.find(n => n.id === 'nGP')).length === 0);

  console.log('\n[7] Reading the saved link fields');
  const raw = clone(world());
  Object.assign(raw.notes.items[0], { projectId: 'pjCoffee', linkedBy: 'rules', linkWhy: 'x'.repeat(300), notProjects: ['pjFlat', 'pjFlat', 7, ''], private: true });
  Object.assign(raw.notes.items[1], { linkedBy: 'rules', linkWhy: 'stray' });          // no project: the link details go
  Object.assign(raw.notes.items[2], { projectId: 'pjFlat', linkedBy: 'someone', private: 'yes' }); // unknown "by", not true
  const R = K.normalize(raw);
  const [r0, r1, r2] = R.notes.items;
  check('kept: who linked it, why (up to 120 characters), the projects you took it out of (once each), private', r0.linkedBy === 'rules' && r0.linkWhy.length === 120 && eq(r0.notProjects, ['pjFlat']) && r0.private === true);
  check('left out: link details without a link, an unknown "linked by", "private" that isn\'t exactly true', !('linkedBy' in r1) && !('linkWhy' in r1) && !('linkedBy' in r2) && r2.projectId === 'pjFlat' && !('private' in r2));
  check('notes without any of these look exactly as before 1.13.0', eq(Object.keys(R.notes.items[5]).sort(), ['categoryId', 'createdAt', 'id', 'pinned', 'text', 'title', 'updatedAt']));

  console.log('\n[8] Fast enough with a lot of notes');
  const big = world();
  for (let i = 0; i < 20; i++) big.projects.items.push(P('pjX' + i, `Project number ${i} about topic${i} things`, `topic${i} plans and topic${i} notes`));
  for (let i = 0; i < 600; i++) big.notes.items.push(N('nX' + i, `Note ${i} about topic${i % 25} and some ordinary words like plans, people and places ${i % 7 ? 'shopping list' : 'garden'}`));
  const t0 = Date.now(); const n = K.connect(big); const ms = Date.now() - t0;
  check(`600 notes and 24 projects looked at in under 2 seconds (${ms} ms, ${n} links)`, ms < 2000);

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
