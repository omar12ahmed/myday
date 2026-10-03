// The website as GitHub Pages will publish it (built by deploy/build-site.sh, served from a sub-folder like
// https://omar12ahmed.github.io/myday/): both layouts load every file, navigate, send older data to the
// current MyDay, and share saved data between the two apps.
//   trial:  the current MyDay at the main address, the new app at next/
//   switch: the new app at the main address, the current MyDay at classic/
const T = require('./cdp.js');
const { openAt, ev, exists, text, check, sleep, send } = T;
const HOST = `http://localhost:${process.env.MYDAY_HTTP_PORT || 8765}`;
const KEY = 'myday.data.v4';
const failed = [];
T.setHandler(d => {
  if (d.method === 'Network.responseReceived' && d.params.response.url.startsWith(HOST) && d.params.response.status >= 400) failed.push(d.params.response.status + ' ' + d.params.response.url);
  if (d.method === 'Network.loadingFailed' && (d.params.type === 'Script' || d.params.type === 'Stylesheet' || d.params.type === 'Font' || d.params.type === 'Document')) failed.push('failed ' + d.params.type);
});
const open = async url => { T.setUrl(url); await openAt(2026, 11, 2, 9); await sleep(300); };
const finish = () => {
  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
};

(async () => {
  await T.connect();
  await send('Network.enable');
  for (const [layout, base, appPath, classicPath] of [['trial', `${HOST}/pages-trial/myday/`, 'next/', ''], ['switch', `${HOST}/pages-switch/myday/`, '', 'classic/']]) {
    console.log(`\n[${layout}] ${base}`);
    failed.length = 0;
    await open(base + appPath + '#today'); await ev('localStorage.clear()'); await open(base + appPath + '#today');
    check(`${layout}: the new app loads at ${appPath || 'the main address'} (navigation and footer drawn)`, (await exists('#nav .nav-item')) && (await exists('#footer [data-action=export]')) && (await ev(`!!document.querySelector('script[type=module]')`)));
    check(`${layout}: its scripts, styles and fonts are found from the sub-folder (relative paths)`, (await ev(`[...document.querySelectorAll('script[src], link[rel=stylesheet]')].every(e => (e.src || e.href).startsWith(${JSON.stringify(base + appPath)}))`)) && (await ev(`document.fonts.ready.then(() => [...document.fonts].some(f => f.family.includes('Plus Jakarta') && f.status === 'loaded'))`)));
    for (const h of ['calendar', 'finance', 'health/food', 'study/roadmap', 'health/workout/schedule']) {
      await ev(`location.hash = '${h}'`); await sleep(250);
    }
    check(`${layout}: #addresses navigate without leaving the page (no server routes needed)`, (await ev('location.pathname')).endsWith('/myday/' + appPath) && (await exists('#schMode')));
    await open(base + appPath + '#study/roadmap');
    check(`${layout}: a deep link opens directly`, await exists('[data-action=s-edit]'));
    await open(base + classicPath + '#today');
    check(`${layout}: the current MyDay loads at ${classicPath || 'the main address'}`, (await exists('#nav .nav-item')) && (await text('#app')).length > 0);
    check(`${layout}: …with its own fonts`, await ev(`document.fonts.ready.then(() => [...document.fonts].some(f => f.family.includes('Plus Jakarta') && f.status === 'loaded'))`));
    // Shared saved data (same website, same browser storage)
    await ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); s.settings.theme = 'light'; s.study = s.study || {}; localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
    await open(base + appPath + '#today');
    check(`${layout}: both apps share the same saved data (a theme set in one shows in the other)`, (await ev('document.documentElement.dataset.theme')) === 'light');
    // Data from an older MyDay: the new app sends you to the current MyDay, which is where it says.
    await ev(`localStorage.clear(); localStorage.setItem('myday.data.v3', JSON.stringify({ schemaVersion: 3, lists: { learning: [], admin: [], health: [] }, days: {} }))`);
    await open(base + appPath + '#today');
    const link = await ev(`(() => { const a = [...document.querySelectorAll('#app a')].find(a => /current MyDay/i.test(a.textContent)); return a ? a.href : ''; })()`);
    const linkOk = link && (await ev(`fetch(${JSON.stringify(link)}).then(r => r.ok && r.url.startsWith(${JSON.stringify(base + classicPath)}))`));
    check(`${layout}: data from an older MyDay links to the current MyDay at ${classicPath || 'the main address'}`, !!linkOk && link.split('#')[0] === base + classicPath, link);
    check(`${layout}: no file was missing (no 404s)`, failed.length === 0, failed.slice(0, 5));
    await ev('localStorage.clear()');
  }
  finish();
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
