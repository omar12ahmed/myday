// Live check of a business idea's experiments and money on the site (tests/live/run.py), on a disposable account and two
// throwaway devices (a Mac and a 320 px phone): a made-up business idea's thing that must be true gets an experiment,
// which is started, its result recorded and saved as a finding (switching Research on); its Money tab gets a currency,
// an average sale and four lines. The live database holds the experiment and the finding as research records and the
// money inside the one page's record, exactly; the phone receives all of it (break-even, the experiment's result) and
// adds a real month, which reaches the Mac. Then the project is deleted everywhere (its research with it). Never prints
// account details. Writes to the live database: only with the owner's yes.
const path = require('path');
const D = require(path.join(__dirname, 'devices.js'));
const BASE = process.env.MYDAY_BASE || 'https://omar12ahmed.github.io/myday/', VERSION = process.env.MYDAY_VERSION, SRC = process.env.MYDAY_SRC, KEY = 'myday.data.v4';
const URL_ = (process.env.SUPABASE_URL || '').replace(/\/+$/, ''), PUB = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const A = { email: process.env.MYDAY_LIVE_EMAIL, password: process.env.MYDAY_LIVE_PASSWORD }; // the disposable account run.py chose
if (!process.argv.includes('--live') || !A.email?.endsWith('@example.com') || !A.password || !SRC || !VERSION || !URL_ || !PUB.startsWith('sb_publishable_')) {
  console.log('Refused: explicit live check, a disposable account, version, source commit and the publishable key required.'); process.exit(2);
}
let pass = 0, fail = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || info === undefined ? '' : ' → ' + JSON.stringify(info).slice(0, 300))); ok ? pass++ : fail++; };
const TITLE = 'Live check Business (made up)', BELIEF = 'Shops would pay to be listed (made up)', EXP = 'Ask 20 shops (made up)', RESULT = '7 of 20 said yes (made up)';
const hdr = tok => ({ apikey: PUB, Authorization: `Bearer ${tok || PUB}`, 'Content-Type': 'application/json' });
async function signIn() {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: hdr(), body: JSON.stringify(A) });
  const j = await r.json(); if (!j.access_token) throw Error('REST sign-in failed'); return { token: j.access_token, id: j.user.id };
}
const rpc = (fn, who, args) => fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: hdr(who.token), body: JSON.stringify(args) });
async function pullAll(who) {
  const rows = []; let since = 0;
  for (;;) { const r = await (await rpc('sync_pull_v2', who, { account: who.id, since, max_rows: 1000 })).json();
    if (!Array.isArray(r)) throw Error('pull failed: ' + JSON.stringify(r).slice(0, 200)); rows.push(...r); if (r.length < 1000) break; since = r[r.length - 1].seq; }
  // The newest row of each record (the change log may hold several).
  const last = new Map(); for (const r of rows) if (!last.has(r.kind + ':' + r.record_id) || last.get(r.kind + ':' + r.record_id).seq < r.seq) last.set(r.kind + ':' + r.record_id, r);
  return [...last.values()];
}
// (The engine shows a change on the badge 300 ms after it, so wait that out first.)
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const toast = (d, s) => d.until(`[...document.querySelectorAll('[role=status]')].some(e => e.textContent.includes(${JSON.stringify(s)}))`, 15000);
// Records compared by content: the database stores JSON with its keys in its own order.
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const hex = id => Buffer.from(id, 'utf8').toString('hex');
const pick = (d, sel, value) => d.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
const projectOf = async (d, id) => (await d.data()).projects.items.find(p => p.id === id);
const researchOf = async (d, id) => (await d.data()).research.items.filter(x => x.projectId === id);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livebiz-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
    await d.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
    if (i) await d.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
    else await d.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await d.open(BASE + '#projects');
    if (!await d.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent on ' + name);
    await d.type('#syncEmailInput', A.email); await d.type('#syncPassword', A.password); await d.click('[data-action="sync-signin"]');
    check(`${name}: signs in and finishes syncing`, await d.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(d));
    check(`${name}: shows MyDay ${VERSION} from ${SRC}`, await d.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}') && !document.querySelector('#appVersion').textContent.includes('+changes')`));
    devs.push(d);
  }
  const [mac, phone] = devs;
  const who = await signIn();
  const deleteProject = async (d, id) => { await d.open(BASE + `#projects/p/${id}`); await d.until(`!!document.querySelector('[data-action=project-delete]')`); await d.click('[data-action=project-delete]'); await D.sleep(250); await d.click('[data-action=dialog-confirm]'); await D.sleep(500); };

  // Tidy first: anything left by an earlier stopped run.
  for (const id of (await mac.data()).projects.items.filter(p => p.title === TITLE).map(p => p.id)) await deleteProject(mac, id);
  await synced(mac);

  // Mac: a made-up business idea with one thing that must be true.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-kind][value=business]'); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE)?.id;
  check('mac: the made-up business idea is made', !!pid && (await projectOf(mac, pid)).template === 'business');
  await mac.open(BASE + `#projects/p/${pid}/model`); await mac.until(`!!document.querySelector('#modelNew')`, 15000);
  await mac.type('#modelNew', BELIEF); await mac.click('[data-action=model-add]');
  await mac.until(`!!document.querySelector('[data-s=assumption] [data-action=as-plan-experiment]')`, 10000);

  // An experiment: planned from it, started, its result recorded, saved as a finding.
  await mac.click('[data-s=assumption] [data-action=as-plan-experiment]'); await mac.until(`!!document.getElementById('exN-title')`, 5000);
  await mac.type('#exN-title', EXP); await mac.type('#exN-expect', 'Fewer than 5 say yes'); await mac.click('[data-action=experiment-save]');
  check('mac: the experiment is planned, testing the thing that must be true', await toast(mac, 'Planned.') && await mac.until(`!!document.querySelector('[data-s=experiment][data-status=planned]')`, 10000));
  await mac.click('[data-action=experiment-start]'); await mac.until(`!!document.querySelector('[data-s=experiment][data-status=running]')`, 5000);
  await mac.click('[data-action=experiment-record]'); await mac.until(`!!document.querySelector('[data-s=experiment-record-form] textarea')`, 5000);
  const eid = (await researchOf(mac, pid)).find(x => x.type === 'experiment')?.id;
  await mac.type(`#exR-${eid}`, RESULT); await mac.click('[data-action=experiment-record-save]');
  check('mac: its result is recorded and it\'s done; the offer to save it as a finding appears (nothing saved by itself)', await toast(mac, 'Recorded') && await mac.until(`!!document.querySelector('[data-s=experiment-offer]')`, 5000)
    && !(await researchOf(mac, pid)).some(x => x.type === 'finding'));
  await pick(mac, '[data-s=experiment-stance]', 'contradicts'); await mac.click('[data-action=experiment-finding]');
  check('mac: one tap saves it as a finding and switches Research on; the thing is still "not checked yet"', await toast(mac, 'Saved as a finding') && await mac.until(`!!document.querySelector('[data-s=experiment-finding]')`, 5000)
    && (await projectOf(mac, pid)).tools?.includes('research') && (await projectOf(mac, pid)).model.assumptions[0].state === 'open');

  // Money: a currency, an average sale and four lines.
  await mac.open(BASE + `#projects/p/${pid}/money`); await mac.until(`!!document.getElementById('moneyCurrency')`, 15000);
  await mac.type('#moneyCurrency', 'usd'); await mac.type('#moneySale', 'order'); await mac.type('#moneySaleValue', '30');
  await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}').model?.money?.saleValue === 30`, 5000);
  const line = async (list, label, dir, amount, percent) => {
    await mac.click(`[data-action=money-line-add][data-list=${list}]`); await mac.until(`!!document.getElementById('mlN-${list}-label')`, 5000);
    await mac.type(`#mlN-${list}-label`, label); await mac.click(`[data-action=money-dir][data-id=${dir}]`); await mac.type(`#mlN-${list}-amount`, String(amount));
    if (percent) await pick(mac, `#mlN-${list}-per`, 'percent');
    await mac.click('[data-action=money-line-save]'); await toast(mac, 'Added.'); await D.sleep(200);
  };
  await line('perSale', 'Commission (made up)', 'in', 8, true); await line('perSale', 'Delivery fee (made up)', 'in', 1.5); await line('perSale', 'Rider (made up)', 'out', 1.8);
  await line('monthly', 'Office (made up)', 'out', 900);
  check('mac: the break-even is worked out: 429 orders a month (each leaves USD 2.10)', await mac.until(`document.querySelector('[data-s=break-even]')?.textContent === '429 orders a month'`, 5000), await mac.text('[data-s=money-break-even]'));
  check('mac: saved to the account', await synced(mac));
  const rows = await pullAll(who), model = rows.find(r => r.kind === 'project_model' && r.record_id === hex(pid)), mine = await projectOf(mac, pid);
  const exRow = rows.find(r => r.kind === 'research' && r.record_id === eid), fRow = rows.find(r => r.kind === 'research' && r.data?.experimentId === eid);
  check('the live account holds the money inside the one page\'s record, and the experiment and its finding as research records, exactly as on the Mac',
    !!model && same(model.data?.value?.money, mine.model.money) && !!exRow && same(exRow.data, (await researchOf(mac, pid)).find(x => x.id === eid)) && !!fRow && fRow.data.about?.[0]?.stance === 'contradicts',
    { money: !!model?.data?.value?.money, exp: exRow?.data?.status, finding: !!fRow });

  // Phone: receives it all; adds a real month.
  await phone.open(BASE + `#projects/p/${pid}/money`); await synced(phone);
  check('phone: receives the money — "429 orders a month"', await phone.until(`document.querySelector('[data-s=break-even]')?.textContent === '429 orders a month'`, 30000), await phone.text('[data-s=money-break-even]'));
  check('phone: exactly the same one page as the Mac', same((await projectOf(phone, pid)).model, mine.model));
  check('phone at 320 px: nothing scrolls sideways; the Money tab\'s controls are at least 44 px tall', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('[data-s=money] button, [data-s=money] input')].filter(b => b.getBoundingClientRect().width).every(b => b.getBoundingClientRect().height >= 44)`), await phone.ev(`[document.documentElement.scrollWidth, innerWidth]`));
  const month = await phone.ev(`(() => { const x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); })()`);
  await phone.type('#moneyRealMonth', month); await phone.click('[data-action=real-add]'); await phone.until(`!!document.getElementById('real-${month}-sales')`, 5000);
  await phone.type(`#real-${month}-sales`, '85');
  check('phone: a real month is added (85 orders) and saved', await phone.until(`(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}').model.money.actual || []).some(a => a.month === '${month}' && a.sales === 85)`, 5000) && await synced(phone));
  await phone.open(BASE + `#projects/p/${pid}/model`);
  check('phone: the experiment shows done with its result, saved as a finding', await phone.until(`(document.querySelector('[data-s=experiment][data-status=done] [data-s=experiment-result]')?.textContent || '').includes(${JSON.stringify(RESULT)}) && !!document.querySelector('[data-s=experiment-finding]')`, 15000));

  // Mac: receives the real month.
  await mac.open(BASE + `#projects/p/${pid}/money`); await synced(mac);
  check('mac: receives the real month, kept apart from the plan', await mac.until(`!!document.querySelector('[data-s=real-month][data-month="${month}"]')`, 30000) && (await projectOf(mac, pid)).model.money.actual.some(a => a.month === month && a.sales === 85));

  // Tidy: the project (its research goes with it); gone on both devices and in the account.
  const rids = (await researchOf(mac, pid)).map(x => x.id);
  await deleteProject(mac, pid);
  check('tidy: the project and its research are gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !(await researchOf(mac, pid)).length && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'project' && r.record_id === pid) || (r.kind === 'research' && rids.includes(r.record_id)));
  check('tidy: in the account they are deletion markers', left.length === 1 + rids.length && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !d.research.items.some(x => x.projectId === '${pid}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
