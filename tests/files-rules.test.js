// Attached files, the data rules (specs/files.md; app/src/data/files.ts) on the app's own code bundled for Node, with
// made-up files, projects and notes: reading saved records, the file ids on projects and notes, adding, removing to
// Recently deleted and putting back, the 30-day tidy, orphans, deleting a project, and that a note with only files is
// not blank. No browser.
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
  const dir = path.join(os.tmpdir(), `myday-files-rules-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const src = p => JSON.stringify(path.join(ROOT, 'app/src/data', p));
  fs.writeFileSync(path.join(dir, 'kit.ts'), [
    `export * from ${src('files')};`, `export { normalizeProjects, deleteProject } from ${src('projects')};`, `export { normalizeNotes, isBlank } from ${src('notes')};`,
    `export { freshState, normalize } from ${src('normalize')};`, `export { shift } from ${src('dates')};`,
  ].join('\n'));
  const K = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);
  const OLD = '2026-10-01T09:00', SHA = 'c'.repeat(64);
  const project = (id, x = {}) => ({ id, title: 'Garden shed', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: OLD, updatedAt: OLD, ...x });
  const note = (id, x = {}) => ({ id, categoryId: '', title: 'A note', text: 'Some words', pinned: false, createdAt: OLD, updatedAt: OLD, ...x });
  const rec = (id, x = {}) => ({ id, name: 'Quote.pdf', type: 'application/pdf', size: 2048, sha256: SHA, area: 'project', state: 'kept', addedOn: '2026-10-20', ...x });
  const world = () => { const d = K.freshState(); d.projects.items = [project('pjA'), project('pjB')]; d.notes.items = [note('ntA'), note('ntB')]; return d; };
  const PA = { kind: 'project', id: 'pjA' }, PB = { kind: 'project', id: 'pjB' }, NA = { kind: 'note', id: 'ntA' }, NB = { kind: 'note', id: 'ntB' };
  const nf = (id, x = {}) => ({ id, name: 'A.txt', type: 'text/plain', size: 10, sha256: SHA, area: 'project', ...x });

  console.log('\n[1] Reading saved file records');
  const read = raw => { const rep = { dropped: 0 }; return [K.normalizeFiles(raw, rep), rep.dropped]; };
  check('no section, or something that is not an object, reads as no files', eq(read(undefined)[0], { items: [] }) && eq(read('oops')[0], { items: [] }) && eq(read(null)[0], { items: [] }));
  const bad = read({ items: [rec('flgood0001'), { id: 'x', name: 'n', type: 't', size: 1 }, rec('flbadsize01', { size: -5 }), rec('flnoname001', { name: '' }), rec('flfloat0001', { size: 1.5 }), { id: 'flnotype01', name: 'a', size: 1 }, 'text', null]});
  check('a record without a proper id, name, type or whole-number size is counted and left out; the good one stays', bad[1] === 7 && eq(bad[0].items.map(f => f.id), ['flgood0001']), bad);
  const dupes = read({ items: [rec('fldup000001', { name: 'First.pdf' }), rec('fldup000001', { name: 'Second.pdf' })] });
  check('a duplicate id is skipped (the first stays) and counted', dupes[1] === 1 && eq(dupes[0].items.map(f => f.name), ['First.pdf']));
  const odd = read({ future: { a: 1 }, items: [rec('flodd000001', { state: 'archived-in-future', extra: { keep: [1] }, sha256: 'not-a-hash', area: '', addedOn: 'sometime' }), rec('flpart00001', { deletedOn: '2026-10-22', removedFrom: { kind: 'note', id: 'ntA' } }), rec('flbadrf0001', { deletedOn: 'soon', removedFrom: { kind: 'tree', id: 'x' } })] });
  const [o1, o2, o3] = odd[0].items;
  check('fields from a newer MyDay are kept, and so is a state this version does not know', odd[0].future.a === 1 && o1.state === 'archived-in-future' && eq(o1.extra, { keep: [1] }));
  check('a bad hash becomes empty, a blank area becomes "project", a bad day is replaced by a date', o1.sha256 === '' && o1.area === 'project' && /^\d{4}-\d\d-\d\d$/.test(o1.addedOn));
  check('a good deletedOn and removedFrom are kept; a bad day is dropped; a place this version doesn\'t know (a newer MyDay\'s) is kept as it is', o2.deletedOn === '2026-10-22' && eq(o2.removedFrom, { kind: 'note', id: 'ntA' }) && !('deletedOn' in o3) && eq(o3.removedFrom, { kind: 'tree', id: 'x' }));
  check('…but a place without a kind or an id is dropped', (() => { const [a, b] = read({ items: [rec('flbadrf0002', { removedFrom: { kind: '', id: 'x' } }), rec('flbadrf0003', { removedFrom: { kind: 'note' } })] })[0].items; return !('removedFrom' in a) && !('removedFrom' in b); })());
  check('reading again gives the same, and counts nothing (idempotent)', (() => { const again = read(odd[0]); return eq(again[0], odd[0]) && again[1] === 0; })());
  check('freshState and normalize carry a files section; data from before files reads as none', eq(K.freshState().files, { items: [] }) && eq(K.normalize(clone(K.freshState())).files, { items: [] }) && eq(K.normalize((() => { const x = clone(K.freshState()); delete x.files; return x; })()).files, { items: [] }));
  check('a damaged files section (text) is counted, not silently ignored', (() => { const x = clone(K.freshState()); x.files = 'oops'; const rep = { dropped: 0 }; K.normalize(x, rep); return rep.dropped >= 1; })());

  console.log('\n[2] The file ids on a project or a note');
  check('normalizeFileIds keeps only well-formed ids, once each, in order; none reads as null', eq(K.normalizeFileIds(['flaaaaaa01', 'bad', 'flaaaaaa01', 5, 'flbbbbbb02']), ['flaaaaaa01', 'flbbbbbb02']) && K.normalizeFileIds([]) === null && K.normalizeFileIds(['nope']) === null && K.normalizeFileIds('flaaaaaa01') === null && K.normalizeFileIds(undefined) === null);
  const pr = K.normalizeProjects({ items: [project('pjA', { fileIds: ['flaaaaaa01', 'bad'] }), project('pjB', { fileIds: [] }), project('pjC')] }, { dropped: 0 }).items;
  check('a project keeps its file ids (cleaned); one with none has no fileIds key', eq(pr[0].fileIds, ['flaaaaaa01']) && !('fileIds' in pr[1]) && !('fileIds' in pr[2]));
  const nt = K.normalizeNotes({ categories: [], items: [note('ntA', { fileIds: ['flaaaaaa01', 'flaaaaaa01'] }), note('ntB', { fileIds: 'oops' }), note('ntC')] }, { dropped: 0 }).items;
  check('a note keeps its file ids (cleaned); one with none has no fileIds key', eq(nt[0].fileIds, ['flaaaaaa01']) && !('fileIds' in nt[1]) && !('fileIds' in nt[2]));
  check('a note with only files (no title, no words) is not blank; with nothing at all it is', !K.isBlank(note('x', { title: '', text: '', fileIds: ['flaaaaaa01'] })) && K.isBlank(note('x', { title: ' ', text: '  ' })) && !K.isBlank(note('x', { title: '', text: 'words' })));

  console.log('\n[3] Adding a file');
  let d = world();
  check('adding records the file as "uploading" and lists it on the place (project or note)', K.addFileRecord(d, PA, nf('flnew000001'), '2026-10-24') && eq({ ...d.files.items[0], startedAt: undefined }, { ...nf('flnew000001'), state: 'uploading', addedOn: '2026-10-24', startedAt: undefined }) && typeof d.files.items[0].startedAt === 'number' && eq(d.projects.items[0].fileIds, ['flnew000001']) && K.addFileRecord(d, NA, nf('flnew000002', { area: 'note' })) && eq(d.notes.items[0].fileIds, ['flnew000002']), d.files.items);
  check('a place that is not there, or a file id used before, is refused (false)', !K.addFileRecord(d, { kind: 'project', id: 'pjNope' }, nf('flnew000003')) && !K.addFileRecord(d, PB, nf('flnew000001')) && d.files.items.length === 2);
  d = world();
  for (let i = 0; i < 50; i++) K.addFileRecord(d, PA, nf('flcap' + String(i).padStart(6, '0')));
  check('the 50th file in a place is accepted and a 51st is refused (false), leaving nothing half-added', K.fileIdsOf(d, PA).length === 50 && !K.addFileRecord(d, PA, nf('flcapextra01')) && d.files.items.length === 50);
  check('filesOf lists a place\'s files in its order, and leaves out an id whose record is missing', (() => { const e = world(); K.addFileRecord(e, PA, nf('flord0000001')); K.addFileRecord(e, PA, nf('flord0000002')); e.projects.items[0].fileIds.push('flghost00001'); return eq(K.filesOf(e, PA).map(f => f.id), ['flord0000001', 'flord0000002']); })());
  d = world(); K.addFileRecord(d, PA, nf('flst00000001'));
  check('setFileState moves a file to kept (with its stored size) or failed; false when nothing changes or it is not there', K.setFileState(d, 'flst00000001', 'kept', 99) && d.files.items[0].state === 'kept' && d.files.items[0].size === 99 && !K.setFileState(d, 'flst00000001', 'kept', 99) && !K.setFileState(d, 'flst00000001', 'kept') && K.setFileState(d, 'flst00000001', 'failed') && !K.setFileState(d, 'flnope000001', 'kept'));

  console.log('\n[4] Removing, Recently deleted and Put back');
  d = world(); K.addFileRecord(d, PA, nf('flrm00000001', { name: 'Shared.txt' })); K.setFileState(d, 'flrm00000001', 'kept');
  d.notes.items[0].fileIds = ['flrm00000001'];
  check('removing a file that another place also lists only takes this link away ("removed")', K.removeFile(d, 'flrm00000001', PA, '2026-10-24') === 'removed' && !('fileIds' in d.projects.items[0]) && eq(d.notes.items[0].fileIds, ['flrm00000001']) && !('deletedOn' in d.files.items[0]));
  check('removing it from the last place sends it to Recently deleted ("deleted"), with the day and where it was', K.removeFile(d, 'flrm00000001', NA, '2026-10-25') === 'deleted' && d.files.items[0].deletedOn === '2026-10-25' && eq(d.files.items[0].removedFrom, NA) && !('fileIds' in d.notes.items[0]));
  check('removing a file the place does not list returns false', K.removeFile(d, 'flrm00000001', NA) === false && K.removeFile(d, 'flnope000001', PA) === false);
  check('recentlyDeleted lists it for that place only, newest first, and for everywhere without a place', (() => { K.addFileRecord(d, PB, nf('flrm00000002')); K.removeFile(d, 'flrm00000002', PB, '2026-10-27'); K.addFileRecord(d, NA, nf('flrm00000003')); K.removeFile(d, 'flrm00000003', NA, '2026-10-26'); return eq(K.recentlyDeleted(d, NA).map(f => f.id), ['flrm00000003', 'flrm00000001']) && eq(K.recentlyDeleted(d, PB).map(f => f.id), ['flrm00000002']) && eq(K.recentlyDeleted(d).map(f => f.id), ['flrm00000002', 'flrm00000003', 'flrm00000001']) && eq(K.recentlyDeleted(d, NB), []); })());
  check('goneOn is 30 days after it was deleted (and null for a file that is not deleted)', K.goneOn(d.files.items[0]) === K.shift('2026-10-25', 30) && K.goneOn(rec('flnotdel0001')) === null, K.goneOn(d.files.items[0]));
  d = world(); K.addFileRecord(d, NA, nf('flpb00000001')); K.removeFile(d, 'flpb00000001', NA, '2026-10-25');
  check('Put back lists the file on the place it came from, and clears deletedOn and removedFrom', K.putBack(d, 'flpb00000001') && eq(d.notes.items[0].fileIds, ['flpb00000001']) && !('deletedOn' in d.files.items[0]) && !('removedFrom' in d.files.items[0]));
  check('…and a file that is not in Recently deleted cannot be put back (false)', !K.putBack(d, 'flpb00000001') && !K.putBack(d, 'flnope000001'));
  d = world(); K.addFileRecord(d, NA, nf('flpb00000002')); K.removeFile(d, 'flpb00000002', NA, '2026-10-25'); d.notes.items = d.notes.items.filter(n => n.id !== 'ntA');
  check('Put back is false when the place is gone, and the file stays in Recently deleted', !K.putBack(d, 'flpb00000002') && d.files.items[0].deletedOn === '2026-10-25');
  d = world(); for (let i = 0; i < 50; i++) K.addFileRecord(d, PA, nf('flfull' + String(i).padStart(6, '0'))); K.addFileRecord(d, NA, nf('flpb00000003')); K.removeFile(d, 'flpb00000003', NA, '2026-10-25'); d.files.items.find(f => f.id === 'flpb00000003').removedFrom = PA;
  check('Put back is false when the place already has 50 files', !K.putBack(d, 'flpb00000003'));
  check('forgetFiles drops those records (true), and nothing else; false when none was there', (() => { const e = world(); K.addFileRecord(e, PA, nf('flfg00000001')); K.addFileRecord(e, PA, nf('flfg00000002')); return K.forgetFiles(e, ['flfg00000001', 'flnope000001']) && eq(e.files.items.map(f => f.id), ['flfg00000002']) && !K.forgetFiles(e, ['flnope000001']); })());

  console.log('\n[5] The 30-day tidy, and files nothing lists');
  d = world();
  for (const [id, on] of [['flpurge00001', '2026-09-24'], ['flpurge00002', '2026-09-25'], ['flpurge00003', '2026-09-23']]) { K.addFileRecord(d, PA, nf(id)); K.removeFile(d, id, PA, on); }
  K.addFileRecord(d, PA, nf('flkeep000001'));
  check('dueForPurge is the files deleted 30 days ago or more (the day itself counts), not newer ones, not files in use', eq(K.dueForPurge(d, '2026-10-24').map(f => f.id).sort(), ['flpurge00001', 'flpurge00003']) && eq(K.dueForPurge(d, '2026-10-25').map(f => f.id).sort(), ['flpurge00001', 'flpurge00002', 'flpurge00003']) && eq(K.dueForPurge(d, '2026-10-20'), []));
  d = world();
  d.files.items.push(rec('floprhan0001'), rec('floprhan0002', { state: 'failed' }), rec('flupl0000001', { state: 'uploading' }), rec('flinuse00001'), rec('floprhan0003', { deletedOn: '2026-10-20', removedFrom: PA }));
  d.projects.items[0].fileIds = ['flinuse00001'];
  check('orphans are the files nothing lists and that are not in Recently deleted, except those still being added', eq(K.orphans(d).map(f => f.id), ['floprhan0001', 'floprhan0002']));
  check('markOrphans sends them to Recently deleted from today (true), leaves the rest alone, and then finds none (false)', K.markOrphans(d, '2026-10-24') && d.files.items.find(f => f.id === 'floprhan0001').deletedOn === '2026-10-24' && !('deletedOn' in d.files.items.find(f => f.id === 'flupl0000001')) && !('deletedOn' in d.files.items.find(f => f.id === 'flinuse00001')) && d.files.items.find(f => f.id === 'floprhan0003').deletedOn === '2026-10-20' && !K.markOrphans(d, '2026-10-25'));

  console.log('\n[5b] A file a place still lists is never in Recently deleted');
  d = world();
  K.addFileRecord(d, PA, nf('fllisted0001')); K.addFileRecord(d, PA, nf('flgone000001')); K.removeFile(d, 'flgone000001', PA, '2026-09-01');
  d.files.items.find(f => f.id === 'fllisted0001').deletedOn = '2026-09-01'; d.files.items.find(f => f.id === 'fllisted0001').removedFrom = PB;   // two devices' changes crossed
  check('a listed file with a deletedOn is neither in Recently deleted nor due for purge; one nothing lists is both', eq(K.recentlyDeleted(d).map(f => f.id), ['flgone000001']) && eq(K.dueForPurge(d, '2026-10-24').map(f => f.id), ['flgone000001']) && eq(K.recentlyDeleted(d, PB), []));
  check('healFiles clears deletedOn and removedFrom on a listed file (true), leaves the others, and then finds nothing (false)', K.healFiles(d) && !('deletedOn' in d.files.items.find(f => f.id === 'fllisted0001')) && !('removedFrom' in d.files.items.find(f => f.id === 'fllisted0001')) && d.files.items.find(f => f.id === 'flgone000001').deletedOn === '2026-09-01' && !K.healFiles(d));
  check('healFiles on data with nothing wrong changes nothing (false)', !K.healFiles(world()));
  console.log('  A file that was never finished');
  d = world();
  const T0 = Date.parse('2026-10-24T09:00:00Z');
  K.addFileRecord(d, PA, nf('flstart00001'), '2026-10-24', T0);
  const sf = d.files.items[0];
  check('adding sets when it started (the time given, else now)', sf.startedAt === T0 && (() => { const e = world(); const before = Date.now(); K.addFileRecord(e, PA, nf('flstart00002')); return e.files.items[0].startedAt >= before && e.files.items[0].startedAt <= Date.now(); })());
  check('unfinished: an "uploading" file started over an hour ago is unfinished; within the hour it is not', K.unfinished(sf, T0 + 61 * 60 * 1000, '2026-10-24') && !K.unfinished(sf, T0 + 59 * 60 * 1000, '2026-10-24') && !K.unfinished(sf, T0 + 60 * 60 * 1000, '2026-10-24'));
  check('…a file that is kept or failed never is, however old', !K.unfinished({ ...sf, state: 'kept' }, T0 + 1e9) && !K.unfinished({ ...sf, state: 'failed' }, T0 + 1e9));
  check('…and with no start time (from before) it is unfinished only if it was added on an earlier day', K.unfinished({ ...rec('flold0000001', { state: 'uploading', addedOn: '2026-10-23' }) }, Date.now(), '2026-10-24') && !K.unfinished({ ...rec('flold0000002', { state: 'uploading', addedOn: '2026-10-24' }) }, Date.now(), '2026-10-24'));
  check('a start time is kept through reading (a number) and does not make a file look unfinished by itself', K.normalizeFiles({ items: [{ ...rec('flkeep000009', { state: 'uploading' }), startedAt: T0 }] }, { dropped: 0 }).items[0].startedAt === T0);

  console.log('\n[6] Deleting a project');
  d = world();
  K.addFileRecord(d, PA, nf('flproj000001')); K.addFileRecord(d, PA, nf('flproj000002')); K.addFileRecord(d, PA, nf('flproj000003'));
  d.notes.items[0].fileIds = ['flproj000002'];
  K.addFileRecord(d, PB, nf('flother00001'));
  check('deleting a project sends its own files to Recently deleted, from that project', K.deleteProject(d, 'pjA') && ['flproj000001', 'flproj000003'].every(id => { const f = d.files.items.find(x => x.id === id); return f.deletedOn && eq(f.removedFrom, PA); }), d.files.items.map(f => [f.id, f.deletedOn]));
  check('…a file a note also lists stays where it is (not deleted), and another project\'s files are untouched', !d.files.items.find(f => f.id === 'flproj000002').deletedOn && !d.files.items.find(f => f.id === 'flother00001').deletedOn && eq(d.notes.items[0].fileIds, ['flproj000002']));
  check('…and nothing is lost: all four records are still there', d.files.items.length === 4);
  check('those files cannot be put back while the project is gone', !K.putBack(d, 'flproj000001') && eq(K.recentlyDeleted(d).map(f => f.id).sort(), ['flproj000001', 'flproj000003']));
  check('deleting a project that is not there changes nothing (false)', !K.deleteProject(d, 'pjNope'));
  check('usedBy lists every project and note that lists a file', (() => { const e = world(); K.addFileRecord(e, PA, nf('flused000001')); e.projects.items[1].fileIds = ['flused000001']; e.notes.items[1].fileIds = ['flused000001']; return eq(K.usedBy(e, 'flused000001'), [PA, PB, NB]); })());
  check('sizeLabel reads KB and MB', K.sizeLabel(10) === '1 KB' && K.sizeLabel(2048) === '2 KB' && K.sizeLabel(1.5 * 1024 * 1024) === '1.5 MB');

  console.log('\n[7] Files of an area this version can\'t list (a newer MyDay\'s portfolio) are left exactly as they are');
  {
    const d = world();
    d.files.items = [
      rec('flport000001', { area: 'portfolio' }),                                                    // listed by a portfolio entry this version doesn't know
      rec('flport000002', { area: 'portfolio', deletedOn: '2026-08-01', removedFrom: { kind: 'portfolio', id: 'pe1', extra: 1 } }), // in the newer MyDay's Recently deleted, long ago
      rec('flport000003', { area: 'portfolio', state: 'uploading', startedAt: 1 }),                   // still being added there
      rec('flport000004', { area: 'portfolio', state: 'failed' }),
      rec('flproj000009'),                                                                            // an ordinary orphan, for comparison
    ];
    const before = clone(d.files.items.slice(0, 4));
    check('LISTED_AREAS is project and note', eq(K.LISTED_AREAS, ['project', 'note']));
    check('none of them is an orphan (only the project file is)', eq(K.orphans(d).map(f => f.id), ['flproj000009']));
    K.markOrphans(d, '2026-10-24'); K.healFiles(d);
    check('markOrphans and healFiles leave them exactly as they were', eq(d.files.items.slice(0, 4), before), d.files.items.slice(0, 4));
    check('none is in Recently deleted here, or due to go for good, even 30+ days on', !K.recentlyDeleted(d).some(f => f.area === 'portfolio') && !K.dueForPurge(d, '2026-12-31').some(f => f.area === 'portfolio'));
    check('an upload of theirs is never "unfinished" here (the tidy doesn\'t settle it)', !K.unfinished(d.files.items[2], Date.now(), '2026-12-31'));
    check('Put back can\'t put one back (its place is unknown here) and changes nothing', !K.putBack(d, 'flport000002') && eq(d.files.items[1], before[1]));
    const read = K.normalizeFiles({ items: clone(before) }, { dropped: 0 });
    check('reading them keeps the unknown place they were removed from, with its other fields', eq(read.items[1].removedFrom, { kind: 'portfolio', id: 'pe1', extra: 1 }) && eq(read.items, before), read.items[1]);
    check('placeExists says no for an unknown kind of place', !K.placeExists(d, { kind: 'portfolio', id: 'pe1' }) && K.placeExists(d, PA));
  }

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
