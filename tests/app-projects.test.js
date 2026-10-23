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
  check('how it\'s going: plain counts, never a percentage', (await text('[data-s=project-counts]')) === '1 done · 1 to go' && !/%/.test(await text('#projectProgress')));

  console.log('\n[5] Its notes');
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

  console.log('\n[16] The two cards on the Overview');
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
  check('an empty project\'s Milestones card invites you to add the first one', (await text('#projectMilestonesCard [data-s=ms-summary]')) === 'Milestones are the big markers on the way — add the first one', await text('#projectMilestonesCard'));
  check('…and its Decisions card asks "Is there a choice to make?"', (await text('#projectDecisionsCard [data-s=dc-summary]')) === 'Is there a choice to make? Add a decision', await text('#projectDecisionsCard'));
  check('…each card links to its tab', (await ev(`document.querySelector('#projectMilestonesCard a').getAttribute('href')`)) === '#projects/p/pjCe/milestones' && (await ev(`document.querySelector('#projectDecisionsCard a').getAttribute('href')`)) === '#projects/p/pjCe/decisions');
  await click('#projectMilestonesCard a'); await sleep(250);
  check('…tapping the Milestones card opens the Milestones tab', (await hash()) === '#projects/p/pjCe/milestones' && (await tabOf()) === 'milestones', await hash());
  await go('projects/p/pjCe', 2026, 10, 15, 16, 11);
  await click('#projectDecisionsCard a'); await sleep(250);
  check('…and the Decisions card opens the Decisions tab', (await hash()) === '#projects/p/pjCe/decisions' && (await tabOf()) === 'decisions', await hash());
  await go('projects/p/pjCp', 2026, 10, 15, 16, 12);
  const msSum = await text('#projectMilestonesCard [data-s=ms-summary]');
  check('in progress: "1 of 3 milestones reached · Next: <the first not reached>", with its passed date said gently', /^1 of 3 milestones reached · Next: Book the builder \(aimed for .*1 Oct\)$/.test(msSum), msSum);
  check('…open decisions are listed (three, then "and 2 more"), each linking to the Decisions tab, in place of the summary', (await ev(`document.querySelectorAll('#projectDecisionsCard [data-s=dc-open] li a').length`)) === 3
    && (await text('#projectDecisionsCard [data-s=dc-open]')).includes('and 2 more') && (await ev(`document.querySelector('#projectDecisionsCard [data-s=dc-open] a').getAttribute('href')`)) === '#projects/p/pjCp/decisions' && !(await exists('#projectDecisionsCard [data-s=dc-summary]')), await text('#projectDecisionsCard'));
  check('…the newest open question comes first', (await ev(`document.querySelector('#projectDecisionsCard [data-s=dc-open] li a').textContent`)) === 'Which path?');
  check('…nothing on the Overview says late, overdue or behind', await noBlame(), await text('#app'));
  await go('projects/p/pjCa', 2026, 10, 15, 16, 13);
  check('a date still to come reads "Next: … (aiming for …)"', /^0 of 1 milestones reached · Next: Choose a site \(aiming for .*5 Nov\)$/.test(await text('#projectMilestonesCard [data-s=ms-summary]')), await text('#projectMilestonesCard [data-s=ms-summary]'));
  await go('projects/p/pjCf', 2026, 10, 15, 16, 14);
  check('all reached: "All 2 milestones reached."', (await text('#projectMilestonesCard [data-s=ms-summary]')) === 'All 2 milestones reached.', await text('#projectMilestonesCard [data-s=ms-summary]'));
  check('…and a decided decision: "Decided <date>: <option>"', /^Decided .*14 Oct: Small$/.test(await text('#projectDecisionsCard [data-s=dc-summary]')) && !(await exists('#projectDecisionsCard [data-s=dc-open]')), await text('#projectDecisionsCard'));
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
  check('the Overview card follows: "1 of 2 milestones reached · Next: Book the hall"', (await text('#projectMilestonesCard [data-s=ms-summary]')).startsWith('1 of 2 milestones reached · Next: Book the hall'), await text('#projectMilestonesCard [data-s=ms-summary]'));
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
  check('…the tabs are Overview, Model, Milestones, Decisions', eq(await tabsOf(), ['overview', 'model', 'milestones', 'decisions']), await tabsOf());
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
  check('…and so does the Overview', (await text('[data-s=model-waiting]')) === 'A Find out task is done — what did you find?', await text('[data-s=model-waiting]'));
  await go('projects/p/pjB1/model', 2026, 10, 15, 23, 12);
  await click(`${rowSel(A1)} [data-action=as-edit]`); await sleep(200);
  await click(`${rowSel(A1)} [data-action=as-remove]`); await answer(false);
  check('"Remove" asks first, and "Keep it" keeps it', (await pAt('pjB1')).model.assumptions.length === 1 && (await exists(rowSel(A1))));
  await click(`${rowSel(A1)} [data-action=as-remove]`); await answer(true);
  check('confirming removes it, and its Find out task stays', !(await exists(rowSel(A1))) && !(await pAt('pjB1')).model.assumptions.some(a => a.id === A1) && !!(await task('Find out: Students would buy day-old bread')));
  await seed([bizObj('pjFull', 'Model: twelve things', { problem: '', who: '', how: '', assumptions: Array.from({ length: 12 }, (_, i) => asObj('asF' + i, 'Made-up belief number ' + (i + 1))) })]);
  await go('projects/p/pjFull/model', 2026, 10, 15, 23, 13);
  check('at 12 things that must be true, it says so and the add form is gone', (await exists('[data-s=model-full]')) && !(await exists('#modelAddForm')));

  console.log('\n[26] The Overview card and the board');
  await seed([
    bizObj('pjO', 'Overview: seed swap', { problem: 'Gardeners buy too many seeds', who: 'Allotment holders', how: '', assumptions: [asObj('asO1', 'People will swap in person', 'looks-true'), asObj('asO2', 'There is a free place to meet'), asObj('asO3', 'Swaps happen every season')] }),
    bizObj('pjOe', 'Overview: nothing yet', null),
    pjObj('pjOg', 'Overview: a general one', 'capture'),
  ]);
  await go('projects/p/pjO', 2026, 10, 15, 23, 14);
  check('the card counts the questions answered, what is still to check and what looks true', (await text('#projectModelCard [data-s=model-summary]')) === '3 of 4 questions answered · 2 still to check · 1 looks true', await text('#projectModelCard [data-s=model-summary]'));
  await go('projects/p/pjOe', 2026, 10, 15, 23, 15);
  check('a business idea with no model invites you to start with the first question', (await text('#projectModelCard [data-s=model-summary]')) === 'Four simple questions put your idea on one page — start with the first', await text('#projectModelCard [data-s=model-summary]'));
  await go('projects/p/pjOg', 2026, 10, 15, 23, 16);
  check('a general project has no one-page card', (await exists('#projectHead')) && !(await exists('#projectModelCard')));
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
    check(`phone ${w} px: every tab link fits its own width`, tabs.length === 4 && tabs.every(x => x.sw <= x.cw), tabs);
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
  check('the Start a project kind choice has General, Business idea and Case', eq(kinds, ['general', 'business', 'case']), kinds);
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

  console.log('\n[32] Case issues, and the Overview card');
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
  const nx = norm(await text('#projectCaseCard [data-s=case-next]'));
  check('the Overview card shows "Next date:" for the earliest dated task from today, not an earlier past one', nx.startsWith('Next date:') && nx.includes('18 Oct') && nx.includes('File the claim form') && !nx.includes('Old past deadline') && !nx.includes('witness'), nx);
  check('…and the counts line reads "2 timeline entries · 3 pieces of evidence (1 to get) · 2 issues"', norm(await text('#projectCaseCard [data-s=case-summary]')) === '2 timeline entries · 3 pieces of evidence (1 to get) · 2 issues', await text('#projectCaseCard [data-s=case-summary]'));
  check('…with the not-legal-advice line', (await text('#projectCaseCard [data-s=case-not-advice]')).includes('doesn’t give legal advice'), await text('#projectCaseCard [data-s=case-not-advice]'));
  await click('[data-action=case-deadline]'); await sleep(150);
  check('"Add a deadline" waits for a title and a date', await ev(`document.querySelector('[data-action=case-deadline-add]').disabled`));
  await type('#caseDlTitle', 'Reply to the employer'); await type('#caseDlDate', '2026-10-16'); await click('[data-action=case-deadline-add]'); await sleep(300);
  const dl = await task('Reply to the employer');
  check('adding a deadline makes a task with that date, in the case', dl && dl.due === '2026-10-16' && dl.projectId === 'pjIs', dl);
  check('…and it becomes the next date', norm(await text('#projectCaseCard [data-s=case-next]')).includes('16 Oct') && norm(await text('#projectCaseCard [data-s=case-next]')).includes('Reply to the employer'), await text('#projectCaseCard [data-s=case-next]'));
  await seed([caseObj('pjNd', 'Issues: no dates', {})]);
  await go('projects/p/pjNd', 2026, 10, 15, 9, 33);
  check('a case with no dated tasks says "No dates yet"', (await text('#projectCaseCard [data-s=case-next]')).includes('No dates yet'), await text('#projectCaseCard [data-s=case-next]'));

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
  const tileParts = key => ev(`[...document.querySelectorAll('#projectGlance [data-tile=${key}] > span')].map(s => s.textContent.trim())`);
  const tileKeys = () => ev(`[...document.querySelectorAll('#projectGlance [data-s=glance-tiles] [data-tile]')].map(a => a.dataset.tile)`);
  const tileHref = key => ev(`document.querySelector('#projectGlance [data-tile=${key}]').getAttribute('href')`);
  const pointerKeys = () => ev(`[...document.querySelectorAll('#projectGlance [data-s=glance-pointers] [data-pointer]')].map(a => a.dataset.pointer)`);
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
  check('a general project\'s At a glance has four tiles: next step, next date, milestones and decisions', eq(await tileKeys(), ['step', 'date', 'milestones', 'decisions']), await tileKeys());
  check('…the next step tile names the task and its length', eq(await tileParts('step'), ['Next step', 'Call the supplier', '15 min']), await tileParts('step'));
  const dateParts = await tileParts('date');
  check('…the next date tile names the dated task and its day', dateParts[0] === 'Next date' && dateParts[1] === 'Call the supplier' && dateParts[2].includes('20 Oct'), dateParts);
  check('…the milestones tile says 2 of 5 reached and what is next', eq(await tileParts('milestones'), ['Milestones', '2 of 5 reached', 'Next: First coat on']), await tileParts('milestones'));
  check('…the decisions tile says 1 open and shows the question', eq(await tileParts('decisions'), ['Decisions', '1 open', 'Which colour for the hall?']), await tileParts('decisions'));
  check('…each tile links to the right place', (await tileHref('step')) === '#today/tasks/tkG1' && (await tileHref('date')) === '#today/tasks/tkG1' && (await tileHref('milestones')) === '#projects/p/pjG1/milestones' && (await tileHref('decisions')) === '#projects/p/pjG1/decisions',
    [await tileHref('step'), await tileHref('date'), await tileHref('milestones'), await tileHref('decisions')]);
  check('the milestone route reads "2 of 5 reached · Next: First coat on"', norm(await text('[data-s=glance-route]')).includes('2 of 5 reached · Next: First coat on'), await text('[data-s=glance-route]'));
  const cols = await ev(`[...document.querySelectorAll('[data-s=glance-weeks] [role=listitem]')].map(c => ({ label: c.getAttribute('aria-label'), tab: c.tabIndex }))`);
  check('the week-by-week chart has 8 columns, the last labelled "This week" with what happened in it', cols.length === 8 && cols[7].label === 'This week: 1 task done, 1 milestone reached' && cols.slice(0, 7).every(c => c.label.startsWith('Week of')), cols);
  check('…every column can be focused with the keyboard', cols.every(c => c.tab === 0), cols);
  check('…and a total line says "5 in the last 8 weeks" (the task from June is not counted)', norm(await text('[data-s=glance-weeks]')).includes('5 in the last 8 weeks'), await text('[data-s=glance-weeks]'));
  check('the pointers include the dated task coming up', (await pointerKeys()).includes('soon') && norm(await text('[data-pointer=soon]')).includes('Call the supplier — in 5 days'), await text('[data-s=glance-pointers]'));

  await go('projects/p/pjG2', 2026, 10, 15, 8, 6);
  check('a project with only a name shows "None yet" on the next step, next date and milestones tiles', (await tileParts('step'))[1] === 'None yet' && (await tileParts('date'))[1] === 'None yet' && (await tileParts('milestones'))[1] === 'None yet', [await tileParts('step'), await tileParts('date'), await tileParts('milestones')]);
  check('…and "None open" on decisions', (await tileParts('decisions'))[1] === 'None open', await tileParts('decisions'));
  check('…no pictures are drawn', await exists('#projectGlance') && !(await exists('[data-s=glance-pictures]')));
  check('…and its only pointer is "No next step yet"', eq(await pointerKeys(), ['step']) && (await text('[data-pointer=step]')).includes('No next step yet'), await text('[data-s=glance-pointers]'));

  await go('projects/p/pjG3', 2026, 10, 15, 8, 7);
  check('a business idea\'s tiles are next step, one page, what must be true and milestones', eq(await tileKeys(), ['step', 'one-page', 'beliefs', 'milestones']), await tileKeys());
  check('…the one-page tile says "3 of 4 answered" (two answers, and the things that must be true count as the fourth)', (await tileParts('one-page'))[1] === '3 of 4 answered', await tileParts('one-page'));
  check('…the must-be-true tile counts the things and how they are turning out', eq((await tileParts('beliefs')).slice(1), ['6 things', '2 to check · 1 looks true · 3 don’t hold']), await tileParts('beliefs'));
  const bel = await ev(`[...document.querySelectorAll('[data-s=glance-beliefs] li')].map(li => li.textContent.trim())`);
  check('the beliefs picture shows the three counts: 2 not checked yet, 1 looks true, 3 do not hold', eq(bel, ['2Not checked yet', '1Looks true', '3Doesn’t hold']), bel);

  await go('projects/p/pjG4', 2026, 10, 15, 8, 8);
  check('a case\'s tiles are next date, evidence to get, issues with nothing linked and timeline entries', eq(await tileKeys(), ['date', 'to-get', 'bare', 'timeline']), await tileKeys());
  check('…the next date is the dated task', (await tileParts('date'))[1] === 'Send the witness statement' && (await tileParts('date'))[2].includes('18 Oct'), await tileParts('date'));
  check('…2 pieces of evidence to get, of 3', eq((await tileParts('to-get')).slice(1), ['2', 'of 3 pieces of evidence']), await tileParts('to-get'));
  check('…1 issue with nothing linked, of 2', eq((await tileParts('bare')).slice(1), ['1', 'of 2 issues']), await tileParts('bare'));
  check('…3 timeline entries, the latest on 20 Sep', (await tileParts('timeline'))[1] === '3' && (await tileParts('timeline'))[2].includes('20 Sep'), await tileParts('timeline'));
  const evParts = await ev(`[...document.querySelectorAll('[data-s=glance-evidence] [role=listitem]')].map(d => d.getAttribute('aria-label'))`);
  check('the evidence bar\'s parts say "To get: 2" and "Have it: 1" (a part with none is not drawn)', eq(evParts, ['To get: 2', 'Have it: 1']), evParts);
  const legend = norm(await text('[data-s=glance-evidence]'));
  check('…while its legend lists all three with counts, including a 0', legend.includes('To get 2') && legend.includes('Have it 1') && legend.includes('Reviewed 0'), legend);
  const rowsI = await ev(`[...document.querySelectorAll('[data-s=glance-issues] tbody tr')].map(r => r.textContent.replace(/\\s+/g, ' ').trim())`);
  check('the issues table has one row per issue, and says "nothing linked yet" only for the issue without links', rowsI.length === 2 && !rowsI[0].includes('nothing linked yet') && rowsI[1].includes('nothing linked yet'), rowsI);
  const months = await ev(`[...document.querySelectorAll('[data-s=glance-months] [role=listitem]')].map(c => c.getAttribute('aria-label'))`);
  check('the timeline-by-month chart has a column for each month with entries', months.length === 2 && months[0] === 'Aug 2026: 1 entry' && /^Sept? 2026: 2 entries$/.test(months[1]), months);
  check('"Next dates" lists the dated task', norm(await text('[data-s=glance-dates]')).includes('Send the witness statement'), await text('[data-s=glance-dates]'));
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
  check('…and with nothing waiting step 2 says so', (await text('[data-s=review-nothing-waiting]')).includes('Nothing waiting on you'), await text('#reviewStep'));
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
  check('the steps are named, the first marked as current', (await ev(`[...document.querySelectorAll('#reviewTop li')].map(li => li.textContent + (li.getAttribute('aria-current') ? '*' : ''))`)).join('|') === '1. What moved*|2. What\'s waiting|3. Next week\'s focus|4. A line or two', await text('#reviewTop'));

  await click('[data-action=review-next]'); await sleep(200);
  check('Next goes to step 2, "What\'s waiting"', (await stepNo()) === '1' && (await text('#reviewStepH')) === 'What\'s waiting');
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

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
