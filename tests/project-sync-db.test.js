// Upgrade and split records in the real PostgreSQL migrations, using only disposable local accounts.
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { pathToFileURL } = require('url');
const S = require('./supabase-standin.js');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const MIGRATION = '20261023120000_split_project_sync.sql';
const change = (kind, record_id, base_version, data, deleted = false) => ({ change_id: crypto.randomUUID(), kind, record_id, base_version, data, deleted });
const fails = async fn => { try { await fn(); return ''; } catch (e) { return e.message; } };

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-project-db-'));
  const source = x => JSON.stringify(path.join(ROOT, 'app/src', x));
  fs.writeFileSync(path.join(dir, 'kit.ts'), `export * from ${source('data/projectRecords')};\nexport * from ${source('sync/records')};\nexport * from ${source('sync/projectUpgrade')};\nexport { newLink } from ${source('sync/state')};\nexport { freshState, normalize } from ${source('data/normalize')};`);
  const R = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);
  const db = await S.createDb({ before: MIGRATION });
  const A = await S.addUser(db, 'split-a@example.test', 'synthetic-a'), B = await S.addUser(db, 'split-b@example.test', 'synthetic-b');
  const sql = (query, params = []) => S.owner(db, query, params).then(r => r.rows);
  const push = (who, items, version = 2, account = who) => S.as(db, who, q => q(`select public.sync_push${version === 2 ? '_v2' : ''}($1,$2::jsonb,'test') as r`, [account, JSON.stringify(items)])).then(r => r.rows[0].r);
  const pull = (who, since = 0, max = 500, version = 2, account = who) => S.as(db, who, q => q(`select * from public.sync_pull${version === 2 ? '_v2' : ''}($1,$2,$3)`, [account, since, max])).then(r => r.rows);
  const draft = R.freshState();
  draft.projects.items = [{ id: 'pjArchive', title: 'A synthetic reading room', summary: '', stage: 'decide', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-20T09:00', updatedAt: '2026-10-23T09:00', unknown: { kept: [1, 2] },
    milestones: [{ id: 'ms:ع.1', title: 'A first marker', aim: null, reachedOn: null, createdAt: '2026-10-20T09:00', unknown: true }],
    decisions: [{ id: 'dcOne', question: 'Which room?', options: [{ id: 'opOne', text: 'The small room', pros: [], cons: [] }], chosen: null, why: 'A retained reason', decidedOn: null,
      createdAt: '2026-10-20T09:00', updatedAt: '2026-10-23T09:00', lastChoice: { text: 'The large room', on: '2026-10-22', unknown: 'kept' },
      history: [{ id: 'dhOne', text: 'The large room', on: '2026-10-22', why: null, unknown: { kept: true } }] }],
    model: { problem: 'Quiet space', who: 'Readers', how: 'Use a room', assumptions: [], unknown: true },
    case: { issues: [], evidence: [], timeline: [{ id: 'tlOne', title: 'A made-up meeting', date: '2026-10-22', about: false, details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: '2026-10-22T09:00', unknown: true }], unknown: { kept: true } } }];
  const project = R.normalize(draft).projects.items[0];
  let result = await push(A, [change('project', project.id, 0, project)], 1);
  check('the pre-upgrade database accepts the original nested project', result[0].status === 'applied');
  const oldData = (await sql("select data from public.sync_records where user_id=$1 and kind='project' and id=$2", [A, project.id]))[0].data;
  const oldLink = R.newLink(A, 'split-a@example.test'); delete oldLink.projectProtocol;
  oldLink.base[`project:${project.id}`] = { v: 1, f: R.fingerprint(oldData) };
  const pending = change('project', project.id, 1, { ...project, title: 'An offline title' });
  oldLink.out[`project:${project.id}`] = { id: pending.change_id, base: 1, del: false, content: pending.data, f: R.fingerprint(pending.data), tries: 1 };
  await db.exec(fs.readFileSync(path.join(ROOT, 'supabase/migrations', MIGRATION), 'utf8'));
  const rows = await pull(A), mapped = R.splitProject(project);
  check('SQL migration produces the same identities and payloads as the browser projection', mapped.every(part => {
    const row = rows.find(r => r.kind === part.kind && r.record_id === part.id);
    return row && R.fingerprint(row.data) === R.fingerprint(part.content);
  }) && rows.length === mapped.length);
  check('original content is retained exactly in the recovery table', R.fingerprint((await sql('select data from public.sync_project_legacy where user_id=$1', [A]))[0].data) === R.fingerprint(oldData));
  check('anonymous callers cannot read the recovery table', /permission denied/.test(await fails(() => S.as(db, null, q => q('select * from public.sync_project_legacy')))));
  check('another account sees no original projects', (await S.as(db, B, q => q('select * from public.sync_project_legacy'))).rows.length === 0);
  check('a user cannot write to the recovery table', /permission denied/.test(await fails(() => S.as(db, A, q => q('delete from public.sync_project_legacy')))));
  check('legacy writes require an updated app and change nothing', /Update MyDay/.test(await fails(() => push(A, [change('project', project.id, 1, { ...project, title: 'Stale' })], 1))));
  check('legacy reads also refuse partial project data', /Update MyDay/.test(await fails(() => pull(A, 0, 500, 1))));
  check('v2 still enforces account isolation', /different account/.test(await fails(() => pull(B, 0, 500, 2, A))) && /different account/.test(await fails(() => push(B, [], 2, A))));
  const originals = (await S.as(db, A, q => q('select * from public.sync_project_upgrade_rows($1)', [A]))).rows;
  R.upgradeProjectLink(oldLink, originals);
  check('an existing device gains per-part baselines and resets its pull cursor', oldLink.projectProtocol === 2 && Object.keys(oldLink.base).length === mapped.length && oldLink.cursor === 0);
  check('obsolete whole-project retry payloads are removed after their baseline is established', Object.keys(oldLink.out).length === 0 && oldLink.base[`project:${project.id}`].v === 2);
  const offline = R.normalize({ ...draft, projects: { items: [{ ...project, title: 'An offline title', milestones: [] }] } });
  const offlineRecords = R.localRecords(offline);
  check('offline title edits and milestone deletion remain detectable after upgrade', R.fingerprint(offlineRecords.get(`project:${project.id}`)) !== oldLink.base[`project:${project.id}`].f
    && mapped.some(part => part.kind === 'project_milestone' && !offlineRecords.has(`${part.kind}:${part.id}`) && oldLink.base[`${part.kind}:${part.id}`].f));

  const uncertain = R.newLink(A, 'split-a@example.test'); delete uncertain.projectProtocol;
  uncertain.base[`project:${project.id}`] = { v: 1, f: 'an older different baseline' };
  R.upgradeProjectLink(uncertain, originals);
  check('an unprovable legacy baseline forces version checks for every part', Object.values(uncertain.base).every(b => b.v === 0 && b.f === 'legacy-baseline-unknown'));
  const lostReply = R.newLink(A, 'split-a@example.test'); delete lostReply.projectProtocol;
  lostReply.base[`project:${project.id}`] = { v: 0, f: null };
  lostReply.out[`project:${project.id}`] = { id: crypto.randomUUID(), base: 0, del: false, content: oldData, f: R.fingerprint(oldData), tries: 1 };
  R.upgradeProjectLink(lostReply, originals);
  check('a legacy write whose reply was lost is recognised by its exact archived payload and version', lostReply.base[`project:${project.id}`].v === 2 && !Object.keys(lostReply.out).length);
  const untouched = R.newLink(A, 'split-a@example.test'); delete untouched.projectProtocol;
  R.upgradeProjectLink(untouched, originals);
  check('a device that never knew this project does not invent a local baseline', Object.keys(untouched.base).length === 0 && untouched.projectProtocol === 2);

  const current = async (kind, id) => (await sql('select * from public.sync_records where user_id=$1 and kind=$2 and id=$3', [A, kind, id]))[0];
  const milestone = mapped.find(r => r.kind === 'project_milestone');
  const parentBefore = await current('project', project.id);
  result = await push(A, [change(milestone.kind, milestone.id, 1, { ...milestone.content, value: { ...milestone.content.value, title: 'Changed on a phone' } })]);
  check('one milestone can be edited independently', result[0].status === 'applied' && (await current(milestone.kind, milestone.id)).data.value.title === 'Changed on a phone');
  result = await push(A, [change('project', project.id, parentBefore.version, null, true)]);
  check('a stale project deletion conflicts with a newer child edit', result[0].status === 'conflict' && !result[0].deleted);
  const mismatched = { ...milestone.content, projectId: 'pjOther' };
  result = await push(A, [change(milestone.kind, milestone.id, 2, mismatched)]);
  check('a part cannot name a different project from its identifier', result[0].status === 'rejected');

  const decision = mapped.find(r => r.kind === 'project_decision'), decisionBefore = await current(decision.kind, decision.id);
  const history = Array.from({ length: 350 }, (_, i) => ({ kind: 'project_choice', id: R.projectPartId(project.id, 'dcOne', 'dhMany' + i),
    content: { projectId: project.id, decisionId: 'dcOne', index: i + 1, value: { id: 'dhMany' + i, text: 'A previous room', on: '2026-10-22', why: '文'.repeat(600) } } }));
  for (let i = 0; i < history.length; i += 100) {
    result = await push(A, history.slice(i, i + 100).map(r => change(r.kind, r.id, 0, r.content)));
    if (!result.every(r => r.status === 'applied')) throw new Error('A valid history batch was refused: ' + JSON.stringify(result.filter(r => r.status !== 'applied')));
  }
  const sizes = (await sql("select sum(octet_length(data::text))::int as total,max(octet_length(data::text))::int as largest from public.sync_records where user_id=$1 and not deleted", [A]))[0];
  check('the database stores a project over 512 KiB in total, keeping each individual record bounded', sizes.total > 524288 && sizes.largest < 380000, sizes);
  check('every history snapshot is retained without a count cap', (await sql("select count(*)::int as n from public.sync_records where user_id=$1 and kind='project_choice' and not deleted", [A]))[0].n === 351);
  result = await push(A, [change(decision.kind, decision.id, decisionBefore.version, null, true)]);
  check('a stale decision deletion conflicts with newly retained choices', result[0].status === 'conflict');
  result = await push(A, [change('project_choice', R.projectPartId(project.id, 'dcOne', 'dhTooBig'), 0,
    { projectId: project.id, decisionId: 'dcOne', index: 352, value: { id: 'dhTooBig', text: 'Too large', on: '2026-10-22', why: 'x'.repeat(530000) } }),
    change('task', 'tkStillWorks', 0, { id: 'tkStillWorks', title: 'A valid task' })]);
  check('an oversized part is refused without blocking a valid change in the batch', result[0].status === 'rejected' && result[1].status === 'applied');
  result = await push(A, [change(milestone.kind, milestone.id, 2, { ...milestone.content, index: 9007199254740992 })]);
  check('unsafe array positions are refused by the database as well as the client', result[0].status === 'rejected' && R.cleanRecord(`${milestone.kind}:${milestone.id}`, { ...milestone.content, index: 9007199254740992 }) === null);
  const sampleValues = [{ a: [0, 0, 0, null, '文', '😀', '\n', '\\', '"'], b: { c: 1e30, d: 1e-7, e: -1.234e-20 } }, { empty: {}, array: [], flag: true }];
  check('the client byte calculation matches PostgreSQL jsonb text, including Unicode, spacing and exponents', (await Promise.all(sampleValues.map(async value => {
    const measured = (await sql('select octet_length($1::jsonb::text) as bytes', [JSON.stringify(value)]))[0].bytes;
    return measured === R.recordBytes(value);
  }))).every(Boolean));

  const beforeDelete = await current('project', project.id);
  const deletion = change('project', project.id, beforeDelete.version, null, true);
  result = await push(A, [deletion]);
  check('a confirmed current project deletion succeeds and tombstones all of its parts', result[0].status === 'applied'
    && (await sql("select count(*)::int as n from public.sync_records where user_id=$1 and (kind='project' or kind like 'project_%') and not deleted", [A]))[0].n === 0, result);
  const lastChoice = history[0], deletedChoice = await current(lastChoice.kind, lastChoice.id);
  result = await push(A, [change(lastChoice.kind, lastChoice.id, deletedChoice.version, lastChoice.content)]);
  check('a late child write cannot resurrect a deleted project', result[0].status === 'rejected');
  result = await push(A, [deletion]);
  check('retrying project removal is idempotent', result[0].status === 'applied' && result[0].repeat === true);
  await db.close();

  const broken = await S.createDb({ before: MIGRATION });
  const C = await S.addUser(broken, 'split-broken@example.test', 'synthetic');
  await S.as(broken, C, q => q('select public.sync_push($1,$2::jsonb)', [C, JSON.stringify([change('project', 'pjBroken', 0, { id: 'pjBroken', title: 'Unrecognised data', milestones: { future: true } })])]));
  const conversionError = await fails(() => broken.exec(fs.readFileSync(path.join(ROOT, 'supabase/migrations', MIGRATION), 'utf8')));
  await broken.exec('rollback');
  check('unrecognised source data aborts conversion atomically', /unreadable/.test(conversionError)
    && (await S.owner(broken, "select data->'milestones' as value from public.sync_records where user_id=$1", [C])).rows[0].value.future === true
    && (await S.owner(broken, "select to_regclass('public.sync_project_legacy') as name")).rows[0].name === null);
  await broken.close();
  fs.rmSync(dir, { recursive: true, force: true });
  const outcome = summary(); console.log(`\n${outcome.pass} passed, ${outcome.fail} failed`); process.exitCode = outcome.fail ? 1 : 0;
})().catch(e => { console.error('HARNESS', e.message); process.exit(1); });
