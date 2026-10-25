// Search everywhere, the rules (specs/search-everywhere.md; app/src/data/searchAll.ts) on the app's own code bundled for
// Node, with made-up records in every section: matching (every word, any order, capitals, accents, apostrophes, Arabic
// vowel marks and tatweel), what each section searches and where its results link, the order (open, paused, done,
// past), private projects and notes never found, the course lessons by title (made up, and the real catalogues), what's
// never searched (a lesson check's reference answers, a kept "another way" explanation), the 50 a section cap. No browser.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = path.join(os.tmpdir(), `myday-search-rules-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const src = p => JSON.stringify(path.join(ROOT, 'app/src', p));
  fs.writeFileSync(path.join(dir, 'kit.ts'), [
    `export * from ${src('data/searchAll')};`, `export { freshState } from ${src('data/normalize')};`, `export { courseIndex } from ${src('search/courseIndex')};`,
  ].join('\n'));
  const K = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);
  const TODAY = '2026-10-25', AT = '2026-10-01T09:00';
  const P = (id, title, x = {}) => ({ id, title, summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: AT, updatedAt: AT, ...x });
  const T = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: AT, postponed: 0, blockers: [], letGoOn: null, ...x });
  const N = (id, title, text, x = {}) => ({ id, title, text, categoryId: 'inbox', createdAt: AT, updatedAt: AT, ...x });
  const COURSES = {
    arabic: { modules: [{ id: 'module.ar-x', name: 'Greetings and courtesy', purpose: 'Say hello politely' }], lessons: [{ id: 'lesson.ar-x1', title: 'Saying goodbye', moduleId: 'module.ar-x' }],
      words: [{ id: 'lexeme.x-1', ar: 'مَدْرَسَة', meaning: 'school', example: 'ذَهَبْتُ إِلَى الْمَدْرَسَةِ.', exampleMeaning: 'I went to the school.', lessonId: 'lesson.ar-x1' },
        { id: 'lexeme.seed-1', ar: 'بَيْت', meaning: 'house', example: 'هَذَا بَيْتٌ.', exampleMeaning: 'This is a house.', lessonId: null }] },
    cyber: { modules: [{ id: 'module.cy-x', name: 'Networks', purpose: 'How packets travel' }], lessons: [{ id: 'lesson.cy-x1', title: 'How DNS finds a name', moduleId: 'module.cy-x' }], activities: [{ id: 'act.cy-x1', title: 'Practical task · How DNS finds a name' }] },
  };
  const world = () => {
    const d = K.freshState();
    d.tasks.lists = [{ id: 'tlH', name: 'Home jobs' }];
    d.projects.items = [
      P('pjShed', 'Garden shed', { summary: 'A wooden shed with lights wired by the electrician', milestones: [{ id: 'msS', title: 'Walls up', reached: false, aim: null }], resources: [{ id: 'rsS', url: 'https://example.com/shed', title: 'Shed kit page', note: 'Seller of the zinc roof', addedOn: '2026-10-01' }] }),
      P('pjKitchen', 'Kitchen refit', { status: 'paused', milestones: [{ id: 'msK', title: 'Electrician signs off the wiring', reached: false, aim: null }] }),
      P('pjFlat', 'Old flat', { status: 'done', decisions: [{ id: 'dcF', question: 'Which electrician to keep?', options: [], chosen: null, why: '', decidedOn: null, createdAt: AT, updatedAt: AT }] }),
      P('pjHush', 'Hush plans', { private: true, summary: 'electrician SECRETWORD', commitmentIds: ['cmHush'], tools: ['research'],
        milestones: [{ id: 'msH', title: 'SECRETWORD milestone', reached: false, aim: null }], resources: [{ id: 'rsH', url: 'https://example.com/h', title: 'SECRETWORD link', note: '', addedOn: '2026-10-01' }],
        decisions: [{ id: 'dcH', question: 'SECRETWORD choice?', options: [{ id: 'opH', text: 'SECRETWORD option', pros: [], cons: [] }], chosen: null, why: '', decidedOn: null, createdAt: AT, updatedAt: AT }] }),
    ];
    d.tasks.items = [
      T('tkRing', 'Ring the electrician', { listId: 'tlH', notes: 'His number is on the van' }),
      T('tkPaid', 'Pay the electrician', { done: true, doneOn: '2026-10-10' }),
      T('tkGone', 'Ask a second electrician', { letGoOn: '2026-10-11' }),
      T('tkShedWire', 'Wire the shed', { projectId: 'pjShed', steps: [{ id: 'ts1', text: 'Buy outdoor cable for the electrician', done: false }] }),
      T('tkWait', 'Get the safety certificate', { waiting: { on: 'Electrician Zed', since: '2026-10-01', until: null } }),
      T('tkHush', 'Hush electrician SECRETWORD', { projectId: 'pjHush' }),
    ];
    d.lists.admin = [{ id: 'aBill', title: 'Check the electrician bill', minutes: 10 }];
    d.research.items = [{ id: 'rqH', type: 'question', projectId: 'pjHush', text: 'SECRETWORD question', conclusion: '', answeredOn: null, createdAt: AT, updatedAt: AT }];
    d.notes.items = [
      N('nEl', 'Electrician', 'Dave Café — 07700 900123, Sam’s friend'), N('nShed', '', 'Shed: ask the electrician about a fused spur', { projectId: 'pjShed' }),
      N('nPriv', 'Private electrician SECRETWORD', 'x', { private: true }), N('nHush', 'Hush note', 'electrician SECRETWORD', { projectId: 'pjHush' }),
      N('nBlank', '', ''), N('nPen', 'Shopping', 'I bought a قــلم today'),
    ];
    d.commitments = [
      { id: 'cmPast', kind: 'appointment', title: 'Electrician quote', start: '2026-10-01T09:00', end: '2026-10-01T10:00' },
      { id: 'cmLater', kind: 'appointment', title: 'Electrician second fix', start: '2026-11-20T14:00', end: '2026-11-20T15:00' },
      { id: 'cmSoon', kind: 'work', title: 'Electrician first fix', start: '2026-10-27T08:30', end: '2026-10-27T12:00' },
      { id: 'cmHush', kind: 'appointment', title: 'Electrician SECRETWORD', start: '2026-10-28T08:30', end: '2026-10-28T09:00' },
    ];
    d.study.topics = [{ id: 'tpE', title: 'Electrics' }];
    d.study.stages = [{ id: 'stE', title: 'Wiring basics', topicId: 'tpE', courses: [
      { id: 'crE', title: 'Home electrics course', url: '', minutes: 0, listId: null, archived: false, modules: [{ id: 'mdE', title: 'Circuits', sections: [{ id: 'scE', title: 'Ring mains', tasks: [
        { id: 'stkE', title: 'Watch the circuits video', minutes: 20, url: '', kind: 'learn', note: 'Ask the electrician what an RCD is', done: false, doneOn: null }] }] }] },
      { id: 'cyber:1:x', title: 'Cybersecurity electrician guided course', url: '', minutes: 0, listId: null, archived: false, modules: [] },
    ] }];
    d.study.concepts = [
      { id: 'cpMine', title: 'What an RCD does', taskIds: [], createdOn: AT.slice(0, 10), kind: 'written', prompt: 'Why trip?', answer: 'It cuts power on a leak to earth', explanation: 'My own: like a referee', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null } },
      { id: 'cpAi', title: 'Ohm’s law', taskIds: [], createdOn: AT.slice(0, 10), kind: 'written', prompt: 'V equals?', answer: 'I times R', explanation: 'AIEXPLAINWORD', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null },
        origin: { lessonId: 'x', writer: 'm1', checker: 'm2', edited: false }, anotherWay: { text: 'ANOTHERWAYWORD', by: 'm1', on: AT.slice(0, 10) } },
    ];
    d.study.sessions = [{ id: 'ssE', courseId: 'crE', taskId: 'stkE', title: 'Watch the circuits video', date: '2026-10-20', startedAt: '2026-10-20T10:00', plannedMin: 20, short: false, status: 'done', runningSince: null, activeMs: 0, endedAt: '2026-10-20T10:20',
      checkin: { conceptIds: [], clarity: 'partly', takeaway: 'Earth leakage trips the RCD', question: '', note: '' }, taskDone: null, todayUid: null }];
    d.reading.books = [{ id: 'bkE', title: 'Wiring Regulations Explained', author: 'Ann Volt', pages: null, page: 0, notes: [{ id: 'bnE', page: 12, text: 'Bathrooms need zones', addedOn: AT.slice(0, 10) }], addedOn: AT.slice(0, 10), finishedOn: null }];
    d.arabic.words = [{ id: 'kwK', ar: 'كِتَاب', meaning: 'book', note: 'from the library text', from: null, keptOn: AT.slice(0, 10) }, { id: 'kwT', ar: 'قلــم', meaning: 'pen', keptOn: AT.slice(0, 10) }];
    d.arabic.lessons = [{ id: 'lesson.ar-x1', revisit: { since: '2026-10-20', what: 'mix up the goodbye forms' } }];
    d.arabic.attempts = [{ id: 'aaE', lessonId: 'lesson.ar-x1', curriculumVersion: '1', variant: 'standard', startedAt: '2026-10-21T09:00', finishedAt: null, help: 'none', practised: [], answers: { q1: 'ma3a salama means goodbye' }, revealed: [], revisit: '' }];
    d.cybersecurity.lessons = [{ id: 'lesson.cy-x1', revisit: { since: '2026-10-20', what: 'resolver caching confuses me' } }];
    d.cybersecurity.attempts = [{ id: 'caE', activityId: 'act.cy-x1', startedAt: '2026-10-22T09:00', submittedAt: null, evidence: 'dig showed the TTL', answers: {}, resumePoint: '' }];
    d.cybersecurity.portfolio = [{ id: 'pfE', attemptId: 'caE', activityId: 'act.cy-x1', title: 'Tracing a lookup', evidence: 'nslookup output', note: 'for my CV', reviewedOn: '2026-10-23' }];
    d.finance.debts = [{ id: 'dbE', direction: 'owe', person: 'Electrician Dave', amount: 120, note: 'for the spur', since: '2026-10-01' }, { id: 'dbS', direction: 'owed', person: 'Sister', amount: 20, note: 'cinema', since: '2026-10-01' }];
    d.finance.expenses = [{ id: 'exE', name: 'Electricity', amount: 80 }];
    d.health.food.recipes = { rcE: { id: 'rcE', title: 'Spiced lentil soup', sourceName: 'Mum', category: 'Soup', area: '', tags: ['batch'], ingredients: [{ name: 'red lentils', measure: '200 g' }], instructions: 'Simmer', source: 'manual' } };
    d.health.food.shopping = [{ id: 'shE', name: 'lentils', text: 'red lentils', checked: false }, { id: 'shF', name: 'lemons', text: '', checked: true }];
    d.health.workout.exercises = [{ id: 'exSq', name: 'Goblet squat', archived: false }, { id: 'exOld', name: 'Old squat', archived: true }];
    d.health.workout.templates = [{ id: 'wtA', name: 'Legs and squat day', archived: false }];
    d.health.daily.exercises = [{ id: 'deP', name: 'Wall squat', target: 50, set: 10, archived: false }];
    return d;
  };
  const S = (q, d = world(), c = COURSES) => K.searchEverywhere(d, q, c, TODAY);
  const sec = (r, s) => r.sections.find(x => x.section === s)?.items ?? [];
  const ids = (r, s) => sec(r, s).map(f => f.id);
  const all = r => r.sections.flatMap(s => s.items);

  console.log('\n[1] Matching');
  check('nothing typed (or only spaces) finds nothing', S('').total === 0 && S('   ').sections.length === 0);
  check('every word must be there, in any order, whatever the capitals', eq(ids(S('ELECTRICIAN ring'), 'tasks'), ['tkRing']) && ids(S('ring zebra'), 'tasks').length === 0);
  check('accents and the kind of apostrophe don\'t matter ("cafe" finds "Café", "sam\'s" finds "Sam’s")', eq(ids(S('cafe'), 'notes'), ['nEl']) && eq(ids(S("sam's"), 'notes'), ['nEl']));
  check('Arabic: vowel marks and tatweel don\'t matter (كتاب finds كِتَاب, قلم finds قلــم)', eq(ids(S('كتاب'), 'study'), ['kwK']) && eq(ids(S('قلم'), 'study'), ['kwT']));
  check('MyDay\'s own labels aren\'t searched: an empty note shows as "Untitled note" but isn\'t found by it; "note" doesn\'t find a note', S('untitled note').total === 0 && !all(S('note')).some(f => f.id === 'nShed') && sec(S('shopping'), 'notes').length === 1);
  check('a match in its name has no excerpt; one in its text shows the words there, tatweel and all', sec(S('electrician'), 'notes').find(f => f.id === 'nEl')?.excerpt === '' && sec(S('قلم'), 'notes')[0]?.excerpt.includes('قــلم'), sec(S('قلم'), 'notes'));
  check('…and a project\'s own words are found with tatweel too (the shared matching leaves it out)', (() => { const d = world(); d.projects.items[0].summary = 'A قـلم for the shed'; return sec(S('قلم', d), 'projects').some(f => f.title === 'Garden shed'); })());
  check('the heading counts what was found', K.foundCount(3, ' lentils ') === '3 matches for “lentils”' && K.foundCount(1, 'x') === '1 match for “x”' && K.foundCount(0, 'x') === 'Nothing in MyDay matches “x”');

  console.log('\n[2] Tasks');
  const el = S('electrician'), tk = sec(el, 'tasks'), tkOf = id => tk.find(f => f.id === id);
  check('a task is found by its title, notes, who it waits on and its steps', !!tkOf('tkRing') && ids(S('van number'), 'tasks').includes('tkRing') && ids(S('zed'), 'tasks').includes('tkWait') && ids(S('outdoor cable'), 'tasks').includes('tkShedWire'));
  check('…its page opens; it says its project or its list', tkOf('tkRing').href === '#today/tasks/tkRing' && tkOf('tkRing').where === '“Home jobs” list' && tkOf('tkShedWire').where === 'in “Garden shed”');
  check('open tasks come first; done and let go ones after, marked', (() => { const o = tk.filter(f => f.id.startsWith('tk')).map(f => f.id); return o.indexOf('tkPaid') > o.indexOf('tkShedWire') && o.indexOf('tkGone') > o.indexOf('tkRing') && eq(tkOf('tkPaid').tags, ['Done']) && eq(tkOf('tkGone').tags, ['Let go']); })(), tk.map(f => [f.id, f.tags]));
  check('a task list and a Today list are found by name, and link to them', eq(ids(S('home jobs'), 'tasks'), ['tlH']) && sec(S('home jobs'), 'tasks')[0].href === '#today/tasks/list/tlH' && sec(el, 'tasks').find(f => f.id === 'aBill')?.href === '#today/edit' && sec(el, 'tasks').find(f => f.id === 'aBill')?.where === 'Admin');

  console.log('\n[3] Projects');
  const pj = sec(el, 'projects');
  check('a project\'s own words, milestones and decisions are found, saying which project', pj.some(f => f.kind === 'Project' && f.title === 'Garden shed') && pj.some(f => f.kind === 'Milestone' && f.where === 'in “Kitchen refit”') && pj.some(f => f.kind === 'Decision' && f.where === 'in “Old flat”'), pj);
  check('…and a link it keeps, by its title and note', sec(S('zinc roof'), 'projects').some(f => f.kind === 'Link' && f.title === 'Shed kit page'));
  check('a project\'s tasks and notes are under Tasks and Notes, never twice', !pj.some(f => f.kind === 'Task' || f.kind === 'Note') && ids(el, 'tasks').includes('tkShedWire') && ids(el, 'notes').includes('nShed'));
  check('open projects first, then paused (marked), then done (marked)', eq(pj.map(f => f.tags.join() || 'open'), ['open', 'Paused', 'Done']), pj.map(f => [f.title, f.tags]));
  check('…links open the project the way Search this project does', pj.find(f => f.kind === 'Milestone').href === '#projects/p/pjKitchen/milestones' && pj.find(f => f.kind === 'Project').href === '#projects/p/pjShed');
  check('…and arriving brings the item itself into view (its head, or its row by data-id)', pj.find(f => f.kind === 'Project').focus === '#projectHead' && pj.find(f => f.kind === 'Milestone').focus === '[data-id="msK"]' && pj.find(f => f.kind === 'Decision').focus === '[data-id="dcF"]');

  console.log('\n[4] Notes');
  const nt = sec(el, 'notes');
  check('a note is found by its title or text, opens itself, and says its project or category', eq(nt.map(f => f.id), ['nEl', 'nShed']) && nt[0].href === '#projects/notes/nEl' && nt[1].where === 'in “Garden shed”' && nt[0].where.length > 0);
  check('…an untitled note is shown by its first line, with an excerpt where the words were', nt[1].title.startsWith('Shed: ask the electrician') && sec(S('fused spur'), 'notes')[0].excerpt.includes('fused spur'));

  console.log('\n[5] Calendar');
  const cal = sec(el, 'calendar');
  check('appointments and work: coming ones first, soonest first, then past ones (marked)', eq(cal.map(f => f.id), ['cmSoon', 'cmLater', 'cmPast']) && eq(cal[2].tags, ['Past']) && cal[0].kind === 'Work' && cal[1].kind === 'Appointment', cal.map(f => [f.id, f.tags]));
  check('…each says its day and time and opens the calendar on that day', cal[0].href === '#calendar/2026-10-27' && cal[0].where.endsWith(', 08:30'));

  console.log('\n[6] Study');
  const st = [...sec(el, 'study'), ...sec(S('home electrics'), 'study')], stOf = id => st.find(f => f.id === id);
  check('your own courses: course, task (by its note too) found; module and section by title; guided Cybersecurity course left out', !!stOf('crE') && !!stOf('stkE') && ids(S('ring mains'), 'study').includes('scE') && ids(S('circuits'), 'study').includes('mdE') && !st.some(f => f.id === 'cyber:1:x'), st.map(f => f.id));
  check('…a course opens its page, a task its own', stOf('crE').href === '#study/course/crE' && stOf('stkE').href === '#study/task/stkE' && stOf('stkE').where === 'in “Home electrics course”');
  check('topics, stages, revision cards and check-ins are found', ids(S('electrics'), 'study').includes('tpE') && ids(S('wiring basics'), 'study').includes('stE') && ids(S('leak earth'), 'study').includes('cpMine') && ids(S('earth leakage'), 'study').includes('ssE'));
  check('an AI-made revision card is found by its own words, marked "AI-made" — never by its explanation or a kept "another way"', eq(sec(S('ohm'), 'study')[0]?.tags, ['AI-made']) && S('aiexplainword').total === 0 && S('anotherwayword').total === 0);
  check('a book by its title, author and your notes', ids(S('ann volt'), 'study').includes('bkE') && ids(S('bathrooms zones'), 'study').includes('bkE') && sec(S('ann volt'), 'study')[0].href === '#study/reading');
  const kw = sec(S('book'), 'study').find(f => f.id === 'kwK');
  check('a kept word by its Arabic, meaning or note: opens Vocabulary and brings the word into view', !!kw && kw.href === '#study/arabic/vocabulary' && kw.focus === '[data-ar-kept="kwK"]' && kw.lang === 'ar' && ids(S('library'), 'study').includes('kwK'));
  check('your "Needs revision" notes and session answers, by the lesson\'s title', sec(S('goodbye forms'), 'study')[0]?.title === 'Saying goodbye' && sec(S('salama'), 'study')[0]?.href === '#study/arabic/lesson.ar-x1' && sec(S('resolver caching'), 'study')[0]?.href === '#study/cybersecurity/lesson.cy-x1');
  check('your notebook and portfolio, by their words', sec(S('ttl'), 'study')[0]?.title === 'Practical task · How DNS finds a name' && sec(S('nslookup'), 'study')[0]?.href === '#study/cybersecurity/portfolio');
  check('the course lessons and modules by title (and a module\'s purpose), linking to them', sec(S('goodbye'), 'study').some(f => f.kind === 'Arabic lesson' && f.where === 'Greetings and courtesy') && sec(S('packets'), 'study').some(f => f.kind === 'Cybersecurity module' && f.href === '#study/cybersecurity/module.cy-x') && sec(S('dns'), 'study').some(f => f.kind === 'Cybersecurity lesson'));
  const cw = sec(S('مدرسة'), 'study').find(f => f.kind === 'Course word'), sw = sec(S('house'), 'study').find(f => f.kind === 'Course word');
  check('the course\'s own words: by the Arabic without vowels, the meaning or the example; a lesson\'s word opens its lesson', !!cw && cw.href === '#study/arabic/lesson.ar-x1' && cw.where === 'school' && cw.lang === 'ar' && !cw.focus
    && sec(S('school'), 'study').some(f => f.id === 'lexeme.x-1') && sec(S('went'), 'study').some(f => f.id === 'lexeme.x-1' && f.excerpt.includes('went')), cw);
  check('…a starter word opens Vocabulary and brings that word into view', !!sw && sw.href === '#study/arabic/vocabulary' && sw.focus === '[data-ar-word="lexeme.seed-1"]', sw);
  check('…without the course index (still loading), everything else is still found', S('goodbye', world(), null).sections.length > 0 && !all(S('goodbye', world(), null)).some(f => f.kind === 'Arabic lesson') && S('ring mains', world(), null).total === 1);

  console.log('\n[7] Finance and Health');
  check('money owed and monthly expenses by their names and notes; Finance opens at the card', sec(S('electrician dave'), 'finance')[0]?.kind === 'You owe' && sec(S('cinema'), 'finance')[0]?.kind === 'Owed to you' && sec(S('electricity'), 'finance')[0]?.focus === '#expensesCard');
  const sq = sec(S('squat'), 'health');
  check('recipes (by ingredient too), the shopping list, exercises, workouts and daily exercises; archived and ticked ones after', ids(S('red lentils'), 'health').includes('rcE') && ids(S('lentils'), 'health').includes('shE') && eq(sq.map(f => f.id), ['exSq', 'wtA', 'deP', 'exOld']) && eq(sq[3].tags, ['Archived']), sq.map(f => f.id));
  check('…each links to its screen', sec(S('lentil soup'), 'health')[0].href === '#health/food/recipe/rcE' && sq[0].href === '#health/workout/exercise/exSq' && sq[1].href === '#health/workout/template/wtA');

  console.log('\n[8] Private');
  check('nothing private is ever found: a private project (its words, milestones, decisions, links, research), its tasks, notes and appointments, or a private note', S('secretword').total === 0 && !all(el).some(f => /hush|private/i.test(f.title) || f.id === 'nPriv' || f.id === 'cmHush'), all(S('secretword')));
  check('the page is told something was left out (to say so), and not when nothing is private', S('x').leftOut === true && (() => { const d = world(); d.projects.items = d.projects.items.filter(p => !p.private); d.notes.items = d.notes.items.filter(n => !n.private); return S('x', d).leftOut === false; })());

  console.log('\n[9] Order and the cap');
  check('sections in a fixed order: Tasks, Projects, Notes, Calendar, Study, Finance', eq(el.sections.map(s => s.section), ['tasks', 'projects', 'notes', 'calendar', 'study', 'finance']), el.sections.map(s => s.section));
  check('the total is every match', el.total === el.sections.reduce((n, s) => n + s.items.length + s.more, 0));
  const many = world(); many.tasks.items = Array.from({ length: 63 }, (_, i) => T('tkM' + i, 'Batch job ' + i));
  const m = sec(S('batch job', many), 'tasks'), ms = S('batch job', many).sections[0];
  check('at most 50 a section are shown, with how many more', m.length === 50 && ms.more === 13 && S('batch job', many).total === 63);

  console.log('\n[10] The real course catalogues');
  const real = K.courseIndex();
  check('the index holds both courses\' modules and lessons, and a notebook activity named with its lesson', real.arabic.lessons.length > 50 && real.cyber.lessons.length > 50 && real.arabic.modules.length > 5 && real.cyber.activities.some(a => / · /.test(a.title)));
  const blank = K.freshState(), arL = real.arabic.lessons[0];
  check('the real course words are there: the starter words (no lesson) and each lesson\'s', real.arabic.words.filter(w => !w.lessonId).length >= 40 && real.arabic.words.filter(w => w.lessonId).length >= 40 && real.arabic.words.every(w => w.ar && w.meaning));
  const hello = K.searchEverywhere(blank, 'مرحبا', real, TODAY).sections.flatMap(s => s.items).find(f => f.kind === 'Course word');
  check('…a real one is found by its Arabic without vowels and opens its lesson', !!hello && hello.href === '#study/arabic/lesson.arabic-greetings-address' && hello.where === 'hello', hello);
  check('a real Arabic lesson is found by its title and links to it', K.searchEverywhere(blank, arL.title, real, TODAY).sections.flatMap(s => s.items).some(f => f.id === arL.id && f.href === `#study/arabic/${encodeURIComponent(arL.id)}`), arL);
  const answers = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/study/arabic/data/answers.json'), 'utf8'));
  const longest = Object.values(answers).map(a => a.answer).sort((a, b) => b.length - a.length)[0], phrase = longest.split(/\s+/).slice(0, 6).join(' ');
  check('a lesson check\'s reference answer is never searched (the longest one\'s words find nothing)', K.searchEverywhere(blank, phrase, real, TODAY).total === 0, phrase);

  const before = world(), j = JSON.stringify(before);
  S('electrician', before); S('squat', before); S('كتاب', before);
  check('searching writes nothing', JSON.stringify(before) === j);

  fs.rmSync(dir, { recursive: true, force: true });
  const sm = summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const sm = summary(); console.log(`${sm.pass} passed, ${sm.fail} failed before the error`); process.exit(2); });
