// Minimal Chrome DevTools Protocol driver for MyDay tests.
const S = __dirname;
// Ports come from tests/run.sh (defaults shown).
const HTTP_PORT = process.env.MYDAY_HTTP_PORT || 8765, CDP_PORT = process.env.MYDAY_CDP_PORT || 9333;
let URL_ = `http://localhost:${HTTP_PORT}/index.html`;
const setUrl = u => { URL_ = /^(https?|file):/.test(u) ? u : `http://localhost:${HTTP_PORT}/` + u; };
let handler = null; const setHandler = f => { handler = f; };
let ws, id = 0; const pending = new Map(); const events = [];
function send(method, params = {}) {
  return new Promise((res, rej) => {
    const i = ++id;
    const t = setTimeout(() => { console.log(`HARNESS: no reply to ${method} after 60 s`); process.exit(4); }, 60000);
    pending.set(i, { res: v => { clearTimeout(t); res(v); }, rej: e => { clearTimeout(t); rej(e); } });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function connect() {
  const targets = await (await fetch(`http://localhost:${CDP_PORT}/json`)).json();
  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.onclose = e => { console.log(`HARNESS: browser connection closed (code ${e.code}${e.reason ? ', ' + e.reason : ''})`); process.exit(3); };
  ws.onerror = e => console.log('HARNESS: connection error', e && (e.message || e.type));
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(JSON.stringify(d.error))) : p.res(d.result); } else { events.push(d); if (handler) handler(d); } };
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable');
  await send('Emulation.setTimezoneOverride', { timezoneId: 'America/Los_Angeles' });
  await send('Emulation.setLocaleOverride', { locale: 'en-GB' });
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: S + '/dl' }).catch(() => {});
}
let clockScript = null;
let navCount = 0;
// Opens (or reloads) the app with the page clock set to a local wall-clock time in the emulated timezone.
async function openAt(y, mo, d, h = 9, mi = 0, confirmAnswer = true) {
  if (clockScript) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: clockScript });
  const src = `(() => { const RD = Date; let base = new RD(${y}, ${mo - 1}, ${d}, ${h}, ${mi}).getTime(); let start = RD.now();
    class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(base + (RD.now() - start)); } static now() { return base + (RD.now() - start); } }
    window.Date = FD; window.__setNow = (yy, mm, dd, hh, mn, ss) => { base = new RD(yy, mm - 1, dd, hh, mn, ss || 0).getTime(); start = RD.now(); };
    window.__confirms = []; window.confirm = msg => { window.__confirms.push(msg); return window.__confirmAnswer ?? ${confirmAnswer}; }; })();`;
  clockScript = (await send('Page.addScriptToEvaluateOnNewDocument', { source: src })).identifier;
  // A unique query string forces a real reload even when only the #section differs.
  const [base, hash] = URL_.split('#');
  await send('Page.navigate', { url: `${base}${base.includes('?') ? '&' : '?'}r=${++navCount}${hash ? '#' + hash : ''}` });
  await sleep(400);
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('Eval error: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
}
const click = sel => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}'); el.click(); return true; })()`);
const exists = sel => ev(`!!document.querySelector(${JSON.stringify(sel)})`);
const text = sel => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const data = () => ev(`JSON.parse(localStorage.getItem('myday.data.v4'))`);
const setEnergy = v => ev(`(() => { const r = document.getElementById('energy'); r.value = ${v}; r.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const planTitles = () => ev(`[...document.querySelectorAll('#app .task .title')].map(e => e.textContent)`);
const toast = () => text('#toast');
async function setFile(path) {
  const doc = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#importFile' });
  await send('DOM.setFileInputFiles', { nodeId, files: [path] });
  await sleep(300);
}
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS', name); } else { fail++; console.log('  FAIL', name, detail !== undefined ? '→ ' + JSON.stringify(detail) : ''); }
}
module.exports = { setHandler, events, setUrl, connect, openAt, ev, click, exists, text, data, setEnergy, planTitles, toast, setFile, check, sleep, send, S, summary: () => ({ pass, fail }) };
