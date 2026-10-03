// Study topics in the new app: your roadmap shown as one topic (nothing saved until you add one), adding a topic
// (your roadmap becomes the first, its contents untouched), adding a course (and, if you leave it ticked, to your
// Learning list so Today can suggest it), switching, renaming, moving and removing topics, moving a stage within
// its topic, a stage without a topic, the current MyDay keeping topics when it saves, and layout.
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, check, sleep } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const answer = async yes => { await sleep(150); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(250); };
const dialogText = async () => { await sleep(250); return ev(`(document.querySelector('[data-action=dialog-confirm]')?.closest('dialog') || document.body).textContent`); };
const study = async () => (await data()).study;
const chips = () => ev(`[...document.querySelectorAll('[data-s=topic]')].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? ' ✓' : ''))`);
const stagesShown = () => ev(`[...document.querySelectorAll('[data-stage]')].map(c => c.querySelector('h2')?.textContent || c.querySelector('[data-s=title]')?.value)`);

const TASK = { id: 'tk1', title: 'Read the intro', minutes: 20, url: '', kind: 'learn', note: '', done: true, doneOn: '2026-10-10' };
const SEED = `s => {
  s.lists.learning = [{ id: 'l1', title: 'TryHackMe: Pre-Security path — one section', minutes: 30 }];
  s.study.stages = [
    { id: 'sg1', title: 'Foundations', courses: [{ id: 'co1', title: 'TryHackMe: Pre-Security path', url: '', minutes: 30, listId: 'l1', archived: false,
      modules: [{ id: 'md1', title: 'Intro', sections: [{ id: 'sc1', title: 'Basics', tasks: [${JSON.stringify(TASK)}] }] }] }] },
    { id: 'sg2', title: 'Web', courses: [] },
  ];
}`;

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] Your roadmap is one topic, until you add another');
  await go('today', 2026, 10, 15); await reset(); await go('today', 2026, 10, 15);
  await click('#themeBtn'); await sleep(250); // a first save, so there's saved data to edit
  await editStorage(SEED);
  await go('study/roadmap', 2026, 10, 15, 9, 1);
  check('the roadmap shows its topic ("Cybersecurity", from the starter stages) and "Add a topic" — without Edit', eq(await chips(), ['Cybersecurity ✓']) && (await exists('[data-action=topic-add]')) && !(await exists('#topicEdit')));
  check('…with both stages, as before', eq(await stagesShown(), ['Foundations', 'Web']));
  check('nothing about topics is saved until you add one', (await study()).topics === undefined && (await study()).stages.every(sg => !('topicId' in sg)));
  const before = (await study()).stages;

  console.log('\n[2] Adding a topic');
  await click('[data-action=topic-add]'); await sleep(150);
  await type('#topicNew', 'Spanish'); await click('[data-action=topic-save]'); await sleep(300);
  let st = await study();
  const [t1, t2] = st.topics || [];
  check('two topics: your roadmap as "Cybersecurity", then "Spanish"', st.topics.length === 2 && t1.title === 'Cybersecurity' && t2.title === 'Spanish');
  check('…your stages are tagged with the first topic, and their contents are exactly as they were', st.stages.slice(0, 2).every(sg => sg.topicId === t1.id) && eq(st.stages.slice(0, 2).map(({ topicId, ...rest }) => rest), before));
  check('…the new topic has a first stage, "Start here", and is shown', st.stages[2].title === 'Start here' && st.stages[2].topicId === t2.id && eq(await chips(), ['Cybersecurity', 'Spanish ✓']) && eq(await stagesShown(), ['Start here']));
  check('…where a course can be added straight away (no Edit needed)', (await exists(`[data-action=s-add][data-level=course][data-parent="${st.stages[2].id}"]`)) && (await text('#app')).includes('No courses in this stage yet'));
  await click('[data-action=topic-add]'); await sleep(150);
  await type('#topicNew', 'spanish'); await click('[data-action=topic-save]'); await sleep(250);
  check('the same name twice is refused', (await study()).topics.length === 2 && (await text('#toast')).includes('already used'));
  await click('[data-action=topic-cancel]'); await sleep(100);

  console.log('\n[3] Adding a course, suggested on Today (or not)');
  const start = st.stages[2].id;
  await click(`[data-action=s-add][data-level=course][data-parent="${start}"]`); await sleep(150);
  check('"Add a course" asks for its name, a usual session, and whether to suggest it on Today (ticked)', (await exists(`#cf-${start}-t`)) && (await ev(`document.querySelector('[data-s=course-suggest]').checked`)) === true);
  await type(`#cf-${start}-t`, 'Duolingo Spanish'); await type(`#cf-${start}-m`, '15');
  await click('[data-action=course-save]'); await sleep(300);
  let d = await data();
  const c1 = d.study.stages.find(s => s.id === start).courses[0];
  const li = d.lists.learning.find(x => x.id === c1.listId);
  check('the course is added, and to the end of your Learning list ("… — one section"), linked to it', c1.title === 'Duolingo Spanish' && c1.minutes === 15 && li && li.title === 'Duolingo Spanish — one section' && li.minutes === 15 && d.lists.learning.at(-1).id === li.id);
  check('…and it says so', (await text('#toast')).includes('Learning list'));
  const learningBefore = d.lists.learning.length;
  await click('[data-action=s-edit]'); await sleep(150);
  await click(`[data-action=s-add][data-level=course][data-parent="${start}"]`); await sleep(150);
  await type(`#cf-${start}-t`, 'Evening class'); await click('[data-s=course-suggest]'); await click('[data-action=course-save]'); await sleep(300);
  d = await data();
  const c2 = d.study.stages.find(s => s.id === start).courses[1];
  check('unticked: the course is added to Study only', c2.title === 'Evening class' && c2.listId === null && d.lists.learning.length === learningBefore);

  console.log('\n[4] Switching, renaming, moving, and stages within a topic');
  await click(`[data-s=topic][data-id="${t1.id}"]`); await sleep(150);
  check('choosing Cybersecurity shows only its stages', eq(await stagesShown(), ['Foundations', 'Web']));
  await click(`[data-s=topic][data-id="${t2.id}"]`); await sleep(150);
  await type('[data-s=topic-name]', 'Español'); await sleep(200);
  check('renaming a topic (in Edit) saves it', (await study()).topics[1].title === 'Español');
  await click('[data-action=topic-move][data-d="-1"]'); await sleep(200);
  st = await study();
  check('moving it left changes the order of topics — and every stage stays in its own topic', st.topics[0].id === t2.id && st.stages.filter(s => s.topicId === t1.id).length === 2 && st.stages.filter(s => s.topicId === t2.id).length === 1);
  await click('[data-action=s-add][data-level=stage]'); await sleep(250);
  st = await study();
  const newStage = st.stages.at(-1);
  check('"Add a stage" adds it to the topic you\'re looking at', newStage.topicId === t2.id);
  await click(`[data-action=s-move][data-id="${newStage.id}"][data-d="-1"]`); await sleep(200);
  st = await study();
  const sp = st.stages.filter(s => s.topicId === t2.id).map(s => s.id), cy = st.stages.filter(s => s.topicId === t1.id).map(s => s.id);
  check('moving a stage up passes over other topics\' stages: it moves within its topic only', sp[0] === newStage.id && sp[1] === start && eq(cy, ['sg1', 'sg2']));

  console.log('\n[5] Removing a topic asks first, and never the last one');
  await click('[data-action=topic-remove]');
  check('the question says what goes with it', /Remove “Español” and its 2 courses\?/.test(await dialogText()));
  await answer(false);
  check('"Keep it" keeps it', (await study()).topics.length === 2);
  await click('[data-action=topic-remove]'); await answer(true);
  st = await study(); d = await data();
  check('"Remove": the topic, its stages and courses go; the other topic and its contents stay exactly', st.topics.length === 1 && st.topics[0].id === t1.id && st.stages.length === 2 && eq(st.stages.map(({ topicId, ...rest }) => rest), before) && eq(await chips(), ['Cybersecurity ✓']));
  check('…its Learning list entry stays (remove it in "Your task lists" if you like)', d.lists.learning.some(x => x.id === li.id));
  check('the only topic can\'t be removed', await ev(`document.querySelector('[data-action=topic-remove]').disabled`));

  console.log('\n[6] A stage without a topic (e.g. added in the current MyDay) shows under the first');
  await editStorage(`s => { s.study.stages.push({ id: 'sgX', title: 'Added elsewhere', courses: [] }); }`);
  await go('study/roadmap', 2026, 10, 15, 10);
  check('it appears under the first topic', (await stagesShown()).includes('Added elsewhere'));

  console.log('\n[7] Naming your one roadmap makes it a topic');
  await editStorage(`s => { delete s.study.topics; for (const sg of s.study.stages) delete sg.topicId; }`);
  await go('study/roadmap', 2026, 10, 15, 10, 1);
  await click('[data-action=s-edit]'); await sleep(150);
  await type('[data-s=topic-name]', 'Security'); await sleep(250);
  st = await study();
  check('renaming it saves one topic, with every stage in it', st.topics.length === 1 && st.topics[0].title === 'Security' && st.stages.every(sg => sg.topicId === st.topics[0].id) && eq(await chips(), ['Security ✓']));

  console.log('\n[8] The current MyDay keeps topics when it saves');
  await click('[data-action=topic-add]'); await sleep(150); await type('#topicNew', 'Business'); await click('[data-action=topic-save]'); await sleep(300);
  const savedNew = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  T.setUrl('index.html#study/roadmap'); await openAt(2026, 10, 15, 11);
  check('the current MyDay shows every stage, whatever its topic', (await text('#app')).includes('Start here') && (await text('#app')).includes('Foundations'));
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); } // it saves three times
  const savedLive = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  check('…and keeps the topics and each stage\'s topic exactly', eq(savedLive.study.topics, savedNew.study.topics) && eq(savedLive.study.stages.map(s => [s.id, s.topicId]), savedNew.study.stages.map(s => [s.id, s.topicId])));
  await go('study/roadmap', 2026, 10, 15, 11, 5);
  check('…and the new app opens it with both topics', eq((await chips()).map(c => c.replace(' ✓', '')), ['Security', 'Business']));

  console.log('\n[9] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go('study/roadmap', 2026, 10, 15, 12);
  const biz = (await study()).topics[1].id;
  await click(`[data-s=topic][data-id="${biz}"]`); await sleep(150);
  const bizStage = (await study()).stages.find(s => s.topicId === biz).id;
  await click(`[data-action=s-add][data-level=course][data-parent="${bizStage}"]`); await sleep(150);
  await click('[data-action=topic-add]'); await sleep(150);
  check('phone: the topics and the course form fit (nothing scrolls sideways)', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  const small = await ev(`[...document.querySelectorAll('#studyTopics button, #studyTopics input, .course-form button, .course-form input:not([type=checkbox]), .course-form label:has(input[type=checkbox])')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id).trim().slice(0, 24), h: Math.round(r.height) }; }).filter(x => x.h < 44)`);
  check('phone: every topic button, field and tick row (what you tap) is at least 44 px high', small.length === 0, small.slice(0, 5));
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
