// Live check of "Ask MyDay helps you think" (1.115.0, instructions v27) on the site (tests/live/run.py), on a disposable
// account and one throwaway Mac-width device. In What MyDay has noticed, "Questions Ask MyDay may ask before it offers
// something" is set to 2; + shows the count and that limit in what's sent; one made-up open question goes to Ask MyDay
// (a real AI request), and the request carries "thinking". If the answer asks with choices, one is tapped (a second
// request), which must carry the count and the conversation with the choices offered. Then Start over and the limit back
// to the usual, so the account is as before. Never prints account details. Writes to the live account and uses up to
// two of its AI requests for the day: only with the owner's yes.
const path = require('path');
const D = require(path.join(__dirname, 'devices.js'));
const BASE = process.env.MYDAY_BASE || 'https://omar12ahmed.github.io/myday/', VERSION = process.env.MYDAY_VERSION, SRC = process.env.MYDAY_SRC;
const A = { email: process.env.MYDAY_LIVE_EMAIL, password: process.env.MYDAY_LIVE_PASSWORD }; // the disposable account run.py chose
if (!process.argv.includes('--live') || !A.email?.endsWith('@example.com') || !A.password || !SRC || !VERSION) {
  console.log('Refused: explicit live check, a disposable account, version and source commit required.'); process.exit(2);
}
let pass = 0, fail = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || info === undefined ? '' : ' → ' + JSON.stringify(info).slice(0, 300))); ok ? pass++ : fail++; };
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const shown = (d, ms = 60000) => d.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase) && !document.querySelector('[data-s=ask-panel] [role=status]')`, ms);
const setLimit = (d, v) => d.ev(`(() => { const el = document.getElementById('prefAskQuestions'); if (!el) return false; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, '${v}'); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
// What the app sent to Ask MyDay, newest last (the request bodies, read from the browser's own network events).
const sentAsk = d => d.events.filter(e => e.method === 'Network.requestWillBeSent' && e.params.request.url.includes('functions/v1/ai-plan') && e.params.request.method === 'POST')
  .map(e => { try { return JSON.parse(e.params.request.postData).context; } catch { return null; } }).filter(c => c?.action === 'ask');

(async () => {
  await D.connect();
  const mac = await D.device('livethink-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const go = async h => { await mac.ev(`location.hash = '${h}'`); await D.sleep(700); };
  await go('noticed');
  check('Your preferences has "Questions Ask MyDay may ask before it offers something", at the usual 5', await mac.until(`!!document.getElementById('prefAskQuestions')`, 20000)
    && (await mac.ev(`document.getElementById('prefAskQuestions').value`)) === '5', await mac.ev(`document.getElementById('prefAskQuestions')?.value`));
  await setLimit(mac, 2); await synced(mac);
  check('…set to 2, it is saved with your preferences and synced', (await mac.ev(`JSON.parse(localStorage.getItem('myday.data.v4')).patterns.prefs.askQuestions`)) === 2);
  await go('today');
  await mac.click('[data-action=capture-open]'); await mac.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(300);
  await mac.type('#captureText', "I want to start a small side project but I'm not sure what (made up)"); await D.sleep(400);
  await mac.ev(`document.querySelector('[data-s=ask-sends-all] summary')?.click()`); await D.sleep(300);
  const pv = await mac.text('[data-s=ask-sends-all]');
  check('+ lists what goes with it: the questions asked so far (0) and your limit (2)', pv.includes('Questions it has asked so far: 0') && pv.includes('Your limit before it offers something: 2'), pv.slice(-200));
  await mac.click('[data-action=ask-go]');
  const panelNow = async () => ({ phase: await mac.ev(`document.querySelector('[data-s=ask-panel]')?.dataset.phase`), end: (await mac.text('[data-s=ask-panel]')).slice(-260) });
  check('Ask MyDay answers the open question', await shown(mac) && (await mac.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'shown', await panelNow());
  const first = sentAsk(mac).slice(-1)[0];
  check('…and the request carried "thinking": nothing asked yet, your limit of 2', JSON.stringify(first?.thinking) === JSON.stringify({ asked: 0, most: 2 }), first?.thinking);
  const choices = await mac.ev(`[...document.querySelectorAll('[data-s=ask-choice]')].map(b => b.textContent.trim())`);
  console.log(`(the answer ${choices.length ? `asked, with ${choices.length} choices` : 'didn’t ask'}: ${(await mac.text('[data-s=ask-message]')).slice(0, 160)})`);
  if (choices.length) {
    check('its choices are 1 to 4 buttons, with the reply box saying "Or in your own words…"', choices.length <= 4 && (await mac.ev(`document.querySelector('[data-s=ask-more]').placeholder`)) === 'Or in your own words…');
    await mac.ev(`document.querySelector('[data-s=ask-choice]').click()`);
    await mac.until(`!!document.querySelector('[data-s=ask-now]')?.textContent.includes(${JSON.stringify(choices[0])})`, 15000);
    check('tapping one sends it as your reply, and it is answered', await shown(mac) && (await mac.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'shown', await panelNow());
    const second = sentAsk(mac).slice(-1)[0];
    check('…the request carried the count (1 of 2) and the conversation, with the choices it offered', second?.text === choices[0] && JSON.stringify(second.thinking) === JSON.stringify({ asked: 1, most: 2 })
      && second.conversation?.earlier.length === 1 && second.conversation.earlier[0].answered.includes('(choices: '), second && { text: second.text, thinking: second.thinking, conversation: second.conversation });
  }
  await mac.ev(`[...document.querySelectorAll('[data-action=ask-dismiss]')].pop()?.click()`); await D.sleep(300);
  await mac.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await D.sleep(400);
  await go('noticed');
  await mac.until(`!!document.getElementById('prefAskQuestions')`, 10000);
  await setLimit(mac, 5); await synced(mac);
  check('the limit back to the usual 5: nothing saved', !('askQuestions' in (await mac.ev(`JSON.parse(localStorage.getItem('myday.data.v4')).patterns.prefs`))));
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
