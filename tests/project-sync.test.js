// Split project sync, on the app's real mapping. Synthetic data only; no account or network.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const clone = x => JSON.parse(JSON.stringify(x));

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-project-records-'));
  const src = p => JSON.stringify(path.join(ROOT, 'app/src', p));
  fs.writeFileSync(path.join(folder, 'kit.ts'), `export * from ${src('sync/records')};\nexport * from ${src('sync/projectParts')};\nexport * as Store from ${src('data/storage')};\nexport { freshState, normalize } from ${src('data/normalize')};`);
  const R = await import(pathToFileURL(await bundle(path.join(folder, 'kit.ts'), path.join(folder, 'out'))).href);
  const raw = R.freshState();
  raw.projects.items = [{ id: 'pjReading', title: 'Reading room', summary: 'A synthetic project', stage: 'decide', status: 'active',
    nextTaskId: null, commitmentIds: [], createdAt: '2026-10-20T10:00', updatedAt: '2026-10-23T10:00', future: { kept: ['yes'] },
    milestones: [{ id: 'msOne', title: 'Find a room', aim: null, reachedOn: null, createdAt: '2026-10-20T10:01', future: { kept: true } }],
    decisions: [{ id: 'dcChair', question: 'Which chair?', options: [{ id: 'opOne', text: 'Wooden chair', pros: ['Light'], cons: [], future: 1 }],
      chosen: 'opOne', why: 'Comfortable', decidedOn: '2026-10-23', createdAt: '2026-10-20T10:02', updatedAt: '2026-10-23T10:00',
      lastChoice: { text: 'Old chair', on: '2026-10-22', future: { kept: true } },
      history: [{ id: 'dhOld', text: 'Old chair', on: '2026-10-22', why: 'A first reason', future: ['kept'] },
        { id: 'dhBlank', text: 'Another chair', on: '2026-10-22', why: '' }, { id: 'dhUnknown', text: 'Early chair', on: '2025-01-02', why: null }] }],
    model: { problem: 'Somewhere to read', who: 'Readers', how: 'A quiet room', assumptions: [], future: { kept: true } },
    case: { future: { kept: ['case'] }, issues: [{ id: 'isOne', title: 'Room access', status: 'considering', notes: '', createdAt: '2026-10-20T10:00' }],
      evidence: [{ id: 'evOne', title: 'A made-up letter', kind: 'document', date: null, where: '', status: 'have', notes: '', issueIds: ['isOne'], createdAt: '2026-10-20T10:00', future: true }],
      timeline: [{ id: 'tlOne', title: 'A meeting', date: '2026-10-21', about: false, details: 'Synthetic details', source: 'mine', evidenceIds: ['evOne'], issueIds: ['isOne'], createdAt: '2026-10-21T10:00' }] } }];
  const data = R.normalize(raw), records = R.localRecords(data);
  const projectRows = [...records].filter(([key]) => R.splitKey(key).kind.startsWith('project'));
  check('each history snapshot has its own sync record', projectRows.filter(([key]) => R.splitKey(key).kind === 'project_choice').length === 3);
  check('the project details record contains no decisions or Case arrays', !JSON.stringify(records.get('project:pjReading')).includes('Which chair?') && !JSON.stringify(records.get('project:pjReading')).includes('A meeting'));
  check('decisions, milestones, Model and Case entries have independent records', ['project_decision', 'project_milestone', 'project_model', 'project_case', 'project_issue', 'project_evidence', 'project_timeline'].every(kind => projectRows.some(([key]) => R.splitKey(key).kind === kind)));
  for (const [key, value] of projectRows) check(`round trip: ${R.splitKey(key).kind}`, R.fingerprint(value) === R.fingerprint(R.cleanRecord(key, clone(value))));
  const decisionKey = projectRows.find(([key])=>key.startsWith('project_decision:'))[0];
  const comparison = R.recordLines(decisionKey, records.get(decisionKey));
  check('decision conflicts expose option points, the selected label, reason and day within the comparison preview', comparison.length<=8 && comparison.some(l=>l.includes('Pros: Light')) && comparison.includes('Chosen: Wooden chair') && comparison.includes('Reason: Comfortable') && comparison.includes('Decided: 2026-10-23'));
  const milestoneKey = projectRows.find(([key])=>key.startsWith('project_milestone:'))[0];
  check('milestone conflicts expose whether the marker was reached', R.recordLines(milestoneKey, records.get(milestoneKey)).includes('Not reached yet'));
  const restored = R.freshState();
  const put = R.putRecords || ((draft, rows) => { for (const [key, value] of rows) R.putRecord(draft, key, value); });
  put(restored, [...projectRows].reverse());
  check('parts assemble in any arrival order, keeping all unknown fields and Case links', R.fingerprint({ items: restored.projects.items }) === R.fingerprint({ items: data.projects.items }));
  check('history keeps blank and unavailable reasons distinct and retains oldest-first order', restored.projects.items[0]?.decisions?.[0]?.history?.map(x => x.why).join('|') === 'A first reason||');

  const edited = clone(data);
  edited.projects.items[0].case.evidence[0].notes = 'A new made-up note';
  const newer = R.localRecords(edited);
  const changed = [...newer].filter(([key, value]) => R.fingerprint(value) !== R.fingerprint(records.get(key))).map(([key]) => R.splitKey(key).kind);
  check('editing one evidence item changes only that evidence record', changed.length === 1 && changed[0] === 'project_evidence', changed);
  const other = clone(data.projects.items[0]); other.id = 'pjSecond';
  const two = clone(data); two.projects.items.push(other);
  check('reused child ids in different projects cannot collide', [...R.localRecords(two).keys()].filter(key => R.splitKey(key).kind === 'project_choice').length === 6);

  const huge = clone(data);
  huge.projects.items[0].decisions[0].history = Array.from({ length: 900 }, (_, i) => ({ id: `dh${i}`, text: 'A former chair', on: '2026-10-22', why: '文'.repeat(600) }));
  const largeRows = [...R.localRecords(huge)].filter(([key]) => R.splitKey(key).kind.startsWith('project'));
  check('a project can exceed 512 KiB in total', Buffer.byteLength(JSON.stringify(huge.projects.items[0])) > 524288);
  check('every record of that large project remains below the individual budget', largeRows.every(([, value]) => Buffer.byteLength(JSON.stringify(value)) < 380000));
  const largeRestored = R.freshState(); put(largeRestored, largeRows.reverse());
  check('all 900 snapshots survive reassembly without pruning', largeRestored.projects.items[0]?.decisions?.[0]?.history?.length === 900);
  check('the complete large project survives the wire unchanged', R.fingerprint({ items: largeRestored.projects.items }) === R.fingerprint({ items: huge.projects.items }));
  const absentCase = clone(data); delete absentCase.projects.items[0].case;
  const evidenceRow = projectRows.find(([key])=>key.startsWith('project_evidence:'));
  R.putRecord(absentCase, evidenceRow[0], evidenceRow[1]);
  check('a late Case child cannot recreate a removed Case parent', !absentCase.projects.items[0].case);
  const absentProject = R.freshState();
  R.putRecord(absentProject, evidenceRow[0], evidenceRow[1]);
  check('a late project child cannot recreate a removed project', absentProject.projects.items.length===0);

  const memory = new Map(); let blockSave = false;
  global.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => { if (blockSave) throw new Error('Synthetic quota failure'); memory.set(key, value); } };
  R.Store.boot();
  check('the checked store accepts a complete project larger than the former whole-project allowance', R.Store.update(d => { d.projects.items = clone(huge.projects.items); }));
  const before = R.Store.getSnapshot().data, savedBefore = memory.get(R.Store.STORAGE_KEY);
  check('a manual change growing one core beyond its allowance is refused atomically', !R.Store.update(d => { d.projects.items[0].unknownPadding = 'x'.repeat(380001); })
    && R.Store.getSnapshot().data === before && memory.get(R.Store.STORAGE_KEY) === savedBefore);
  check('an AI-style batch containing an oversized item saves none of its other changes', !R.Store.update(d => { d.tasks.items.push({ id: 'tkAtomic', title: 'Must not be saved' }); d.projects.items[0].unknownPadding = 'x'.repeat(380001); })
    && !R.Store.getSnapshot().data.tasks.items.some(t => t.id === 'tkAtomic'));
  const tooLarge = clone(before); tooLarge.projects.items[0].unknownPadding = 'x'.repeat(380001);
  check('an oversized import leaves both current data and browser storage intact', !R.Store.replaceAll(tooLarge) && R.Store.getSnapshot().data === before && memory.get(R.Store.STORAGE_KEY) === savedBefore);
  blockSave = true;
  check('a persistence failure leaves in-memory and saved project data intact', !R.Store.update(d => { d.projects.items[0].title = 'Unsaved title'; }) && R.Store.getSnapshot().data === before && memory.get(R.Store.STORAGE_KEY) === savedBefore);
  check('a failed replacement also leaves the existing snapshot intact', !R.Store.replaceAll(data) && R.Store.getSnapshot().data === before);
  blockSave = false;
  check('retrying a previously failed edit saves it', R.Store.update(d => { d.projects.items[0].title = 'Retried title'; }) && JSON.parse(memory.get(R.Store.STORAGE_KEY)).projects.items[0].title === 'Retried title');

  // Both devices have appended at index 3 before hearing about each other. Equal positions use one stable order.
  const ordering = clone(data), d = ordering.projects.items[0].decisions[0];
  d.history.push({ id: 'dhZulu', text: 'Local', on: '2026-10-23', why: '' });
  const local = R.localRecords(ordering);
  const positions = R.projectPositions(local, Object.fromEntries([...local].map(([k,c]) => [k,{index:c.index}])));
  const otherKey = 'project_choice:' + 'pjReading dcChair dhAlpha'.split(' ').map(x => Buffer.from(x).toString('hex')).join('.');
  R.putRecord(ordering, otherKey, { projectId: 'pjReading', decisionId: 'dcChair', index: 3, value: { id: 'dhAlpha', text: 'Remote', on: '2026-10-23', why: '' } });
  positions.set(otherKey, 3); R.orderProjectParts(ordering, positions);
  check('concurrent choices at the same position have a deterministic order without losing either snapshot', ordering.projects.items[0].decisions[0].history.slice(-2).map(h => h.id).join() === 'dhAlpha,dhZulu');
  fs.rmSync(folder, { recursive: true, force: true });
  const result = summary();
  console.log(`\n${result.pass} passed, ${result.fail} failed`);
  process.exitCode = result.fail ? 1 : 0;
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
