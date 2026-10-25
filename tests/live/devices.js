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
    // A page load that gets no answer (the live site sometimes stalls from here) is stopped and retried by open().
    const nav = method === 'Page.navigate';
    const t = setTimeout(() => { if (nav) { pending.delete(i); rej(new Error('navigate timeout')); return; } console.log(`HARNESS: no reply to ${method} after 180 s`); process.exit(4); }, nav ? 45000 : 180000);
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
  await s('Emulation.setTimezoneOverride', { timezoneId: process.env.MYDAY_TEST_TZ || 'Europe/London' }); // see cdp.js
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
      // The page already open must never count as the new one: mark it, and wait for a document without the mark.
      await s('Runtime.evaluate', { expression: 'window.__oldDocument = true', returnByValue: true }).catch(() => {});
      for (let attempt = 1; ; attempt++) {
        try { await s('Page.navigate', { url: `${base}${base.includes('?') ? '&' : '?'}r=${++nav}${hash ? '#' + hash : ''}` }); break; }
        catch (e) { if (attempt >= 4 || !/navigate timeout/.test(e.message)) throw e; console.log(`(slow page load on ${name}, stopped and retried: ${attempt})`); await s('Page.stopLoading').catch(() => {}); }
      }
      // A new document that has loaded and drawn the app, with no start-up or "Opening…" notice of a screen still arriving.
      await D.until(`!window.__oldDocument && document.readyState === 'complete' && !!document.querySelector('#app') && ![...document.querySelectorAll('[role=status]')].some(e => /^(Opening|Loading|Getting)/.test(e.textContent.trim()))`, 30000);
      await sleep(100);
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
