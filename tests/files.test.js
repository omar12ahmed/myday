// Files, the server side (specs/files.md): the files Edge Function's real rules (supabase/functions/files/handler.ts and
// the shared supabase/functions/_shared/files/rules.ts) with an in-memory store, a fake link signer and a JWT-shaped
// test sign-in, so no R2 and no Supabase is used; and the app's MD5 (app/src/sync/files.ts) against Node's. Made-up
// accounts and files only.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const MB = 1024 * 1024;

(async () => {
  const H = await import(pathToFileURL(path.join(ROOT, 'supabase/functions/files/handler.ts')).href);
  const RULES = await import(pathToFileURL(path.join(ROOT, 'supabase/functions/_shared/files/rules.ts')).href);
  const A = 'aaaaaaaa-1111-4222-8333-aaaaaaaaaaaa', B = 'bbbbbbbb-2222-4333-9444-bbbbbbbbbbbb';
  const TOKENS = { 'h.tok-a.s': A, 'h.tok-b.s': B, 'h.tok-odd.s': 'not a user id' };
  const MD5 = 'AAAAAAAAAAAAAAAAAAAAAA==', F1 = 'flabcdef01', F2 = 'flabcdef02', F3 = 'flabcdef03';
  const PDF = Buffer.from('%PDF-1.4\nmade-up pdf body'), PNG = Buffer.concat([Buffer.from([0x89]), Buffer.from('PNG\r\n\x1a\n'), Buffer.alloc(20)]);
  let store, logs, signed, origins;
  const memory = () => {
    const objects = new Map();   // key -> { bytes, size, type }
    return {
      objects,
      put(key, bytes, type = 'application/octet-stream', size = bytes.length, modified = '2026-10-20T10:00:00.000Z') { objects.set(key, { bytes: Buffer.from(bytes), size, type, modified }); },
      async head(key) { const o = objects.get(key); return o ? { size: o.size, type: o.type } : null; },
      async firstBytes(key, n) { const o = objects.get(key); return new Uint8Array(o ? o.bytes.subarray(0, n) : []); },
      async list(prefix) { return [...objects].filter(([k]) => k.startsWith(prefix)).map(([key, o]) => ({ key, size: o.size, modified: o.modified })); },
      async remove(key) { objects.delete(key); },
      async sign(method, key, headers, seconds, query = {}) { signed.push({ method, key, headers, seconds, query }); return `https://r2.example/${method}/${signed.length}`; },
      // R2's multipart uploads (as tests/supabase-standin.js's): upload id -> { key, headers, parts: Map(n -> { etag, size, bytes }) }. A test fills
      // the parts in (sizes can be large without holding the bytes); completing checks every part named is there with its ETag, in order,
      // then stores the object (its size the parts' total, its first bytes those of part 1), or throws as R2 would.
      uploads: new Map(), completed: 0,
      async mpCreate(key, headers) { const id = 'up' + (this.uploads.size + 1) + 'abcdefgh'; this.uploads.set(id, { key, headers, parts: new Map() }); return id; },
      async mpParts(key, uploadId) { const u = this.uploads.get(uploadId); if (!u || u.key !== key) return null; return [...u.parts].sort((a, b) => a[0] - b[0]).map(([n, x]) => ({ n, etag: x.etag, size: x.size })); },
      async mpComplete(key, uploadId, parts) {
        this.completed++;
        const u = this.uploads.get(uploadId);
        if (!u || u.key !== key) throw new Error('NoSuchUpload');
        const got = parts.map(p => { const x = u.parts.get(p.n); if (!x || x.etag.replace(/"/g, '') !== p.etag.replace(/"/g, '')) throw new Error('InvalidPart'); return x; });
        this.put(key, got[0].bytes ?? Buffer.alloc(0), u.headers['Content-Type'], got.reduce((n, x) => n + x.size, 0));
        this.uploads.delete(uploadId);
      },
      async mpAbort(key, uploadId) { const u = this.uploads.get(uploadId); if (u && u.key === key) this.uploads.delete(uploadId); },
    };
  };
  const reset = () => { store = memory(); logs = []; signed = []; origins = undefined; };
  const deps = (over = {}) => ({ env: n => (n === 'FILES_ALLOWED_ORIGINS' ? origins : undefined), verifyUser: async t => { if (t === 'h.tok-throws.s') throw new Error('auth down'); return TOKENS[t] ?? null; }, store, log: l => logs.push(l), ...over });
  const post = (body, { token = 'h.tok-a.s', method = 'POST', headers = {}, over, raw } = {}) =>
    H.handle(new Request('http://standin/functions/v1/files', { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined }), deps(over));
  const json = r => r.json();
  const up = (x, o) => post({ action: 'upload', fileId: F1, area: 'project', name: 'quote.pdf', size: 1000, md5: MD5, ...x }, o);
  reset();

  console.log('\n[1] Who may call, CORS, methods and bodies');
  let r = await post(null, { method: 'OPTIONS', headers: { Origin: 'https://omar12ahmed.github.io' }, token: null });
  check('OPTIONS answers 204 for the site origin, with POST allowed and the needed headers', r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === 'https://omar12ahmed.github.io' && /POST/.test(r.headers.get('Access-Control-Allow-Methods')) && /authorization/.test(r.headers.get('Access-Control-Allow-Headers')));
  r = await post(null, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' }, token: null });
  check('another origin gets no Allow-Origin header', r.status === 204 && !r.headers.has('Access-Control-Allow-Origin') && r.headers.get('Vary') === 'Origin');
  origins = 'https://a.example';
  check('FILES_ALLOWED_ORIGINS replaces the default list', (await post(null, { method: 'OPTIONS', headers: { Origin: 'https://a.example' }, token: null })).headers.get('Access-Control-Allow-Origin') === 'https://a.example' && !(await post(null, { method: 'OPTIONS', headers: { Origin: 'https://omar12ahmed.github.io' }, token: null })).headers.has('Access-Control-Allow-Origin'));
  origins = undefined;
  check('GET, PUT, DELETE and PATCH all answer 405', (await Promise.all(['GET', 'PUT', 'DELETE', 'PATCH'].map(m => post(null, { method: m })))).every(x => x.status === 405));
  check('a missing token, an unknown one, a throwing sign-in check, a non-JWT, the public "sb_" key and a non-uuid user all answer 401', (await Promise.all([post({ action: 'usage' }, { token: null }), post({ action: 'usage' }, { token: 'h.unknown.s' }), post({ action: 'usage' }, { token: 'h.tok-throws.s' }), post({ action: 'usage' }, { token: 'tok-a' }), post({ action: 'usage' }, { token: 'sb_pub.lic.key' }), post({ action: 'usage' }, { token: 'h.tok-odd.s' })])).every(x => x.status === 401));
  check('sign-in comes first: with no store a signed-out caller still gets 401, a signed-in one 503 "not-configured"', (await post({ action: 'usage' }, { token: null, over: { store: null } })).status === 401 && (await post({ action: 'usage' }, { over: { store: null } })).status === 503 && (await json(await post({ action: 'usage' }, { over: { store: null } }))).error === 'not-configured');
  check('a body that is not JSON, not an object, or an unknown action answers 400', (await post(null, { raw: 'nope' })).status === 400 && (await post(null, { raw: '[1,2]' })).status === 400 && (await post(null, { raw: 'null' })).status === 400 && (await post({ action: 'explode' })).status === 400 && (await post({})).status === 400);
  r = await post(null, { raw: JSON.stringify({ action: 'delete', pad: 'x'.repeat(70 * 1024) }) });
  check('a body over 64 KB answers 413', r.status === 413 && (await json(r)).error === 'too-large');
  r = await H.handle({ method: 'POST', url: 'http://standin/functions/v1/files', headers: new Headers({ Authorization: 'Bearer h.tok-a.s', 'Content-Length': String(70 * 1024) }), text: async () => { throw new Error('should not read the body'); } }, deps());
  check('a Content-Length header over 64 KB answers 413 before the body is read', r.status === 413 && (await json(r)).error === 'too-large');
  check('nothing was stored or signed for any of that', store.objects.size === 0 && signed.length === 0);

  console.log('\n[2] Upload: what may be kept, and the link');
  r = await up(); let j = await json(r);
  check('a PDF in a project gets a link valid 300 seconds', r.status === 200 && j.ok && j.seconds === 300 && /^https:\/\/r2\.example\/PUT\//.test(j.url), j);
  const s0 = signed[0];
  check('the link is for exactly <user>/<area>/<fileId>, PUT', s0.method === 'PUT' && s0.key === `${A}/project/${F1}` && s0.seconds === 300, s0);
  check('the signed headers are Content-Length, Content-MD5, the type fixed by the name, and Content-Disposition (inline for a PDF)', eq(Object.keys(s0.headers).sort(), ['Content-Disposition', 'Content-Length', 'Content-MD5', 'Content-Type']) && s0.headers['Content-Length'] === '1000' && s0.headers['Content-MD5'] === MD5 && s0.headers['Content-Type'] === 'application/pdf' && s0.headers['Content-Disposition'] === 'inline; filename="quote.pdf"; filename*=UTF-8\'\'quote.pdf', s0.headers);
  check('…and the answer repeats the headers the app must send (not the length, which the browser sets)', eq(j.headers, { 'Content-MD5': MD5, 'Content-Type': 'application/pdf', 'Content-Disposition': s0.headers['Content-Disposition'] }), j.headers);
  const dispo = async name => { signed.length = 0; await up({ name }); return signed[0].headers['Content-Disposition']; };
  check('photos and PDFs are served inline; Word, Excel, PowerPoint, text, CSV and HEIC as attachments under their name', (await Promise.all(['a.jpg', 'a.JPEG', 'a.png', 'a.webp', 'a.pdf'].map(dispo))).every(x => x.startsWith('inline; ')) && (await Promise.all(['a.docx', 'a.xlsx', 'a.pptx', 'a.txt', 'a.csv', 'a.heic'].map(dispo))).every(x => x.startsWith('attachment; ')));
  check('quotes in a name are replaced in filename="…" and percent-encoded in filename*', await dispo('my "best".docx') === 'attachment; filename="my _best_.docx"; filename*=UTF-8\'\'my%20%22best%22.docx', await dispo('my "best".docx'));
  check('a backslash is a folder separator, so only the file name after it is kept', await dispo('my "best" \\doc.docx') === 'attachment; filename="doc.docx"; filename*=UTF-8\'\'doc.docx', await dispo('my "best" \\doc.docx'));
  check('a name with accents or emoji is plain ASCII in filename="…" and percent-encoded in filename*', /^attachment; filename="[\x20-\x7e]+"; filename\*=UTF-8''r%C3%A9sum%C3%A9%20%F0%9F%98%80\.docx$/.test(await dispo('résumé 😀.docx')), await dispo('résumé 😀.docx'));
  check('a folder path in the name is cut to the file name', await dispo('C:\\Users\\me\\Quote.docx') === 'attachment; filename="Quote.docx"; filename*=UTF-8\'\'Quote.docx');
  const refused = [['an SVG', 'logo.svg'], ['a web page', 'page.html'], ['a program', 'setup.exe'], ['no extension', 'README'], ['a double extension that ends in a program', 'photo.png.exe'], ['a script', 'run.js'], ['an archive', 'all.zip'], ['a name that is only an extension', '.pdf.']];
  for (const [why, name] of refused) { signed.length = 0; const x = await up({ name }); check(`refused (422 "not-allowed", with the rule in words): ${why}`, x.status === 422 && (await json(x)).error === 'not-allowed' && /photos, PDFs and documents/.test((await json(await up({ name }))).message) && signed.length === 0, x.status); }
  for (const [why, x] of [['size 0', { size: 0 }], ['over 25 MB', { size: 25 * MB + 1 }], ['a size that is not a whole number', { size: 1.5 }], ['a size that is text', { size: '1000' }], ['a negative size', { size: -5 }]]) check(`refused (422): ${why}`, (await up(x)).status === 422);
  check('exactly 25 MB is accepted in a project and in a note', (await up({ size: 25 * MB })).status === 200 && (await up({ area: 'note', fileId: F2, size: 25 * MB })).status === 200);
  check('a bad file id, a bad MD5, an unknown area and no area all answer 400', (await Promise.all([up({ fileId: 'nope' }), up({ fileId: '../x' }), up({ fileId: 'FLABCDEF01' }), up({ fileId: 'fl' + 'a'.repeat(41) }), up({ md5: 'short' }), up({ md5: 'AAAAAAAAAAAAAAAAAAAAAA' }), up({ md5: 5 }), up({ area: 'elsewhere' }), up({ area: undefined }), up({ area: '__proto__' })])).every(x => x.status === 400));
  check('a file id of 8 to 42 characters after "fl" is fine', (await up({ fileId: 'fl' + 'a1'.repeat(3) })).status === 200 && (await up({ fileId: 'fl' + 'a'.repeat(40) })).status === 200);
  store.put(`${A}/project/${F3}`, PDF, 'application/pdf');
  r = await up({ fileId: F3 });
  check('a file id that already has an object answers 409 "exists"', r.status === 409 && (await json(r)).error === 'exists');
  check('…but the same id for another area, or in another account, is a different key', (await up({ fileId: F3, area: 'note' })).status === 200 && (await up({ fileId: F3 }, { token: 'h.tok-b.s' })).status === 200);

  console.log('\n[3] Upload: the portfolio\'s stricter rules, and the limits on the account');
  reset();
  const pf = (x, o) => up({ area: 'portfolio', name: 'shot.png', size: 1000, ...x }, o);
  check('the portfolio accepts PNG, JPEG, WebP and PDF up to 2 MB', (await Promise.all([['a.png', 'fl00000001'], ['a.jpg', 'fl00000002'], ['a.webp', 'fl00000003'], ['a.pdf', 'fl00000004']].map(([name, fileId]) => pf({ name, fileId, size: 2 * MB })))).every(x => x.status === 200));
  check('…but not Word, text, HEIC or CSV, and not more than 2 MB', (await Promise.all([pf({ name: 'a.docx' }), pf({ name: 'a.txt' }), pf({ name: 'a.heic' }), pf({ name: 'a.csv' }), pf({ size: 2 * MB + 1 })])).every(x => x.status === 422));
  check('the same Word file is fine in a project and a note', (await up({ name: 'a.docx', fileId: 'fl00000009' })).status === 200 && (await up({ area: 'note', name: 'a.docx', fileId: 'fl00000010' })).status === 200);
  reset();
  store.put(`${A}/portfolio/flfull00001`, Buffer.alloc(1), 'image/png', 200 * MB - 100);
  r = await pf({ size: 1000, fileId: 'fl00000011' });
  check('the portfolio\'s 200 MB total is enforced: 422 "full", saying it\'s about the portfolio\'s 200 MB', r.status === 422 && (await json(r)).error === 'full' && / left of 200 MB, and this file is /.test((await json(await pf({ size: 1000, fileId: 'fl00000011' }))).message));
  check('…a file that fits in the 100 bytes left is accepted, and a project file is not held back by the portfolio\'s total', (await pf({ size: 100, fileId: 'fl00000012' })).status === 200 && (await up({ fileId: 'fl00000013', size: 5 * MB })).status === 200);
  reset();
  const LEFT = Math.round(24.6 * MB);
  store.put(`${A}/project/flbig0000001`, Buffer.alloc(1), 'application/pdf', 150 * 1024 * MB - LEFT);
  store.put(`${A}/project/flbig0000001.thumb`, Buffer.alloc(1), 'image/webp', 50 * MB);
  r = await up({ fileId: 'fl00000014', size: Math.round(24.8 * MB) });
  j = await json(r);
  check('the account\'s 150 GB total is enforced across areas: 422 "full", saying what\'s left (rounded down) and the file\'s size', r.status === 422 && j.error === 'full' && j.message === 'There’s 24.6 MB left of 150 GB, and this file is 24.8 MB. To make room, remove files you don’t need, then use Delete now in Recently deleted.', j);
  check('…a file that fits is accepted, and previews do not count towards the total', (await up({ fileId: 'fl00000015', size: 400 })).status === 200 && (await json(await post({ action: 'usage' }))).bytes === 150 * 1024 * MB - LEFT);
  store.put(`${A}/project/flbig0000002`, Buffer.alloc(1), 'application/pdf', LEFT);
  j = await json(await up({ fileId: 'fl00000017', size: 1000 }));
  check('…and with nothing left: "Your 150 GB is full, and this file is 1 KB. …"', j.message === 'Your 150 GB is full, and this file is 1 KB. To make room, remove files you don’t need, then use Delete now in Recently deleted.', j);
  check('another account has its own 150 GB', (await up({ fileId: 'fl00000016', size: 1000 }, { token: 'h.tok-b.s' })).status === 200);

  console.log('\n[4] Confirm: what was stored is checked');
  reset();
  const confirm = (x, o) => post({ action: 'confirm', fileId: F1, area: 'project', name: 'quote.pdf', ...x }, o);
  store.put(`${A}/project/${F1}`, PDF, 'application/pdf');
  r = await confirm();
  check('a PDF that is a PDF (type and first bytes) is kept: 200 with its stored size', r.status === 200 && (await json(r)).size === PDF.length && store.objects.has(`${A}/project/${F1}`));
  const kinds = [['a.png', 'image/png', PNG], ['a.jpg', 'image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])], ['a.webp', 'image/webp', Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')])],
    ['a.heic', 'image/heic', Buffer.concat([Buffer.alloc(4), Buffer.from('ftypheic'), Buffer.alloc(8)])], ['a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', Buffer.from([0x50, 0x4b, 3, 4, 0, 0])], ['a.txt', 'text/plain', Buffer.from('just words')], ['a.csv', 'text/csv', Buffer.from('a,b\n1,2')]];
  kinds.forEach(([, type, bytes], i) => store.put(`${A}/project/flkind0000${i}`, bytes, type));
  const kinds2 = await Promise.all(kinds.map(([name], i) => confirm({ fileId: 'flkind0000' + i, name })));
  check('each kind is kept when its type and first bytes match: PNG, JPEG, WebP, HEIC, DOCX, text and CSV (200)', kinds2.every(x => x.status === 200), kinds2.map(x => x.status));
  store.put(`${A}/project/${F2}`, Buffer.from('this is plain text, not a PDF at all'), 'application/pdf');
  r = await confirm({ fileId: F2 });
  check('a ".pdf" whose first bytes are text is deleted: 422 "not-allowed" and the object is gone', r.status === 422 && (await json(r)).error === 'not-allowed' && !store.objects.has(`${A}/project/${F2}`));
  store.put(`${A}/project/${F3}`, PDF, 'text/html');
  r = await confirm({ fileId: F3 });
  check('an object stored with a different type than the name says is deleted: 422', r.status === 422 && !store.objects.has(`${A}/project/${F3}`));
  store.put(`${A}/project/flbig0000002`, PDF, 'application/pdf', 25 * MB + 1);
  check('an object over the area\'s limit is deleted: 422', (await confirm({ fileId: 'flbig0000002' })).status === 422 && !store.objects.has(`${A}/project/flbig0000002`));
  store.put(`${A}/project/flzero000001`, Buffer.alloc(0), 'application/pdf', 0);
  check('an empty object is deleted: 422', (await confirm({ fileId: 'flzero000001' })).status === 422 && !store.objects.has(`${A}/project/flzero000001`));
  store.put(`${A}/project/fltext000001`, Buffer.from('has a \u0000 NUL byte'), 'text/plain');
  check('a ".txt" with a NUL byte (a binary file) is deleted: 422', (await confirm({ fileId: 'fltext000001', name: 'a.txt' })).status === 422 && !store.objects.has(`${A}/project/fltext000001`));
  store.put(`${A}/project/flname000001`, PDF, 'application/pdf');
  check('a name whose type is not allowed (".exe", or none) deletes the object: 422', (await confirm({ fileId: 'flname000001', name: 'x.exe' })).status === 422 && !store.objects.has(`${A}/project/flname000001`));
  store.put(`${A}/portfolio/flport000001`, PNG, 'image/png', 3 * MB);
  check('a portfolio file over 2 MB is deleted, and a PDF-typed name is not allowed for a project\'s Word file', (await confirm({ fileId: 'flport000001', area: 'portfolio', name: 'a.png' })).status === 422 && !store.objects.has(`${A}/portfolio/flport000001`));
  r = await confirm({ fileId: 'flnothing001' });
  check('nothing stored answers 404 "not-found"', r.status === 404 && (await json(r)).error === 'not-found');
  check('a bad id or area answers 400', (await confirm({ fileId: 'bad' })).status === 400 && (await confirm({ area: 'x' })).status === 400);
  store.put(`${B}/project/${F1}`, PDF, 'application/pdf');
  check('the confirm is for the caller\'s own key: A confirming B\'s file id finds only A\'s (404 when A has none)', (await confirm({ fileId: F1 }, { token: 'h.tok-b.s' })).status === 200 && (await confirm({ fileId: 'flbonly00001' })).status === 404);

  console.log('\n[5] Previews, opening, deleting and usage');
  reset();
  store.put(`${A}/project/${F1}`, PNG, 'image/png');
  const thumb = (x, o) => post({ action: 'thumb', fileId: F1, area: 'project', size: 5000, md5: MD5, ...x }, o);
  r = await thumb();
  check('a preview link is for <key>.thumb with a WebP type, inline, and the length and MD5 signed', r.status === 200 && signed[0].key === `${A}/project/${F1}.thumb` && eq(signed[0].headers, { 'Content-Length': '5000', 'Content-MD5': MD5, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline' }), signed[0]);
  store.put(`${A}/project/flpdfthumb01`, PDF, 'application/pdf');
  r = await thumb({ fileId: 'flpdfthumb01' });
  check('only photos get previews: a preview for a stored PDF answers 422 "not-allowed", with nothing signed', r.status === 422 && (await json(r)).error === 'not-allowed' && !signed.some(x => x.key.includes('flpdfthumb01')));
  store.objects.delete(`${A}/project/flpdfthumb01`);
  check('JPEG, PNG and WebP are the previewable types', eq(RULES.PREVIEWABLE, ['image/jpeg', 'image/png', 'image/webp']));
  check('a preview of exactly 200 KB is allowed; over, empty, fractional or a bad MD5 is refused (400)', (await thumb({ size: 200 * 1024 })).status === 200 && (await Promise.all([thumb({ size: 200 * 1024 + 1 }), thumb({ size: 0 }), thumb({ size: 1.5 }), thumb({ md5: 'x' })])).every(x => x.status === 400));
  check('a preview for a file that is not stored answers 404', (await thumb({ fileId: 'flnofile0001' })).status === 404);
  signed.length = 0;
  r = await post({ action: 'open', fileId: F1, area: 'project' });
  check('open gives a GET link for the file, valid 300 seconds', r.status === 200 && signed[0].method === 'GET' && signed[0].key === `${A}/project/${F1}` && (await json(r)).seconds === 300);
  store.put(`${A}/project/${F1}.thumb`, Buffer.from('webp'), 'image/webp');
  signed.length = 0; await post({ action: 'open', fileId: F1, area: 'project', thumb: true });
  check('…or for its preview with thumb: true', signed[0].key === `${A}/project/${F1}.thumb`);
  check('open answers 404 for a file or a preview that is not there, and 400 for a bad id', (await post({ action: 'open', fileId: 'flmissing001', area: 'project' })).status === 404 && (await post({ action: 'open', fileId: 'flmissing001', area: 'project', thumb: true })).status === 404 && (await post({ action: 'open', fileId: 'x', area: 'project' })).status === 400);
  store.put(`${A}/note/${F2}`, PDF, 'application/pdf'); store.put(`${A}/note/${F2}.thumb`, PDF, 'image/webp'); store.put(`${B}/project/${F1}`, PDF, 'application/pdf');
  r = await post({ action: 'delete', files: [{ fileId: F1, area: 'project' }, { fileId: F2, area: 'note' }] });
  check('delete removes the files and their previews, and counts the files', r.status === 200 && (await json(r)).deleted === 2 && ![...store.objects.keys()].some(k => k.startsWith(A + '/')) && store.objects.has(`${B}/project/${F1}`));
  store.put(`${A}/project/fl${'a'.repeat(8)}`, PDF, 'application/pdf');
  r = await post({ action: 'delete', files: Array.from({ length: 101 }, (_, i) => ({ fileId: 'flmany' + String(i).padStart(6, '0'), area: 'project' })) });
  check('delete with more than 100 files answers 400 and removes nothing (it does not quietly cut the list)', r.status === 400 && store.objects.has(`${A}/project/fl${'a'.repeat(8)}`) && (await post({ action: 'delete', files: Array.from({ length: 100 }, (_, i) => ({ fileId: 'flmany' + String(i).padStart(6, '0'), area: 'project' })) })).status === 200);
  check('delete with no list, a bad entry, or a path-like id answers 400, and removes nothing', (await post({ action: 'delete', files: [] })).status === 400 && (await post({ action: 'delete', files: [{ fileId: '../' + B, area: 'project' }] })).status === 400 && (await post({ action: 'delete', files: [{ fileId: F1, area: 'project' }, null] })).status === 400 && (await post({ action: 'delete' })).status === 400 && store.objects.has(`${B}/project/${F1}`));
  check('deleting a file that is not there is fine (it counts as done)', (await post({ action: 'delete', files: [{ fileId: 'flnotthere01', area: 'note' }] })).status === 200);
  store.put(`${A}/portfolio/flport000001`, PDF, 'application/pdf', 1000);
  check('an older MyDay (no "knows") can\'t delete a portfolio file: 409 unknown-area, nothing removed', (await post({ action: 'delete', files: [{ fileId: 'flport000001', area: 'portfolio' }] })).status === 409 && store.objects.has(`${A}/portfolio/flport000001`));
  check('…nor one that says it knows only project and note, even mixed with a project file', (await post({ action: 'delete', knows: ['project', 'note'], files: [{ fileId: 'flnotthere01', area: 'project' }, { fileId: 'flport000001', area: 'portfolio' }] })).status === 409 && store.objects.has(`${A}/portfolio/flport000001`));
  check('…while a MyDay that knows the portfolio can', (await post({ action: 'delete', knows: ['project', 'note', 'portfolio'], files: [{ fileId: 'flport000001', area: 'portfolio' }] })).status === 200 && !store.objects.has(`${A}/portfolio/flport000001`));
  reset();
  store.put(`${A}/project/${F1}`, PDF, 'application/pdf', 1000); store.put(`${A}/project/${F1}.thumb`, PDF, 'image/webp', 300); store.put(`${A}/note/${F2}`, PDF, 'application/pdf', 2000); store.put(`${B}/project/${F1}`, PDF, 'application/pdf', 9999);
  j = await json(await post({ action: 'usage' }));
  check('usage is the sum of the account\'s files (not previews, not another account\'s), against the 150 GB limit', j.ok && j.bytes === 3000 && j.limit === 150 * 1024 * MB, j);
  r = await post({ action: 'delete-all' });
  check('delete-all removes this account\'s objects, previews too, and counts the files only', r.status === 200 && (await json(r)).deleted === 2 && ![...store.objects.keys()].some(k => k.startsWith(A + '/')) && store.objects.size === 1 && store.objects.has(`${B}/project/${F1}`));
  check('…and deleting all again deletes 0, and a signed-out caller deletes nothing', (await json(await post({ action: 'delete-all' }))).deleted === 0 && (await post({ action: 'delete-all' }, { token: null })).status === 401 && store.objects.size === 1);

  console.log('\n[6] One account can never reach another\'s files');
  reset();
  store.put(`${A}/project/${F1}`, PDF, 'application/pdf'); store.put(`${B}/project/${F2}`, PDF, 'application/pdf');
  signed.length = 0;
  const attempts = [
    await post({ action: 'open', fileId: F2, area: 'project' }), await post({ action: 'open', fileId: `${B}/project/${F2}`, area: 'project' }), await post({ action: 'open', fileId: F2, area: `../${B}/project` }),
    await post({ action: 'confirm', fileId: F2, area: 'project', name: 'a.pdf' }), await post({ action: 'thumb', fileId: F2, area: 'project', size: 100, md5: MD5 }),
  ];
  check('A cannot open, confirm or preview B\'s file by its id, a path, or an area with "../" (404 or 400, never a link)', attempts.every(x => x.status === 404 || x.status === 400) && signed.length === 0 && store.objects.has(`${B}/project/${F2}`), attempts.map(x => x.status));
  await post({ action: 'delete', files: [{ fileId: F2, area: 'project' }] });
  check('A deleting B\'s file id only ever targets A\'s own key: B\'s object is still there', store.objects.has(`${B}/project/${F2}`));
  signed.length = 0; await up({ fileId: F2 });
  check('a link A asks for is always under A\'s own id, whatever id is sent', signed.every(s => s.key.startsWith(`${A}/`)));
  check('the user id in the body or the headers is never trusted', (await post({ action: 'usage', user: B, userId: B }, { headers: { 'x-user-id': B } }).then(json)).bytes === PDF.length);

  console.log('\n[7] When the store fails, and what the logs hold');
  const boom = { async head() { throw new Error('r2 down https://secret.example'); }, async firstBytes() { throw new Error('x'); }, async list() { throw new Error('x'); }, async remove() { throw new Error('x'); }, async sign() { throw new Error('x'); } };
  const failed = await Promise.all([up({}, { over: { store: boom } }), post({ action: 'confirm', fileId: F1, area: 'project', name: 'a.pdf' }, { over: { store: boom } }), post({ action: 'delete-all' }, { over: { store: boom } }), post({ action: 'usage' }, { over: { store: boom } }), post({ action: 'open', fileId: F1, area: 'project' }, { over: { store: boom } })]);
  const bodies = await Promise.all(failed.map(x => x.text()));
  check('a store that throws answers 502 "storage" for upload, confirm, delete-all, usage and open, without its message', failed.every(x => x.status === 502) && bodies.every(t => JSON.parse(t).error === 'storage' && !/r2 down|secret\.example/.test(t)), bodies);
  reset();
  const secretName = 'Secret-Quote-Name.pdf';
  await up({ name: secretName, fileId: 'flsecretid01' }); await post({ action: 'open', fileId: 'flsecretid01', area: 'project' }); await post({ action: 'confirm', fileId: 'flsecretid01', area: 'project', name: secretName });
  await post({ action: 'usage' }); await post({ action: 'delete', files: [{ fileId: 'flsecretid01', area: 'project' }] }); await post({ action: 'delete-all' }); await post({ action: 'explode' }); await post(null, { method: 'GET' }); await post({ action: 'usage' }, { token: null }); await post({ action: 'usage' }, { over: { store: null } }); await post(null, { raw: 'nope' });
  check('every log line is "files <action> <status> <n>ms"', logs.length >= 10 && logs.every(l => /^files [a-z-]+ \d{3} \d+ms$/.test(l)), logs.filter(l => !/^files [a-z-]+ \d{3} \d+ms$/.test(l)));
  check('…and holds no user id, file id, file name or link', logs.every(l => !l.includes(A) && !l.includes('flsecretid01') && !/Secret|quote|r2\.example/i.test(l)));
  check('the actions logged include upload, confirm, open, usage, delete, delete-all and an unknown one, with their outcomes (an action name it does not know is logged as itself or as "unknown")', ['files upload 200', 'files confirm 404', 'files open 404', 'files usage 200', 'files delete 200', 'files delete-all 200', 'files explode 400', 'files unknown 405', 'files unknown 401', 'files unknown 503'].every(p => logs.some(l => l.startsWith(p))), logs);

  console.log('\n[8] The shared rules (supabase/functions/_shared/files/rules.ts)');
  const T = RULES.typeOfName;
  check('typeOfName reads the extension, in any case, after trimming', T('Quote.PDF') === 'application/pdf' && T('a.JPEG') === 'image/jpeg' && T('a.jpg') === 'image/jpeg' && T('photo.WebP') === 'image/webp' && T('  spaced.png  ') === 'image/png' && T('x.heif') === 'image/heic' && T('x.csv') === 'text/csv' && T('a.docx').includes('wordprocessingml') && T('a.xlsx').includes('spreadsheetml') && T('a.pptx').includes('presentationml'));
  check('…and gives null for anything MyDay does not keep: svg, html, exe, no extension, a double extension ending in a program, a very long extension', [T('a.svg'), T('a.html'), T('a.exe'), T('README'), T('a.pdf.exe'), T('a.tar.gz'), T('a.verylongext'), T('.pdf.'), T('')].every(x => x === null) && T('a.exe.pdf') === 'application/pdf');
  const L = RULES.looksLike, ascii = s => Buffer.from(s, 'latin1');
  check('looksLike: each type is told by its first bytes', L('image/png', PNG) && L('image/jpeg', Buffer.from([0xff, 0xd8, 0xff])) && L('image/webp', Buffer.concat([ascii('RIFF'), Buffer.alloc(4), ascii('WEBP')])) && L('application/pdf', ascii('%PDF-1.7')) && L('application/vnd.openxmlformats-officedocument.wordprocessingml.document', Buffer.from([0x50, 0x4b, 3, 4])));
  check('…and refuses the wrong bytes: a PDF that is text, a PNG that is a JPEG, a zip with the wrong signature, RIFF that is not WebP', !L('application/pdf', ascii('hello world')) && !L('image/png', Buffer.from([0xff, 0xd8, 0xff])) && !L('application/vnd.openxmlformats-officedocument.wordprocessingml.document', Buffer.from([0x50, 0x4b, 5, 6])) && !L('image/webp', Buffer.concat([ascii('RIFF'), Buffer.alloc(4), ascii('WAVE')])) && !L('image/png', Buffer.alloc(0)));
  const heic = brand => Buffer.concat([Buffer.alloc(4), ascii('ftyp'), ascii(brand), Buffer.alloc(8)]);
  check('HEIC is told by the "ftyp" brand: heic, heix, hevc, hevx, mif1, msf1, heim and heis are fine; mp42 or avif are not', ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis'].every(b => L('image/heic', heic(b))) && !L('image/heic', heic('mp42')) && !L('image/heic', heic('avif')) && !L('image/heic', ascii('ftypheic')));
  check('plain text and CSV: any bytes without a NUL; empty or with a NUL byte is refused', L('text/plain', ascii('hello')) && L('text/csv', Buffer.from('a,b\n"é",2')) && !L('text/plain', Buffer.alloc(0)) && !L('text/plain', Buffer.from('ab\u0000cd')) && !L('text/csv', Buffer.from([0x50, 0x4b, 0, 4])));
  check('an unknown type never looks like anything', !L('application/x-msdownload', ascii('MZ')) && !L('', ascii('x')));
  const C = RULES.cleanName;
  check('cleanName cuts folders (either slash), removes control characters and trims', C('C:\\Users\\me\\Quote.pdf') === 'Quote.pdf' && C('/etc/passwd') === 'passwd' && C('a/b/c.txt') === 'c.txt' && C(' \u0007na\u0000me\u007f.txt\n') === 'name.txt');
  check('…keeps at most 200 characters (whole ones, never half an emoji), and a blank name becomes "file"', C('a'.repeat(300)).length === 200 && Array.from(C('😀'.repeat(300))).length === 200 && C('😀'.repeat(300)).isWellFormed() && C('') === 'file' && C('   ') === 'file' && C('a/') === 'file' && C('\u0001\u0002') === 'file');
  const longName = C('a'.repeat(250) + '.pdf');
  check('a long name keeps its extension when it is cut: 250 letters and ".pdf" become 196 letters and ".pdf" (200 in all)', longName === 'a'.repeat(196) + '.pdf' && longName.length === 200, longName.length);
  check('…a space left at the cut is trimmed before the extension, and a long name with no extension is cut to 200', C('a'.repeat(195) + ' ' + 'b'.repeat(60) + '.pdf') === 'a'.repeat(195) + '.pdf' && C('a'.repeat(300)).length === 200 && C('x'.repeat(260) + '.verylongext').length === 200);
  check('…and the cut name still has a type (the upload is judged by what is kept)', T(longName) === 'application/pdf');
  check('…and normalises to NFC', C('Cafe\u0301.txt') === 'Caf\u00e9.txt');
  check('filename* also percent-encodes the characters that are not safe there: \' ( ) * !', RULES.disposition('it\'s (a) *big*!.docx', T('x.docx')).endsWith("filename*=UTF-8''it%27s%20%28a%29%20%2Abig%2A%21.docx"), RULES.disposition('it\'s (a) *big*!.docx', T('x.docx')));
  check('disposition: inline for photos and PDFs, attachment for the rest, with a plain and an encoded name', RULES.disposition('a.pdf', 'application/pdf') === 'inline; filename="a.pdf"; filename*=UTF-8\'\'a.pdf' && RULES.disposition('x y.docx', T('x.docx')) === 'attachment; filename="x y.docx"; filename*=UTF-8\'\'x%20y.docx' && RULES.disposition('a.heic', 'image/heic').startsWith('attachment') && RULES.disposition('a', 'nothing').startsWith('attachment'));
  const rf = RULES.refusal;
  check('refusal: empty when the file can be kept, else the area\'s words ("Only photos, PDFs and documents … up to 25 MB each.")', rf('project', 'a.pdf', 100) === '' && rf('note', 'a.txt', 25 * MB) === '' && rf('project', 'a.svg', 100) === RULES.AREA_RULES.project.summary && /up to 25 MB each\.$/.test(rf('note', 'a.exe', 1)) && /^Only photos, PDFs and documents/.test(rf('project', 'a.pdf', 0)));
  check('…the portfolio\'s words are stricter ("Only PNG, JPEG, WebP and PDF, up to 2 MB each."), and an unknown area has its own', rf('portfolio', 'a.docx', 100) === 'Only PNG, JPEG, WebP and PDF, up to 2 MB each.' && rf('portfolio', 'a.png', 2 * MB + 1) === 'Only PNG, JPEG, WebP and PDF, up to 2 MB each.' && rf('portfolio', 'a.png', 2 * MB) === '' && rf('elsewhere', 'a.pdf', 1) === 'That kind of file can’t be kept here.');
  check('the limits are what the spec says: 25 MB a file, 2 MB and 200 MB in total for the portfolio, 150 GB an account (it was 10 GB), 200 KB a preview, 30 days', RULES.AREA_RULES.project.maxBytes === 25 * MB && RULES.AREA_RULES.note.maxBytes === 25 * MB && RULES.AREA_RULES.portfolio.maxBytes === 2 * MB && RULES.AREA_RULES.portfolio.totalBytes === 200 * MB && RULES.ACCOUNT_TOTAL_BYTES === 150 * 1024 * MB && RULES.THUMB_MAX_BYTES === 200 * 1024 && RULES.KEEP_DELETED_DAYS === 30 && RULES.isArea('project') && RULES.isArea('note') && RULES.isArea('portfolio') && !RULES.isArea('toString') && !RULES.isArea(5));
  check('amounts in words: 0 MB, 1 KB, 640 KB, 340 MB, 999 MB, 1 GB, 1.2 GB, 8.8 GB, 10 GB', [0, 500, 640 * 1024, 340 * MB, 999 * MB, 1000 * MB, 1.24 * 1024 * MB, 8.76 * 1024 * MB, 10 * 1024 * MB].map(n => RULES.amountLabel(n)).join() === '0 MB,1 KB,640 KB,340 MB,999 MB,1 GB,1.2 GB,8.8 GB,10 GB', [0, 500, 640 * 1024, 340 * MB, 999 * MB, 1000 * MB, 1.24 * 1024 * MB, 8.76 * 1024 * MB, 10 * 1024 * MB].map(n => RULES.amountLabel(n)));
  check('…rounded down when asked (used and left are never overstated), with the unit chosen after rounding', [[24.66 * MB, 'floor', '24.6 MB'], [1.69 * MB, 'floor', '1.6 MB'], [999.6 * MB, 'floor', '999 MB'], [999.6 * MB, 'round', '1 GB'], [1023.6 * 1024, 'floor', '1023 KB'], [1023.6 * 1024, 'round', '1 MB'], [99.96 * MB, 'floor', '99.9 MB'], [99.96 * MB, 'round', '100 MB'], [10 * 1024 * MB - 41 * MB, 'floor', '9.9 GB'], [300, 'floor', '1 KB'], [24.8 * MB, 'ceil', '24.8 MB']].every(([n, f, want]) => RULES.amountLabel(n, Math[f]) === want), [[24.66 * MB, 'floor'], [999.6 * MB, 'floor'], [1023.6 * 1024, 'round'], [10 * 1024 * MB - 41 * MB, 'floor']].map(([n, f]) => RULES.amountLabel(n, Math[f])));
  check('no type that runs in a browser can be kept: no svg, html, javascript, xml or executable among the allowed types', Object.keys(RULES.FILE_TYPES).every(t => !/svg|html|javascript|\/xml|\+xml|x-msdownload|octet/.test(t)) && Object.values(RULES.FILE_TYPES).every(t => !t.ext.some(e => ['svg', 'html', 'htm', 'js', 'exe', 'xml', 'svgz'].includes(e))));

  console.log('\n[9] The app\'s MD5 (app/src/sync/files.ts) against Node\'s');
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = path.join(os.tmpdir(), `myday-files-md5-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'kit.ts'), `export { md5 } from ${JSON.stringify(path.join(ROOT, 'app/src/sync/files'))};`);
  globalThis.__APP_VERSION__ = '0.0.0-test'; globalThis.__APP_COMMIT__ = 'test'; globalThis.__APP_BUILT__ = '2026-10-25';
  let Kit = null;
  try { Kit = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href); } catch (e) { console.log('  (bundle failed: ' + String(e.message).slice(0, 300) + ')'); }
  check('the app\'s file code can be bundled for Node', !!Kit);
  if (Kit) {
    const mine = b => Buffer.from(Kit.md5(new Uint8Array(b))).toString('hex'), node = b => crypto.createHash('md5').update(b).digest('hex');
    const rfc = [['', 'd41d8cd98f00b204e9800998ecf8427e'], ['a', '0cc175b9c0f1b6a831c399e269772661'], ['abc', '900150983cd24fb0d6963f7d28e17f72'], ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
      ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'], ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'd174ab98d277d9f5a5611c2c9f419d9f'],
      ['12345678901234567890123456789012345678901234567890123456789012345678901234567890', '57edf4a22be3c955ac49da2e2107b67a']];
    check('the RFC 1321 test vectors', rfc.every(([text, want]) => mine(Buffer.from(text)) === want), rfc.filter(([t, w]) => mine(Buffer.from(t)) !== w).map(x => x[0]));
    check('lengths around the 64-byte block (0 to 130) all match Node', Array.from({ length: 131 }, (_, i) => i).every(n => mine(Buffer.alloc(n, n)) === node(Buffer.alloc(n, n))));
    const big = crypto.randomBytes(3 * MB + 17);
    check('3 MB of random bytes matches Node', mine(big) === node(big));
    check('a base64 digest has 22 characters and "==" (what the function and R2 expect)', /^[A-Za-z0-9+/]{22}==$/.test(Buffer.from(Kit.md5(new Uint8Array(PDF))).toString('base64')));
    check('the input is not changed', (() => { const b = new Uint8Array([1, 2, 3, 4]); Kit.md5(b); return eq([...b], [1, 2, 3, 4]); })());
  }
  fs.rmSync(dir, { recursive: true, force: true });

  console.log('\n[10] After Delete everything, only a MyDay that knows the wipe may add files (specs/delete-everything.md)');
  reset();
  const wiped = { epochOf: async () => 2 };
  check('the CORS preflight allows the x-myday-epoch header', /x-myday-epoch/.test((await post(null, { method: 'OPTIONS', token: null, headers: { Origin: 'https://omar12ahmed.github.io' } })).headers.get('Access-Control-Allow-Headers') || ''));
  check('an account never wiped (epoch 0): uploads need no header, as for every released MyDay', (await up({ fileId: 'flepoch00001' }, { over: { epochOf: async () => 0 } })).status === 200);
  check('a wiped account: an upload without the header is refused (409 wiped), nothing signed', (await up({ fileId: 'flepoch00002' }, { over: wiped })).status === 409 && (await json(await up({ fileId: 'flepoch00002' }, { over: wiped }))).error === 'wiped');
  check('…and with an old epoch', (await up({ fileId: 'flepoch00003' }, { over: wiped, headers: { 'x-myday-epoch': '1' } })).status === 409);
  check('…while the current epoch is accepted', (await up({ fileId: 'flepoch00004' }, { over: wiped, headers: { 'x-myday-epoch': '2' } })).status === 200);
  store.put(`${A}/project/flepoch00005`, PNG, 'image/png', 100);
  check('a preview of a wiped account\'s photo is refused without the epoch, accepted with it', (await post({ action: 'thumb', fileId: 'flepoch00005', area: 'project', size: 10, md5: MD5 }, { over: wiped })).status === 409
    && (await post({ action: 'thumb', fileId: 'flepoch00005', area: 'project', size: 10, md5: MD5 }, { over: wiped, headers: { 'x-myday-epoch': '2' } })).status === 200);
  check('opening, usage and deleting don\'t need it (Delete everything deletes files itself)', (await post({ action: 'open', fileId: 'flepoch00005', area: 'project' }, { over: wiped })).status === 200
    && (await post({ action: 'usage' }, { over: wiped })).status === 200 && (await post({ action: 'delete-all' }, { over: wiped })).status === 200);
  check('the epoch can\'t be read: 502, nothing signed', (await up({ fileId: 'flepoch00006' }, { over: { epochOf: async () => { throw new Error('db'); } } })).status === 502);

  console.log('\n[11] stored: the account\'s stored files (to find any that nothing in MyDay lists)');
  reset();
  store.put(`${A}/project/flstored0001`, PDF, 'application/pdf', 1234, '2026-10-01T09:00:00.000Z');
  store.put(`${A}/project/flstored0001.thumb`, PDF, 'image/webp', 99);
  store.put(`${A}/note/flstored0002`, PDF, 'text/plain', 55);
  store.put(`${A}/gallery/flstored0003`, PDF, 'image/png', 7);
  store.put(`${A}/project/not-a-file-id`, PDF, 'application/pdf', 8);
  store.put(`${B}/project/flstored0009`, PDF, 'application/pdf', 4321);
  r = await post({ action: 'stored' });
  j = await json(r);
  check('it lists this account\'s files with their area, size and when stored (previews and other accounts\' left out)', r.status === 200 && j.ok
    && eq(j.files.map(f => [f.fileId, f.area, f.size, f.modified]).sort(), [['flstored0001', 'project', 1234, '2026-10-01T09:00:00.000Z'], ['flstored0002', 'note', 55, '2026-10-20T10:00:00.000Z']]), j);
  check('…an area or id this version doesn\'t know is left out, never offered to delete', !j.files.some(f => f.area === 'gallery' || f.fileId === 'not-a-file-id'));
  check('…no names: only ids, areas, sizes and dates', j.files.every(f => eq(Object.keys(f).sort(), ['area', 'fileId', 'modified', 'size'])));
  check('…with the server\'s own time, so a device\'s clock can\'t make a fresh upload look old', typeof j.now === 'string' && !isNaN(Date.parse(j.now)));
  store.put(`${A}/project/flstored0001/extra`, PDF, 'application/pdf', 3);
  check('…a key with more parts than area and id is left out', !(await json(await post({ action: 'stored' }))).files.some(f => f.size === 3));
  j = await json(await post({ action: 'stored' }, { over: { liveFileIds: async () => new Set(['flstored0001']) } }));
  check('…and a file a record in the account still names is never in the list (even if the device hasn\'t pulled it)', !j.files.some(f => f.fileId === 'flstored0001') && j.files.some(f => f.fileId === 'flstored0002'), j.files);
  check('…if the records can\'t be read, nothing is listed (502)', (await post({ action: 'stored' }, { over: { liveFileIds: async () => { throw new Error('db'); } } })).status === 502);
  check('…and signed out: refused first', (await post({ action: 'stored' }, { token: null })).status === 401);
  check('…its log line holds no ids', logs.every(l => /^files [a-z-]+ \d{3} \d+ms$/.test(l)), logs);


  console.log('\n[12] Videos, in parts (specs/projects-content.md): upload, mp-begin, mp-parts, mp-list, mp-done, mp-abort, open and thumb');
  {
    reset();
    const GB = 1024 * MB, PART = 64 * MB;
    const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(16)]), NOTVIDEO = Buffer.from('this is plain text, not a video at all, just words');
    const FV = 'flvideo001', KEY = `${A}/content/${FV}`;
    const vid = (action, x, o) => post({ action, fileId: FV, area: 'content', name: 'Market day.mp4', ...x }, o);
    const begin = (x, o) => vid('mp-begin', { size: 100 * MB, ...x }, o);
    const parts = (x, o) => vid('mp-parts', { size: 150 * MB, ...x }, o);
    const done = (x, o) => vid('mp-done', x, o);
    const E1 = { n: 1, etag: '"etag-one"' }, E2 = { n: 2, etag: '"etag-two"' };
    // A started upload of 100 MB with both its parts sent (the first holds the video's first bytes).
    const started = async (first = MP4, sizes = [PART, 36 * MB]) => { const id = (await json(await begin())).uploadId; store.uploads.get(id).parts.set(1, { etag: 'etag-one', size: sizes[0], bytes: first }); store.uploads.get(id).parts.set(2, { etag: 'etag-two', size: sizes[1] }); return id; };

    console.log('  upload refuses a size over 64 MB');
    const bigUp = (x, o) => vid('upload', { size: 100 * MB, md5: MD5, ...x }, o);
    r = await bigUp({ size: 64 * MB + 1 });
    check('a single upload of 64 MB plus a byte answers 400 (it goes in parts), and nothing is signed', r.status === 400 && (await json(r)).error === 'bad-request' && signed.length === 0);
    r = await bigUp({ size: 64 * MB, fileId: 'flvideo002' }); j = await json(r);
    check('a 64 MB video in the content area is signed for 300 seconds, with its type video/mp4', r.status === 200 && j.seconds === 300 && signed[signed.length - 1].headers['Content-Type'] === 'video/mp4' && signed[signed.length - 1].key === `${A}/content/flvideo002`, j);

    console.log('  mp-begin');
    reset();
    check('a size of 64 MB or less is refused (400): that goes in one upload', (await Promise.all([begin({ size: 64 * MB }), begin({ size: 1000 }), begin({ size: 1 })])).every(x => x.status === 400) && store.uploads.size === 0);
    r = await begin({ area: 'project' }); j = await json(r);
    check('a video in the project area (or a note) is refused: 422 "not-allowed", nothing started', r.status === 422 && j.error === 'not-allowed' && (await begin({ area: 'note' })).status === 422 && store.uploads.size === 0, j);
    check('a size that is not a whole number, text or over 15 GB is refused (422), as is a program', (await Promise.all([begin({ size: 100.5 }), begin({ size: '100000000' }), begin({ size: 15 * GB + 1 }), begin({ name: 'setup.exe' }), begin({ name: 'page.svg' })])).every(x => x.status === 422) && store.uploads.size === 0);
    check('a bad file id, an unknown area and no area answer 400', (await Promise.all([begin({ fileId: 'nope' }), begin({ area: 'elsewhere' }), begin({ area: undefined })])).every(x => x.status === 400));
    r = await begin(); j = await json(r);
    check('a 100 MB video answers its upload id, the part size (64 MB) and the number of parts (2)', r.status === 200 && j.ok && typeof j.uploadId === 'string' && j.uploadId.length >= 8 && j.partBytes === PART && j.parts === 2, j);
    const up0 = store.uploads.get(j.uploadId);
    check('…the upload is started for <user>/content/<fileId> with the type video/mp4 and a Content-Disposition (inline)', up0.key === KEY && up0.headers['Content-Type'] === 'video/mp4' && /^inline; filename="Market day\.mp4"/.test(up0.headers['Content-Disposition']), up0);
    check('the number of parts is the size over 64 MB, rounded up: 64 MB + 1 byte is 2, 128 MB is 2, 128 MB + 1 is 3, 15 GB is 240', (await Promise.all([[64 * MB + 1, 2], [128 * MB, 2], [128 * MB + 1, 3], [15 * GB, 240]].map(async ([size, n], i) => (await json(await begin({ size, fileId: 'flcount0000' + i }))).parts === n))).every(Boolean));
    store.put(`${A}/content/flvideo004`, MP4, 'video/mp4', 100 * MB);
    r = await begin({ fileId: 'flvideo004' });
    check('a file id that already has an object answers 409 "exists" (no upload started)', r.status === 409 && (await json(r)).error === 'exists');
    reset();
    store.put(`${A}/content/flfull00001`, MP4, 'video/mp4', 150 * GB - 10 * MB);
    r = await begin(); j = await json(r);
    check('against the account\'s 150 GB total: 422 "full", saying what\'s left (rounded down) and the video\'s size', r.status === 422 && j.error === 'full' && j.message === 'There’s 10 MB left of 150 GB, and this file is 100 MB. To make room, remove files you don’t need, then use Delete now in Recently deleted.' && store.uploads.size === 0, j);
    check('…a video that fits in what\'s left is accepted, and another account has its own total', (await begin({}, { token: 'h.tok-b.s' })).status === 200);
    store.put(`${A}/content/flfull00002`, MP4, 'video/mp4', 10 * MB);
    j = await json(await begin());
    check('…and with nothing left: "Your 150 GB is full, and this file is 100 MB. …"', j.message === 'Your 150 GB is full, and this file is 100 MB. To make room, remove files you don’t need, then use Delete now in Recently deleted.', j);

    console.log('  mp-parts');
    reset();
    const UP = (await json(await begin({ size: 150 * MB }))).uploadId, MD5B = 'BBBBBBBBBBBBBBBBBBBBBB==';
    signed.length = 0;
    r = await parts({ uploadId: UP, parts: [{ n: 1, md5: MD5 }, { n: 2, md5: MD5B }, { n: 3, md5: MD5 }] }); j = await json(r);
    check('each part gets a link valid 3600 seconds (an hour), in order, with its number, a link and the MD5 to send', r.status === 200 && j.ok && j.seconds === 3600 && eq(j.parts.map(p => p.n), [1, 2, 3]) && j.parts.every(p => /^https:\/\/r2\.example\/PUT\//.test(p.url)) && eq(j.parts[1].headers, { 'Content-MD5': MD5B }), j);
    check('every link is for PUT <user>/content/<fileId>, valid 3600 seconds, with the part number and the upload id in the query', signed.length === 3 && signed.every((s, i) => s.method === 'PUT' && s.key === KEY && s.seconds === 3600 && eq(s.query, { partNumber: String(i + 1), uploadId: UP })), signed);
    check('each link signs the part\'s length and its MD5: 64 MB for each part but the last, which is the remainder (22 MB of 150 MB)', eq(signed.map(s => s.headers['Content-Length']), [String(PART), String(PART), String(22 * MB)]) && eq(signed.map(s => s.headers['Content-MD5']), [MD5, MD5B, MD5]) && signed.every(s => eq(Object.keys(s.headers).sort(), ['Content-Length', 'Content-MD5'])), signed.map(s => s.headers));
    signed.length = 0;
    await parts({ size: 128 * MB, uploadId: UP, parts: [{ n: 2, md5: MD5 }] }); await parts({ size: 128 * MB + 1, uploadId: UP, parts: [{ n: 3, md5: MD5 }] });
    check('…an exact multiple of 64 MB makes its last part a full 64 MB, and one byte over makes a last part of 1 byte', eq(signed.map(s => s.headers['Content-Length']), [String(PART), '1']), signed.map(s => s.headers['Content-Length']));
    signed.length = 0;
    const bad = async (x, why) => { const n = signed.length; const x2 = await parts({ uploadId: UP, ...x }); return x2.status === 400 && signed.length === n; };
    check('part numbers out of range are refused (400) and nothing is signed: 0, past the last part (4 of 3), negative, fractional, text, missing', (await Promise.all([[0], [4], [-1], [1.5], ['1'], [undefined]].map(([n]) => bad({ parts: [{ n, md5: MD5 }] })))).every(Boolean));
    check('a bad MD5 (short, no "==", not text, missing) is refused (400)', (await Promise.all(['short', 'AAAAAAAAAAAAAAAAAAAAAA', 5, undefined].map(md5 => bad({ parts: [{ n: 1, md5 }] })))).every(Boolean));
    check('one bad part among good ones refuses them all (400), and an empty list is refused', (await parts({ uploadId: UP, parts: [{ n: 1, md5: MD5 }, { n: 9, md5: MD5 }] })).status === 400 && await bad({ parts: [] }) && await bad({ parts: undefined }));
    signed.length = 0;
    check('a bad upload id (too short, odd characters, not text, missing) is refused (400)', (await Promise.all(['short', 'bad id with spaces!', 12345678, undefined].map(uploadId => bad({ uploadId, parts: [{ n: 1, md5: MD5 }] })))).every(Boolean));
    check('a size of 64 MB or less, or not a whole number, is refused (400)', (await Promise.all([64 * MB, 1000, 150 * MB + 0.5, '150000000', undefined].map(size => bad({ size, parts: [{ n: 1, md5: MD5 }] })))).every(Boolean));
    check('a size over the area\'s maximum is refused (400): over 15 GB in the content area, and any video-sized one in a project', await bad({ size: 15 * GB + 1, parts: [{ n: 1, md5: MD5 }] }) && await bad({ area: 'project', size: 150 * MB, parts: [{ n: 1, md5: MD5 }] }) && await bad({ area: 'elsewhere', parts: [{ n: 1, md5: MD5 }] }));
    const fifty = Array.from({ length: 50 }, (_, i) => ({ n: i + 1, md5: MD5 })), fiftyOne = Array.from({ length: 51 }, (_, i) => ({ n: i + 1, md5: MD5 }));
    r = await parts({ size: 4 * GB, uploadId: UP, parts: fifty }); j = await json(r);
    check('exactly 50 parts at once are signed, and 51 are refused (400) with nothing signed', r.status === 200 && j.parts.length === 50 && signed.length === 50 && await bad({ size: 4 * GB, parts: fiftyOne }));

    console.log('  mp-list');
    reset();
    const U2 = await started();
    r = await vid('mp-list', { uploadId: U2 }); j = await json(r);
    check('it lists the parts already stored (number, ETag, size), in order, to carry on from', r.status === 200 && j.ok && eq(j.parts, [{ n: 1, etag: 'etag-one', size: PART }, { n: 2, etag: 'etag-two', size: 36 * MB }]), j);
    check('an upload that was never started or is gone answers 404 "not-found"', (await vid('mp-list', { uploadId: 'upnosuchupload' })).status === 404 && (await json(await vid('mp-list', { uploadId: 'upnosuchupload' }))).error === 'not-found');
    check('…and so does a real upload id used with another file id (it belongs to its own file)', (await vid('mp-list', { uploadId: U2, fileId: 'flvideo009' })).status === 404);
    check('…and another account cannot list it', (await vid('mp-list', { uploadId: U2 }, { token: 'h.tok-b.s' })).status === 404);
    check('a bad upload id or file id answers 400', (await vid('mp-list', { uploadId: 'short' })).status === 400 && (await vid('mp-list', { uploadId: U2, fileId: 'nope' })).status === 400);

    console.log('  mp-done');
    reset();
    const U3 = await started();
    const callsBefore = store.completed;
    const refusedDone = await Promise.all([[E2, E1], [E2], [{ n: 1, etag: 'etag-one' }, { n: 3, etag: 'etag-three' }], [{ n: 1 }], [{ n: 1, etag: 'not valid ✓' }], [{ n: 1, etag: 5 }], [{ n: '1', etag: 'a' }], []].map(list => done({ uploadId: U3, parts: list })));
    check('the parts must be 1 to n in order, each with an ETag, or it is refused (400): out of order, not from 1, a gap, no ETag, a bad ETag, a number as the ETag, none', refusedDone.every(x => x.status === 400) && store.completed === callsBefore && store.objects.size === 0, refusedDone.map(x => x.status));
    check('…and so are a bad upload id and a bad file id', (await done({ uploadId: 'short', parts: [E1] })).status === 400 && (await done({ uploadId: U3, fileId: 'nope', parts: [E1] })).status === 400 && store.completed === callsBefore);
    r = await done({ uploadId: U3, parts: [E1, E2] }); j = await json(r);
    check('it completes the upload and answers {ok, size}: the stored video is kept, 100 MB', r.status === 200 && j.ok === true && j.size === 100 * MB && eq(Object.keys(j).sort(), ['ok', 'size']) && store.objects.has(KEY) && store.uploads.size === 0, j);
    reset();
    const U4 = await started(NOTVIDEO);
    r = await done({ uploadId: U4, parts: [E1, E2] }); j = await json(r);
    check('a stored object whose first bytes are not a video is deleted, with 422 "not-allowed"', r.status === 422 && j.error === 'not-allowed' && !store.objects.has(KEY), j);
    reset();
    const U5 = await started(MP4, [4 * MB, 4 * MB]);
    r = await done({ uploadId: U5, parts: [E1, E2] });
    check('…and so is one of 64 MB or less (it should have been a single upload): deleted, 422', r.status === 422 && !store.objects.has(KEY));
    reset();
    const U6 = await started();
    store.put(`${A}/content/flfill00001`, MP4, 'video/mp4', 150 * GB - 50 * MB);
    r = await done({ uploadId: U6, parts: [E1, E2] }); j = await json(r);
    check('if the account is over its 150 GB total once it has completed, it is deleted with 422 "full"', r.status === 422 && j.error === 'full' && typeof j.message === 'string' && /left of 150 GB|is full/.test(j.message) && !store.objects.has(KEY) && store.objects.has(`${A}/content/flfill00001`), j);
    reset();
    const U7 = await started();
    store.put(`${A}/content/flfill00002`, MP4, 'video/mp4', 150 * GB - 100 * MB);
    r = await done({ uploadId: U7, parts: [E1, E2] });
    check('…exactly filling the 150 GB total is allowed (200)', r.status === 200 && store.objects.has(KEY));
    reset();
    const U8 = await started();
    r = await done({ uploadId: U8, parts: [E1, { n: 2, etag: 'etag-wrong' }] });
    check('R2 refusing the parts (a wrong ETag) answers 502 "storage" and keeps no video', r.status === 502 && (await json(r)).error === 'storage' && !store.objects.has(KEY));
    check('a video of another account is not touched', (await done({ uploadId: U8, parts: [E1, E2] }, { token: 'h.tok-b.s' })).status === 502 && !store.objects.has(`${B}/content/${FV}`));

    console.log('  mp-abort');
    reset();
    const U9 = await started();
    r = await vid('mp-abort', { uploadId: U9 });
    check('it drops the upload and what was sent (200 ok), and it can no longer be listed', r.status === 200 && (await json(r)).ok === true && store.uploads.size === 0 && (await vid('mp-list', { uploadId: U9 })).status === 404);
    check('aborting one that is already gone is still fine (200), and a bad upload id answers 400', (await vid('mp-abort', { uploadId: U9 })).status === 200 && (await vid('mp-abort', { uploadId: 'short' })).status === 400);
    const U10 = await started();
    await vid('mp-abort', { uploadId: U10 }, { token: 'h.tok-b.s' }); await vid('mp-abort', { uploadId: U10, fileId: 'flvideo009' });
    check('…and nobody else (another account, another file id) can drop it', store.uploads.has(U10));

    console.log('  open and thumb for a video');
    reset();
    store.put(KEY, MP4, 'video/mp4', 100 * MB);
    store.put(`${A}/content/flpdf000001`, PDF, 'application/pdf');
    store.put(`${KEY}.thumb`, Buffer.from('webp'), 'image/webp');
    signed.length = 0;
    r = await vid('open', {}); j = await json(r);
    check('opening a video gives a link valid 21,600 seconds (6 hours): it streams while you watch', r.status === 200 && j.seconds === 21600 && signed[0].method === 'GET' && signed[0].key === KEY && signed[0].seconds === 21600, j);
    r = await vid('open', { fileId: 'flpdf000001' }); j = await json(r);
    check('opening a PDF gives a link valid 300 seconds', r.status === 200 && j.seconds === 300 && signed[1].seconds === 300, j);
    r = await vid('open', { thumb: true }); j = await json(r);
    check('opening a video\'s preview gives a link valid 300 seconds (not 6 hours), for <key>.thumb', r.status === 200 && j.seconds === 300 && signed[2].key === `${KEY}.thumb` && signed[2].seconds === 300, j);
    check('…and opening a video that isn\'t stored is 404', (await vid('open', { fileId: 'flvideo007' })).status === 404);
    r = await vid('thumb', { size: 5000, md5: MD5 }); j = await json(r);
    check('a preview is allowed for a stored video: a link for <key>.thumb, WebP, 300 seconds, length and MD5 signed', r.status === 200 && j.ok && j.seconds === 300 && signed[3].key === `${KEY}.thumb` && eq(signed[3].headers, { 'Content-Length': '5000', 'Content-MD5': MD5, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline' }), [j, signed[3]]);
    store.put(`${A}/content/flmov000001`, MP4, 'video/quicktime', 90 * MB); store.put(`${A}/content/flwebm00001`, MP4, 'video/webm', 90 * MB);
    check('…for a MOV and a WebM too, and still not for a PDF', (await vid('thumb', { fileId: 'flmov000001', size: 5000, md5: MD5 })).status === 200 && (await vid('thumb', { fileId: 'flwebm00001', size: 5000, md5: MD5 })).status === 200 && (await vid('thumb', { fileId: 'flpdf000001', size: 5000, md5: MD5 })).status === 422);

    console.log('  after Delete everything');
    reset();
    const wipedNow = { epochOf: async () => 2 };
    check('a wiped account: mp-begin and mp-parts without the epoch header answer 409 "wiped", and nothing is started or signed', (await begin({}, { over: wipedNow })).status === 409 && (await json(await begin({}, { over: wipedNow }))).error === 'wiped'
      && (await parts({ uploadId: 'upabcdefgh', parts: [{ n: 1, md5: MD5 }] }, { over: wipedNow })).status === 409 && store.uploads.size === 0 && signed.length === 0);
    check('…with an old epoch too', (await begin({}, { over: wipedNow, headers: { 'x-myday-epoch': '1' } })).status === 409 && (await parts({ uploadId: 'upabcdefgh', parts: [{ n: 1, md5: MD5 }] }, { over: wipedNow, headers: { 'x-myday-epoch': '1' } })).status === 409);
    r = await begin({}, { over: wipedNow, headers: { 'x-myday-epoch': '2' } }); j = await json(r);
    check('…while the current epoch is accepted: mp-begin starts the upload and mp-parts signs its links', r.status === 200 && (await parts({ uploadId: j.uploadId, parts: [{ n: 1, md5: MD5 }] }, { over: wipedNow, headers: { 'x-myday-epoch': '2' } })).status === 200);
    check('mp-done after a wipe is refused too (409), and mp-list and mp-abort need no header', (await done({ uploadId: j.uploadId, parts: [E1] }, { over: wipedNow })).status === 409 && (await vid('mp-list', { uploadId: j.uploadId }, { over: wipedNow })).status === 200 && (await vid('mp-abort', { uploadId: j.uploadId }, { over: wipedNow })).status === 200);
    check('an account never wiped needs no header for the parts either', (await begin({}, { over: { epochOf: async () => 0 } })).status === 200);
    check('the log lines of all this hold no ids, names or links', logs.every(l => /^files [a-z-]+ \d{3} \d+ms$/.test(l)), logs.filter(l => !/^files [a-z-]+ \d{3} \d+ms$/.test(l)));
  }

  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
