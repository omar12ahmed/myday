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
    `export * as FR from ${JSON.stringify(path.join(ROOT, 'supabase/functions/_shared/files/rules'))};`,
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

  console.log('\n[7] Files of an area this version can\'t list (a newer MyDay\'s, say a gallery) are left exactly as they are');
  {
    const d = world();
    d.files.items = [
      rec('flport000001', { area: 'gallery' }),                                                    // listed by a place this version doesn't know
      rec('flport000002', { area: 'gallery', deletedOn: '2026-08-01', removedFrom: { kind: 'gallery', id: 'pe1', extra: 1 } }), // in the newer MyDay's Recently deleted, long ago
      rec('flport000003', { area: 'gallery', state: 'uploading', startedAt: 1 }),                   // still being added there
      rec('flport000004', { area: 'gallery', state: 'failed' }),
      rec('flproj000009'),                                                                            // an ordinary orphan, for comparison
    ];
    const before = clone(d.files.items.slice(0, 4));
    check('LISTED_AREAS is project, note, portfolio and content (a Content project\'s videos)', eq(K.LISTED_AREAS, ['project', 'note', 'portfolio', 'content']));
    check('none of them is an orphan (only the project file is)', eq(K.orphans(d).map(f => f.id), ['flproj000009']));
    K.markOrphans(d, '2026-10-24'); K.healFiles(d);
    check('markOrphans and healFiles leave them exactly as they were', eq(d.files.items.slice(0, 4), before), d.files.items.slice(0, 4));
    check('none is in Recently deleted here, or due to go for good, even 30+ days on', !K.recentlyDeleted(d).some(f => f.area === 'gallery') && !K.dueForPurge(d, '2026-12-31').some(f => f.area === 'gallery'));
    check('an upload of theirs is never "unfinished" here (the tidy doesn\'t settle it)', !K.unfinished(d.files.items[2], Date.now(), '2026-12-31'));
    check('Put back can\'t put one back (its place is unknown here) and changes nothing', !K.putBack(d, 'flport000002') && eq(d.files.items[1], before[1]));
    const read = K.normalizeFiles({ items: clone(before) }, { dropped: 0 });
    check('reading them keeps the unknown place they were removed from, with its other fields', eq(read.items[1].removedFrom, { kind: 'gallery', id: 'pe1', extra: 1 }) && eq(read.items, before), read.items[1]);
    check('placeExists says no for an unknown kind of place', !K.placeExists(d, { kind: 'gallery', id: 'pe1' }) && K.placeExists(d, PA));
  }
  {
    // A project's file that a newer MyDay also lets a task list (listedIn: ['task']): only this version's links are its
    // business; it's never sent to Recently deleted or deleted for good here.
    const d = world();
    K.addFileRecord(d, PA, nf('fltask000001')); K.setFileState(d, 'fltask000001', 'kept');
    d.files.items[0].listedIn = ['task'];
    check('a file a newer MyDay\'s task also lists: removing it from its project here only takes that link out ("removed")', K.removeFile(d, 'fltask000001', PA, '2026-10-24') === 'removed' && !d.files.items[0].deletedOn && !('fileIds' in d.projects.items[0]));
    check('…it\'s no orphan, never in Recently deleted, never due to go', !K.orphans(d).length && !K.markOrphans(d) && !K.recentlyDeleted(d).length && !K.dueForPurge(d, '2026-12-31').length);
    const e = world();
    K.addFileRecord(e, PA, nf('fltask000002')); K.setFileState(e, 'fltask000002', 'kept'); e.files.items[0].listedIn = ['task'];
    check('…and deleting its project leaves it alone too', K.deleteProject(e, 'pjA') && !e.files.items[0].deletedOn);
    const f = world();
    K.addFileRecord(f, PA, nf('fltask000003')); f.files.items[0].listedIn = ['project', 'note'];
    check('…while listedIn naming only kinds this version knows changes nothing', K.removeFile(f, 'fltask000003', PA, '2026-10-24') === 'deleted' && f.files.items[0].deletedOn === '2026-10-24');
    check('reading keeps listedIn as it is', eq(K.normalizeFiles({ items: [rec('fltask000004', { listedIn: ['task', 'portfolio'] })] }, { dropped: 0 }).items[0].listedIn, ['task', 'portfolio']));
  }

  console.log('\n[7b] A Cybersecurity portfolio entry lists its files (at most 5), like a project or a note');
  {
    const entry = id => ({ id, attemptId: 'caPf', activityId: 'exercise.learning-evidence', title: 'Baseline evidence', evidence: '', note: '', reviewedOn: '2026-10-20' });
    const d = world(); d.cybersecurity.portfolio = [entry('pfentry0001')];
    const PE = { kind: 'portfolio', id: 'pfentry0001' };
    for (let i = 1; i <= 5; i++) { K.addFileRecord(d, PE, nf('flpf0000000' + i, { area: 'portfolio', name: 'shot' + i + '.png', type: 'image/png' })); K.setFileState(d, 'flpf0000000' + i, 'kept'); }
    check('an entry keeps its files in order, and a sixth is refused', eq(d.cybersecurity.portfolio[0].fileIds, ['flpf00000001', 'flpf00000002', 'flpf00000003', 'flpf00000004', 'flpf00000005'])
      && !K.addFileRecord(d, PE, nf('flpf00000006', { area: 'portfolio' })) && K.filesPerPlace(PE) === 5 && K.filesPerPlace(PA) === 50);
    check('its files are used by it, never orphans, never in Recently deleted', eq(K.usedBy(d, 'flpf00000001'), [PE]) && !K.orphans(d).length && !K.markOrphans(d, '2026-10-24') && !K.recentlyDeleted(d).length);
    check('removing one goes to Recently deleted from that entry, and Put back returns it', K.removeFile(d, 'flpf00000005', PE, '2026-10-24') === 'deleted' && eq(d.files.items[4].removedFrom, PE)
      && K.recentlyDeleted(d, PE).length === 1 && K.putBack(d, 'flpf00000005') && eq(d.cybersecurity.portfolio[0].fileIds.length, 5));
    K.filesLeaving(d, PE, '2026-10-25'); d.cybersecurity.portfolio = [];
    check('when the entry goes, its files wait in Recently deleted for 30 days, then are due to go for good', K.recentlyDeleted(d).length === 5 && !K.dueForPurge(d, '2026-11-23').length && K.dueForPurge(d, '2026-11-24').length === 5);
    check('…and can\'t be put back where the entry was (it isn\'t there)', !K.putBack(d, 'flpf00000001') && !K.placeExists(d, PE));
    const o = world(); o.files.items = [rec('flpforph0001', { area: 'portfolio' })];
    check('a portfolio file nothing lists is an orphan here, like any other (this version knows the portfolio)', eq(K.orphans(o).map(f => f.id), ['flpforph0001']));
    const r = world(); r.cybersecurity.portfolio = [entry('pfentry0002')];
    K.addFileRecord(r, { kind: 'portfolio', id: 'pfentry0002' }, nf('flpfdrop0001', { area: 'portfolio' })); K.dropAdded(r, 'flpfdrop0001', { kind: 'portfolio', id: 'pfentry0002' });
    check('a file the server refused while being added comes off its entry, record and all', !r.files.items.length && !('fileIds' in r.cybersecurity.portfolio[0]));
  }

  console.log('\n[8] Videos for a Content project (specs/projects-content.md): types, first bytes, the area, the limits');
  {
    const bytes = (...parts) => { const b = new Uint8Array(16); let at = 0; for (const x of parts) { for (const c of (typeof x === 'string' ? [...x].map(ch => ch.charCodeAt(0)) : x)) b[at++] = c; } return b; };
    const box = (name, brand = '') => bytes([0, 0, 0, 0x18], name, brand);
    const MB = 1024 * 1024, GB = 1024 * MB;
    const mp4 = box('ftyp', 'isom'), heic = box('ftyp', 'heic'), mov = box('ftyp', 'qt  '), oldMov = box('moov'), webm = bytes([0x1a, 0x45, 0xdf, 0xa3]), junk = bytes([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const is = (type, b) => K.FR.looksLike(type, b);
    check('an MP4 is "ftyp" at byte 4 with the brand isom', is('video/mp4', mp4) && K.FR.typeOfName('Market day.mp4') === 'video/mp4' && K.FR.typeOfName('clip.m4v') === 'video/mp4');
    check('a HEIC photo\'s "ftyp heic" is not a video (neither MP4 nor MOV), and is still a photo', !is('video/mp4', heic) && !is('video/quicktime', heic) && is('image/heic', heic));
    check('every other photo brand (heix, mif1…) is not a video either', ['heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis'].every(b => !is('video/mp4', box('ftyp', b)) && !is('video/quicktime', box('ftyp', b))));
    check('a MOV is "ftyp" with the brand "qt  ", or a "moov" box at byte 4 (an older one)', is('video/quicktime', mov) && is('video/quicktime', oldMov) && K.FR.typeOfName('Phone clip.MOV') === 'video/quicktime');
    check('…a "moov" box alone is not an MP4', !is('video/mp4', oldMov));
    check('a WebM is the bytes 1A 45 DF A3', is('video/webm', webm) && K.FR.typeOfName('clip.webm') === 'video/webm' && !is('video/webm', mp4));
    check('bytes that are none of these are not a video, and neither is a PDF or a WebM with a wrong first byte', ['video/mp4', 'video/quicktime', 'video/webm'].every(t => !is(t, junk) && !is(t, bytes('%PDF-1.7'))) && !is('video/webm', bytes([0x1b, 0x45, 0xdf, 0xa3])));
    check('the three video types are VIDEOS, are served inline, and have a preview', eq(K.FR.VIDEOS, ['video/mp4', 'video/quicktime', 'video/webm']) && K.FR.VIDEOS.every(t => K.FR.FILE_TYPES[t].inline && K.FR.HAS_PREVIEW.includes(t)) && !K.FR.PREVIEWABLE.includes('video/mp4'));

    const content = K.FR.AREA_RULES.content;
    check('the content area allows 15 GB at most', content.maxBytes === 15 * GB, content.maxBytes);
    check('its types include the three videos and the documents (photos, PDF, Word, Excel, PowerPoint, text, CSV)', K.FR.VIDEOS.every(t => content.types.includes(t)) && ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].every(t => content.types.includes(t)), content.types);
    check('a project or a note still refuses a video (and any file over 25 MB)', ['project', 'note'].every(a => K.FR.VIDEOS.every(t => !K.FR.AREA_RULES[a].types.includes(t)) && K.FR.refusal(a, 'Clip.mp4', 1000) !== '' && K.FR.refusal(a, 'Clip.mov', 1000) !== '' && K.FR.refusal(a, 'Clip.webm', 1000) !== '' && K.FR.AREA_RULES[a].maxBytes === 25 * MB));
    check('a Content video of 15 GB is kept, and one byte more is refused', K.FR.refusal('content', 'Market day.mp4', 15 * GB) === '' && K.FR.refusal('content', 'Market day.mp4', 15 * GB + 1) === content.summary && K.FR.refusal('content', 'Market day.mp4', 15 * GB + 1) !== '');
    check('…a document is kept there too, a program is not, and an empty file is not', K.FR.refusal('content', 'Script.pdf', 5000) === '' && K.FR.refusal('content', 'Thumb.png', 5000) === '' && K.FR.refusal('content', 'run.exe', 5000) !== '' && K.FR.refusal('content', 'page.svg', 5000) !== '' && K.FR.refusal('content', 'Clip.mp4', 0) !== '');

    check('an account holds 150 GB in all', K.FR.ACCOUNT_TOTAL_BYTES === 150 * GB, K.FR.ACCOUNT_TOTAL_BYTES);
    check('one request carries at most 64 MB (SINGLE_PUT_MAX), a part of a bigger file is 64 MB (PART_BYTES), and a file has at most 10,000 parts', K.FR.SINGLE_PUT_MAX === 64 * MB && K.FR.PART_BYTES === 64 * MB && K.FR.MAX_PARTS === 10000, [K.FR.SINGLE_PUT_MAX, K.FR.PART_BYTES, K.FR.MAX_PARTS]);
    check('a 15 GB video is 240 parts, well within the limit', Math.ceil(15 * GB / K.FR.PART_BYTES) === 240 && 240 <= K.FR.MAX_PARTS);

    console.log('  a big upload that was never finished');
    const T1 = Date.parse('2026-10-24T09:00:00Z'), H = 60 * 60 * 1000, DAY = 24 * H;
    const big = { ...rec('flbig0000001', { state: 'uploading', area: 'content', name: 'Market day.mp4', type: 'video/mp4', size: 64 * MB + 1 }), startedAt: T1 };
    const small = { ...rec('flsmall00001', { state: 'uploading', area: 'content', name: 'Thumb.png', type: 'image/png', size: 5000 }), startedAt: T1 };
    check('a file over 64 MB still uploading is unfinished only after 7 days (not after a day, nor at exactly 7 days)', !K.unfinished(big, T1 + 2 * H, '2026-10-24') && !K.unfinished(big, T1 + DAY, '2026-10-24') && !K.unfinished(big, T1 + 6 * DAY, '2026-10-24') && !K.unfinished(big, T1 + 7 * DAY, '2026-10-24') && K.unfinished(big, T1 + 7 * DAY + 1, '2026-10-24'));
    check('a small file in the same place is unfinished after an hour, not before', !K.unfinished(small, T1 + 59 * 60 * 1000, '2026-10-24') && K.unfinished(small, T1 + H + 1, '2026-10-24') && K.unfinished(small, T1 + 2 * H, '2026-10-24'));
    check('a file of exactly 64 MB counts as small (an hour), one byte over as big (7 days)', K.unfinished({ ...big, size: 64 * MB }, T1 + 2 * H, '2026-10-24') && !K.unfinished({ ...big, size: 64 * MB + 1 }, T1 + 2 * H, '2026-10-24'));
    check('a big file that finished or failed is never unfinished, however old', !K.unfinished({ ...big, state: 'kept' }, T1 + 30 * DAY) && !K.unfinished({ ...big, state: 'failed' }, T1 + 30 * DAY));
    const noStart = id => ({ ...rec(id, { state: 'uploading', area: 'content', name: 'Market day.mp4', type: 'video/mp4', size: 64 * MB + 1, addedOn: '2026-10-16' }) });
    check('a big file with no start time is judged by its day: unfinished once added more than 7 days before, not within the week', K.unfinished(noStart('flbig0000002'), T1, '2026-10-24') && !K.unfinished({ ...noStart('flbig0000003'), addedOn: '2026-10-17' }, T1, '2026-10-24') && !K.unfinished({ ...noStart('flbig0000004'), addedOn: '2026-10-23' }, T1, '2026-10-24'));
    check('sizeLabel reads GB: 1.5 GB for a file one and a half gigabytes, and 15.0 GB at the largest', K.sizeLabel(1.5 * GB) === '1.5 GB' && K.sizeLabel(15 * GB) === '15.0 GB' && K.sizeLabel(1023 * MB) === '1023.0 MB', [K.sizeLabel(1.5 * GB), K.sizeLabel(15 * GB), K.sizeLabel(1023 * MB)]);
  }

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
