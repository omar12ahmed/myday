// Study topics in the new app: your roadmap shown as one topic (nothing saved until you add one), adding a topic
// (your roadmap becomes the first, its contents untouched), adding a course (and, if you leave it ticked, to your
// Learning list so Today can suggest it), switching, renaming, moving and removing topics, moving a stage within
// its topic, a stage without a topic, the current MyDay keeping topics when it saves, layout, and Study's home page
// (your topics as cards) and each topic's own page.
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, check, sleep } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
// Waits until what a check means to be true is there (up to ms): under load a screen, or the guided subjects it loads
// on demand, can arrive a moment after the page has opened.
const until = async (js, ms = 20000) => { const t0 = Date.now(); for (;;) { let v = false; try { v = await ev(js); } catch { /* still arriving */ } if (v) return true; if (Date.now() - t0 > ms) return false; await sleep(100); } };
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => {
  T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi);
  // Study home: its topic cards, or its first-use tile, and the guided subject's entry (loaded on demand) have arrived.
  if (hash === 'study') await until(`!!document.querySelector('#studyHome') && (!!document.querySelector('#studyHome .topic-card') || !!document.querySelector('#studyHome [data-s="setup-tile"]')) && (!!document.querySelector('.cyber-entry') || !!document.querySelector('#stFocus') || !document.querySelector('#studyHome [data-cyber-saved-courses]'))`);
  if (hash.startsWith('study/topic/') && !hash.endsWith('/nope')) await until(`!!document.querySelector('#topic-h')`);
};
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

  console.log('\n[10] Study\'s home page: your topics, and each topic\'s page');
  const task = (id, title, done) => ({ id, title, minutes: 20, url: '', kind: 'learn', note: '', done, doneOn: done ? '2026-10-10' : null });
  const course = (id, title, tasks) => ({ id, title, url: '', minutes: 20, listId: null, archived: false, modules: [{ id: 'm' + id, title: 'Module 1', sections: [{ id: 's' + id, title: 'Section 1', tasks }] }] });
  await go('today', 2026, 10, 15, 13); await reset(); await go('today', 2026, 10, 15, 13);
  await click('#themeBtn'); await sleep(250);
  await editStorage(`s => { s.study.topics = [{ id: 'tpCy', title: 'Cybersecurity' }, { id: 'tpAr', title: 'Arabic' }, { id: 'tpBiz', title: 'Business' }];
    s.study.stages = [{ id: 'g1', title: 'Foundations', topicId: 'tpCy', courses: [${JSON.stringify(course('coC', 'TryHackMe', [task('t1', 'How the web works', true), task('t2', 'Linux 1', false)]))}] },
      { id: 'g2', title: 'Start here', topicId: 'tpAr', courses: [${JSON.stringify(course('coA', 'Madinah Arabic book 1', [task('a1', 'Lesson 1', true), task('a2', 'Lesson 2', false), task('a3', 'Lesson 3', false)]))},
        ${JSON.stringify(course('coB', 'Alphabet app', [task('b1', 'Letters 1', false)]))}] },
      { id: 'g3', title: 'Start here', topicId: 'tpBiz', courses: [] }];
    s.study.focusCourseId = 'coC'; s.study.settings.primarySubject = 'roadmap'; // your focus: your own courses
    s.study.sessions = [{ id: 'ss1', courseId: 'coA', taskId: 'a1', title: 'x', date: '2026-10-12', startedAt: '2026-10-12T19:00', plannedMin: 20, short: false, status: 'done', runningSince: null, activeMs: 1200000, endedAt: '2026-10-12T19:20', checkin: null, taskDone: true, todayUid: null }]; }`);
  await go('study', 2026, 10, 15, 13, 5);
  const savedBefore = await ev(`localStorage.getItem('${KEY}')`);
  const cards = () => ev(`[...document.querySelectorAll('#studyHome .topic-card')].map(a => ({ t: a.querySelector('.topic-title').textContent, focus: !!a.querySelector('[data-s=topic-focus]'), next: a.querySelector('[data-s=topic-next]').textContent, comp: a.querySelector('[data-s=topic-comp]')?.textContent ?? null, last: a.querySelector('[data-s=topic-last]')?.textContent ?? null, href: a.getAttribute('href') }))`);
  let cs = await cards();
  check('the home page: your focus, with its topic ("Your focus · Cybersecurity")', (await text('#stFocus .eyebrow')) === 'Your focus · Cybersecurity' && (await text('#stFocus')).includes('Linux 1'));
  check('…then the other topics as cards, in order, each opening its page', eq(cs.map(c => c.t), ['Arabic', 'Business']) && eq(cs.map(c => c.href), ['#study/topic/tpAr', '#study/topic/tpBiz']), cs);
  check('…each with its next step, progress and when you last studied it', cs.find(c => c.t === 'Arabic')?.next === 'Next: Lesson 2 · Madinah Arabic book 1' && cs.find(c => c.t === 'Arabic')?.comp === '1 of 4 tasks · 2 courses' && cs.find(c => c.t === 'Arabic')?.last === 'Studied 3 days ago' && !cs.some(c => c.focus), cs);
  check('…a topic with no courses says so, simply', cs.find(c => c.t === 'Business')?.next === 'No courses yet — add the first one.' && cs.find(c => c.t === 'Business')?.comp === null && cs.find(c => c.t === 'Business')?.last === null);
  check('Cybersecurity has one guided entry with the original saved courses and their progress inside it', await ev(`document.querySelectorAll('.cyber-entry').length === 1 && document.querySelectorAll('a[href="#study/cybersecurity"]').length === 1 && document.querySelector('.cyber-entry [data-cyber-saved-courses="tpCy"]')?.getAttribute('href') === '#study/topic/tpCy'`) && (await text('.cyber-entry [data-cyber-saved-courses="tpCy"]')).includes('1 of 2 tasks · 1 course'));
  check('…and "+ Add a topic" at the end', await exists('#studyHome [data-action=topic-add]'));
  await click('.cyber-entry [data-cyber-saved-courses="tpCy"]'); await sleep(300);
  check('the saved Cybersecurity link opens its original topic, with its course, next task, progress and study date', (await ev('location.hash')) === '#study/topic/tpCy' && (await text('#topic-h')) === 'Cybersecurity' && (await text('#topicHead [data-s=topic-comp]')) === '1 of 2 tasks marked complete' && (await text('#topicHead [data-s=topic-last]')) === 'Not studied yet · 1 course' && (await text('#topicCourses')).includes('TryHackMe') && (await text('#topicNext .st-next')) === 'Linux 1');
  await go('study', 2026, 10, 15, 13, 5);
  await click('#studyHome .topic-card[data-id=tpAr]'); await sleep(300);
  check('a topic\'s page: its name, progress and when you last studied it', (await ev('location.hash')) === '#study/topic/tpAr' && (await text('#topic-h')) === 'Arabic' && (await text('#topicHead [data-s=topic-comp]')) === '1 of 4 tasks marked complete' && (await text('#topicHead [data-s=topic-last]')) === 'Studied 3 days ago · 2 courses');
  check('…what\'s up next in it, ready to start', (await text('#topicNext .eyebrow')) === 'Up next in Arabic' && (await text('#topicNext')).includes('Madinah Arabic book 1') && (await text('#topicNext .st-next')) === 'Lesson 2' && (await exists('#topicNext [data-action=s-start]')));
  check('…its courses, with "Focus on this"', eq(await ev(`[...document.querySelectorAll('#topicCourses .tc-row a > span:first-child')].map(s => s.textContent)`), ['Madinah Arabic book 1', 'Alphabet app']) && (await ev(`document.querySelectorAll('#topicCourses [data-action=s-focus]').length`)) === 2);
  check('…and looking around saves nothing', (await ev(`localStorage.getItem('${KEY}')`)) === savedBefore);
  await click('#topicNext [data-action=s-start]:not([data-short])'); await sleep(300);
  let sd = await study();
  check('"Start learning" there starts a session on that topic\'s course', (await ev('location.hash')) === '#study/session' && sd.sessions.some(x => x.status === 'active' && x.courseId === 'coA' && x.taskId === 'a2'));
  await editStorage(`s => { s.study.sessions = s.study.sessions.filter(x => x.status !== 'active'); s.study.activeId = null; }`);
  await go('study/topic/tpAr', 2026, 10, 15, 13, 10);
  await click('#topicNext [data-action=s-focus]'); await sleep(300);
  check('"Make this my focus" → it\'s on the home page, with its topic', (await study()).focusCourseId === 'coA' && (await ev('location.hash')) === '#study' && (await text('#stFocus .eyebrow')) === 'Your focus · Arabic' && (await cards()).find(c => c.t === 'Arabic')?.focus);
  await go('study/course/coB', 2026, 10, 15, 13, 15);
  check('a course\'s page goes back to its topic', (await ev(`document.querySelector('#app a[href="#study/topic/tpAr"]')?.textContent || ''`)).includes('Arabic'));
  await go('study/topic/tpBiz', 2026, 10, 15, 13, 20);
  check('a topic with no courses: "Add the first course" opens the roadmap on that topic', (await text('#topicNext h2')) === 'No courses in Business yet' && (await ev(`document.querySelector('[data-action=topic-first-course]').getAttribute('href')`)) === '#study/roadmap/tpBiz');
  await click('[data-action=topic-first-course]'); await sleep(300);
  check('…the roadmap shows Business', (await chips()).includes('Business ✓'));
  await go('study/topic/nope', 2026, 10, 15, 13, 25);
  check('a topic that isn\'t there says so, kindly', (await text('#app')).includes("This topic isn't here"));
  await go('study', 2026, 10, 15, 13, 30);
  await click('#studyHome [data-action=topic-add]'); await sleep(150);
  await type('#topicNew', 'Spanish'); await click('#studyHome [data-action=topic-save]'); await sleep(300);
  sd = await study();
  const spanish = sd.topics.find(t => t.title === 'Spanish');
  check('"+ Add a topic" on the home page adds it and opens its page', spanish && (await ev('location.hash')) === `#study/topic/${spanish.id}` && (await text('#topicNext h2')) === 'No courses in Spanish yet');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const h of ['study', 'study/topic/tpAr']) {
    await go(h, 2026, 10, 15, 14);
    check(`phone, #${h}: nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
    const tiny = await ev(`[...document.querySelectorAll('#app button, #app .topic-card, #app .tc-row a, .cyber-entry a')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 24), h: r.height }; }).filter(x => x.h < 44)`);
    check(`phone, #${h}: every card, row and button is at least 44 px high`, tiny.length === 0, tiny.slice(0, 5));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[11] One Cybersecurity entry, with existing courses kept accessible');
  const cyberEntries = () => ev(`({ guided: document.querySelectorAll('.cyber-entry').length, links: document.querySelectorAll('a[href="#study/cybersecurity"]').length, generic: [...document.querySelectorAll('#studyHome .topic-card .topic-title')].filter(e => e.textContent.trim().toLowerCase() === 'cybersecurity').length })`);
  await go('today', 2026, 10, 15, 15); await reset(); await go('study', 2026, 10, 15, 15);
  check('an empty Study has exactly one Cybersecurity entry, opening the guided path', eq(await cyberEntries(), { guided: 1, links: 1, generic: 0 }) && (await text('.cyber-entry')).includes('27 modules') && (await text('.cyber-entry')).includes('146 lessons'), await cyberEntries());
  check('an empty Study has no saved-courses link yet', !(await exists('.cyber-entry [data-cyber-saved-courses]')));
  const emptyBefore = await ev(`localStorage.getItem('${KEY}')`);
  await click('.cyber-entry a[href="#study/cybersecurity"]'); await sleep(400);
  check('the single entry opens the actual guided curriculum', (await ev('location.hash')) === '#study/cybersecurity' && (await text('.cyber-workshop')).includes('Cybersecurity workshop') && (await exists('[data-action=cyber-import]')));
  check('reading the guided path from empty Study writes no saved learning data', (await ev(`localStorage.getItem('${KEY}')`)) === emptyBefore);

  await go('today', 2026, 10, 15, 15, 5); await click('#themeBtn'); await sleep(250);
  await editStorage(SEED);
  const unnamedBefore = await ev(`localStorage.getItem('${KEY}')`);
  await go('study', 2026, 10, 15, 15, 5);
  check('an unnamed starter roadmap has one Cybersecurity entry and its original main-topic saved link', eq(await cyberEntries(), { guided: 1, links: 1, generic: 0 }) && await ev(`document.querySelector('.cyber-entry [data-cyber-saved-courses="main"]')?.getAttribute('href') === '#study/topic/main'`) && (await text('.cyber-entry [data-cyber-saved-courses="main"]')).includes('1 of 1 tasks · 1 course'), await cyberEntries());
  await click('.cyber-entry [data-cyber-saved-courses="main"]'); await sleep(300);
  check('the unnamed saved link keeps the original course and its completed task', (await ev('location.hash')) === '#study/topic/main' && (await text('#topic-h')) === 'Cybersecurity' && (await text('#topicHead [data-s=topic-comp]')) === '1 of 1 task marked complete' && (await text('#topicCourses')).includes('TryHackMe: Pre-Security path'), await text('#topicHead'));
  await click('#topicCourses a[href="#study/course/co1"]'); await sleep(300);
  check('the unnamed saved course opens normally, keeping its name and completion', (await ev('location.hash')) === '#study/course/co1' && (await text('#co-h')) === 'TryHackMe: Pre-Security path' && (await text('#app')).includes('1 of 1 task marked complete'), await text('#co-h'));
  await go('study/roadmap/main', 2026, 10, 15, 15, 5);
  check('the unnamed saved roadmap still contains the checked original Intro task', await ev(`document.querySelector('[data-s="task-done"][data-id="tk1"]')?.checked === true`) && (await text('[data-node="md1"]')).includes('Intro'));
  await go('study', 2026, 10, 15, 15, 5);
  check('reading and navigating the unnamed roadmap leaves its saved bytes and lack of topics unchanged', (await ev(`localStorage.getItem('${KEY}')`)) === unnamedBefore && (await study()).topics === undefined);

  await editStorage(`s => { s.study.topics = [{ id: 'tpCase', title: '  cYbErSeCuRiTy  ' }, { id: 'tpOther', title: 'Field notes' }];
    s.study.stages.forEach(sg => { sg.topicId = 'tpCase'; });
    s.study.stages.push({ id: 'sgOther', title: 'Start here', topicId: 'tpOther', courses: [] }); }`);
  const namedBefore = await ev(`localStorage.getItem('${KEY}')`);
  await go('study', 2026, 10, 15, 15, 10);
  check('case and surrounding whitespace still give one Cybersecurity entry with the original named-topic link', eq(await cyberEntries(), { guided: 1, links: 1, generic: 0 }) && await ev(`document.querySelector('.cyber-entry [data-cyber-saved-courses="tpCase"]')?.getAttribute('href') === '#study/topic/tpCase'`) && (await text('.cyber-entry [data-cyber-saved-courses="tpCase"]')).includes('1 of 1 tasks · 1 course'), await cyberEntries());
  check('consolidating Cybersecurity keeps an unrelated saved subject visible with its own link', eq((await cards()).map(c => [c.t, c.href]), [['Field notes', '#study/topic/tpOther']]));
  await click('.cyber-entry [data-cyber-saved-courses="tpCase"]'); await sleep(300);
  check('the case-insensitive saved link opens the existing named course and completion', (await ev('location.hash')) === '#study/topic/tpCase' && (await text('#topic-h')).trim().toLowerCase() === 'cybersecurity' && (await text('#topicHead [data-s=topic-comp]')) === '1 of 1 task marked complete' && (await text('#topicCourses')).includes('TryHackMe: Pre-Security path'), await text('#topicHead'));
  await go('study/roadmap/tpCase', 2026, 10, 15, 15, 10);
  check('the saved completed task is still checked in the original named roadmap', await ev(`document.querySelector('[data-s="task-done"][data-id="tk1"]')?.checked === true`));
  await go('study', 2026, 10, 15, 15, 10);
  check('reading the named roadmap keeps every saved byte, including its original topic name', (await ev(`localStorage.getItem('${KEY}')`)) === namedBefore);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go('study', 2026, 10, 15, 15, 10);
  const savedTargets = await ev(`[...document.querySelectorAll('.cyber-entry [data-cyber-saved-courses]')].map(a => ({ title: a.textContent.trim(), height: a.getBoundingClientRect().height, width: a.getBoundingClientRect().width }))`);
  check('phone: the consolidated entry and its saved courses fit without sideways scrolling', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  check('phone: the saved-courses link is present and at least 44 pixels high', savedTargets.length === 1 && savedTargets.every(a => a.height >= 44 && a.width > 0), savedTargets);
  await T.send('Emulation.clearDeviceMetricsOverride');

  await editStorage(`s => { s.study.stages.find(sg => sg.id === 'sg1').courses[0].archived = true; }`);
  const archivedBefore = await ev(`localStorage.getItem('${KEY}')`);
  await go('study', 2026, 10, 15, 15, 15);
  check('an archived-only Cybersecurity roadmap still has one entry and counts its saved course as set aside', eq(await cyberEntries(), { guided: 1, links: 1, generic: 0 }) && (await text('.cyber-entry [data-cyber-saved-courses="tpCase"]')).includes('1 course (1 set aside)'), await text('.cyber-entry [data-cyber-saved-courses="tpCase"]'));
  await click('.cyber-entry [data-cyber-saved-courses="tpCase"]'); await sleep(300);
  check('the archived-only saved topic keeps its existing roadmap link available', (await ev('location.hash')) === '#study/topic/tpCase' && await exists('a[href="#study/roadmap/tpCase"]'));
  await click('a[href="#study/roadmap/tpCase"]'); await sleep(300);
  check('the archived course and its checked task remain reachable in the original roadmap', (await ev('location.hash')) === '#study/roadmap/tpCase' && (await text('[data-node="co1"]')).includes('TryHackMe: Pre-Security path') && (await text('[data-node="co1"]')).includes('Archived') && await ev(`document.querySelector('[data-s="task-done"][data-id="tk1"]')?.checked === true`));
  check('reading the archived course through the saved link leaves every saved byte unchanged', (await ev(`localStorage.getItem('${KEY}')`)) === archivedBefore);

  await go('today', 2026, 10, 15, 16); await reset(); await go('study', 2026, 10, 15, 16);
  await click('.cyber-entry a[href="#study/cybersecurity"]'); await sleep(400);
  await click('[data-action=cyber-import]'); await sleep(300);
  const importedStudy = await study(), importedTopic = importedStudy.topics.find(t => t.title === 'Cybersecurity');
  const importedCourses = importedStudy.stages.flatMap(sg => sg.courses);
  check('importing the guided path creates its real saved courses', importedTopic && importedCourses.length === 14 && importedCourses.every(c => c.id.startsWith('cyber:1:module.')) && importedCourses.some(c => c.modules.some(m => m.sections.some(s => s.tasks.some(t => t.id === 'cyber:1:lesson.learning-evidence')))));
  const importedBefore = await ev(`localStorage.getItem('${KEY}')`);
  for (let reload = 0; reload < 2; reload++) {
    await go('study', 2026, 10, 15, 16);
    check(`the imported path still has one Cybersecurity entry after ${reload ? 'a further reload' : 'returning to Study'}`, eq(await cyberEntries(), { guided: 1, links: 1, generic: 0 }) && await ev(`document.querySelector('.cyber-entry [data-cyber-saved-courses]')?.getAttribute('href') === ${JSON.stringify('#study/topic/' + importedTopic?.id)}`), await cyberEntries());
  }
  await click('.cyber-entry [data-cyber-saved-courses]'); await sleep(300);
  check('the imported saved-courses link opens every course from the chosen path', (await ev('location.hash')) === '#study/topic/' + importedTopic?.id && (await ev(`document.querySelectorAll('#topicCourses .tc-row').length`)) === 14 && (await text('#topicCourses')).includes(importedCourses[0].title));
  check('returning, reloading and reading the imported courses writes no additional learning data', (await ev(`localStorage.getItem('${KEY}')`)) === importedBefore);

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
