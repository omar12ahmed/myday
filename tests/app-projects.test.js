// Projects in the new app (1.12.0; the section was the Inbox before): starting a project, what it's about and where it
// is on the progression (capture → understand → organise → explore → decide → act → reflect), its one next step (and
// adding it to today's plan only while there's room for your energy), its tasks (dates read from your words), notes
// (new, or ones you already have), appointments (on the Calendar too, the Calendar's own record unchanged), "From your
// projects" and "Your tasks" on Today, Tasks under Today, older #inbox/#notes links, Capture starting a project from an
// idea, pausing / finishing / deleting (a deleted project's notes, tasks and appointments stay), saved data (unknown
// fields kept, broken entries, export and import, the current MyDay keeping Projects) and layout on phones.
const fs = require('fs');
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const answer = async yes => { await sleep(200); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(250); };
const hash = () => ev('location.hash');
const until = async (js, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(js)) return true; await sleep(100); } return false; };
const projects = async () => (await data()).projects.items;
const project = async title => (await projects()).find(p => p.title === title);
const task = async title => (await data()).tasks.items.find(t => t.title === title);
const toast = () => text('#toast');
// An optional card with nothing in it is folded into "Add to this project" (specs/projects-sections.md): ask for it, and (for the
// ones that open an add form) close the form again so the card is as it is when empty.
const unfold = async (id, card, cancel) => { await click(`[data-action=section-open][data-id=${id}]`); await until(`!!document.getElementById('${card}')`); if (cancel) { await until(`!!document.querySelector('[data-action=${cancel}]')`); await click(`[data-action=${cancel}]`); await until(`!document.querySelector('[data-action=${cancel}]')`); } };
const K = '2026-10-15'; // a Thursday
const day = (energy, tasks = '[]') => `s => { s.days['${K}'] = { energy: ${energy}, rest: false, builtAt: '${K}T08:00', checkedIn: false, tasks: ${tasks} }; }`;
async function capture(textIn) {
  if (!(await exists('#captureSheet'))) { await click('[data-action=capture-open]'); await sleep(200); }
  await type('#captureText', textIn);
  await until(`!document.querySelector('#captureChoices [role=status]')`);
  await sleep(150);
}
const choices = () => ev(`[...document.querySelectorAll('#captureChoices [data-action^=capture-]')].filter(b => b.dataset.action !== 'capture-cancel').map(b => b.dataset.action.slice(8) + (b.getAttribute('type') === 'submit' ? '*' : ''))`);

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] Starting a project');
  await go('projects', 2026, 10, 15); await reset(); await go('projects', 2026, 10, 15);
  check('Projects starts empty, and says what a project can be', (await text('#projectsEmpty')).includes('Start with just a name') && eq(await projects(), []));
  check('"Start" waits for a name', await ev(`document.querySelector('[data-action=project-add]').disabled`));
  await type('#projectNew', '  Coffee subscription for offices  '); await click('[data-action=project-add]'); await sleep(300);
  let p = await project('Coffee subscription for offices');
  check('a project: its name (trimmed), at Capture, active, no next step or appointments yet', p && p.stage === 'capture' && p.status === 'active' && p.summary === '' && p.nextTaskId === null && eq(p.commitmentIds, []) && /^pj/.test(p.id), p);
  check('…and it opens straight away', (await hash()) === `#projects/p/${p.id}` && (await text('#projectTitle')) === 'Coffee subscription for offices');
  const PID = p.id;

  console.log('\n[2] What it is, and where it is on the progression');
  check('it asks what it is and why it matters (nothing has to be filled in)', await exists('[data-action=project-why]'));
  await click('[data-action=project-why]'); await sleep(150);
  await type('#projectSummary', 'Fresh beans for small offices, every fortnight.'); await sleep(250);
  check('the summary is saved', (await project('Coffee subscription for offices')).summary === 'Fresh beans for small offices, every fortnight.');
  await type('#projectTitleInput', '   '); await sleep(200);
  check('an empty name is put back, not saved', (await projects())[0].title === 'Coffee subscription for offices');
  await click('[data-action=project-edit]'); await sleep(150);
  check('…and shows as text once you\'re done', (await text('[data-s=project-summary]')) === 'Fresh beans for small offices, every fortnight.');
  const steps = await ev(`[...document.querySelectorAll('#projectHead [data-s=stage]')].map(b => b.getAttribute('aria-label') + (b.getAttribute('aria-current') === 'step' ? '*' : ''))`);
  check('seven steps: Capture* Understand Organise Explore Decide Act Reflect', eq(steps, ['Capture*', 'Understand', 'Organise', 'Explore', 'Decide', 'Act', 'Reflect']), steps);
  check('…the current one says what it means', (await text('[data-s=stage-now]')).includes("It's out of your head and safe here."));
  await click('#projectHead [data-s=stage][data-id=explore]'); await sleep(200);
  check('tapping a step moves the project there', (await projects())[0].stage === 'explore' && (await text('[data-s=stage-now]')).startsWith('Explore'));

  console.log('\n[3] The one next step, and Today');
  check('no next step yet → it asks for the smallest one', await exists('#projectNextNew'));
  await type('#projectNextNew', 'Ask three offices what they pay'); await click('[data-action=project-step-add]'); await sleep(300);
  let t1 = await task('Ask three offices what they pay');
  p = (await projects())[0];
  check('…it becomes a task in this project, and the next step', t1 && t1.projectId === PID && p.nextTaskId === t1.id && (await text('[data-s=next-title]')) === 'Ask three offices what they pay', [t1, p.nextTaskId]);
  await click('[data-action=project-step-today]'); await sleep(250);
  check('"Add to today" before the day is built: it says so, and adds nothing', (await toast()).includes('Build your day first') && (await task('Ask three offices what they pay')).plannedOn === null);
  await editStorage(day(3));
  await go(`projects/p/${PID}`, 2026, 10, 15, 9, 5);
  await click('[data-action=project-step-today]'); await sleep(250);
  let d = await data();
  check('with room on today\'s plan: added, linked both ways', d.days[K].tasks.some(x => x.title === 'Ask three offices what they pay') && d.tasks.items.find(x => x.id === t1.id).plannedOn === K && (await text('#projectNext')).includes("On today's plan"));
  await editStorage(`s => { s.days['${K}'].tasks.push(...[1, 2, 3].map(i => ({ uid: 'u' + i, taskId: null, category: 'admin', title: 'Filler ' + i, minutes: 10, baseMinutes: 10, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null }))); }`);

  console.log('\n[4] Its tasks (with dates), Coming up, and how it\'s going');
  await go(`projects/p/${PID}`, 2026, 10, 15, 9, 10);
  const n0 = (await data()).tasks.items.length;
  await type('#projectTaskNew', 'price beans from two roasters Saturday at 11am'); await click('[data-action=project-task-add]');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.length > ${n0}`); await sleep(200);
  const t2 = (await data()).tasks.items.find(x => /price beans/i.test(x.title));
  check('a task added here belongs to the project, with the date and time from your words', t2 && t2.projectId === PID && t2.due === '2026-10-17' && t2.time === '11:00', t2);
  check('…and is under Coming up', (await text('#projectSoon')).includes('Saturday 17 October · 11:00') && (await text('#projectSoon')).toLowerCase().includes('price beans'));
  check('the project\'s tasks are listed without repeating its name', (await ev(`document.querySelectorAll('#projectTasks .task-row').length`)) === 2 && !(await exists('#projectTasks [data-s=task-project]')));
  await type('#projectNextPick', t2.id); await sleep(200);
  check('another task can be chosen as the next step', (await projects())[0].nextTaskId === t2.id && (await text('[data-s=next-title]')).toLowerCase().includes('price beans'));
  await click('[data-action=project-step-done]'); await sleep(250);
  d = await data();
  check('"Done" ticks the next step off; the next one to do takes its place', d.tasks.items.find(x => x.id === t2.id).done && (await text('[data-s=next-title]')) === 'Ask three offices what they pay');
  check('how it\'s going: plain counts, never a percentage', (await text('[data-s=project-counts]')) === '1 done · 1 to go' && !/%/.test(await text('#projectGlance [data-s=glance-weeks]')));

  console.log('\n[5] Its notes');
  await click('[data-action=section-open][data-id=notes]'); await until(`!!document.querySelector('[data-action=project-note-new]')`); // (a project with no notes folds the Notes card until you ask for it)
  await click('[data-action=project-note-new]'); await sleep(300);
  const nid = (await hash()).split('/')[2];
  check('"New note" opens a note in this project', /^#projects\/notes\/nt/.test(await hash()) && (await data()).notes.items.find(n => n.id === nid)?.projectId === PID
    && (await ev(`document.getElementById('noteProject').value`)) === PID);
  await type('#noteText', 'Competitors: Pact, Grind'); await sleep(900);
  check('…its way back is to the project', await exists(`#app a[href="#projects/p/${PID}"]`));
  await editStorage(`s => { s.notes.items.push({ id: 'ntLoose', categoryId: '', title: 'Margins', text: 'beans ~£12/kg', pinned: false, createdAt: '2026-10-14T10:00', updatedAt: '2026-10-14T10:00' }); }`);
  await go(`projects/p/${PID}`, 2026, 10, 15, 9, 15);
  check('the note is listed in the project', (await text('#projectNotes')).includes('Competitors: Pact, Grind'));
  await type('#projectNoteLink', 'ntLoose'); await sleep(250);
  check('a note you already have can be added to it', (await data()).notes.items.find(n => n.id === 'ntLoose').projectId === PID && (await text('#projectNotes')).includes('Margins'));
  await go('projects/notes/ntLoose', 2026, 10, 15, 9, 20);
  await type('#noteProject', ''); await sleep(250);
  check('…and taken out again from the note ("No project": the link is removed, nothing else)', !('projectId' in (await data()).notes.items.find(n => n.id === 'ntLoose')) && (await data()).notes.items.find(n => n.id === 'ntLoose').text === 'beans ~£12/kg');

  console.log('\n[6] Appointments: in the project, and on the Calendar as ever');
  await go(`projects/p/${PID}`, 2026, 10, 15, 9, 25);
  await click('[data-action=project-appt-add]'); await sleep(150);
  await type('#pjApptTitle', 'Call with a roaster'); await type('#pjApptDate', '2026-10-19'); await type('#pjApptStart', '14:00'); await type('#pjApptEnd', '14:30');
  await click('[data-action=project-appt-save]'); await sleep(300);
  d = await data();
  const ap = d.commitments.find(c => c.title === 'Call with a roaster');
  check('an appointment: on the Calendar, with exactly the fields the Calendar has always saved', ap && eq(Object.keys(ap).sort(), ['end', 'id', 'kind', 'start', 'title']) && ap.kind === 'appointment' && ap.start === '2026-10-19T14:00' && ap.end === '2026-10-19T14:30', ap);
  check('…and listed on the project (the link is kept on the project, not on the appointment)', eq(d.projects.items[0].commitmentIds, [ap.id]) && (await text('#projectSoon')).includes('Call with a roaster'));
  await click('[data-action=project-appt-unlink]'); await sleep(250);
  d = await data();
  check('"Unlink" takes it off the project; it stays on the Calendar', eq(d.projects.items[0].commitmentIds, []) && d.commitments.some(c => c.id === ap.id));
  await click('[data-action=project-appt-add]'); await sleep(150);
  await type('#pjApptDate', '2026-10-20'); await type('#pjApptStart', '10:00'); await click('[data-action=project-appt-save]'); await sleep(300);
  check('an appointment with no name takes the project\'s, and lasts 30 minutes', (await data()).commitments.some(c => c.title === 'Coffee subscription for offices' && c.start === '2026-10-20T10:00' && c.end === '2026-10-20T10:30'));

  console.log('\n[7] Today: "From your projects" and "Your tasks"');
  await go('projects', 2026, 10, 15, 9, 30);
  await type('#projectNew', 'Move closer to work'); await click('[data-action=project-add]'); await sleep(300);
  const P2 = (await project('Move closer to work')).id;
  await type('#projectNextNew', 'Book two viewings'); await click('[data-action=project-step-add]'); await sleep(300);
  await editStorage(`s => { s.days['${K}'].tasks = s.days['${K}'].tasks.filter(x => !/^Filler/.test(x.title)); }`);
  await go('today', 2026, 10, 15, 9, 35);
  let rowsToday = await ev(`[...document.querySelectorAll('#projectSteps [data-s=project-step]')].map(li => li.textContent)`);
  check('each active project\'s next step (not already on today\'s plan) is offered, with its project', rowsToday.length === 1 && rowsToday[0].includes('Move closer to work') && rowsToday[0].includes('Book two viewings'), rowsToday);
  await click('#projectSteps [data-action=step-plan]'); await sleep(250);
  d = await data();
  check('…one tap adds it to today\'s plan (there\'s room); it then leaves this card', d.days[K].tasks.some(x => x.title === 'Book two viewings') && !(await exists('#projectSteps')));
  check('"Your tasks" is always on Today, with how many are left to do', (await text('#tasksLink')).includes('Your tasks') && (await text('#tasksLink')).includes('to do'));
  await click('#tasksLink a'); await sleep(300);
  check('…and opens Tasks, now under Today (the bar shows Today; the top bar says Tasks)', (await hash()) === '#today/tasks' && (await exists('#taskNew')) && (await text('#nav [aria-current=page]')).trim() === 'Today' && (await text('#screenName')) === 'Tasks');
  check('…a project\'s task is labelled with its project in Tasks', (await ev(`[...document.querySelectorAll('[data-s=task-project]')].map(s => s.textContent.trim())`)).includes('Coffee subscription for offices'));
  check('…and Tasks has a way back to Today; no Focus mode switch there', (await exists('#app a[href="#today"]')) && !(await exists('[data-action=focus-mode]')));
  await go(`today/tasks/${t1.id}`, 2026, 10, 15, 9, 40);
  check('a task in a project: its way back is to the project, and its project can be changed', (await exists(`#app a[href="#projects/p/${PID}"]`)) && (await ev(`document.getElementById('tProject').value`)) === PID);
  await type('#tProject', P2); await sleep(250);
  check('…moving it to another project', (await task('Ask three offices what they pay')).projectId === P2);
  await type('#tProject', PID); await sleep(250);

  console.log('\n[8] Older links still work');
  for (const [from, to] of [['inbox', '#projects'], ['inbox/tasks', '#today/tasks'], [`inbox/tasks/${t1.id}`, `#today/tasks/${t1.id}`], [`inbox/notes/${nid}`, `#projects/notes/${nid}`], ['notes', '#projects/notes'], ['inbox/notes/collections', '#projects/notes/collections']]) {
    await go(from, 2026, 10, 15, 9, 45);
    check(`#${from} → ${to}`, (await hash()) === to, await hash());
  }
  await ev(`location.hash = 'inbox/tasks'`); await sleep(300);
  check('…also when followed inside MyDay (a link in a note)', (await hash()) === '#today/tasks' && (await exists('#taskNew')));

  console.log('\n[9] Capture: an idea can start a project');
  await go('calendar', 2026, 10, 15, 10);
  await capture('app idea: shift-swap finder for nurses\nso people can swap shifts without a group chat');
  check('an idea → "Start a project from this" first', (await choices())[0] === 'project*', await choices());
  await click('[data-action=capture-project]'); await sleep(400);
  p = await project('app idea: shift-swap finder for nurses');
  check('…the first line is its name, the rest what it\'s about; it opens', p && p.summary === 'so people can swap shifts without a group chat' && p.stage === 'capture' && (await hash()) === `#projects/p/${p.id}`, p);
  await capture('call GP tomorrow at 10am');
  check('a time or an action isn\'t offered as a project', !(await choices()).some(c => c.startsWith('project')), await choices());
  await click('[data-action=capture-cancel]'); await sleep(200);

  console.log('\n[10] Pausing, finishing, deleting');
  await go(`projects/p/${P2}`, 2026, 10, 15, 11);
  await click('[data-action=project-pause]'); await sleep(250);
  check('"Pause for now": paused, said kindly', (await project('Move closer to work')).status === 'paused' && (await toast()).includes("it'll be here when you come back"));
  await go('projects', 2026, 10, 15, 11, 5);
  check('paused projects are folded away under Paused, not among the active ones', (await text('#projects-paused')).includes('Paused') && !(await ev(`[...document.querySelectorAll('#projectList .project-card')].some(a => a.textContent.includes('Move closer to work'))`)));
  check('the active ones show their stage, next step and what\'s in them', (await ev(`[...document.querySelectorAll('#projectList .project-card')].map(a => a.querySelector('[data-s=project-stage]').textContent)`)).includes('Explore')
    && (await text(`#projectList .project-card[data-id="${PID}"] [data-s=project-next]`)).includes('Ask three offices what they pay'));
  await go(`projects/p/${P2}`, 2026, 10, 15, 11, 10);
  await click('[data-action=project-resume]'); await sleep(200);
  await click('[data-action=project-finish]'); await sleep(200);
  check('"Pick it up again", then "Mark as done"', (await project('Move closer to work')).status === 'done');
  await click('[data-action=project-delete]'); await answer(false);
  check('"Delete project" asks first ("Keep it" keeps it)', !!(await project('Move closer to work')));
  await go(`projects/p/${PID}`, 2026, 10, 15, 11, 15);
  const before = await data();
  await click('[data-action=project-delete]'); await answer(true);
  d = await data();
  check('deleting a project: it goes, and you\'re back at your projects', !d.projects.items.some(x => x.id === PID) && (await hash()) === '#projects');
  check('…its tasks, notes and appointments all stay, just without the link', d.tasks.items.length === before.tasks.items.length && d.notes.items.length === before.notes.items.length && d.commitments.length === before.commitments.length
    && !d.tasks.items.some(x => x.projectId === PID) && !d.notes.items.some(n => n.projectId === PID));

  console.log('\n[11] Saved data');
  await editStorage(`s => { s.projects.items.push({ id: 'pjOdd', title: 'Odd one', stage: 'somewhere', status: 'maybe', extra: { kept: true }, commitmentIds: ['c1', 'c1', 7] }, { id: 'pjBroken' }, { id: 'pjOdd', title: 'Same id' });
    s.tasks.items[0].projectId = ''; s.notes.items[0].projectId = 42; }`);
  await go('projects', 2026, 10, 15, 12);
  await type('#projectNew', 'One more'); await click('[data-action=project-add]'); await sleep(300); // a save
  d = await data();
  const odd = d.projects.items.find(x => x.title === 'Odd one'), same = d.projects.items.find(x => x.title === 'Same id');
  check('reading saved projects: an unknown stage or status → Capture, active; unknown fields kept; duplicate links once', odd && odd.stage === 'capture' && odd.status === 'active' && eq(odd.extra, { kept: true }) && eq(odd.commitmentIds, ['c1']), odd);
  check('…a project without a name can\'t be read (and is counted, not hidden); a repeated id gets a new one', !d.projects.items.some(x => x.id === 'pjBroken') && same && same.id !== 'pjOdd');
  check('…an empty or wrong link on a task or note is left out', !('projectId' in d.tasks.items[0]) && !('projectId' in d.notes.items[0]));
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  await click('[data-action=export]'); await sleep(1200);
  const exported = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-15.json', 'utf8'));
  check('"Export my data" includes Projects', eq(exported.data.projects, d.projects));
  await reset(); await go('today', 2026, 10, 15, 12, 5);
  await setFile(S + '/dl/myday-export-2026-10-15.json'); await sleep(200); await answer(true);
  check('importing it brings Projects back exactly', eq((await data()).projects, exported.data.projects) && eq((await data()).tasks, exported.data.tasks));
  const savedNew = await ev(`localStorage.getItem('${KEY}')`);
  T.setUrl('index.html#today'); await openAt(2026, 10, 15, 12, 10);
  await click('#themeBtn'); await sleep(300); // one change, so the current MyDay saves
  const afterClassic = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  check('the current MyDay keeps Projects, and the project links on tasks and notes, exactly when it saves', eq(afterClassic.projects, JSON.parse(savedNew).projects)
    && eq(afterClassic.tasks, JSON.parse(savedNew).tasks) && eq(afterClassic.notes, JSON.parse(savedNew).notes) && afterClassic.settings.theme !== JSON.parse(savedNew).settings.theme);
  await editStorage(`s => { delete s.projects; }`);
  await go('projects', 2026, 10, 15, 12, 15);
  check('saved data from before Projects opens with no projects (nothing else changes)', await exists('#projectsEmpty'));

  console.log('\n[12] Layout');
  await go('projects', 2026, 10, 15, 13); await reset(); await go('projects', 2026, 10, 15, 13);
  await type('#projectNew', 'A much longer project name with many words, so that it has to wrap onto more than one line on a phone'); await click('[data-action=project-add]'); await sleep(300);
  const PL = (await projects())[0].id;
  await type('#projectNextNew', 'A first small step that is also rather long, to see it wrap nicely'); await click('[data-action=project-step-add]'); await sleep(300);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 740, deviceScaleFactor: 2, mobile: true });
  for (const theme of ['dark', 'light']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    for (const h of ['projects', `projects/p/${PL}`, 'today', 'today/tasks']) {
      await go(h, 2026, 10, 15, 13, 5);
      check(`phone 360 px (${theme}), #${h.replace(PL, '<id>')}: nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
    }
  }
  await go(`projects/p/${PL}`, 2026, 10, 15, 13, 10);
  const small = await ev(`[...document.querySelectorAll('#app button, #app input:not([type=checkbox]), #app select, #app .task-row, #app label.tick, #app a')].filter(b => b.getClientRects().length).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id || b.className).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44)`);
  check('phone: every button, link, field and step is at least 44 × 44 px', small.length === 0, small.slice(0, 5));
  await go('projects', 2026, 10, 15, 13, 15);
  const smallHome = await ev(`[...document.querySelectorAll('#app button, #app input, #app a')].filter(b => b.getClientRects().length).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id).trim().slice(0, 24), h: Math.round(r.height) }; }).filter(x => x.h < 44)`);
  check('phone: the projects page too', smallHome.length === 0, smallHome.slice(0, 5));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[13] The board: Ideas, Exploring, Doing');
  await go('projects', 2026, 10, 15, 14); await reset(); await go('projects', 2026, 10, 15, 14);
  const mk = (id, title, stage, status = 'active') => `{ id: '${id}', title: '${title}', summary: '', stage: '${stage}', status: '${status}', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-10T09:00', updatedAt: '2026-10-10T09:00' }`;
  await editStorage(`s => { s.projects.items.push(${mk('pjA', 'Board: pottery stall', 'capture')}, ${mk('pjB', 'Board: garden notes', 'organise')}, ${mk('pjC', 'Board: bike repair course', 'explore')},
    ${mk('pjD', 'Board: allotment plan', 'decide')}, ${mk('pjE', 'Board: tea blog', 'explore')}, ${mk('pjF', 'Board: window box', 'act')}, ${mk('pjG', 'Board: paused hobby', 'explore', 'paused')}); }`);
  await go('projects', 2026, 10, 15, 14, 5);
  const col = id => ev(`[...document.querySelectorAll('#projectList section[data-column=${id}] .project-card')].map(c => c.dataset.id).sort()`);
  const head = id => ev(`document.querySelector('#projectList section[data-column=${id}] h3').textContent.replace(/\\s+/g, ' ').trim()`);
  const has = (id, action) => ev(`!!document.querySelector('.project-card[data-id=${id}] [data-action=${action}]')`);
  const toastIs = async re => { await until(`/${re}/.test(document.querySelector('#toast') ? document.querySelector('#toast').textContent : '')`, 3000); return text('#toast'); };
  const stageOfP = async id => (await projects()).find(x => x.id === id).stage;
  const many = id => ev(`(document.querySelector('#projectList section[data-column=${id}] [data-s=column-many]') || {}).textContent || null`);
  check('Ideas holds the capture and organise projects', eq(await col('ideas'), ['pjA', 'pjB']), await col('ideas'));
  check('Exploring holds the explore and decide projects', eq(await col('exploring'), ['pjC', 'pjD', 'pjE']), await col('exploring'));
  check('Doing holds the act project', eq(await col('doing'), ['pjF']), await col('doing'));
  check('each column heading shows its name and how many (Ideas 2, Exploring 3, Doing 1)', eq([await head('ideas'), await head('exploring'), await head('doing')], ['Ideas 2', 'Exploring 3', 'Doing 1']), [await head('ideas'), await head('exploring'), await head('doing')]);
  check('a paused project is not on the board', !(await ev(`!!document.querySelector('#projectList [data-id=pjG]')`)));
  check('Ideas cards have no back button, but can move on', !(await has('pjA', 'project-back')) && !(await has('pjB', 'project-back')) && (await has('pjA', 'project-on')) && (await has('pjB', 'project-on')));
  check('Doing cards have no on button, but can move back', !(await has('pjF', 'project-on')) && (await has('pjF', 'project-back')));
  check('Exploring cards can move both ways', (await has('pjC', 'project-on')) && (await has('pjC', 'project-back')));
  check('three in Exploring and one in Doing say nothing about too many', (await many('exploring')) === null && (await many('doing')) === null && (await many('ideas')) === null);

  await click('.project-card[data-id=pjA] [data-action=project-on]');
  const mv1 = await toastIs('Moved to Exploring');
  check('moving an Ideas card on puts it in Exploring, at the Explore stage', (await stageOfP('pjA')) === 'explore' && eq(await col('exploring'), ['pjA', 'pjC', 'pjD', 'pjE']), await col('exploring'));
  check('…the message says gently that four are being explored', mv1 === 'Moved to Exploring — that\'s 4 there now. Three at a time is plenty; pausing one is fine.', mv1);
  check('…and Exploring says so too, kindly', (await many('exploring')) === '4 here at once. Your rule of thumb is three at a time — pausing one is fine, it\'ll keep.', await many('exploring'));
  check('…and the Ideas count drops to 1', (await head('ideas')) === 'Ideas 1' && (await head('exploring')) === 'Exploring 4', [await head('ideas'), await head('exploring')]);

  await click('.project-card[data-id=pjF] [data-action=project-back]'); await sleep(300);
  check('moving a Doing card back puts it in Exploring, at the Decide stage', (await stageOfP('pjF')) === 'decide' && (await col('exploring')).includes('pjF'), await stageOfP('pjF'));
  check('…Doing is empty and says "Nothing here right now."', (await text('#projectList section[data-column=doing] [data-s=column-empty]')) === 'Nothing here right now.' && eq(await col('doing'), []));
  await click('.project-card[data-id=pjC] [data-action=project-back]'); await sleep(300);
  check('moving an Exploring card back puts it in Ideas, at the Organise stage', (await stageOfP('pjC')) === 'organise' && eq(await col('ideas'), ['pjB', 'pjC']), await stageOfP('pjC'));

  await click('.project-card[data-id=pjA] [data-action=project-on]'); await sleep(300);
  const mv2 = await toastIs('Moved to Doing');
  check('moving an Exploring card on puts it in Doing, at the Act stage, with no worry at one', (await stageOfP('pjA')) === 'act' && mv2 === 'Moved to Doing.', mv2);
  await click('.project-card[data-id=pjD] [data-action=project-on]'); await sleep(300);
  check('two in Doing: still no "too many" note, and the message is plain', (await head('doing')) === 'Doing 2' && (await many('doing')) === null && (await text('#toast')) === 'Moved to Doing.', [await head('doing'), await text('#toast')]);
  await click('.project-card[data-id=pjE] [data-action=project-on]');
  const mv3 = await toastIs('Moved to Doing');
  check('a third in Doing says gently that two at a time is plenty', mv3 === 'Moved to Doing — that\'s 3 there now. Two at a time is plenty; pausing one is fine.', mv3);
  check('…and Doing shows its own rule-of-thumb note', (await many('doing')) === '3 here at once. Your rule of thumb is two at a time — pausing one is fine, it\'ll keep.', await many('doing'));
  check('Exploring (now just one) has no note', (await many('exploring')) === null && (await head('exploring')) === 'Exploring 1');
  check('nothing was lost: the paused project is still paused and all seven are still saved', (await projects()).length === 7 && (await project('Board: paused hobby')).status === 'paused');

  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
  await go('projects', 2026, 10, 15, 14, 10);
  check('phone 390 px: the board does not scroll sideways', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  const moves = await ev(`[...document.querySelectorAll('#projectList [data-s=project-moves] button')].filter(b => b.getClientRects().length).map(b => ({ t: b.textContent.trim(), h: Math.round(b.getBoundingClientRect().height) }))`);
  check('phone 390 px: the move buttons are all at least 44 px tall', moves.length > 0 && moves.every(m => m.h >= 44), moves);
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[14] Recently on a project');
  await go('projects', 2026, 10, 15, 15); await reset(); await go('projects', 2026, 10, 15, 15);
  const tk = (id, title, created, extra = '') => `{ id: '${id}', title: '${title}', listId: '', category: 'Admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${created}', postponed: 0, blockers: [], letGoOn: null, projectId: 'pjR'${extra} }`;
  const nt = (id, title, created, updated) => `{ id: '${id}', categoryId: '', title: '${title}', text: 'made-up words', pinned: false, createdAt: '${created}', updatedAt: '${updated}', projectId: 'pjR' }`;
  await editStorage(`s => { s.projects.items.push(${mk('pjR', 'Recently: cake stall', 'act')}, ${mk('pjQ', 'Recently: empty one', 'capture')});
    s.tasks.items.push(${tk('tkOld', 'Bake test loaf', '2026-10-10T09:00', ", done: true, doneOn: '2026-10-14'")}, ${tk('tkNew', 'Price the flour', '2026-10-15T08:30')}, ${tk('tkX1', 'Oldest idea one', '2026-10-01T09:00')}, ${tk('tkX2', 'Oldest idea two', '2026-09-30T09:00')});
    s.notes.items.push(${nt('ntCh', 'Stall layout', '2026-10-13T10:00', '2026-10-15T09:00')}, ${nt('ntOld', 'Supplier list', '2026-10-12T10:00', '2026-10-12T10:00')}); }`);
  await go('projects/p/pjR', 2026, 10, 15, 15, 5);
  const rows = await ev(`[...document.querySelectorAll('#projectRecent [data-s=recent]')].map(li => ({ what: li.dataset.what, href: li.querySelector('a').getAttribute('href'), small: li.querySelectorAll('span')[0].textContent.trim(), title: li.querySelectorAll('span')[1].textContent.trim() }))`);
  check('Recently shows at most 5 rows when there are 7 happenings', rows.length === 5, rows.length);
  check('…newest first: note changed today, task added today, task done yesterday, the older note, then the first task added',
    eq(rows.map(r => r.what), ['note-changed', 'added', 'done', 'note', 'added']) && eq(rows.map(r => r.title), ['Stall layout', 'Price the flour', 'Bake test loaf', 'Supplier list', 'Bake test loaf']), rows);
  check('…with the right small lines (Today · Note changed, Today · Added, Yesterday · Done)', eq(rows.slice(0, 3).map(r => r.small), ['Today · Note changed', 'Today · Added', 'Yesterday · Done']), rows.slice(0, 3).map(r => r.small));
  check('…older ones show a date, not Today or Yesterday', rows.slice(3).every(r => !/^(Today|Yesterday)/.test(r.small)) && rows[3].small.endsWith(' · Note') && rows[4].small.endsWith(' · Added'), rows.slice(3).map(r => r.small));
  check('…each opens its task or note', eq(rows.map(r => r.href), ['#projects/notes/ntCh', '#today/tasks/tkNew', '#today/tasks/tkOld', '#projects/notes/ntOld', '#today/tasks/tkOld']), rows.map(r => r.href));
  check('…the two oldest tasks are left out', !rows.some(r => /Oldest idea/.test(r.title)));
  await go('projects/p/pjQ', 2026, 10, 15, 15, 10);
  check('a project with nothing in it has no Recently card', (await exists('#projectTitle')) && !(await exists('#projectRecent')));

  // ---- Milestones and Decisions on a project (1.31.0) ----
  const pjObj = (id, title, stage, extra = {}) => ({ id, title, summary: '', stage, status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-10T09:00', updatedAt: '2026-10-10T09:00', ...extra });
  const msObj = (id, title, aim = null, reachedOn = null) => ({ id, title, aim, reachedOn, createdAt: '2026-10-10T09:00' });
  const opObj = (id, text, pros = [], cons = []) => ({ id, text, pros, cons });
  const dcObj = (id, question, options, chosen = null, why = '', decidedOn = null, extra = {}) => ({ id, question, options, chosen, why, decidedOn, createdAt: '2026-10-10T09:00', updatedAt: '2026-10-10T09:00', ...extra });
  const seed = list => editStorage(`s => { s.projects.items.push(...${JSON.stringify(list)}); }`);
  const sel = id => ({ ms: `[data-s=milestone][data-id="${id}"]`, op: `[data-s=option][data-id="${id}"]` });
  const tabOf = () => ev(`(document.querySelector('[data-s=project-tabs] a[aria-selected=true]') || {}).dataset?.tab || null`);
  const pAt = id => projects().then(l => l.find(x => x.id === id));
  const msTitles = async id => ((await pAt(id)).milestones || []).map(m => m.title);
  const noBlame = async () => !/\b(late|overdue|behind)\b/i.test(await text('#app'));

  console.log('\n[15] A project\'s tabs: Overview, Milestones, Decisions');
  await go('projects', 2026, 10, 15, 16); await reset(); await go('projects', 2026, 10, 15, 16);
  await seed([pjObj('pjT', 'Tabs: garden shed', 'organise')]);
  for (const [suffix, tab, want, notWant] of [['', 'overview', '#projectHead', '#projectMilestones'], ['/milestones', 'milestones', '#projectMilestones', '#projectHead'], ['/decisions', 'decisions', '#projectDecisions', '#projectHead']]) {
    await go(`projects/p/pjT${suffix}`, 2026, 10, 15, 16, 5); await sleep(200);
    check(`opening #projects/p/pjT${suffix} shows the ${tab} tab (selected) and its content`, (await tabOf()) === tab && (await exists(want)) && !(await exists(notWant)) && (await text('#projectTitle')) === 'Tabs: garden shed', [await tabOf(), await hash()]);
  }
  check('the three tabs are tabs: Overview, Milestones, Decisions, in that order', eq(await ev(`[...document.querySelectorAll('[data-s=project-tabs] [role=tab]')].map(a => a.textContent.trim())`), ['Overview', 'Milestones', 'Decisions']));
  check('the Overview heading card is now titled "About it"', await (async () => { await go('projects/p/pjT', 2026, 10, 15, 16, 6); return (await text('#projectHead')).includes('About it'); })());
  await click('[data-s=project-tabs] a[data-tab=milestones]'); await sleep(250);
  check('tapping Milestones changes the address and the tab', (await hash()) === '#projects/p/pjT/milestones' && (await tabOf()) === 'milestones' && (await exists('#projectMilestones')), await hash());
  await click('[data-s=project-tabs] a[data-tab=decisions]'); await sleep(250);
  check('tapping Decisions changes the address and the tab', (await hash()) === '#projects/p/pjT/decisions' && (await tabOf()) === 'decisions' && (await exists('#projectDecisions')), await hash());
  await ev('history.back()'); await sleep(300);
  check('Back returns to the Milestones tab', (await hash()) === '#projects/p/pjT/milestones' && (await tabOf()) === 'milestones' && (await exists('#projectMilestones')), await hash());
  await go('projects/p/pjT', 2026, 10, 15, 16, 6); await sleep(200);
  await click('[data-s=project-tabs] a[data-tab=milestones]'); await sleep(250);
  await ev('history.back()'); await sleep(300);
  check('…and from the Overview, one tap on Milestones then Back returns to the Overview', (await hash()) === '#projects/p/pjT' && (await tabOf()) === 'overview' && (await exists('#projectHead')), await hash());
  await click('[data-s=project-tabs] a[data-tab=overview]'); await sleep(200);
  for (const suffix of ['/milestones', '/decisions']) {
    await go(`projects/p/pjT${suffix}`, 2026, 10, 15, 16, 7); await sleep(200);
    await ev('location.reload()'); await sleep(1500);
    check(`reloading on ${suffix} stays on that tab`, (await hash()) === `#projects/p/pjT${suffix}` && (await tabOf()) === suffix.slice(1), [await hash(), await tabOf()]);
  }
  await go('projects/p/pjT', 2026, 10, 15, 16, 8);
  await click('[data-action=project-explore]'); await sleep(400);
  check('the Explore link still opens Explore', (await hash()) === '#projects/p/pjT/explore' && (await exists('#explore-title')), await hash());
  await ev('history.back()'); await sleep(300);
  check('…and Back returns to the project\'s Overview', (await hash()) === '#projects/p/pjT' && (await exists('#projectTitle')), await hash());
  for (const suffix of ['', '/milestones', '/decisions']) {
    await go(`projects/p/pjNone${suffix}`, 2026, 10, 15, 16, 9); await sleep(200);
    check(`an unknown project at ${suffix || 'its Overview address'} still says "This project isn't here"`, (await text('#app')).includes("This project isn't here") && !(await exists('[data-s=project-tabs]')));
  }

  console.log('\n[16] The Milestones and Decisions rows on the Overview');
  await seed([
    pjObj('pjCe', 'Cards: empty one', 'capture'),
    pjObj('pjCp', 'Cards: in progress', 'organise', {
      milestones: [msObj('msP1', 'Draw the plan', null, '2026-10-10'), msObj('msP2', 'Book the builder', '2026-10-01'), msObj('msP3', 'Buy the paint', '2026-11-20')],
      decisions: [dcObj('dcP1', 'Which colour?', [opObj('opP1', 'Green')]), dcObj('dcP2', 'Which door?', []), dcObj('dcP3', 'Which roof?', []), dcObj('dcP4', 'Which lock?', []), dcObj('dcP5', 'Which path?', [], null, '', null, { createdAt: '2026-10-11T09:00' })],
    }),
    pjObj('pjCf', 'Cards: finished', 'act', {
      milestones: [msObj('msF1', 'Dig the hole', null, '2026-10-08'), msObj('msF2', 'Pour the base', null, '2026-10-12')],
      decisions: [dcObj('dcF1', 'Which size?', [opObj('opF1', 'Small'), opObj('opF2', 'Large')], 'opF1', 'Fits the corner', '2026-10-14')],
    }),
    pjObj('pjCa', 'Cards: next with a future date', 'organise', { milestones: [msObj('msA1', 'Choose a site', '2026-11-05')] }),
  ]);
  await go('projects/p/pjCe', 2026, 10, 15, 16, 10);
  check('an empty project\'s Milestones row invites you to add the first one', (await text('#projectGlance [data-s=glance-route] [data-s=ms-summary]')) === 'Milestones are the big markers on the way — add the first one', await text('#projectGlance [data-s=glance-route]'));
  check('…and its Decisions row asks "Is there a choice to make?"', (await text('#projectGlance [data-s=glance-decisions] [data-s=dc-summary]')) === 'Is there a choice to make? Add a decision', await text('#projectGlance [data-s=glance-decisions]'));
  check('…each row links to its tab', (await ev(`document.querySelector('#projectGlance [data-s=glance-route] h4 a').getAttribute('href')`)) === '#projects/p/pjCe/milestones' && (await ev(`document.querySelector('#projectGlance [data-s=glance-decisions] h4 a').getAttribute('href')`)) === '#projects/p/pjCe/decisions');
  await click('#projectGlance [data-s=glance-route] h4 a'); await sleep(250);
  check('…tapping the Milestones row opens the Milestones tab', (await hash()) === '#projects/p/pjCe/milestones' && (await tabOf()) === 'milestones', await hash());
  await go('projects/p/pjCe', 2026, 10, 15, 16, 11);
  await click('#projectGlance [data-s=glance-decisions] h4 a'); await sleep(250);
  check('…and the Decisions row opens the Decisions tab', (await hash()) === '#projects/p/pjCe/decisions' && (await tabOf()) === 'decisions', await hash());
  await go('projects/p/pjCp', 2026, 10, 15, 16, 12);
  const msSum = await text('#projectGlance [data-s=glance-route] [data-s=ms-summary]');
  check('in progress: "1 of 3 milestones reached · Next: <the first not reached>", with its passed date said gently', /^1 of 3 milestones reached · Next: Book the builder \(aimed for .*1 Oct\)$/.test(msSum), msSum);
  check('…open decisions are listed (three, then "and 2 more"), each linking to the Decisions tab, in place of the summary', (await ev(`document.querySelectorAll('#projectGlance [data-s=glance-decisions] [data-s=dc-open] li a').length`)) === 3
    && (await text('#projectGlance [data-s=glance-decisions] [data-s=dc-open]')).includes('and 2 more') && (await ev(`document.querySelector('#projectGlance [data-s=glance-decisions] [data-s=dc-open] a').getAttribute('href')`)) === '#projects/p/pjCp/decisions' && !(await exists('#projectGlance [data-s=glance-decisions] [data-s=dc-summary]')), await text('#projectGlance [data-s=glance-decisions]'));
  check('…the newest open question comes first', (await ev(`document.querySelector('#projectGlance [data-s=glance-decisions] [data-s=dc-open] li a').textContent`)) === 'Which path?');
  check('…nothing on the Overview says late, overdue or behind', await noBlame(), await text('#app'));
  await go('projects/p/pjCa', 2026, 10, 15, 16, 13);
  check('a date still to come reads "Next: … (aiming for …)"', /^0 of 1 milestones reached · Next: Choose a site \(aiming for .*5 Nov\)$/.test(await text('#projectGlance [data-s=glance-route] [data-s=ms-summary]')), await text('#projectGlance [data-s=glance-route] [data-s=ms-summary]'));
  await go('projects/p/pjCf', 2026, 10, 15, 16, 14);
  check('all reached: "All 2 milestones reached."', (await text('#projectGlance [data-s=glance-route] [data-s=ms-summary]')) === 'All 2 milestones reached.', await text('#projectGlance [data-s=glance-route] [data-s=ms-summary]'));
  check('…and a decided decision: "Decided <date>: <option>"', /^Decided .*14 Oct: Small$/.test(await text('#projectGlance [data-s=glance-decisions] [data-s=dc-summary]')) && !(await exists('#projectGlance [data-s=glance-decisions] [data-s=dc-open]')), await text('#projectGlance [data-s=glance-decisions]'));
  await go('projects/p/pjCp/milestones', 2026, 10, 15, 16, 15);
  check('on the Milestones tab a passed date reads "Aimed for … — change it whenever it suits", never late, overdue or behind', (await text(`${sel('msP2').ms} [data-s=ms-when]`)).startsWith('Aimed for ') && (await text(`${sel('msP2').ms} [data-s=ms-when]`)).endsWith('change it whenever it suits') && (await noBlame()), await text(`${sel('msP2').ms} [data-s=ms-when]`));
  check('…and a date to come reads "Aiming for …"', (await text(`${sel('msP3').ms} [data-s=ms-when]`)).startsWith('Aiming for '));
  await go('projects/p/pjCp/decisions', 2026, 10, 15, 16, 16);
  check('the Decisions tab says nothing late, overdue or behind either', await noBlame());

  console.log('\n[17] Milestones: add, reach, undo, edit, move, remove');
  await seed([pjObj('pjM', 'Milestones: village hall', 'organise')]);
  await go('projects/p/pjM/milestones', 2026, 10, 15, 17);
  check('a project with none says what milestones are, and asks for the first', (await text('[data-s=ms-progress]')).includes('The big markers on the way') && (await text('#projectMilestones')).includes('Add the first milestone') && !(await exists('[data-s=milestone]')));
  check('"Add" waits for a title', await ev(`document.querySelector('[data-action=ms-add]').disabled`));
  await type('#msNew', '  Shortlist three halls  '); await click('[data-action=ms-add]'); await sleep(300);
  check('the first milestone is added (title trimmed, no date, not reached); the form is empty again; a kind message', eq(((await pAt('pjM')).milestones || []).map(m => [m.title, m.aim, m.reachedOn]), [['Shortlist three halls', null, null]]) && (await ev(`document.getElementById('msNew').value`)) === '' && (await toast()) === 'Milestone added.', await pAt('pjM'));
  await type('#msNew', 'Book the hall'); await type('#msNewAim', '2026-11-20'); await click('[data-action=ms-add]'); await sleep(300);
  let pm = await pAt('pjM');
  const [M1, M2] = pm.milestones.map(m => m.id);
  check('a second one, with a date to aim for, goes after the first', eq(pm.milestones.map(m => [m.title, m.aim, m.reachedOn]), [['Shortlist three halls', null, null], ['Book the hall', '2026-11-20', null]]), pm.milestones);
  check('"0 of 2 reached", and the first is marked Next (only it)', (await text('[data-s=ms-progress]')) === '0 of 2 reached' && (await ev(`document.querySelectorAll('[data-s=ms-next]').length`)) === 1 && (await exists(`${sel(M1).ms} [data-s=ms-next]`)));
  check('…the one with a date says "Aiming for …20 Nov"; the other says nothing about dates', /^Aiming for .*20 Nov$/.test(await text(`${sel(M2).ms} [data-s=ms-when]`)) && !(await exists(`${sel(M1).ms} [data-s=ms-when]`)));
  await click(`${sel(M1).ms} [data-action=ms-reach]`); await sleep(300);
  pm = await pAt('pjM');
  check('reaching the first one: today\'s date is saved, a kind message', pm.milestones[0].reachedOn === '2026-10-15' && (await toast()) === 'Milestone reached — lovely.', [pm.milestones[0], await toast()]);
  check('…it shows "Reached …15 Oct" and is marked reached; progress is "1 of 2 reached"; Next moves to the second', /^Reached .*15 Oct$/.test(await text(`${sel(M1).ms} [data-s=ms-when]`)) && (await ev(`document.querySelector('${sel(M1).ms}').dataset.reached`)) === 'yes'
    && (await text('[data-s=ms-progress]')) === '1 of 2 reached' && (await exists(`${sel(M2).ms} [data-s=ms-next]`)) && !(await exists(`${sel(M1).ms} [data-s=ms-next]`)));
  await go('projects/p/pjM', 2026, 10, 15, 17, 5);
  check('the Overview row follows: "1 of 2 milestones reached · Next: Book the hall"', (await text('#projectGlance [data-s=glance-route] [data-s=ms-summary]')).startsWith('1 of 2 milestones reached · Next: Book the hall'), await text('#projectGlance [data-s=glance-route] [data-s=ms-summary]'));
  await go('projects/p/pjM/milestones', 2026, 10, 15, 17, 6);
  await click(`${sel(M1).ms} [data-action=ms-unreach]`); await sleep(300);
  check('"Not yet" undoes it: not reached, the date goes, Next is back on the first, a kind message', (await pAt('pjM')).milestones[0].reachedOn === null && (await text('[data-s=ms-progress]')) === '0 of 2 reached' && (await exists(`${sel(M1).ms} [data-s=ms-next]`)) && (await toast()) === 'Back to not reached yet.', await toast());
  await click(`${sel(M1).ms} [data-action=ms-edit]`); await sleep(200);
  check('"Edit" opens the title and date fields, with up / down / remove', (await exists(`${sel(M1).ms} [data-s=ms-editor]`)) && (await exists(`${sel(M1).ms} [data-action=ms-up]`)) && (await exists(`${sel(M1).ms} [data-action=ms-remove]`)) && !(await exists(`${sel(M1).ms} [data-action=ms-clear-aim]`)));
  check('…the first can\'t move up, and the last can\'t move down', (await ev(`document.querySelector('${sel(M1).ms} [data-action=ms-up]').disabled`)) && !(await ev(`document.querySelector('${sel(M1).ms} [data-action=ms-down]').disabled`)));
  await type(`#msT-${M1}`, 'Shortlist two halls'); await sleep(250);
  await type(`#msA-${M1}`, '2026-11-01'); await sleep(250);
  pm = await pAt('pjM');
  check('editing the title and the date saves them', pm.milestones[0].title === 'Shortlist two halls' && pm.milestones[0].aim === '2026-11-01', pm.milestones[0]);
  check('…and the list shows them', /Shortlist two halls/.test(await text(sel(M1).ms)) && /^Aiming for .*1 Nov$/.test(await text(`${sel(M1).ms} [data-s=ms-when]`)));
  await type(`#msT-${M1}`, '   '); await sleep(250);
  check('an empty title is put back, not saved', (await pAt('pjM')).milestones[0].title === 'Shortlist two halls' && (await ev(`document.getElementById('msT-${M1}').value`)) === 'Shortlist two halls');
  await click(`${sel(M1).ms} [data-action=ms-clear-aim]`); await sleep(250);
  check('"Clear the date" takes the date off, and the line goes', (await pAt('pjM')).milestones[0].aim === null && !(await exists(`${sel(M1).ms} [data-s=ms-when]`)) && !(await exists(`${sel(M1).ms} [data-action=ms-clear-aim]`)));
  await click(`${sel(M1).ms} [data-action=ms-down]`); await sleep(250);
  check('"Down" swaps it with the next one', eq((await msTitles('pjM')), ['Book the hall', 'Shortlist two halls']) && (await exists(`${sel(M2).ms} [data-s=ms-next]`)), await msTitles('pjM'));
  await click(`${sel(M1).ms} [data-action=ms-up]`); await sleep(250);
  check('"Up" puts it back', eq((await msTitles('pjM')), ['Shortlist two halls', 'Book the hall']), await msTitles('pjM'));
  await click(`${sel(M1).ms} [data-action=ms-remove]`); await sleep(250);
  check('"Remove" asks first: "Remove this milestone?"', (await text('dialog[open]')).includes('Remove this milestone?') && (await text('dialog[open]')).includes('Shortlist two halls'), await text('dialog[open]'));
  await answer(false);
  check('…"Keep it" keeps it', eq((await msTitles('pjM')), ['Shortlist two halls', 'Book the hall']));
  await click(`${sel(M1).ms} [data-action=ms-remove]`); await answer(true);
  check('…removing it after confirming takes it out (and says so)', eq((await msTitles('pjM')), ['Book the hall']) && (await toast()) === 'Milestone removed.' && !(await exists(sel(M1).ms)), await msTitles('pjM'));
  await click(`${sel(M2).ms} [data-action=ms-edit]`); await click(`${sel(M2).ms} [data-action=ms-remove]`); await answer(true);
  check('removing the last one takes the list away again (a project with none is saved as before)', !('milestones' in (await pAt('pjM'))) && (await text('[data-s=ms-progress]')).includes('The big markers on the way'), await pAt('pjM'));
  await type('#msNew', 'Half-written milestone'); await type('#msNewAim', '2026-12-01');
  await click('[data-s=project-tabs] a[data-tab=decisions]'); await sleep(250);
  await click('[data-s=project-tabs] a[data-tab=milestones]'); await sleep(250);
  check('what you typed in the add fields (not yet added) is still there after visiting Decisions', (await ev(`document.getElementById('msNew').value`)) === 'Half-written milestone' && (await ev(`document.getElementById('msNewAim').value`)) === '2026-12-01' && !('milestones' in (await pAt('pjM'))));
  await click('[data-s=project-tabs] a[data-tab=decisions]'); await sleep(250);
  await type('#dcNew', 'Half-written question');
  await click('[data-s=project-tabs] a[data-tab=overview]'); await sleep(250);
  await click('[data-s=project-tabs] a[data-tab=decisions]'); await sleep(250);
  check('…and the same for a question typed on the Decisions tab', (await ev(`document.getElementById('dcNew').value`)) === 'Half-written question');
  await seed([pjObj('pjM30', 'Milestones: thirty', 'organise', { milestones: Array.from({ length: 30 }, (_, i) => msObj('msN' + i, 'Step ' + (i + 1))) })]);
  await go('projects/p/pjM30/milestones', 2026, 10, 15, 17, 10);
  check('at 30 milestones: "That\'s 30 — plenty to steer by. Remove one to add another." and no add form', (await text('[data-s=ms-full]')) === "That's 30 — plenty to steer by. Remove one to add another." && !(await exists('#msNew')) && !(await exists('[data-action=ms-add]')) && (await text('[data-s=ms-progress]')) === '0 of 30 reached', await text('[data-s=ms-progress]'));
  await click(`${sel('msN3').ms} [data-action=ms-edit]`); await click(`${sel('msN3').ms} [data-action=ms-remove]`); await answer(true);
  check('…removing one brings the add form back', (await exists('#msNew')) && !(await exists('[data-s=ms-full]')) && (await pAt('pjM30')).milestones.length === 29);

  console.log('\n[18] Decisions: options, pros and cons, choosing, thinking again');
  await seed([pjObj('pjDc', 'Decisions: shed', 'decide')]);
  await go('projects/p/pjDc/decisions', 2026, 10, 15, 18);
  check('the hint says two or three options are plenty, pros and cons, no scores', (await text('[data-s=dc-hint]')).includes('Two or three options are plenty') && (await text('[data-s=dc-hint]')).includes('no scores') && !(await exists('[data-s=decision]')));
  check('"Add" waits for a question', await ev(`document.querySelector('[data-action=dc-add]').disabled`));
  await type('#dcNew', 'Which size of shed?'); await click('[data-action=dc-add]'); await sleep(300);
  let dcs = (await pAt('pjDc')).decisions;
  const DC = dcs[0].id;
  check('adding a question: an open decision with no options yet, the form emptied, a kind message', dcs.length === 1 && dcs[0].question === 'Which size of shed?' && eq(dcs[0].options, []) && dcs[0].chosen === null && (await toast()) === 'Decision added — now the options.' && (await ev(`document.getElementById('dcNew').value`)) === '', dcs);
  check('…shown as Open, inviting the first option', (await text('[data-s=decision] [data-s=dc-state]')) === 'Open' && (await ev(`document.querySelector('[data-s=decision]').dataset.state`)) === 'open' && (await text('[data-s=decision]')).includes('No options yet'));
  await type(`#dcOpt-${DC}`, 'Small'); await click('[data-s=decision] [data-action=opt-add]'); await sleep(250);
  await type(`#dcOpt-${DC}`, 'Large'); await click('[data-s=decision] [data-action=opt-add]'); await sleep(250);
  dcs = (await pAt('pjDc')).decisions;
  const [OS, OL] = dcs[0].options.map(o => o.id);
  check('two options are added, in order, with no pros or cons', eq(dcs[0].options.map(o => [o.text, o.pros, o.cons]), [['Small', [], []], ['Large', [], []]]), dcs[0].options);
  check('…each has "Choose this"', (await exists(`${sel(OS).op} [data-action=opt-choose]`)) && (await exists(`${sel(OL).op} [data-action=opt-choose]`)));
  for (const line of ['Cheap', 'Fits the corner']) {
    if (!(await exists(`${sel(OS).op} [data-s=pros] form`))) { await click(`${sel(OS).op} [data-s=pros] [data-action=pro-add]`); await sleep(150); }
    await type(`${sel(OS).op} [data-s=pros] form input`, line); await click(`${sel(OS).op} [data-action=pro-save]`); await sleep(250);
  }
  await click(`${sel(OS).op} [data-s=cons] [data-action=con-add]`); await sleep(150);
  await type(`${sel(OS).op} [data-s=cons] form input`, 'Only small tools'); await click(`${sel(OS).op} [data-action=con-save]`); await sleep(250);
  await click(`${sel(OL).op} [data-s=cons] [data-action=con-add]`); await sleep(150);
  await type(`${sel(OL).op} [data-s=cons] form input`, 'Costs more'); await click(`${sel(OL).op} [data-action=con-save]`); await sleep(250);
  dcs = (await pAt('pjDc')).decisions;
  check('pros and cons are added to each option (no scores)', eq(dcs[0].options.map(o => [o.pros, o.cons]), [[['Cheap', 'Fits the corner'], ['Only small tools']], [[], ['Costs more']]]), dcs[0].options);
  check('…and listed as lines under Pros and Cons', (await ev(`document.querySelectorAll('${sel(OS).op} [data-s=pros] [data-s=point]').length`)) === 2 && (await ev(`document.querySelectorAll('${sel(OL).op} [data-s=cons] [data-s=point]').length`)) === 1 && !/\d+\s*\/\s*\d+|score/i.test(await text('[data-s=decision]')));
  await click(`${sel(OS).op} [data-s=pros] [data-s=point]:nth-child(2) [data-action=point-remove]`); await sleep(250);
  check('removing a point takes only that line away', eq((await pAt('pjDc')).decisions[0].options[0].pros, ['Cheap']), (await pAt('pjDc')).decisions[0].options[0].pros);
  await click(`${sel(OL).op} [data-action=opt-choose]`); await sleep(200);
  check('"Choose this" asks "Why this one? (optional)" with Decide and Cancel, and decides nothing yet', (await exists(`${sel(OL).op} [data-s=dc-choosing]`)) && (await text(`${sel(OL).op} [data-s=dc-choosing]`)).includes('Why this one? (optional)') && (await exists('[data-action=dc-decide]')) && (await exists('[data-action=dc-cancel]')) && (await pAt('pjDc')).decisions[0].chosen === null);
  await click('[data-action=dc-cancel]'); await sleep(200);
  check('"Cancel" closes it, and nothing is decided', !(await exists('[data-s=dc-choosing]')) && (await pAt('pjDc')).decisions[0].chosen === null);
  await click(`${sel(OL).op} [data-action=opt-choose]`); await sleep(200);
  await type(`#dcWhy-${DC}`, 'Room for the mower');
  await ev(`window.historySaveItem = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === '${KEY}') throw new DOMException('Synthetic full storage', 'QuotaExceededError'); return window.historySaveItem.call(this, k, v); };`);
  await click('[data-action=dc-decide]'); await sleep(200);
  check('if saving fails, Decide leaves the decision open and the written reason available to retry', (await pAt('pjDc')).decisions[0].chosen === null && (await exists('[data-s=dc-choosing]')) && (await ev(`document.getElementById('dcWhy-${DC}').value`)) === 'Room for the mower' && /Couldn.t save/.test(await toast()));
  await ev('Storage.prototype.setItem = window.historySaveItem; delete window.historySaveItem;');
  await click('[data-action=dc-decide]'); await sleep(300);
  let dd = (await pAt('pjDc')).decisions[0];
  check('deciding saves the option, the reason and today', dd.chosen === OL && dd.why === 'Room for the mower' && dd.decidedOn === '2026-10-15' && (await toast()) === 'Decided. It can change later.', dd);
  check('…the card shows "Decided …15 Oct: Large" and the reason', /^Decided .*15 Oct: Large$/.test(await text('[data-s=dc-decided] p')) && (await text('[data-s=dc-why]')) === 'Room for the mower' && /^Decided .*15 Oct$/.test(await text('[data-s=dc-state]')) && (await ev(`document.querySelector('[data-s=decision]').dataset.state`)) === 'decided');
  check('…the chosen option is marked, and the other says "Not chosen"', (await ev(`document.querySelector('${sel(OL).op}').dataset.chosen`)) === 'yes' && (await text(`${sel(OL).op} [data-s=opt-chosen]`)) === 'Chosen' && (await text(`${sel(OS).op} [data-s=opt-not]`)) === 'Not chosen' && !(await exists(`${sel(OS).op} [data-action=opt-choose]`)));
  check('the project is at Decide: "Move this project to Doing?" is offered, but nothing has moved by itself', (await exists('[data-s=dc-to-doing]')) && (await text('[data-s=dc-to-doing]')).includes('Move this project to Doing?') && (await pAt('pjDc')).stage === 'decide');
  await ev(`window.historySaveItem = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === '${KEY}') throw new DOMException('Synthetic full storage', 'QuotaExceededError'); return window.historySaveItem.call(this, k, v); };`);
  await click('[data-action=dc-again]'); await sleep(200);
  check('if history cannot be saved, Think again keeps the existing choice on screen and in storage', (await pAt('pjDc')).decisions[0].chosen === OL && (await exists('[data-s=dc-decided]')) && !(await exists('[data-s=dc-history]')) && /Couldn.t save/.test(await toast()));
  await ev('Storage.prototype.setItem = window.historySaveItem; delete window.historySaveItem;');
  await click('[data-action=dc-again]'); await sleep(300);
  dd = (await pAt('pjDc')).decisions[0];
  check('"Think again" opens it again, keeping the question, options, pros, cons and reason; the last choice is remembered', dd.chosen === null && dd.decidedOn === null && dd.why === 'Room for the mower' && dd.options.length === 2 && eq(dd.options[0].pros, ['Cheap']) && dd.lastChoice && dd.lastChoice.text === 'Large' && dd.lastChoice.on === '2026-10-15', dd);
  check('…it says what you chose last time, and that your reasons are kept, and offers "Choose this" again', (await text('[data-s=dc-last]')).includes('Last time you chose “Large”') && (await text('[data-s=dc-last]')).includes('Your reasons are kept') && (await exists(`${sel(OS).op} [data-action=opt-choose]`)) && !(await exists('[data-s=dc-to-doing]')) && !(await exists('[data-s=dc-decided]')), await text('[data-s=dc-last]'));
  check('previous choices are available in a closed disclosure, keeping the options easy to reach', (await text('[data-s=dc-history] summary')) === 'Previous choices (1)' && !(await ev(`document.querySelector('[data-s=dc-history]').open`)) && dd.history[0].why === 'Room for the mower');
  await ev(`document.querySelector('[data-s=dc-history] summary').focus()`);
  await T.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await T.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  const historyOpened = await until(`document.querySelector('[data-s=dc-history]').open`);
  check('the disclosure opens from the keyboard and shows the choice, full date and reason', historyOpened && /Large.*15 Oct 2026.*Room for the mower/s.test(await text('[data-s=dc-history-entry]')), await ev(`({ open: document.querySelector('[data-s=dc-history]').open, focused: document.activeElement?.tagName, text: document.querySelector('[data-s=dc-history-entry]').innerText })`));
  await click(`${sel(OS).op} [data-action=opt-choose]`); await sleep(200);
  check('choosing again offers the reason you kept', (await ev(`document.getElementById('dcWhy-${DC}').value`)) === 'Room for the mower');
  await type(`#dcWhy-${DC}`, 'Changed my mind: the corner is tight'); await click('[data-action=dc-decide]'); await sleep(300);
  dd = (await pAt('pjDc')).decisions[0];
  check('deciding again keeps the new choice and reason', dd.chosen === OS && dd.why === 'Changed my mind: the corner is tight', dd);
  check('choosing again cannot overwrite the previous reason', dd.history.length === 1 && dd.history[0].text === 'Large' && dd.history[0].why === 'Room for the mower');
  await click(`${sel(OS).op} [data-action=opt-remove]`); await sleep(250);
  check('removing an option asks first', (await text('dialog[open]')).includes('Remove this option?'), await text('dialog[open]'));
  await answer(true);
  dd = (await pAt('pjDc')).decisions[0];
  check('removing the chosen option reopens the decision, and the message says so', dd.chosen === null && dd.options.length === 1 && dd.options[0].id === OL && /it was your choice, so this decision is open again/.test(await toast()) && (await ev(`document.querySelector('[data-s=decision]').dataset.state`)) === 'open', [dd, await toast()]);
  check('a removed chosen option remains in history, with the latest choice first even on the same day', eq(dd.history.map(h => [h.text, h.why]), [['Large', 'Room for the mower'], ['Small', 'Changed my mind: the corner is tight']]) && eq(await ev(`[...document.querySelectorAll('[data-s=dc-history-entry] > p:first-child')].map(e => e.textContent)`), ['Small', 'Large']));
  await click(`${sel(OL).op} [data-action=opt-choose]`); await sleep(200);
  await click('[data-action=dc-decide]'); await sleep(300);
  dd = (await pAt('pjDc')).decisions[0];
  check('a decision with a single option can be decided (a yes or no), with no reason', dd.chosen === OL && dd.why !== undefined && (await ev(`document.querySelector('[data-s=decision]').dataset.state`)) === 'decided', dd);
  await click('[data-action=dc-to-doing]'); await sleep(300);
  check('"Move it" moves the project to Doing (stage Act) — only when tapped — and says so', (await pAt('pjDc')).stage === 'act' && (await toast()) === 'Moved to Doing.' && !(await exists('[data-s=dc-to-doing]')), [(await pAt('pjDc')).stage, await toast()]);
  await seed([pjObj('pjDx', 'Decisions: other stage', 'explore', { decisions: [dcObj('dcX', 'Which tea?', [opObj('opX', 'Green')], 'opX', '', '2026-10-14')] })]);
  await go('projects/p/pjDx/decisions', 2026, 10, 15, 18, 5);
  check('on a project that isn\'t at Decide, a decided decision doesn\'t offer to move it', (await exists('[data-s=dc-decided]')) && !(await exists('[data-s=dc-to-doing]')) && (await pAt('pjDx')).stage === 'explore');
  await click('[data-action=dc-remove]'); await sleep(250);
  check('removing a whole decision asks first ("Keep it" keeps it)', (await text('dialog[open]')).includes('Remove this decision?'), await text('dialog[open]'));
  await answer(false);
  check('…and it is still there', (await pAt('pjDx')).decisions?.length === 1);
  await click('[data-action=dc-remove]'); await answer(true);
  check('…removing it takes the list away again', !('decisions' in (await pAt('pjDx'))) && (await toast()) === 'Decision removed.', await pAt('pjDx'));
  await seed([pjObj('pjD12', 'Decisions: twelve', 'decide', { decisions: Array.from({ length: 12 }, (_, i) => dcObj('dcT' + i, 'Question ' + (i + 1), [])) })]);
  await go('projects/p/pjD12/decisions', 2026, 10, 15, 18, 10);
  await until(`!!document.querySelector('[data-s=dc-full]')`);
  check('at 12 decisions: "That\'s 12 decisions — plenty for one project. Remove one to add another." and no add form', (await text('[data-s=dc-full]')) === "That's 12 decisions — plenty for one project. Remove one to add another." && !(await exists('#dcNew')) && (await ev(`document.querySelectorAll('[data-s=decision]').length`)) === 12, await text('[data-s=dc-full]'));

  await seed([pjObj('pjD10', 'Decisions: reading corner', 'decide', { decisions: [dcObj('dc10', 'Which chair?', [
    opObj('op10', 'Restore the spare chair', Array.from({ length: 9 }, (_, i) => `Pro ${i + 1}`), Array.from({ length: 9 }, (_, i) => `Con ${i + 1}`)),
    opObj('op11', 'Buy a compact chair'), opObj('op12', 'Try a stool'), opObj('op13', 'Keep looking'),
  ])] })]);
  await go('projects/p/pjD10/decisions', 2026, 10, 15, 18, 11);
  check('four options are shown and no fifth can be added', (await ev(`document.querySelectorAll('[data-s=option]').length`)) === 4 && (await exists('[data-s=opt-full]')) && !(await exists('[data-s=opt-add-form]')));
  for (const side of ['pro', 'con']) {
    await click(`${sel('op10').op} [data-action=${side}-add]`);
    await type(`${sel('op10').op} [data-s=${side}s] form input`, `${side} 10`);
    await click(`${sel('op10').op} [data-action=${side}-save]`); await sleep(150);
    check(`the tenth ${side} is saved, with a clear limit and no eleventh add control`, (await pAt('pjD10')).decisions[0].options[0][side + 's'].length === 10 && (await text(`${sel('op10').op} [data-s=${side}s] [data-s=points-full]`)).startsWith(`Ten ${side}s`) && !(await exists(`${sel('op10').op} [data-action=${side}-add]`)));
  }
  await go('projects/p/pjD10/decisions', 2026, 10, 15, 18, 12);
  check('all ten pros and ten cons survive a reload and are displayed', (await ev(`document.querySelectorAll('${sel('op10').op} [data-s=pros] [data-s=point]').length`)) === 10 && (await ev(`document.querySelectorAll('${sel('op10').op} [data-s=cons] [data-s=point]').length`)) === 10);
  await click(`${sel('op10').op} [data-s=pros] [data-action=point-remove]`); await sleep(150);
  check('removing one point makes room to add another without affecting the other side', (await pAt('pjD10')).decisions[0].options[0].pros.length === 9 && (await pAt('pjD10')).decisions[0].options[0].cons.length === 10 && (await exists(`${sel('op10').op} [data-action=pro-add]`)));

  await seed([pjObj('pjDSize', 'Decision history at the project allowance', 'decide', {
    decisions: [dcObj('dcSize', 'Which size?', [opObj('opSize', 'Small')], 'opSize', 'A'.repeat(600), '2026-10-14')],
  })]);
  await editStorage(`s => { const p = s.projects.items.find(x => x.id === 'pjDSize'); const d = p.decisions[0]; d.futurePadding = ''; d.futurePadding = 'x'.repeat(380000); }`);
  await go('projects/p/pjDSize/decisions', 2026, 10, 15, 18, 15);
  const sizeBefore = await pAt('pjDSize');
  await click('[data-action=dc-again]'); await sleep(150);
  check('at the byte allowance, Think again explains that nothing changed and keeps the choice and all content', eq(await pAt('pjDSize'), sizeBefore) && (await exists('[data-s=dc-decided]')) && /too large.*Nothing changed/.test(await toast()));
  await click('[data-action=opt-remove]'); await answer(true);
  check('removing the chosen option shrinks its core and keeps the complete reason in a separate snapshot', !(await pAt('pjDSize')).decisions[0].options.length && (await pAt('pjDSize')).decisions[0].history[0].why.length === 600);
  await editStorage(`s => { delete s.projects.items.find(x => x.id === 'pjDSize').decisions[0].futurePadding; }`);

  console.log('\n[19] Nothing happens by itself');
  await seed([pjObj('pjN', 'Quiet: allotment', 'organise', { nextTaskId: 'tkQ1' })]);
  await editStorage(`s => { s.days['${K}'] = { energy: 3, rest: false, builtAt: '${K}T08:00', checkedIn: false, tasks: [{ uid: 'uQ1', taskId: null, category: 'admin', title: 'Quiet: a task on the plan', minutes: 15, baseMinutes: 15, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null }] };
    s.tasks.items.push({ id: 'tkQ1', title: 'Quiet: call the council', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-10T09:00', postponed: 0, blockers: [], letGoOn: null, projectId: 'pjN' });
    s.notes.items.push({ id: 'ntQ1', categoryId: '', title: 'Quiet note', text: 'made-up words', pinned: false, createdAt: '2026-10-10T09:00', updatedAt: '2026-10-10T09:00', projectId: 'pjN' }); }`);
  const quiet = async () => { const d = await data(), p = d.projects.items.find(x => x.id === 'pjN'); return { days: d.days, tasks: d.tasks, notes: d.notes, queue: d.queue, commitments: d.commitments, stage: p.stage, status: p.status, nextTaskId: p.nextTaskId, commitmentIds: p.commitmentIds, others: d.projects.items.filter(x => x.id !== 'pjN') }; };
  await go('projects/p/pjN/milestones', 2026, 10, 15, 19);
  const quietBefore = await quiet();
  await type('#msNew', 'Clear the weeds'); await click('[data-action=ms-add]'); await sleep(250);
  await type('#msNew', 'Dig the beds'); await type('#msNewAim', '2026-10-20'); await click('[data-action=ms-add]'); await sleep(250);
  const qm = (await pAt('pjN')).milestones.map(m => m.id);
  await click(`${sel(qm[0]).ms} [data-action=ms-reach]`); await sleep(250);
  await click(`${sel(qm[1]).ms} [data-action=ms-reach]`); await sleep(250);
  await click('[data-s=project-tabs] a[data-tab=decisions]'); await sleep(250);
  await type('#dcNew', 'Raised beds or flat?'); await click('[data-action=dc-add]'); await sleep(250);
  const qd = (await pAt('pjN')).decisions[0].id;
  await type(`#dcOpt-${qd}`, 'Raised'); await click('[data-s=decision] [data-action=opt-add]'); await sleep(250);
  const qo = (await pAt('pjN')).decisions[0].options[0].id;
  await click(`${sel(qo).op} [data-action=opt-choose]`); await sleep(200); await click('[data-action=dc-decide]'); await sleep(300);
  const quietAfter = await quiet();
  check('reaching milestones and deciding changed nothing else: the day plans, the tasks, the notes, the queue and the Calendar are as they were', ['days', 'tasks', 'notes', 'queue', 'commitments', 'others'].every(k => eq(quietAfter[k], quietBefore[k])), Object.keys(quietBefore).filter(k => !eq(quietAfter[k], quietBefore[k])));
  check('…and the project\'s stage, status, next step and appointments are as they were', quietAfter.stage === 'organise' && quietAfter.status === 'active' && quietAfter.nextTaskId === 'tkQ1' && eq(quietAfter.commitmentIds, []));
  check('…the milestones and decision were saved though', (await pAt('pjN')).milestones.every(m => m.reachedOn === '2026-10-15') && (await pAt('pjN')).decisions[0].chosen === qo);
  await go('today', 2026, 10, 15, 19, 5);
  const todayText = await text('#app');
  check('Today shows nothing new: no milestone or decision on it, and the plan is the one task it had', !/Clear the weeds|Dig the beds|Raised beds/.test(todayText) && eq((await data()).days[K].tasks.map(t => t.title), ['Quiet: a task on the plan']), todayText.slice(0, 200));

  console.log('\n[20] Export and import');
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  const beforeExport = (await data()).projects;
  await click('[data-action=export]'); await sleep(1200);
  const exp2 = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-15.json', 'utf8'));
  check('"Export my data" includes the milestones and decisions of every project', eq(exp2.data.projects, beforeExport) && exp2.data.projects.items.some(x => x.id === 'pjN' && x.milestones.length === 2 && x.decisions.length === 1) && exp2.data.projects.items.some(x => x.id === 'pjDc' && x.decisions[0].options.length === 1), exp2.data.projects.items.length);
  await reset(); await go('today', 2026, 10, 15, 19, 10);
  check('after a reset there are none', (await projects()).length === 0);
  await setFile(S + '/dl/myday-export-2026-10-15.json'); await sleep(200); await answer(true);
  const imported = (await data()).projects;
  check('importing the backup brings every project back exactly, milestones and decisions included', eq(imported, exp2.data.projects) && eq(imported, beforeExport), imported.items.length);
  check('export and restore include all previous choices and their independent reasons', eq(imported.items.find(p => p.id === 'pjDc').decisions[0].history.map(h => [h.text, h.why]), [['Large', 'Room for the mower'], ['Small', 'Changed my mind: the corner is tight']]));
  T.setUrl('index.html#today'); await openAt(2026, 10, 15, 19, 12);
  await click('#themeBtn'); await sleep(300);
  check('the classic app preserves new decision history unread when it saves', eq((await data()).projects, imported));
  await go('projects/p/pjN/milestones', 2026, 10, 15, 19, 15);
  check('…and they show on the tabs', (await text('[data-s=ms-progress]')) === '2 of 2 reached' && (await ev(`document.querySelectorAll('[data-s=milestone]').length`)) === 2);
  await go('projects/p/pjN/decisions', 2026, 10, 15, 19, 16);
  check('…and the decision, with its chosen option', (await ev(`document.querySelector('[data-s=decision]').dataset.state`)) === 'decided' && (await text('[data-s=dc-decided]')).includes('Raised'));

  console.log('\n[21] Phone, 390 px: the tabs');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
  await seed([pjObj('pjPh', 'Phone: a rather long project name to see how the tabs and buttons wrap on a narrow screen', 'decide', {
    milestones: [msObj('msH1', 'A milestone with a rather long title to see it wrap properly', '2026-10-01'), msObj('msH2', 'Second one', '2026-11-20', null)],
    decisions: [dcObj('dcH1', 'An open question that is rather long, to see it wrap nicely on a phone?', [opObj('opH1', 'First choice with a long name', ['A pro'], ['A con']), opObj('opH2', 'Second')]),
      dcObj('dcH2', 'Decided one', [opObj('opH3', 'Yes')], 'opH3', 'A reason', '2026-10-14')],
  })]);
  const tooSmall = () => ev(`[...document.querySelectorAll('#app button, #app input:not([type=checkbox]), #app select, #app textarea, #app [role=tab]')].filter(b => b.getClientRects().length).map(b => { const r = b.getBoundingClientRect(); return { t: (b.getAttribute('aria-label') || b.textContent || b.id || b.className).trim().slice(0, 28), h: Math.round(r.height) }; }).filter(x => x.h < 44)`);
  const sideways = () => ev('document.documentElement.scrollWidth > innerWidth');
  for (const tab of ['', '/milestones', '/decisions']) {
    await go(`projects/p/pjPh${tab}`, 2026, 10, 15, 20); await sleep(200);
    if (tab === '/milestones') { await click(`${sel('msH1').ms} [data-action=ms-edit]`); await sleep(200); }
    if (tab === '/decisions') { await click(`${sel('opH1').op} [data-s=pros] [data-action=pro-add]`); await click(`${sel('opH2').op} [data-action=opt-choose]`); await sleep(200); }
    check(`phone 390 px, ${tab ? tab.slice(1) : 'overview'}: nothing scrolls sideways`, !(await sideways()));
    const small = await tooSmall();
    check(`phone 390 px, ${tab ? tab.slice(1) : 'overview'}: every button, field and tab is at least 44 px tall`, small.length === 0, small.slice(0, 6));
  }
  await editStorage(`s => { const x = s.projects.items.find(p => p.id === 'pjPh').decisions[0]; x.history = [
    { id: 'dhOld', text: 'An option that has since been removed', on: '2025-01-01', why: null },
    { id: 'dhLong', text: 'A previous choice with a long name that should wrap across lines', on: '2026-10-14', why: 'A reason that stays readable when there is quite a lot to say. '.repeat(7) + '\\n' + 'word'.repeat(35) }
  ]; }`);
  for (const theme of ['light', 'dark']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    for (const width of [390, 768, 1440]) {
      await T.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
      await go('projects/p/pjPh/decisions', 2026, 10, 15, 20, 5);
      await click('[data-s=dc-history] summary'); await sleep(100);
      check(`previous choices, ${theme}, ${width}px: long reasons wrap without horizontal scrolling and the disclosure has a 44px target`, !(await sideways()) && (await ev(`document.querySelector('[data-s=dc-history] summary').getBoundingClientRect().height`)) >= 44 && /reason for this older choice was not saved/.test(await text('[data-s=dc-history]')));
    }
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[22] Deleting a project with milestones and decisions');
  await go('projects/p/pjN', 2026, 10, 15, 21);
  const notesBefore = (await data()).notes.items.length, tasksBefore = (await data()).tasks.items.length;
  await click('[data-action=project-delete]'); await sleep(250);
  check('the confirmation says its milestones and decisions go with it, and its notes, tasks and appointments stay', (await text('dialog[open]')).includes('Its milestones and decisions go with it; its notes, tasks and appointments stay.'), await text('dialog[open]'));
  await answer(false);
  check('"Keep it" keeps the project with its milestones and decisions', (await pAt('pjN')).milestones.length === 2 && (await pAt('pjN')).decisions.length === 1);
  await click('[data-action=project-delete]'); await answer(true);
  d = await data();
  check('deleting it removes the project (and so its milestones and decisions), and keeps its notes and tasks', !d.projects.items.some(x => x.id === 'pjN') && d.notes.items.length === notesBefore && d.tasks.items.length === tasksBefore && (await hash()) === '#projects');

  console.log('\n[23] Private projects, in the plain build (no AI)');
  await go('projects', 2026, 10, 16, 9); await reset(); await go('projects', 2026, 10, 16, 9);
  await seed([pjObj('pjPr', 'Private: a quiet plan', 'decide', { milestones: [msObj('msR1', 'First step')], decisions: [dcObj('dcR1', 'Which way?', [opObj('opR1', 'Left', ['A pro'])])] })]);
  await go('projects/p/pjPr/milestones', 2026, 10, 16, 9, 5);
  check('the Private switch starts off, and the saved project has no private field', (await ev(`document.querySelector('[data-action=project-private]').getAttribute('aria-checked')`)) === 'false' && !('private' in (await pAt('pjPr'))));
  await click('[data-action=project-private]'); await sleep(250);
  check('turning it on saves private: true, and the switch shows on', (await pAt('pjPr')).private === true && (await ev(`document.querySelector('[data-action=project-private]').getAttribute('aria-checked')`)) === 'true');
  check('in this build (no AI) there are no AI buttons, with or without the project private', !(await exists('[data-action=ms-ask]')) && !(await exists('[data-action=dc-ask]')) && !(await exists('[data-s=ai-private]')));
  await go('projects/p/pjPr/decisions', 2026, 10, 16, 9, 6);
  check('…nor on the Decisions tab', !(await exists('[data-action=dc-ask]')) && !(await exists('[data-s=ai-private]')));
  await go('projects', 2026, 10, 16, 9, 7); await sleep(200);
  check('the board card shows the lock while it is private', await exists('[data-s=project-private]'));
  await go('projects/p/pjPr', 2026, 10, 16, 9, 8);
  await click('[data-action=project-private]'); await sleep(250);
  check('turning it off removes the field from the saved project, and the switch shows off', !('private' in (await pAt('pjPr'))) && (await ev(`document.querySelector('[data-action=project-private]').getAttribute('aria-checked')`)) === 'false' && (await pAt('pjPr')).milestones.length === 1, await pAt('pjPr'));
  await go('projects', 2026, 10, 16, 9, 9); await sleep(200);
  check('…and the lock is gone from the board card', !(await exists('[data-s=project-private]')));

  // ---- The Business template (1.33.0) ----
  const asObj = (id, text, state = 'open', extra = {}) => ({ id, text, state, found: '', checkedOn: state === 'open' ? null : '2026-10-14', taskId: null, createdAt: '2026-10-10T09:00', ...extra });
  const bizObj = (id, title, model, extra = {}) => pjObj(id, title, 'capture', { template: 'business', ...(model ? { model } : {}), ...extra });
  const tabsOf = () => ev(`[...document.querySelectorAll('[data-s=project-tabs] [data-tab]')].map(a => a.dataset.tab)`);
  const kindNow = () => ev(`(document.querySelector('[data-s=project-kind] [data-action=project-kind]:checked') || {}).value || null`);
  const rowSel = id => `[data-s=assumption][data-id="${id}"]`;

  console.log('\n[24] Starting a business idea');
  await go('projects', 2026, 10, 15, 22); await reset(); await go('projects', 2026, 10, 15, 22);
  check('the Start a project form has a kind choice, with General chosen to begin with', (await exists('[data-s=project-kind][role=radiogroup]')) && (await kindNow()) === 'general', await kindNow());
  await click('[data-action=project-kind][value=business]'); await sleep(150);
  check('choosing Business idea selects it', (await kindNow()) === 'business', await kindNow());
  await type('#projectNew', 'Bakery bread-share app'); await click('[data-action=project-add]'); await sleep(400);
  let bz = await project('Bakery bread-share app');
  check('a business idea is saved with template business and no model yet', bz && bz.template === 'business' && !('model' in bz), bz);
  check('…it opens on its Model tab', (await hash()) === `#projects/p/${bz.id}/model` && (await tabOf()) === 'model', await hash());
  check('…the tabs are Overview, Model, Money, Milestones, Decisions', eq(await tabsOf(), ['overview', 'model', 'money', 'milestones', 'decisions']), await tabsOf());
  await go('projects', 2026, 10, 15, 22, 5);
  check('back on the projects page the kind choice is on General again', (await kindNow()) === 'general', await kindNow());
  await type('#projectNew', 'Plain garden tidy'); await click('[data-action=project-add]'); await sleep(400);
  const gp = await project('Plain garden tidy');
  check('starting with General saves no template at all', gp && !('template' in gp) && !('model' in gp), gp);
  check('…it opens on its Overview', (await hash()) === `#projects/p/${gp.id}` && (await tabOf()) === 'overview', await hash());
  check('…the tabs are Overview, Milestones, Decisions (no Model)', eq(await tabsOf(), ['overview', 'milestones', 'decisions']), await tabsOf());

  console.log('\n[25] The Model tab');
  await go('projects', 2026, 10, 15, 23); await reset(); await go('projects', 2026, 10, 15, 23);
  const tkP = (id, projectId) => ({ id, title: 'Visit the market', listId: '', category: 'Admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-12T09:00', postponed: 0, blockers: [], letGoOn: null, projectId });
  await seed([bizObj('pjB1', 'Model: bread-share', null), bizObj('pjB2', 'Model: has a task', { problem: '', who: '', how: '', assumptions: [asObj('asT1', 'Cafes would pay for a weekly delivery')] }, { nextTaskId: 'tkB2' })]);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(tkP('tkB2', 'pjB2'))}); }`);
  await go('projects/p/pjB1/model', 2026, 10, 15, 23, 5);
  check('before any answer the Model tab invites you to start, rather than counting', (await text('[data-s=model-progress]')).startsWith('Four simple questions, in your words'), await text('[data-s=model-progress]'));
  await type('#model-problem', '  Bakeries throw away bread at closing  '); await sleep(300);
  await type('#model-who', 'Small bakeries and hungry students'); await sleep(300);
  await type('#model-how', 'Sell the leftovers cheaply through an app'); await sleep(300);
  let pb = await pAt('pjB1');
  check('each answer is saved when it changes, trimmed', pb.model && pb.model.problem === 'Bakeries throw away bread at closing' && pb.model.who === 'Small bakeries and hungry students' && pb.model.how === 'Sell the leftovers cheaply through an app', pb.model);
  await go('projects/p/pjB1/model', 2026, 10, 15, 23, 6);
  check('…and they show again after reloading', (await ev(`document.getElementById('model-problem').value`)) === 'Bakeries throw away bread at closing' && (await ev(`document.getElementById('model-who').value`)) === 'Small bakeries and hungry students' && (await ev(`document.getElementById('model-how').value`)) === 'Sell the leftovers cheaply through an app');
  check('three answers read "3 of 4 questions answered"', (await text('[data-s=model-progress]')) === '3 of 4 questions answered', await text('[data-s=model-progress]'));
  await editStorage(`s => { const m = s.projects.items.find(p => p.id === 'pjB1').model; m.who = ''; m.how = ''; }`);
  await go('projects/p/pjB1/model', 2026, 10, 15, 23, 7);
  check('one answer reads "1 of 4 questions answered"', (await text('[data-s=model-progress]')) === '1 of 4 questions answered', await text('[data-s=model-progress]'));
  await type('#modelNew', 'Students would buy day-old bread'); await click('[data-action=model-add]'); await sleep(300);
  pb = await pAt('pjB1');
  const A1 = pb.model.assumptions[0] && pb.model.assumptions[0].id;
  check('adding something that must be true gives an open row', pb.model.assumptions.length === 1 && pb.model.assumptions[0].text === 'Students would buy day-old bread' && (await ev(`document.querySelector('${rowSel(A1)}').dataset.state`)) === 'open', pb.model.assumptions);
  check('…and counts as the fourth question', (await text('[data-s=model-progress]')) === '2 of 4 questions answered · 1 still to check', await text('[data-s=model-progress]'));
  await click(`${rowSel(A1)} [data-action=as-find-out]`); await sleep(300);
  const ft = await task('Find out: Students would buy day-old bread');
  pb = await pAt('pjB1');
  check('"Find out" adds a 15 minute task in the project', ft && ft.minutes === 15 && ft.projectId === 'pjB1' && pb.model.assumptions[0].taskId === ft.id, ft);
  check('…with no next step before, it says it is the project\'s next step for now', (await toast()) === 'Added — it’s this project’s next step for now.', await toast());
  check('…the row links to the task and no longer offers Find out', (await ev(`document.querySelector('${rowSel(A1)} [data-s=as-task]').getAttribute('href')`)) === `#today/tasks/${ft.id}` && !(await exists(`${rowSel(A1)} [data-action=as-find-out]`)));
  await go('projects/p/pjB2/model', 2026, 10, 15, 23, 8);
  await click(`${rowSel('asT1')} [data-action=as-find-out]`); await sleep(300);
  pb = await pAt('pjB2');
  check('on a project that already had a task, it says the next step stays as it is', (await toast()) === 'Added to this project’s tasks. Your next step stays as it is.', await toast());
  check('…and its next step is unchanged', pb.nextTaskId === 'tkB2' && !!(await task('Find out: Cafes would pay for a weekly delivery')), pb.nextTaskId);
  await go('projects/p/pjB1/model', 2026, 10, 15, 23, 9);
  await click(`${rowSel(A1)} [data-action=as-mark][data-state=looks-true]`); await sleep(300);
  pb = await pAt('pjB1');
  check('"Looks true" saves the state and today as the day it was checked', pb.model.assumptions[0].state === 'looks-true' && pb.model.assumptions[0].checkedOn === '2026-10-15', pb.model.assumptions[0]);
  check('…the row changes and has no more mark buttons', (await ev(`document.querySelector('${rowSel(A1)}').dataset.state`)) === 'looks-true' && !(await exists(`${rowSel(A1)} [data-action=as-mark]`)));
  check('…and its edit button now says "Add what I found"', (await text(`${rowSel(A1)} [data-action=as-edit]`)) === 'Add what I found', await text(`${rowSel(A1)} [data-action=as-edit]`));
  await click(`${rowSel(A1)} [data-action=as-edit]`); await sleep(200);
  await type(`#asS-${A1}`, 'open'); await sleep(300);
  pb = await pAt('pjB1');
  check('setting it back to Not checked yet clears the day it was checked', pb.model.assumptions[0].state === 'open' && pb.model.assumptions[0].checkedOn === null, pb.model.assumptions[0]);
  await type(`#asF-${A1}`, 'Three students said yes at the market'); await sleep(300);
  check('what was found is saved', (await pAt('pjB1')).model.assumptions[0].found === 'Three students said yes at the market');
  await click(`${rowSel(A1)} [data-action=as-edit]`); await sleep(200);
  check('…and shown on the row', (await text(`${rowSel(A1)} [data-s=as-found]`)).includes('Three students said yes at the market'), await text(`${rowSel(A1)} [data-s=as-found]`));
  await editStorage(`s => { const t = s.tasks.items.find(x => x.title === 'Find out: Students would buy day-old bread'); t.done = true; t.doneOn = '2026-10-15'; }`);
  await go('projects/p/pjB1/model', 2026, 10, 15, 23, 10);
  check('an open assumption whose task is done asks what you found', (await text(`${rowSel(A1)} [data-s=as-waiting]`)) === 'Its Find out task is done — what did you find?', await text(`${rowSel(A1)} [data-s=as-waiting]`));
  await go('projects/p/pjB1', 2026, 10, 15, 23, 11);
  check('…and so does the Overview, as a Worth a look pointer', (await text('#projectWorth [data-pointer=found]')) === 'A Find out task is done — what did you find?' && !(await exists('[data-s=model-waiting]')), await text('#projectWorth'));
  await go('projects/p/pjB1/model', 2026, 10, 15, 23, 12);
  await click(`${rowSel(A1)} [data-action=as-edit]`); await sleep(200);
  await click(`${rowSel(A1)} [data-action=as-remove]`); await answer(false);
  check('"Remove" asks first, and "Keep it" keeps it', (await pAt('pjB1')).model.assumptions.length === 1 && (await exists(rowSel(A1))));
  await click(`${rowSel(A1)} [data-action=as-remove]`); await answer(true);
  check('confirming removes it, and its Find out task stays', !(await exists(rowSel(A1))) && !(await pAt('pjB1')).model.assumptions.some(a => a.id === A1) && !!(await task('Find out: Students would buy day-old bread')));
  await seed([bizObj('pjFull', 'Model: twelve things', { problem: '', who: '', how: '', assumptions: Array.from({ length: 12 }, (_, i) => asObj('asF' + i, 'Made-up belief number ' + (i + 1))) })]);
  await go('projects/p/pjFull/model', 2026, 10, 15, 23, 13);
  check('at 12 things that must be true, it says so and the add form is gone', (await exists('[data-s=model-full]')) && !(await exists('#modelAddForm')));

  console.log('\n[26] The Overview\'s one-page row and the board');
  await seed([
    bizObj('pjO', 'Overview: seed swap', { problem: 'Gardeners buy too many seeds', who: 'Allotment holders', how: '', assumptions: [asObj('asO1', 'People will swap in person', 'looks-true'), asObj('asO2', 'There is a free place to meet'), asObj('asO3', 'Swaps happen every season')] }),
    bizObj('pjOe', 'Overview: nothing yet', null),
    pjObj('pjOg', 'Overview: a general one', 'capture'),
  ]);
  await go('projects/p/pjO', 2026, 10, 15, 23, 14);
  check('the one-page row counts the questions answered', (await text('#projectGlance [data-s=glance-onepage] [data-s=model-summary]')) === '3 of 4 questions answered', await text('#projectGlance [data-s=glance-onepage] [data-s=model-summary]'));
  const belO = await ev(`[...document.querySelectorAll('#projectGlance [data-s=glance-beliefs] li')].map(li => li.textContent.trim())`);
  check('…while what is still to check and what looks true are counted once, under "What must be true"', eq(belO, ['2Not checked yet', '1Looks true', '0Doesn’t hold']) && !(await text('#projectGlance [data-s=glance-onepage]')).includes('still to check'), belO);
  await go('projects/p/pjOe', 2026, 10, 15, 23, 15);
  check('a business idea with no model invites you to start with the first question', (await text('#projectGlance [data-s=glance-onepage] [data-s=model-summary]')) === 'Four simple questions put your idea on one page — start with the first', await text('#projectGlance [data-s=glance-onepage] [data-s=model-summary]'));
  await go('projects/p/pjOg', 2026, 10, 15, 23, 16);
  check('a general project has no one-page row', (await exists('#projectHead')) && (await exists('#projectGlance')) && !(await exists('[data-s=glance-onepage]')));
  await go('projects/p/pjO', 2026, 10, 15, 23, 17);
  const rec = await ev(`[...document.querySelectorAll('#projectRecent [data-s=recent]')].map(li => ({ what: li.dataset.what, text: li.textContent }))`);
  check('Recently shows what you found out, with the thing that was checked', rec.some(r => r.what === 'checked' && r.text.includes('Found out') && r.text.includes('People will swap in person')), rec);
  await go('projects', 2026, 10, 15, 23, 18);
  check('on the board a business idea\'s card says "Business idea"', (await text('.project-card[data-id=pjO] [data-s=project-kind-label]')) === 'Business idea', await text('.project-card[data-id=pjO]'));
  check('…and a general project\'s card says nothing of the kind', (await exists('.project-card[data-id=pjOg]')) && !(await exists('.project-card[data-id=pjOg] [data-s=project-kind-label]')));

  console.log('\n[27] Changing the kind of project');
  await go('projects/p/pjO', 2026, 10, 15, 23, 19);
  await click('[data-action=project-edit]'); await sleep(200);
  await type('#projectKind', 'general'); await sleep(300);
  const pk = await pAt('pjO');
  check('changing to General removes the template but keeps the one page', !('template' in pk) && pk.model && pk.model.problem === 'Gardeners buy too many seeds' && pk.model.assumptions.length === 3, pk);
  check('…and the Model tab goes', !(await ev(`!!document.querySelector('[data-s=project-tabs] [data-tab=model]')`)));
  await go('projects/p/pjO/model', 2026, 10, 15, 23, 20);
  check('the Model address then shows the Overview instead', (await exists('#projectHead')) && !(await exists('#projectModel')) && (await tabOf()) === 'overview', await tabOf());
  await click('[data-action=project-edit]'); await sleep(200);
  await type('#projectKind', 'business'); await sleep(300);
  check('changing back to Business idea brings the Model tab back', (await pAt('pjO')).template === 'business' && (await ev(`!!document.querySelector('[data-s=project-tabs] [data-tab=model]')`)));
  await go('projects/p/pjO/model', 2026, 10, 15, 23, 21);
  check('…with the answers still there', (await ev(`document.getElementById('model-problem').value`)) === 'Gardeners buy too many seeds' && (await ev(`document.querySelectorAll('[data-s=assumption]').length`)) === 3);
  await seed([pjObj('pjCase', 'Kind: a workshop plan', 'capture', { template: 'workshop' })]);
  await go('projects/p/pjCase', 2026, 10, 15, 23, 22);
  await click('[data-action=project-edit]'); await sleep(200);
  check('a project of a kind this version does not know has no kind choice', !(await exists('#projectKind')) && (await exists('#projectSummary')));
  await type('#projectSummary', 'Just a summary'); await sleep(300);
  check('…and editing its summary leaves its kind as it was', (await pAt('pjCase')).template === 'workshop' && (await pAt('pjCase')).summary === 'Just a summary', await pAt('pjCase'));
  await go('projects/p/pjO', 2026, 10, 15, 23, 23);
  await click('[data-action=project-delete]'); await sleep(250);
  check('deleting a project that has a one page says so in the confirmation', (await text('dialog[open]')).includes('one page,'), await text('dialog[open]'));
  await answer(false);
  check('…and "Keep it" keeps it', !!(await pAt('pjO')));

  console.log('\n[28] Phones: the Model tab');
  await seed([bizObj('pjPm', 'Phone: a business idea with quite a long name to see how things wrap on a very narrow screen', { problem: 'A long problem written out in full so that it has to wrap onto several lines on a narrow phone', who: 'Someone', how: 'Somehow', assumptions: [asObj('asPm', 'A fairly long thing that must be true so we can see how it wraps on narrow screens')] })]);
  for (const w of [320, 360]) {
    await T.send('Emulation.setDeviceMetricsOverride', { width: w, height: 740, deviceScaleFactor: 2, mobile: true });
    await go('projects/p/pjPm/model', 2026, 10, 15, 23, 30); await sleep(200);
    const tabs = await ev(`[...document.querySelectorAll('[data-s=project-tabs] a')].map(a => ({ t: a.textContent.trim(), sw: a.scrollWidth, cw: a.clientWidth }))`);
    check(`phone ${w} px: every tab link fits its own width (five, with Money)`, tabs.length === 5 && tabs.every(x => x.sw <= x.cw), tabs);
    check(`phone ${w} px: the Model tab does not scroll sideways`, (await ev('document.documentElement.scrollWidth')) <= w, await ev('document.documentElement.scrollWidth'));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  // ---- The Case template (1.35.0) ----
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const tlObj = (id, date, title, extra = {}) => ({ id, date, about: false, title, details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: '2026-10-10T09:00', ...extra });
  const evObj = (id, title, status = 'have', extra = {}) => ({ id, title, kind: 'document', date: null, where: '', status, notes: '', issueIds: [], createdAt: '2026-10-10T09:00', ...extra });
  const isObj = (id, title, extra = {}) => ({ id, title, status: 'considering', notes: '', createdAt: '2026-10-10T09:00', ...extra });
  const caseObj = (id, title, file, extra = {}) => pjObj(id, title, 'capture', { template: 'case', case: { timeline: [], evidence: [], issues: [], ...file }, ...extra });
  const caseOf = async id => (await pAt(id)).case;
  const entryRows = () => ev(`[...document.querySelectorAll('[data-s=tl-entry]')].map(li => li.querySelector('p.font-semibold').textContent.trim())`);
  const dialogText = () => text('dialog[open]');

  console.log('\n[29] Starting a case');
  await go('projects', 2026, 10, 15, 8); await reset(); await go('projects', 2026, 10, 15, 8);
  const kinds = await ev(`[...document.querySelectorAll('[data-s=project-kind] [data-action=project-kind]')].map(i => i.value)`);
  check('the Start a project kind choice has General, Business idea, Case and Research', eq(kinds, ['general', 'business', 'case', 'research']), kinds);
  await click('[data-action=project-kind][value=case]'); await sleep(150);
  check('choosing Case selects it', (await kindNow()) === 'case', await kindNow());
  await type('#projectNew', 'Dispute about my unpaid overtime'); await click('[data-action=project-add]'); await sleep(400);
  const cs = await project('Dispute about my unpaid overtime');
  check('a case is saved with template case, no private field and no case records yet', cs && cs.template === 'case' && !('private' in cs) && !('case' in cs), cs);
  check('…it opens on its Overview', (await hash()) === `#projects/p/${cs.id}` && (await tabOf()) === 'overview', await hash());
  check('…the tabs are Overview, Timeline, Evidence, Issues', eq(await tabsOf(), ['overview', 'timeline', 'evidence', 'issues']), await tabsOf());
  check('…and there is no "Explore this idea" link on a case', (await exists('#projectHead')) && !(await exists('#projectExplore')));
  await go('projects', 2026, 10, 15, 8, 5);
  check('on the board the case\'s card says "Case"', (await text(`.project-card[data-id=${cs.id}] [data-s=project-kind-label]`)) === 'Case', await text(`.project-card[data-id=${cs.id}]`));

  console.log('\n[30] The case timeline');
  const CT = cs.id;
  await go(`projects/p/${CT}/timeline`, 2026, 10, 15, 8, 10);
  check('with nothing yet the add form is open and says where to start', (await exists('#tlAddForm')) && (await exists('[data-s=tl-empty]')) && (await tabOf()) === 'timeline');
  const addTl = async (date, title, source, about) => {
    await type('#tlDate', date); await type('#tlTitle', title);
    await click(`input[name=tlSource][value=${source}]`);
    if (about) await click('[data-s=tl-about]');
    await click('[data-action=tl-add]'); await sleep(300);
  };
  await addTl('2026-09-20', 'Meeting with my manager about my hours', 'theirs', false);
  await addTl('2026-08-05', 'First written warning', 'mine', false);
  await addTl('2026-09-02', 'Rota changed without notice', 'evidence', true);
  let tl = (await caseOf(CT)).timeline;
  check('three entries are saved, each with the source chosen and the "About this date" setting', eq(tl.map(t => [t.date, t.source, t.about]), [['2026-09-20', 'theirs', false], ['2026-08-05', 'mine', false], ['2026-09-02', 'evidence', true]]), tl);
  check('…the add form is no longer showing the empty note', !(await exists('[data-s=tl-empty]')) && (await exists('[data-s=tl-entry]')));
  check('entries show in date order, not the order they were added', eq(await entryRows(), ['First written warning', 'Rota changed without notice', 'Meeting with my manager about my hours']), await entryRows());
  check('…grouped under month headings', eq(await ev(`[...document.querySelectorAll('#caseTimeline section h3')].map(h => h.textContent.trim())`), ['August 2026', 'September 2026']));
  check('…each with its source chip', eq(await ev(`[...document.querySelectorAll('[data-s=tl-entry] [data-s=tl-source-chip]')].map(c => c.textContent.trim())`), ['My account', 'In the evidence', 'Their account']));
  const idOf = title => (tl.find(t => t.title === title) || {}).id;
  const T_APPROX = idOf('Rota changed without notice'), T_MEET = idOf('Meeting with my manager about my hours');
  check('an approximate date reads "About …" and an exact one does not', /^About .*2 Sep/.test(norm(await text(`[data-s=tl-entry][data-id="${T_APPROX}"] p`))) && !/About/.test(await text(`[data-s=tl-entry][data-id="${T_MEET}"] p`)), await text(`[data-s=tl-entry][data-id="${T_APPROX}"] p`));
  await editStorage(`s => { const c = s.projects.items.find(p => p.id === '${CT}').case;
    c.evidence.push(${JSON.stringify(evObj('evL1', 'Rota screenshot'))}); c.issues.push(${JSON.stringify(isObj('isL1', 'Changed hours without notice'))}); }`);
  await go(`projects/p/${CT}/timeline`, 2026, 10, 15, 8, 11);
  await click(`[data-s=tl-entry][data-id="${T_MEET}"] [data-action=tl-edit]`); await sleep(200);
  await click(`[data-s=links-entry-evidence] [data-s=link-pick][data-id=evL1]`); await sleep(250);
  await click(`[data-s=links-entry-issue] [data-s=link-pick][data-id=isL1]`); await sleep(250);
  let mt = (await caseOf(CT)).timeline.find(t => t.id === T_MEET);
  check('ticking evidence and an issue in an entry\'s editor saves both links', eq(mt.evidenceIds, ['evL1']) && eq(mt.issueIds, ['isL1']), mt);
  await click(`[data-s=tl-entry][data-id="${T_MEET}"] [data-action=tl-edit]`); await sleep(200);
  const linkChips = norm(await text(`[data-s=tl-entry][data-id="${T_MEET}"] [data-s=tl-links]`));
  check('…and the entry then shows them as chips', linkChips.includes('Rota screenshot') && linkChips.includes('Changed hours without notice'), linkChips);
  await click(`[data-s=tl-entry][data-id="${T_MEET}"] [data-action=tl-edit]`); await sleep(200);
  await click(`[data-s=links-entry-evidence] [data-s=link-pick][data-id=evL1]`); await sleep(250);
  check('ticking a linked piece of evidence again unlinks it', eq((await caseOf(CT)).timeline.find(t => t.id === T_MEET).evidenceIds, []));
  await click(`[data-s=tl-entry][data-id="${T_MEET}"] [data-action=tl-remove]`); await answer(false);
  check('Remove asks first, and "Keep it" keeps the entry', (await caseOf(CT)).timeline.length === 3 && (await exists(`[data-s=tl-entry][data-id="${T_MEET}"]`)));
  await click(`[data-s=tl-entry][data-id="${T_MEET}"] [data-action=tl-remove]`); await answer(true);
  check('confirming removes the entry and leaves the other two', eq((await caseOf(CT)).timeline.map(t => t.id).sort(), [idOf('First written warning'), T_APPROX].sort()) && !(await exists(`[data-s=tl-entry][data-id="${T_MEET}"]`)));

  console.log('\n[31] Case evidence');
  await seed([caseObj('pjEv', 'Evidence: a deposit dispute', { timeline: [tlObj('tlE1', '2026-09-10', 'Landlord kept my deposit')] })]);
  await go('projects/p/pjEv/evidence', 2026, 10, 15, 9, 20);
  check('with no evidence yet the add form is open and says what counts', (await exists('#evAddForm')) && (await exists('[data-s=ev-empty]')));
  const addEv = async (title, kindV, status, where) => {
    await type('#evTitle', title); await type('#evKind', kindV); await type('#evStatus', status); await type('#evWhere', where);
    await click('[data-action=ev-add]'); await sleep(300);
  };
  await addEv('Tenancy agreement', 'document', 'to-get', 'https://example.com/folder/tenancy');
  await addEv('Texts with the landlord', 'message', 'have', 'Phone, saved messages');
  await addEv('Bank statement', 'email', 'reviewed', '');
  const evs = (await caseOf('pjEv')).evidence;
  check('three pieces of evidence are saved with their kind, status and where they are kept', eq(evs.map(e => [e.title, e.kind, e.status, e.where]), [['Tenancy agreement', 'document', 'to-get', 'https://example.com/folder/tenancy'], ['Texts with the landlord', 'message', 'have', 'Phone, saved messages'], ['Bank statement', 'email', 'reviewed', '']]), evs);
  const E1 = evs[0].id, E2 = evs[1].id, E3 = evs[2].id;
  const evRow = id => `[data-s=evidence][data-id="${id}"]`;
  const shownEv = () => ev(`[...document.querySelectorAll('[data-s=evidence]')].map(li => li.dataset.id)`);
  const filterLabel = f => text(`[data-s=ev-filter] button[data-filter=${f}]`).then(norm);
  check('the status filter shows counts: All 3, To get 1, Have it 1, Reviewed 1', eq([await filterLabel('all'), await filterLabel('to-get'), await filterLabel('have'), await filterLabel('reviewed')], ['All 3', 'To get 1', 'Have it 1', 'Reviewed 1']), [await filterLabel('all'), await filterLabel('to-get'), await filterLabel('have'), await filterLabel('reviewed')]);
  await click('[data-s=ev-filter] button[data-filter=have]'); await sleep(200);
  check('choosing "Have it" lists only what you have', eq(await shownEv(), [E2]), await shownEv());
  await click('[data-s=ev-filter] button[data-filter=to-get]'); await sleep(200);
  check('choosing "To get" lists only what you still need', eq(await shownEv(), [E1]), await shownEv());
  check('…its button says "Got it"', (await text(`${evRow(E1)} [data-action=ev-next]`)) === 'Got it');
  await click(`${evRow(E1)} [data-action=ev-next]`); await sleep(250);
  check('"Got it" moves it from To get to Have it', (await caseOf('pjEv')).evidence[0].status === 'have' && eq(await shownEv(), []) && (await filterLabel('to-get')) === 'To get 0' && (await filterLabel('have')) === 'Have it 2', await filterLabel('have'));
  await click('[data-s=ev-filter] button[data-filter=have]'); await sleep(200);
  check('…and it then offers "Reviewed"', (await text(`${evRow(E1)} [data-action=ev-next]`)) === 'Reviewed', await shownEv());
  await click(`${evRow(E1)} [data-action=ev-next]`); await sleep(250);
  check('"Reviewed" moves it to Reviewed, which has no next button', (await caseOf('pjEv')).evidence[0].status === 'reviewed' && !(await exists(`${evRow(E3)} [data-action=ev-next]`)) && (await filterLabel('reviewed')) === 'Reviewed 2');
  await click('[data-s=ev-filter] button[data-filter=all]'); await sleep(200);
  const lk = await ev(`(() => { const a = document.querySelector('${evRow(E1)} [data-s=ev-where] a'); return a ? { href: a.getAttribute('href'), target: a.target, rel: a.rel } : null; })()`);
  check('a place starting with https:// is shown as a link that opens in a new tab safely', eq(lk, { href: 'https://example.com/folder/tenancy', target: '_blank', rel: 'noopener noreferrer' }), lk);
  check('…and a plain place is shown as text, not a link', (await text(`${evRow(E2)} [data-s=ev-where]`)).includes('Phone, saved messages') && !(await exists(`${evRow(E2)} [data-s=ev-where] a`)));
  await editStorage(`s => { s.projects.items.find(p => p.id === 'pjEv').case.timeline[0].evidenceIds = ['${E1}', '${E2}']; }`);
  await go('projects/p/pjEv/evidence', 2026, 10, 15, 9, 21);
  await click(`${evRow(E1)} [data-action=ev-edit]`); await sleep(200);
  await click(`${evRow(E1)} [data-action=ev-remove]`); await answer(false);
  check('Remove asks first, and "Keep it" keeps the evidence', (await caseOf('pjEv')).evidence.length === 3 && (await exists(evRow(E1))));
  await click(`${evRow(E1)} [data-action=ev-remove]`); await sleep(250);
  check('…evidence linked from a timeline entry says so in the question', (await dialogText()).includes('comes off the timeline entry it’s linked to'), await dialogText());
  await answer(true);
  const after = await caseOf('pjEv');
  check('confirming removes the evidence; the timeline entry stays without that link, still linked to the other', !after.evidence.some(e => e.id === E1) && after.timeline.length === 1 && eq(after.timeline[0].evidenceIds, [E2]), after);

  console.log('\n[32] Case issues, and the Overview');
  await seed([caseObj('pjIs', 'Issues: a pay claim', {
    timeline: [tlObj('tlI1', '2026-09-01', 'Told my hours were cut'), tlObj('tlI2', '2026-09-15', 'Last payslip', { source: 'evidence' })],
    evidence: [evObj('evI1', 'Payslips', 'have'), evObj('evI2', 'Contract', 'to-get'), evObj('evI3', 'Emails', 'reviewed')],
  })]);
  await go('projects/p/pjIs/issues', 2026, 10, 15, 9, 30);
  check('with no issues the form asks for the first', (await text('#isAddForm')).includes('Add the first issue') && !(await exists('[data-s=issue]')));
  await type('#isNew', 'Unpaid holiday pay'); await click('[data-action=is-add]'); await sleep(300);
  await type('#isNew', 'Hours cut without agreement'); await click('[data-action=is-add]'); await sleep(300);
  const iss = (await caseOf('pjIs')).issues;
  check('issues are added by name, starting as "considering"', eq(iss.map(i => [i.title, i.status]), [['Unpaid holiday pay', 'considering'], ['Hours cut without agreement', 'considering']]), iss);
  const I1 = iss[0].id, I2 = iss[1].id;
  const issRow = id => `[data-s=issue][data-id="${id}"]`;
  check('an issue with nothing linked says so', (await exists(`${issRow(I1)} [data-s=is-nothing]`)) && (await exists(`${issRow(I2)} [data-s=is-nothing]`)));
  await editStorage(`s => { const c = s.projects.items.find(p => p.id === 'pjIs').case; c.evidence[0].issueIds = ['${I1}']; c.timeline[0].issueIds = ['${I1}']; }`);
  await go('projects/p/pjIs/issues', 2026, 10, 15, 9, 31);
  const links = norm(await text(`${issRow(I1)} [data-s=is-links]`));
  check('an issue with linked evidence and entries lists them under "Evidence" and "Timeline"', links.includes('Evidence') && links.includes('Payslips') && links.includes('Timeline') && links.includes('Told my hours were cut') && !(await exists(`${issRow(I1)} [data-s=is-nothing]`)), links);
  check('…while the other issue still has nothing linked', await exists(`${issRow(I2)} [data-s=is-nothing]`));
  await type(`#isS-${I1}`, 'claiming'); await sleep(250);
  check('the status select changes the saved status', (await caseOf('pjIs')).issues[0].status === 'claiming' && (await caseOf('pjIs')).issues[1].status === 'considering', (await caseOf('pjIs')).issues);
  await editStorage(`s => { s.tasks.items.push(${tk('tkC1', 'Send my witness statement', '2026-10-10T09:00', ", due: '2026-10-22', projectId: 'pjIs'")}, ${tk('tkC2', 'Old past deadline', '2026-10-01T09:00', ", due: '2026-10-10', projectId: 'pjIs'")}, ${tk('tkC3', 'File the claim form', '2026-10-10T09:00', ", due: '2026-10-18', projectId: 'pjIs'")}); }`);
  await go('projects/p/pjIs', 2026, 10, 15, 9, 32);
  const soonTasks = () => ev(`[...document.querySelectorAll('#projectSoon [data-s=soon-task]')].map(li => li.textContent.replace(/\\s+/g, ' ').trim())`);
  const nx = norm((await soonTasks())[0] || '');
  check('Coming up\'s first dated task is the earliest one from today (18 Oct), not an earlier past one or a later one', nx.includes('18 Oct') && nx.includes('File the claim form') && !nx.includes('Old past deadline') && !nx.includes('witness'), await soonTasks());
  check('…and the earlier past deadline is not a dated task there, it is listed as still open', !(await soonTasks()).some(t => t.includes('Old past deadline')) && norm(await text('#projectSoon [data-s=soon-open]')).includes('Old past deadline'), await text('#projectSoon'));
  const evCount = await ev(`[...document.querySelectorAll('#projectGlance [data-s=glance-evidence] [role=listitem]')].map(d => d.getAttribute('aria-label'))`);
  check('the counts are in At a glance: 3 pieces of evidence, 1 of them to get', (await ev(`document.querySelector('#projectGlance [data-s=glance-evidence] [role=list]').getAttribute('aria-label')`)) === '3 pieces of evidence' && evCount.includes('To get: 1'), evCount);
  check('…2 issues', (await ev(`document.querySelectorAll('#projectGlance [data-s=glance-issues] tbody tr').length`)) === 2);
  const tlSum = norm(await text('#projectGlance [data-s=glance-months] [data-s=timeline-summary]'));
  check('…and 2 timeline entries, the latest on 15 Sep', tlSum.startsWith('2 entries · latest') && tlSum.includes('15 Sep'), tlSum);
  check('…with the not-legal-advice line', (await text('#projectGlance [data-s=case-not-advice]')).includes('doesn’t give legal advice') && !(await exists('#projectCaseCard')), await text('#projectGlance [data-s=case-not-advice]'));
  check('"Add a deadline" is in Coming up', await exists('#projectSoon [data-action=case-deadline]'));
  await click('[data-action=case-deadline]'); await sleep(150);
  check('"Add a deadline" waits for a title and a date', await ev(`document.querySelector('[data-action=case-deadline-add]').disabled`));
  await type('#caseDlTitle', 'Reply to the employer'); await type('#caseDlDate', '2026-10-16'); await click('[data-action=case-deadline-add]'); await sleep(300);
  const dl = await task('Reply to the employer');
  check('adding a deadline makes a task with that date, in the case', dl && dl.due === '2026-10-16' && dl.projectId === 'pjIs', dl);
  check('…and it becomes the next date, first in Coming up', norm((await soonTasks())[0] || '').includes('16 Oct') && norm((await soonTasks())[0] || '').includes('Reply to the employer'), await soonTasks());
  await seed([caseObj('pjNd', 'Issues: no dates', {})]);
  await go('projects/p/pjNd', 2026, 10, 15, 9, 33);
  check('a case with no dated tasks says "No dates yet" in Coming up, and that a deadline is a dated task', (await text('#projectSoon')).includes('No dates yet. A deadline is a dated task here — it reaches Today on its day.') && (await soonTasks()).length === 0, await text('#projectSoon'));

  console.log('\n[33] Changing kind, privacy, deleting and phones');
  await seed([caseObj('pjKd', 'Kind: a tribunal claim', { timeline: [tlObj('tlK1', '2026-09-01', 'The first thing')], evidence: [evObj('evK1', 'A letter')], issues: [isObj('isK1', 'An issue')] })]);
  await go('projects/p/pjKd', 2026, 10, 15, 10);
  await click('[data-action=project-edit]'); await sleep(200);
  await type('#projectKind', 'general'); await sleep(300);
  const kg = await pAt('pjKd');
  check('switching a case to General removes the kind but keeps its records', !('template' in kg) && kg.case && kg.case.timeline.length === 1 && kg.case.evidence.length === 1 && kg.case.issues.length === 1, kg);
  check('…the case tabs go and Milestones and Decisions come back', eq(await tabsOf(), ['overview', 'milestones', 'decisions']), await tabsOf());
  await go('projects/p/pjKd/timeline', 2026, 10, 15, 10, 1);
  check('…and the Timeline address then shows the Overview', (await exists('#projectHead')) && !(await exists('#caseTimeline')) && (await tabOf()) === 'overview', await tabOf());
  await click('[data-action=project-edit]'); await sleep(200);
  await type('#projectKind', 'case'); await sleep(300);
  check('switching back to Case brings the tabs back', (await pAt('pjKd')).template === 'case' && eq(await tabsOf(), ['overview', 'timeline', 'evidence', 'issues']), await tabsOf());
  await go('projects/p/pjKd/timeline', 2026, 10, 15, 10, 2);
  check('…with the timeline entry still there', eq(await entryRows(), ['The first thing']), await entryRows());
  await click('[data-action=project-private]'); await sleep(250);
  check('a private case saves private: true', (await pAt('pjKd')).private === true);
  check('…and its hint is the same as any private project\'s (no special rule for cases)', (await text('[data-s=project-private-hint]')) === 'Ask MyDay sends nothing of this project. AI help with notes can still suggest it as a place for a note (its name and summary only).', await text('[data-s=project-private-hint]'));
  await go('projects/p/pjKd', 2026, 10, 15, 10, 3);
  await click('[data-action=project-delete]'); await sleep(250);
  check('deleting a case with records says "timeline, evidence and issues" in the question', (await dialogText()).includes('timeline, evidence and issues'), await dialogText());
  await answer(false);
  check('…and "Keep it" keeps the case', !!(await pAt('pjKd')));
  await seed([caseObj('pjCph', 'Phone: a case with a rather long name to see how the tabs and the entries wrap on a narrow screen', {
    timeline: [tlObj('tlP1', '2026-09-01', 'A fairly long entry about what happened on that day, written out so it has to wrap onto several lines')],
    evidence: [evObj('evP1', 'A long piece of evidence title that has to wrap', 'to-get', { where: 'https://example.com/a/very/long/address/that/could/push/the/page/wider/than/the/screen/if/it/is/not/wrapped' })],
    issues: [isObj('isP1', 'An issue with a rather long name to check wrapping')] })]);
  for (const w of [320]) {
    await T.send('Emulation.setDeviceMetricsOverride', { width: w, height: 740, deviceScaleFactor: 2, mobile: true });
    for (const h of ['', '/timeline', '/evidence', '/issues']) {
      await go('projects/p/pjCph' + h, 2026, 10, 15, 10, 10); await sleep(200);
      const tb = await ev(`[...document.querySelectorAll('[data-s=project-tabs] a')].map(a => ({ t: a.textContent.trim(), sw: a.scrollWidth, cw: a.clientWidth }))`);
      check(`phone ${w} px, ${h || 'Overview'}: the four case tabs each fit their own width`, tb.length === 4 && tb.every(x => x.sw <= x.cw), tb);
      check(`phone ${w} px, ${h || 'Overview'}: the page does not scroll sideways`, (await ev('document.documentElement.scrollWidth')) <= w, await ev('document.documentElement.scrollWidth'));
    }
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[34] At a glance');
  const gtk = (id, title, projectId, extra = {}) => ({ id, title, listId: '', category: 'Admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-09-20T09:00', postponed: 0, blockers: [], letGoOn: null, projectId, ...extra });
  const rowKeys = () => ev(`[...document.querySelectorAll('#projectGlance [data-s=glance-rows] > section')].map(r => r.dataset.s)`);
  const pointerKeys = () => ev(`[...document.querySelectorAll('[data-s=glance-pointers] [data-pointer]')].map(a => a.dataset.pointer)`);
  const soonTasksG = () => ev(`[...document.querySelectorAll('#projectSoon [data-s=soon-task]')].map(li => li.textContent.replace(/\\s+/g, ' ').trim())`);
  await go('projects', 2026, 10, 15, 8); await reset(); await go('projects', 2026, 10, 15, 8);
  await seed([
    pjObj('pjG1', 'Glance: paint the hall', 'act', {
      milestones: [msObj('msG1', 'Walls prepared', null, '2026-10-13'), msObj('msG2', 'Paint bought', null, '2026-10-01'), msObj('msG3', 'First coat on'), msObj('msG4', 'Second coat on'), msObj('msG5', 'Tidied up')],
      decisions: [dcObj('dcG1', 'Which colour for the hall?', [opObj('opG1', 'Soft white')])] }),
    pjObj('pjG2', 'Glance: only a name', 'capture'),
    bizObj('pjG3', 'Glance: a seed swap', { problem: 'Gardeners buy too many seeds', who: 'Allotment holders', how: '', assumptions: [asObj('asG1', 'People will swap in person'), asObj('asG2', 'There is a free place to meet'), asObj('asG3', 'Swaps happen every season', 'looks-true'), asObj('asG4', 'Nobody minds the mud', 'doesnt-hold'), asObj('asG5', 'It works in winter', 'doesnt-hold'), asObj('asG6', 'Sheds are dry', 'doesnt-hold')] }),
    caseObj('pjG4', 'Glance: a pay claim', {
      timeline: [tlObj('tlG1', '2026-08-05', 'Told my hours were cut', { issueIds: ['isG1'] }), tlObj('tlG2', '2026-09-02', 'Rota changed without notice'), tlObj('tlG3', '2026-09-20', 'Meeting with the manager')],
      evidence: [evObj('evG1', 'Payslips', 'to-get', { issueIds: ['isG1'] }), evObj('evG2', 'Contract', 'to-get'), evObj('evG3', 'Emails', 'have')],
      issues: [isObj('isG1', 'Unpaid holiday pay'), isObj('isG2', 'Hours cut without agreement')] }),
    caseObj('pjG5', 'Glance: a case with a date and no task', {
      evidence: [evObj('evG4', 'A letter', 'to-get')], issues: [isObj('isG3', 'An issue with nothing linked')] }, { commitmentIds: ['cmG1'] }),
  ]);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(gtk('tkG1', 'Call the supplier', 'pjG1', { due: '2026-10-20' }))},
    ${JSON.stringify(gtk('tkG2', 'Order paint', 'pjG1', { done: true, doneOn: '2026-10-14' }))}, ${JSON.stringify(gtk('tkG3', 'Sand the door', 'pjG1', { done: true, doneOn: '2026-10-06' }))},
    ${JSON.stringify(gtk('tkG4', 'Buy brushes', 'pjG1', { done: true, doneOn: '2026-09-30' }))}, ${JSON.stringify(gtk('tkG5', 'Long ago', 'pjG1', { done: true, doneOn: '2026-06-01' }))},
    ${JSON.stringify(gtk('tkG6', 'Send the witness statement', 'pjG4', { due: '2026-10-18' }))});
    s.commitments.push({ id: 'cmG1', kind: 'appointment', title: 'Hearing at the tribunal', start: '2026-10-16T10:00', end: '2026-10-16T11:00' }); }`);

  await go('projects/p/pjG1', 2026, 10, 15, 8, 5);
  check('a general project\'s At a glance has three rows: milestones, decisions and what you did, and no tile strip', eq(await rowKeys(), ['glance-route', 'glance-decisions', 'glance-weeks']) && !(await exists('[data-s=glance-tiles]')) && !(await exists('[data-tile]')), await rowKeys());
  check('…the next step is the Next step card, naming the task and its length', (await text('#projectNext [data-s=next-title]')) === 'Call the supplier' && norm(await text('#projectNext')).includes('15 min'), await text('#projectNext'));
  const soonG = await soonTasksG();
  check('…the next date is the first dated task in Coming up, with its day', soonG.length === 1 && soonG[0].includes('Call the supplier') && soonG[0].includes('20 October'), soonG);
  check('…the milestones row says 2 of 5 reached and what is next, and links to the Milestones tab', norm(await text('[data-s=glance-route] [data-s=ms-summary]')) === '2 of 5 milestones reached · Next: First coat on' && (await ev(`document.querySelector('[data-s=glance-route] h4 a').getAttribute('href')`)) === '#projects/p/pjG1/milestones', await text('[data-s=glance-route] [data-s=ms-summary]'));
  check('…the decisions row shows the one open question and links to the Decisions tab', (await text('[data-s=glance-decisions] [data-s=dc-open]')) === 'Which colour for the hall?' && (await ev(`document.querySelector('[data-s=glance-decisions] h4 a').getAttribute('href')`)) === '#projects/p/pjG1/decisions', await text('[data-s=glance-decisions]'));
  check('…the next step links to its task', (await ev(`document.querySelector('#projectNext a[href^="#today/tasks/"]').getAttribute('href')`)) === '#today/tasks/tkG1' && (await ev(`document.querySelector('#projectSoon [data-s=soon-task] a').getAttribute('href')`)) === '#today/tasks/tkG1');
  check('the milestone route has a station for each of the 5 milestones, and reads "2 of 5 reached"', (await ev(`document.querySelector('[data-s=glance-route] ol').getAttribute('aria-label')`)) === '2 of 5 milestones reached' && (await ev(`document.querySelectorAll('[data-s=glance-route] ol li').length`)) === 5);
  const cols = await ev(`[...document.querySelectorAll('[data-s=glance-weeks] [role=listitem]')].map(c => ({ label: c.getAttribute('aria-label'), tab: c.tabIndex }))`);
  check('the week-by-week chart has 8 columns, the last labelled "This week" with what happened in it', cols.length === 8 && cols[7].label === 'This week: 1 task done, 1 milestone reached' && cols.slice(0, 7).every(c => c.label.startsWith('Week of')), cols);
  check('…every column can be focused with the keyboard', cols.every(c => c.tab === 0), cols);
  check('…and a total line says "5 in the last 8 weeks" (the task from June is not counted)', norm(await text('[data-s=glance-weeks]')).includes('5 in the last 8 weeks'), await text('[data-s=glance-weeks]'));
  check('…with the plain counts "4 done · 1 to go" and when it started and was last worked on, never a percentage', (await text('[data-s=glance-weeks] [data-s=project-counts]')) === '4 done · 1 to go' && /Started .* · last worked on /.test(await text('[data-s=glance-weeks]')) && !/%/.test(await text('[data-s=glance-weeks]')), await text('[data-s=glance-weeks]'));
  check('the pointers include the dated task coming up', (await pointerKeys()).includes('soon') && norm(await text('[data-pointer=soon]')).includes('Call the supplier — in 5 days'), await text('[data-s=glance-pointers]'));

  await go('projects/p/pjG2', 2026, 10, 15, 8, 6);
  check('a project with only a name asks for the smallest step in the Next step card, and has no dates', (await exists('#projectNext #projectNextNew')) && !(await exists('[data-s=next-title]')) && (await text('#projectSoon')).includes('Nothing dated yet'), await text('#projectNext'));
  check('…its milestones row invites the first one, and its decisions row asks "Is there a choice to make?"', (await text('[data-s=glance-route] [data-s=ms-summary]')) === 'Milestones are the big markers on the way — add the first one' && (await text('[data-s=glance-decisions] [data-s=dc-summary]')) === 'Is there a choice to make? Add a decision');
  check('…no pictures are drawn', await exists('#projectGlance') && !(await exists('#projectGlance ol')) && !(await exists('#projectGlance [role=list]')));
  check('…and it has no Worth a look and no "No next step yet" pointer', !(await exists('#projectWorth')) && eq(await pointerKeys(), []) && !(await text('#app')).includes('No next step yet'), await pointerKeys());
  check('…so Next step comes straight after the title and tabs and before At a glance, About it and Tasks', eq(await ev(`[...document.querySelectorAll('#projectNext, #projectWorth, #projectGlance, #projectHead, #projectTasks')].map(e => e.id)`), ['projectNext', 'projectGlance', 'projectHead', 'projectTasks']));

  await go('projects/p/pjG3', 2026, 10, 15, 8, 7);
  check('a business idea\'s rows are its one page, what must be true, money, milestones, decisions and what you did', eq(await rowKeys(), ['glance-onepage', 'glance-beliefs', 'glance-money', 'glance-route', 'glance-decisions', 'glance-weeks']), await rowKeys());
  check('…the one-page row says "3 of 4 questions answered" (two answers, and the things that must be true count as the fourth)', (await text('[data-s=glance-onepage] [data-s=model-summary]')) === '3 of 4 questions answered', await text('[data-s=glance-onepage]'));
  const bel = await ev(`[...document.querySelectorAll('[data-s=glance-beliefs] li')].map(li => li.textContent.trim())`);
  check('the beliefs picture shows the three counts once: 2 not checked yet, 1 looks true, 3 do not hold', eq(bel, ['2Not checked yet', '1Looks true', '3Doesn’t hold']), bel);

  await go('projects/p/pjG4', 2026, 10, 15, 8, 8);
  check('a case\'s rows are evidence, issues, timeline, milestones, decisions and what you did', eq(await rowKeys(), ['glance-evidence', 'glance-issues', 'glance-months', 'glance-route', 'glance-decisions', 'glance-weeks']), await rowKeys());
  const soonC = await soonTasksG();
  check('…the next date is the dated task, first in Coming up', soonC.length === 1 && soonC[0].includes('Send the witness statement') && soonC[0].includes('18 October'), soonC);
  check('…the evidence row counts 3 pieces of evidence', (await ev(`document.querySelector('[data-s=glance-evidence] [role=list]').getAttribute('aria-label')`)) === '3 pieces of evidence');
  check('…the timeline row says 3 entries, the latest on 20 Sep', norm(await text('[data-s=glance-months] [data-s=timeline-summary]')).startsWith('3 entries · latest') && norm(await text('[data-s=glance-months] [data-s=timeline-summary]')).includes('20 Sep'), await text('[data-s=glance-months] [data-s=timeline-summary]'));
  const evParts = await ev(`[...document.querySelectorAll('[data-s=glance-evidence] [role=listitem]')].map(d => d.getAttribute('aria-label'))`);
  check('the evidence bar\'s parts say "To get: 2" and "Have it: 1" (a part with none is not drawn)', eq(evParts, ['To get: 2', 'Have it: 1']), evParts);
  const legend = norm(await text('[data-s=glance-evidence]'));
  check('…while its legend lists all three with counts, including a 0', legend.includes('To get 2') && legend.includes('Have it 1') && legend.includes('Reviewed 0'), legend);
  const rowsI = await ev(`[...document.querySelectorAll('[data-s=glance-issues] tbody tr')].map(r => r.textContent.replace(/\\s+/g, ' ').trim())`);
  check('the issues table has one row per issue, and says "nothing linked yet" only for the issue without links', rowsI.length === 2 && !rowsI[0].includes('nothing linked yet') && rowsI[1].includes('nothing linked yet'), rowsI);
  const months = await ev(`[...document.querySelectorAll('[data-s=glance-months] [role=listitem]')].map(c => c.getAttribute('aria-label'))`);
  check('the timeline-by-month chart has a column for each month with entries', months.length === 2 && months[0] === 'Aug 2026: 1 entry' && /^Sept? 2026: 2 entries$/.test(months[1]), months);
  check('"Next dates" is gone: the dated task is in Coming up', !(await exists('[data-s=glance-dates]')) && !(await exists('[data-s=glance-pictures]')) && (await text('#projectSoon')).includes('Send the witness statement'), await text('#projectSoon'));
  const ptr = await pointerKeys(), ptrText = norm(await text('[data-s=glance-pointers]'));
  check('the pointers include "has nothing linked yet" and "still to get", and there are never more than 3', ptrText.includes('has nothing linked yet') && ptrText.includes('still to get') && ptr.length <= 3, ptr);
  await go('projects/p/pjG5', 2026, 10, 15, 8, 9);
  check('a case with a date, a bare issue, evidence to get and no open task has four possible pointers but shows only 3', eq(await pointerKeys(), ['soon', 'bare', 'to-get']), await pointerKeys());

  check('in this plain build (no AI) there is no "Summarise this" button', !(await exists('[data-action=glance-summary]')) && !(await exists('#projectGlance [data-s=ai-private]')));

  for (const w of [320, 360]) {
    await T.send('Emulation.setDeviceMetricsOverride', { width: w, height: 740, deviceScaleFactor: 2, mobile: true });
    await go('projects/p/pjG4', 2026, 10, 15, 8, 10); await sleep(200);
    check(`phone ${w} px: the case's Overview, with its At a glance, does not scroll sideways`, (await exists('#projectGlance')) && (await ev('document.documentElement.scrollWidth')) <= w, await ev('document.documentElement.scrollWidth'));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[34b] Still-open dates, the order of the Overview, and a phone');
  await go('projects', 2026, 10, 15, 8, 20); await reset(); await go('projects', 2026, 10, 15, 8, 20);
  await seed([pjObj('pjS', 'Still open: mend the tap', 'act', { nextTaskId: 'tkS1', commitmentIds: ['cmS1'] }), pjObj('pjS2', 'Still open: only a name', 'capture')]);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(gtk('tkS1', 'Ring the plumber', 'pjS', { due: '2026-10-12' }))},
    ${JSON.stringify(gtk('tkS2', 'Buy washers', 'pjS', { due: '2026-10-15' }))}, ${JSON.stringify(gtk('tkS3', 'Fit the new tap', 'pjS', { due: '2026-10-19' }))});
    s.commitments.push({ id: 'cmS1', kind: 'appointment', title: 'Plumber visit', start: '2026-10-13T10:00', end: '2026-10-13T11:00' }); }`);
  await go('projects/p/pjS', 2026, 10, 15, 8, 25);
  const soonKinds = () => ev(`[...document.querySelectorAll('#projectSoon ul > li')].map(li => li.dataset.s)`);
  check('Coming up lists the task whose date has passed first, then the dated tasks (a task due today is not still open)', eq(await soonKinds(), ['soon-open', 'soon-task', 'soon-task']), await soonKinds());
  const openParts = await ev(`[...document.querySelectorAll('#projectSoon [data-s=soon-open] a > span')].map(x => x.textContent.trim())`);
  check('…it reads "Still open · was due <date>" and then the title', openParts.length === 2 && /^Still open · was due (Mon,? )?12 Oct$/.test(openParts[0]) && openParts[1] === 'Ring the plumber', openParts);
  check('…the task due today is an ordinary dated task, listed after it', (await soonTasksG())[0].includes('Buy washers') && (await ev(`document.querySelectorAll('#projectSoon [data-s=soon-open]').length`)) === 1, await soonTasksG());
  check('…the past appointment is not listed', !(await text('#projectSoon')).includes('Plumber visit') && !(await exists('#projectSoon [data-s=soon-appt]')), await text('#projectSoon'));
  check('it is the next step, so the Next step card says it: "Still open · was due <date>"', /^Still open · was due (Mon,? )?12 Oct$/.test(norm(await text('#projectNext [data-s=next-still-open]'))), await text('#projectNext'));
  check('…and Worth a look does not repeat it beside the card', !(await pointerKeys()).includes('still-open'), await pointerKeys());
  await type('#projectNextPick', 'tkS3'); await sleep(300);
  check('with another next step chosen, Worth a look puts it first: "<title> — still open, was due <date>"', (await pointerKeys())[0] === 'still-open' && /^Ring the plumber — still open, was due (Mon,? )?12 Oct$/.test(norm(await text('[data-pointer=still-open]'))), [await pointerKeys(), await text('#projectWorth')]);
  check('…and the Next step card shows the new step\'s own date, not "still open"', !(await exists('#projectNext [data-s=next-still-open]')) && (await text('#projectNext [data-s=next-title]')) === 'Fit the new tap', await text('#projectNext'));
  await click('[data-action=project-pause]'); await sleep(300);
  check('a paused project gets no still-open pointer, though Coming up still lists the task', !(await pointerKeys()).includes('still-open') && (await exists('#projectSoon [data-s=soon-open]')), [await pointerKeys(), await soonKinds()]);
  await click('[data-action=project-resume]'); await sleep(300);
  await type('#projectNextPick', 'tkS1'); await sleep(300);
  check('…and nothing says late, overdue or behind', await noBlame(), await text('#app'));
  check('the Overview runs in order: Next step, Worth a look, At a glance, About it, Tasks', eq(await ev(`[...document.querySelectorAll('#projectNext, #projectWorth, #projectGlance, #projectHead, #projectTasks')].map(e => e.id)`), ['projectNext', 'projectWorth', 'projectGlance', 'projectHead', 'projectTasks']));
  await T.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await go('projects/p/pjS', 2026, 10, 15, 8, 26);
  const tops = await ev(`({ next: Math.round(document.querySelector('#projectNext').getBoundingClientRect().top + scrollY), worth: Math.round(document.querySelector('#projectWorth').getBoundingClientRect().top + scrollY) })`);
  check('at 1440 px wide, Next step and Worth a look both start within the first 900 px', tops.next < 900 && tops.worth < 900, tops);
  await T.send('Emulation.clearDeviceMetricsOverride');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  for (const id of ['pjS', 'pjS2']) {
    await go('projects/p/' + id, 2026, 10, 15, 8, 27); await sleep(200);
    check(`phone 320 px: the general project's Overview (${id}) does not scroll sideways`, (await exists('#projectGlance')) && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');
  await go('projects/p/pjS', 2026, 10, 15, 8, 28);
  await click('[data-action=project-step-done]'); await sleep(300);
  check('ticking the task done through the Next step card takes it off Coming up', !(await exists('#projectSoon [data-s=soon-open]')) && !(await text('#projectSoon')).includes('Ring the plumber') && (await task('Ring the plumber')).done === true, await soonKinds());
  check('…and off Worth a look, which then has no still-open pointer', !(await pointerKeys()).includes('still-open') && !(await text('#app')).includes('still open, was due'), await pointerKeys());

  console.log('\n[35] The weekly review');
  const rtk = (id, title, projectId, extra = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-09-20T09:00', postponed: 0, blockers: [], letGoOn: null, projectId, ...extra });
  const stepNo = () => ev(`document.getElementById('reviewStep').dataset.step`);
  const waitKinds = () => ev(`[...document.querySelectorAll('[data-s=waiting]')].map(li => li.dataset.kind)`);
  const waitTexts = () => ev(`[...document.querySelectorAll('[data-s=waiting]')].map(li => li.querySelector('p').textContent)`);
  const rawNow = () => ev(`localStorage.getItem('${KEY}')`);
  const rprefs = async () => (await data()).patterns.prefs;
  const toStep = async n => { for (let i = 0; i < n; i++) { await click('[data-action=review-next]'); await sleep(150); } };
  await go('review', 2026, 10, 18, 9); await reset(); await go('review', 2026, 10, 18, 9);
  check('a week with nothing in it says it is quiet, and that is allowed', (await text('[data-s=review-quiet]')).includes('A quiet week') && !(await exists('[data-s=review-moved]')), await text('#reviewStep'));
  await toStep(1);
  check('…and with nothing needing you, step 2 says so', (await text('[data-s=review-nothing-waiting]')).includes('Nothing needs you right now — lovely.'), await text('#reviewStep'));
  check('in this plain build (no AI) there is no "See the pattern" button', !(await exists('[data-action=review-pattern]')));

  await go('projects', 2026, 10, 18, 9);
  check('Projects\' intro has "Look back at your week", going to the review', (await ev(`document.querySelector('[data-action=open-review]').getAttribute('href')`)) === '#review' && (await text('[data-action=open-review]')).includes('Look back at your week'));
  await click('[data-action=open-review]'); await sleep(300);
  check('…and it opens "Your week" with the seven days', (await hash()) === '#review' && (await text('#reviewH')).includes('Your week') && (await text('#reviewTop')).includes('The last seven days, ') && (await stepNo()) === '0', await text('#reviewTop'));

  const sess = (id, date, ms) => ({ id, courseId: null, taskId: null, title: 'Made-up study', date, startedAt: date + 'T09:00', plannedMin: 20, short: false, status: 'done', runningSince: null, activeMs: ms, endedAt: date + 'T09:30', checkin: null, taskDone: null, todayUid: null });
  const wk = (id, date) => ({ id, date, templateId: null, templateName: 'Made-up workout', startedAt: date + 'T07:00', finishedAt: date + 'T07:40', status: 'done', plannedDate: null, editedAt: null, exercises: [] });
  await seed([
    pjObj('pjR1', 'Review: paint the hall', 'act', { updatedAt: '2026-10-16T09:00', milestones: [msObj('msR1', 'Walls prepared', null, '2026-10-16')] }),
    pjObj('pjR2', 'Review: seed swap', 'act', { updatedAt: '2026-10-16T09:00' }),
    pjObj('pjR3', 'Review: learn piano', 'explore', { updatedAt: '2026-10-16T09:00' }),
    pjObj('pjR4', 'Review: tidy the garden', 'explore', { updatedAt: '2026-10-16T09:00' }),
    pjObj('pjRq', 'Review: old plan', 'capture', { updatedAt: '2026-09-01T09:00' }),
  ]);
  await editStorage(`s => { s.tasks.items.push(
    ${JSON.stringify(rtk('tkR1', 'Sand the walls', 'pjR1', { done: true, doneOn: '2026-10-17' }))}, ${JSON.stringify(rtk('tkR2', 'Fill the cracks', 'pjR1', { done: true, doneOn: '2026-10-16' }))},
    ${JSON.stringify(rtk('tkR3', 'Buy white paint', 'pjR1', { done: true, doneOn: '2026-10-15' }))}, ${JSON.stringify(rtk('tkR4', 'Wash the brushes', 'pjR1', { done: true, doneOn: '2026-10-14' }))},
    ${JSON.stringify(rtk('tkR5', 'Pick a swap date', 'pjR2', { done: true, doneOn: '2026-10-17' }))},
    ${JSON.stringify(rtk('tkR6', 'Call the dentist', null, { done: true, doneOn: '2026-10-16' }))}, ${JSON.stringify(rtk('tkR7', 'Post a parcel', null, { done: true, doneOn: '2026-10-13' }))},
    ${JSON.stringify(rtk('tkR8', 'Done long ago', 'pjR2', { done: true, doneOn: '2026-09-20' }))},
    ${JSON.stringify(rtk('tkS1', 'Renew the passport', null, { postponed: 3 }))}, ${JSON.stringify(rtk('tkS2', 'Book the boiler service', null, { postponed: 4 }))},
    ${JSON.stringify(rtk('tkS3', 'Return the parcel', null, { postponed: 3 }))}, ${JSON.stringify(rtk('tkS4', 'Clear the loft', null, { postponed: 5 }))});
    s.study.sessions.push(${JSON.stringify(sess('stR1', '2026-10-15', 20 * 60000))}, ${JSON.stringify(sess('stR2', '2026-10-17', 25 * 60000))});
    s.health.workout.sessions.push(${JSON.stringify(wk('wkR1', '2026-10-16'))}); }`);
  await go('review', 2026, 10, 18, 9, 5);
  check('step 1 lists the busiest project first with its counts', (await ev(`[...document.querySelectorAll('[data-s=review-moved] > li')].map(li => li.dataset.id)`)).join() === 'pjR1,pjR2' && norm(await text('[data-s=review-moved] > li')).startsWith('Review: paint the hall') && norm(await text('[data-s=review-moved] > li')).includes('4 tasks done · 1 milestone reached'), norm(await text('[data-s=review-moved]')));
  check('…with the names of three done tasks', norm(await text('[data-s=review-moved] > li')).includes('Sand the walls · Fill the cracks · Buy white paint') && !norm(await text('[data-s=review-moved]')).includes('Done long ago'), norm(await text('[data-s=review-moved]')));
  const other = norm(await text('[data-s=review-other]'));
  check('…and the other tasks, Study and workouts in one line each', other.includes('2 other tasks done') && other.includes('Study: 2 sessions, 45 min') && other.includes('1 workout'), other);
  check('…no "quiet week" line when something moved', !(await exists('[data-s=review-quiet]')));
  check('the steps are named, the first marked as current', (await ev(`[...document.querySelectorAll('#reviewTop li')].map(li => li.textContent + (li.getAttribute('aria-current') ? '*' : ''))`)).join('|') === '1. What moved*|2. What needs you|3. Next week\'s focus|4. A line or two', await text('#reviewTop'));

  await click('[data-action=review-next]'); await sleep(200);
  check('Next goes to step 2, "What needs you"', (await stepNo()) === '1' && (await text('#reviewStepH')) === 'What needs you');
  check('waiting items are at most five, stuck tasks first then a quiet project', (await waitKinds()).join() === 'stuck,stuck,stuck,stuck,quiet', await waitKinds());
  check('…a stuck task says how many times it moved; a quiet project how many weeks', (await waitTexts())[0] === '“Renew the passport” has moved 3 times' && (await waitTexts())[4] === '“Review: old plan” has been quiet for 6 weeks', await waitTexts());
  const beforeLeave = await rawNow();
  await click('[data-s=waiting][data-kind=stuck] [data-action=waiting-leave]'); await sleep(200);
  check('"Leave it for now" takes that one off the list and saves nothing', (await waitKinds()).length === 4 && !(await waitTexts()).some(t => t.includes('Renew the passport')) && (await rawNow()) === beforeLeave, await waitTexts());
  await click('[data-action=review-back]'); await sleep(150);
  check('Back returns to the step before', (await stepNo()) === '0' && (await exists('[data-s=review-moved]')));
  await click('[data-action=review-next]'); await sleep(200);
  check('…and the one left for now is still left when you come back', (await waitKinds()).length === 4);
  await click('[data-s=waiting][data-kind=quiet] [data-action=waiting-pause]'); await sleep(250);
  check('"Pause it" on a quiet project pauses it and takes it off the list', (await project('Review: old plan')).status === 'paused' && !(await waitKinds()).includes('quiet') && (await waitKinds()).length === 3, [(await project('Review: old plan')).status, await waitKinds()]);
  await click('[data-s=waiting][data-kind=stuck] [data-action=waiting-let-go]'); await sleep(250);
  const gone = (await data()).tasks.items.filter(t => t.letGoOn);
  check('"Let it go" on a stuck task lets it go (its let-go day is today) and takes it off the list', gone.length === 1 && gone[0].id === 'tkS2' && gone[0].letGoOn === '2026-10-18' && (await waitKinds()).length === 2, [gone.map(t => t.id + t.letGoOn), await waitKinds()]);

  await click('[data-action=review-next]'); await sleep(200);
  check('step 3 lists the active projects with a checkbox each (the paused one is not there)', (await stepNo()) === '2' && (await ev(`[...document.querySelectorAll('[data-s=focus-pick]')].map(i => i.dataset.id)`)).sort().join() === 'pjR1,pjR2,pjR3,pjR4', await text('#reviewStep'));
  for (const id of ['pjR1', 'pjR2', 'pjR3']) { await ev(`document.querySelector('[data-s=focus-pick][data-id=${id}]').click()`); await sleep(100); }
  check('a fourth can\'t be ticked: its box is disabled and "That’s three" says why', (await ev(`document.querySelector('[data-s=focus-pick][data-id=pjR4]').disabled`)) === true && (await text('[data-s=focus-full]')).includes('three'), await text('#reviewStep'));
  await ev(`document.querySelector('[data-s=focus-pick][data-id=pjR3]').click()`); await sleep(100);
  check('…and unticking one makes room again', !(await exists('[data-s=focus-full]')) && (await ev(`document.querySelector('[data-s=focus-pick][data-id=pjR4]').disabled`)) === false);

  await click('[data-action=review-next]'); await sleep(200);
  check('step 4 has the two questions', (await stepNo()) === '3' && (await exists('#reviewWent')) && (await exists('#reviewEasier')) && (await exists('[data-action=review-finish]')));
  await type('#reviewWent', 'The hall is nearly done'); await type('#reviewEasier', 'Fewer plans on Mondays');
  check('the review day starts on Sunday', (await ev(`document.getElementById('reviewDay').value`)) === '0');
  await type('#reviewDay', '3'); await sleep(250);
  check('choosing Wednesday as the review day saves it', (await rprefs()).reviewDay === 3, await rprefs());
  await type('#reviewDay', '0'); await sleep(250);
  check('choosing Sunday again removes it', !('reviewDay' in (await rprefs())), await rprefs());
  const pjBefore = (await pAt('pjR1')).updatedAt;
  await click('[data-action=review-finish]'); await sleep(300);
  const d35 = await data(), pr = d35.patterns.prefs, noteW = d35.notes.items.filter(n => n.reflectionWeek);
  check('Finish puts the chosen projects in focus from tomorrow, and nobody else', d35.projects.items.filter(p => p.focus).map(p => p.id + p.focus).sort().join() === 'pjR1' + '2026-10-19,pjR2' + '2026-10-19', d35.projects.items.map(p => p.id + p.focus));
  check('…without moving a project\'s updated time', (await pAt('pjR1')).updatedAt === pjBefore);
  check('…keeps what you wrote as a note "Week of …" for that week', noteW.length === 1 && noteW[0].title.startsWith('Week of ') && noteW[0].reflectionWeek === '2026-10-12' && noteW[0].text.includes('The hall is nearly done') && noteW[0].text.includes('Fewer plans on Mondays'), noteW);
  check('…and marks this Sunday\'s review as done', pr.reviewed === '2026-10-18', pr);
  check('…then says it is done, naming the focus', (await exists('#reviewDone')) && (await text('[data-s=review-focus-done]')).includes('Review: paint the hall') && (await text('[data-s=review-focus-done]')).includes('Review: seed swap') && (await text('#reviewDone')).includes('Week of'), await text('#reviewDone'));

  await go('projects', 2026, 10, 19, 10);
  check('the board marks a project in focus with "This week’s focus", and no other', (await ev(`[...document.querySelectorAll('.project-card')].filter(c => c.querySelector('[data-s=project-focus]')).map(c => c.dataset.id)`)).sort().join() === 'pjR1,pjR2' && (await text('.project-card[data-id=pjR1] [data-s=project-focus]')) === 'This week’s focus');

  await editStorage(`s => { delete s.patterns.prefs.reviewed; }`);
  await go('review', 2026, 10, 19, 9);
  await toStep(2);
  check('on the Monday the focus already chosen starts ticked', (await ev(`[...document.querySelectorAll('[data-s=focus-pick]:checked')].map(i => i.dataset.id)`)).sort().join() === 'pjR1,pjR2');
  await toStep(1);
  await click('[data-action=review-finish]'); await sleep(300);
  check('finishing with nothing written adds no second note, and marks the review done', (await data()).notes.items.filter(n => n.reflectionWeek).length === 1 && (await rprefs()).reviewed === '2026-10-18' && (await exists('#reviewDone')));


  for (const w of [320]) {
    await T.send('Emulation.setDeviceMetricsOverride', { width: w, height: 740, deviceScaleFactor: 2, mobile: true });
    await go('review', 2026, 10, 18, 11); await sleep(250);
    const w0 = await ev('document.documentElement.scrollWidth');
    await toStep(1); await sleep(200);
    check(`phone ${w} px: the review does not scroll sideways on its first two steps`, (await exists('#reviewStep')) && w0 <= w && (await ev('document.documentElement.scrollWidth')) <= w, [w0, await ev('document.documentElement.scrollWidth')]);
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[35b] Your week, step 4: two more lines when you studied');
  const keepRaw = await rawNow(); // the state [36] expects; put back at the end
  const studyDone = { id: 'ssWk', courseId: 'coP', taskId: 'tkD', title: 'Pre-Security path · DNS in detail', date: '2026-10-15', startedAt: '2026-10-15T09:00', plannedMin: 30, short: false, status: 'done', runningSince: null, activeMs: 1500000, endedAt: '2026-10-15T10:00', checkin: null, taskDone: null, todayUid: null };
  await editStorage(`s => { delete s.patterns.prefs.reviewed; s.notes.items = s.notes.items.filter(n => !n.reflectionWeek); s.study.sessions = []; s.arabic.attempts = []; s.cybersecurity.attempts = []; }`);
  await go('review', 2026, 10, 18, 9);
  await toStep(3);
  check('in a week without Study, step 4 has the two usual questions and no Study block', (await stepNo()) === '3' && (await exists('#reviewWent')) && !(await exists('[data-s=review-study]')) && !(await exists('#reviewGotEasier')), await text('#reviewStep'));
  await editStorage(`s => { s.study.sessions = [${JSON.stringify(studyDone)}]; }`);
  await go('review', 2026, 10, 18, 9);
  await toStep(3);
  check('with a finished Study session in the week, step 4 adds "You studied this week" and its two text areas', (await exists('[data-s=review-study]')) && (await text('[data-s=review-study]')).includes('You studied this week. If you like, two more for the same note:')
    && (await text('label[for=reviewGotEasier]')) === 'What got easier?' && (await text('label[for=reviewStillHard]')) === 'What still feels hard?', await text('#reviewStep'));
  await type('#reviewWent', 'The hall is nearly done'); await type('#reviewGotEasier', 'Reading DNS records'); await type('#reviewStillHard', 'Subnet masks');
  await click('[data-action=review-finish]'); await sleep(300);
  const noteS = (await data()).notes.items.filter(n => n.reflectionWeek === '2026-10-12');
  check('finishing saves the Study answers in the "Week of …" note, as their own paragraphs after the first two questions', noteS.length === 1
    && eq(noteS[0].text.split('\n\n'), ['What went well:\nThe hall is nearly done', 'Study, what got easier:\nReading DNS records', 'Study, what still feels hard:\nSubnet masks']), noteS);
  await ev(`localStorage.setItem('${KEY}', ${JSON.stringify(keepRaw)})`); // leave the state as it was

  console.log('\n[36] Decisions while the browser blocks saving');
  // Storage that can't even be read at start: MyDay keeps changes in memory until the page closes (storage.ts).
  const blocked = (await T.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const no = () => { throw new DOMException('Synthetic blocked storage', 'SecurityError'); };
    Storage.prototype.getItem = no; Storage.prototype.setItem = no; Storage.prototype.removeItem = no; })();` })).identifier;
  await go('projects', 2026, 10, 15, 10);
  check('with saving blocked, MyDay says so', (await text('.storage-note')).includes('Saving is unavailable'), await text('.storage-note'));
  await type('#projectNew', 'Shed without saving'); await click('[data-action=project-add]'); await sleep(300);
  await click('[data-s=project-tabs] a[data-tab=decisions]'); await sleep(250);
  await type('#dcNew', 'Which shed?'); await click('[data-action=dc-add]'); await sleep(300);
  const MD = await ev(`document.querySelector('[data-s=decision]')?.dataset.id`);
  for (const o of ['Wooden', 'Metal']) { await type(`#dcOpt-${MD}`, o); await click('[data-s=decision] [data-action=opt-add]'); await sleep(250); }
  const [MW, MM] = await ev(`[...document.querySelectorAll('[data-s=option]')].map(o => o.dataset.id)`);
  await click(`${sel(MW).op} [data-action=opt-choose]`); await sleep(200);
  await type(`#dcWhy-${MD}`, 'Looks right'); await click('[data-action=dc-decide]'); await sleep(300);
  check('Decide still works in memory', (await ev(`document.querySelector('[data-s=decision]').dataset.state`)) === 'decided' && (await toast()) === 'Decided. It can change later.', await toast());
  await click('[data-action=dc-again]'); await sleep(300);
  check('…so does Think again, keeping the choice under Previous choices', (await ev(`document.querySelector('[data-s=decision]').dataset.state`)) === 'open' && (await text('[data-s=dc-history] summary')) === 'Previous choices (1)');
  await click(`${sel(MW).op} [data-action=opt-choose]`); await sleep(200);
  await click('[data-action=dc-decide]'); await sleep(300);
  await click(`${sel(MW).op} [data-action=opt-remove]`); await answer(true);
  check('…removing the chosen option reopens it', !(await exists(sel(MW).op)) && (await exists(sel(MM).op)) && /this decision is open again/.test(await toast()) && (await text('[data-s=dc-history] summary')) === 'Previous choices (2)', await toast());
  await click('[data-action=dc-remove]'); await answer(true);
  check('…and removing the decision takes it away', !(await exists('[data-s=decision]')) && (await toast()) === 'Decision removed.', await toast());
  await T.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocked });

  console.log('\n[37] The outcome, what counts as finished, and where I left off');
  await go('projects', 2026, 10, 15, 10, 0); await reset(); await go('projects', 2026, 10, 15, 10, 0);
  await type('#projectNew', 'Reading corner'); await click('[data-action=project-add]'); await sleep(400);
  const LP = (await project('Reading corner')).id;
  const lp = async () => project('Reading corner');
  check('a new project has no outcome line, no finish line and no note card, and About it offers a note', !(await exists('[data-s=project-outcome]')) && !(await exists('[data-s=project-finished]')) && !(await exists('#projectLeftOff')) && (await text('[data-action=leftoff-new]')) === 'Leave a note for next time', await text('#projectHead'));
  await click('[data-action=project-edit]'); await sleep(200);
  await type('#projectOutcome', '  A quiet corner I read in every evening  '); await sleep(300);
  await type('#projectFinished', 'The chair is bought and the shelf is up'); await sleep(300);
  let lq = await lp();
  check('the outcome (trimmed) and what counts as finished are saved on the project', lq.outcome === 'A quiet corner I read in every evening' && lq.finishedWhen === 'The chair is bought and the shelf is up', lq);
  await click('[data-action=project-edit]'); await sleep(200);
  check('the Overview shows "Aiming for: …" under the title and "Finished when: …" in About it', (await text('[data-s=project-outcome]')) === 'Aiming for: A quiet corner I read in every evening' && (await text('[data-s=project-finished]')) === 'Finished when: The chair is bought and the shelf is up', [await text('[data-s=project-outcome]'), await text('[data-s=project-finished]')]);
  check('the outcome line sits under the title', await ev(`(() => { const t = document.querySelector('#projectTitle').getBoundingClientRect(), o = document.querySelector('[data-s=project-outcome]').getBoundingClientRect(); return o.top >= t.bottom - 1; })()`));
  await go(`projects/p/${LP}/milestones`, 2026, 10, 15, 10, 5);
  check('the Milestones tab shows the outcome line too', (await text('[data-s=project-outcome]')) === 'Aiming for: A quiet corner I read in every evening', await text('[data-s=project-outcome]'));
  await go(`projects/p/${LP}`, 2026, 10, 15, 10, 6);
  await click('[data-action=project-edit]'); await sleep(200);
  await type('#projectOutcome', ''); await sleep(300);
  await type('#projectFinished', ''); await sleep(300);
  lq = await lp();
  check('clearing both removes the fields from the saved project', !('outcome' in lq) && !('finishedWhen' in lq), lq);
  await click('[data-action=project-edit]'); await sleep(200);
  await go(`projects/p/${LP}/milestones`, 2026, 10, 15, 10, 7);
  check('…and the outcome line and finish line go from the screen', !(await exists('[data-s=project-outcome]')) && !(await text('#app')).includes('Finished when:'));
  await go(`projects/p/${LP}`, 2026, 10, 15, 10, 8);
  check('…on the Overview too', !(await exists('[data-s=project-outcome]')) && !(await exists('[data-s=project-finished]')));

  console.log('  The note');
  await click('[data-action=leftoff-new]'); await sleep(250);
  check('"Leave a note for next time" opens the form with Save disabled while blank', (await exists('[data-s=leftoff-form]')) && (await ev(`document.querySelector('[data-action=leftoff-save]').disabled`)) && !(await exists('[data-action=leftoff-clear]')));
  await type('#projectLeftOffText', '   '); await sleep(150);
  check('spaces alone keep Save disabled', await ev(`document.querySelector('[data-action=leftoff-save]').disabled`));
  await type('#projectLeftOffText', 'Measured the wall. Still to choose: the shelf bracket.'); await sleep(150);
  check('typing enables Save', !(await ev(`document.querySelector('[data-action=leftoff-save]').disabled`)));
  await click('[data-action=leftoff-save]'); await sleep(300);
  lq = await lp();
  check('saving stores the text and the time it was written (today, 10:00 or just after)', lq.leftOff && lq.leftOff.text === 'Measured the wall. Still to choose: the shelf bracket.' && /^2026-10-15T10:\d\d$/.test(lq.leftOff.at), lq.leftOff);
  const NOTE_AT = lq.leftOff.at;
  check('the card appears before Next step, headed with the frozen day', (await exists('#projectLeftOff')) && (await ev(`!!(document.querySelector('#projectLeftOff').compareDocumentPosition(document.querySelector('#projectNext')) & Node.DOCUMENT_POSITION_FOLLOWING)`)) && (await text('[data-s=leftoff-day]')) === '· Thu 15 Oct' && (await text('#projectLeftOff h3')).startsWith('Where I left off') && (await text('[data-s=leftoff-text]')) === 'Measured the wall. Still to choose: the shelf bracket.', [await text('#projectLeftOff h3'), await text('[data-s=leftoff-text]')]);
  check('the toast says it was saved', /^Saved/.test(await toast()), await toast());
  check('About it no longer offers a new note', !(await exists('[data-action=leftoff-new]')));
  await go(`projects/p/${LP}`, 2026, 10, 17, 14, 30);
  check('on a later day the card still says the day it was written, not today', (await text('[data-s=leftoff-day]')) === '· Thu 15 Oct', await text('[data-s=leftoff-day]'));

  await click('[data-action=leftoff-edit]'); await sleep(250);
  check('Edit opens the same form with the note in it and a Clear note button', (await exists('[data-s=leftoff-form]')) && (await ev(`document.getElementById('projectLeftOffText').value`)) === 'Measured the wall. Still to choose: the shelf bracket.' && (await exists('[data-action=leftoff-clear]')));
  await type('#projectLeftOffText', 'Bracket chosen. Next: order the shelf.'); await click('[data-action=leftoff-save]'); await sleep(300);
  lq = await lp();
  check('editing and saving updates the text and moves the time to the new moment', lq.leftOff.text === 'Bracket chosen. Next: order the shelf.' && /^2026-10-17T14:3\d$/.test(lq.leftOff.at), lq.leftOff);
  check('…and the card shows the new text and the new day', (await text('[data-s=leftoff-text]')) === 'Bracket chosen. Next: order the shelf.' && (await text('[data-s=leftoff-day]')) === '· Sat 17 Oct', [await text('[data-s=leftoff-text]'), await text('[data-s=leftoff-day]')]);
  const SAVED = (await lp()).leftOff;
  await click('[data-action=leftoff-edit]'); await sleep(250);
  await type('#projectLeftOffText', 'A change I will not keep'); await click('[data-action=leftoff-cancel]'); await sleep(250);
  check('Cancel keeps the old note, text and time, and closes the form', eq((await lp()).leftOff, SAVED) && !(await exists('[data-s=leftoff-form]')) && (await text('[data-s=leftoff-text]')) === 'Bracket chosen. Next: order the shelf.');

  await click('[data-action=leftoff-edit]'); await sleep(250);
  await click('[data-action=leftoff-clear]'); await answer(false);
  check('Clear note asks first, and "Keep it" keeps the note', eq((await lp()).leftOff, SAVED) && (await exists('#projectLeftOff')));
  await click('[data-action=leftoff-clear]'); await answer(true);
  lq = await lp();
  check('Clear note then confirming removes the card and the saved field', !('leftOff' in lq) && !(await exists('#projectLeftOff')) && !(await exists('[data-s=leftoff-form]')), lq);
  check('…and About it offers "Leave a note for next time" again', (await text('[data-action=leftoff-new]')) === 'Leave a note for next time');

  console.log('  Saving fails');
  await click('[data-action=leftoff-new]'); await sleep(200);
  await type('#projectLeftOffText', 'Kept note'); await click('[data-action=leftoff-save]'); await sleep(300);
  const KEPT = (await lp()).leftOff;
  await click('[data-action=leftoff-edit]'); await sleep(250);
  await type('#projectLeftOffText', 'Draft that cannot be saved');
  await sleep(4500); // let the earlier "Saved" toast go
  await ev(`window.leftOffSaveItem = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === '${KEY}') throw new DOMException('Synthetic full storage', 'QuotaExceededError'); return window.leftOffSaveItem.call(this, k, v); };`);
  await click('[data-action=leftoff-save]'); await sleep(300);
  const failedToast = await toast();
  check('if saving fails, the previous note stays saved, the draft stays in the box, and no "Saved" toast appears', eq((await lp()).leftOff, KEPT) && (await exists('[data-s=leftoff-form]')) && (await ev(`document.getElementById('projectLeftOffText').value`)) === 'Draft that cannot be saved' && !/Saved/.test(failedToast) && /Couldn.t save/.test(failedToast), [failedToast, (await lp()).leftOff]);
  await ev('Storage.prototype.setItem = window.leftOffSaveItem; delete window.leftOffSaveItem;');
  await click('[data-action=leftoff-save]'); await sleep(300);
  check('after saving works again, the same draft saves', (await lp()).leftOff.text === 'Draft that cannot be saved' && !(await exists('[data-s=leftoff-form]')), (await lp()).leftOff);

  console.log('  All three kept by export and import; paused; phone');
  await click('[data-action=project-edit]'); await sleep(200);
  await type('#projectOutcome', 'A quiet corner I read in every evening'); await sleep(250);
  await type('#projectFinished', 'The chair is bought and the shelf is up'); await sleep(250);
  await click('[data-action=project-edit]'); await sleep(200);
  const three = (await lp());
  check('the project now has all three fields', three.outcome && three.finishedWhen && three.leftOff.text === 'Draft that cannot be saved', three);
  await go('projects', 2026, 10, 17, 15, 0);
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  await click('[data-action=export]'); await sleep(1200);
  const expLo = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-17.json', 'utf8'));
  check('"Export my data" includes the outcome, the finish line and the note', eq(expLo.data.projects.items.find(x => x.id === LP), three), expLo.data.projects.items);
  await reset(); await go('today', 2026, 10, 17, 15, 5);
  await setFile(S + '/dl/myday-export-2026-10-17.json'); await sleep(200); await answer(true);
  check('importing it brings all three fields back exactly', eq((await lp()), three), await lp());
  await go(`projects/p/${LP}`, 2026, 10, 17, 15, 10);
  check('…and they show again: the outcome line, the finish line and the note card', (await text('[data-s=project-outcome]')).includes('A quiet corner') && (await text('[data-s=project-finished]')).includes('shelf is up') && (await text('[data-s=leftoff-text]')) === 'Draft that cannot be saved');
  await click('[data-action=project-pause]'); await sleep(300);
  check('a paused project still shows its note (and outcome)', (await lp()).status === 'paused' && (await exists('#projectLeftOff')) && (await text('[data-s=leftoff-text]')) === 'Draft that cannot be saved' && (await exists('[data-s=project-outcome]')));
  await click('[data-action=project-resume]'); await sleep(300);
  await editStorage(`s => { const p = s.projects.items.find(x => x.id === '${LP}'); p.leftOff.text = 'Rang the shop about the extraordinarilylongproductnamewithoutanybreaksatall12345678901234567890 and waiting. ' + 'Then more words to fill the space on a small screen. '.repeat(14); p.outcome = 'An outcome with a very long unbroken word: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; }`);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await go(`projects/p/${LP}`, 2026, 10, 17, 15, 20); await sleep(250);
  check('phone 320 px, with a long note and outcome: the Overview does not scroll sideways', (await exists('#projectLeftOff')) && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  await click('[data-action=leftoff-edit]'); await sleep(250);
  check('phone 320 px: the note form does not scroll sideways either', (await exists('[data-s=leftoff-form]')) && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[38] Waiting on someone or something');
  const wtask = async id => (await data()).tasks.items.find(x => x.id === id);
  const wline = () => text('#taskWaiting [data-s=waiting-line]').then(norm);
  const wBefore = (a, b) => ev(`(() => { const a = document.querySelector(${JSON.stringify(a)}), b = document.querySelector(${JSON.stringify(b)}); return !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING); })()`);
  const chasesOf = title => ev(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.filter(t => t.title === ${JSON.stringify(title)}).length`);
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  await seed([pjObj('pjW', 'Waiting: the armchair', 'act')]);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(gtk('tkA', 'Ask about the armchair', 'pjW', { category: 'admin', createdAt: '2026-09-20T09:00' }))},
    ${JSON.stringify(gtk('tkB', 'Measure the alcove', 'pjW', { category: 'admin', createdAt: '2026-09-21T09:00' }))}, ${JSON.stringify(gtk('tkC', 'Pay council tax', undefined, { category: 'admin' }))}); }`);

  console.log('  On the task\'s page');
  await go('today/tasks/tkA', 2026, 10, 15, 9, 5);
  check('a task still to do offers "Waiting on someone?" beside "Something in the way?", and no wait card yet', (await text('[data-action=task-wait]')) === 'Waiting on someone?' && (await exists('[data-action=task-stuck]')) && !(await exists('#taskWaiting')));
  await click('[data-action=task-wait]'); await sleep(250);
  check('it opens a form: who or what, expected by, and "Mark as waiting" which waits for a name', (await exists('#tWaitOn')) && (await exists('#tWaitUntil')) && (await text('[data-action=wait-save]')) === 'Mark as waiting' && (await ev(`document.querySelector('[data-action=wait-save]').disabled`)));
  await type('#tWaitOn', '   '); await sleep(100);
  check('spaces alone keep it disabled', await ev(`document.querySelector('[data-action=wait-save]').disabled`));
  await click('[data-action=wait-cancel]'); await sleep(250);
  check('Cancel closes the form and saves nothing', !(await exists('#taskWaiting')) && !('waiting' in (await wtask('tkA'))));
  await click('[data-action=task-wait]'); await sleep(250);
  await type('#tWaitOn', '  Priya  '); await type('#tWaitUntil', '2026-10-20'); await sleep(100);
  check('typing a name enables it', !(await ev(`document.querySelector('[data-action=wait-save]').disabled`)));
  await click('[data-action=wait-save]'); await sleep(300);
  check('saving stores the name (trimmed), today as "since", and the expected day', eq((await wtask('tkA')).waiting, { on: 'Priya', since: '2026-10-15', until: '2026-10-20' }), (await wtask('tkA')).waiting);
  check('…and says so in a toast', (await toast()).includes('Waiting on Priya'), await toast());
  check('the wait card shows who, since and expected: "Waiting on Priya since Thu 15 Oct · expected Tue 20 Oct"', (await wline()) === 'Waiting on Priya since Thu 15 Oct · expected Tue 20 Oct', await wline());
  check('the wait card sits above the editor', await wBefore('#taskWaiting', '#taskEditor'));
  check('"Something in the way?" and "Waiting on someone?" are hidden while it waits', !(await exists('[data-action=task-stuck]')) && !(await exists('[data-action=task-wait]')));
  check('the wait card offers Got it, Change and Chase it', (await text('[data-action=wait-done]')) === 'Got it' && (await text('[data-action=wait-change]')) === 'Change' && (await text('[data-action=chase]')) === 'Chase it');
  await go('today/tasks/tkA', 2026, 10, 16, 9, 0);
  await click('[data-action=wait-change]'); await sleep(250);
  check('Change opens the form with the name and day in it, and "Save"', (await ev(`document.getElementById('tWaitOn').value`)) === 'Priya' && (await ev(`document.getElementById('tWaitUntil').value`)) === '2026-10-20' && (await text('[data-action=wait-save]')) === 'Save');
  await type('#tWaitOn', 'Priya at the shop'); await type('#tWaitUntil', ''); await sleep(100);
  await click('[data-action=wait-save]'); await sleep(300);
  check('changing keeps the first "since" (the 15th, though today is the 16th), and clears the expected day', eq((await wtask('tkA')).waiting, { on: 'Priya at the shop', since: '2026-10-15', until: null }), (await wtask('tkA')).waiting);
  check('…and the card reads without an expected day', (await wline()) === 'Waiting on Priya at the shop since Thu 15 Oct', await wline());
  await click('[data-action=wait-done]'); await sleep(300);
  check('Got it ends the wait: no field on the task, no card, and both buttons are back', !('waiting' in (await wtask('tkA'))) && !(await exists('#taskWaiting')) && (await exists('[data-action=task-wait]')) && (await exists('[data-action=task-stuck]')));

  console.log('  From "What\'s getting in the way?"');
  await go('today/tasks/tkB', 2026, 10, 16, 9, 10);
  await click('[data-action=task-stuck]'); await sleep(250);
  check('there is a choice "I\'m waiting on someone or something"', (await text('[data-s=blocker][data-id=waiting]')) === "I'm waiting on someone or something", await ev(`[...document.querySelectorAll('[data-s=blocker]')].map(b => b.textContent)`));
  await click('[data-s=blocker][data-id=waiting]'); await sleep(200);
  check('it asks who or what, and when (optional), and waits for a name', (await text('label[for=stuckText]')) === 'Who or what are you waiting on?' && (await exists('#stuckUntil')) && (await ev(`document.querySelector('[data-action=unstick]').disabled`)));
  await type('#stuckText', 'Dev the joiner'); await type('#stuckUntil', '2026-10-29'); await sleep(100);
  await click('[data-action=unstick]'); await sleep(300);
  const tb = await wtask('tkB');
  check('the task is marked waiting, with who, today and the expected day', eq(tb.waiting, { on: 'Dev the joiner', since: '2026-10-16', until: '2026-10-29' }), tb.waiting);
  check('…and no blocker reason is saved, and nothing else about the task changed', eq(tb.blockers, []) && tb.title === 'Measure the alcove' && tb.due === null && tb.postponed === 0 && !tb.letGoOn, tb);
  check('…the question gives way to the wait card', !(await exists('#stuckCard')) && (await wline()) === 'Waiting on Dev the joiner since Fri 16 Oct · expected Thu 29 Oct', await wline());

  console.log('  On the task row');
  await go('today/tasks', 2026, 10, 16, 9, 20);
  check('Tasks shows "Waiting on Dev the joiner · expected Thu 29 Oct" on its row, and nothing on others', norm(await text('.task-row[data-id=tkB] [data-s=task-waiting]')) === 'Waiting on Dev the joiner · expected Thu 29 Oct' && !(await exists('.task-row[data-id=tkA] [data-s=task-waiting]')) && !(await exists('.task-row[data-id=tkC] [data-s=task-waiting]')), await text('.task-row[data-id=tkB]'));
  await go('projects/p/pjW', 2026, 10, 16, 9, 25);
  check('the project\'s Tasks card shows the same line on the row', norm(await text('#projectTasks .task-row[data-id=tkB] [data-s=task-waiting]')) === 'Waiting on Dev the joiner · expected Thu 29 Oct', await text('#projectTasks'));

  console.log('  The next step');
  await editStorage(`s => { s.tasks.items.find(x => x.id === 'tkA').waiting = { on: 'Priya', since: '2026-10-16', until: '2026-10-20' }; }`);
  await go('projects/p/pjW', 2026, 10, 16, 9, 30);
  check('when every open task is waiting, the Next step card says so and asks for another small step', norm(await text('[data-s=next-all-waiting]')) === 'Everything here is waiting on someone or something. Is there another small step you could take?' && !(await exists('#projectNext [data-s=next-title]')) && (await exists('#projectNextNew')), await text('#projectNext'));
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(gtk('tkD', 'Measure the alcove walls', 'pjW', { category: 'admin', createdAt: '2026-09-22T09:00' }))}); }`);
  await go('projects/p/pjW', 2026, 10, 16, 9, 35);
  check('with a task that isn\'t waiting, MyDay picks that one and skips the earlier waiting tasks', (await text('[data-s=next-title]')) === 'Measure the alcove walls' && !(await exists('[data-s=next-waiting]')) && !(await exists('[data-s=next-all-waiting]')) && (await project('Waiting: the armchair')).nextTaskId === null, await text('#projectNext'));
  check('…and it is offered "Add to today"', await exists('[data-action=project-step-today]'));
  check('the choice list marks the waiting tasks', eq(await ev(`[...document.querySelectorAll('#projectNextPick option')].map(o => o.textContent)`), ['Let MyDay pick', 'Ask about the armchair (waiting)', 'Measure the alcove (waiting)', 'Measure the alcove walls']), await ev(`[...document.querySelectorAll('#projectNextPick option')].map(o => o.textContent)`));
  await type('#projectNextPick', 'tkA'); await sleep(300);
  check('a waiting task you choose yourself stays chosen and is labelled with who and when', (await text('[data-s=next-title]')) === 'Ask about the armchair' && norm(await text('[data-s=next-waiting]')).startsWith('Waiting on Priya · expected Tue 20 Oct'), await text('#projectNext'));
  check('…it suggests choosing another while you wait', norm(await text('[data-s=next-waiting]')).includes('while you wait, you could choose another next step below'));
  check('…it is not offered "Add to today"', !(await exists('[data-action=project-step-today]')) && !(await text('#projectNext')).includes("On today's plan"));
  check('…and before its expected day there is no Chase it, here or in Worth a look', !(await exists('[data-action=chase]')) && !(await pointerKeys()).includes('waiting'), [await pointerKeys(), await text('#projectNext')]);
  await go('today', 2026, 10, 16, 9, 40);
  check('Today\'s "From your projects" does not offer a waiting step', !(await text('#app')).includes('Ask about the armchair'), await exists('#projectSteps'));

  console.log('  Chase it, on the Next step card');
  await editStorage(`s => { s.tasks.items.find(x => x.id === 'tkA').due = '2026-10-18'; }`);
  await go('projects/p/pjW', 2026, 10, 20, 9, 0);
  check('on its expected day the card offers Chase it (and still no Add to today); Worth a look does not repeat the task beside it', (await text('#projectNext [data-action=chase]')) === 'Chase it' && !(await exists('[data-action=project-step-today]')) && !(await pointerKeys()).includes('waiting'), [await text('#projectNext'), await pointerKeys()]);
  check('a chosen waiting step whose date has passed shows only the waiting line, not "Still open · was due …"', await ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); return s.tasks.items.find(x => x.id === 'tkA').due === '2026-10-18'; })()`) && (await exists('#projectNext [data-s=next-waiting]')) && !(await exists('#projectNext [data-s=next-still-open]')) && !(await text('#projectNext')).includes('Still open'), await text('#projectNext'));
  await click('#projectNext [data-action=chase]'); await sleep(250);
  check('Chase it first asks when: Today, Tomorrow, Pick a day, No date, with Today chosen', eq(await ev(`[...document.querySelectorAll('#projectNext [data-s=chase-when-choice]')].map(b => b.dataset.id + (b.getAttribute('aria-pressed') === 'true' ? '*' : ''))`), ['today*', 'tomorrow', 'day', 'none']) && (await exists('#projectNext [data-action=chase-add]')) && (await exists('#projectNext [data-action=chase-cancel]')), await text('#projectNext'));
  check('…and nothing has been added yet', (await chasesOf('Chase: Ask about the armchair')) === 0);
  await click('#projectNext [data-action=chase-cancel]'); await sleep(250);
  check('Cancel adds nothing, closes the question, and Chase it is back', (await chasesOf('Chase: Ask about the armchair')) === 0 && !(await exists('[data-s=chase-when]')) && (await text('#projectNext [data-action=chase]')) === 'Chase it' && !('chaseTaskId' in (await wtask('tkA')).waiting), (await wtask('tkA')).waiting);
  await click('#projectNext [data-action=chase]'); await sleep(250);
  await click('#projectNext [data-s=chase-when-choice][data-id=day]'); await sleep(200);
  check('"Pick a day" asks which day, and Add waits for one', (await exists('#chaseDay-tkA')) && (await ev(`document.querySelector('#projectNext [data-action=chase-add]').disabled`)));
  await type('#chaseDay-tkA', '2026-10-23'); await sleep(150);
  check('…picking a day enables Add', !(await ev(`document.querySelector('#projectNext [data-action=chase-add]').disabled`)));
  await click('#projectNext [data-action=chase-add]'); await sleep(350);
  const ca = (await data()).tasks.items.filter(x => x.title === 'Chase: Ask about the armchair');
  check('Chase it adds exactly one task, "Chase: Ask about the armchair" (no name in the title), of 5 minutes, in this project', ca.length === 1 && ca[0].minutes === 5 && ca[0].projectId === 'pjW' && ca[0].listId === '' && ca[0].category === 'admin' && !ca[0].done, ca);
  check('…due on the day that was picked', ca[0].due === '2026-10-23', ca[0]);
  check('…and records it on the wait', (await wtask('tkA')).waiting.chaseTaskId === ca[0].id, (await wtask('tkA')).waiting);
  check('…the card now says a task to chase it is in this project\'s tasks, and offers Chase it no more', (await text('#projectNext [data-s=chase-added]')).includes('is in this project’s tasks.') && !(await exists('#projectNext [data-action=chase]')) && !(await exists('[data-s=chase-when]')), await text('#projectNext'));
  check('…and the toast says what was added and for which day', (await toast()).includes('Added “Chase: Ask about the armchair” (5 min) for') && (await toast()).includes('23 Oct'), await toast());
  check('…the new task is in the project\'s Tasks card', (await text('#projectTasks')).includes('Chase: Ask about the armchair'));
  check('…and nothing in its title or the new task names who is being waited on', !JSON.stringify(ca[0]).includes('Priya'), ca[0]);
  await go('projects/p/pjW', 2026, 10, 20, 9, 5);
  check('after reloading it is still one task, and the card still shows chase-added', (await chasesOf('Chase: Ask about the armchair')) === 1 && (await exists('#projectNext [data-s=chase-added]')));

  console.log('  Worth a look');
  await editStorage(`s => { s.tasks.items.find(x => x.id === 'tkB').waiting.until = '2026-10-19'; }`);
  await go('projects/p/pjW', 2026, 10, 20, 9, 10);
  check('a waiting task that isn\'t the next step is pointed out once its day has come, first in Worth a look: "Still waiting on … — expected …"', (await pointerKeys())[0] === 'waiting' && (await pointerKeys()).filter(k => k === 'waiting').length === 1 && norm(await text('[data-pointer=waiting]')) === 'Still waiting on Dev the joiner (Measure the alcove) — expected Mon 19 Oct', [await pointerKeys(), await text('#projectWorth')]);
  check('…linking to the task, with Chase it beside it', (await ev(`document.querySelector('[data-pointer=waiting]').getAttribute('href')`)) === '#today/tasks/tkB' && (await text('#projectWorth [data-action=chase]')) === 'Chase it');
  check('…and nothing says late, overdue or behind', await noBlame(), await text('#app'));
  await click('#projectWorth [data-action=chase]'); await sleep(250);
  check('Chase it in Worth a look asks when, too', (await exists('#projectWorth [data-s=chase-when]')) && (await ev(`document.querySelectorAll('#projectWorth [data-s=chase-when-choice]').length`)) === 4);
  await click('#projectWorth [data-action=chase-cancel]'); await sleep(250);
  check('Cancel there adds nothing', (await chasesOf('Chase: Measure the alcove')) === 0 && (await exists('#projectWorth [data-action=chase]')));
  await click('#projectWorth [data-action=chase]'); await sleep(250);
  await click('#projectWorth [data-s=chase-when-choice][data-id=tomorrow]'); await sleep(150);
  await click('#projectWorth [data-action=chase-add]'); await sleep(350);
  const cb = (await data()).tasks.items.filter(x => x.title === 'Chase: Measure the alcove');
  check('"Tomorrow" adds exactly one 5-minute task in this project, due tomorrow (21 Oct), and records it', cb.length === 1 && cb[0].minutes === 5 && cb[0].projectId === 'pjW' && cb[0].due === '2026-10-21' && (await wtask('tkB')).waiting.chaseTaskId === cb[0].id, [cb, (await wtask('tkB')).waiting]);
  check('…then the pointer shows that a task to chase it is in this project\'s tasks, and no Chase it', (await text('#projectWorth [data-s=chase-added]')).includes('is in this project’s tasks.') && !(await exists('#projectWorth [data-action=chase]')), await text('#projectWorth'));
  await type('#projectNextPick', 'tkB'); await sleep(300);
  check('when that task is chosen as the next step, Worth a look no longer points at it (the card says it)', !(await ev(`[...document.querySelectorAll('[data-pointer=waiting]')].some(a => a.getAttribute('href') === '#today/tasks/tkB')`)) && norm(await text('[data-s=next-waiting]')).startsWith('Waiting on Dev the joiner'), [await pointerKeys(), await text('#projectNext')]);
  await type('#projectNextPick', 'tkD'); await sleep(300);
  await click('[data-action=project-pause]'); await sleep(300);
  check('a paused project gets no waiting pointer', !(await pointerKeys()).includes('waiting'), await pointerKeys());
  await click('[data-action=project-resume]'); await sleep(300);
  await editStorage(`s => { const t = s.tasks.items.find(x => x.id === 'tkA'); t.done = true; t.doneOn = '2026-10-20'; }`);
  await go('projects/p/pjW', 2026, 10, 20, 9, 15);
  check('a waiting task that is ticked done is no longer pointed out or counted as waiting on its row', !(await ev(`[...document.querySelectorAll('[data-pointer=waiting]')].some(a => a.getAttribute('href') === '#today/tasks/tkA')`)));
  await editStorage(`s => { const t = s.tasks.items.find(x => x.id === 'tkA'); t.done = false; t.doneOn = null; }`);

  console.log('  Chase it, on the task page');
  await editStorage(`s => { const base = ${JSON.stringify(gtk('x', 'x', undefined, { category: 'admin' }))};
    s.tasks.items.push({ ...base, id: 'tkF', title: 'Order the part', waiting: { on: 'Sam at the parts shop', since: '2026-10-12', until: '2026-10-19' } }); s.tasks.items.find(x => x.id === 'tkC').waiting = { on: 'The council', since: '2026-10-12', until: '2026-10-19' }; }`);
  await go('today/tasks/tkC', 2026, 10, 20, 9, 30);
  await click('#taskWaiting [data-action=chase]'); await sleep(250);
  check('on the task page, Chase it asks when, with Today chosen first', eq(await ev(`[...document.querySelectorAll('#taskWaiting [data-s=chase-when-choice]')].map(b => b.dataset.id + (b.getAttribute('aria-pressed') === 'true' ? '*' : ''))`), ['today*', 'tomorrow', 'day', 'none']));
  await click('#taskWaiting [data-action=chase-add]'); await sleep(350);
  const cc = (await data()).tasks.items.filter(x => x.title === 'Chase: Pay council tax');
  check('"Today" (the default) adds exactly one 5-minute task due today (20 Oct), outside any project', cc.length === 1 && cc[0].minutes === 5 && cc[0].due === '2026-10-20' && !('projectId' in cc[0]) && (await wtask('tkC')).waiting.chaseTaskId === cc[0].id, cc);
  check('…and for a task with no project the card says it is in "your tasks."', (await text('#taskWaiting [data-s=chase-added]')).includes('is in your tasks.') && !(await exists('#taskWaiting [data-action=chase]')), await text('#taskWaiting'));
  await go('today/tasks/tkF', 2026, 10, 20, 9, 35);
  await click('#taskWaiting [data-action=chase]'); await sleep(250);
  await click('#taskWaiting [data-s=chase-when-choice][data-id=none]'); await sleep(150);
  check('"No date" leaves Add enabled', !(await ev(`document.querySelector('#taskWaiting [data-action=chase-add]').disabled`)));
  await click('#taskWaiting [data-action=chase-add]'); await sleep(350);
  const cf = (await data()).tasks.items.filter(x => x.title === 'Chase: Order the part');
  check('…and adds exactly one 5-minute task with no date, and the toast says "with no date"', cf.length === 1 && cf[0].minutes === 5 && cf[0].due === null && (await toast()).includes('with no date'), [cf, await toast()]);

  console.log('  Export and import');
  await go('projects', 2026, 10, 20, 10, 0);
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  const waitingBefore = (await data()).tasks.items.filter(x => x.waiting).map(x => [x.id, x.waiting]);
  await click('[data-action=export]'); await sleep(1200);
  const expW = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-20.json', 'utf8'));
  check('"Export my data" includes all four waits', waitingBefore.length === 4 && eq(expW.data.tasks.items.filter(x => x.waiting).map(x => [x.id, x.waiting]), waitingBefore), waitingBefore);
  await reset(); await go('today', 2026, 10, 20, 10, 5);
  check('after a reset there are no tasks', (await data()).tasks.items.length === 0);
  await setFile(S + '/dl/myday-export-2026-10-20.json'); await sleep(200); await answer(true);
  check('importing the backup brings all four waits back exactly, with their chase records', eq((await data()).tasks.items.filter(x => x.waiting).map(x => [x.id, x.waiting]), waitingBefore) && eq((await data()).tasks.items, expW.data.tasks.items), (await data()).tasks.items.length);
  await go('today/tasks', 2026, 10, 20, 10, 10);
  check('…and the rows show them again', norm(await text('.task-row[data-id=tkA] [data-s=task-waiting]')) === 'Waiting on Priya · expected Tue 20 Oct' && norm(await text('.task-row[data-id=tkB] [data-s=task-waiting]')) === 'Waiting on Dev the joiner · expected Mon 19 Oct');

  console.log('  Phone, 320 px');
  await editStorage(`s => { const w = s.tasks.items.find(x => x.id === 'tkB').waiting; w.on = 'Dev' + 'x'.repeat(117); }`);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await go('today/tasks/tkB', 2026, 10, 20, 10, 20); await sleep(250);
  check('phone 320 px: the task page with a long wait does not scroll sideways', (await exists('#taskWaiting')) && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  await go('today/tasks/tkD', 2026, 10, 20, 10, 21);
  await click('[data-action=task-wait]'); await sleep(250);
  check('phone 320 px: the wait form does not scroll sideways', (await exists('#tWaitOn')) && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  await editStorage(`s => { s.projects.items.find(x => x.id === 'pjW').nextTaskId = 'tkB'; s.tasks.items.find(x => x.id === 'tkA').waiting.until = '2026-10-19'; s.tasks.items.find(x => x.id === 'tkA').waiting.chaseTaskId = 'tkNone'; }`);
  await go('projects/p/pjW', 2026, 10, 20, 10, 25); await sleep(250);
  check('phone 320 px: the Overview with a waiting next step, a pointer and Chase it does not scroll sideways', (await exists('[data-s=next-waiting]')) && (await exists('[data-pointer=waiting]')) && (await exists('#projectWorth [data-action=chase]')) && (await ev('document.documentElement.scrollWidth')) <= 320, [await pointerKeys(), await ev('document.documentElement.scrollWidth')]);
  await click('#projectWorth [data-action=chase]'); await sleep(250);
  check('phone 320 px: the Chase it question (four choices) does not scroll sideways, and its buttons are 44 px tall', (await exists('[data-s=chase-when]')) && (await ev('document.documentElement.scrollWidth')) <= 320 && (await ev(`[...document.querySelectorAll('[data-s=chase-when] button')].every(b => b.getBoundingClientRect().height >= 44)`)), await ev('document.documentElement.scrollWidth'));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('  What\'s getting in the way?, and a form that ends');
  await go('projects', 2026, 10, 20, 11, 0); await reset(); await go('projects', 2026, 10, 20, 11, 0);
  await editStorage(`s => { const base = ${JSON.stringify(gtk('x', 'x', undefined, { category: 'admin' }))};
    s.tasks.items.push({ ...base, id: 'tkE', title: 'Renew the bus pass', due: '2026-10-05', createdAt: '2026-09-20T09:00' }, { ...base, id: 'tkH', title: 'Ring the plumber' }); }`);
  await go('today/tasks/tkE', 2026, 10, 20, 11, 5);
  check('a task a week past its date asks kindly: "This one was planned for Mon 5 Oct." (not "has been waiting")', (await text('[data-s=stuck-intro]')).startsWith('This one was planned for Mon 5 Oct.') && !(await text('[data-s=stuck-intro]')).includes('waiting'), await text('[data-s=stuck-intro]'));
  check('its footer note says the answer is kept with the task', (await text('#stuckCard')).includes('Your answer is kept with the task'));
  await click('[data-s=blocker][data-id=big]'); await sleep(150);
  check('…and keeps saying so for another choice', (await text('#stuckCard')).includes('Your answer is kept with the task'));
  await click('[data-s=blocker][data-id=waiting]'); await sleep(200);
  check('choosing "I\'m waiting on someone or something" hides that footer note (nothing is kept as a reason)', !(await text('#stuckCard')).includes('Your answer is kept') && (await exists('#stuckUntil')), await text('#stuckCard'));
  await click('[data-s=blocker][data-id=tired]'); await sleep(150);
  check('…and choosing another brings it back', (await text('#stuckCard')).includes('Your answer is kept with the task'));
  const elsewhere = fn => ev(`(() => { const key = '${KEY}', oldValue = localStorage.getItem(key); const s = JSON.parse(oldValue); (${fn})(s); const newValue = JSON.stringify(s); localStorage.setItem(key, newValue); window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage })); })()`);
  await go('today/tasks/tkH', 2026, 10, 20, 11, 10);
  await click('[data-action=task-wait]'); await sleep(250);
  await type('#tWaitOn', 'Priya'); await click('[data-action=wait-save]'); await sleep(300);
  check('a wait started from the button is saved and its card shows', (await wtask('tkH')).waiting?.on === 'Priya' && (await exists('#taskWaiting [data-s=waiting-line]')));
  await elsewhere(`s => { delete s.tasks.items.find(x => x.id === 'tkH').waiting; }`); await sleep(500);
  check('when another tab ends the wait, the card goes and the empty form does not reopen by itself', !('waiting' in (await wtask('tkH'))) && !(await exists('#taskWaiting')) && !(await exists('#tWaitOn')) && (await exists('[data-action=task-wait]')), await text('#app'));
  await elsewhere(`s => { s.tasks.items.find(x => x.id === 'tkH').title = 'Ring the plumber again'; }`); await sleep(400);
  check('…and a later change from another tab still does not open it', !(await exists('#tWaitOn')) && !(await exists('#taskWaiting')));
  await click('[data-action=task-wait]'); await sleep(250);
  check('tapping "Waiting on someone?" again does open it', await exists('#tWaitOn'));


  console.log('\n[39] Searching one project');
  const srLongNote = 'We talked for a long while about many other things before the electrician mentioned the old fuse board and then we moved on to something quite different at the end of the afternoon.';
  const srRows = () => ev(`[...document.querySelectorAll('#projectSearchResults [data-s=search-hit]')].map(li => li.dataset.kind + ':' + [...li.querySelectorAll('a > span')].map(x => x.textContent.trim()).join(' | '))`);
  const srHrefs = () => ev(`[...document.querySelectorAll('#projectSearchResults [data-s=search-hit] a')].map(a => a.getAttribute('href'))`);
  const srType = async q => { await type('#projectSearch', q); await until(`(document.getElementById('pjSearchH') || {}).textContent?.includes(${JSON.stringify('“' + q.trim() + '”')})`); };
  const srInTab = () => ev(`document.querySelector('[data-s=project-tab]').hidden`);
  const srFocusOn = id => until(`(() => { const a = document.activeElement; return !!a && (a.dataset.id === ${JSON.stringify(id)} || !!a.closest('[data-id="${id}"]')); })()`);
  const srField = () => ev(`document.getElementById('projectSearch').value`);
  const srShowing = () => exists('#projectSearchResults');
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  await seed([
    pjObj('pjQ', 'Garden shed rebuild', 'act', { summary: 'A dry shed for the bikes', milestones: [msObj('msQ', 'Foundations poured')],
      decisions: [dcObj('dcQ', 'Which cladding?', [{ id: 'oQ1', text: 'Larch boards', pros: ['Lasts for decades'], cons: [] }, { id: 'oQ2', text: 'Felt panels', pros: [], cons: [] }], 'oQ1', 'Neighbour recommended it', '2026-10-05')] }),
    pjObj('pjR', 'Another project', 'act', { summary: 'Has a spare armchair too' }),
    caseObj('pjQc', 'Overtime dispute', { timeline: [tlObj('tlQ', '2026-10-01', 'Asked the manager about pay', { details: 'Spoke by the lift' })], evidence: [evObj('evQ', 'Payslip for September', 'have', { where: 'Blue folder', notes: 'Shows no overtime line' })], issues: [isObj('isQ', 'Unpaid hours', { notes: 'Roughly six hours a week' })] }),
  ]);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(gtk('tkQ1', 'Order the armchair cushions', 'pjQ', { done: true, doneOn: '2026-10-03' }))},
    ${JSON.stringify(gtk('tkQ2', 'Buy bolts', 'pjQ', { notes: 'Check the armchair is not in the way' }))}, ${JSON.stringify(gtk('tkQ3', 'Armchair idea for the shed', 'pjQ', { letGoOn: '2026-10-04' }))},
    ${JSON.stringify(gtk('tkQ4', 'Armchair for the other project', 'pjR'))});
    s.notes.items.push({ id: 'ntQ', categoryId: '', title: 'Electrician', text: ${JSON.stringify(srLongNote)}, pinned: false, createdAt: '2026-10-02T09:00', updatedAt: '2026-10-02T09:00', projectId: 'pjQ' },
    { id: 'ntPv', categoryId: '', title: 'Boiler quote', text: '', pinned: false, private: true, createdAt: '2026-10-02T10:00', updatedAt: '2026-10-02T10:00', projectId: 'pjQ' }); }`);

  console.log('  The search box');
  await go('projects/p/pjQ', 2026, 10, 15, 9, 5);
  check('the project page has a search form with a field labelled "Search this project"', (await exists('form[role=search][data-s=project-search] #projectSearch')) && (await ev(`document.getElementById('projectSearch').labels[0].textContent`)) === 'Search this project' && (await ev(`document.getElementById('projectSearch').getAttribute('placeholder')`)) === 'Search this project');
  check('nothing shows but the tab while the field is empty, and the status line is empty', !(await srShowing()) && (await tabOf()) === 'overview' && (await exists('#projectHead')) && !(await srInTab()) && (await text('[data-s=search-status]')) === '');
  check('the field has autocomplete off and a Search key on phones, and the status line is a status region for screen readers', (await ev(`document.getElementById('projectSearch').getAttribute('autocomplete')`)) === 'off' && (await ev(`document.getElementById('projectSearch').getAttribute('enterkeyhint')`)) === 'search' && (await ev(`document.querySelector('[data-s=search-status]').getAttribute('role')`)) === 'status' && (await ev(`document.querySelector('[data-s=search-status]').classList.contains('sr-only')`)));

  console.log('  Typing shows results and hides the tab');
  const srSaved = await ev(`localStorage.getItem('${KEY}')`);
  await srType('armchair');
  check('typing shows the results above the Overview, which stays in the page but hidden', (await srShowing()) && (await srInTab()) && (await ev(`!!(document.getElementById('projectSearchResults').compareDocumentPosition(document.querySelector('[data-s=project-tab]')) & Node.DOCUMENT_POSITION_FOLLOWING)`)) && (await ev(`document.querySelector('[data-s=project-tab] #projectHead').getBoundingClientRect().height`)) === 0, await text('#app'));
  check('the heading counts the matches: "3 matches for “armchair”"', (await text('#pjSearchH')) === '3 matches for “armchair”', await text('#pjSearchH'));
  check('the status line tells a screen reader the same: "3 matches for “armchair”"', (await text('[data-s=search-status]')) === '3 matches for “armchair”', await text('[data-s=search-status]'));
  const srR1 = await srRows();
  check('open tasks come before the done and let-go ones, which are marked, and another project\'s items are left out', eq(srR1.map(x => x.split(':')[0]), ['task', 'task', 'task']) && srR1[0].includes('Buy bolts') && srR1[0].startsWith('task:Task | ') && srR1[1].includes('Task · Done') && srR1[1].includes('Order the armchair cushions') && srR1[2].includes('Task · Let go'), srR1);
  check('a match in the notes shows an excerpt, and a match in the title does not', (await text('#projectSearchResults [data-s=search-excerpt]')) === 'Check the armchair is not in the way' && (await ev(`document.querySelectorAll('#projectSearchResults [data-s=search-excerpt]').length`)) === 1);
  check('each result is a link to its item', eq(await srHrefs(), ['#today/tasks/tkQ2', '#today/tasks/tkQ1', '#today/tasks/tkQ3']), await srHrefs());
  await srType('ARMCHAIR   cushions');
  check('capitals and extra spaces do not matter, and every word has to match: "1 match for …" (singular)', (await text('#pjSearchH')).startsWith('1 match for “ARMCHAIR') && eq(await srRows(), ['task:Task · Done | Order the armchair cushions']), [await text('#pjSearchH'), await srRows()]);
  await srType('electrician');
  check('a note is found by its title; the excerpt is not shown when the title matches', eq(await srRows(), ['note:Note | Electrician']) && !(await exists('[data-s=search-excerpt]')), await srRows());
  await srType('fuse board');
  const srExc = await text('#projectSearchResults [data-s=search-excerpt]');
  check('a match in the note\'s longer text shows a short excerpt around it, with ellipses', srExc.includes('fuse board') && srExc.startsWith('…') && srExc.endsWith('…') && srExc.length < srLongNote.length, srExc);
  await srType('larch cladding');
  check('a decision is found by its question and its options together', eq((await srRows()).map(x => x.split(':')[0]), ['decision']) && eq(await srHrefs(), ['#projects/p/pjQ/decisions']), await srRows());
  check('searching saved nothing: the saved data is byte-identical', (await ev(`localStorage.getItem('${KEY}')`)) === srSaved);

  console.log('  On another tab');
  await go('projects/p/pjQ/milestones', 2026, 10, 15, 9, 10);
  check('the Milestones tab shows its list before searching', (await tabOf()) === 'milestones' && (await exists('#projectMilestones')) && !(await srInTab()));
  await srType('foundations');
  check('typing on the Milestones tab shows the results and hides the tab\'s content too', (await srShowing()) && eq(await srRows(), ['milestone:Milestone | Foundations poured']) && (await srInTab()) && (await ev(`document.getElementById('projectMilestones').getBoundingClientRect().height`)) === 0, await text('#app'));
  check('the tabs stay, with Milestones still the one you are on', (await tabOf()) === 'milestones');

  console.log('  Drafts, other tabs, and the status line');
  await go('projects/p/pjQ/milestones', 2026, 10, 15, 9, 12);
  await type('#msNew', 'Draft: order the roof'); await srType('foundations');
  await click('[data-action=search-clear]');
  check('what was being typed on the tab is still there after searching and clearing', (await until(`!document.getElementById('projectSearchResults')`)) && (await ev(`document.getElementById('msNew').value`)) === 'Draft: order the roof', await ev(`document.getElementById('msNew').value`));
  await srType('foundations ');
  check('while searching, the status line reads the count', (await text('[data-s=search-status]')) === '1 match for “foundations”', await text('[data-s=search-status]'));
  await click('[data-tab=decisions]'); await sleep(300);
  check('choosing another tab ends the search: the field is empty, there are no results, and that tab shows', (await tabOf()) === 'decisions' && (await srField()) === '' && !(await srShowing()) && !(await srInTab()) && (await exists('#projectDecisions')) && (await text('[data-s=search-status]')) === '', [await tabOf(), await srField()]);
  await srType('felt'); await click('[data-action=search-clear]');
  check('Clear leaves the status line empty again', (await until(`!document.getElementById('projectSearchResults')`)) && (await text('[data-s=search-status]')) === '');
  await go('projects/p/pjQ/milestones', 2026, 10, 15, 9, 13);

  console.log('  Nothing found, Clear and Escape');
  await srType('zebra');
  check('nothing found: "Nothing in this project matches “zebra”" and a plain hint, no results', (await text('#pjSearchH')) === 'Nothing in this project matches “zebra”' && (await ev(`document.querySelectorAll('[data-s=search-hit]').length`)) === 0 && (await text('#projectSearchResults')).includes('It looks at what it’s about, its tasks, notes, milestones, decisions and links. Every word you type has to be there'), await text('#projectSearchResults'));
  await click('[data-action=search-clear]');
  check('Clear empties the field, brings the Milestones tab back and focuses the field', await until(`!document.getElementById('projectSearchResults') && document.activeElement && document.activeElement.id === 'projectSearch'`) && (await srField()) === '' && (await tabOf()) === 'milestones', [await srField(), await ev(`document.activeElement && document.activeElement.id`)]);
  await srType('foundations');
  await ev(`document.getElementById('projectSearch').focus()`);
  await T.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await T.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  check('Escape in the field clears the search and brings the tab back', await until(`!document.getElementById('projectSearchResults')`) && (await srField()) === '', await srField());

  console.log('  Opening a result');
  await go('projects/p/pjQ', 2026, 10, 15, 9, 15);
  await srType('foundations');
  await click('[data-s=search-hit][data-kind=milestone] a'); await sleep(300);
  check('a milestone result opens the Milestones tab with the search cleared', (await hash()) === '#projects/p/pjQ/milestones' && (await tabOf()) === 'milestones' && !(await srShowing()) && (await srField()) === '', [await hash(), await srField()]);
  check('…and the keyboard is on that milestone', await srFocusOn('msQ'), await ev(`document.activeElement && document.activeElement.outerHTML.slice(0, 80)`));
  await srType('felt');
  await click('[data-s=search-hit][data-kind=decision] a'); await sleep(300);
  check('a decision result opens the Decisions tab with the search cleared', (await hash()) === '#projects/p/pjQ/decisions' && (await tabOf()) === 'decisions' && !(await srShowing()) && (await srField()) === '', [await hash(), await srField()]);
  check('…and the keyboard is on that decision, not on the search field', await srFocusOn('dcQ') && (await ev(`document.activeElement.id`)) !== 'projectSearch', await ev(`document.activeElement && document.activeElement.outerHTML.slice(0, 80)`));
  await srType('garden shed');
  await click('[data-s=search-hit][data-kind=about] a');
  check('the project\'s own words (its name) open the Overview with the keyboard on its "About this project" card', await until(`document.activeElement && document.activeElement.id === 'projectHead'`) && (await tabOf()) === 'overview' && (await srField()) === '', [await tabOf(), await ev(`document.activeElement && document.activeElement.id`)]);
  await srType('bolts');
  await click('[data-s=search-hit][data-kind=task] a'); await sleep(400);
  check('a task result opens the task page', (await hash()) === '#today/tasks/tkQ2' && !(await srShowing()) && (await exists('#taskEditor')), await hash());

  console.log('  A private note');
  await go('projects/p/pjQ', 2026, 10, 15, 9, 18);
  await srType('boiler');
  check('a private note\'s result says "· Private" on its label line', eq(await srRows(), ['note:Note · Private | Boiler quote']), await srRows());
  await srType('electrician');
  check('a note that is not private has no "Private" on its label', eq(await srRows(), ['note:Note | Electrician']), await srRows());

  console.log('  A business idea\'s hint');
  await seed([bizObj('pjQb', 'Tea stall', { problem: 'Commuters want good tea', who: 'Station queues', how: 'A cart', assumptions: [asObj('asQ', 'People pay two pounds', 'looks-true', { found: 'Six of ten said yes' })] })]);
  await go('projects/p/pjQb', 2026, 10, 15, 9, 19);
  await srType('zebra');
  check('nothing found on a business idea says "…milestones, decisions, its one page and links."', (await text('#projectSearchResults')).includes('It looks at what it’s about, its tasks, notes, milestones, decisions, its one page and links. Every word'), await text('#projectSearchResults'));
  await srType('your answers');
  check('MyDay\'s own label "Your answers" is not searched: it finds nothing', (await text('#pjSearchH')) === 'Nothing in this project matches “your answers”');
  await srType('commuters');
  check('the answers are found by what was written, as "Your answers" on the one page', eq(await srRows(), ['model:Your one page | Your answers | Commuters want good tea']), await srRows());
  await click('[data-s=search-hit][data-kind=model] a');
  check('picking the answers opens the Model tab and puts the keyboard on its heading', (await until(`document.activeElement && document.activeElement.id === 'pjModelH'`)) && (await tabOf()) === 'model', await ev(`document.activeElement && document.activeElement.id`));
  await srType('two pounds'); await click('[data-s=search-hit][data-kind=model] a');
  check('picking an assumption puts the keyboard on that assumption', await srFocusOn('asQ'), await ev(`document.activeElement && document.activeElement.outerHTML.slice(0, 80)`));

  console.log('  A case');
  await go('projects/p/pjQc', 2026, 10, 15, 9, 20);
  await srType('overtime');
  check('a case\'s results include evidence (title or notes)', eq((await srRows()).map(x => x.split(':')[0]), ['about', 'evidence']) && (await srHrefs())[1] === '#projects/p/pjQc/evidence', await srRows());
  await srType('zebra');
  check('nothing found on a case says "…decisions, its timeline, evidence, issues and links."', (await text('#projectSearchResults')).includes('It looks at what it’s about, its tasks, notes, milestones, decisions, its timeline, evidence, issues and links. Every word'), await text('#projectSearchResults'));
  await srType('manager');
  check('…the timeline', eq((await srHrefs()), ['#projects/p/pjQc/timeline']) && (await text('#pjSearchH')) === '1 match for “manager”', await srHrefs());
  await srType('hours');
  check('…and the issues', eq((await srHrefs()), ['#projects/p/pjQc/issues']) && (await srRows())[0].startsWith('issue:Issue | '), await srRows());
  await srType('pay');
  check('a word in a timeline entry and in evidence finds both, timeline first', eq((await srRows()).map(x => x.split(':')[0]), ['timeline', 'evidence']), await srRows());
  await srType('o');
  check('a short word finds the project and every kind of case record, in the order about, timeline, evidence, issue', eq((await srRows()).map(x => x.split(':')[0]), ['about', 'timeline', 'evidence', 'issue']), await srRows());
  await click('[data-s=search-hit][data-kind=timeline] a'); await sleep(300);
  check('a timeline result opens the Timeline tab with the search cleared', (await hash()) === '#projects/p/pjQc/timeline' && (await tabOf()) === 'timeline' && (await srField()) === '');
  check('…and the keyboard is on that timeline entry', await srFocusOn('tlQ'), await ev(`document.activeElement && document.activeElement.outerHTML.slice(0, 80)`));
  await srType('payslip'); await click('[data-s=search-hit][data-kind=evidence] a');
  check('an evidence result opens the Evidence tab, cleared, with the keyboard on that evidence', (await tabOf()) === 'evidence' && (await srField()) === '' && await srFocusOn('evQ'), [await tabOf(), await ev(`document.activeElement && document.activeElement.outerHTML.slice(0, 80)`)]);
  await srType('unpaid'); await click('[data-s=search-hit][data-kind=issue] a');
  check('an issue result opens the Issues tab, cleared, with the keyboard on that issue', (await tabOf()) === 'issues' && (await srField()) === '' && await srFocusOn('isQ'), [await tabOf(), await ev(`document.activeElement && document.activeElement.outerHTML.slice(0, 80)`)]);

  console.log('  Another project starts empty');
  await go('projects/p/pjQ', 2026, 10, 15, 9, 25);
  await srType('armchair');
  await ev(`location.hash = '#projects/p/pjR'`); await sleep(400);
  check('opening another project starts with an empty search and its own tab', (await text('#projectTitle')) === 'Another project' && (await srField()) === '' && !(await srShowing()), [await text('#projectTitle'), await srField()]);
  await srType('armchair');
  check('…and finds only that project\'s own items', eq((await srRows()).map(x => x.split(':')[0]), ['about', 'task']) && (await srHrefs()).every(h => /pjR|tkQ4/.test(h)), await srRows());

  console.log('  A phone');
  for (const w of [320]) {
    await T.send('Emulation.setDeviceMetricsOverride', { width: w, height: 740, deviceScaleFactor: 2, mobile: true });
    await go('projects/p/pjQ', 2026, 10, 15, 9, 30);
    await srType('armchair');
    check(`phone ${w} px: the results do not scroll sideways`, (await srShowing()) && (await ev('document.documentElement.scrollWidth')) <= w, await ev('document.documentElement.scrollWidth'));
    check(`phone ${w} px: each result and Clear is at least 44 px tall`, await ev(`[...document.querySelectorAll('#projectSearchResults [data-s=search-hit] a, [data-action=search-clear]')].every(e => e.getBoundingClientRect().height >= 44)`));
    await srType('x'.repeat(110));
    check(`phone ${w} px: a long unbroken search does not scroll sideways, and the heading says nothing matches`, (await text('#pjSearchH')).startsWith('Nothing in this project matches') && (await ev('document.documentElement.scrollWidth')) <= w, await ev('document.documentElement.scrollWidth'));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[40] Why this next step');
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  await seed([pjObj('pjNW', 'Shed doors', 'act')]);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(gtk('tkNw', 'Ask Sam about bolts', 'pjNW', { due: '2026-10-20', createdAt: '2026-09-20T09:00', waiting: { on: 'Sam', since: '2026-10-01', until: null } }))},
    ${JSON.stringify(gtk('tkNd', 'Sand the door', 'pjNW', { due: '2026-10-30', createdAt: '2026-09-21T09:00' }))}, ${JSON.stringify(gtk('tkNu', 'Tidy the shed', 'pjNW', { createdAt: '2026-09-22T09:00' }))}); }`);
  const nwSaved = () => pAt('pjNW');
  const nwWhy = () => text('[data-s=next-why-text]').then(norm);
  const nwNext = () => text('[data-s=next-title]');
  const nwDated = 'MyDay’s pick: it has the earliest date (Fri 30 Oct) of the tasks that aren’t waiting. “Ask Sam about bolts” comes first, but it’s waiting on Sam.';
  await go('projects/p/pjNW', 2026, 10, 15, 9, 5);
  check('MyDay picks the dated task that is not waiting, passing over the waiting one', (await nwNext()) === 'Sand the door' && ((await nwSaved()).nextTaskId ?? null) === null, await nwNext());
  check('the Next step card has a folded "Why this?" that is at least 44 px tall', (await exists('#projectNext details[data-s=next-why]')) && !(await ev(`document.querySelector('[data-s=next-why]').open`)) && (await text('[data-s=next-why] summary')) === 'Why this?' && (await ev(`document.querySelector('[data-s=next-why] summary').getBoundingClientRect().height`)) >= 44, await text('[data-s=next-why] summary'));
  await click('[data-s=next-why] summary'); await sleep(200);
  check('opening it shows the dated task\'s reason and who the waiting one is waiting on', (await ev(`document.querySelector('[data-s=next-why]').open`)) && (await nwWhy()) === nwDated, await nwWhy());
  const opts = await ev(`[...document.querySelectorAll('#projectNextPick option')].map(o => [o.value, o.textContent, o.selected])`);
  check('the picker\'s first option is "Let MyDay pick" (empty value) and it is selected while MyDay picks', eq(opts[0], ['', 'Let MyDay pick', true]) && opts.slice(1).every(o => !o[2]) && opts.length === 4, opts);

  console.log('  Choosing, and handing the choice back');
  await type('#projectNextPick', 'tkNu'); await sleep(300);
  check('choosing the undated task saves it as the next step and shows it', (await nwSaved()).nextTaskId === 'tkNu' && (await nwNext()) === 'Tidy the shed', [(await nwSaved()).nextTaskId, await nwNext()]);
  check('the reason then says it is your choice, and what MyDay would pick', (await nwWhy()) === 'You chose this step. Left to MyDay, it would be “Sand the door”.', await nwWhy());
  check('…and the picker now shows that task as selected', (await ev(`document.getElementById('projectNextPick').value`)) === 'tkNu');
  await type('#projectNextPick', ''); await sleep(300);
  check('choosing "Let MyDay pick" clears the saved choice (null) and brings back the dated step', (await nwSaved()).nextTaskId === null && (await nwNext()) === 'Sand the door', [(await nwSaved()).nextTaskId, await nwNext()]);
  check('…and says what MyDay picked in a toast: "MyDay’s pick: “Sand the door”."', (await toast()) === 'MyDay’s pick: “Sand the door”.', await toast());
  check('…with its reason, and "Let MyDay pick" selected again', (await nwWhy()) === nwDated && (await ev(`document.getElementById('projectNextPick').value`)) === '', await nwWhy());

  console.log('  A chosen step that is done');
  await type('#projectNextPick', 'tkNu'); await sleep(300);
  const planBefore = JSON.stringify((await data()).days);
  await click('[data-action=project-step-done]'); await sleep(350);
  check('Done on the chosen step makes MyDay\'s pick the next step', (await data()).tasks.items.find(t => t.id === 'tkNu').done && (await nwNext()) === 'Sand the door', await nwNext());
  check('…and the reason says what happened to the chosen step, then MyDay\'s pick', (await nwWhy()) === 'The step you chose, “Tidy the shed”, is done. MyDay’s pick: it’s the only task still to do that isn’t waiting.', await nwWhy());
  check('nothing was added to today\'s plan', JSON.stringify((await data()).days) === planBefore && (await task('Sand the door')).plannedOn === null);

  console.log('  Everything waiting, and a single task');
  await seed([pjObj('pjNX', 'All waiting', 'act', { nextTaskId: 'tkX1' }), pjObj('pjNY', 'One free task', 'act')]);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(gtk('tkX1', 'Ask the supplier', 'pjNX', { waiting: { on: 'Priya', since: '2026-10-01', until: null } }))}, ${JSON.stringify(gtk('tkY1', 'Measure the door', 'pjNY'))}); }`);
  await go('projects/p/pjNX', 2026, 10, 15, 9, 8);
  const nxOpts = await ev(`[...document.querySelectorAll('#projectNextPick option')].map(o => [o.value, o.textContent, o.selected])`);
  check('a project whose only open task is waiting and chosen still shows the picker, with "Let MyDay pick" first', nxOpts.length === 2 && eq(nxOpts[0], ['', 'Let MyDay pick', false]) && eq(nxOpts[1], ['tkX1', 'Ask the supplier (waiting)', true]), nxOpts);
  await click('[data-s=next-why] summary'); await sleep(150);
  check('its reason says MyDay would have no next step', (await nwWhy()) === 'You chose this step. Left to MyDay, there’d be no next step: everything here is waiting.', await nwWhy());
  await type('#projectNextPick', ''); await sleep(350);
  check('choosing "Let MyDay pick" saves no choice (null), and the card asks for another small step instead', ((await pAt('pjNX')).nextTaskId ?? null) === null && (await exists('[data-s=next-all-waiting]')) && !(await exists('#projectNextPick')), [(await pAt('pjNX')).nextTaskId]);
  check('…and the toast says "Everything here is waiting, so MyDay has no next step to pick."', (await toast()) === 'Everything here is waiting, so MyDay has no next step to pick.', await toast());
  await go('projects/p/pjNY', 2026, 10, 15, 9, 9);
  check('a single open task that is not waiting and not chosen shows no picker', (await nwNext()) === 'Measure the door' && !(await exists('#projectNextPick')));

  console.log('  A phone');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await go('projects/p/pjNW', 2026, 10, 15, 9, 10);
  await click('[data-s=next-why] summary'); await sleep(250);
  check('phone 320 px: the Overview with "Why this?" open does not scroll sideways', (await ev(`document.querySelector('[data-s=next-why]').open`)) && (await nwWhy()).length > 20 && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[41] Learning for a project');
  const lnTask = (id, done) => ({ id, title: 'Task ' + id, minutes: 15, url: '', kind: 'learn', note: '', done, doneOn: done ? '2026-10-01' : null });
  const lnCourse = (id, title, done, total) => ({ id, title, url: '', minutes: 0, listId: null, archived: false, modules: [{ id: 'm' + id, title: 'Module', sections: [{ id: 's' + id, title: 'Section', tasks: Array.from({ length: total }, (_, i) => lnTask(`${id}t${i}`, i < done)) }] }] });
  const ARABIC = 'lesson.arabic-fusha-register', ARABIC_TITLE = 'What Fuṣḥā means and where it is used';
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  await seed([pjObj('pjLn', 'Wi-Fi for the shop', 'act')]);
  await editStorage(`s => { s.study.stages = [{ id: 'sgLn', title: 'Stage', courses: [${JSON.stringify(lnCourse('coLnA', 'Networking basics', 3, 8))}, ${JSON.stringify(lnCourse('coLnB', 'Safety first', 0, 0))}] }];
    s.reading.books = [{ id: 'bkLn', title: 'Bookkeeping made plain', author: '', pages: 300, page: 120, notes: [], addedOn: '2026-09-01', finishedOn: null }]; }`);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(gtk('tkLn', 'Ring the installer', 'pjLn', { createdAt: '2026-10-14T09:00' }))}); }`);
  const lnLinks = async () => (await pAt('pjLn')).studyLinks;
  const lnRow = (kind, id) => `[data-s=learning-link][data-kind=${kind}][data-id="${id}"]`;
  const lnStudy = async () => JSON.stringify([(await data()).study.stages, (await data()).reading.books]);
  const lnOpts = () => ev(`[...document.querySelectorAll('#learningPick option')].map(o => [o.value, o.textContent])`);
  const lnAdd = async kind => { if (!(await exists('[data-s=learning-form]'))) await click((await exists('[data-action=learning-add]')) ? '[data-action=learning-add]' : '[data-action=section-open][data-id=learning]'); await until(`!!document.getElementById('learningKind-course')`); await click(`#learningKind-${kind}`); await sleep(150); };
  const lnPick = async (id, why = '') => { await type('#learningPick', id); if (why) await type('#learningWhy', why); await click('[data-action=learning-link]'); await sleep(300); };
  let studyBefore = '';
  await go('projects/p/pjLn', 2026, 10, 15, 9, 5);

  console.log('  The empty card');
  await unfold('learning', 'projectLearning', 'learning-cancel');
  check('the Learning card sits in the side column after Recently and before Manage', await ev(`(() => { const a = document.getElementById('projectRecent'), b = document.getElementById('projectLearning'), c = document.getElementById('projectManage'); return !!a && !!b && !!c && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(b.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING); })()`), await ev(`[...document.querySelectorAll('#projectSoon, #projectRecent, #projectLearning, #projectManage')].map(e => e.id)`));
  check('with nothing linked it has one line and "Link something"', (await text('#projectLearning')).includes('Link a course, book or lesson you’re learning for this project.') && (await text('[data-action=learning-add]')) === 'Link something' && !(await exists('[data-s=learning-link]')) && !('studyLinks' in (await pAt('pjLn'))), await text('#projectLearning'));

  console.log('  Linking a course');
  await click('[data-action=learning-add]');
  check('"Link something" puts the keyboard on the kind choices, with Course chosen', await until(`document.activeElement && document.activeElement.id === 'learningKind-course'`) && (await ev(`document.getElementById('learningKind-course').getAttribute('aria-pressed')`)) === 'true' && (await ev(`document.querySelectorAll('[data-s=learning-kind]').length`)) === 4);
  check('courses are not grouped', (await ev(`document.querySelectorAll('#learningPick optgroup').length`)) === 0);
  check('the list offers the two courses in roadmap order', eq(await lnOpts(), [['', 'Choose…'], ['coLnA', 'Networking basics'], ['coLnB', 'Safety first']]), await lnOpts());
  check('Link waits until something is chosen', await ev(`document.querySelector('[data-action=learning-link]').disabled`));
  await lnPick('coLnA', 'To set up the shop Wi-Fi');
  const ln1 = await lnLinks();
  check('Link saves it on the project: kind, id, the title, the why and the day, and nothing else', eq(ln1, [{ kind: 'course', id: 'coLnA', title: 'Networking basics', why: 'To set up the shop Wi-Fi', addedOn: '2026-10-15' }]), ln1);
  check('…with a toast, and the form closed', (await toast()) === 'Linked “Networking basics”.' && !(await exists('[data-s=learning-form]')), await toast());
  const lnText = (await text(lnRow('course', 'coLnA'))).replace(/\s+/g, ' ');
  check('the row shows "Your course", the title, Study\'s own count and the why', lnText.includes('Your course') && lnText.includes('Networking basics') && lnText.includes('3 of 8 tasks marked complete') && lnText.includes('Why: To set up the shop Wi-Fi') && !/%/.test(lnText), lnText);
  check('…and its link opens the course in Study', (await ev(`document.querySelector('${lnRow('course', 'coLnA')} a').getAttribute('href')`)) === '#study/course/coLnA');
  check('after linking, the keyboard goes back to "Link something"', await until(`document.activeElement && document.activeElement.id === 'learningAdd'`));

  studyBefore = await lnStudy(); // as the app keeps it once it has saved
  console.log('  Linking a book and an Arabic lesson');
  await lnAdd('book');
  check('the book list offers the book', eq(await lnOpts(), [['', 'Choose…'], ['bkLn', 'Bookkeeping made plain']]), await lnOpts());
  await lnPick('bkLn');
  check('a linked book shows "Page 120 of 300" and opens Reading', (await text(`${lnRow('book', 'bkLn')} [data-s=learning-status]`)) === 'Page 120 of 300' && (await ev(`document.querySelector('${lnRow('book', 'bkLn')} a').getAttribute('href')`)) === '#study/reading' && !(await exists(`${lnRow('book', 'bkLn')} [data-s=learning-why]`)), await text(lnRow('book', 'bkLn')));
  // A failed load: block the Arabic chunk on a fresh page, then let it through and press Try again.
  await go('projects/p/pjLn', 2026, 10, 15, 9, 12);
  await T.send('Network.enable'); await T.send('Network.setBypassServiceWorker', { bypass: true }); await T.send('Network.setCacheDisabled', { cacheDisabled: true });
  await T.send('Network.setBlockedURLs', { urls: ['*learningArabic*'] });
  await lnAdd('arabic');
  check('when the Arabic lessons cannot load, the form says so with a "Try again" button, and offers no list', await until(`!!document.querySelector('[data-s=learning-lessons-failed]')`) && (await text('[data-s=learning-lessons-failed]')).includes('couldn’t load just now') && (await text('[data-action=learning-retry]')) === 'Try again' && !(await exists('#learningPick')) && await ev(`document.querySelector('[data-action=learning-link]').disabled`), await text('[data-s=learning-form]'));
  await T.send('Network.setBlockedURLs', { urls: [] });
  await click('[data-action=learning-retry]');
  check('"Try again" loads them once the network lets the chunk through', await until(`!!document.getElementById('learningPick') && document.querySelectorAll('#learningPick option').length > 10`) && !(await exists('[data-s=learning-lessons-failed]')), await text('[data-s=learning-form]'));
  await T.send('Network.setBypassServiceWorker', { bypass: false }); await T.send('Network.setCacheDisabled', { cacheDisabled: false });
  await click('[data-action=learning-cancel]'); await sleep(150);
  await lnAdd('arabic');
  check('choosing the Arabic kind loads the lessons into the list', await until(`!!document.getElementById('learningPick') && document.querySelectorAll('#learningPick option').length > 10`) && (await lnOpts()).some(o => o[0] === ARABIC && o[1] === ARABIC_TITLE), (await lnOpts()).slice(0, 3));
  const groups = await ev(`[...document.querySelectorAll('#learningPick optgroup')].map(g => [g.label, g.querySelectorAll('option').length])`);
  check('the Arabic lessons are grouped by module name, in path order: every group has a name and lessons, and the optgroups hold all the options', groups.length >= 2 && groups.every(g => g[0] && g[0] !== 'Choose…' && g[1] > 0) && (await ev(`document.querySelectorAll('#learningPick option').length`)) === 1 + groups.reduce((n, g) => n + g[1], 0), groups.slice(0, 3));
  check('the first group\'s name is a module name, not a lesson title, and the lesson sits inside a group', (await ev(`(() => { const o = document.querySelector('#learningPick option[value="${ARABIC}"]'); return !!o && o.parentElement.tagName === 'OPTGROUP' && !!o.parentElement.label && o.parentElement.label !== o.textContent; })()`)) && !(await lnOpts()).some(o => o[1] === groups[0][0]), groups[0]);
  await lnPick(ARABIC);
  check('the Arabic lesson is saved with its real title', eq((await lnLinks()).filter(l => l.kind === 'arabic').map(l => [l.id, l.title, 'why' in l]), [[ARABIC, ARABIC_TITLE, false]]), await lnLinks());
  check('…and its row shows the title, "Arabic lesson" and Study\'s state "New" once it has loaded', await until(`(document.querySelector('${lnRow('arabic', ARABIC)} [data-s=learning-status]') || {}).textContent === 'New'`) && (await text(lnRow('arabic', ARABIC))).includes(ARABIC_TITLE) && (await text(lnRow('arabic', ARABIC))).includes('Arabic lesson'), await text(lnRow('arabic', ARABIC)));
  check('…and it opens the lesson in Study', (await ev(`document.querySelector('${lnRow('arabic', ARABIC)} a').getAttribute('href')`)) === `#study/arabic/${ARABIC}`);

  console.log('  What is left to link');
  await lnAdd('course');
  check('the list no longer offers the linked course', eq(await lnOpts(), [['', 'Choose…'], ['coLnB', 'Safety first']]), await lnOpts());
  await lnPick('coLnB');
  await lnAdd('course');
  check('with every course linked the form says "No courses left to link. Add one on your Study roadmap."', (await text('[data-s=learning-form]')).includes('No courses left to link. Add one on your Study roadmap.') && !(await exists('#learningPick')), await text('[data-s=learning-form]'));
  await lnAdd('book');
  check('…and likewise for books', (await text('[data-s=learning-form]')).includes('No books left to link. Add one in Study → Reading.'));
  await click('[data-action=learning-cancel]'); await sleep(200);
  check('Cancel closes the form and links nothing more', !(await exists('[data-s=learning-form]')) && (await lnLinks()).length === 4, (await lnLinks()).length);

  console.log('  Editing why, and unlinking');
  const edit = `${lnRow('course', 'coLnA')} [data-action=learning-edit]`;
  check('a link with a why offers "Edit why", one without offers "Add why"', (await text(edit)) === 'Edit why' && (await text(`${lnRow('course', 'coLnB')} [data-action=learning-edit]`)) === 'Add why');
  await click(edit); await sleep(200);
  check('Edit why opens a field holding the why, with the keyboard in it', (await ev(`document.activeElement && document.activeElement.value`)) === 'To set up the shop Wi-Fi');
  await type('#learningWhy-course-coLnA', 'Something else entirely');
  await T.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await T.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(250);
  check('Escape cancels: the field closes and the why is as it was', !(await exists('#learningWhy-course-coLnA')) && (await lnLinks())[0].why === 'To set up the shop Wi-Fi' && (await text(`${lnRow('course', 'coLnA')} [data-s=learning-why]`)) === 'Why: To set up the shop Wi-Fi');
  await click(edit); await sleep(200);
  await type('#learningWhy-course-coLnA', '  So customers can get online  '); await click('[data-action=learning-why-save]'); await sleep(300);
  check('Save changes it (trimmed) and shows it', (await lnLinks())[0].why === 'So customers can get online' && (await text(`${lnRow('course', 'coLnA')} [data-s=learning-why]`)) === 'Why: So customers can get online', (await lnLinks())[0]);
  await click(edit); await sleep(200);
  await type('#learningWhy-course-coLnA', '   '); await click('[data-action=learning-why-save]'); await sleep(300);
  check('a blank why removes the Why line and the saved why', !('why' in (await lnLinks())[0]) && !(await exists(`${lnRow('course', 'coLnA')} [data-s=learning-why]`)) && (await text(edit)) === 'Add why', (await lnLinks())[0]);
  await click(`${lnRow('course', 'coLnB')} [data-action=learning-unlink]`); await sleep(300);
  check('Unlink takes the link off the project, with the toast "Unlinked — it’s still in Study."', eq((await lnLinks()).map(l => l.id), ['coLnA', 'bkLn', ARABIC]) && !(await exists(lnRow('course', 'coLnB'))) && (await toast()) === 'Unlinked — it’s still in Study.', [await toast(), (await lnLinks()).map(l => l.id)]);
  { const now = await lnStudy(); let i = 0; while (i < now.length && now[i] === studyBefore[i]) i++; check('…and Study\'s course and book are unchanged', now === studyBefore, [now.slice(Math.max(0, i - 60), i + 80), studyBefore.slice(Math.max(0, i - 60), i + 80)]); }

  console.log('  A course removed from Study, and a phone');
  await editStorage(`s => { s.study.stages[0].courses = s.study.stages[0].courses.filter(c => c.id !== 'coLnA'); }`);
  await go('projects/p/pjLn', 2026, 10, 15, 9, 20);
  check('the link stays, with the title you linked, "No longer in Study", Unlink (no Edit/Add why), and no link to open', (await ev(`document.querySelector('${lnRow('course', 'coLnA')}').dataset.gone`)) === 'true' && (await text(`${lnRow('course', 'coLnA')} [data-s=learning-status]`)) === 'No longer in Study' && (await text(lnRow('course', 'coLnA'))).includes('Networking basics') && !(await exists(`${lnRow('course', 'coLnA')} a`)) && (await exists(`${lnRow('course', 'coLnA')} [data-action=learning-unlink]`)) && !(await exists(`${lnRow('course', 'coLnA')} [data-action=learning-edit]`)), await text(lnRow('course', 'coLnA')));
  check('…and it is still saved on the project', (await lnLinks()).some(l => l.id === 'coLnA'));
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await go('projects/p/pjLn', 2026, 10, 15, 9, 25);
  await until(`!!document.querySelector('[data-action=learning-add]')`); await click('[data-action=learning-add]'); await sleep(300);
  check('phone 320 px: with three links and the form open, nothing scrolls sideways', (await exists('[data-s=learning-form]')) && (await ev(`document.querySelectorAll('[data-s=learning-link]').length`)) === 3 && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  check('phone 320 px: the Edit why and Unlink buttons are at least 44 px tall', await ev(`[...document.querySelectorAll('[data-action=learning-edit], [data-action=learning-unlink]')].every(b => b.getBoundingClientRect().height >= 44)`), await ev(`[...document.querySelectorAll('[data-action=learning-edit], [data-action=learning-unlink]')].map(b => b.getBoundingClientRect().height)`));
  check('phone 320 px: the form\'s buttons and fields are at least 44 px tall', await ev(`[...document.querySelectorAll('[data-s=learning-form] button, [data-s=learning-form] input, [data-s=learning-form] select')].every(b => b.getBoundingClientRect().height >= 44)`));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[42] Learning: Cybersecurity lessons, and "For your project" in Study');
  const CY = 'lesson.learning-evidence', CY_TITLE = 'Learning through evidence', CY_MODULE = 'Learning method, scope and lab setup';
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  const fl = (kind, id, title) => ({ kind, id, title, addedOn: '2026-10-14' });
  await seed([pjObj('pjFa', 'Alpha shop', 'act', { studyLinks: [fl('course', 'coFa', 'Shop Wi-Fi course')] }), pjObj('pjFb', 'Beta shop', 'act', { studyLinks: [fl('course', 'coFa', 'Shop Wi-Fi course')] }),
    pjObj('pjFc', 'Gamma reading', 'act', { studyLinks: [fl('book', 'bkFa', 'Bookkeeping made plain')] }), pjObj('pjFd', 'Delta security', 'act'),
    pjObj('pjFe', 'Echo finished', 'act', { status: 'done', studyLinks: [fl('course', 'coFa', 'Shop Wi-Fi course'), fl('course', 'coFb', 'Unlinked course')] })]);
  await editStorage(`s => { s.study.stages = [{ id: 'sgF', title: 'Stage', courses: [${JSON.stringify(lnCourse('coFa', 'Shop Wi-Fi course', 1, 2))}, ${JSON.stringify(lnCourse('coFb', 'Unlinked course', 0, 1))}] }];
    s.reading.books = [{ id: 'bkFa', title: 'Bookkeeping made plain', author: 'A. Writer', pages: 300, page: 20, notes: [], addedOn: '2026-09-01', finishedOn: null }, { id: 'bkFb', title: 'Unlinked book', author: 'B. Writer', pages: 100, page: 0, notes: [], addedOn: '2026-09-02', finishedOn: null }]; }`);
  const cyRow = `[data-s=learning-link][data-kind=cyber][data-id="${CY}"]`;
  const cyStatus = () => text(`${cyRow} [data-s=learning-status]`);

  console.log('  Linking a Cybersecurity lesson');
  await go('projects/p/pjFd', 2026, 10, 15, 9, 5);
  await T.send('Network.enable'); await T.send('Network.setBypassServiceWorker', { bypass: true }); await T.send('Network.setCacheDisabled', { cacheDisabled: true });
  await T.send('Network.setBlockedURLs', { urls: ['*learningCyber*'] });
  await lnAdd('cyber');
  check('when the Cybersecurity lessons cannot load, the form says so, with "Try again" and no list', await until(`!!document.querySelector('[data-s=learning-lessons-failed]')`) && (await text('[data-s=learning-lessons-failed]')).includes('The Cybersecurity lessons couldn’t load just now.') && (await text('[data-action=learning-retry]')) === 'Try again' && !(await exists('#learningPick')), await text('[data-s=learning-form]'));
  await T.send('Network.setBlockedURLs', { urls: [] });
  await click('[data-action=learning-retry]');
  check('"Try again" loads them', await until(`!!document.getElementById('learningPick') && document.querySelectorAll('#learningPick option').length > 10`) && !(await exists('[data-s=learning-lessons-failed]')), await text('[data-s=learning-form]'));
  await T.send('Network.setBypassServiceWorker', { bypass: false }); await T.send('Network.setCacheDisabled', { cacheDisabled: false });
  const cyGroups = await ev(`[...document.querySelectorAll('#learningPick optgroup')].map(g => [g.label, g.querySelectorAll('option').length])`);
  check('the lessons are grouped by module, the first group being "' + CY_MODULE + '" with the evidence lesson inside it', cyGroups.length >= 3 && cyGroups[0][0] === CY_MODULE && (await ev(`document.querySelector('#learningPick optgroup').querySelector('option').value`)) === CY, cyGroups.slice(0, 3));
  const cyOther = await ev(`[...document.querySelectorAll('#learningPick option')].map(o => o.value).filter(v => v && v !== '${CY}')[0]`);
  await lnPick(CY, 'For the shop network');
  check('the saved link has the lesson\'s id and title', eq((await pAt('pjFd')).studyLinks.map(l => [l.kind, l.id, l.title, l.why]), [['cyber', CY, CY_TITLE, 'For the shop network']]), (await pAt('pjFd')).studyLinks);
  check('the row shows "Cybersecurity lesson", the title and "Not started", and opens the lesson', await until(`(document.querySelector('${cyRow} [data-s=learning-status]') || {}).textContent === 'Not started'`) && (await text(cyRow)).includes('Cybersecurity lesson') && (await text(cyRow)).includes(CY_TITLE) && (await ev(`document.querySelector('${cyRow} a').getAttribute('href')`)) === `#study/cybersecurity/${CY}`, await text(cyRow));
  check('the list no longer offers the linked lesson', await (async () => { await lnAdd('cyber'); const gone = await until(`!!document.getElementById('learningPick')`) && !(await lnOpts()).some(o => o[0] === CY); await click('[data-action=learning-cancel]'); return gone; })());
  await editStorage(`s => { s.cybersecurity.attempts.push({ id: 'caF', activityId: 'exercise.learning-evidence', curriculumVersion: '1.0.0', rubricVersion: '1', startedAt: '2026-10-14T09:00', submittedAt: null, inputVariant: 'standard', environmentId: '', assistance: 'independent', evidence: '', answers: {}, rubricScores: [], criticalPassed: null, resumePoint: '', answerRevealed: false, assessor: 'self', verified: false }); }`);
  await go('projects/p/pjFd', 2026, 10, 15, 9, 6);
  check('after an attempt on one of its activities the row says "Started"', await until(`(document.querySelector('${cyRow} [data-s=learning-status]') || {}).textContent === 'Started'`), await cyStatus());
  await editStorage(`s => { s.study.stages.push({ id: 'sgCy', title: 'Cyber', courses: [{ id: 'coCy', title: 'Cybersecurity', url: '', minutes: 0, listId: null, archived: false, modules: [{ id: 'mCy', title: 'M', sections: [{ id: 'sCy', title: 'S', tasks: [{ id: 'cyber:1:${CY}', title: '${CY_TITLE}', minutes: 15, url: '', kind: 'learn', note: '', done: true, doneOn: '2026-10-14' }] }] }] }] }); }`);
  await go('projects/p/pjFd', 2026, 10, 15, 9, 7);
  check('with its roadmap task ticked it says "Marked complete"', await until(`(document.querySelector('${cyRow} [data-s=learning-status]') || {}).textContent === 'Marked complete'`), await cyStatus());

  await editStorage(`s => { s.cybersecurity.pathId = 'path.appsec'; }`);
  await go('projects/p/pjFd', 2026, 10, 15, 9, 8);
  await lnAdd('cyber');
  await until(`!!document.getElementById('learningPick') && document.querySelectorAll('#learningPick option').length > 10`);
  const optText = await ev(`(document.querySelector('#learningPick option[value="lesson.ai-application-security"]') || {}).textContent`);
  check('an optional lesson\'s option ends with " (optional)", and a required one\'s does not', optText === 'Optional AI application trust boundaries (optional)' && !(await ev(`[...document.querySelectorAll('#learningPick option')].some(o => o.value && o.value !== 'lesson.ai-application-security' && o.textContent.endsWith('(optional)'))`)), optText);
  await lnPick('lesson.ai-application-security');
  check('linking it saves the plain lesson title, without " (optional)"', (await pAt('pjFd')).studyLinks.some(l => l.id === 'lesson.ai-application-security' && l.title === 'Optional AI application trust boundaries'), (await pAt('pjFd')).studyLinks.map(l => l.title));
  await editStorage(`s => { s.cybersecurity.pathId = 'path.core'; s.projects.items.find(p => p.id === 'pjFd').studyLinks = s.projects.items.find(p => p.id === 'pjFd').studyLinks.filter(l => l.id !== 'lesson.ai-application-security'); }`);

  console.log('  "For your project" in Study');
  const fp = sel => text(sel).then(norm);
  await go('study/course/coFa', 2026, 10, 15, 9, 10);
  await until(`!!document.getElementById('co-h')`);
  check('a course linked by two projects (and a finished one) says "For your projects: Alpha shop, Beta shop" without the finished project, right after its title', (await fp('[data-s=for-project]')) === 'For your projects: Alpha shop, Beta shop' && (await ev(`document.querySelector('[data-s=for-project]').previousElementSibling.id`)) === 'co-h', await fp('[data-s=for-project]'));
  check('…each name a link to its project', eq(await ev(`[...document.querySelectorAll('[data-s=for-project] a')].map(a => [a.textContent, a.getAttribute('href')])`), [['Alpha shop', '#projects/p/pjFa'], ['Beta shop', '#projects/p/pjFb']]));
  await click('[data-s=for-project] a:nth-of-type(2)'); await sleep(400);
  check('clicking a name opens that project', (await hash()) === '#projects/p/pjFb' && (await text('#projectTitle')) === 'Beta shop', await hash());
  await go('study/course/coFb', 2026, 10, 15, 9, 11); await until(`!!document.getElementById('co-h')`);
  check('a course only a finished project links shows nothing (no "For your project" at all)', !(await exists('[data-s=for-project]')));
  await go('study/reading', 2026, 10, 15, 9, 12); await until(`!!document.querySelector('.book-row')`);
  check('a linked book shows "For your project: Gamma reading" in its row, after the author', (await fp('.book-row[data-id=bkFa] [data-s=for-project]')) === 'For your project: Gamma reading' && (await ev(`document.querySelector('.book-row[data-id=bkFa] [data-s=for-project]').previousElementSibling.textContent`)).includes('A. Writer'), await fp('.book-row[data-id=bkFa]'));
  check('…and a book no project links shows nothing', !(await exists('.book-row[data-id=bkFb] [data-s=for-project]')) && (await ev(`document.querySelectorAll('[data-s=for-project]').length`)) === 1);
  await go(`study/cybersecurity/${CY}`, 2026, 10, 15, 9, 13); await until(`!!document.querySelector('h2')`);
  check('a linked Cybersecurity lesson shows "For your project: Delta security" right after its title', (await fp('[data-s=for-project]')) === 'For your project: Delta security' && (await ev(`document.querySelector('[data-s=for-project]').previousElementSibling.textContent`)) === CY_TITLE, await fp('[data-s=for-project]'));
  await click('[data-s=for-project] a'); await sleep(400);
  check('…and its name opens the project', (await hash()) === '#projects/p/pjFd' && (await text('#projectTitle')) === 'Delta security', await hash());
  await go(`study/cybersecurity/${cyOther}`, 2026, 10, 15, 9, 14); await until(`!!document.querySelector('h2')`);
  check('a lesson no project links shows nothing', !(await exists('[data-s=for-project]')) && (await ev(`document.querySelectorAll('h2').length`)) > 0, cyOther);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  for (const [name, hashv, sel] of [['course page', 'study/course/coFa', '[data-s=for-project]'], ['Reading', 'study/reading', '[data-s=for-project]'], ['lesson page', `study/cybersecurity/${CY}`, '[data-s=for-project]']]) {
    await go(hashv, 2026, 10, 15, 9, 20); await until(`!!document.querySelector('${sel}')`); await sleep(200);
    check(`phone 320 px: the ${name} with "For your project" does not scroll sideways`, (await exists(sel)) && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[43] Resources for a project');
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  await seed([pjObj('pjRs', 'Garden shed', 'act', { resources: [{ id: 'rsSeed', title: 'Planning portal', url: 'https://example.co.uk/planning', note: 'Form for outbuildings', addedOn: '2026-10-10' }] }), pjObj('pjRe', 'Empty links', 'act')]);
  const rsList = async id => (await pAt(id)).resources;
  const rsRow = id => `[data-s=resource][data-id="${id}"]`;
  const rsAdd = async (url, title = '', note = '') => { if (!(await exists('[data-s=resource-form]'))) await click((await exists('[data-action=resource-add]')) ? '[data-action=resource-add]' : '[data-action=section-open][data-id=resources]'); await until(`!!document.getElementById('resourceUrl-new')`); await type('#resourceUrl-new', url); if (title) await type('#resourceTitle-new', title); if (note) await type('#resourceNote-new', note); await click('[data-action=resource-save]'); await sleep(300); };

  console.log('  The empty card');
  await go('projects/p/pjRe', 2026, 10, 15, 9, 5);
  await unfold('learning', 'projectLearning', 'learning-cancel'); await unfold('resources', 'projectResources', 'resource-cancel');
  check('the Resources card sits after Learning and before Manage', await ev(`(() => { const a = document.getElementById('projectLearning'), b = document.getElementById('projectResources'), c = document.getElementById('projectManage'); return !!a && !!b && !!c && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(b.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING); })()`));
  check('empty, it has the hint and "Add a link", and the project has no resources key', (await text('#projectResources')).includes('Keep the links you need for this project: a supplier’s page, a guide, a form.') && (await text('[data-action=resource-add]')) === 'Add a link' && !(await exists('[data-s=resource]')) && !('resources' in (await pAt('pjRe'))), await text('#projectResources'));

  console.log('  Adding a link');
  await click('[data-action=resource-add]');
  check('"Add a link" puts the keyboard in the web address field, and Add waits for an address', await until(`document.activeElement && document.activeElement.id === 'resourceUrl-new'`) && await ev(`document.querySelector('[data-action=resource-save]').disabled`));
  await type('#resourceUrl-new', 'example-timber.co.uk/oak'); await type('#resourceTitle-new', 'Timber merchant'); await type('#resourceNote-new', 'Ask about offcuts');
  await click('[data-action=resource-save]'); await sleep(300);
  const rs1 = (await rsList('pjRe'))?.[0];
  check('it is saved with https, the title, the note and the day, under an id starting "rs"', rs1 && /^rs/.test(rs1.id) && rs1.url === 'https://example-timber.co.uk/oak' && rs1.title === 'Timber merchant' && rs1.note === 'Ask about offcuts' && rs1.addedOn === '2026-10-15', rs1);
  check('…with a toast and the form closed', (await toast()) === 'Kept “Timber merchant”.' && !(await exists('[data-s=resource-form]')), await toast());
  const row1 = rsRow(rs1.id);
  check('the row shows the title with ↗, the site in small text, and "Note: …"', (await text(`${row1} [data-s=resource-link]`)).replace(/\s+/g, ' ').startsWith('Timber merchant ↗') && (await text(`${row1} [data-s=resource-site]`)) === 'example-timber.co.uk' && (await text(`${row1} [data-s=resource-note]`)) === 'Note: Ask about offcuts');
  check('its link opens in a new tab with rel noopener, announces that for screen readers, and goes to the address', await ev(`(() => { const a = document.querySelector('${row1} a'); return a.getAttribute('href') === 'https://example-timber.co.uk/oak' && a.target === '_blank' && a.rel.split(' ').includes('noopener') && a.querySelector('.sr-only').textContent === '(opens in a new tab)'; })()`));
  check('the link\'s text reads title, site, then "(opens in a new tab)" last', await ev(`(() => { const a = document.querySelector('${row1} a'), sr = a.querySelector('.sr-only'), site = a.querySelector('[data-s=resource-site]'); return !!sr && !!site && !!(site.compareDocumentPosition(sr) & Node.DOCUMENT_POSITION_FOLLOWING) && a.lastElementChild === sr; })()`));
  check('after adding, the keyboard goes back to "Add a link"', await until(`document.activeElement && document.activeElement.id === 'resourceAdd'`));
  await rsAdd('https://www.example.org/guide');
  const rs2 = (await rsList('pjRe'))[1];
  check('an untitled link is named by its site (without www.), with no separate site line and no note line', rs2.title === '' && !('note' in rs2) && (await text(`${rsRow(rs2.id)} [data-s=resource-link]`)).replace(/\s+/g, ' ').startsWith('example.org ↗') && !(await exists(`${rsRow(rs2.id)} [data-s=resource-site]`)) && !(await exists(`${rsRow(rs2.id)} [data-s=resource-note]`)) && (await toast()) === 'Kept “example.org”.', [await toast(), rs2]);

  console.log('  Refusals');
  await click('[data-action=resource-add]'); await until(`!!document.getElementById('resourceUrl-new')`);
  await type('#resourceUrl-new', 'javascript:alert(1)'); await click('[data-action=resource-save]'); await sleep(250);
  check('an address that is not a web address shows the message, as an alert, and saves nothing', (await text('[data-s=resource-error]')) === 'That doesn’t look like a web address. Try something like example.com/page.' && (await ev(`document.querySelector('[data-s=resource-error]').getAttribute('role')`)) === 'alert' && (await rsList('pjRe')).length === 2, await text('[data-s=resource-error]'));
  check('…the keyboard goes back to the address field, and typing again clears the message', (await until(`document.activeElement && document.activeElement.id === 'resourceUrl-new'`)) && (await type('#resourceUrl-new', 'example.net'), await sleep(150), !(await exists('[data-s=resource-error]'))));
  await type('#resourceUrl-new', 'EXAMPLE-TIMBER.co.uk/oak'); await click('[data-action=resource-save]'); await sleep(250);
  check('the same address again says "That link is already kept in this project." and saves nothing', (await text('[data-s=resource-error]')) === 'That link is already kept in this project.' && (await rsList('pjRe')).length === 2, await text('[data-s=resource-error]'));
  await click('[data-action=resource-cancel]'); await sleep(200);
  check('Cancel closes the form with nothing saved', !(await exists('[data-s=resource-form]')) && (await rsList('pjRe')).length === 2);

  console.log('  Editing and removing');
  await click(`${row1} [data-action=resource-edit]`);
  check('Edit opens the form with the keyboard in the address field, holding the current values', await until(`document.activeElement && document.activeElement.id === 'resourceUrl-${rs1.id}'`) && (await ev(`document.getElementById('resourceTitle-${rs1.id}').value`)) === 'Timber merchant' && (await ev(`document.getElementById('resourceNote-${rs1.id}').value`)) === 'Ask about offcuts');
  await type(`#resourceTitle-${rs1.id}`, 'Oak merchant'); await click('[data-action=resource-save]'); await sleep(300);
  check('Save changes the title and keeps the rest', (await rsList('pjRe'))[0].title === 'Oak merchant' && (await rsList('pjRe'))[0].note === 'Ask about offcuts' && (await text(`${row1} [data-s=resource-link]`)).startsWith('Oak merchant'));
  check('…and the keyboard goes back to that link\'s Edit button', await until(`document.activeElement && document.activeElement.id === 'resourceEdit-${rs1.id}'`));
  await click(`${row1} [data-action=resource-edit]`); await sleep(200);
  await type(`#resourceTitle-${rs1.id}`, 'Something else entirely');
  await ev(`document.getElementById('resourceTitle-${rs1.id}').focus()`);
  await T.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await T.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(250);
  check('Escape cancels the edit: nothing changed, the form closed, and the keyboard is back on Edit', !(await exists('[data-s=resource-form]')) && (await rsList('pjRe'))[0].title === 'Oak merchant' && await until(`document.activeElement && document.activeElement.id === 'resourceEdit-${rs1.id}'`));
  await click(`${rsRow(rs2.id)} [data-action=resource-remove]`); await sleep(250);
  check('Remove asks first, naming the link, and offers "Keep it" and "Remove"', (await text('dialog[open]')).includes('Remove “example.org”?') && (await text('dialog[open]')).includes('The link and your note go; the page itself isn’t affected.') && (await text('[data-action=dialog-cancel]')) === 'Keep it' && (await text('[data-action=dialog-confirm]')) === 'Remove', await text('dialog[open]'));
  await answer(false);
  check('"Keep it" keeps the link', (await rsList('pjRe')).length === 2 && (await exists(rsRow(rs2.id))));
  await click(`${rsRow(rs2.id)} [data-action=resource-remove]`); await answer(true);
  check('"Remove" takes it out of the project, with the toast "Link removed."', (await rsList('pjRe')).length === 1 && !(await exists(rsRow(rs2.id))) && (await toast()) === 'Link removed.', [await toast(), (await rsList('pjRe')).length]);
  await click(`${row1} [data-action=resource-remove]`); await answer(true);
  check('when the last link goes the project has no resources key again', !('resources' in (await pAt('pjRe'))));

  console.log('  Saving that does not happen, and a link this MyDay does not open');
  await seed([pjObj('pjRx', 'Odd links', 'act', { resources: [{ id: 'rsOdd', title: '', url: 'javascript:alert(1)', addedOn: '2026-10-10' }, { id: 'rsMail', title: 'Email the yard', url: 'mailto:yard@example.com', note: 'Written elsewhere', addedOn: '2026-10-10' }, { id: 'rsOk', title: 'Timber merchant', url: 'https://example-timber.co.uk/oak', addedOn: '2026-10-10' }] })]);
  await go('projects/p/pjRx', 2026, 10, 15, 9, 6);
  await until(`!!document.querySelector('[data-s=resource][data-id=rsOk]')`);
  check('a saved address this MyDay does not open is kept and shown as text with "Can’t be opened here", and has no link', (await text(`${rsRow('rsOdd')} [data-s=resource-closed]`)).includes('Can’t be opened here') && !(await exists(`${rsRow('rsOdd')} a`)) && !(await exists(`${rsRow('rsMail')} a`)), await text(rsRow('rsOdd')));
  check('…and an untitled one shows its raw address as its name', (await text(`${rsRow('rsOdd')} [data-s=resource-closed]`)).includes('javascript:alert(1)'), await text(`${rsRow('rsOdd')} [data-s=resource-closed]`));
  check('…a titled one shows its title with the same words, and its note; an ordinary one still opens', (await text(`${rsRow('rsMail')} [data-s=resource-closed]`)).includes('Email the yard') && (await text(rsRow('rsMail'))).includes('Note: Written elsewhere') && (await exists(`${rsRow('rsOk')} a[target=_blank]`)) && (await rsList('pjRx')).length === 3);
  await click(`${rsRow('rsOdd')} [data-action=resource-edit]`); await sleep(200);
  check('Edit works on it, showing the raw address', (await ev(`document.getElementById('resourceUrl-rsOdd').value`)) === 'javascript:alert(1)');
  await type('#resourceUrl-rsOdd', 'example.com/fixed'); await click('[data-action=resource-save]'); await sleep(300);
  check('giving it a web address saves it made whole and makes it openable', (await rsList('pjRx'))[0].url === 'https://example.com/fixed' && (await exists(`${rsRow('rsOdd')} a[target=_blank]`)) && !(await exists(`${rsRow('rsOdd')} [data-s=resource-closed]`)), (await rsList('pjRx'))[0]);
  await click(`${rsRow('rsMail')} [data-action=resource-remove]`); await answer(true);
  check('Remove works on one that cannot be opened', !(await exists(rsRow('rsMail'))) && (await rsList('pjRx')).length === 2 && (await toast()) === 'Link removed.');

  await go('projects/p/pjRx', 2026, 10, 15, 9, 7); await until(`!!document.querySelector('[data-s=resource][data-id=rsOk]')`);
  await click(`${rsRow('rsOk')} [data-action=resource-edit]`); await sleep(200);
  await click('[data-action=resource-save]'); await sleep(300);
  check('editing and saving with nothing changed closes the form quietly, with no toast and nothing rewritten', !(await exists('[data-s=resource-form]')) && (await toast()) !== 'Saved.' && JSON.stringify((await rsList('pjRx'))[1]) === JSON.stringify({ id: 'rsOk', title: 'Timber merchant', url: 'https://example-timber.co.uk/oak', addedOn: '2026-10-10' }), await toast());
  await click(`${rsRow('rsOk')} [data-action=resource-edit]`); await sleep(200);
  await type('#resourceNote-rsOk', 'Closed on Sundays'); await click('[data-action=resource-save]'); await sleep(300);
  check('a change saves, says "Saved." and closes', (await toast()) === 'Saved.' && !(await exists('[data-s=resource-form]')) && (await rsList('pjRx'))[1].note === 'Closed on Sundays', await toast());

  await go('projects/p/pjRx', 2026, 10, 15, 9, 8); await until(`!!document.querySelector('[data-s=resource][data-id=rsOk]')`);
  await click(`${rsRow('rsOk')} [data-action=resource-edit]`); await sleep(200);
  await type('#resourceTitle-rsOk', 'Typed but not saved');
  await editStorage(`s => { s.projects.items.find(p => p.id === 'pjRs').summary = 'Changed in another tab'; }`);
  await click('[data-action=resource-save]'); await sleep(400);
  check('when the save is refused (the data was changed in another tab), the form stays open with what was typed, and nothing says "Saved."', (await exists('[data-s=resource-form]')) && (await ev(`(document.getElementById('resourceTitle-rsOk') || {}).value`)) === 'Typed but not saved' && (await toast()) !== 'Saved.', [await exists('[data-s=resource-form]'), await ev(`(document.getElementById('resourceTitle-rsOk') || {}).value`), await toast()]);

  await go('projects/p/pjRe', 2026, 10, 15, 9, 9); await until(`!!document.querySelector('[data-action=section-open][data-id=resources]')`);
  await click('[data-action=section-open][data-id=resources]'); await until(`!!document.getElementById('resourceUrl-new')`);
  await type('#resourceUrl-new', 'example.com/the-31st');
  await editStorage(`s => { const p = s.projects.items.find(x => x.id === 'pjRe'); p.resources = Array.from({ length: 30 }, (_, i) => ({ id: 'rsFull' + i, title: 'Link ' + i, url: 'https://example.com/p' + i, addedOn: '2026-10-10' })); }`);
  await click('[data-action=resource-save]'); await sleep(400);
  check('an add that does not happen says so: "That link couldn’t be kept just now. This project may already have 30 links.", and the form stays open', (await text('[data-s=resource-error]')) === 'That link couldn’t be kept just now. This project may already have 30 links.' && (await exists('[data-s=resource-form]')) && (await ev(`document.getElementById('resourceUrl-new').value`)) === 'example.com/the-31st', await text('[data-s=resource-error]'));

  console.log('  Learning\'s why form');
  await seed([pjObj('pjLw', 'Why form', 'act', { studyLinks: [fl('book', 'bkLw', 'Bookkeeping made plain')] })]);
  await editStorage(`s => { s.reading.books.push({ id: 'bkLw', title: 'Bookkeeping made plain', author: '', pages: 300, page: 0, notes: [], addedOn: '2026-09-01', finishedOn: null }); }`);
  const lwEdit = '[data-s=learning-link][data-kind=book][data-id=bkLw] [data-action=learning-edit]', lwField = '#learningWhy-book-bkLw';
  await go('projects/p/pjLw', 2026, 10, 15, 9, 10); await until(`!!document.querySelector('[data-action=learning-edit]')`);
  await click(lwEdit); await sleep(200); await click('[data-action=learning-why-save]'); await sleep(300);
  check('Learning\'s why: saving with nothing changed closes quietly, with no toast', !(await exists(lwField)) && (await toast()) !== 'Saved.' && !('why' in (await pAt('pjLw')).studyLinks[0]), await toast());
  await click(lwEdit); await sleep(200); await type(lwField, 'To keep the books'); await click('[data-action=learning-why-save]'); await sleep(300);
  check('…a change saves, says "Saved." and closes', (await toast()) === 'Saved.' && !(await exists(lwField)) && (await pAt('pjLw')).studyLinks[0].why === 'To keep the books', await toast());
  await go('projects/p/pjLw', 2026, 10, 15, 9, 11); await until(`!!document.querySelector('[data-action=learning-edit]')`);
  await click(lwEdit); await sleep(200); await type(lwField, 'Typed but not saved');
  await editStorage(`s => { s.projects.items.find(p => p.id === 'pjRs').summary = 'Changed again in another tab'; }`);
  await click('[data-action=learning-why-save]'); await sleep(400);
  check('…and when the save is refused the field stays open with what was typed', (await exists(lwField)) && (await ev(`document.querySelector('${lwField}').value`)) === 'Typed but not saved' && (await toast()) !== 'Saved.', [await exists(lwField), await toast()]);

  console.log('  Project search');
  await go('projects/p/pjRs', 2026, 10, 15, 9, 10);
  await srType('outbuildings');
  check('a word in a link\'s note finds it, labelled "Link"', eq(await srRows(), ['resource:Link | Planning portal | Form for outbuildings']), await srRows());
  await click('[data-s=search-hit][data-kind=resource] a');
  check('picking it clears the search and puts the keyboard on that link\'s row on the Overview', await until(`document.activeElement && document.activeElement.dataset.id === 'rsSeed'`) && !(await srShowing()) && (await tabOf()) === 'overview', await ev(`document.activeElement && document.activeElement.outerHTML.slice(0, 80)`));
  await srType('planning');
  check('a word in a link\'s title finds it too', eq((await srRows()).map(x => x.split(':')[0]), ['resource']));
  await srType('example');
  check('a word only in the address or site finds nothing', (await text('#pjSearchH')) === 'Nothing in this project matches “example”');
  await srType('planning example');
  check('…and a word from the title plus one only in the address finds nothing (every word must match)', (await text('#pjSearchH')).startsWith('Nothing in this project matches'));
  await click('[data-action=search-clear]');

  console.log('  A phone');
  await editStorage(`s => { const p = s.projects.items.find(x => x.id === 'pjRs'); p.resources.push({ id: 'rsB', title: 'A long supplier name that has to wrap on a very narrow screen without any sideways scrolling', url: 'https://example.com/a/really/long/unbroken/path/that/goes/on/and/on/and/on/and/on/and/on', note: 'A long note written out in full so that it has to wrap onto several lines', addedOn: '2026-10-11' }, { id: 'rsC', title: '', url: 'https://averyveryverylongsubdomainnamewithoutanybreaks.example.org/x', addedOn: '2026-10-12' }); }`);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await go('projects/p/pjRs', 2026, 10, 15, 9, 20);
  await until(`!!document.querySelector('[data-action=resource-add]')`); await click('[data-action=resource-add]'); await sleep(300);
  check('phone 320 px: with three links and the form open, nothing scrolls sideways', (await exists('[data-s=resource-form]')) && (await ev(`document.querySelectorAll('[data-s=resource]').length`)) === 3 && (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  check('phone 320 px: the Edit and Remove buttons, the links and the form\'s controls are at least 44 px tall', await ev(`[...document.querySelectorAll('[data-action=resource-edit], [data-action=resource-remove], [data-s=resource-link], [data-s=resource-form] button, [data-s=resource-form] input')].every(b => b.getBoundingClientRect().height >= 44)`), await ev(`[...document.querySelectorAll('[data-action=resource-edit], [data-action=resource-remove], [data-s=resource-link], [data-s=resource-form] button, [data-s=resource-form] input')].map(b => Math.round(b.getBoundingClientRect().height))`));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[44] Research: questions, findings and sources');
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  const rc_rsM = (a, b) => `${a} ${b}`;
  await seed([pjObj('pjRsA', 'Tea stall', 'explore', { resources: [{ id: 'rsrRes1', title: 'Timber merchant', url: 'https://example.com/oak', addedOn: '2026-10-01' }], fileIds: ['flresf000001'] }),
    bizObj('pjRsB', 'Tea cart idea', { problem: 'Commuters want good tea', who: 'Station queues', how: 'A cart', assumptions: [asObj('asRs1', 'People pay two pounds'), asObj('asRs2', 'The council allows a cart')] }),
    pjObj('pjRsC', 'Plain third project', 'capture')]);
  await editStorage(`s => { s.files.items.push({ id: 'flresf000001', name: 'Quote.pdf', type: 'application/pdf', size: 2048, sha256: '${'a'.repeat(64)}', area: 'project', state: 'kept', addedOn: '2026-10-01' });
    s.notes.items.push({ id: 'ntRsA', categoryId: '', title: 'Stall notes', text: 'Words about the stall.', pinned: false, createdAt: '2026-10-02T09:00', updatedAt: '2026-10-02T09:00', projectId: 'pjRsA' }); }`);
  const rc_rItems = async () => (await data()).research.items;
  const rc_rOf = async type => (await rc_rItems()).filter(x => x.type === type);
  const rc_rsRow = id => `[data-s=research-source][data-id="${id}"]`;
  const rc_rsText = sel => text(sel).then(norm);
  const rc_sw = () => ev(`document.querySelector('[data-action=project-research]')?.getAttribute('aria-checked')`);

  console.log('  Turning it on');
  await go('projects/p/pjRsA', 2026, 10, 15, 9, 5);
  check('a general project has no Research tab at first', !(await exists('[data-tab=research]')));
  await click('[data-action=project-edit]'); await sleep(200);
  check('About it → Edit shows the Research switch, off', (await rc_sw()) === 'false');
  await click('[data-action=project-research]'); await sleep(300);
  check('turning it on says so, saves tools: ["research"] and adds the Research tab', (await toast()) === 'Research is on — it has its own tab.' && eq((await pAt('pjRsA')).tools, ['research']) && (await exists('[data-s=project-tabs] [data-tab=research]')) && (await rc_sw()) === 'true', [await toast(), (await pAt('pjRsA')).tools]);
  await click('[data-action=project-edit]'); await sleep(150);
  await go('projects/p/pjRsA/research', 2026, 10, 15, 9, 6); await until(`!!document.querySelector('[data-s=research]')`);
  check('the tab opens with three parts: Questions, Findings and Sources, each with its first-use words', (await tabOf()) === 'research' && (await exists('[data-s=research-questions]')) && (await exists('[data-s=research-findings]')) && (await exists('[data-s=research-sources]')) && (await text('[data-s=research-findings]')).includes('What you found out, where it came from, and how far to trust it.'));

  console.log('  A question and its Enter key');
  await type('#researchQuestionNew', 'Do commuters buy tea at stations?');
  await ev(`document.getElementById('researchQuestionNew').focus()`);
  await T.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await T.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await until(`document.querySelectorAll('[data-s=research-question]').length === 1`);
  const rc_rq = (await rc_rOf('question'))[0];
  check('Enter in the question field adds it (open, no conclusion), and the field is empty again', rc_rq && rc_rq.text === 'Do commuters buy tea at stations?' && rc_rq.projectId === 'pjRsA' && rc_rq.answeredOn === null && (await ev(`document.getElementById('researchQuestionNew').value`)) === '' && (await text('[data-s=research-questions]')).includes('1 open, 0 answered.'), rc_rq);
  check('the add button waits for words', await ev(`document.querySelector('[data-action=research-question-add]').disabled`));
  check('the question shows "No findings yet." and "Open"', (await text(`[data-s=research-question][data-id="${rc_rq.id}"]`)).includes('No findings yet.') && (await text(`[data-s=research-question][data-id="${rc_rq.id}"]`)).includes('Open'));

  console.log('  Sources: typed, and one from Resources, Files and Notes');
  await click('[data-action=research-source-add]'); await sleep(200);
  check('the source form offers "One of this project’s" and "Type one"', (await exists('[data-action=research-source-mine]')) && (await exists('[data-action=research-source-typed]')) && (await ev(`document.querySelector('[data-action=research-source-save]').disabled`) === false));
  const rc_opts = await ev(`[...document.querySelectorAll('#rsN-pick option')].map(o => [o.value, o.textContent])`);
  check('…which lists this project\'s link, file and note, and nothing of another project', eq(rc_opts, [['resource:rsrRes1', 'Link: Timber merchant'], ['file:flresf000001', 'File: Quote.pdf'], ['note:ntRsA', 'Note: Stall notes']]), rc_opts);
  await click('[data-action=research-source-typed]'); await sleep(150);
  check('"Add the source" waits for a title when typing one', await ev(`document.querySelector('[data-action=research-source-save]').disabled`));
  await type('#rsN-title', 'Interview with Priya'); await type('#rsN-from', 'Priya, market stall'); await type('#rsN-on', '2026-10-10'); await click('[data-action=research-source-save]'); await sleep(300);
  const rc_typedSrc = (await rc_rOf('source')).find(x => !x.ref);
  check('a typed source keeps its title, who it is from and its day', rc_typedSrc && rc_typedSrc.title === 'Interview with Priya' && rc_typedSrc.from === 'Priya, market stall' && rc_typedSrc.on === '2026-10-10' && (await toast()) === 'Source added.', rc_typedSrc);
  check('its row shows the title, who and when, and "Not used yet"', (await rc_rsText(rc_rsRow(rc_typedSrc.id))).includes('Interview with Priya') && (await rc_rsText(rc_rsRow(rc_typedSrc.id))).includes('Priya, market stall') && (await rc_rsText(rc_rsRow(rc_typedSrc.id))).includes('Not used yet'), await rc_rsText(rc_rsRow(rc_typedSrc.id)));
  for (const [kind, id] of [['resource', 'rsrRes1'], ['file', 'flresf000001'], ['note', 'ntRsA']]) {
    await click('[data-action=research-source-add]'); await sleep(150);
    await type('#rsN-pick', `${kind}:${id}`); await click('[data-action=research-source-save]'); await sleep(300);
  }
  const rc_srcs = await rc_rOf('source');
  check('a link, a file and a note can each be a source (kept by their id, with the name they had)', rc_srcs.length === 4 && eq(rc_srcs.filter(x => x.ref).map(x => [x.ref.kind, x.ref.id, x.title]), [['resource', 'rsrRes1', 'Timber merchant'], ['file', 'flresf000001', 'Quote.pdf'], ['note', 'ntRsA', 'Stall notes']]), rc_srcs);
  const rc_srcOf = kind => rc_srcs.find(x => x.ref?.kind === kind);
  check('the link opens in a new tab, the note opens itself, the file can be opened', (await ev(`document.querySelector('${rc_rsRow(rc_srcOf('resource').id)} a').getAttribute('href')`)) === 'https://example.com/oak' && (await ev(`document.querySelector('${rc_rsRow(rc_srcOf('resource').id)} a').target`)) === '_blank' && (await ev(`document.querySelector('${rc_rsRow(rc_srcOf('note').id)} a').getAttribute('href')`)) === '#projects/notes/ntRsA' && (await exists(`${rc_rsRow(rc_srcOf('file').id)} [data-action=research-source-open]`)));
  check('a linked source can not be edited here (only typed ones have Edit), and says what it is', !(await exists(`${rc_rsRow(rc_srcOf('resource').id)} [data-action=research-source-edit]`)) && (await exists(`${rc_rsRow(rc_typedSrc.id)} [data-action=research-source-edit]`)) && (await rc_rsText(rc_rsRow(rc_srcOf('resource').id))).includes('Link') && (await rc_rsText(rc_rsRow(rc_srcOf('file').id))).includes('File') && (await rc_rsText(rc_rsRow(rc_srcOf('note').id))).includes('Note'));
  await click('[data-action=research-source-add]'); await sleep(150);
  check('what is already a source is not offered again; with nothing of the project\'s left the form goes straight to typing one', !(await exists('#rsN-pick')) && (await exists('#rsN-title')) && !(await exists('[data-action=research-source-mine]')));
  await click('[data-action=research-source-cancel]'); await sleep(150);

  console.log('  A finding, with two sources, about the question');
  await click('[data-action=research-finding-add]'); await sleep(200);
  check('the finding form asks for the words first, then where it came from and what it bears on', (await exists('#rfN-text')) && /Where it came from/.test(await text('[data-s=research-finding-form]')) && /What it bears on/.test(await text('[data-s=research-finding-form]')) && (await ev(`document.querySelector('[data-action=research-finding-save]').disabled`)));
  await type('#rfN-text', 'Three of five stall holders said commuters buy tea before 9am.');
  for (const label of ['Interview with Priya', 'Timber merchant']) await ev(`[...document.querySelectorAll('[data-s=research-finding-form] fieldset label')].find(l => l.textContent.includes(${JSON.stringify(label)})).querySelector('input').click()`);
  await type(`[data-s=research-finding-form] select[aria-label*="Do commuters buy tea"]`, 'supports');
  await type('#rfN-limits', 'Only five stalls, all at one market');
  await click('[data-action=research-finding-save]'); await sleep(350);
  const rc_fnd = (await rc_rOf('finding'))[0];
  check('the finding is saved with its two sources, what it supports, its limits and today\'s date', rc_fnd && eq(rc_fnd.sourceIds, [rc_typedSrc.id, rc_srcOf('resource').id]) && eq(rc_fnd.about, [{ kind: 'question', id: rc_rq.id, stance: 'supports' }]) && rc_fnd.limits === 'Only five stalls, all at one market' && rc_fnd.on === '2026-10-15' && (await toast()) === 'Finding added.', rc_fnd);
  check('its row shows the words, the day and its sources, the limits, and what it bears on', (await rc_rsText(`[data-s=research-finding][data-id="${rc_fnd.id}"]`)).includes('Found') && (await rc_rsText(`[data-s=research-finding][data-id="${rc_fnd.id}"]`)).includes('From Interview with Priya, Timber merchant') && (await text(`[data-s=research-finding][data-id="${rc_fnd.id}"] [data-s=research-limits]`)).includes('Only five stalls') && (await rc_rsText(`[data-s=research-finding][data-id="${rc_fnd.id}"]`)).includes('Supports “Do commuters buy tea at stations?”'), await rc_rsText(`[data-s=research-finding][data-id="${rc_fnd.id}"]`));
  check('the question now shows "Supports (1)" with the finding and its sources', (await rc_rsText(`[data-s=research-question][data-id="${rc_rq.id}"] [data-s=research-supports]`)).startsWith('Supports (1)') && (await rc_rsText(`[data-s=research-question][data-id="${rc_rq.id}"] [data-s=research-supports]`)).includes('Three of five stall holders') && (await rc_rsText(`[data-s=research-question][data-id="${rc_rq.id}"] [data-s=research-supports]`)).includes('Interview with Priya, Timber merchant') && !(await text(`[data-s=research-question][data-id="${rc_rq.id}"]`)).includes('No findings yet.'));
  check('each source says it is used by one finding', (await rc_rsText(rc_rsRow(rc_typedSrc.id))).includes('Used by 1 finding') && (await rc_rsText(rc_rsRow(rc_srcOf('note').id))).includes('Not used yet'));
  await click('[data-action=research-finding-add]'); await sleep(200);
  await click('[data-action=research-finding-new-source]'); await sleep(200);
  check('the finding form can add a source on the spot', await exists('[data-s=research-finding-form] [data-s=research-source-form]'));
  await click('[data-s=research-finding-form] [data-action=research-source-cancel]'); await click('[data-action=research-finding-cancel]'); await sleep(200);

  console.log('  A conclusion, Answered, and Reopen');
  await click(`[data-s=research-question][data-id="${rc_rq.id}"] [data-action=research-question-answer]`); await sleep(300);
  check('"Mark answered" with nothing written says "Write what you concluded first.", puts the keyboard in the box, and answers nothing', (await toast()) === 'Write what you concluded first.' && (await ev(`document.activeElement && document.activeElement.id`)) === `rqC-${rc_rq.id}` && (await rc_rOf('question'))[0].answeredOn === null, [await toast(), await ev(`document.activeElement && document.activeElement.id`)]);
  await type(`#rqC-${rc_rq.id}`, 'Yes: mostly before 9am, mostly mint.'); await ev(`document.getElementById('rqC-${rc_rq.id}').blur()`); await sleep(350);
  check('writing what you concluded saves it', (await rc_rOf('question'))[0].conclusion === 'Yes: mostly before 9am, mostly mint.');
  await click(`[data-s=research-question][data-id="${rc_rq.id}"] [data-action=research-question-answer]`); await sleep(300);
  check('Mark answered says "Answered." and the row shows "Answered <day>"', (await toast()) === 'Answered.' && /^Answered \w+ 15 Oct/.test((await rc_rsText(`[data-s=research-question][data-id="${rc_rq.id}"]`)).replace(/^Do commuters buy tea at stations\?\s*/, '')) && (await rc_rOf('question'))[0].answeredOn === '2026-10-15' && (await ev(`document.querySelector('[data-s=research-question][data-id="${rc_rq.id}"]').dataset.state`)) === 'answered', await rc_rsText(`[data-s=research-question][data-id="${rc_rq.id}"]`));
  check('the heading counts "0 open, 1 answered."', (await text('[data-s=research-questions]')).includes('0 open, 1 answered.'));
  await click(`[data-s=research-question][data-id="${rc_rq.id}"] [data-action=research-question-reopen]`); await sleep(300);
  check('Reopen says "Open again.", clears the day and keeps the words', (await toast()) === 'Open again.' && (await rc_rOf('question'))[0].answeredOn === null && (await rc_rOf('question'))[0].conclusion === 'Yes: mostly before 9am, mostly mint.');

  console.log('  Editing');
  await click(`[data-s=research-question][data-id="${rc_rq.id}"] [data-action=research-question-edit]`); await sleep(200);
  await type('[aria-label="The question"]', 'Do commuters buy tea at railway stations?');
  await ev(`document.querySelector('[aria-label="The question"]').focus()`);
  await T.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await T.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await sleep(350);
  check('editing a question (Enter saves) changes its words and nothing else', (await rc_rOf('question'))[0].text === 'Do commuters buy tea at railway stations?' && (await rc_rOf('question'))[0].conclusion === 'Yes: mostly before 9am, mostly mint.');
  await click(`[data-s=research-finding][data-id="${rc_fnd.id}"] [data-action=research-finding-edit]`); await sleep(250);
  check('editing a finding opens the form with its words, sources and what it bears on', (await ev(`document.getElementById('rfE-${rc_fnd.id}-text').value`)).startsWith('Three of five') && (await ev(`[...document.querySelectorAll('[data-s=research-finding-form] fieldset input[type=checkbox]')].filter(c => c.checked).length`)) === 2);
  await type(`#rfE-${rc_fnd.id}-text`, 'Three of five stall holders said commuters buy tea early.'); await type(`#rfE-${rc_fnd.id}-limits`, 'One market only');
  await click('[data-action=research-finding-save]'); await sleep(350);
  check('saving the edit changes the finding and keeps its sources and subject', (await rc_rOf('finding'))[0].text.endsWith('buy tea early.') && (await rc_rOf('finding'))[0].limits === 'One market only' && (await rc_rOf('finding'))[0].sourceIds.length === 2 && (await rc_rOf('finding'))[0].about.length === 1);
  await click(`${rc_rsRow(rc_typedSrc.id)} [data-action=research-source-edit]`); await sleep(250);
  await type(`#rsE-${rc_typedSrc.id}-title`, 'Interview with Priya (2nd)'); await click('[data-s=research-source-form] [data-action=research-source-save]'); await sleep(300);
  check('editing a typed source changes its title', (await rc_rOf('source')).find(x => x.id === rc_typedSrc.id).title === 'Interview with Priya (2nd)' && (await rc_rsText(rc_rsRow(rc_typedSrc.id))).includes('Interview with Priya (2nd)'));

  console.log('  Removing, with a question first');
  await click(`${rc_rsRow(rc_typedSrc.id)} [data-action=research-source-remove]`); await sleep(250);
  check('removing a source asks first, says how many findings it comes out of, and "Keep it" keeps it', (await text('dialog[open]')).includes('Remove this source?') && (await text('dialog[open]')).includes('It comes out of 1 finding, which keep their words.') && (await text('[data-action=dialog-cancel]')) === 'Keep it');
  await answer(false);
  check('…Keep it kept it', (await rc_rOf('source')).some(x => x.id === rc_typedSrc.id));
  await click(`${rc_rsRow(rc_typedSrc.id)} [data-action=research-source-remove]`); await answer(true);
  check('removing it takes it out of the finding, which keeps its words; the toast says so', !(await rc_rOf('source')).some(x => x.id === rc_typedSrc.id) && eq((await rc_rOf('finding'))[0].sourceIds, [rc_srcOf('resource').id]) && (await rc_rOf('finding'))[0].text.endsWith('buy tea early.') && (await toast()) === 'Source removed.', (await rc_rOf('finding'))[0]);
  await click(`${rc_rsRow(rc_srcOf('resource').id)} [data-action=research-source-remove]`); await sleep(250);
  check('removing a source that is a link says the link itself stays where it is', (await text('dialog[open]')).includes('The link, file or note itself stays where it is.'));
  await answer(true); await sleep(250);
  check('…and nothing was deleted from Resources, Files or Notes', (await pAt('pjRsA')).resources.length === 1 && (await data()).files.items.some(f => f.id === 'flresf000001') && (await data()).notes.items.some(n => n.id === 'ntRsA'));
  await click(`[data-s=research-finding][data-id="${rc_fnd.id}"] [data-action=research-finding-remove]`); await sleep(250);
  check('removing a finding asks first ("Its sources stay."), and "Keep it" keeps it', (await text('dialog[open]')).includes('Remove this finding?') && (await text('dialog[open]')).includes('Its sources stay.'));
  await answer(false); check('…kept', (await rc_rOf('finding')).length === 1);
  await click(`[data-s=research-question][data-id="${rc_rq.id}"] [data-action=research-question-remove]`); await sleep(250);
  check('removing a question asks first ("Its findings stay…"), and the finding stops pointing at it after', (await text('dialog[open]')).includes('Its findings stay; they just stop pointing at it.'));
  await answer(true); await sleep(250);
  check('…the question is gone and the finding keeps its words, with no subject', (await rc_rOf('question')).length === 0 && (await rc_rOf('finding'))[0].about.length === 0 && (await toast()) === 'Question removed.');
  await click(`[data-s=research-finding][data-id="${rc_fnd.id}"] [data-action=research-finding-remove]`); await answer(true); await sleep(250);
  check('and removing the finding removes it', (await rc_rOf('finding')).length === 0 && (await toast()) === 'Finding removed.');

  console.log('  Search, and switching it off and on');
  await type('#researchQuestionNew', 'Which blend sells best at stations?'); await click('[data-action=research-question-add]'); await sleep(300);
  await click('[data-action=research-finding-add]'); await sleep(200);
  await type('#rfN-text', 'Mint outsold chamomile two to one.'); await type('#rfN-limits', 'Tiny sample at one stall'); await click('[data-action=research-finding-save]'); await sleep(300);
  await click('[data-action=research-source-add]'); await sleep(200);
  await click('[data-action=research-source-typed]'); await type('#rsN-title', 'Blend survey'); await type('#rsN-from', 'The market association'); await click('[data-action=research-source-save]'); await sleep(300);
  await srType('blend');
  check('Search this project finds a question and a typed source, each labelled, and opens the Research tab', (await srRows()).some(x => x.startsWith('question:Research question | Which blend')) && (await srRows()).some(x => x.startsWith('source:Source | Blend survey')) && (await srHrefs()).every(h => h === '#projects/p/pjRsA/research'), await srRows());
  await srType('chamomile');
  check('…a finding by its words', eq((await srRows()).map(x => x.split(':')[0]), ['finding']));
  await srType('tiny sample');
  check('…and by its limits', eq((await srRows()).map(x => x.split(':')[0]), ['finding']));
  await srType('market association');
  check('…and a typed source by who it is from', eq((await srRows()).map(x => x.split(':')[0]), ['source']));
  await click('[data-s=search-hit] a'); await sleep(400);
  check('picking a result opens the Research tab and clears the search', (await tabOf()) === 'research' && !(await srShowing()), await hash());
  const rc_keepN = (await rc_rItems()).length;
  await go('projects/p/pjRsA', 2026, 10, 15, 9, 18); await until(`!!document.querySelector('[data-action=project-edit]')`);
  await click('[data-action=project-edit]'); await sleep(200);
  await click('[data-action=project-research]'); await sleep(300);
  check('switching Research off says everything is kept, hides the tab and drops tools', (await toast()).includes('Everything in it is kept') && !(await exists('[data-tab=research]')) && !('tools' in (await pAt('pjRsA'))) && (await rc_rItems()).length === rc_keepN && rc_keepN >= 3, [await toast(), rc_keepN]);
  await click('[data-action=project-edit]'); await sleep(150);
  await go('projects/p/pjRsA/research', 2026, 10, 15, 9, 20); await sleep(300);
  check('its address then shows the Overview instead', (await tabOf()) === 'overview' && !(await exists('[data-s=research]')));
  await srType('chamomile');
  check('nothing of it is searched while it is off', (await text('#pjSearchH')).startsWith('Nothing in this project matches'));
  await click('[data-action=search-clear]');
  await click('[data-action=project-edit]'); await sleep(200); await click('[data-action=project-research]'); await sleep(300);
  await go('projects/p/pjRsA/research', 2026, 10, 15, 9, 22); await until(`!!document.querySelector('[data-s=research]')`);
  check('switching it on again: every question, finding and source is still there', (await exists('[data-s=research-question]')) && (await exists('[data-s=research-finding]')) && (await exists('[data-s=research-source]')) && (await rc_rItems()).length === rc_keepN);

  console.log('  A business idea: evidence for what must be true');
  await go('projects/p/pjRsB/model', 2026, 10, 15, 9, 30); await until(`!!document.getElementById('projectModel')`);
  check('without Research, the Model tab offers it in one quiet line', (await exists('[data-s=model-research-offer]')) && (await text('[data-s=model-research-offer]')).includes('Collect what you find out in Research') && !(await exists('[data-s=as-evidence]')) && !(await exists('[data-tab=research]')));
  await click('[data-action=model-research-on]'); await sleep(300);
  check('Turn on switches it on: the toast, the Research tab, and the offer is gone', (await toast()) === 'Research is on — it has its own tab.' && eq((await pAt('pjRsB')).tools, ['research']) && (await exists('[data-tab=research]')) && !(await exists('[data-s=model-research-offer]')));
  await go('projects/p/pjRsB/research', 2026, 10, 15, 9, 35); await until(`!!document.querySelector('[data-s=research]')`);
  await type('#researchQuestionNew', 'Is there a pitch at the station?'); await click('[data-action=research-question-add]'); await sleep(300);
  await click('[data-action=research-finding-add]'); await sleep(200);
  check('on a business idea the finding form also offers what must be true', (await exists('select[aria-label*="People pay two pounds"]')) && (await exists('select[aria-label*="The council allows a cart"]')) && (await text('[data-s=research-finding-form]')).includes('Must be true: People pay two pounds'));
  await type('#rfN-text', 'The council says a cart needs a licence that costs £400.');
  await type('select[aria-label*="The council allows a cart"]', 'contradicts'); await click('[data-action=research-finding-save]'); await sleep(350);
  const rc_bf = (await rc_rOf('finding')).find(x => x.projectId === 'pjRsB');
  check('the finding is saved against that thing, as "contradicts"', rc_bf && eq(rc_bf.about, [{ kind: 'assumption', id: 'asRs2', stance: 'contradicts' }]), rc_bf);
  check('its row says "Contradicts “The council allows a cart”"', (await rc_rsText(`[data-s=research-finding][data-id="${rc_bf.id}"]`)).includes('Contradicts “The council allows a cart”'));
  await go('projects/p/pjRsB/model', 2026, 10, 15, 9, 40); await until(`!!document.getElementById('projectModel')`);
  check('the Model tab says "1 finding contradicts it" under that thing, and it opens the Research tab', (await text('[data-s=as-evidence]')) === '1 finding contradicts it' && (await ev(`document.querySelector('[data-s=as-evidence]').getAttribute('href')`)) === '#projects/p/pjRsB/research' && (await ev(`document.querySelectorAll('[data-s=as-evidence]').length`)) === 1, await text('#projectModel'));
  check('whether it looks true stays the person\'s: its state is still "not checked yet"', (await pAt('pjRsB')).model.assumptions.find(a => a.id === 'asRs2').state === 'open');
  await click('[data-s=assumption][data-id=asRs2] [data-action=as-edit]'); await sleep(200);
  await click('[data-s=assumption][data-id=asRs2] [data-action=as-remove]'); await answer(true); await sleep(300);
  check('removing that thing from the one page makes findings stop pointing at it (they keep their words)', (await rc_rOf('finding')).find(x => x.projectId === 'pjRsB').about.length === 0 && (await rc_rOf('finding')).find(x => x.projectId === 'pjRsB').text.startsWith('The council says'), (await rc_rOf('finding')).find(x => x.projectId === 'pjRsB'));

  console.log('  The Research kind, deleting a project, a phone');
  await go('projects/p/pjRsC', 2026, 10, 15, 9, 45);
  await click('[data-action=project-edit]'); await sleep(200);
  await type('#projectKind', 'research'); await sleep(350);
  check('choosing the Research kind says so, gives the project the Research tab and no switch for it', (await toast()).includes('Now a research project') && (await pAt('pjRsC')).template === 'research' && (await exists('[data-s=project-tabs] [data-tab=research]')) && !(await exists('[data-action=project-research]')), [await toast(), (await pAt('pjRsC')).template]);
  await go('projects/p/pjRsC/research', 2026, 10, 15, 9, 46); await until(`!!document.querySelector('[data-s=research]')`);
  await type('#researchQuestionNew', 'What will the permit cost?'); await click('[data-action=research-question-add]'); await sleep(300);
  check('a research project can keep research from the start', (await rc_rItems()).some(x => x.projectId === 'pjRsC' && x.type === 'question'));
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await go('projects/p/pjRsA/research', 2026, 10, 15, 9, 50); await until(`!!document.querySelector('[data-s=research]')`); await sleep(300);
  check('phone 320 px: the Research tab does not scroll sideways', (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  check('phone 320 px: its buttons, fields and links are at least 44 px tall', await ev(`[...document.querySelectorAll('[data-s=research] button, [data-s=research] input:not([type=checkbox]), [data-s=research] textarea, [data-s=research] [data-action]')].every(b => b.getBoundingClientRect().height >= 44)`), await ev(`[...document.querySelectorAll('[data-s=research] button, [data-s=research] input:not([type=checkbox]), [data-s=research] textarea, [data-s=research] [data-action]')].filter(b => b.getBoundingClientRect().height < 44).map(b => (b.dataset.action || b.id || b.tagName) + ':' + Math.round(b.getBoundingClientRect().height))`));
  await click('[data-action=research-finding-add]'); await sleep(300);
  check('phone 320 px: with the finding form open it still does not scroll sideways', (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  await T.send('Emulation.clearDeviceMetricsOverride');
  const rc_before44 = (await rc_rItems()).filter(x => x.projectId === 'pjRsA').length;
  await go('projects/p/pjRsA', 2026, 10, 15, 9, 55);
  await click('[data-action=project-delete]'); await answer(true); await sleep(400);
  check('deleting a project deletes its research and only that project\'s', rc_before44 >= 3 && !(await rc_rItems()).some(x => x.projectId === 'pjRsA') && (await rc_rItems()).some(x => x.projectId === 'pjRsB') && (await rc_rItems()).some(x => x.projectId === 'pjRsC') && !(await projects()).some(x => x.id === 'pjRsA'), (await rc_rItems()).map(x => x.projectId));

  console.log('\n[45] A task that starts after another is not the next step');
  await go('projects', 2026, 10, 15, 20); await reset(); await go('projects', 2026, 10, 15, 20);
  await click('#themeBtn'); await sleep(300); // any change saves, so there is saved data to edit
  const wt = (id, title, at, extra = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-14T10:0' + at, postponed: 0, blockers: [], letGoOn: null, projectId: 'pjWait', ...extra });
  const wtSeed = (n1, n3) => editStorage(`s => { s.projects.items = [${JSON.stringify(pjObj('pjWait', 'Garden bench', 'act'))}]; s.tasks.items = ${JSON.stringify([wt('tkN1', 'Build the frame', 0, n1), wt('tkN2', 'Measure the wall', 1), wt('tkN3', 'Order the boards', 2, n3)])}; }`);
  await wtSeed({ after: ['tkN3'] }, {});
  await go('projects/p/pjWait', 2026, 10, 15, 20, 5);
  check('"Build the frame" starts after "Order the boards", so the next step is "Measure the wall", not "Build the frame"', (await text('[data-s=next-title]')) === 'Measure the wall', await text('#projectNext'));
  await click('[data-s=next-why] summary'); await until(`document.querySelector('[data-s=next-why]').open`);
  check('"Why this?" opens and says “Build the frame” comes first, but it starts after “Order the boards”.', (await ev(`document.querySelector('[data-s=next-why]').open`)) && (await text('[data-s=next-why-text]')).includes('“Build the frame” comes first, but it starts after “Order the boards”.'), await text('[data-s=next-why-text]'));
  await wtSeed({ after: ['tkN3'] }, { done: true, doneOn: K });
  await go('projects/p/pjWait', 2026, 10, 15, 20, 6);
  check('once "Order the boards" is done, the next step is "Build the frame"', (await text('[data-s=next-title]')) === 'Build the frame' && !(await exists('[data-s=next-starts-after]')), await text('#projectNext'));
  await wtSeed({ after: ['tkN3'], steps: [{ id: 'sw1', text: 'Cut the legs', done: true }, { id: 'sw2', text: 'Cut the slats', done: false }] }, {});
  await go('projects/p/pjWait', 2026, 10, 15, 20, 7);
  check('before choosing, the next step is still "Measure the wall", with no steps shown', (await text('[data-s=next-title]')) === 'Measure the wall' && !(await exists('[data-s=next-steps]')));
  await type('#projectNextPick', 'tkN1'); await until(`document.querySelector('[data-s=next-title]')?.textContent === 'Build the frame' && !!document.querySelector('[data-s=next-starts-after]')`);
  check('choosing "Build the frame" while it starts after another task makes it the next step, saved as the project\'s choice', (await text('[data-s=next-title]')) === 'Build the frame' && (await pAt('pjWait')).nextTaskId === 'tkN1', [await text('[data-s=next-title]'), (await pAt('pjWait')).nextTaskId]);
  check('…and says "Starts after: Order the boards. You can still do it any time."', (await text('[data-s=next-starts-after]')).replace(/\s+/g, ' ').trim() === 'Starts after: Order the boards. You can still do it any time.', await text('[data-s=next-starts-after]'));
  check('…and a next step with steps shows "1 of 2 steps"', (await text('[data-s=next-steps]')).trim() === '1 of 2 steps', await text('#projectNext'));

  console.log('\n[46] Needs you, across projects, and Board · List');
  await go('projects', 2026, 10, 15, 9); await reset(); await go('projects', 2026, 10, 15, 9);
  await click('#themeBtn'); await sleep(300); // any change saves, so there is saved data to edit
  const ny_pj = (id, title, stage, extra = {}) => ({ id, title, summary: '', stage, status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00', ...extra });
  const ny_tk = (id, title, projectId, extra = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-01T09:00', postponed: 0, blockers: [], letGoOn: null, projectId, ...extra });
  const ny_projects = [
    ny_pj('pjNyShed', 'Shed', 'act', { updatedAt: '2026-10-14T12:00', nextTaskId: 'tkNyToday' }),
    ny_pj('pjNyCoffee', 'Coffee', 'explore', { template: 'business', updatedAt: '2026-10-13T12:00',
      decisions: [{ id: 'dcNy', question: 'Which roaster?', options: [], chosen: null, why: '', decidedOn: null, createdAt: '2026-09-22T09:00', updatedAt: '2026-09-22T09:00' }] }),
    ny_pj('pjNyPriv', 'Private plan', 'organise', { private: true, updatedAt: '2026-10-12T12:00', nextTaskId: 'tkNyPriv' }),
    ny_pj('pjNyPaused', 'Paused plan', 'act', { status: 'paused', updatedAt: '2026-10-11T12:00' }),
  ];
  const ny_tasks = [
    ny_tk('tkNyToday', 'Buy the screws', 'pjNyShed', { due: '2026-10-15', time: '17:30' }),
    ny_tk('tkNyPast', 'Paint the door', 'pjNyShed', { due: '2026-10-12' }),
    ny_tk('tkNyWait', 'Hear back on the quote', 'pjNyShed', { waiting: { on: 'Priya', since: '2026-10-10', until: '2026-10-14' } }),
    ny_tk('tkNyPriv', 'Renew the licence', 'pjNyPriv', { due: '2026-10-17' }),
    ny_tk('tkNyPaused', 'Sand the bench', 'pjNyPaused', { due: '2026-10-15' }),
  ];
  const ny_seed = (projs, tasks) => editStorage(`s => { s.projects.items = ${JSON.stringify(projs)}; s.tasks.items = ${JSON.stringify(tasks)}; }`);
  const ny_ids = () => ev(`[...document.querySelectorAll('#needsYou [data-s=need]')].map(li => li.dataset.id)`);
  const ny_lines = id => ev(`[...document.querySelectorAll('#needsYou [data-s=need][data-id="${id}"] [data-s=need-link] > span')].map(s => s.textContent)`);
  const ny_open = async (m = 0) => { await go('projects', 2026, 10, 15, 9, m); await until(`!!document.querySelector('#needsYou')`); };
  await ny_seed(ny_projects, ny_tasks);
  await ny_open(1);
  const ny_rows = ['date:tkNyToday', 'past:tkNyPast', 'waiting:tkNyWait', 'date:tkNyPriv', 'decision:pjNyCoffee:dcNy'];
  let got = await ny_ids();
  check('"Needs you" is at the top of the Projects home, above the intro and the board, with the title and a count of 5', (await text('#needsYou h2')).startsWith('Needs you') && (await text('[data-s=needs-count]')) === '5' && (await ev(`document.getElementById('needsYou').compareDocumentPosition(document.getElementById('projectsIntro')) & Node.DOCUMENT_POSITION_FOLLOWING`)) > 0 && (await ev(`document.getElementById('needsYou').compareDocumentPosition(document.getElementById('projectList') || document.body) & Node.DOCUMENT_POSITION_FOLLOWING`)) > 0, [await text('#needsYou h2'), await text('[data-s=needs-count]')]);
  check('the rows come in order: today, a date passed, a wait that is due, the coming date, the open decision', eq(got, ny_rows), got);
  check('the paused project\'s task due today is not there', !got.some(x => x.includes('tkNyPaused')), got);
  const ny_dateWords = await ev(`new Date(2026, 9, 12).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })`);
  const ny_soonWords = await ev(`new Date(2026, 9, 17).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })`);
  const ny_expWords = await ev(`new Date(2026, 9, 14).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })`);
  let l = await ny_lines('date:tkNyToday');
  check('the task due today says "Buy the screws" and "today at 17:30 · Shed"', eq(l, ['Buy the screws', 'today at 17:30 · Shed']), l);
  l = await ny_lines('past:tkNyPast');
  check('the task whose date has passed says "Paint the door" and "still open, was due <its date> · Shed", the date written like the other rows\'', l[0] === 'Paint the door' && l[1] === `still open, was due ${ny_dateWords} · Shed`, [l, ny_dateWords]);
  l = await ny_lines('waiting:tkNyWait');
  check('the wait says "Hear back on the quote" and "waiting on Priya — expected <yesterday> · Shed"', l[0] === 'Hear back on the quote' && l[1] === `waiting on Priya — expected ${ny_expWords} · Shed`, [l, ny_expWords]);
  l = await ny_lines('date:tkNyPriv');
  check('the date in two days says "on <its date> · Private plan", and that project shows a lock marked "Private"', l[0] === 'Renew the licence' && l[1] === `on ${ny_soonWords} · Private plan` && (await ev(`!!document.querySelector('[data-id="date:tkNyPriv"] svg[aria-label=Private]')`)), l);
  check('only the private project\'s row has a lock', (await ev(`document.querySelectorAll('#needsYou [data-s=need] svg[aria-label=Private]').length`)) === 1);
  l = await ny_lines('decision:pjNyCoffee:dcNy');
  check('the decision open 23 days says "Which roaster?" and "open 3 weeks · Coffee"', eq(l, ['Which roaster?', 'open 3 weeks · Coffee']), l);
  const ny_hrefs = await ev(`[...document.querySelectorAll('#needsYou [data-s=need-link]')].map(a => a.getAttribute('href'))`);
  check('each row\'s link goes to the right place: the task pages, and the project\'s decisions', eq(ny_hrefs, ['#today/tasks/tkNyToday', '#today/tasks/tkNyPast', '#today/tasks/tkNyWait', '#today/tasks/tkNyPriv', '#projects/p/pjNyCoffee/decisions']), ny_hrefs);
  await click('[data-id="past:tkNyPast"] [data-s=need-link]');
  check('opening the past one goes to its task page', await until(`location.hash === '#today/tasks/tkNyPast'`), await hash());
  await ev('history.back()');
  check('going back returns to the Projects home with the card', await until(`!!document.querySelector('#needsYou') && location.hash === '#projects'`), await hash());

  console.log('  Chase it');
  check('only the wait has "Chase it"', (await ev(`[...document.querySelectorAll('#needsYou [data-action=chase]')].map(b => b.closest('[data-s=need]').dataset.id)`)).join() === 'waiting:tkNyWait');
  await click('[data-id="waiting:tkNyWait"] [data-action=chase]');
  check('"Chase it" under the wait opens "When would you like to chase it?"', await until(`!!document.querySelector('[data-id="waiting:tkNyWait"] [data-s=chase-when]')`) && (await text('[data-id="waiting:tkNyWait"] [data-s=chase-when]')).includes('When would you like to chase it?'), await text('[data-id="waiting:tkNyWait"]'));

  console.log('  Filters');
  await ny_open(2);
  const ny_chips = () => ev(`[...document.querySelectorAll('#needsYou [data-s=needs-filter]')].map(b => b.dataset.id + ':' + b.textContent.replace(/\\s+/g, ' ').trim() + ':' + b.getAttribute('aria-pressed'))`);
  let chips = await ny_chips();
  check('the filters are All 5, Dates 3, Waiting 1, Decisions 1 (no group with nothing in it), with All pressed', eq(chips, ['all:All 5:true', 'dates:Dates 3:false', 'waiting:Waiting 1:false', 'decisions:Decisions 1:false']), chips);
  const ny_opts = await ev(`[...document.querySelectorAll('#needsProject option')].map(o => o.value + ':' + o.textContent)`);
  check('the project picker offers "All projects" and each project with something, most recently worked on first (not the paused one)', eq(ny_opts, [':All projects', 'pjNyShed:Shed', 'pjNyCoffee:Coffee', 'pjNyPriv:Private plan']), ny_opts);
  await click('[data-s=needs-filter][data-id=decisions]');
  await until(`document.querySelectorAll('#needsYou [data-s=need]').length === 1`);
  got = await ny_ids();
  check('"Decisions" shows only the decision, and is pressed', eq(got, ['decision:pjNyCoffee:dcNy']) && (await ev(`document.querySelector('[data-s=needs-filter][data-id=decisions]').getAttribute('aria-pressed')`)) === 'true' && (await ev(`document.querySelector('[data-s=needs-filter][data-id=all]').getAttribute('aria-pressed')`)) === 'false', got);
  await click('[data-s=needs-filter][data-id=all]');
  await until(`document.querySelectorAll('#needsYou [data-s=need]').length === 5`);
  check('"All" brings every row back', eq(await ny_ids(), ny_rows), await ny_ids());
  await type('#needsProject', 'pjNyShed');
  await until(`document.querySelectorAll('#needsYou [data-s=need]').length === 3`);
  got = await ny_ids();
  chips = await ny_chips();
  check('choosing Shed in the picker shows only Shed\'s rows (today, past, waiting)', eq(got, ['date:tkNyToday', 'past:tkNyPast', 'waiting:tkNyWait']), got);
  check('…and the filters count only Shed\'s: All 3, Dates 2, Waiting 1', eq(chips, ['all:All 3:true', 'dates:Dates 2:false', 'waiting:Waiting 1:false']), chips);

  console.log('  Five at a time');
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(ny_tk('tkNyMore1', 'Oil the hinges', 'pjNyShed', { due: '2026-10-18' }))}, ${JSON.stringify(ny_tk('tkNyMore2', 'Hang the shelf', 'pjNyShed', { due: '2026-10-19' }))}); }`);
  await ny_open(3);
  check('with 7 things, only 5 show and the total says 7', (await ny_ids()).length === 5 && (await text('[data-s=needs-count]')) === '7', [await ny_ids(), await text('[data-s=needs-count]')]);
  check('…with "Show 2 more", not expanded', (await text('[data-action=needs-more]')) === 'Show 2 more' && (await ev(`document.querySelector('[data-action=needs-more]').getAttribute('aria-expanded')`)) === 'false');
  await click('[data-action=needs-more]');
  await until(`document.querySelectorAll('#needsYou [data-s=need]').length === 7`);
  check('"Show 2 more" shows all 7, and the button becomes "Show fewer"', (await ny_ids()).length === 7 && (await text('[data-action=needs-more]')) === 'Show fewer' && (await ev(`document.querySelector('[data-action=needs-more]').getAttribute('aria-expanded')`)) === 'true', [await ny_ids(), await text('[data-action=needs-more]')]);
  await click('[data-action=needs-more]');
  check('"Show fewer" goes back to 5', await until(`document.querySelectorAll('#needsYou [data-s=need]').length === 5`) && (await text('[data-action=needs-more]')) === 'Show 2 more');

  console.log('  Dealt with');
  await editStorage(`s => { const t = s.tasks.items.find(x => x.id === 'tkNyPast'); t.done = true; t.doneOn = '2026-10-15'; }`);
  await ny_open(4);
  got = await ny_ids();
  check('once the passed task is done, its row is gone (6 things now, 5 shown)', !got.includes('past:tkNyPast') && (await text('[data-s=needs-count]')) === '6' && got.length === 5 && (await text('[data-action=needs-more]')) === 'Show 1 more', [got, await text('[data-s=needs-count]')]);

  console.log('  Nothing, and no projects');
  await ny_seed([ny_pj('pjNyEmpty', 'Quiet project', 'capture')], []);
  await ny_open(5);
  check('a project with nothing to show: "Nothing needs you right now." with no rows, count or filters', (await text('[data-s=needs-none]')) === 'Nothing needs you right now.' && (await ny_ids()).length === 0 && !(await exists('[data-s=needs-count]')) && !(await exists('[data-s=needs-filters]')));
  await ny_seed([], []);
  await go('projects', 2026, 10, 15, 9, 6); await until(`!!document.querySelector('#projectsEmpty')`);
  check('with no projects at all there is no "Needs you" card, and no Board · List switch', !(await exists('#needsYou')) && !(await exists('[data-s=projects-view]')));

  console.log('  Board · List');
  await ny_seed(ny_projects, ny_tasks);
  await ny_open(7);
  const ny_vw = () => ev(`[...document.querySelectorAll('[data-action=projects-view]')].map(b => b.dataset.id + ':' + b.getAttribute('aria-pressed'))`);
  check('the Projects home starts on the board, with Board pressed', (await exists('#projectList')) && !(await exists('#projectsList')) && eq(await ny_vw(), ['board:true', 'list:false']), await ny_vw());
  await click('[data-action=projects-view][data-id=list]');
  await until(`!!document.getElementById('projectsList')`);
  check('"List" shows the list instead of the board, with List pressed', !(await exists('#projectList')) && eq(await ny_vw(), ['board:false', 'list:true']), await ny_vw());
  const ny_rowsList = () => ev(`[...document.querySelectorAll('#projectsList [data-s=project-row]')].map(li => li.dataset.id + '|' + li.querySelector('a').getAttribute('href') + '|' + li.querySelector('a > span > span:nth-child(2)').textContent + '|' + li.querySelector('[data-s=project-needs]').textContent)`);
  const ny_rl = await ny_rowsList();
  check('the list has one row per active project, most recently worked on first, each linking to the project', eq(ny_rl.map(x => x.split('|').slice(0, 2).join('|')), ['pjNyShed|#projects/p/pjNyShed', 'pjNyCoffee|#projects/p/pjNyCoffee', 'pjNyPriv|#projects/p/pjNyPriv']), ny_rl);
  check('…each says its stage, its kind and next step, or "No next step yet"', eq(ny_rl.map(x => x.split('|')[2]), ['Act · Next: Buy the screws', 'Explore · Business idea · No next step yet', 'Organise · Next: Renew the licence']), ny_rl);
  check('…and how many things need you: "3 need you", "1 needs you", "1 needs you"', eq(ny_rl.map(x => x.split('|')[3]), ['3 need you', '1 needs you', '1 needs you']), ny_rl);
  const ny_sum = await ev(`[...document.querySelectorAll('[data-s=project-needs]')].reduce((n, e) => n + (parseInt(e.textContent) || 0), 0)`);
  check('the list\'s numbers add up to the card\'s total (5)', ny_sum === 5 && (await text('[data-s=needs-count]')) === '5', [ny_sum, await text('[data-s=needs-count]')]);
  await editStorage(`s => { s.projects.items.find(x => x.id === 'pjNyPriv').updatedAt = '2026-10-14T18:00'; s.projects.items.push(${JSON.stringify(ny_pj('pjNyQuiet', 'Quiet project', 'capture', { updatedAt: '2026-10-09T09:00' }))}); }`);
  await ny_open(8);
  const ny_rl2 = await ny_rowsList();
  check('a project worked on more recently moves up; one with nothing needing you has an empty count', eq(ny_rl2.map(x => x.split('|')[0]), ['pjNyPriv', 'pjNyShed', 'pjNyCoffee', 'pjNyQuiet']) && ny_rl2[3].endsWith('|'), ny_rl2);
  check('the choice is saved on this device as myday.projects.view = list, not in the saved data', (await ev(`localStorage.getItem('myday.projects.view')`)) === 'list' && !JSON.stringify(await data()).includes('projects.view'));
  check('after a reload it is still the list', (await exists('#projectsList')) && !(await exists('#projectList')) && eq(await ny_vw(), ['board:false', 'list:true']), await ny_vw());
  await click('[data-action=projects-view][data-id=board]');
  await until(`!!document.getElementById('projectList')`);
  check('"Board" brings the board back, and the choice is remembered', !(await exists('#projectsList')) && (await ev(`localStorage.getItem('myday.projects.view')`)) === 'board' && eq(await ny_vw(), ['board:true', 'list:false']), await ny_vw());

  console.log('  A phone');
  await ny_seed(ny_projects, [...ny_tasks, ny_tk('tkNyMore1', 'Oil the hinges', 'pjNyShed', { due: '2026-10-18' }), ny_tk('tkNyMore2', 'Hang the shelf', 'pjNyShed', { due: '2026-10-19' })]);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await ny_open(9); await sleep(300);
  const ny_small = () => ev(`[...document.querySelectorAll('#needsYou button, #needsYou select, #needsYou a, [data-s=projects-view] button')].filter(b => b.getBoundingClientRect().height < 44).map(b => (b.dataset.action || b.dataset.id || b.id || b.tagName) + ':' + Math.round(b.getBoundingClientRect().height))`);
  check('phone 390 px: the Projects home with the card and its filters does not scroll sideways', (await ev('document.documentElement.scrollWidth')) <= 390, await ev('document.documentElement.scrollWidth'));
  check('phone 390 px: every button, picker and link in the card, and the Board · List buttons, is at least 44 px tall', (await exists('#needsProject')) && (await exists('[data-action=chase]')) && eq(await ny_small(), []), await ny_small());
  await click('[data-action=needs-more]'); await until(`document.querySelectorAll('#needsYou [data-s=need]').length === 7`);
  check('phone 390 px: with all 7 rows shown, still no sideways scroll and every control 44 px tall', (await ev('document.documentElement.scrollWidth')) <= 390 && eq(await ny_small(), []), [await ev('document.documentElement.scrollWidth'), await ny_small()]);
  await click('[data-action=projects-view][data-id=list]'); await until(`!!document.getElementById('projectsList')`);
  check('phone 390 px: the list does not scroll sideways and its rows are at least 44 px tall', (await ev('document.documentElement.scrollWidth')) <= 390 && (await ev(`[...document.querySelectorAll('#projectsList a')].every(a => a.getBoundingClientRect().height >= 44)`)), await ev('document.documentElement.scrollWidth'));
  await T.send('Emulation.clearDeviceMetricsOverride');
  await ev(`localStorage.removeItem('myday.projects.view')`);

  console.log('\n[47] Optional sections on a project\'s Overview');
  const sx_tk = (id, title, projectId, extra = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-10T09:00', postponed: 0, blockers: [], letGoOn: null, projectId, ...extra });
  const sx_rs = (id, title, url) => ({ id, title, url, addedOn: '2026-10-10' });
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  await seed([
    pjObj('pjSxSmall', 'Renew the passport', 'act'),
    pjObj('pjSxFull', 'Fit the new shelves', 'act', { resources: [sx_rs('rsSx1', 'Timber merchant', 'https://example.com/oak'), sx_rs('rsSx2', 'Bracket guide', 'https://example.com/brackets')],
      studyLinks: [{ kind: 'course', id: 'coSx1', title: 'Basic woodwork', addedOn: '2026-10-10' }], fileIds: ['flsx0000001'] }),
    pjObj('pjSxLinks', 'Plan the garden', 'act', { resources: [sx_rs('rsSx3', 'Seed supplier', 'https://example.com/seeds'), sx_rs('rsSx4', 'Compost guide', 'https://example.com/compost')] }),
  ]);
  await editStorage(`s => { s.tasks.items.push(${JSON.stringify(sx_tk('tkSx1', 'Book the photo booth', 'pjSxSmall'))}, ${JSON.stringify(sx_tk('tkSx2', 'Measure the wall', 'pjSxFull'))}, ${JSON.stringify(sx_tk('tkSx3', 'Dig the border', 'pjSxLinks'))});
    s.files.items.push({ id: 'flsx0000001', name: 'Shelf plan.pdf', type: 'application/pdf', size: 1024, sha256: '${'b'.repeat(64)}', area: 'project', state: 'kept', addedOn: '2026-10-10' });
    s.notes.items.push({ id: 'ntSx1', categoryId: '', title: 'Wall notes', text: 'Brick, not plasterboard.', pinned: false, createdAt: '2026-10-10T10:00', updatedAt: '2026-10-10T10:00', projectId: 'pjSxFull' }); }`);
  const sx_open = async (id, m) => { await go(`projects/p/${id}`, 2026, 10, 15, 9, m); await until(`!!document.getElementById('projectHead')`); };
  const sx_ids = ids => ev(`${JSON.stringify(ids)}.filter(i => !!document.getElementById(i))`);
  const sx_active = () => ev(`(document.activeElement.dataset.action || document.activeElement.id || document.activeElement.tagName)`);
  const sx_fold = () => ev(`[...document.querySelectorAll('#projectMore [data-action=section-open]')].map(b => b.dataset.id + ':' + b.textContent.trim())`);
  const sx_hidden = () => ev(`[...document.querySelectorAll('#projectMore [data-action=section-show]')].map(b => b.dataset.id + ':' + b.textContent.trim())`);
  const sx_sw = () => ev(`[...document.querySelectorAll('[data-s=sections-shown] [role=switch]')].map(b => b.dataset.action.slice(8) + ':' + b.getAttribute('aria-checked'))`);
  const OPTIONAL = ['projectNotes', 'projectRecent', 'projectLearning', 'projectResources', 'files-project'];
  const ALWAYS = ['projectNext', 'projectGlance', 'projectHead', 'projectTasks', 'projectSoon', 'projectManage'];

  console.log('  A small project');
  await sx_open('pjSxSmall', 1);
  let got47 = await sx_ids(OPTIONAL);
  check('a small project with one task shows no Notes, Learning, Resources or Files card (only Recently, which has its task being added)', eq(got47, ['projectRecent']), got47);
  check('…and has the four "Add to this project" buttons, in order: A note, Something to learn, A link, A file', (await text('#projectMore h3')) === 'Add to this project' && eq(await sx_fold(), ['notes:A note', 'learning:Something to learn', 'resources:A link', 'files:A file']), await sx_fold());
  check('…while the next step, At a glance, About it, Tasks, Coming up and Manage are all there', eq(await sx_ids(ALWAYS), ALWAYS), await sx_ids(ALWAYS));

  console.log('  Each "Add" button');
  await click('[data-action=section-open][data-id=resources]');
  check('"A link" shows the Resources card with its add form open', await until(`!!document.getElementById('projectResources') && !!document.getElementById('resourceUrl-new')`), await text('#app'));
  check('…and the Notes, Learning and Files cards are still folded', eq(await sx_ids(['projectNotes', 'projectLearning', 'files-project']), []) && !(await exists('[data-action=section-open][data-id=resources]')), await sx_fold());
  await sx_open('pjSxSmall', 2);
  await click('[data-action=section-open][data-id=learning]');
  check('"Something to learn" shows the Learning card with its kind choices', await until(`!!document.getElementById('projectLearning') && document.querySelectorAll('#projectLearning [data-s=learning-kind]').length > 1`), await text('#projectLearning'));
  await sx_open('pjSxSmall', 3);
  await click('[data-action=section-open][data-id=notes]');
  check('"A note" shows the Notes card with the keyboard on its "New note" button', await until(`!!document.getElementById('projectNotes') && document.activeElement === document.querySelector('[data-action=project-note-new]')`), [await sx_active(), await exists('#projectNotes')]);
  await sx_open('pjSxSmall', 4);
  await click('[data-action=section-open][data-id=files]');
  check('"A file" shows the Files card with the keyboard on "Add a file"', await until(`!!document.getElementById('files-project') && document.activeElement === document.querySelector('#files-project [data-action=file-add]')`) && (await text('#files-project [data-action=file-add]')) === 'Add a file', [await sx_active(), await exists('#files-project')]);
  await sx_open('pjSxSmall', 5);
  check('opening the project again, everything is folded as before (the choice lasts one visit)', eq(await sx_ids(['projectNotes', 'projectLearning', 'projectResources', 'files-project']), []) && (await sx_fold()).length === 4, await sx_fold());

  console.log('  A project with something in each');
  await sx_open('pjSxFull', 6);
  got47 = await sx_ids(OPTIONAL);
  check('with two links, a note, a file and a course, the Notes, Recently, Learning, Resources and Files cards all show', eq(got47, OPTIONAL), got47);
  check('…and nothing is folded, so there is no "Add to this project" card', !(await exists('#projectMore')), await text('#projectMore'));

  console.log('  Hiding and showing a card');
  await sx_open('pjSxLinks', 7);
  await click('[data-action=project-edit]');
  await until(`!!document.querySelector('[data-s=sections-shown]')`);
  check('About it → Edit has "Show on the Overview" with a switch each for Notes, Recently, Learning, Resources and Files, all on', (await text('[data-s=sections-shown] legend')) === 'Show on the Overview' && eq(await sx_sw(), ['notes:true', 'recently:true', 'learning:true', 'resources:true', 'files:true']), await sx_sw());
  check('a project with only links: Notes, Learning and Files are folded away by themselves', eq(await sx_ids(['projectNotes', 'projectLearning', 'files-project']), []) && (await sx_fold()).length === 3, await sx_fold());
  const sx_upd = (await pAt('pjSxLinks')).updatedAt;
  await click('[data-action=section-resources]');
  await until(`!!JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === 'pjSxLinks').hiddenSections`);
  check('switching Resources off saves hiddenSections: ["resources"] on the project', eq((await pAt('pjSxLinks')).hiddenSections, ['resources']), (await pAt('pjSxLinks')).hiddenSections);
  check('hiding it does not change the project\'s last-changed time', (await pAt('pjSxLinks')).updatedAt === sx_upd, [(await pAt('pjSxLinks')).updatedAt, sx_upd]);
  check('…says "Resources hidden on this project."', await until(`document.getElementById('toast').textContent.includes('Resources hidden on this project.')`), await toast());
  check('…and the Resources card is gone, with its switch off', !(await exists('#projectResources')) && eq(await sx_sw(), ['notes:true', 'recently:true', 'learning:true', 'resources:false', 'files:true']), await sx_sw());
  check('"Hidden here" names it: "Show Resources (2)"', (await text('#projectHiddenH')) === 'Hidden here' && eq(await sx_hidden(), ['resources:Show Resources (2)']), await sx_hidden());
  await click('[data-action=section-learning]');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === 'pjSxLinks').hiddenSections?.length === 2`);
  check('hiding the empty Learning card saves it too, and says "Learning hidden on this project."', eq((await pAt('pjSxLinks')).hiddenSections, ['resources', 'learning']) && (await until(`document.getElementById('toast').textContent.includes('Learning hidden on this project.')`)), [(await pAt('pjSxLinks')).hiddenSections, await toast()]);
  check('…but an empty hidden Learning is not named under "Hidden here" and not offered under "Add to this project"', eq(await sx_hidden(), ['resources:Show Resources (2)']) && eq(await sx_fold(), ['notes:A note', 'files:A file']), [await sx_hidden(), await sx_fold()]);
  await click('[data-action=section-show][data-id=resources]');
  await until(`!!document.getElementById('projectResources')`);
  check('pressing "Show Resources (2)" brings the card back', await exists('#projectResources') && (await sx_hidden()).length === 0 && (await sx_sw()).includes('resources:true'), [await sx_hidden(), await sx_sw()]);
  check('…and the keyboard moves to the Resources card itself', await until(`document.activeElement === document.getElementById('projectResources')`), await ev(`document.activeElement.id || document.activeElement.tagName`));
  check('…saves it without Resources in hiddenSections (Learning stays hidden), and says "Resources shown again."', eq((await pAt('pjSxLinks')).hiddenSections, ['learning']) && (await until(`document.getElementById('toast').textContent.includes('Resources shown again.')`)), [(await pAt('pjSxLinks')).hiddenSections, await toast()]);
  await click('[data-action=section-learning]');
  await until(`!JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === 'pjSxLinks').hiddenSections`);
  check('switching Learning on again removes the hiddenSections list altogether and says "Learning shown again."', !('hiddenSections' in (await pAt('pjSxLinks'))) && (await until(`document.getElementById('toast').textContent.includes('Learning shown again.')`)) && (await sx_fold()).includes('learning:Something to learn'), [await pAt('pjSxLinks'), await toast()]);

  await editStorage(`s => { const p = s.projects.items.find(x => x.id === 'pjSxLinks'); p.hiddenSections = ['files']; p.fileIds = ['flsx0000002', 'flsx0000003']; for (const id of p.fileIds) s.files.items.push({ id, name: id + '.pdf', type: 'application/pdf', size: 1024, sha256: '${'c'.repeat(64)}', area: 'project', state: 'kept', addedOn: '2026-10-10', deletedOn: '2026-10-14', removedFrom: { kind: 'project', id: 'pjSxLinks' } }); p.fileIds = []; }`);
  await sx_open('pjSxLinks', 11);
  check('a hidden Files card whose two files are all in Recently deleted is named "Show Files (2 recently deleted)"', eq(await sx_hidden(), ['files:Show Files (2 recently deleted)']), await sx_hidden());

  console.log('  A search result inside a hidden card');
  await editStorage(`s => { s.projects.items.find(p => p.id === 'pjSxLinks').hiddenSections = ['resources']; }`);
  await sx_open('pjSxLinks', 8);
  check('with Resources hidden, the card is not on the Overview', !(await exists('#projectResources')) && eq(await sx_hidden(), ['resources:Show Resources (2)']), await sx_hidden());
  await type('#projectSearch', 'Compost guide');
  await until(`!!document.querySelector('#projectSearchResults [data-s=search-hit][data-kind=resource]')`);
  await click('#projectSearchResults [data-s=search-hit][data-kind=resource] a');
  check('opening the link in the results shows the Resources card for this visit and puts the keyboard on that link\'s row', await until(`!!document.getElementById('projectResources') && document.activeElement && document.activeElement.dataset.id === 'rsSx4'`), [await exists('#projectResources'), await ev(`document.activeElement.dataset.id || document.activeElement.tagName`)]);
  check('…while the project still has Resources hidden in its saved data', eq((await pAt('pjSxLinks')).hiddenSections, ['resources']), (await pAt('pjSxLinks')).hiddenSections);

  console.log('  Switched off after opening it on this visit');
  await sx_open('pjSxSmall', 9);
  await click('[data-action=section-open][data-id=resources]'); await until(`!!document.getElementById('projectResources')`);
  await click('[data-action=project-edit]'); await until(`!!document.querySelector('[data-action=section-resources]')`);
  await click('[data-action=section-resources]');
  check('a card opened from "Add to this project" and then switched off leaves the page straight away (and is saved hidden)', await until(`!document.getElementById('projectResources')`) && eq((await pAt('pjSxSmall')).hiddenSections, ['resources']), [await exists('#projectResources'), (await pAt('pjSxSmall')).hiddenSections]);
  await click('[data-action=section-resources]'); await until(`!JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === 'pjSxSmall').hiddenSections`);

  console.log('  A phone');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await editStorage(`s => { s.projects.items.find(p => p.id === 'pjSxFull').hiddenSections = ['files']; }`);
  await sx_open('pjSxFull', 9); await sleep(300);
  const sx_small = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(b => b.getBoundingClientRect().height < 44).map(b => (b.dataset.action || b.id || b.tagName) + ':' + Math.round(b.getBoundingClientRect().height))`);
  check('phone 390 px: the Overview with "Hidden here" does not scroll sideways, and its button is at least 44 px tall', (await exists('#projectHiddenH')) && (await ev('document.documentElement.scrollWidth')) <= 390 && eq(await sx_small('#projectMore button'), []), [await ev('document.documentElement.scrollWidth'), await sx_small('#projectMore button')]);
  await sx_open('pjSxSmall', 10); await sleep(300);
  check('phone 390 px: the Overview with "Add to this project" does not scroll sideways, and its four buttons are at least 44 px tall', (await ev(`document.querySelectorAll('#projectMore button').length`)) === 4 && (await ev('document.documentElement.scrollWidth')) <= 390 && eq(await sx_small('#projectMore button'), []), [await ev('document.documentElement.scrollWidth'), await sx_small('#projectMore button')]);
  await click('[data-action=project-edit]');
  await until(`!!document.querySelector('[data-s=sections-shown]')`);
  check('phone 390 px: the edit view with the five switches does not scroll sideways, and each switch is at least 44 px tall', (await ev(`document.querySelectorAll('[data-s=sections-shown] [role=switch]').length`)) === 5 && (await ev('document.documentElement.scrollWidth')) <= 390 && eq(await sx_small('[data-s=sections-shown] [role=switch], [data-action=project-edit]'), []), [await ev('document.documentElement.scrollWidth'), await sx_small('[data-s=sections-shown] [role=switch], [data-action=project-edit]')]);
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[48] Deadlines you can trust');
  await go('projects', 2026, 10, 15, 11); await reset(); await go('projects', 2026, 10, 15, 11);
  const dk = (id, title, extra = {}) => ({ id, title, listId: '', category: 'Admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-10T09:00', postponed: 0, blockers: [], letGoOn: null, ...extra });
  const dlOf = async id => (await data()).tasks.items.find(t => t.id === id);
  const dlFmt = key => ev(`(() => { const [y, m, d] = ${JSON.stringify(key)}.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); })()`);
  const dlTask = async (id, min) => { await go('today/tasks/' + id, 2026, 10, 15, 11, min); await until(`!!document.querySelector('#app h2, #app h1')`); await sleep(200); };
  await seed([pjObj('pjDlG', 'Deadlines: move house', 'act'), caseObj('pjDlC', 'Deadlines: a tribunal claim', { timeline: [tlObj('tlDl1', '2026-09-01', 'The first thing')] })]);
  await editStorage(`s => { s.tasks.items.push(...${JSON.stringify([
    dk('tkDl1', 'Send the form to the council', { due: '2026-10-20', projectId: 'pjDlG' }),
    dk('tkDl2', 'Pay council tax', { due: '2026-10-20' }),
    dk('tkDl3', 'Think about the garden', { projectId: 'pjDlG' }),
    dk('tkDl4', 'Book the survey', { due: '2026-10-10', projectId: 'pjDlG', deadline: { kind: 'aim', from: '', checkedBy: '', checkedOn: null } }),
    dk('tkDl5', 'Send my witness statement', { due: '2026-10-15', projectId: 'pjDlC', deadline: { kind: 'firm', from: "The tribunal's letter", checkedBy: '', checkedOn: null } }),
    dk('tkDl6', 'File the claim form', { due: '2026-10-14', projectId: 'pjDlC', done: true, doneOn: '2026-10-14', deadline: { kind: 'firm', from: '', checkedBy: '', checkedOn: null } }),
    dk('tkDl7', 'Return the keys', { due: '2026-10-13', projectId: 'pjDlG', done: true, doneOn: '2026-10-13', deadline: { kind: 'firm', from: '', checkedBy: '', checkedOn: null } }),
  ])}); }`);

  console.log('  The Deadline card on a task\'s page');
  await dlTask('tkDl1', 1);
  check('a dated task in a project has a "Deadline" card with three choices, "Not a deadline" pressed', (await exists('#taskDeadline')) && (await text('#taskDeadline h3')) === 'Deadline'
    && eq(await ev(`[...document.querySelectorAll('#taskDeadline [data-action=deadline-kind]')].map(b => b.dataset.id + ':' + b.textContent.trim() + ':' + b.getAttribute('aria-pressed'))`), ['firm:Firm deadline:false', 'aim:Date to aim for:false', 'none:Not a deadline:true']), await text('#taskDeadline'));
  check('…and no from / checked-by fields until it is a deadline', !(await exists('#tDlFrom')) && !(await exists('#tDlBy')) && !(await exists('#tDlOn')));
  await click('[data-action=deadline-kind][data-id=firm]');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === 'tkDl1').deadline`);
  check('choosing "Firm deadline" saves a firm deadline on the task', (await dlOf('tkDl1')).deadline?.kind === 'firm', (await dlOf('tkDl1')).deadline);
  check('…says "Marked as a firm deadline."', await until(`document.getElementById('toast').textContent.includes('Marked as a firm deadline.')`), await toast());
  check('…presses "Firm deadline" and shows the three fields with their labels and the not-legal-advice note', await until(`!!document.getElementById('tDlFrom')`)
    && (await ev(`document.querySelector('[data-action=deadline-kind][data-id=firm]').getAttribute('aria-pressed')`)) === 'true'
    && (await text('label[for=tDlFrom]')).includes('Where does this date come from? (optional)') && (await text('label[for=tDlBy]')).includes('Checked by (optional)') && (await exists('#tDlOn'))
    && (await text('#taskDeadline')).includes("MyDay doesn't work out legal deadlines; it keeps the ones you enter."), await text('#taskDeadline'));
  check('…the day is "Checked on (optional)", and "Checked by" suggests "e.g. Me"', (await text('label[for=tDlOn]')).includes('Checked on (optional)') && (await ev(`document.getElementById('tDlBy').placeholder`)) === 'e.g. Me', await text('#taskDeadline'));
  await type('#tDlFrom', "The council's letter of 3 Oct");
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === 'tkDl1').deadline.from`);
  await type('#tDlBy', 'My adviser');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === 'tkDl1').deadline.checkedBy`);
  await type('#tDlOn', '2026-10-14');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === 'tkDl1').deadline.checkedOn`);
  let dl1 = (await dlOf('tkDl1')).deadline;
  check('where the date comes from, who checked it and the day are saved on the deadline', dl1.kind === 'firm' && dl1.from === "The council's letter of 3 Oct" && dl1.checkedBy === 'My adviser' && dl1.checkedOn === '2026-10-14', dl1);
  await click('[data-action=deadline-kind][data-id=aim]');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === 'tkDl1').deadline.kind === 'aim'`);
  dl1 = (await dlOf('tkDl1')).deadline;
  check('"Date to aim for" changes the kind and keeps the details', dl1.kind === 'aim' && dl1.from === "The council's letter of 3 Oct" && dl1.checkedBy === 'My adviser' && dl1.checkedOn === '2026-10-14', dl1);
  check('…and says "Marked as a date to aim for."', await until(`document.getElementById('toast').textContent.includes('Marked as a date to aim for.')`), await toast());
  await click('[data-action=deadline-kind][data-id=none]');
  await until(`!JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === 'tkDl1').deadline`);
  check('"Not a deadline" removes the deadline from the task altogether', !('deadline' in (await dlOf('tkDl1'))), await dlOf('tkDl1'));
  check('…says "Just a date now." and the fields go', await until(`document.getElementById('toast').textContent.includes('Just a date now.')`) && await until(`!document.getElementById('tDlFrom')`), await toast());
  await dlTask('tkDl2', 2);
  check('a task with no project has no Deadline card', !(await exists('#taskDeadline')) && (await ev(`document.getElementById('tTitle').value`)) === 'Pay council tax');
  await dlTask('tkDl3', 3);
  check('a task in a project but with no date has no Deadline card', !(await exists('#taskDeadline')) && (await ev(`document.getElementById('tTitle').value`)) === 'Think about the garden');

  console.log('  Rows on Tasks and Today');
  await editStorage(`s => { s.tasks.items.find(t => t.id === 'tkDl1').deadline = { kind: 'firm', from: '', checkedBy: '', checkedOn: null }; }`);
  await go('today/tasks', 2026, 10, 15, 11, 4);
  const rowDl = id => ev(`(document.querySelector('.task-li[data-id="${id}"] [data-s=task-deadline]') || {}).textContent || null`);
  await until(`!!document.querySelector('.task-li[data-id="tkDl1"]')`);
  check('on Tasks a firm deadline says "Firm deadline"', (await rowDl('tkDl1')) === 'Firm deadline', await rowDl('tkDl1'));
  const d10 = await dlFmt('2026-10-10');
  check('…and a date to aim for that has passed and is still to do says "Still open, was aimed for <date>"', (await rowDl('tkDl4')) === `Still open, was aimed for ${d10}`, [await rowDl('tkDl4'), d10]);
  check('…a task with only a date has no deadline words', (await rowDl('tkDl2')) === null && (await exists('.task-li[data-id="tkDl2"]')));
  await editStorage(`s => { s.tasks.items.find(t => t.id === 'tkDl4').deadline.kind = 'firm'; }`);
  await go('today/tasks', 2026, 10, 15, 11, 5); await until(`!!document.querySelector('.task-li[data-id="tkDl4"]')`);
  check('…a firm one that has passed says "Still open, was due <date>"', (await rowDl('tkDl4')) === `Still open, was due ${d10}`, await rowDl('tkDl4'));
  check('…without the date beside it again (one still ahead keeps its date)', !(await exists('.task-li[data-id="tkDl4"] [data-s=task-due]')) && (await exists('.task-li[data-id="tkDl1"] [data-s=task-due]')), await text('.task-li[data-id="tkDl4"]'));
  await editStorage(`s => { s.tasks.items.find(t => t.id === 'tkDl4').deadline.kind = 'aim'; }`);
  await go('today', 2026, 10, 15, 11, 6); await until(`!!document.querySelector('#dueToday')`);
  const dueDl = id => ev(`(document.querySelector('#dueToday .due-li[data-id="${id}"] [data-s=task-deadline]') || {}).textContent || null`);
  check('on Today, "Due today" shows a deadline due today as "Firm deadline"', (await dueDl('tkDl5')) === 'Firm deadline', [await dueDl('tkDl5'), await text('#dueToday')]);
  check('…and a past one still to do as "Still open, was aimed for <date>"', (await dueDl('tkDl4')) === `Still open, was aimed for ${d10}`, await dueDl('tkDl4'));
  check('…and a done deadline is not on Today or among the open rows', !(await exists('#dueToday .due-li[data-id="tkDl6"]')));

  console.log('  Coming up and the next step');
  await editStorage(`s => { s.projects.items.find(p => p.id === 'pjDlG').nextTaskId = 'tkDl1'; }`);
  await go('projects/p/pjDlG', 2026, 10, 15, 11, 7); await until(`!!document.querySelector('#projectSoon')`);
  const soonOf = sel => ev(`[...document.querySelectorAll('#projectSoon ${sel}')].map(li => li.textContent.replace(/\\s+/g, ' ').trim())`);
  check('Coming up adds " · Firm deadline" to a firm deadline\'s date', (await soonOf('[data-s=soon-task]')).some(t => t.includes('Send the form to the council') && t.includes(' · Firm deadline')), await soonOf('[data-s=soon-task]'));
  check('…a date to aim for that has passed is "Still open · was aimed for <date>"', (await soonOf('[data-s=soon-open]')).some(t => t.includes(`Still open · was aimed for ${d10}`) && t.includes('Book the survey')), await soonOf('[data-s=soon-open]'));
  check('the Next step card says "Firm deadline" when the next step is one', (await text('[data-s=next-deadline]')) === 'Firm deadline' && (await text('[data-s=next-title]')) === 'Send the form to the council', await text('#projectNext'));

  console.log('  A Case\'s "Add a deadline"');
  await go('projects/p/pjDlC', 2026, 10, 15, 11, 8); await until(`!!document.querySelector('[data-action=case-deadline]')`);
  await click('[data-action=case-deadline]'); await until(`!!document.getElementById('caseDlTitle')`);
  check('the form asks for the deadline, where its date comes from (optional) and the date, and waits for a title and a date', (await text('label[for=caseDlFrom]')).includes('Where does this date come from? (optional)') && (await exists('#caseDlDate')) && await ev(`document.querySelector('[data-action=case-deadline-add]').disabled`));
  await type('#caseDlTitle', 'Reply to the employer'); await type('#caseDlFrom', "The tribunal's letter of 3 Oct"); await type('#caseDlDate', '2026-10-21'); await click('[data-action=case-deadline-add]');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.title === 'Reply to the employer')`);
  const cdl = await task('Reply to the employer');
  check('adding it saves a dated task in the case with a firm deadline and where its date comes from', cdl && cdl.projectId === 'pjDlC' && cdl.due === '2026-10-21' && cdl.deadline?.kind === 'firm' && cdl.deadline.from === "The tribunal's letter of 3 Oct", cdl);
  check('…says "Firm deadline added — it reaches Today on its day."', await until(`document.getElementById('toast').textContent.includes('Firm deadline added — it reaches Today on its day.')`), await toast());
  check('…and it is in Coming up as a firm deadline', (await soonOf('[data-s=soon-task]')).some(t => t.includes('Reply to the employer') && t.includes(' · Firm deadline')), await soonOf('[data-s=soon-task]'));

  console.log('  Once a Case\'s deadline is done');
  await dlTask('tkDl6', 9);
  check('a done deadline of a Case offers "It\'s done — note it on the case\'s timeline?"', await until(`!!document.querySelector('[data-s=deadline-offer]')`) && (await text('[data-s=deadline-offer]')).includes("It's done — note it on the case's timeline?") && (await exists('[data-action=deadline-note]')), await text('#taskDeadline'));
  await go('projects/p/pjDlC', 2026, 10, 15, 11, 10); await until(`!!document.querySelector('#projectGlance')`);
  check('…and the case\'s "Worth a look" offered it before', await until(`!!document.querySelector('[data-pointer=deadline-done]')`) && (await text('[data-pointer=deadline-done]')).includes('File the claim form'), await text('#app'));
  const tl0 = (await caseOf('pjDlC')).timeline.length;
  await dlTask('tkDl6', 11);
  await until(`!!document.querySelector('[data-action=deadline-note]')`);
  await click('[data-action=deadline-note]');
  await until(`!!JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === 'tkDl6').deadline.noted`);
  const tl1 = (await caseOf('pjDlC')).timeline, ent = tl1.find(e => e.title === 'Done: File the claim form');
  check('"Note it on the timeline" adds one entry "Done: File the claim form", from me, on the day it was done', tl1.length === tl0 + 1 && ent && ent.date === '2026-10-14' && ent.source === 'mine', tl1);
  check('…remembers it on the deadline so it is not offered twice', (await dlOf('tkDl6')).deadline.noted === ent.id, (await dlOf('tkDl6')).deadline);
  check('…says "Noted on the timeline."; the offer goes and the card says it is noted', await until(`document.getElementById('toast').textContent.includes('Noted on the timeline.')`) && await until(`!document.querySelector('[data-s=deadline-offer]') && !!document.querySelector('[data-s=deadline-noted]')`), [await toast(), await text('#taskDeadline')]);
  check('…and the keyboard moves to that line (the button has gone)', await until(`document.activeElement?.id === 'deadlineNoted'`), await ev('document.activeElement?.id || document.activeElement?.tagName'));
  await go('projects/p/pjDlC', 2026, 10, 15, 11, 12); await until(`!!document.querySelector('#projectGlance')`);
  check('…and "Worth a look" no longer offers it', !(await exists('[data-pointer=deadline-done]')), await text('#projectGlance'));
  await dlTask('tkDl7', 13);
  check('a done deadline in a project that is not a Case never offers to note it', (await exists('#taskDeadline')) && !(await exists('[data-s=deadline-offer]')) && !(await exists('[data-action=deadline-note]')), await text('#taskDeadline'));
  await go('projects/p/pjDlG', 2026, 10, 15, 11, 14); await until(`!!document.querySelector('#projectGlance')`);
  check('…nor does its Overview', !(await exists('[data-pointer=deadline-done]')));

  console.log('  A phone');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await editStorage(`s => { s.tasks.items.find(t => t.id === 'tkDl1').deadline = { kind: 'firm', from: "The council's letter of 3 Oct, which is a rather long way of saying where this date came from", checkedBy: 'My adviser', checkedOn: '2026-10-14' }; }`);
  await dlTask('tkDl1', 15); await until(`!!document.getElementById('tDlFrom')`); await sleep(300);
  const dlSmall = ev(`[...document.querySelectorAll('#taskDeadline button, #taskDeadline input')].filter(b => b.getBoundingClientRect().height < 44).map(b => (b.dataset.action || b.id || b.tagName) + ':' + Math.round(b.getBoundingClientRect().height))`);
  check('phone 390 px: the task page with its Deadline card does not scroll sideways', (await ev('document.documentElement.scrollWidth')) <= 390 && (await ev(`document.getElementById('taskDeadline').getBoundingClientRect().right`)) <= 390, [await ev('document.documentElement.scrollWidth'), await ev(`document.getElementById('taskDeadline').getBoundingClientRect().right`)]);
  check('…and its three choices and three fields are at least 44 px tall', (await ev(`document.querySelectorAll('#taskDeadline [data-action=deadline-kind]').length`)) === 3 && (await ev(`document.querySelectorAll('#taskDeadline input').length`)) === 3 && eq(await dlSmall, []), await dlSmall);
  await T.send('Emulation.clearDeviceMetricsOverride');
  await editStorage(`s => { delete s.tasks.items.find(t => t.id === 'tkDl7').deadline; }`);
  await dlTask('tkDl7', 16);
  check('a done task with a date and no deadline isn\'t asked whether it\'s one', !(await exists('#taskDeadline')) && (await ev(`document.getElementById('tTitle').value`)) === 'Return the keys');

  console.log('\n[49] Experiments and money');
  const ex_as = (id, text) => ({ id, text, state: 'open', found: '', checkedOn: null, taskId: null, createdAt: '2026-10-10T09:00' });
  await go('projects', 2026, 10, 15, 9, 0); await reset(); await go('projects', 2026, 10, 15, 9, 0);
  await seed([
    pjObj('pjEx', 'Experiments: market delivery', 'explore', { template: 'business', model: { problem: 'x', who: 'y', how: 'z', assumptions: [ex_as('asE1', 'Shops would pay to be listed'), ex_as('asE2', 'Buyers will pay a delivery fee')] } }),
    pjObj('pjExG', 'Experiments: a plain project', 'explore'),
  ]);
  const ex_open = async (suffix, m) => { await go(`projects/p/pjEx${suffix}`, 2026, 10, 15, 9, m); await until(`!!document.querySelector('[data-s=project-tabs]')`); await sleep(150); };
  const ex_items = async () => (await data()).research.items;
  const ex_one = async () => (await ex_items()).find(i => i.type === 'experiment');
  const ex_row = '[data-s=experiment]';
  const ex_toast = async s => until(`document.getElementById('toast').textContent.includes(${JSON.stringify(s)})`);

  console.log('  Planning an experiment from a thing that must be true');
  await ex_open('/model', 1);
  check('the Model tab has an Experiments card, and each thing that must be true offers "Plan an experiment"', (await exists('#projectExperiments')) && (await exists(`${rowSel('asE1')} [data-action=as-plan-experiment]`)) && (await text(`${rowSel('asE1')} [data-action=as-plan-experiment]`)) === 'Plan an experiment', await text('#projectExperiments'));
  await click(`${rowSel('asE1')} [data-action=as-plan-experiment]`);
  await until(`!!document.querySelector('[data-s=experiment-form]')`);
  check('"Plan an experiment" under a thing opens the form with that thing already ticked (and the other not)', (await ev(`document.querySelector('[data-s=experiment-test][data-id=asE1]').checked`)) === true && (await ev(`document.querySelector('[data-s=experiment-test][data-id=asE2]').checked`)) === false);
  check('"Plan it" waits for a title', await ev(`document.querySelector('[data-action=experiment-save]').disabled`));
  await type('#exN-title', 'Ask 20 shops (made up)'); await type('#exN-how', 'Visit on two market days; same three questions each time'); await type('#exN-expect', 'Fewer than 5 say yes');
  await click('[data-action=experiment-save]');
  check('planning it says "Planned. Start it whenever you’re ready."', await ex_toast('Planned. Start it whenever you’re ready.'), await toast());
  await until(`!!document.querySelector('${ex_row}[data-status=planned]')`);
  let ex = await ex_one();
  check('…and saves a planned experiment in this project that tests the thing', ex && ex.projectId === 'pjEx' && ex.status === 'planned' && eq(ex.tests, [{ kind: 'assumption', id: 'asE1' }]) && ex.title === 'Ask 20 shops (made up)' && ex.expect === 'Fewer than 5 say yes', ex);
  check('…its row shows the title, and the thing it tests now says "1 experiment: 1 planned"', (await text(`${ex_row}[data-status=planned]`)).includes('Ask 20 shops (made up)') && (await text(`${rowSel('asE1')} [data-action=as-experiments]`)) === '1 experiment: 1 planned', await text(`${rowSel('asE1')} [data-s=as-experiments]`));
  check('…and the other thing has no experiments yet', !(await exists(`${rowSel('asE2')} [data-action=as-experiments]`)));
  // (The form, opened from one thing and then from another, follows the second.)
  await click(`${rowSel('asE1')} [data-action=as-plan-experiment]`); await until(`!!document.querySelector('[data-s=experiment-form] [data-s=experiment-test][data-id=asE1]:checked')`);
  await click(`${rowSel('asE2')} [data-action=as-plan-experiment]`);
  check('"Plan an experiment" under another thing while the form is open: the form now tests that one', await until(`!!document.querySelector('[data-s=experiment-test][data-id=asE2]:checked') && !document.querySelector('[data-s=experiment-test][data-id=asE1]:checked')`));
  await click('[data-action=experiment-cancel]'); await until(`!document.querySelector('[data-s=experiment-form]')`);

  console.log('  Start it, add its task, tick the task');
  await click('[data-action=experiment-start]');
  check('"Start it" says "Started."', await ex_toast('Started.'), await toast());
  await until(`!!document.querySelector('${ex_row}[data-status=running]')`);
  ex = await ex_one();
  check('…the row says "Running since" and the experiment is saved as running with its start day', (await text('[data-s=experiment-when]')).startsWith('Running since') && ex.status === 'running' && ex.startedOn === '2026-10-15', [await text('[data-s=experiment-when]'), ex]);
  await click('[data-action=experiment-task]');
  await until(`!!document.querySelector('[data-s=experiment-task]')`);
  ex = await ex_one();
  const exTask = await task('Test: Ask 20 shops (made up)');
  check('"Add a task to run it" adds a 30-minute task "Test: Ask 20 shops (made up)" in this project, linked from the experiment', exTask && exTask.projectId === 'pjEx' && exTask.minutes === 30 && ex.taskId === exTask.id, [exTask, ex]);
  check('…and the row says "Test task added"', (await text('[data-s=experiment-task]')).trim() === 'Test task added', await text('[data-s=experiment-task]'));
  check('…while it is not done, nothing asks what happened', !(await exists('[data-s=experiment-waiting]')));
  await editStorage(`s => { const t = s.tasks.items.find(x => x.title === 'Test: Ask 20 shops (made up)'); t.done = true; t.doneOn = '2026-10-15'; }`);
  await ex_open('/model', 3);
  check('with its task done, the row asks "Its Test task is done — what happened?"', await until(`!!document.querySelector('[data-s=experiment-waiting]')`) && (await text('[data-s=experiment-waiting]')).trim() === 'Its Test task is done — what happened?', await text(ex_row));
  check('…and the experiment is still running (ticking the task records nothing)', (await ex_one()).status === 'running' && (await text('[data-s=experiment-task]')).includes('Test task done'));
  await ex_open('', 4);
  check('the Overview\'s Worth a look points to it: "“Test: Ask 20 shops (made up)” is done — what happened?"', await until(`!!document.querySelector('#projectWorth [data-pointer=tested]')`) && (await text('#projectWorth [data-pointer=tested]')).includes('“Test: Ask 20 shops (made up)” is done — what happened?'), await text('#projectWorth'));

  console.log('  Record what happened, and save it as a finding');
  await ex_open('/model', 5);
  await click('[data-action=experiment-record]'); await until(`!!document.querySelector('[data-s=experiment-record-form]')`);
  check('"What happened?" is needed before the result can be saved', await ev(`document.querySelector('[data-action=experiment-record-save]').disabled`));
  await type(`#exR-${ex.id}`, '7 of 20 said yes; most wanted a month free'); await type(`#exC-${ex.id}`, 'Try a free month before charging');
  check('…and typing it lets you save', await until(`!document.querySelector('[data-action=experiment-record-save]').disabled`));
  await click('[data-action=experiment-record-save]');
  check('recording says "Recorded — it’s done."', await ex_toast('Recorded — it’s done.'), await toast());
  await until(`!!document.querySelector('[data-s=experiment-offer]')`);
  ex = await ex_one();
  check('…the experiment is done today with its result and conclusion, shown on the row', ex.status === 'done' && ex.doneOn === '2026-10-15' && ex.result === '7 of 20 said yes; most wanted a month free' && ex.conclusion === 'Try a free month before charging' && (await text('[data-s=experiment-result]')).includes('7 of 20 said yes; most wanted a month free'), ex);
  check('…and offers "Save it as a finding?" with a choice of how it bears on the thing tested', (await text('[data-s=experiment-offer]')).includes('Save it as a finding?') && (await exists('[data-s=experiment-stance][data-id=asE1]')) && !(await exists('[data-s=experiment-waiting]')));
  check('Research is off before the finding is saved', !(await exists('[data-tab=research]')) && !((await pAt('pjEx')).tools || []).includes('research'));
  await type('[data-s=experiment-stance][data-id=asE1]', 'contradicts');
  await click('[data-action=experiment-finding]');
  check('saving it says "Saved as a finding — Research is on now, with its own tab."', await ex_toast('Saved as a finding — Research is on now, with its own tab.'), await toast());
  await until(`!!document.querySelector('[data-s=experiment-finding]')`);
  ex = await ex_one();
  const exFinds = (await ex_items()).filter(i => i.type === 'finding');
  const exFind = exFinds.find(f => f.experimentId === ex.id);
  check('…a finding is saved from this experiment: its result, about the thing, saying it contradicts it', exFind && exFind.text === ex.result && eq(exFind.about, [{ kind: 'assumption', id: 'asE1', stance: 'contradicts' }]) && ex.findingId === exFind.id, [exFinds, ex]);
  check('…Research is switched on for the project', ((await pAt('pjEx')).tools || []).includes('research') && (await exists('[data-s=project-tabs] [data-tab=research]')), (await pAt('pjEx')).tools);
  check('…the offer is replaced by "Saved as a finding — see Research"', !(await exists('[data-s=experiment-offer]')) && (await text('[data-s=experiment-finding]')).trim() === 'Saved as a finding — see Research');
  check('…and the thing it tested is still open (a result never marks it by itself)', (await pAt('pjEx')).model.assumptions.find(a => a.id === 'asE1').state === 'open');
  await ex_open('/research', 6);
  check('the Research tab shows the finding "From the experiment “Ask 20 shops (made up)”"', await until(`!!document.querySelector('[data-s=research-finding]')`) && (await text('[data-s=research-finding]')).includes('From the experiment “Ask 20 shops (made up)”'), await text('[data-s=research-finding]'));
  check('…and the same Experiments card is there too, with this experiment', (await exists('#projectExperiments')) && (await text('#projectExperiments')).includes('Ask 20 shops (made up)'));

  console.log('  Removing one');
  await ex_open('/model', 7);
  await click('[data-action=experiment-edit]'); await until(`!!document.querySelector('[data-action=experiment-remove]')`);
  check('editing an experiment offers "Remove"', await exists('[data-action=experiment-remove]'));
  await click('[data-action=experiment-remove]'); await answer(true);
  check('removing it (after asking) says so and takes it off the card', await ex_toast('Experiment removed.') && await until(`!document.querySelector('${ex_row}')`), await toast());
  check('…its Test task and the finding saved from it stay', !!(await task('Test: Ask 20 shops (made up)')) && (await ex_items()).some(i => i.type === 'finding' && i.id === exFind.id) && !(await ex_items()).some(i => i.type === 'experiment'));

  console.log('  Money: the tab, the lines and the break-even');
  await ex_open('', 8);
  check('a business idea has a Money tab', await exists('[data-s=project-tabs] [data-tab=money]'));
  await go('projects/p/pjExG', 2026, 10, 15, 9, 9); await until(`!!document.querySelector('[data-s=project-tabs]')`);
  check('…and a general project does not', !(await exists('[data-tab=money]')));
  await ex_open('/money', 10); await until(`!!document.getElementById('moneyCurrency')`);
  const mn = async () => ((await pAt('pjEx')).model || {}).money || {};
  await type('#moneyCurrency', 'usd'); await until(`true`); await sleep(250);
  await type('#moneySale', 'order'); await sleep(250);
  await type('#moneySaleValue', '30'); await sleep(250);
  check('the currency is saved in capitals, and what one sale is called and its average value too', (await mn()).currency === 'USD' && (await mn()).sale === 'order' && (await mn()).saleValue === 30, await mn());
  const mn_add = async (list, label, dir, amount, per) => {
    await click(`[data-action=money-line-add][data-list=${list}]`); await until(`!!document.getElementById('mlN-${list}-label')`);
    await type(`#mlN-${list}-label`, label); await click(`[data-action=money-dir][data-id=${dir}]`); await type(`#mlN-${list}-amount`, String(amount));
    if (per) await type(`#mlN-${list}-per`, per);
    await click('[data-action=money-line-save]'); await until(`!document.getElementById('mlN-${list}-label')`);
  };
  await mn_add('perSale', 'Commission', 'in', 8, 'percent');
  await mn_add('perSale', 'Delivery fee', 'in', 1.5);
  await mn_add('perSale', 'Rider', 'out', 1.8);
  await mn_add('monthly', 'Office', 'out', 900);
  await mn_add('startup', 'Motorbike', 'out', 3000);
  const mnTotal = list => text(`[data-s=money-lines][data-list=${list}] [data-s=money-total]`);
  const mnRider = ((await mn()).perSale || []).find(l => l.label === 'Rider');
  check('five lines are saved: three for each order, one monthly and one to start', ((await mn()).perSale || []).length === 3 && ((await mn()).monthly || []).length === 1 && ((await mn()).startup || []).length === 1 && mnRider && mnRider.dir === 'out' && mnRider.amount === 1.8, await mn());
  check('each order\'s total reads "Each order brings in USD 3.90 and costs USD 1.80 — leaves USD 2.10."', await until(`document.querySelector('[data-s=money-lines][data-list=perSale] [data-s=money-total]')?.textContent === 'Each order brings in USD 3.90 and costs USD 1.80 — leaves USD 2.10.'`), await mnTotal('perSale'));
  check('the break-even reads "429 orders a month" (900 ÷ 2.10, rounded up)', await until(`document.querySelector('[data-s=break-even]')?.textContent === '429 orders a month'`), await text('[data-s=break-even]'));
  await ex_open('', 11);
  check('At a glance on the Overview says "Break-even: 429 orders a month"', await until(`document.querySelector('[data-s=money-summary]')?.textContent.trim() === 'Break-even: 429 orders a month'`), await text('[data-s=money-summary]'));

  console.log('  Money: payback, forecast and real months');
  await ex_open('/money', 12); await until(`!!document.getElementById('moneyAtSales')`);
  check('with no level entered, payback asks for one (none is assumed)', (await ev(`document.getElementById('moneyAtSales').value`)) === '' && (await text('[data-s=payback]')).startsWith('How many orders a month do you expect?'), await text('[data-s=payback]'));
  await type('#moneyAtSales', '600');
  check('at 600 orders a month the start-up costs are back in about 9 months', await until(`document.querySelector('[data-s=payback]')?.textContent === 'Start-up costs (USD 3,000) back in about 9 months.'`), await text('[data-s=payback]'));
  await type('#moneyFrom', '2027-01');
  await until(`!!document.getElementById('moneyFillStart')`);
  await type('#moneyFillStart', '100'); await type('#moneyFillStep', '20'); await type('[aria-label="Add as"]', 'percent');
  await click('[data-action=money-fill]');
  check('filling from 100 orders, adding 20% a month, gives twelve months', await until(`document.querySelectorAll('[data-s=forecast-month]').length === 12`), await ev(`document.querySelectorAll('[data-s=forecast-month]').length`));
  const fcSales = i => ev(`document.querySelectorAll('[data-s=forecast-month]')[${i}].querySelector('[data-s=forecast-sales]').value`);
  check('…starting at 2027-01 with 100 orders, then 120', (await ev(`document.querySelector('[data-s=forecast-month]').dataset.month`)) === '2027-01' && (await fcSales(0)) === '100' && (await fcSales(1)) === '120', [await fcSales(0), await fcSales(1)]);
  const fcNums = await ev(`(document.querySelector('[data-s=forecast-month][data-month="2027-01"] [data-s=forecast-sums]').textContent.match(/[−-]?\\d[\\d,.]*/g) || [])`);
  check('…the first month has USD 390 in, 1,080 out (100 × 1.80 + 900) and a running total of −3,690', eq(fcNums, ['390', '1,080', '−3,690']), fcNums);
  check('…and the forecast\'s summary gives its lowest point and the first month that pays for itself', (await text('[data-s=forecast-summary]')).includes('Lowest point:') && (await text('[data-s=forecast-summary]')).includes('First month that pays for itself:'), await text('[data-s=forecast-summary]'));
  await type('#moneyRealMonth', '2027-01'); await click('[data-action=real-add]');
  await until(`!!document.getElementById('real-2027-01-sales')`);
  await type('#real-2027-01-sales', '85');
  await until(`document.querySelector('[data-s=forecast-month][data-month="2027-01"] [data-s=forecast-real]')?.textContent.startsWith('Real: 85 orders')`);
  const mnAct = ((await mn()).actual || []).find(a => a.month === '2027-01');
  check('a real month is saved with its 85 orders', mnAct && mnAct.sales === 85, (await mn()).actual);
  check('…it sits beside its plan: "Plan: 100 orders · in USD 390 · out USD 1,080"', (await text('[data-s=real-plan]')) === 'Plan: 100 orders · in USD 390 · out USD 1,080', await text('[data-s=real-plan]'));
  check('…the forecast row for that month says "Real: 85 orders"', (await text('[data-s=forecast-month][data-month="2027-01"] [data-s=forecast-real]')).startsWith('Real: 85 orders'));
  check('…and the plan is unchanged (still 100 orders in the forecast)', (await fcSales(0)) === '100' && ((await mn()).forecast.sales || [])[0] === 100, (await mn()).forecast);

  console.log('  Searching a project finds experiments and money');
  await ex_open('', 13);
  await editStorage(`s => { s.research.items.push({ id: 'exSrch1', type: 'experiment', projectId: 'pjEx', title: 'Ask 20 shops (made up)', tests: [], how: '', expect: '', status: 'planned', startedOn: null, doneOn: null, result: '', conclusion: '', taskId: null, createdAt: '2026-10-15T09:00', updatedAt: '2026-10-15T09:00' }); }`);
  await ex_open('', 14);
  await srType('Ask 20 shops');
  check('Search this project finds the experiment, labelled "Experiment"', (await srRows()).some(r => r.startsWith('experiment:') && r.includes('Ask 20 shops (made up)')) && (await text('#projectSearchResults')).includes('Experiment'), await srRows());
  await srType('Motorbike');
  check('…and a money line, labelled "Money"', (await srRows()).some(r => r.startsWith('money:') && r.includes('Motorbike')) && (await text('#projectSearchResults')).includes('Money'), await srRows());
  await editStorage(`s => { s.research.items = s.research.items.filter(i => i.id !== 'exSrch1'); }`);

  console.log('  Money: changing and removing a line');
  await ex_open('/money', 15); await until(`!!document.getElementById('moneyCurrency')`);
  await click(`[data-s=money-line][data-id="${mnRider.id}"] [data-action=money-line-edit]`);
  await until(`!!document.getElementById('mlE-${mnRider.id}-amount')`);
  await type(`#mlE-${mnRider.id}-amount`, '2'); await click('[data-action=money-line-save]');
  check('changing the Rider to 2 updates the total to "… costs USD 2.00 — leaves USD 1.90." (a sale\'s amounts always with cents)', await until(`document.querySelector('[data-s=money-lines][data-list=perSale] [data-s=money-total]')?.textContent === 'Each order brings in USD 3.90 and costs USD 2.00 — leaves USD 1.90.'`), await mnTotal('perSale'));
  const mnOffice = ((await mn()).monthly || [])[0];
  await click(`[data-s=money-line][data-id="${mnOffice.id}"] [data-action=money-line-edit]`);
  await until(`!!document.querySelector('[data-action=money-line-remove]')`);
  await click('[data-action=money-line-remove]'); await answer(true);
  check('removing the Office line (after asking) takes it away', await until(`!document.querySelector('[data-s=money-line][data-id="${mnOffice.id}"]')`) && ((await mn()).monthly || []).length === 0, await mn());

  console.log('  Money on a phone');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await ex_open('/money', 16); await until(`!!document.querySelector('[data-s=money] [data-s=forecast-month]')`); await sleep(300);
  const mnSmall = ev(`[...document.querySelectorAll('[data-s=money] button, [data-s=money] input')].filter(b => b.getBoundingClientRect().height < 44).map(b => (b.dataset.action || b.id || b.tagName) + ':' + Math.round(b.getBoundingClientRect().height))`);
  check('phone 390 px: the Money tab does not scroll sideways', (await ev('document.documentElement.scrollWidth')) <= 390, await ev('document.documentElement.scrollWidth'));
  check('…and every button and field on it is at least 44 px tall', (await ev(`document.querySelectorAll('[data-s=money] button, [data-s=money] input').length`)) > 20 && eq(await mnSmall, []), await mnSmall);
  // With Research on (switched on by the finding), a business idea has six tabs; at 320 px they wrap, each fitting.
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await ex_open('/money', 17); await sleep(300);
  const six = await ev(`[...document.querySelectorAll('[data-s=project-tabs] a')].map(a => ({ t: a.dataset.tab, sw: a.scrollWidth, cw: a.clientWidth, h: a.getBoundingClientRect().height }))`);
  check('phone 320 px: the six tabs (Research on) each fit, at least 44 px tall, and the page doesn\'t scroll sideways', six.map(x => x.t).join() === 'overview,model,money,milestones,decisions,research' && six.every(x => x.sw <= x.cw && x.h >= 44)
    && (await ev('document.documentElement.scrollWidth')) <= 320, six);
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[50] Welcome back after a break');
  const wbTk = (id, title, projectId, extra = {}) => ({ id, title, listId: '', category: 'Admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-20T09:00', postponed: 0, blockers: [], letGoOn: null, projectId, ...extra });
  const wbDay = (y, m, d, mi) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const wbShort = k => ev(`new Date('${k}T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })`);
  const wbOpen = async (id, d, mi = 0) => { await go(`projects/p/${id}`, 2026, 11, d, 9, mi); await until(`!!document.getElementById('projectTitle')`); await sleep(200); };
  const wbLinks = sel => ev(`[...document.querySelectorAll('${sel} a')].map(a => a.textContent.trim() + '|' + a.getAttribute('href'))`);
  await go('projects', 2026, 11, 20, 9, 0); await reset(); await go('projects', 2026, 11, 20, 9, 0);
  await seed([
    pjObj('pjWb', 'Garden shed (welcome)', 'act', { createdAt: '2026-10-01T09:00', updatedAt: '2026-10-30T17:00', nextTaskId: 'tkWb4', leftOff: { text: 'Boards ordered; next: measure the door.', at: '2026-10-30T17:00' } }),
    pjObj('pjWb2', 'Fence repair (welcome, not away)', 'act', { createdAt: '2026-10-01T09:00', updatedAt: '2026-11-19T09:00' }),
    pjObj('pjWbN', 'Loft clear-out (welcome, no note)', 'act', { createdAt: '2026-10-01T09:00', updatedAt: '2026-10-10T09:00' }),
    pjObj('pjWbD', 'Old shelf (welcome, finished)', 'act', { status: 'done', createdAt: '2026-10-01T09:00', updatedAt: '2026-10-21T09:00' }),
  ]);
  await editStorage(`s => { s.tasks.items.push(...${JSON.stringify([
    wbTk('tkWb1', 'Order the boards', 'pjWb', { done: true, doneOn: '2026-11-02' }),
    wbTk('tkWb2', 'Book the skip', 'pjWb', { due: '2026-11-15' }),
    wbTk('tkWb3', 'Collect the window', 'pjWb', { due: '2026-11-23' }),
    wbTk('tkWb4', 'Measure the door', 'pjWb'),
  ])}); s.days['2026-11-20'] = { energy: 3, rest: false, builtAt: '2026-11-20T08:00', checkedIn: false, tasks: [] }; }`);

  console.log('  The card, first on the Overview');
  await wbOpen('pjWb', 20, 1);
  const wbCards = await ev(`[...document.querySelectorAll('#app [id^=project]')].map(e => e.id).filter(i => ['projectWelcome', 'projectNext', 'projectLeftOff'].includes(i))`);
  check('a project away 18 days opens with "Welcome back" as the first card on the Overview, before the next step', await exists('#projectWelcome[data-s=welcome-back]') && eq(wbCards, ['projectWelcome', 'projectNext']), wbCards);
  const d02 = await wbShort('2026-11-02'), d15 = await wbShort('2026-11-15'), d23 = await wbShort('2026-11-23');
  check('…it says "Away 2 weeks — last worked on" the day of the last work', (await text('[data-s=welcome-away]')).trim() === `Away 2 weeks — last worked on ${d02}`, await text('[data-s=welcome-away]'));
  check('…"What you did last" lists "Done: Order the boards" first', (await text('[data-s=welcome-did] li')).includes('Done: Order the boards'), await text('[data-s=welcome-did]'));
  const wbMeanwhile = await wbLinks('[data-s=welcome-meanwhile]');
  check('…"While you were away" links the date that came and went, still open, to that task', wbMeanwhile.includes(`“Book the skip” — was due ${d15}, still open|#today/tasks/tkWb2`), wbMeanwhile);
  check('…and the date coming up in the week ahead', wbMeanwhile.some(l => l.startsWith(`“Collect the window” — on ${d23}|`)), wbMeanwhile);
  check('…"Where you left off" shows the note', (await text('[data-s=welcome-leftoff]')).includes('Boards ordered; next: measure the door.'), await text('[data-s=welcome-leftoff]'));
  check('…its section is headed "Where I left off"', (await ev(`[...document.querySelectorAll('#projectWelcome h4')].map(h => h.textContent.trim())`)).includes('Where I left off'), await ev(`[...document.querySelectorAll('#projectWelcome h4')].map(h => h.textContent.trim())`));
  check('…the separate "Where I left off" card is not shown while the welcome card is', !(await exists('#projectLeftOff')));
  check('…the next step is shown with "Add to today"', (await text('[data-s=welcome-next]')).trim() === 'Measure the door' && (await text('[data-action=welcome-today]')).trim() === 'Add to today', await text('#projectWelcome'));

  console.log('  Add to today, then "Got it"');
  await click('[data-action=welcome-today]');
  check('"Add to today" says "Added to today\'s plan." and the button becomes "On today’s plan"', await until(`document.getElementById('toast').textContent.includes("Added to today's plan.")`) && await until(`!document.querySelector('[data-action=welcome-today]') && document.getElementById('projectWelcome').textContent.includes('On today’s plan')`), [await toast(), await text('#projectWelcome')]);
  check('…and the task is on today\'s plan', (await task('Measure the door')).plannedOn === '2026-11-20', await task('Measure the door'));
  await click('[data-action=welcome-got-it]');
  check('"Got it" puts the card away and shows "Where I left off" instead', await until(`!document.getElementById('projectWelcome') && !!document.getElementById('projectLeftOff')`));
  check('…and moves the keyboard focus to the project\'s title', await until(`document.activeElement && document.activeElement.id === 'projectTitle'`), await ev(`document.activeElement && document.activeElement.id`));
  const wbSaved = await ev(`localStorage.getItem('myday.projects.welcomed')`);
  check('…this device remembers it, with the project\'s last-activity stamp', eq(JSON.parse(wbSaved), { pjWb: '2026-11-02T23:59' }), wbSaved);
  await wbOpen('pjWb', 20, 5);
  check('reloading the same day: the card stays away', !(await exists('#projectWelcome')) && (await exists('#projectLeftOff')));

  console.log('  A new break greets again; a short one does not');
  await editStorage(`s => { s.tasks.items.find(t => t.id === 'tkWb1').doneOn = '2026-11-10'; }`);
  await wbOpen('pjWb', 20, 10);
  check('after more work, a new break greets again: "Away 10 days"', (await exists('#projectWelcome')) && (await text('[data-s=welcome-away]')).trim().startsWith('Away 10 days — '), await text('[data-s=welcome-away]'));
  await wbOpen('pjWb', 16, 0);
  check('a project 6 days away has no welcome card', !(await exists('#projectWelcome')) && (await exists('#projectLeftOff')));

  console.log('  No note, and a finished project');
  await wbOpen('pjWbN', 20, 15);
  check('away with no note: the card offers "No note from last time. Leave yourself one for next time?"', (await text('[data-action=welcome-note]')).trim() === 'No note from last time. Leave yourself one for next time?', await text('#projectWelcome'));
  await click('[data-action=welcome-note]');
  await until(`!!document.querySelector('#projectWelcome #welcomeLeftOffText')`);
  await click('#projectWelcome [data-action=leftoff-cancel]');
  check('cancelling the editor in the card puts the keyboard focus back on the "No note" button', await until(`document.activeElement && document.activeElement.id === 'welcomeNote'`), await ev(`document.activeElement && document.activeElement.id`));
  await click('[data-action=welcome-note]');
  check('…which opens the note editor inside the card', await until(`!!document.querySelector('#projectWelcome #welcomeLeftOffText')`));
  await type('#welcomeLeftOffText', 'Boxes sorted; next: the attic ladder.'); await click('#projectWelcome [data-action=leftoff-save]');
  await until(`!!document.querySelector('[data-s=welcome-leftoff]')`);
  const wbN = await project('Loft clear-out (welcome, no note)');
  check('saving a note there saves it on the project', wbN.leftOff && wbN.leftOff.text === 'Boxes sorted; next: the attic ladder.', wbN);
  check('…the card stays for the rest of the visit, now showing the note, with the keyboard focus on it', (await exists('#projectWelcome')) && (await text('[data-s=welcome-leftoff]')).includes('Boxes sorted; next: the attic ladder.') && await until(`document.activeElement && document.activeElement.id === 'welcomeLeftOff'`), await ev(`document.activeElement && document.activeElement.id`));
  await wbOpen('pjWbN', 20, 16);
  check('opening it again later: saving was work on it, so there is no card, and "Where I left off" shows the note', !(await exists('#projectWelcome')) && (await text('#projectLeftOff')).includes('Boxes sorted; next: the attic ladder.'));
  await wbOpen('pjWbD', 20, 20);
  check('a finished project away 30 days has no welcome card', !(await exists('#projectWelcome')));

  console.log('  Projects home');
  await editStorage(`s => { s.tasks.items.find(t => t.id === 'tkWb1').doneOn = '2026-11-02'; }`);
  await go('projects', 2026, 11, 20, 9, 25); await until(`!!document.querySelector('.project-card')`);
  if (!(await exists('#projectList'))) { await click('[data-action=projects-view][data-id=board]'); await until(`!!document.getElementById('projectList')`); }
  check('the board card of a project away 18 days says "Away 2 weeks"', (await text('.project-card[data-id=pjWb] [data-s=project-away]')).trim() === 'Away 2 weeks', await text('.project-card[data-id=pjWb]'));
  check('…a project worked on yesterday shows a date, not "Away"', !(await exists('.project-card[data-id=pjWb2] [data-s=project-away]')) && !(await text('.project-card[data-id=pjWb2]')).includes('Away'), await text('.project-card[data-id=pjWb2]'));
  await click('[data-action=projects-view][data-id=list]'); await until(`!!document.getElementById('projectsList')`);
  check('in the List view the row says "Away 2 weeks"', (await text('[data-s=project-row][data-id=pjWb]')).includes('Away 2 weeks'), await text('[data-s=project-row][data-id=pjWb]'));
  await click('[data-action=projects-view][data-id=board]'); await until(`!!document.getElementById('projectList')`);

  console.log('  The card on a phone');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await ev(`localStorage.removeItem('myday.projects.welcomed')`); // (the earlier "Got it" was for this same stamp)
  await wbOpen('pjWb', 20, 30); await until(`!!document.getElementById('projectWelcome')`); await sleep(300);
  const wbSmall = await ev(`[...document.querySelectorAll('#projectWelcome a, #projectWelcome button')].filter(b => b.getBoundingClientRect().height < 44).map(b => (b.dataset.action || b.textContent.trim().slice(0, 20)) + ':' + Math.round(b.getBoundingClientRect().height))`);
  check('phone 320 px: the welcome card does not scroll the page sideways', (await ev('document.documentElement.scrollWidth')) <= 320, await ev('document.documentElement.scrollWidth'));
  check('…and every link and button in it is at least 44 px tall', (await ev(`document.querySelectorAll('#projectWelcome a, #projectWelcome button').length`)) >= 5 && eq(wbSmall, []), wbSmall);
  await T.send('Emulation.clearDeviceMetricsOverride');
  // A next step waiting on someone, its expected day past: as the Next step card has it — its waiting words and Chase it,
  // no Add to today.
  await editStorage(`s => { const t = s.tasks.items.find(x => x.id === 'tkWb1'); s.tasks.items.push({ ...t, id: 'tkWbW', title: 'Fit the door (welcome)', done: false, doneOn: null, createdAt: '2026-10-20T09:00', waiting: { on: 'the joiner', since: '2026-11-01', until: '2026-11-18' } });
    s.projects.items.find(p => p.id === 'pjWb').nextTaskId = 'tkWbW'; }`);
  await ev(`localStorage.removeItem('myday.projects.welcomed')`);
  await wbOpen('pjWb', 20, 35); await until(`!!document.getElementById('projectWelcome')`);
  check('a next step waiting on someone: its waiting words and Chase it, no Add to today', (await text('[data-s=welcome-next]')) === 'Fit the door (welcome)' && (await text('#projectWelcome')).includes('the joiner')
    && (await exists('#projectWelcome [data-action=chase]')) && !(await exists('#projectWelcome [data-action=welcome-today]')), await text('#projectWelcome'));

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
