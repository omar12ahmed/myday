// Connections — the knowledge graph (app/src/data/graph.ts, milestone 4), on the app's own code bundled for Node, with
// made-up projects and notes: what's drawn (notes in projects, MyDay's links told apart, related notes, done projects only
// with notes, blank notes never), what isn't joined twice (two notes in one project), the groups that go together,
// notes that connect to nothing yet (counted, not drawn), the cap on how many are drawn, the same drawing every time
// (and whatever order the notes are saved in), nothing in the saved data changed, fitting the groups into a width, and
// speed. No browser.
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
  const dir = path.join(os.tmpdir(), `myday-graph-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const src = p => JSON.stringify(path.join(ROOT, 'app/src/data', p));
  fs.writeFileSync(path.join(dir, 'kit.ts'), [`export * from ${src('graph')};`, `export { freshState } from ${src('normalize')};`].join('\n'));
  const K = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);

  const P = (id, title, summary, status = 'active') => ({ id, title, summary, stage: 'explore', status, nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' });
  const N = (id, text, extra = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: '2026-10-02T09:00', updatedAt: '2026-10-02T09:00', ...extra });
  const world = () => {
    const d = K.freshState();
    d.projects.items = [P('pjC', 'Coffee subscription for offices', 'Fresh coffee beans delivered to small offices every fortnight.'),
      P('pjA', 'Learn Arabic for travel', 'Arabic conversation and the alphabet before Jordan.'),
      P('pjOld', 'Old finished project', 'Something finished', 'done'), P('pjDoneNotes', 'Wedding speech', 'The speech for Sam', 'done')];
    d.notes.items = [
      N('n1', 'Competitors: Pact coffee and Grind deliver coffee to offices', { projectId: 'pjC' }),
      N('n2', 'Roasters: two local roasters sell coffee beans per kilo', { projectId: 'pjC', linkedBy: 'rules', linkWhy: 'roasters · beans' }),
      N('n3', 'Arabic alphabet: 28 letters to practise before Jordan', { projectId: 'pjA' }),
      N('n4', 'Speech: thank the hosts first, then the story about the canoe', { projectId: 'pjDoneNotes' }),
      N('n5', 'Morning routine: sleep, water, a short walk along the canal'),
      N('n6', 'Walk: the canal route is quieter for a morning walk'),
      N('n7', 'Wifi password is in the kitchen drawer'),
      N('n8', '   ', { title: '' }),
      N('n9', 'Coffee beans from the market — Ethiopian, a kilo for very little', { private: true }),
    ];
    return d;
  };
  const keys = g => g.groups.flatMap(gr => gr.nodes.map(n => n.key)).sort();
  const edge = (g, a, b) => g.edges.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));

  console.log('\n[1] What is drawn');
  const d = world(), before = clone(d), g = K.knowledgeGraph(d);
  check('notes in projects, related notes and open projects are drawn', ['p:pjC', 'p:pjA', 'n:n1', 'n:n2', 'n:n3', 'n:n5', 'n:n6'].every(k => keys(g).includes(k)), keys(g));
  check('a note you put in a project is a plain link; one MyDay put there is told apart', edge(g, 'n:n1', 'p:pjC')?.kind === 'in' && edge(g, 'n:n2', 'p:pjC')?.kind === 'myday' && edge(g, 'n:n2', 'p:pjC').why === 'roasters · beans');
  check('related notes are joined, with the words they share', edge(g, 'n:n5', 'n:n6')?.kind === 'related' && /walk/.test(edge(g, 'n:n5', 'n:n6').why), edge(g, 'n:n5', 'n:n6'));
  check('two notes in the same project aren\'t joined again (their project holds them together)', !edge(g, 'n:n1', 'n:n2'));
  check('a related note outside the project is joined to a note in it (a private note too — this is only on the device)', !!edge(g, 'n:n9', 'n:n2') || !!edge(g, 'n:n9', 'n:n1'), g.edges);
  check('a done project with no notes isn\'t drawn; one that notes still belong to is', !keys(g).includes('p:pjOld') && keys(g).includes('p:pjDoneNotes'));
  check('a blank note is never drawn, and a note that connects to nothing is counted, not drawn', !keys(g).includes('n:n8') && !keys(g).includes('n:n7') && g.loose === 1, g.loose);
  check('projects carry their status (for how they\'re drawn)', g.groups.flatMap(gr => gr.nodes).find(n => n.key === 'p:pjDoneNotes').status === 'done');
  check('nothing in the saved data changed by working it out', eq(before, d));

  console.log('\n[2] Groups that go together');
  const groupOf = k => g.groups.findIndex(gr => gr.nodes.some(n => n.key === k));
  check('a project and its notes are one group', groupOf('p:pjC') === groupOf('n:n1') && groupOf('n:n1') === groupOf('n:n2'));
  check('separate things are separate groups (Arabic, the walk notes, coffee)', new Set([groupOf('p:pjC'), groupOf('p:pjA'), groupOf('n:n5')]).size === 3);
  check('largest group first', g.groups.every((gr, i) => i === 0 || g.groups[i - 1].nodes.length >= gr.nodes.length));
  check('a lone project is drawn on its own, with room for its name', (() => { const gr = g.groups[groupOf('p:pjA')]; return gr.nodes.length === 2 || (gr.nodes.length === 1 && gr.w >= 100); })());
  check('every node sits inside its group\'s space', g.groups.every(gr => gr.nodes.every(n => n.x >= 0 && n.y >= 0 && n.x <= gr.w && n.y <= gr.h)));
  const dist = (gr, a, b) => { const p = gr.nodes.find(n => n.key === a), q = gr.nodes.find(n => n.key === b); return Math.hypot(p.x - q.x, p.y - q.y); };
  const cg = g.groups[groupOf('p:pjC')];
  check('linked things sit near each other, and no two dots sit on top of each other',
    dist(cg, 'p:pjC', 'n:n1') < 140 && g.groups.every(gr => gr.nodes.every((a, i) => gr.nodes.every((b, j) => i >= j || Math.hypot(a.x - b.x, a.y - b.y) > 20))));

  console.log('\n[3] The same drawing every time');
  const g2 = K.knowledgeGraph(world());
  check('worked out again from the same notes: exactly the same drawing', eq(g.groups, g2.groups) && eq(g.edges, g2.edges));
  const shuffled = world(); shuffled.notes.items.reverse(); shuffled.projects.items.reverse();
  const g3 = K.knowledgeGraph(shuffled);
  const shape = gg => gg.groups.map(gr => gr.nodes.map(n => `${n.key}@${Math.round(n.x)},${Math.round(n.y)}`).sort().join(' ')).sort();
  check('the same drawing whatever order the notes and projects are saved in', eq(shape(g), shape(g3)), [shape(g), shape(g3)]);
  check('worked out once per saved state (asked again, the same answer)', K.knowledgeGraph(d) === g);

  console.log('\n[4] Fitting into a width');
  const wide = K.packGraph(g, 900), narrow = K.packGraph(g, 330);
  check('every node is placed, at any width', wide.nodes.length === keys(g).length && narrow.nodes.length === keys(g).length);
  check('nothing runs off the side, even on a phone', [[wide, 900], [narrow, 330]].every(([p, w]) => p.nodes.every(n => n.gx >= 0 && n.gx <= w)));
  check('a narrow screen stacks the groups (taller), a wide one sets them side by side', narrow.height > wide.height, [wide.height, narrow.height]);

  console.log('\n[5] Many notes');
  const big = world();
  for (let i = 0; i < 400; i++) big.notes.items.push(N('b' + i, `Coffee note ${i}: roasters, beans and offices ${i % 7 ? 'kilo' : 'grinder'} ${'topic' + (i % 20)}`, i % 3 ? {} : { projectId: 'pjC' }));
  const t0 = Date.now(), gb = K.knowledgeGraph(big), ms = Date.now() - t0;
  const drawnNotes = gb.groups.flatMap(gr => gr.nodes).filter(n => n.kind === 'note').length;
  check(`at most ${K.GRAPH.maxNotes} notes are drawn; the rest are counted`, drawnNotes <= K.GRAPH.maxNotes && gb.left > 0 && drawnNotes + gb.left + gb.loose === big.notes.items.filter(n => n.text.trim()).length, [drawnNotes, gb.left, gb.loose]);
  check(`quick enough: ${ms} ms for 409 notes (under 3 s)`, ms < 3000, ms);

  console.log('\n[6] Nothing to draw');
  const empty = K.freshState();
  const ge = K.knowledgeGraph(empty);
  check('no notes or projects: no groups, nothing counted', ge.groups.length === 0 && ge.loose === 0 && ge.left === 0);

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary();
  console.log(`\n${s.pass} passed, ${s.fail} failed`);
  process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
