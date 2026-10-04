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

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
