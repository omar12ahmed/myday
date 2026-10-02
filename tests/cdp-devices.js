// Drives several separate "devices" at once, for the sync tests. Each device is its own browser context in the
// one throwaway headless Chrome — like a separate browser profile, with its own saved data and sign-in — so a
// "Mac" and a "phone" can use the same MyDay address without sharing anything except the (stand-in) cloud.
const fs = require('fs');
const path = require('path');
const CDP_PORT = process.env.MYDAY_CDP_PORT || 9333;
let ws, id = 0;
const pending = new Map(), bySession = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function send(method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const i = ++id;
    const t = setTimeout(() => { console.log(`HARNESS: no reply to ${method} after 60 s`); process.exit(4); }, 60000);
    pending.set(i, { res: v => { clearTimeout(t); res(v); }, rej: e => { clearTimeout(t); rej(e); } });
    ws.send(JSON.stringify(sessionId ? { id: i, method, params, sessionId } : { id: i, method, params }));
  });
}

async function connect() {
  const v = await (await fetch(`http://localhost:${CDP_PORT}/json/version`)).json();
  ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  ws.onclose = e => { console.log(`HARNESS: browser connection closed (code ${e.code})`); process.exit(3); };
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(JSON.stringify(d.error))) : p.res(d.result); }
    else if (d.sessionId && bySession.has(d.sessionId)) bySession.get(d.sessionId)(d);
  };
}

// A new device. `dir` is where its downloads go.
async function device(name, dir) {
  const { browserContextId } = await send('Target.createBrowserContext', {});
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  const events = [];
  bySession.set(sessionId, d => events.push(d));
  fs.mkdirSync(dir, { recursive: true });
  await s('Page.enable'); await s('Runtime.enable'); await s('Network.enable');
  await s('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await s('Emulation.setLocaleOverride', { locale: 'en-GB' });
  await s('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir, browserContextId });
  let url = 'about:blank', nav = 0;

  const D = {
    name, dir, send: s, events,
    // Opens (or reloads) MyDay at the address given (or the last one), and waits until it has started.
    async open(u = url) {
      url = u;
      const [base, hash] = u.split('#');
      await s('Page.navigate', { url: `${base}${base.includes('?') ? '&' : '?'}r=${++nav}${hash ? '#' + hash : ''}` });
      await D.until(`document.readyState === 'complete' && !!document.querySelector('#app')`, 15000);
      await sleep(300);
    },
    async ev(expr) {
      const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(`[${name}] eval error: ` + JSON.stringify(r.exceptionDetails).slice(0, 400));
      return r.result.value;
    },
    // Waits until `expr` is true in the page (checked every 100 ms). Returns false if it never is.
    async until(expr, ms = 10000) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        try { if (await D.ev(`!!(${expr})`)) return true; } catch { /* page still loading */ }
        await sleep(100);
      }
      return false;
    },
    click: sel => D.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ' + ${JSON.stringify(sel)}); el.click(); return true; })()`),
    exists: sel => D.ev(`!!document.querySelector(${JSON.stringify(sel)})`),
    text: sel => D.ev(`(document.querySelector(${JSON.stringify(sel)}) || {}).textContent || ''`),
    // Types into a field the way a person does (React sees it).
    type: (sel, value) => D.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`),
    data: () => D.ev(`JSON.parse(localStorage.getItem('myday.data.v4'))`),
    notes: () => D.ev(`JSON.parse(localStorage.getItem('myday.sync.v1') || 'null')`),
    // Changes the saved data directly (like the classic MyDay or another tab would), then reloads.
    async setData(fn) {
      await D.ev(`(() => { const s = JSON.parse(localStorage.getItem('myday.data.v4')); (${fn})(s); localStorage.setItem('myday.data.v4', JSON.stringify(s)); })()`);
      await D.open();
    },
    status: () => D.ev(`(document.getElementById('syncBadge') || {}).dataset?.status || null`),
    phase: () => D.ev(`(document.getElementById('syncScreen') || {}).dataset?.phase || null`),
    offline: on => s('Network.emulateNetworkConditions', { offline: on, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }),
    // "Coming back to the app": what the browser says when MyDay's tab is shown again.
    returnToApp: () => D.ev(`document.dispatchEvent(new Event('visibilitychange'))`),
    today: () => D.ev(`(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()`),
    answer: yes => D.click(`[data-action=${yes ? 'dialog-confirm' : 'dialog-cancel'}]`),
    lastDownload: () => { const f = fs.readdirSync(dir).filter(x => !x.endsWith('.crdownload')).map(x => path.join(dir, x)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]; return f ? fs.readFileSync(f, 'utf8') : null; },
  };
  return D;
}

module.exports = { connect, device, send, sleep };
