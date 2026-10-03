// Food (Health) in the NEW app (app/, built into app/dist): the food checks from health.test.js, adapted,
// plus what the move asked for: an older search reply never replaces a newer one, failed requests leave
// saved data untouched, shopping items combine only when compatible (ambiguous ones stay separate and
// editable), no duplicates after double taps, reloads and redraws, the cooking position resumes, export/
// import with every section, phone layout and all three themes, and side-by-side checks that the new app
// saves Food data and shows the same recipes, quantities and shopping list as the current MyDay.
// TheMealDB is replaced by a fake for repeatable checks (its photos aren't needed).
// Differences these checks expect: confirmations are asked in the page; checkboxes are clicked (React
// only notices a real click); Export is on Today.
const fs = require('fs');
const T = require('./cdp.js');
const noSaves = t => { const o = typeof t === 'string' ? JSON.parse(t) : JSON.parse(JSON.stringify(t)); delete o.saves; return JSON.stringify(o); };
const { openAt, ev, click, exists, text, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const STOP = Number(process.env.STOP || 99);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const D = () => ev(`JSON.parse(localStorage.getItem('${KEY}'))`);
const H = async () => (await D()).health;
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const go = async (hash, y = 2026, m = 11, d = 2, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const nav = async hash => { await ev(`location.hash = ${JSON.stringify(hash)}`); await sleep(250); };
const texts = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(e => e.textContent.trim())`);
const flat = s => String(s).replace(/\s+/g, '');
const setVal = (sel, v, evt = 'change') => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(String(v))});
  el.dispatchEvent(new Event('input', { bubbles: true })); if (${JSON.stringify(evt)} === 'change') el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const answer = async yes => { await sleep(150); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(200); };
async function waitFor(expr, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await sleep(150); } return false; }
const setTZ = async tz => { await T.send('Emulation.setTimezoneOverride', { timezoneId: '' }).catch(() => {}); await T.send('Emulation.setTimezoneOverride', { timezoneId: tz }); };
const contrastOf = sel => ev(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 0;
  const rgb = c => c.match(/[\\d.]+/g).map(Number);
  const lum = c => { const [r, g, b] = rgb(c).slice(0, 3).map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  let bg = null; for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; const a = rgb(c); if (a.length < 4 || a[3] > 0.9) { bg = c; break; } }
  if (!bg) bg = getComputedStyle(document.body).backgroundColor;
  const [x, y] = [lum(getComputedStyle(el).color), lum(bg)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); })()`);
const exportNow = async () => {
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1500);
  return JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-11-02.json', 'utf8'));
};
const finish = () => {
  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const s = T.summary();
  console.log(`\n${s.pass} passed, ${s.fail} failed`);
  process.exit(s.fail ? 1 : 0);
};

// ---------- A fake TheMealDB for repeatable checks (as in health.test.js) ----------
const meal = (id, name, cat, area, ings, instr) => {
  const m = { idMeal: String(id), strMeal: name, strCategory: cat, strArea: area, strInstructions: instr, strMealThumb: `https://www.themealdb.com/images/media/meals/x${id}.jpg`, strTags: 'Test', strYoutube: '', strSource: 'https://example.com/r' + id };
  ings.forEach(([n, ms], i) => { m['strIngredient' + (i + 1)] = n; m['strMeasure' + (i + 1)] = ms; });
  for (let i = ings.length + 1; i <= 20; i++) { m['strIngredient' + i] = ''; m['strMeasure' + i] = ''; }
  return m;
};
const M = {
  bake: meal(91001, 'Test Pasta Bake', 'Pasta', 'Italian', [['Pasta', '200g'], ['Olive Oil', '1 tbsp'], ['Salt', 'pinch'], ['Eggs', '2 large'], ['Milk', '1 cup']], 'STEP 1\r\nBoil the pasta for 10 minutes.\r\n\r\nSTEP 2\r\nMix the eggs and milk.\r\n3. Bake for 1 hour until golden.'),
  pork: meal(91002, 'Pork Chops', 'Pork', 'British', [['Pork Chops', '4'], ['Apples', '2']], 'Fry the chops.'),
  curry: meal(91003, 'Coconut Curry', 'Vegetarian', 'Thai', [['Coconut Milk', '400ml'], ['Rice', '1 cup'], ['Flour', '200g']], 'Simmer for 20 mins.\r\nServe.'),
  soup: meal(91004, 'Tomato Soup', 'Vegetarian', 'British', [['Tomatoes', '6'], ['Onion', '1'], ['Stock', '1 (12 oz.) can']], 'Cook everything together.'),
  salad: meal(91005, 'Bean Salad', 'Vegan', 'Greek', [['Beans', '1 can'], ['Lemon', '1']], 'Mix.'),
  stew: meal(91006, 'Veg Stew', 'Vegetarian', 'Irish', [['Carrots', '3'], ['Potatoes', '500g']], 'Simmer for 30 minutes.'),
  tart: meal(91007, 'Onion Tart', 'Vegetarian', 'French', [['Onion', '3'], ['Pastry', '1 sheet']], 'Bake.'),
  rice: meal(91008, 'Fried Rice', 'Vegetarian', 'Chinese', [['Rice', '2 cups'], ['Peas', '100g']], 'Fry.'),
  // For the combining checks: the same things in compatible, incompatible and ambiguous amounts.
  mixA: meal(91009, 'Mix One', 'Vegetarian', 'British', [['Rice', '500g'], ['Milk', '2 cups'], ['Garlic', '1-2 cloves'], ['Chopped Tomatoes', '1 (400g) tin'], ['Lemons', '2']], 'Cook.'),
  mixB: meal(91010, 'Mix Two', 'Vegetarian', 'British', [['Rice', '1kg'], ['Milk', '200ml'], ['Garlic', '1-2 cloves'], ['Chopped Tomatoes', '1 (400g) tin'], ['Lemon', '1']], 'Cook.'),
};
let randomQueue = [], mdbMode = 'ok', mdbCalls = [], delays = {};
const fulfil = (id, body, code = 200) => T.send('Fetch.fulfillRequest', { requestId: id, responseCode: code, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(body).toString('base64') }).catch(() => {});
T.setHandler(d => {
  if (d.method !== 'Fetch.requestPaused') return;
  const url = d.params.request.url, id = d.params.requestId;
  if (!url.includes('/api/json/')) { fulfil(id, '', 404); return; } // photos: not needed for the checks
  mdbCalls.push(url);
  if (mdbMode === 'fail') { T.send('Fetch.failRequest', { requestId: id, errorReason: 'InternetDisconnected' }).catch(() => {}); return; }
  if (url.includes('random.php')) { const m = randomQueue.shift() || M.rice; fulfil(id, JSON.stringify({ meals: [m] })); return; }
  if (url.includes('search.php')) {
    const q = decodeURIComponent(url.split('s=')[1] || '').toLowerCase();
    const reply = () => fulfil(id, JSON.stringify({ meals: Object.values(M).filter(m => m.strMeal.toLowerCase().includes(q)) }));
    if (delays[q]) setTimeout(reply, delays[q]); else reply(); // a slow reply, to check older answers can't win
    return;
  }
  if (url.includes('lookup.php')) { const i = url.split('i=')[1]; const m = Object.values(M).find(x => x.idMeal === i); fulfil(id, JSON.stringify({ meals: m ? [m] : null })); return; }
  fulfil(id, '{}');
});

(async () => {
  await T.connect();
  await setTZ('Europe/London');
  await T.send('Fetch.enable', { patterns: [{ urlPattern: 'https://www.themealdb.com/*' }] });
  let h;

  // ------------------------------------------------------------------
  console.log('\n[34] Food: ideas, preferences, recipes, failed requests');
  await go('today'); await reset(); await go('today');
  await editStorage(`s => { delete s.health; }`);
  randomQueue = [M.bake, M.pork, M.curry, M.soup, M.salad, M.stew, M.tart];
  await go('health/food', 2026, 11, 2, 9);
  check('Food opens in the new app, with Workout, Food and Goal tabs (Goal is new in 1.3.0)', eq(await texts('.health-tabs .seg-link'), ['Workout', 'Food', 'Goal']) && (await ev(`document.querySelector('#nav a[href="#health"]').getAttribute('aria-label')`)) === 'Health');
  await waitFor(`document.querySelectorAll('.rcard:not(.skeleton)').length >= 3`);
  check('about three suggestion cards to start with', (await ev(`document.querySelectorAll('.rgrid .rcard:not(.skeleton)').length`)) === 3);
  check('cards show what is known and say what is not listed (nothing invented)', (await text('.rcard')).includes('Pasta · Italian') && (await text('.rcard')).includes('Time, servings, nutrition not listed'));
  check('looking at ideas saves nothing', !(await D()).health || Object.keys((await H()).food.recipes).length === 0);
  await click('[data-action=h-suggest-more]');
  await waitFor(`document.querySelectorAll('.rgrid .rcard:not(.skeleton)').length >= 6`);
  check('"Show more" adds three more', (await ev(`document.querySelectorAll('.rgrid .rcard:not(.skeleton)').length`)) === 6);
  await nav('health/food/prefs');
  await click('[data-h=pref-ex][data-key=pork]'); await sleep(100);
  check('preferences save as you change them, and explain they are not an allergen guarantee', eq((await H()).food.prefs.exclude, ['pork']) && (await text('#app')).includes("can't guarantee a recipe is free from an allergen"));
  randomQueue = [M.bake, M.pork, M.curry, M.soup];
  await nav('health/food');
  await waitFor(`!document.querySelector('.skeleton') && document.querySelectorAll('.rgrid .rcard').length >= 3`);
  const titles = await texts('.rgrid .rcard h3');
  check('excluded recipes are left out, and it says so', !titles.includes('Pork Chops') && titles.length === 3 && (await text('#app')).includes('1 idea left out'), titles);
  await nav('health/food/recipe/mdb-91001');
  const steps = await texts('ol.steps li');
  check('recipe shows ingredients, numbered steps split only on its own lines, and its source', eq(steps, ['Boil the pasta for 10 minutes.', 'Mix the eggs and milk.', 'Bake for 1 hour until golden.']) && (await text('.ing-list')).includes('200g') && (await text('#app')).includes('From TheMealDB'), steps);
  check('…with a link to the original recipe and TheMealDB', (await exists('a[href="https://example.com/r91001"][target=_blank]')) && (await exists('a[href="https://www.themealdb.com/meal/91001"][target=_blank]')));
  check('no servings in the source → quantities as written, no scaling offered', (await text('#app')).includes('quantities are shown as written') && !(await exists('[data-action=h-serv]')));
  check('missing nutrition shown as not available', (await text('#app')).includes('Not available from the source.'));
  check('allergen caution shown', (await text('#app')).includes("can't confirm a recipe is free from any allergen"));
  check('Favourite, Want to cook and Start cooking are three clear, separate actions', (await exists('[data-action=h-fav][aria-pressed=false]')) && (await exists('a[href="#health/food/want/mdb-91001"]')) && (await exists('[data-action=h-cook-start]')) && (await text('#app')).includes('None of these records what you eat'));
  await ev(`document.getElementById('servBase').value = '4'`); await click('[data-action=h-serv-base]'); await sleep(120);
  for (let i = 0; i < 4; i++) { await click('[data-action=h-serv][data-d="1"]'); await sleep(60); }
  const ing8 = await texts('.ing-list li');
  check('after you enter "serves 4", quantities scale to 8 (200g → 400 g, 1 cup → 2, "pinch" left as written)', (await text('#servNow')) === '8' && ing8.some(x => x.startsWith('400 g') || x.startsWith('400g')) && ing8.some(x => x.startsWith('2 cup')) && ing8.some(x => x.includes('pinch') && x.includes('(as written)')), ing8);
  check('your servings are labelled as your entry', (await text('#app')).includes('(base set by you)') && (await text('#app')).includes('Serves 4 (your entry)'));
  await click('[data-action=h-fav]'); await sleep(120);
  h = await H();
  check('favourite saved locally as text + source reference (photo URL only, no image data)', !!h.food.recipes['mdb-91001'] && h.food.favourites.includes('mdb-91001') && h.food.recipes['mdb-91001'].servingsSource === 'user' && !(await ev(`localStorage.getItem('${KEY}')`)).includes('data:image'));
  mdbMode = 'fail';
  const savedBeforeFail = await ev(`localStorage.getItem('${KEY}')`);
  await go('health/food', 2026, 11, 2, 10);
  await waitFor(`!!document.querySelector('.warn')`);
  check('TheMealDB unavailable: friendly message and Try again', (await text('#app')).includes("Couldn't reach TheMealDB") && (await exists('[data-action=h-suggest-retry]')));
  check('…favourites still work offline', (await text('#app')).includes('Favourites') && (await text('#app')).includes('Test Pasta Bake'));
  await nav('health/food/recipe/mdb-91006');
  await waitFor(`document.body.textContent.includes("Couldn't load this recipe")`);
  check('an unsaved recipe that fails to load shows an error and Try again', (await exists('[data-action=h-recipe-retry]')));
  check('…and failed requests leave saved data exactly as it was', noSaves(await ev(`localStorage.getItem('${KEY}')`)) === noSaves(savedBeforeFail));
  mdbMode = 'ok';
  await click('[data-action=h-recipe-retry]');
  await waitFor(`!!document.querySelector('ol.steps')`);
  check('…and loads when the connection is back', (await texts('h2')).includes('Veg Stew'));
  await nav('health/food'); await sleep(200);
  await ev(`document.getElementById('foodQ').value = 'curry'`); await click('[data-action=h-food-search]');
  await waitFor(`document.querySelectorAll('.rgrid .rcard').length > 0`);
  check('search finds recipes', (await texts('.rgrid .rcard h3')).includes('Coconut Curry'));
  // Your own recipe
  await nav('health/food/new');
  await ev(`document.getElementById('rfTitle').value = 'My Pasta'; document.getElementById('rfServ').value = '2'; document.getElementById('rfIng').value = '200 g pasta\\n1 tbsp olive oil\\nsalt\\n1 cup flour'; document.getElementById('rfMethod').value = 'Boil pasta for 8 minutes.\\nAdd oil.'; document.getElementById('rfKcal').value = '520';`);
  await click('[data-action=h-recipe-save]'); await sleep(250);
  h = await H();
  const mine = Object.values(h.food.recipes).find(r => r.title === 'My Pasta');
  check('own recipe saved with parsed ingredients and labelled nutrition', mine && eq(mine.ingredients, [{ name: 'pasta', measure: '200 g' }, { name: 'olive oil', measure: '1 tbsp' }, { name: 'salt', measure: '' }, { name: 'flour', measure: '1 cup' }]) && mine.nutritionSource === 'user' && (await text('#app')).includes('Entered by you'));
  await click('[data-action=h-serv][data-d="1"]'); await sleep(60); await click('[data-action=h-serv][data-d="1"]'); await sleep(60);
  const own4 = await texts('.ing-list li');
  check('own recipe scales from its base servings (2 → 4: 400 g, 2 tbsp)', own4[0].startsWith('400 g') && own4[1].startsWith('2 tbsp'), own4);
  await go('health/food', 2026, 11, 2, 10, 30);
  check('own recipes and favourites persist after a reload', (await text('#app')).includes('My recipes') && (await text('#app')).includes('My Pasta') && (await text('#app')).includes('Test Pasta Bake'));
  // As in the current MyDay's checks at this point: My Pasta shown for 4 servings this visit (the bake back at its base 4).
  await nav('health/food/recipe/' + mine.id); await click('[data-action=h-serv][data-d="1"]'); await sleep(60); await click('[data-action=h-serv][data-d="1"]'); await sleep(60);

  if (STOP < 35) return finish();
  // ------------------------------------------------------------------
  console.log('\n[34b] Search suggestions while typing');
  await nav('health/food'); await sleep(200);
  const typeKeys = async (s, gap = 60) => { await ev(`document.getElementById('foodQ').focus()`); for (const ch of s) { await T.send('Input.insertText', { text: ch }); await sleep(gap); } };
  const clearQ = () => setVal('#foodQ', '', 'input');
  const sugg = () => texts('#foodSuggest .ta-title');
  const key = k => ev(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
  await clearQ();
  const storedBefore = await ev(`localStorage.getItem('${KEY}')`);
  let n0 = mdbCalls.length;
  await typeKeys('c'); await sleep(450);
  check('one letter: no suggestions and no request yet', !(await exists('#foodSuggest .ta-item')) && !mdbCalls.slice(n0).some(u => u.includes('search.php')));
  await typeKeys('urr');
  await waitFor(`[...document.querySelectorAll('#foodSuggest .ta-title')].some(e => e.textContent === 'Coconut Curry')`);
  const curr = mdbCalls.slice(n0).filter(u => u.includes('search.php'));
  check('suggestions appear while typing ("curr" → Coconut Curry)', (await sugg()).includes('Coconut Curry'), await sugg());
  check('waits for a pause in typing: one request for "curr", not one per letter', curr.length === 1 && curr[0].endsWith('s=curr'), curr);
  check('the typed part is highlighted', (await ev(`document.querySelector('#foodSuggest .ta-title strong').textContent`)) === 'Curr');
  check('focus and text stay in the search box', (await ev(`document.activeElement.id`)) === 'foodQ' && (await ev(`document.getElementById('foodQ').value`)) === 'curr');
  await clearQ(); await sleep(100);
  check('clearing the box closes the suggestions', !(await exists('#foodSuggest .ta-item')) && !(await text('#foodSuggest')).trim());
  mdbMode = 'fail'; n0 = mdbCalls.length;
  await typeKeys('pas', 20);
  check('your saved recipes show straight away (name or ingredient match)', (await sugg()).includes('My Pasta') && (await sugg()).includes('Test Pasta Bake'), await sugg());
  await waitFor(`document.getElementById('foodSuggest').textContent.includes("Couldn't reach TheMealDB")`);
  check('offline: says so and keeps your saved matches', (await text('#foodSuggest')).includes('Showing your saved recipes only') && (await sugg()).includes('My Pasta'));
  mdbMode = 'ok';
  await clearQ(); await typeKeys('pork');
  await waitFor(`!document.getElementById('foodSuggest').textContent.includes('Looking on TheMealDB')`);
  check('preferences apply: excluded recipes are left out, and it says so', !(await sugg()).includes('Pork Chops') && (await text('#foodSuggest')).includes('1 left out because of your preferences'), await text('#foodSuggest'));
  await clearQ(); await typeKeys('cu');
  await waitFor(`(document.getElementById('foodSuggest').textContent || '').includes('Coconut Curry')`);
  await ev(`document.querySelector('[data-action=h-suggest-more], [data-action=h-suggest-retry]').click()`); // ideas reload re-renders the page
  await sleep(600);
  check('ideas loading in the background does not interrupt typing', (await ev(`document.activeElement.id`)) === 'foodQ' && (await ev(`document.getElementById('foodQ').value`)) === 'cu' && (await sugg()).includes('Coconut Curry'));
  await key('ArrowDown'); await sleep(60);
  check('↓ moves to the first suggestion', (await ev(`document.activeElement.classList.contains('ta-item')`)));
  await key('Escape'); await sleep(80);
  check('Escape closes the suggestions and returns to the search box', !(await exists('#foodSuggest .ta-item')) && (await ev(`document.activeElement.id`)) === 'foodQ' && (await ev(`document.getElementById('foodQ').value`)) === 'cu');
  check('typing never saves anything', (await ev(`localStorage.getItem('${KEY}')`)) === storedBefore);
  await clearQ(); n0 = mdbCalls.length; await typeKeys('cur');
  await waitFor(`(document.getElementById('foodSuggest').textContent || '').includes('Coconut Curry')`);
  await ev(`[...document.querySelectorAll('#foodSuggest .ta-item')].find(a => a.textContent.includes('Coconut Curry')).click()`);
  await waitFor(`!!document.querySelector('ol.steps')`);
  check('choosing a suggestion opens that recipe, with no extra request', (await ev('location.hash')) === '#health/food/recipe/mdb-91003' && !mdbCalls.slice(n0).some(u => u.includes('lookup.php')) && !(await exists('#foodSuggest .ta-item')));
  await nav('health/food'); await sleep(200);
  await clearQ(); n0 = mdbCalls.length; await typeKeys('soup');
  await key('Enter');
  await waitFor(`location.hash === '#health/food/search' && document.querySelectorAll('.rgrid .rcard').length > 0`);
  check('Enter still runs a full search (and closes the suggestions)', (await texts('.rgrid .rcard h3')).includes('Tomato Soup') && !(await exists('#foodSuggest .ta-item')));
  check('…without asking TheMealDB twice for the same words', mdbCalls.slice(n0).filter(u => u.includes('search.php')).length === 1, mdbCalls.slice(n0));
  // An older reply can never replace a newer search.
  delays = { stew: 1500 };
  await setVal('#foodQ', 'stew', 'input'); await click('[data-action=h-food-search]'); await sleep(100);
  await setVal('#foodQ', 'tart', 'input'); await click('[data-action=h-food-search]');
  await sleep(2000);
  check('a slow reply for an earlier search ("stew") doesn\'t replace the newer results ("tart")', eq(await texts('.rgrid .rcard h3'), ['Onion Tart']) && !(await text('#app')).includes('Searching…'), await texts('.rgrid .rcard h3'));
  delays = { 've': 1500 };
  await clearQ(); await typeKeys('ve', 20); await sleep(400); await clearQ(); await typeKeys('on', 20);
  await sleep(2000);
  check('…and the same for suggestions while typing', (await sugg()).includes('Onion Tart') && !(await sugg()).includes('Veg Stew'), await sugg());
  delays = {};
  await clearQ();

  if (STOP < 36) return finish();
  // ------------------------------------------------------------------
  console.log('\n[35] Want to cook → shopping list');
  await nav('health/food/want/' + mine.id);
  check('Want to cook: choose servings, see ingredients, tick what you have', (await exists('[data-action=h-want-serv]')) && (await ev(`document.querySelectorAll('[data-h=want-have]').length`)) === 4);
  await click('[data-action=h-want-serv][data-d="1"]'); await sleep(60); await click('[data-action=h-want-serv][data-d="1"]'); await sleep(60);
  await click('[data-h=want-have][data-i="2"]'); await sleep(80);
  check('button counts what is still needed (3 items)', (await text('[data-action=h-want-add]')).includes('Add 3 items'));
  await click('[data-action=h-want-add]'); await sleep(250);
  await nav('health/food/want/mdb-91001');
  await click('[data-action=h-want-add]'); await sleep(250);
  h = await H();
  const shop = h.food.shopping;
  const find = n => shop.filter(x => x.name.toLowerCase() === n);
  check('pasta combined across recipes: 400 g + 400 g = 800 g (compatible units)', find('pasta').length === 1 && find('pasta')[0].amount === 800 && find('pasta')[0].family === 'g', find('pasta'));
  check('olive oil combined: 2 tbsp + 2 tbsp → 12 tsp shown as 4 tbsp', find('olive oil').length === 1 && (await text('#app')).includes('4 tbsp'));
  check('incompatible units kept apart: flour in cups; "pinch" salt kept as written', find('flour').length === 1 && find('flour')[0].family === 'cup' && find('salt').length === 1 && find('salt')[0].text === 'pinch');
  check('items grouped by aisle (Dairy & eggs, Cupboard, Herbs & spices)', eq(await texts('#app section h3'), ['Dairy & eggs', 'Cupboard', 'Herbs & spices', 'Recipes on this list']), await texts('#app section h3'));
  await ev(`document.getElementById('shopAdd').value = '2 lemons'`); await click('[data-action=h-shop-add]'); await sleep(100);
  await ev(`document.getElementById('shopAdd').value = '1 lemon'`); await click('[data-action=h-shop-add]'); await sleep(100);
  h = await H();
  check('manual additions work, and combine when they match (2 + 1 lemons = 3, Fruit & veg)', h.food.shopping.filter(x => /lemon/.test(x.name)).length === 1 && h.food.shopping.find(x => /lemon/.test(x.name)).amount === 3 && h.food.shopping.find(x => /lemon/.test(x.name)).category === 'Fruit & veg');
  const pastaId = find('pasta')[0].id;
  await click(`[data-action=h-shop-edit][data-id="${pastaId}"]`); await sleep(80);
  await ev(`document.getElementById('seQty').value = '1 kg'`); await click(`[data-action=h-shop-edit-save][data-id="${pastaId}"]`); await sleep(100);
  check('quantities can be edited (pasta → 1 kg)', (await H()).food.shopping.find(x => x.id === pastaId).amount === 1000 && (await text('#app')).includes('1 kg'));
  const order = (await H()).food.shopping.map(x => x.id);
  await click(`[data-action=h-shop-remove][data-id="${pastaId}"]`); await sleep(100);
  check('removing shows Undo', (await exists('[data-action=h-shop-undo]')) && !(await H()).food.shopping.some(x => x.id === pastaId));
  await click('[data-action=h-shop-undo]'); await sleep(100);
  check('…and Undo puts it back in the same place', eq((await H()).food.shopping.map(x => x.id), order));
  await click(`[data-h=shop-check][data-id="${pastaId}"]`); await sleep(100);
  await go('health/food/shopping', 2026, 11, 2, 11);
  check('ticks and items persist after reload', (await H()).food.shopping.find(x => x.id === pastaId).checked && (await text('#app')).includes('Ticked (1)'));
  check('no calories are logged by choosing or shopping', !('eaten' in (await H()).food) && !JSON.stringify(await H()).includes('consum'));

  if (STOP < 37) return finish();
  // ------------------------------------------------------------------
  console.log('\n[36] Focused cooking view');
  await nav('health/food/recipe/mdb-91001');
  await click('[data-action=h-cook-start]'); await sleep(250);
  check('one step at a time, with step count', (await text('.cook-view .eyebrow')) === 'Step 1 of 3' && (await text('#cookStep')) === 'Boil the pasta for 10 minutes.');
  check('the step number is large and clear', (await text('.step-num')) === '1' && (await ev(`parseFloat(getComputedStyle(document.querySelector('.step-num')).fontSize)`)) >= 20);
  check('a timer is offered because the step names a duration', (await text('[data-action=h-ctimer]')).includes('10 minutes'));
  await click('[data-action=h-ctimer]'); await sleep(120);
  check('step timer runs (10:00)', ['10:00', '09:59'].includes(await text('#cookTime')));
  await click('[data-action=h-ctimer-pause]'); await sleep(100);
  check('…and can be paused', (await exists('[data-action=h-ctimer-resume]')));
  await click('[data-action=h-cook-step][data-d="1"]'); await sleep(120);
  await go('health/food/cook', 2026, 11, 2, 12);
  check('position is saved — resumes on step 2 after reload', (await text('.cook-view .eyebrow')) === 'Step 2 of 3' && (await text('.step-num')) === '2');
  check('full method and ingredients are one tap away', (await text('#app')).includes('Full method') && (await exists('.cook-view ~ .card details .ing-list')));
  await go('today', 2026, 11, 2, 12, 1);
  check('Today shows cooking to resume and the shopping list', (await text('#slot-health')).includes('Cooking: Test Pasta Bake') && (await text('#slot-health')).includes('Shopping list') && !(await exists('#app .task')));
  await go('health/food/cook', 2026, 11, 2, 12, 2);
  await click('[data-action=h-cook-step][data-d="1"]'); await sleep(120);
  await ev(`(() => { const b = document.querySelector('[data-action=h-cook-finish]'); b.click(); b.click(); })()`); await sleep(300);
  h = await H();
  check('finishing saves cooking history only, once (no food-eaten log), and clears Want to cook for it', h.food.cooked.length === 1 && h.food.cooked[0].title === 'Test Pasta Bake' && !h.food.cooking && !h.food.want.some(x => x.recipeId === 'mdb-91001') && (await text('#app')).includes('Recently cooked'));
  const instr = h.food.recipes['mdb-91001'].instructions;
  check('original recipe text is preserved exactly', instr === M.bake.strInstructions);

  if (STOP < 38) return finish();
  // ------------------------------------------------------------------
  console.log('\n[38] Combining only what is compatible');
  await nav('health/food/want/mdb-91009'); await waitFor(`!!document.querySelector('[data-action=h-want-add]')`);
  await click('[data-action=h-want-add]'); await sleep(250);
  await nav('health/food/want/mdb-91010'); await waitFor(`!!document.querySelector('[data-action=h-want-add]')`);
  await click('[data-action=h-want-add]'); await sleep(250);
  h = await H();
  const by = n => h.food.shopping.filter(x => x.name.toLowerCase() === n.toLowerCase() && !x.checked);
  check('rice: 500 g + 1 kg combine into 1.5 kg', by('rice').length === 1 && by('rice')[0].amount === 1500 && (await text('#app')).includes('1.5 kg'), by('rice'));
  check('milk: cups and millilitres are never mixed (two items)', by('milk').length === 2 && eq(by('milk').map(x => x.family).sort(), ['cup', 'ml']));
  check('a range ("1-2 cloves") is kept as written, never combined', by('garlic').length === 2 && by('garlic').every(x => x.text === '1-2 cloves' && x.family === null));
  check('an amount with a size in it ("1 (400g) tin") is kept as written', by('chopped tomatoes').length === 2 && by('chopped tomatoes').every(x => x.text === '1 (400g) tin'));
  check('"Lemons" and "Lemon" are the same item (2 + 1)', h.food.shopping.filter(x => /^lemons?$/i.test(x.name) && !x.checked).length === 1 && h.food.shopping.find(x => /^lemons?$/i.test(x.name) && !x.checked).amount === 6);
  const g0 = by('garlic')[0];
  await click(`[data-action=h-shop-edit][data-id="${g0.id}"]`); await sleep(80);
  await ev(`document.getElementById('seQty').value = '3 cloves'`); await click(`[data-action=h-shop-edit-save][data-id="${g0.id}"]`); await sleep(100);
  check('an as-written quantity can be edited into a plain one', (await H()).food.shopping.find(x => x.id === g0.id).amount === 3 && (await H()).food.shopping.find(x => x.id === g0.id).unit === 'cloves');
  await click(`[data-h=shop-check][data-id="${by('rice')[0].id}"]`); await sleep(100);
  await ev(`document.getElementById('shopAdd').value = '500 g rice'`); await click('[data-action=h-shop-add]'); await sleep(100);
  h = await H();
  check('a ticked item is never added to (new rice is its own item)', h.food.shopping.filter(x => x.name.toLowerCase() === 'rice').length === 2 && h.food.shopping.find(x => x.name.toLowerCase() === 'rice' && !x.checked).amount === 500);
  await nav('health/food/new');
  await ev(`document.getElementById('rfTitle').value = 'Garlic bread'; document.getElementById('rfIng').value = '1-2 cloves garlic\\n1 to 2 tbsp butter';`);
  await click('[data-action=h-recipe-save]'); await sleep(250);
  const gb = Object.values((await H()).food.recipes).find(r => r.title === 'Garlic bread');
  check('your own recipe keeps a typed range together ("1-2", "1 to 2 tbsp")', eq(gb.ingredients, [{ name: 'cloves garlic', measure: '1-2' }, { name: 'butter', measure: '1 to 2 tbsp' }]), gb.ingredients);

  if (STOP < 39) return finish();
  // ------------------------------------------------------------------
  console.log('\n[39] No duplicates: double taps, reloads and redraws');
  await nav('health/food/shopping');
  const n1 = (await H()).food.shopping.length;
  await ev(`(() => { document.getElementById('shopAdd').value = '1 jar honey'; const b = document.querySelector('[data-action=h-shop-add]'); b.click(); b.click(); })()`); await sleep(150);
  h = await H();
  check('two quick taps on Add add the item once', h.food.shopping.length === n1 + 1 && h.food.shopping.filter(x => /honey/.test(x.name)).length === 1 && h.food.shopping.find(x => /honey/.test(x.name)).amount === 1, h.food.shopping.filter(x => /honey/.test(x.name)));
  await nav('health/food/want/mdb-91003'); await waitFor(`!!document.querySelector('[data-action=h-want-add]')`);
  const n2 = (await H()).food.shopping.length;
  await ev(`(() => { const b = document.querySelector('[data-action=h-want-add]'); b.click(); b.click(); b.click(); })()`); await sleep(300);
  h = await H();
  const coco = h.food.shopping.filter(x => /coconut milk/i.test(x.name));
  check('three quick taps on "Add to my shopping list" add each ingredient once (3 new: coconut milk; rice in cups and flour in grams don\'t match what\'s there)', h.food.shopping.length === n2 + 3 && coco.length === 1 && coco[0].amount === 400 && h.food.want.filter(x => x.recipeId === 'mdb-91003').length === 1, [h.food.shopping.length - n2, coco]);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(200); } // redraws everything (and saves) three times
  await go('health/food/shopping', 2026, 11, 2, 13);
  const h2 = await H();
  check('redraws and a reload change nothing on the list', h2.food.shopping.length === h.food.shopping.length && eq(h2.food.shopping.map(x => x.amount), h.food.shopping.map(x => x.amount)));
  await nav('health/food/recipe/' + mine.id);
  await ev(`(() => { const b = document.querySelector('[data-action=h-cook-start]'); b.click(); b.click(); })()`); await sleep(300);
  check('two quick taps on Start cooking start it once, at step 1', (await H()).food.cooking.recipeId === mine.id && (await H()).food.cooking.step === 0 && (await ev('location.hash')) === '#health/food/cook');
  await nav('health/food/recipe/mdb-91001'); await click('[data-action=h-cook-start]'); await sleep(200);
  check('starting another recipe while cooking asks first (in the page)', (await text('#dialog-title')).startsWith('Stop cooking My Pasta'));
  await answer(false);
  check('…and Keep cooking keeps your place', (await H()).food.cooking.recipeId === mine.id);

  if (STOP < 40) return finish();
  // ------------------------------------------------------------------
  console.log('\n[40] Export/import and older backups');
  await go('today', 2026, 11, 2, 13, 30);
  const exp = await exportNow();
  check('export includes Food (recipes, favourites, shopping, cooking) and every other section', exp.schemaVersion === 4 && exp.data.health.food.cooked.length === 1 && Object.keys(exp.data.health.food.recipes).length >= 3 && exp.data.health.food.shopping.length > 5 && !!exp.data.health.food.cooking && 'workout' in exp.data.health && 'study' in exp.data && 'rota' in exp.data);
  const snap = await ev(`localStorage.getItem('${KEY}')`);
  await reset(); await go('health/food', 2026, 11, 2, 14);
  await setFile(S + '/dl/myday-export-2026-11-02.json'); await sleep(200); await answer(true);
  check('import restores everything exactly', noSaves(await ev(`localStorage.getItem('${KEY}')`)) === noSaves(snap));
  check('…and Food shows it straight away (cooking to resume)', (await text('.next-card')).includes('Resume cooking'));
  const old = JSON.parse(JSON.stringify(exp)); delete old.data.health;
  fs.writeFileSync(S + '/old-export.json', JSON.stringify(old));
  await setFile(S + '/old-export.json'); await sleep(200); await answer(true);
  check('a backup from before Health imports fine (Health starts empty)', (await H()).workout.templates.length === 0 && Object.keys((await H()).food.recipes).length === 0);

  // ------------------------------------------------------------------
  console.log('\n[45] Layout');
  await setFile(S + '/dl/myday-export-2026-11-02.json'); await sleep(200); await answer(true);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const noSideways = async label => check(`phone: no sideways scrolling (${label})`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  randomQueue = [M.bake, M.curry, M.soup];
  for (const hsh of ['health/food', 'health/food/recipe/mdb-91001', 'health/food/want/mdb-91001', 'health/food/shopping', 'health/food/cook', 'health/food/prefs', 'health/food/new', 'health/food/search']) {
    await go(hsh, 2026, 11, 2, 15);
    await sleep(200);
    await noSideways(hsh);
  }
  await go('health/food/shopping', 2026, 11, 2, 15);
  check('phone: every button, link and tick box is easy to tap (44 px or more)', await ev(`[...document.querySelectorAll('#app button, #app a.btn-link, #app .shop-check')].every(b => b.getBoundingClientRect().height >= 44)`), await ev(`[...document.querySelectorAll('#app button, #app a.btn-link, #app .shop-check')].filter(b => b.getBoundingClientRect().height < 44).map(b => b.textContent.trim()).slice(0, 5)`));
  await go('health/food/cook', 2026, 11, 2, 15);
  check('phone: Previous and Next are large (64 px tall)', await ev(`[...document.querySelectorAll('.cook-nav button')].every(b => b.getBoundingClientRect().height >= 64)`));
  await T.send('Emulation.clearDeviceMetricsOverride');

  // ------------------------------------------------------------------
  console.log('\n[46] Themes');
  for (const theme of ['light', 'auto', 'dark']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    randomQueue = [M.bake, M.curry, M.soup];
    await go('health/food/cook', 2026, 11, 2, 15);
    const a = [await contrastOf('#cookStep'), await contrastOf('.step-num'), await contrastOf('[data-action=h-cook-step][data-d="1"], [data-action=h-cook-finish]')];
    await go('health/food/shopping', 2026, 11, 2, 15);
    a.push(await contrastOf('.shop-row strong'), await contrastOf('.shop-qty'), await contrastOf('.shop-row .meta'));
    await go('health/food/recipe/mdb-91001', 2026, 11, 2, 15);
    a.push(await contrastOf('.ing-qty'), await contrastOf('[data-action=h-cook-start]'), await contrastOf('[data-action=h-fav]'));
    check(`theme "${theme}": cooking, shopping and recipe text readable (4.5:1 or more)`, (await ev('document.documentElement.dataset.theme')) === theme && a.every(x => x >= 4.5), a.map(x => Math.round(x * 10) / 10));
  }

  // ------------------------------------------------------------------
  console.log('\n[47] Earlier sections still work');
  await go('today', 2026, 11, 2, 9);
  check('Today opens (energy and Build my day)', await exists('#energy'));
  await nav('calendar'); check('Calendar opens', await exists('.cal-grid'));
  await nav('study'); check('Study opens', (await text('#app')).length > 0 && !(await exists('#dialog-title')));
  await nav('health/workout'); check('Workout opens', (await text('#app')).includes('Your workouts'));

  // ------------------------------------------------------------------
  console.log('\n[48] Same data, same results as the current MyDay');
  const bakeR = { id: 'mdb-91001', source: 'themealdb', title: 'Test Pasta Bake', sourceUrl: 'https://example.com/r91001', sourceName: '', mealDbUrl: 'https://www.themealdb.com/meal/91001', video: '', thumb: 'https://www.themealdb.com/images/media/meals/x91001.jpg', category: 'Pasta', area: 'Italian', tags: ['Test'], ingredients: [{ name: 'Pasta', measure: '200g' }, { name: 'Olive Oil', measure: '1 tbsp' }, { name: 'Salt', measure: 'pinch' }, { name: 'Eggs', measure: '2 large' }, { name: 'Milk', measure: '1 cup' }], instructions: M.bake.strInstructions, servings: 4, servingsSource: 'user', prepMin: null, cookMin: null, effort: null, batch: null, nutrition: null, nutritionSource: null, savedAt: '2026-11-01T10:00' };
  const ownR = { id: 'rOwn', source: 'manual', title: 'Own Soup', sourceUrl: 'javascript:alert(1)', sourceName: 'Gran', mealDbUrl: '', video: '', thumb: 'http://not-https.example/x.jpg', category: '', area: '', tags: ['a', 7], ingredients: [{ name: 'Lentils', measure: '250 g' }, { name: '', measure: '1' }, { name: 'Stock', measure: '1 l' }, { name: 'Onion', measure: '1-2' }], instructions: 'Fry onion.\nAdd lentils for 20 minutes.', servings: 2, servingsSource: 'recipe', prepMin: 10, cookMin: 9999, effort: 'tricky', batch: true, nutrition: { kcal: 400, protein: 'lots', carbs: null, fat: 12 }, nutritionSource: 'user', savedAt: '2026-10-20T09:00', futureRecipeField: 1 };
  const mf = { prefs: { exclude: ['pork', 'nonsense'], dislikes: ['Olives', '', 'COriander'], maxMinutes: 9000, batchOnly: 'yes' },
    recipes: { 'mdb-91001': bakeR, rOwn: ownR, bad: { id: 'bad' }, mismatch: Object.assign({}, ownR, { id: 'other' }) },
    favourites: ['mdb-91001', 'gone', 'mdb-91001', 'rOwn'], want: [{ id: 'w1', recipeId: 'rOwn', servings: 4, addedOn: '2026-11-01' }, { id: 'w2', recipeId: 'gone' }, { recipeId: 'mdb-91001', servings: 999 }],
    cooked: [{ id: 'c1', recipeId: 'mdb-91001', title: 'Test Pasta Bake', date: '2026-10-30', servings: 4 }, { recipeId: 'x', date: 'soon' }],
    shopping: [{ id: 's1', name: 'Pasta', family: 'g', amount: 800, unit: '', text: '', category: 'Cupboard', checked: false, recipes: ['Test Pasta Bake'], manual: false },
      { id: 's2', name: 'Lemons', family: 'count', amount: 3, unit: 'xx', text: '', category: 'Nope', checked: true, recipes: [], manual: true },
      { id: 's3', name: 'Salt', family: 'weird', amount: 1, text: 'pinch', category: 'Herbs & spices', checked: false, recipes: [], manual: false }, { name: '' }, 'nope'],
    cooking: { recipeId: 'rOwn', step: 1, servings: 4, startedAt: '2026-11-02T08:00', timer: { label: '20 minutes', durationSec: 1200, startedAt: null, accumulatedMs: 300000, finished: false } }, futureFoodField: 'x' };
  const seedIds = new Set(JSON.stringify(mf).match(/"id":"[^"]*"/g).map(x => x.slice(6, -1)));
  const maskNew = o => JSON.stringify(o, (k, v) => (k === 'id' && typeof v === 'string' && !seedIds.has(v) ? 'NEW' : k === 'addedOn' && v === '2026-11-02' ? 'TODAY' : v));
  async function seedAndSave(url) {
    await go('today', 2026, 11, 2, 9, 0, url); await reset(); await go('today', 2026, 11, 2, 9, 0, url);
    await editStorage(`s => { s.health = { workout: { templates: [] }, food: ${JSON.stringify(mf)} }; }`);
    await go('today', 2026, 11, 2, 9, 0, url);
    for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); } // three saves; the theme ends where it began
    return (await D()).health.food;
  }
  const liveF = await seedAndSave('index.html'), newF = await seedAndSave(APP);
  check('Food is saved exactly as the current MyDay saves it (same records kept, same bad ones dropped)', maskNew(liveF) === maskNew(newF), [maskNew(liveF).slice(0, 300), maskNew(newF).slice(0, 300)]);
  T.setUrl('index.html#health/food/cook'); await openAt(2026, 11, 2, 12);
  check('the current MyDay opens the Food data the new app saved (cooking resumes on step 2)', (await text('.cook-view .eyebrow')) === 'Step 2 of 2' && (await text('#cookStep')).includes('Add lentils'));
  async function screensIn(url) {
    const out = {};
    await go('today', 2026, 11, 2, 9, 0, url); await reset(); await go('today', 2026, 11, 2, 9, 0, url);
    await editStorage(`s => { s.health = { workout: { templates: [] }, food: ${JSON.stringify(mf)} }; }`);
    await go('today', 2026, 11, 2, 9, 0, url);
    out.todayCard = flat(await text('#slot-health'));
    mdbMode = 'fail'; // ideas aren't compared (they're random); everything else works without TheMealDB
    await go('health/food/recipe/rOwn', 2026, 11, 2, 9, 0, url);
    out.ownIngredients = (await texts('.ing-list li')).map(flat);
    out.ownSteps = await texts('ol.steps li');
    for (let i = 0; i < 2; i++) { await click('[data-action=h-serv][data-d="1"]'); await sleep(60); }
    out.ownScaled = (await texts('.ing-list li')).map(flat);
    await go('health/food/recipe/mdb-91001', 2026, 11, 2, 9, 0, url);
    for (let i = 0; i < 3; i++) { await click('[data-action=h-serv][data-d="-1"]'); await sleep(60); }
    out.bakeScaled = (await texts('.ing-list li')).map(flat);
    await go('health/food/shopping', 2026, 11, 2, 9, 0, url);
    out.shopping = (await texts('.shop-row strong, .shop-qty')).map(flat);
    out.aisles = (await texts('#app section h3')).map(flat);
    await go('health/food/want/rOwn', 2026, 11, 2, 9, 0, url);
    await click('[data-h=want-have][data-i="0"]'); await sleep(80);
    out.wantButton = flat(await text('[data-action=h-want-add]'));
    await click('[data-action=h-want-add]'); await sleep(300);
    out.afterWant = (await H()).food.shopping.map(x => [x.name, x.family, x.amount, x.unit, x.text, x.category, x.checked, x.recipes]);
    await go('health/food/cook', 2026, 11, 2, 9, 0, url);
    out.cook = [await text('.cook-view .eyebrow'), await text('#cookStep'), await text('#cookTime')];
    mdbMode = 'ok';
    return out;
  }
  const liveS = await screensIn('index.html'), newS = await screensIn(APP);
  for (const k of Object.keys(liveS)) check(`${k}: the same as the current MyDay`, eq(liveS[k], newS[k]), [liveS[k], newS[k]]);

  finish();
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
