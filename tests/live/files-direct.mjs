// Direct check of the files Edge Function and the real R2 bucket (tests/live/run.py files-direct.mjs): sign-in
// first, the signed links (length, MD5, type, disposition), the bucket's CORS for the site, R2 refusing a wrong body,
// the server's check of what was stored, previews only for photos, isolation (a second disposable account only asks
// for the first's ids), delete's known areas, and usage. Made-up files only; everything is deleted at the end.
// Never prints the accounts' details, tokens or links. Only with the owner's yes.
import { createHash } from 'node:crypto';

const env = process.env, URL_ = (env.SUPABASE_URL || '').replace(/\/+$/, ''), KEY = env.SUPABASE_PUBLISHABLE_KEY || '', SITE = 'https://omar12ahmed.github.io';
if (!process.argv.includes('--live') || !env.MYDAY_LIVE_EMAIL?.endsWith('@example.com') || !env.MYDAY_LIVE_OTHER_EMAIL?.endsWith('@example.com') || !KEY.startsWith('sb_publishable_')) {
  console.log('Refused: run it through tests/live/run.py (two disposable accounts and the publishable key).'); process.exit(2);
}
// Any error is printed without the accounts' details.
process.on('unhandledRejection', e => { let m = String(e?.message || e); for (const v of [env.MYDAY_LIVE_EMAIL, env.MYDAY_LIVE_PASSWORD, env.MYDAY_LIVE_OTHER_EMAIL, env.MYDAY_LIVE_OTHER_PASSWORD]) if (v) m = m.split(v).join('[redacted]'); console.log('HARNESS ' + m); process.exit(1); });
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !extra ? '' : '  — ' + extra}`); };

async function signIn(email, password) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const j = await r.json();
  if (!j.access_token) throw new Error('sign-in failed ' + r.status);
  return j.access_token;
}
async function fn(token, body, extra = {}) {
  const r = await fetch(`${URL_}/functions/v1/files`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Origin: SITE, ...extra }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch { /* not JSON */ }
  return { status: r.status, j, acao: r.headers.get('access-control-allow-origin') };
}
const md5 = b => createHash('md5').update(b).digest('base64');
const id = () => 'flcheck' + Math.random().toString(36).slice(2, 12);
const r2Code = async res => (/<Code>([^<]+)<\/Code>/.exec(await res.text()) || [])[1] || '';

const A = await signIn(env.MYDAY_LIVE_EMAIL, env.MYDAY_LIVE_PASSWORD);
const made = []; // { fileId, area } to delete at the end

// 1. Sign-in first, CORS
check('no token → 401', (await fn('', { action: 'usage' })).status === 401);
check('publishable key as the token → 401', (await fn(KEY, { action: 'usage' })).status === 401);
const u0 = await fn(A, { action: 'usage' });
check('usage on the account → 200, the 10 GB limit', u0.status === 200 && u0.j.limit === 10 * 1024 ** 3, JSON.stringify(u0));
check('the function allows the site as origin', u0.acao === SITE, String(u0.acao));
const evil = await fn(A, { action: 'usage' }, { Origin: 'https://evil.example' });
check('…and not another site', !evil.acao, String(evil.acao));
const before = u0.j.bytes;

// 2. A PDF: upload link, the bucket's preflight for the browser's PUT, the PUT, confirm, open
const pdf = Buffer.from('%PDF-1.4\n% MyDay direct check, made-up file\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n');
const p = { fileId: id(), area: 'project' };
const up = await fn(A, { action: 'upload', ...p, name: 'Made-up quote (check).pdf', size: pdf.length, md5: md5(pdf) });
check('upload → 200 with a link and the signed headers', up.status === 200 && up.j.url && up.j.headers['Content-Type'] === 'application/pdf', JSON.stringify({ s: up.status, e: up.j.error }));
const signed = new URL(up.j.url).searchParams.get('X-Amz-SignedHeaders') || '';
check('the link signs content-disposition, content-length, content-md5, content-type', ['content-disposition', 'content-length', 'content-md5', 'content-type'].every(h => signed.split(';').includes(h)), signed);
check('the link lasts 5 minutes', new URL(up.j.url).searchParams.get('X-Amz-Expires') === '300');
const pre = await fetch(up.j.url, { method: 'OPTIONS', headers: { Origin: SITE, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-disposition,content-md5,content-type' } });
check('R2 preflight for the PUT from the site → allowed', pre.ok && pre.headers.get('access-control-allow-origin') === SITE, `${pre.status} ${pre.headers.get('access-control-allow-origin')}`);
const preEvil = await fetch(up.j.url, { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-disposition,content-md5,content-type' } });
check('…and refused from another site', preEvil.headers.get('access-control-allow-origin') !== 'https://evil.example', `${preEvil.status}`);

// Wrong bodies on the same link, before the right one
const longer = Buffer.concat([pdf, Buffer.from('extra bytes')]);
const wrongLen = await fetch(up.j.url, { method: 'PUT', headers: { ...up.j.headers, Origin: SITE }, body: longer });
const wlCode = await r2Code(wrongLen);
check(`a longer body on the link → refused (R2 said ${wrongLen.status} ${wlCode})`, !wrongLen.ok);
console.log(`      R2 ${wlCode === 'SignatureDoesNotMatch' ? 'DOES' : 'does NOT'} enforce the signed Content-Length (${wlCode})`);
const same = Buffer.from(pdf); same[same.length - 2] = 0x58;
const wrongBytes = await fetch(up.j.url, { method: 'PUT', headers: { ...up.j.headers, Origin: SITE }, body: same });
const wbCode = await r2Code(wrongBytes);
check(`same length, different bytes → refused by the MD5 (${wrongBytes.status} ${wbCode})`, !wrongBytes.ok && /BadDigest|InvalidDigest/.test(wbCode), wbCode);
const wrongType = await fetch(up.j.url, { method: 'PUT', headers: { ...up.j.headers, 'Content-Type': 'text/html', Origin: SITE }, body: pdf });
check(`another Content-Type → refused (${wrongType.status} ${await r2Code(wrongType)})`, !wrongType.ok);
const noneStored = await fn(A, { action: 'confirm', ...p, name: 'Made-up quote (check).pdf' });
check('nothing stored after the refused PUTs (confirm → 404)', noneStored.status === 404, JSON.stringify(noneStored.j));

const put = await fetch(up.j.url, { method: 'PUT', headers: { ...up.j.headers, Origin: SITE }, body: pdf });
check('the right PUT → 200, readable by the site', put.ok && put.headers.get('access-control-allow-origin') === SITE, `${put.status} ${put.headers.get('access-control-allow-origin')}`);
made.push(p);
const conf = await fn(A, { action: 'confirm', ...p, name: 'Made-up quote (check).pdf' });
check('confirm → kept, with its size', conf.status === 200 && conf.j.size === pdf.length, JSON.stringify(conf.j));
const again = await fn(A, { action: 'upload', ...p, name: 'Made-up quote (check).pdf', size: pdf.length, md5: md5(pdf) });
check('upload again for the same id → 409 exists', again.status === 409 && again.j.error === 'exists');
const op = await fn(A, { action: 'open', ...p });
check('open → a GET link', op.status === 200 && op.j.url);
const got = await fetch(op.j.url, { headers: { Origin: SITE } });
const gotBytes = Buffer.from(await got.arrayBuffer());
check('the GET serves the same bytes', got.ok && gotBytes.equals(pdf));
check('…as application/pdf, inline', got.headers.get('content-type') === 'application/pdf' && /^inline/.test(got.headers.get('content-disposition') || ''), `${got.headers.get('content-type')} | ${got.headers.get('content-disposition')}`);
check('…readable by the site (so a document can be fetched and saved)', got.headers.get('access-control-allow-origin') === SITE, String(got.headers.get('access-control-allow-origin')));
const pt = await fn(A, { action: 'thumb', ...p, size: 10, md5: md5(Buffer.alloc(10)) });
check('no preview for a PDF → 422', pt.status === 422);
const tampered = new URL(op.j.url); tampered.searchParams.set('X-Amz-Signature', '0'.repeat(64));
check('a tampered link → refused', !(await fetch(tampered)).ok);

// 3. A text file: downloaded under its name
const txt = Buffer.from('Made-up list for the MyDay direct check.\nNails, screws, larch.\n');
const t = { fileId: id(), area: 'note' };
const tu = await fn(A, { action: 'upload', ...t, name: 'Shed list é.txt', size: txt.length, md5: md5(txt) });
const tput = await fetch(tu.j.url, { method: 'PUT', headers: { ...tu.j.headers, Origin: SITE }, body: txt });
made.push(t);
const tc = await fn(A, { action: 'confirm', ...t, name: 'Shed list é.txt' });
check('a .txt in a note → kept', tput.ok && tc.status === 200, `${tput.status} ${tc.status}`);
const tg = await fetch((await fn(A, { action: 'open', ...t })).j.url);
const disp = tg.headers.get('content-disposition') || '';
check('…served as an attachment with its name', /^attachment; filename="Shed list _.txt"; filename\*=UTF-8''Shed%20list%20%C3%A9\.txt$/.test(disp), disp);

// 4. A PNG with its preview
const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360f8ffff3f0005fe02fe0def46b80000000049454e44ae426082', 'hex');
const g = { fileId: id(), area: 'project' };
const gu = await fn(A, { action: 'upload', ...g, name: 'damp patch.png', size: png.length, md5: md5(png) });
const gput = await fetch(gu.j.url, { method: 'PUT', headers: { ...gu.j.headers, Origin: SITE }, body: png });
made.push(g);
const gc = await fn(A, { action: 'confirm', ...g, name: 'damp patch.png' });
check('a PNG → kept', gput.ok && gc.status === 200);
const webp = Buffer.from('52494646240000005745425056503820180000003001009d012a0100010002003425a400037000fefb940000', 'hex');
const th = await fn(A, { action: 'thumb', ...g, size: webp.length, md5: md5(webp) });
const thput = th.status === 200 ? await fetch(th.j.url, { method: 'PUT', headers: { ...th.j.headers, Origin: SITE }, body: webp }) : null;
check('its preview → stored', th.status === 200 && thput?.ok, `${th.status} ${thput?.status}`);
const thg = await fetch((await fn(A, { action: 'open', ...g, thumb: true })).j.url);
check('…and served as image/webp', thg.ok && thg.headers.get('content-type') === 'image/webp' && Buffer.from(await thg.arrayBuffer()).equals(webp));

// 5. The server's check refuses a file that isn't what its name says, and deletes it
const fake = Buffer.from('<html><script>alert(1)</script></html>');
const f = { fileId: id(), area: 'project' };
const fu = await fn(A, { action: 'upload', ...f, name: 'not really.pdf', size: fake.length, md5: md5(fake) });
const fput = await fetch(fu.j.url, { method: 'PUT', headers: { ...fu.j.headers, Origin: SITE }, body: fake });
const fc = await fn(A, { action: 'confirm', ...f, name: 'not really.pdf' });
check('a .pdf that is really a web page → refused by confirm (422)', fput.ok && fc.status === 422, `${fput.status} ${fc.status}`);
check('…and gone from R2', (await fn(A, { action: 'open', ...f })).status === 404);
const svg = await fn(A, { action: 'upload', fileId: id(), area: 'project', name: 'logo.svg', size: 10, md5: md5(Buffer.alloc(10)) });
check('an .svg → refused at upload (422)', svg.status === 422);

// 6. Isolation (B reads nothing of its own; it only asks for A's ids)
const B = await signIn(env.MYDAY_LIVE_OTHER_EMAIL, env.MYDAY_LIVE_OTHER_PASSWORD);
check('account B opening A\'s file → 404', (await fn(B, { action: 'open', ...p })).status === 404);
check('account B confirming A\'s file → 404', (await fn(B, { action: 'confirm', ...p, name: 'Made-up quote (check).pdf' })).status === 404);

// 7. Usage, delete, delete-all
const u1 = await fn(A, { action: 'usage' });
check('usage counts the three files (not the preview)', u1.j.bytes - before === pdf.length + txt.length + png.length, `${u1.j.bytes - before}`);
const del = await fn(A, { action: 'delete', files: [p] });
check('delete → the PDF is gone', del.status === 200 && (await fn(A, { action: 'open', ...p })).status === 404);
const portNoKnows = await fn(A, { action: 'delete', files: [{ fileId: id(), area: 'portfolio' }] });
check('delete of a portfolio file without "knows" → 409 unknown-area (an older MyDay can\'t)', portNoKnows.status === 409 && portNoKnows.j.error === 'unknown-area', JSON.stringify(portNoKnows));
const portKnows = await fn(A, { action: 'delete', knows: ['project', 'note', 'portfolio'], files: [{ fileId: id(), area: 'portfolio' }] });
check('…with "knows" naming the portfolio → 200', portKnows.status === 200);
const big = await fn(A, { action: 'upload', fileId: id(), area: 'project', name: 'big.pdf', size: 26 * 1024 * 1024, md5: md5(Buffer.alloc(10)) });
check('a 26 MB file is still refused (25 MB each)', big.status === 422 && big.j.error === 'not-allowed');
const tooMany = await fn(A, { action: 'delete', files: Array.from({ length: 101 }, () => ({ fileId: id(), area: 'project' })) });
check('delete of 101 → 400', tooMany.status === 400);
const all = await fn(A, { action: 'delete-all' });
const u2 = await fn(A, { action: 'usage' });
check('delete-all → nothing left on the account', all.status === 200 && u2.j.bytes === 0, JSON.stringify({ all: all.j, bytes: u2.j.bytes }));
check('…the preview too', (await fn(A, { action: 'open', ...g, thumb: true })).status === 404);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
