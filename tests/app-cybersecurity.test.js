// Browser journey in tests/run.sh's throwaway profile; never the user's plan or account.
const T = require('./cdp.js');
const fs = require('fs');
const { ev, click, exists, text, data, sleep, check } = T;
const go = async hash => { T.setUrl('app/dist/index.html#' + hash); await T.openAt(2026, 10, 5, 10); await sleep(300); };
const until = async (predicate, label, ms = 5000) => { for (let t = 0; t < ms; t += 100) { if (await predicate()) return; await sleep(100); } throw new Error('Timed out waiting for ' + label); };
async function fill(sel, value) {
  await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const p = e instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : e instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(e, ${JSON.stringify(value)}); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); })()`); await sleep(80);
}
(async () => {
  await T.connect(); await go('study'); await ev('localStorage.clear()'); await go('study');
  check('cybersecurity is available before setting up a roadmap', await exists('a[href="#study/cybersecurity"]'));
  await go('study/cybersecurity/lesson.learning-evidence');
  await until(() => exists('[data-action="cyber-start-direct"]'), 'a fresh lesson’s direct start');
  const directBefore = await ev(`localStorage.getItem('myday.data.v4')`);
  check('a fresh learner can start a lesson directly without manually importing its path', !(await data()).study.stages.length && !(await data()).study.sessions.length && await exists('#cyberMinutes'));
  await ev(`window.directRealSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === 'myday.data.v4') throw new DOMException('Test quota', 'QuotaExceededError'); return window.directRealSetItem.call(this, k, v); };`);
  await click('[data-action="cyber-start-direct"]');
  await until(async () => (await text('#toast')).includes("Couldn't save the lesson"), 'the rejected direct start message');
  check('a rejected direct start neither imports the path nor starts a session or claims success', (await ev(`localStorage.getItem('myday.data.v4')`)) === directBefore && !(await data()).study.stages.length && !(await data()).study.sessions.length && (await ev('location.hash')) === '#study/cybersecurity/lesson.learning-evidence' && await exists('[data-action="cyber-start-direct"]'), [(await data()).study.stages.length, (await data()).study.sessions.length, await ev('location.hash'), await text('#toast')]);
  await ev('Storage.prototype.setItem = window.directRealSetItem; delete window.directRealSetItem');
  await click('[data-action="cyber-start-direct"]');
  await until(() => exists('#stClock'), 'the directly started Study timer');
  const direct = await data();
  check('a successful direct start adds the real path and exactly one active session together', direct.study.stages.flatMap(s => s.courses).length === 14 && direct.study.sessions.length === 1 && direct.study.sessions[0].status === 'active' && direct.study.sessions[0].taskId === 'cyber:1:lesson.learning-evidence' && direct.study.activeId === direct.study.sessions[0].id && (await ev('location.hash')) === '#study/session', [direct.study.stages.flatMap(s => s.courses).length, direct.study.sessions, direct.study.activeId]);
  const outsideStudy = d => { const copy = JSON.parse(JSON.stringify(d)); delete copy.study; delete copy.saves; return JSON.stringify(copy); };
  check('direct lesson start preserves every unrelated saved section', outsideStudy(direct) === outsideStudy(JSON.parse(directBefore)));
  await go('study/session');
  check('the directly started lesson and its timer survive a reload', (await data()).study.sessions.length === 1 && await exists('a[href="#study/cybersecurity/lesson.learning-evidence"]') && await exists('#stClock'));
  await click('[data-action="s-finish"]');
  await until(() => exists('[data-action="s-ci-task"]'), 'the Cybersecurity session check-in');
  check('finishing the Cybersecurity timer alone does not claim task completion or offer the following lesson', !(await exists('[data-s="study-up-next"]')) && (await data()).study.sessions[0].taskDone === null);
  await click('[data-action="s-ci-task"][data-v="1"]');
  await until(() => exists('[data-s="study-up-next"] a[href="#study/cybersecurity/lesson.authorised-scope"]'), 'the next required Cybersecurity lesson');
  check('explicit task completion offers the following required Cybersecurity lesson without claiming mastery', (await data()).study.sessions[0].taskDone === true && (await text('[data-s="study-up-next"]')).includes('Permission, boundaries and stop conditions') && !/master|verified|score/i.test(await text('[data-s="study-up-next"]')), await text('[data-s="study-up-next"]'));
  await click('[data-s="study-up-next"] a');
  await until(() => exists('#cyberMinutes'), 'the next Cybersecurity lesson');
  check('the next-lesson check-in link opens that lesson while leaving the finished session intact', (await ev('location.hash')) === '#study/cybersecurity/lesson.authorised-scope' && (await data()).study.sessions.length === 1 && (await data()).study.sessions[0].status === 'done' && (await data()).study.activeId === null, [await ev('location.hash'), (await data()).study.sessions[0].status]);
  // Restore the fresh fixture so the established import and notebook journey stays independent.
  await ev('localStorage.clear()'); await go('study');
  await click('a[href="#study/cybersecurity"]'); await sleep(400);
  check('the foundation map renders 14 modules', await ev(`document.querySelectorAll('section[aria-label="Modules on your learning map"] > a').length`) === 14);
  await click('[data-action=cyber-import]'); await sleep(300);
  let saved = await data(), before = JSON.stringify(saved.study.stages);
  check('the chosen curriculum becomes real Study courses', saved.study.stages.flatMap(s => s.courses).length === 14);
  await click('[data-action=cyber-import]'); await sleep(200);
  check('repeat import preserves the same roadmap', JSON.stringify((await data()).study.stages) === before);
  for (const id of ['learning-evidence', 'authorised-scope', 'lab-isolation', 'technical-notes', 'help-and-debugging']) {
    await go('study/cybersecurity/lesson.' + id);
    check('lesson renders its real activities: ' + id, (await text('#app')).includes('Completion criteria') && await exists('a[href="#study/cybersecurity/exercise.' + id + '"]'));
  }
  await go('study/cybersecurity/lesson.learning-evidence'); await click('[data-action=cyber-start]'); await sleep(200);
  check('a curriculum lesson starts the existing Study timer', (await ev('location.hash')) === '#study/session' && (await data()).study.sessions[0].taskId === 'cyber:1:lesson.learning-evidence');
  check('the timer links back to the actual lesson', await exists('a[href="#study/cybersecurity/lesson.learning-evidence"]'));
  await go('study/cybersecurity/assessment.learning-evidence-check');
  check('answer keys are absent before an attempt', !(await text('#app')).includes('No; performance needs observable evidence.'));
  await click('[data-action=cyber-begin]'); await sleep(150); await click('[data-action=cyber-submit]'); await sleep(100);
  check('empty submission is rejected accessibly', await exists('[role=alert]'));
  await fill('#cyberVariant', 'First independent recall');
  const q = await ev('[...document.querySelectorAll("textarea[id^=assessment]")].map(e => e.id)');
  for (const id of q) await fill(`[id="${id}"]`, 'My own answer before the guide.');
  await fill('#cyberEvidence', 'I explained the difference between reading and observable output.');
  await fill('#cyberResume', 'Try a fresh example tomorrow.'); await fill('#cyberCritical', 'true');
  await go('study/cybersecurity/assessment.learning-evidence-check');
  check('draft evidence and answers survive reload', (await ev('document.querySelector("#cyberEvidence").value')).includes('observable output') && (await data()).cybersecurity.attempts[0].answers[q[0]].includes('My own answer'));
  await ev(`window.practiceRealSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === 'myday.data.v4') throw new DOMException('Test quota', 'QuotaExceededError'); return window.practiceRealSetItem.call(this, k, v); };`);
  await click('[data-action=cyber-submit]'); await sleep(150);
  check('a rejected notebook save leaves the draft editable and reports the failure', await exists('#cyberEvidence') && (await text('[role=alert]')).includes('Could not save') && !(await data()).cybersecurity.attempts[0].submittedAt);
  await ev('Storage.prototype.setItem = window.practiceRealSetItem; delete window.practiceRealSetItem');
  await click('[data-action=cyber-submit]'); await sleep(250);
  check('submission retains real evidence and remains unverified', (await data()).cybersecurity.attempts[0].submittedAt && (await data()).cybersecurity.attempts[0].verified === false);
  await click('[data-action=cyber-answers]'); await sleep(300);
  check('the guide is released after submission on explicit request', (await text('#app')).includes('No; performance needs observable evidence.'));
  await click('[data-action=cyber-begin]'); await sleep(150);
  check('retry keeps the previous submitted attempt', (await data()).cybersecurity.attempts.length === 2 && (await data()).cybersecurity.attempts[0].submittedAt);
  await go('study/cybersecurity/lab.learning-lab-guided');
  check('the learning lab links to an actual platform assignment and in-app practice', await exists('a[href="#study/cybersecurity/assignment.thm-start"]') && await exists('a[href="#study/cybersecurity/interactive.scope"]'));
  await go('study/cybersecurity/practice'); await fill('#practiceAccess', 'local');
  check('the practice shelf can show only its three in-app activities', await ev(`document.querySelectorAll('.cyber-workshop a[href*="/interactive."]').length`) === 3 && !(await text('#app')).includes('TryHackMe:'));
  await fill('#practiceAccess', 'all'); await fill('#practiceSearch', 'tryhackme');
  check('provider search finds specific TryHackMe assignments', await ev(`document.querySelectorAll('.cyber-workshop a[href*="/assignment.thm-"]').length`) === 3);
  await go('study/cybersecurity/assignment.thm-network'); await click('[data-action=practice-begin]'); await sleep(100);
  check('external links use the verified room and open separately', await ev(`(() => { const a = document.querySelector('[data-action=practice-open]'); return a.href === 'https://tryhackme.com/room/whatisnetworking' && a.target === '_blank' && a.rel.includes('noopener'); })()`));
  check('starting external work leaves it incomplete', (await data()).cybersecurity.attempts.find(a => a.activityId === 'assignment.thm-network').submittedAt === null);
  await fill('#practiceEvidence', 'Tasks 1–4: I compared addresses and described what the simulated ping establishes.'); await fill('#practiceOutcome', 'partial'); await fill('#practiceCritical', 'true');
  await go('study/cybersecurity/assignment.thm-network');
  check('external progress and notes resume after reload', (await ev('document.querySelector("#practiceOutcome").value')) === 'partial' && (await ev('document.querySelector("#practiceEvidence").value')).includes('Tasks 1–4'));
  await fill('#practiceOutcome', 'completed');
  await ev(`window.practiceRealSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === 'myday.data.v4') throw new DOMException('Test quota', 'QuotaExceededError'); return window.practiceRealSetItem.call(this, k, v); };`);
  await click('[data-action=practice-submit]'); await sleep(150);
  check('a rejected external check-in does not claim completion', await exists('#practiceOutcome') && (await text('[role=alert]')).includes('Could not save') && !(await data()).cybersecurity.attempts.find(a => a.activityId === 'assignment.thm-network').submittedAt);
  await ev('Storage.prototype.setItem = window.practiceRealSetItem; delete window.practiceRealSetItem');
  await click('[data-action=practice-submit]'); await sleep(180);
  check('check-in is explicitly self-reported and retained', (await text('#app')).includes('provider progress not verified') && (await data()).cybersecurity.attempts.find(a => a.activityId === 'assignment.thm-network').submittedAt);
  await go('study/cybersecurity/assignment.thm-start'); await click('[data-action=practice-begin]'); await sleep(100);
  await fill('#practiceOutcome', 'blocked'); await fill('#practiceEvidence', 'The provider machine was unavailable today.'); await fill('#practiceCritical', 'false'); await click('[data-action=practice-submit]'); await sleep(180);
  check('access problems save without a false completion and offer an alternative', (await text('#app')).includes('Could not access') && await exists('a[href="#study/cybersecurity/interactive.scope"]'));
  await go('study/cybersecurity/interactive.scope'); await click('[data-action=practice-begin]'); await sleep(100);
  for (const [id, value] of Object.entries({ 'scope-one': 'proceed', 'scope-two': 'proceed', 'scope-three': 'stop', 'scope-four': 'clarify' })) await fill('#' + id, value);
  await fill('#practiceEvidence', 'I paused when the permitted time window ended.'); await fill('#practiceCritical', 'true'); await click('[data-action=practice-submit]'); await sleep(180);
  check('scope decisions produce feedback including a wrong answer', (await text('#app')).includes('3 of 4 checks matched') && (await text('#app')).includes('Reachability does not extend authorisation'));
  await go('study/cybersecurity/interactive.network'); await click('[data-action=practice-begin]'); await sleep(100); await click('[data-action=network-run]'); await sleep(100);
  check('the simulated fault produces an observable failure trace', (await text('[aria-label="Connection trace"]')).includes('Name lookup failed'));
  await fill('#networkDns', 'available');
  check('changing a network setting clears stale feedback', !await exists('[aria-label="Connection trace"]'));
  await click('[data-action=network-run]'); await sleep(100);
  check('repairing DNS changes the simulation outcome', (await text('[aria-label="Connection trace"]')).includes('Website reached'));
  await fill('#practiceEvidence', 'Restoring the local resolver allowed name lookup, routing and TCP 443. It does not prove security.'); await fill('#practiceCritical', 'true');
  await go('study/cybersecurity/interactive.network');
  check('network settings and last run survive reload', (await text('[aria-label="Connection trace"]')).includes('Website reached'));
  await click('[data-action=practice-submit]'); await sleep(180);
  check('network result and explanation become notebook history', (await text('#app')).includes('1 of 1 checks matched'));
  await go('study/cybersecurity/interactive.auth-logs'); await click('[data-action=practice-begin]'); await sleep(100);
  await fill('#logFilter', 'auth-025');
  check('raw log filtering exposes a repeated event without hiding it from counts', (await text('#app')).includes('Showing 2 of 33 raw rows'));
  for (const [id, value] of Object.entries({ valid: '30', failures: '6', invalid: '2', duplicate: '1' })) await fill('#log-' + id, value);
  await fill('#practiceEvidence', 'auth-023 to auth-028 deserve review; failures then success could be misuse or a legitimate retry. Ask for endpoint evidence.'); await fill('#practiceCritical', 'true'); await click('[data-action=practice-submit]'); await sleep(180);
  check('log checks match the fixture and retain uncertainty about compromise', (await text('#app')).includes('4 of 4 checks matched') && (await text('#app')).includes('does not establish who acted'));
  const evidence = JSON.stringify((await data()).cybersecurity);
  T.setUrl('index.html#study'); await T.openAt(2026, 10, 5); await click('#themeBtn'); await sleep(200);
  check('classic MyDay preserves the new evidence section', JSON.stringify((await data()).cybersecurity) === evidence);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const hash of ['study/cybersecurity', 'study/cybersecurity/module.learning-lab', 'study/cybersecurity/lesson.learning-evidence', 'study/cybersecurity/assessment.learning-evidence-check', 'study/cybersecurity/toolkit', 'study/cybersecurity/practice', 'study/cybersecurity/assignment.thm-network', 'study/cybersecurity/interactive.network', 'study/cybersecurity/interactive.auth-logs']) {
    await go(hash);
    check('phone layout fits: ' + hash, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  }
  await go('study/cybersecurity');
  check('workshop navigation offers 44-pixel touch targets', await ev(`[...document.querySelectorAll('nav[aria-label="Cybersecurity"] a')].every(a => a.getBoundingClientRect().height >= 44)`));
  fs.writeFileSync('/tmp/myday-cybersecurity-mobile.png', Buffer.from((await T.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64'));
  await go('study/cybersecurity/interactive.network'); await click('[data-action=practice-begin]'); await sleep(100);
  await ev(`document.querySelector('#practice-attempt-title').scrollIntoView({block:'start'})`);
  fs.writeFileSync('/tmp/myday-practice-mobile.png', Buffer.from((await T.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64'));
  check('interactive controls offer 44-pixel touch targets', await ev(`[...document.querySelectorAll('.cyber-workshop select, .cyber-workshop button')].every(a => a.getBoundingClientRect().height >= 44)`));
  await go('study/cybersecurity/interactive.auth-logs'); await click('[data-action=practice-begin]'); await sleep(100);
  check('raw log table scrolls inside the phone screen', !(await ev('document.documentElement.scrollWidth > innerWidth')) && await ev(`(() => { const table = document.querySelector('[aria-label="Synthetic sign-in events"]'); return table.scrollWidth > table.clientWidth; })()`));
  await T.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await fill('#log-valid', '30'); await fill('#practiceEvidence', 'Offline draft stays on this device.');
  check('in-app practice can save a draft without a network connection', (await data()).cybersecurity.attempts.find(a => a.activityId === 'interactive.auth-logs' && !a.submittedAt).answers['assessment.practice.valid'] === '30');
  await T.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await T.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await go('study/cybersecurity');
  fs.writeFileSync('/tmp/myday-cybersecurity-desktop.png', Buffer.from((await T.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64'));
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.settings.theme = 'light'; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go('study/cybersecurity');
  fs.writeFileSync('/tmp/myday-cybersecurity-light.png', Buffer.from((await T.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64'));
  await go('study/cybersecurity/practice');
  fs.writeFileSync('/tmp/myday-practice-desktop.png', Buffer.from((await T.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64'));
  await go('study/cybersecurity/%ZZ'); check('a malformed link recovers without a blank page', (await text('#app')).includes('Cybersecurity workshop'));
  await go('study/cybersecurity/lesson.no-such-lesson'); check('a missing lesson has a return link', (await text('#app')).includes('This learning page isn’t here'));
  T.setUrl('aimock/index.html#study/cybersecurity/lesson.learning-evidence'); await T.openAt(2026, 10, 5); await sleep(300);
  const beforeAI = JSON.stringify((await data()).cybersecurity);
  await fill('#cyberTutorQuestion', 'What counts as evidence?'); await click('[data-action=cyber-ask]'); await sleep(850);
  check('optional tutor renders a checked explanation in practice mode', (await text('#app')).includes('Rules-only practice response'));
  // Graduated help: the reply in parts, a hint first, each more only when asked.
  const tuParts = () => ev(`['hint', 'example', 'explanation', 'follow-up', 'follow-answer'].filter(p => document.querySelector('[data-s="tu-' + p + '"]')).join()`);
  check('…in parts: the hint first, with focus, under what you asked', (await ev(`document.querySelector('[data-s="tutor-reply"]')?.dataset.kind`)) === 'steps' && (await tuParts()) === 'hint'
    && (await ev(`document.activeElement?.dataset?.s || ''`)) === 'tu-hint' && (await text('[data-s="tutor-reply"]')).includes('You asked: “What counts as evidence?”'));
  const tuSeen = [];
  for (let i = 0; i < 4; i++) { tuSeen.push(await text('[data-action="tu-next"]')); await click('[data-action="tu-next"]'); await sleep(150); tuSeen.push(`${await tuParts()}@${await ev(`document.activeElement?.dataset?.s || ''`)}`); }
  check('…each button shows one more part, in order, and moves focus to it; then no more button', tuSeen.join(' | ') === 'Show an example | hint,example@tu-example | Show the explanation | hint,example,explanation@tu-explanation | Try a follow-up question | hint,example,explanation,follow-up@tu-follow-up | Show its answer | hint,example,explanation,follow-up,follow-answer@tu-follow-answer'
    && !(await exists('[data-action="tu-next"]')), tuSeen.join(' | '));
  await fill('#cyberTutorQuestion', 'Did I pass? Give me a score.'); await click('[data-action=cyber-ask]'); await sleep(850);
  check('…a request for a mark gets one plain reply with a next step, with focus, and no parts', (await ev(`document.querySelector('[data-s="tutor-reply"]')?.dataset.kind`)) === 'plain'
    && (await ev(`document.activeElement?.dataset?.s || ''`)) === 'tu-plain' && (await text('[data-s="tutor-reply"]')).includes('Try next:') && !(await exists('[data-action="tu-next"]')) && (await tuParts()) === '');
  check('AI explanation does not change attempts or scores', JSON.stringify((await data()).cybersecurity) === beforeAI);

  // The course's own knowledge checks in revision (no AI), over two days.
  const on = async (day, hash) => { T.setUrl('app/dist/index.html#' + hash); await T.openAt(2026, 10, day, 10); await sleep(400); };
  const qs = ['assessment.lab-isolation-check.q1', 'assessment.lab-isolation-check.q2'];
  const others = JSON.stringify({ ...(await data()), cybersecurity: null, study: null, saves: null });
  await on(5, 'study/cybersecurity/lesson.lab-isolation');
  check('a lesson offers to bring its checks back in revision, adding nothing by itself', await exists('[data-cy-checks="out"] [data-action="cy-checks-add"]') && !(await data()).cybersecurity.cards.length);
  await click('[data-cy-checks="out"] [data-action="cy-checks-add"]'); await sleep(250);
  let cy = (await data()).cybersecurity;
  check('one tap adds the lesson\'s two checks, by the course\'s ids, first back tomorrow', cy.cards.map(c => c.id).join() === qs.join() && cy.cards.every(c => c.addedOn === '2026-10-05' && c.review.due === '2026-10-06'));
  check('…and the lesson says so', await exists('[data-cy-checks="in"]') && (await text('[data-cy-checks="in"]')).includes('in your revision'));
  await on(5, 'study/cybersecurity/assessment.lab-isolation-check');
  check('the knowledge check itself shows them in revision too', await exists('[data-cy-check-revision] [data-cy-checks="in"]'));
  await on(5, 'study/cybersecurity');
  check('on the day they\'re added nothing is due: the map says when they come back', await ev(`document.querySelector('[data-cy-revision]')?.dataset.cyRevision`) === 'later' && !(await exists('[data-action="cy-revise"]')));
  await on(6, 'study');
  check('the next day Study\'s home counts them without showing them', (await text('#stRevision')).includes('2 Cybersecurity checks') && !(await text('#stRevision')).includes('different failure modes'));
  await on(6, 'study/cybersecurity'); await click('[data-action="cy-revise"]'); await sleep(900);
  check('"Revise Cybersecurity" starts a round of just those checks', (await ev('location.hash')) === '#study/revise' && (await text('.st-q')).includes('Question 1 of 2') && (await text('.st-path')).startsWith('Cybersecurity · '));
  check('the question is the course\'s own, its answer hidden until asked for', (await text('.st-prompt')).length > 10 && !(await exists('.st-answer')));
  await click('[data-action="s-rev-show"]'); await sleep(200);
  check('showing it gives the course\'s reference answer and a link to the lesson', (await text('.st-q')).includes('Reference answer') && await exists('.st-q a[href="#study/cybersecurity/lesson.lab-isolation"]'));
  await click('[data-action="s-rev-self"][data-v="right"]'); await sleep(80); await click('[data-action="s-rev-rate"][data-v="good"]'); await sleep(300);
  await click('[data-action="s-rev-show"]'); await sleep(200); await click('[data-action="s-rev-self"][data-v="wrong"]'); await sleep(80); await click('[data-action="s-rev-rate"][data-v="again"]'); await sleep(300);
  const after = await data(), revs = after.study.reviews.filter(r => qs.includes(r.conceptId));
  check('both answers are in Study\'s history under the questions\' ids, self-assessed, and rescheduled by Study\'s rules', revs.length === 2 && revs.every(r => r.graded === 'self') && after.cybersecurity.cards.find(c => c.id === qs[0]).review.due === '2026-10-10' && after.cybersecurity.cards.find(c => c.id === qs[1]).review.due === '2026-10-07');
  check('the round\'s summary is Cybersecurity\'s, linking what hasn\'t clicked back to its lesson', (await text('main h2')).includes('Cybersecurity revision') && await exists('[data-s="rev-not-yet"] a[href="#study/cybersecurity/lesson.lab-isolation"]'));
  await on(6, 'study/cybersecurity/lesson.lab-isolation');
  for (let i = 0; i < 50 && !(await exists('[data-action="cy-checks-remove"]')); i++) await sleep(100); // the lesson page can take a moment
  await click('[data-action="cy-checks-remove"]'); await sleep(200); await click('[data-action="dialog-confirm"]'); await sleep(250);
  const out = await data();
  check('taking them out asks first, then keeps their past answers', !out.cybersecurity.cards.length && out.study.reviews.filter(r => qs.includes(r.conceptId)).length === 2);
  check('nothing else in your saved MyDay changed', JSON.stringify({ ...out, cybersecurity: null, study: null, saves: null }) === others);

  // More practice: cards an AI writes and a second AI checks. Here in practice mode (rules on this device: no AI, nothing sent).
  await on(7, 'study/cybersecurity/lesson.lab-isolation');
  check('without AI set up, a lesson has no "More practice" card', !(await exists('#cyAiCards')));
  const rest = async () => JSON.stringify({ ...(await data()), study: { ...(await data()).study, concepts: null }, saves: null });
  const restBefore = await rest(), conceptsBefore = (await data()).study.concepts.length;
  const mockAt = async (day, hash) => { T.setUrl('aimock/index.html#' + hash); await T.openAt(2026, 10, day, 10); await sleep(400); };
  await mockAt(7, 'study/cybersecurity/lesson.lab-isolation');
  check('with AI: a "More practice" card that says what happens (practice mode: nothing is sent anywhere)', await exists('#cyAiCards [data-action="cy-cards-ask"]') && (await text('#cyAiCards')).includes('Nothing is sent anywhere'));
  await click('[data-action="cy-cards-ask"]');
  check('while waiting it says cards are written, then checked, and offers Cancel', (await text('#cyAiCards')).includes('then checking each one') && await exists('[data-action="cy-cards-cancel"]'));
  await sleep(1000);
  check('the checked cards come back for review: ten, each ticked, nothing added yet', await ev(`document.getElementById('cyAiCards').dataset.phase`) === 'review' && await ev(`document.querySelectorAll('[data-s="cy-card"]').length`) === 10
    && await ev(`[...document.querySelectorAll('[data-s="cy-card-pick"]')].every(x => x.checked)`) && (await text('#cyAiCards')).includes('nothing added yet') && (await data()).study.concepts.length === conceptsBefore);
  check('…saying who wrote and who checked them, and that a card that looks wrong can be unticked', (await text('#cyAiCards')).includes('Written by practice helper (no AI), checked by practice checker (no AI)') && (await text('#cyAiCards')).includes('untick it'));
  check('…each with its answer: a multiple-choice card marks the right option', (await text('[data-s="cy-card"]:nth-child(2)')).includes('✓ Yes, it is listed'));
  check('cards fit a phone: no sideways scrolling, 44-pixel tick boxes', !(await ev('document.documentElement.scrollWidth > innerWidth')) && await ev(`[...document.querySelectorAll('[data-s="cy-card"] label')].every(l => l.getBoundingClientRect().height >= 44)`));
  await click('[data-s="cy-card-pick"]'); await click('[data-s="cy-card"]:nth-child(3) [data-s="cy-card-pick"]'); await sleep(100);
  check('unticking two: the button says how many will be added', (await text('[data-action="cy-cards-add"]')) === 'Add 8 to revision');
  await click('[data-action="cy-cards-add"]'); await sleep(300);
  let ai = (await data()).study.concepts.filter(c => c.origin);
  check('Add: the 8 ticked cards become Study concepts, due tomorrow, with where they came from', ai.length === 8 && ai.every(c => c.review.due === '2026-10-08' && c.origin.lessonId === 'lesson.lab-isolation' && c.origin.by === 'ai' && !c.origin.edited && c.source.startsWith('AI-written for the Cybersecurity lesson'))
    && !ai.some(c => c.prompt.endsWith('(1)') || c.prompt.endsWith('(3)')));
  check('…a multiple-choice card still marks its right answer, whatever order its options are in', ai.filter(c => c.kind === 'choice').every(c => c.choices[c.correct] === 'Yes, it is listed' && c.choices.length === 3));
  check('…it says they come back tomorrow, with Undo', (await text('#cyAiCards')).includes('Added 8 cards to your revision') && await exists('[data-action="cy-cards-undo"]'));
  check('…and nothing else in your saved MyDay changed', (await rest()) === restBefore);
  await click('[data-action="cy-cards-undo"]'); await sleep(300);
  check('Undo takes them out again', !(await data()).study.concepts.some(c => c.origin) && (await data()).study.concepts.length === conceptsBefore);
  await click('[data-action="cy-cards-ask"]'); await sleep(1000); await click('[data-action="cy-cards-add"]'); await sleep(300);
  check('asking again and adding all ten', (await data()).study.concepts.filter(c => c.origin).length === 10);
  check('the lesson then says they\'re in your revision, and new ones won\'t repeat them', (await text('#cyAiCards')).length > 0 && (await click('[data-action="cy-cards-more"]'), await sleep(150), (await text('#cyAiCards')).includes('10 AI-written cards for this lesson are in your revision')));
  await click('[data-action="cy-cards-ask"]'); await sleep(1000);
  check('…and the same practice cards asked for again are all left out as repeats', (await ev(`document.getElementById('cyAiCards').dataset.phase`)) === 'review' && (await text('#cyAiCardsNone')).includes('No cards came through') && (await text('#cyAiCardsNotes')).includes('10 repeated questions you already have'));
  await click('[data-action="cy-cards-cancel"]'); await sleep(100);
  await on(8, 'study/cybersecurity');
  check('the next day, the map counts them in Cybersecurity\'s revision', (await text('[data-cy-revision]')).includes('10 AI-written cards') && await ev(`document.querySelector('[data-cy-revision]').dataset.cyRevision`) === 'due');
  await click('[data-action="cy-revise"]'); await sleep(900);
  check('"Revise Cybersecurity" asks them (a round of 5)', (await ev('location.hash')) === '#study/revise' && (await text('.st-q')).includes('Question 1 of 5') && (await text('.st-prompt')).startsWith('Practice helper (no AI)'));
  await click('[data-action="s-rev-show"], [data-action="s-rev-choose"][data-i="0"]'); await sleep(250);
  check('…its answer shows where it came from, with a link to the lesson', (await text('.st-q')).includes('Source: AI-written for the Cybersecurity lesson') && await exists('.st-q a[href="#study/cybersecurity/lesson.lab-isolation"]'));

  console.log('\n[J] The lesson journey: steps, Light / Normal / Deep, your place and the restart');
  await ev('localStorage.clear()'); await go('study/cybersecurity/lesson.learning-evidence');
  await until(() => exists('[data-cy-steps]'), 'the lesson journey');
  const cySteps = () => ev(`document.querySelector('[data-cy-steps]').dataset.cySteps`);
  check('the session choice groups the lesson\'s own sessions as Light, Normal and Deep', JSON.stringify(await ev(`[...document.querySelectorAll('#cyberMinutes optgroup')].map(g => g.label + ':' + [...g.children].map(o => o.value).join('+'))`)) === JSON.stringify(['Light:revision+short', 'Normal:practical', 'Deep:standard+extended']));
  await fill('#cyberMinutes', 'short'); await sleep(200);
  check('choosing the short session shows Understand and Check first, Try one tap away (and the first lesson has no warm-up)', (await cySteps()) === 'understand check' && (await ev(`document.querySelector('[data-cy-rest]').dataset.cyRest`)) === 'try');
  await click('[data-action="cyber-start-direct"]'); await until(() => exists('#stClock'), 'the lesson\'s timer');
  const timer = (await data()).study.sessions[0], started = await ev(`localStorage.getItem('myday.data.v4')`);
  check('the timer runs the session you chose: 15 minutes, short', timer.plannedMin === 15 && timer.short === true);
  await go('study/cybersecurity/lesson.learning-evidence'); await until(() => exists('[data-cy-steps]'), 'the lesson again');
  check('with its timer running the lesson adds Reflect, which finishes in the session', (await cySteps()) === 'understand check reflect' && await exists('#cy-step-reflect a[href="#study/session"]'));
  await click('[data-action="cy-step"][data-v="check"]'); await sleep(900);
  check('jumping to Check keeps your place for this session on this device, focus going there', (await ev(`JSON.parse(localStorage.getItem('myday.study.lessonStep'))['${timer.id}']`)) === 'check'
    && await ev(`document.activeElement === document.querySelector('#cy-step-check h3')`));
  check('…and the session you chose is remembered with it on this device (its minutes alone can\'t always tell)', (await ev(`JSON.parse(localStorage.getItem('myday.study.sessionLength'))['${timer.id}']`)) === 'short');
  check('…while you check yourself, the explanation folds away', await exists('[data-cy-folded]') && !(await exists('#cy-step-understand [data-teaching]')));
  await click('[data-action="cy-explain-again"]'); await sleep(200);
  check('"Show the explanation again" brings it back', await exists('#cy-step-understand [data-teaching]'));
  const firstQ = await ev(`document.querySelector('#cy-step-check [data-cy-question]').dataset.cyQuestion`);
  const guide = JSON.parse(fs.readFileSync(require('path').join(process.env.MYDAY_ROOT, 'app/src/study/cybersecurity/answers.json'), 'utf8'));
  await click('#cy-step-check [data-action="cy-reveal"]');
  await until(async () => (await text('#cy-step-check [data-cy-answer]')).includes(guide[firstQ]), 'the answer guide');
  check('Check compares with the answer guide on the page (focus on it), and offers the lab notebook to keep your answers', (await text('#cy-step-check [data-cy-answer]')).includes(guide[firstQ])
    && await ev(`!!document.activeElement.closest('[data-cy-answer]')`) && await exists('#cy-step-check a[href="#study/cybersecurity/assessment.learning-evidence-check"]'));
  await click('[data-action="cy-step"][data-v="check"]'); await sleep(400); // reading the explanation again moved your step; back to Check
  await go('study/cybersecurity/lesson.learning-evidence'); await until(() => exists('[data-cy-steps]'), 'the lesson reopened'); await sleep(900);
  check('reopening goes back to your step: Check, near the top of the screen', (await ev(`document.querySelector('[data-action="cy-step"][aria-current="step"]').dataset.v`)) === 'check'
    && await ev(`scrollY > 0 && (() => { const r = document.getElementById('cy-step-check').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight / 3; })()`));
  await click('[data-action="cy-restart"]'); await sleep(150);
  check('"I got distracted — help me restart" offers one small thing', (await text('[data-cy-restart]')).includes('You were on Check.') && (await text('[data-action="cy-restart-go"]')) === 'Answer one check');
  await click('[data-action="cy-restart-go"]'); await sleep(300);
  check('…and takes you to it, focus going along', await ev(`document.activeElement !== document.body && !!document.activeElement.closest('#cy-step-check')`));
  check('steps, the fold, the guide and the restart saved nothing: your data is as it was once the timer started', (await ev(`localStorage.getItem('myday.data.v4')`)) === started);
  await go('study/cybersecurity/lesson.authorised-scope'); await until(() => exists('[data-cy-steps]'), 'the next lesson');
  check('the next lesson warms up with the one before, now begun', await exists('#cy-step-warmup [data-cy-question]') && (await text('#cy-step-warmup')).includes('Learning through evidence'));
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go('study/cybersecurity/lesson.authorised-scope'); await until(() => exists('[data-cy-steps]'), 'the lesson on a phone');
  await ev(`window.scrollTo(0, document.getElementById('cy-step-check').offsetTop)`); await sleep(300);
  check('on a phone the step bar stays at the top in one row, steps at least 44 px tall, nothing sideways', await ev(`(() => { const r = document.querySelector('[data-cy-steps]').getBoundingClientRect(); return Math.round(r.top) === 0 && r.height <= 64; })()`)
    && await ev(`[...document.querySelectorAll('[data-action="cy-step"]')].every(b => b.getBoundingClientRect().height >= 44)`) && await ev('document.documentElement.scrollWidth === innerWidth'));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[K] The portfolio: adding a handed-in attempt, the secrets check, edit, remove and export');
  const pfAct = 'assessment.learning-evidence-check', pfHash = 'study/cybersecurity/' + pfAct;
  const pfList = async () => (await data()).cybersecurity.portfolio ?? [];
  const pfProblem = () => ev(`document.querySelector('[data-cy-pf-form] [data-cy-pf-problem]')?.textContent ?? ''`);
  const pfSaveDisabled = () => ev(`document.querySelector('[data-action="cy-pf-save"]').disabled`);
  const pfTick = async () => { for (let i = 0; i < 3; i++) await click(`[data-s="cy-pf-check"][data-i="${i}"]`); await sleep(100); };
  await ev('localStorage.clear()'); await go('study'); await go(pfHash);
  await until(() => exists('[data-action=cyber-begin]'), 'the knowledge check');
  const pfTitle = (await text('#app h2')).trim();
  check('before an attempt is handed in there is no "Add to portfolio"', !(await exists('[data-action="cy-pf-open"]')));
  await click('[data-action=cyber-begin]'); await sleep(150);
  await fill('#cyberVariant', 'Second recall');
  for (const id of await ev('[...document.querySelectorAll("textarea[id^=assessment]")].map(e => e.id)')) await fill(`[id="${id}"]`, 'My own answer.');
  await fill('#cyberEvidence', 'I explained the difference between reading and observable output.');
  await fill('#cyberResume', 'Try a fresh example.'); await fill('#cyberCritical', 'true');
  await click('[data-action=cyber-submit]'); await sleep(300);
  check('the attempt is handed in before it can be added', !!(await data()).cybersecurity.attempts[0].submittedAt && !(await pfList()).length);
  const pfAttempt = (await data()).cybersecurity.attempts[0];
  await until(() => exists('[data-action="cy-pf-open"]'), 'Add to portfolio');
  check('its notebook card offers "Add to portfolio"', (await text('[data-action="cy-pf-open"]')) === 'Add to portfolio' && (await ev(`document.querySelector('[data-cy-pf-from]').dataset.cyPfFrom`)) === '0');
  await click('[data-action="cy-pf-open"]'); await sleep(150);
  check('the form opens with the title and the attempt\'s evidence filled in', await exists('[data-cy-pf-form]')
    && (await ev(`document.querySelector('[data-s="cy-pf-title"]').value`)) === `${pfTitle}: Second recall`
    && (await ev(`document.querySelector('[data-s="cy-pf-evidence"]').value`)) === pfAttempt.evidence && (await ev(`document.querySelector('[data-s="cy-pf-note"]').value`)) === '', await ev(`document.querySelector('[data-s="cy-pf-title"]').value`));
  check('…with three unticked privacy checks, so Save is disabled', (await ev(`document.querySelectorAll('[data-cy-pf-privacy] [data-s="cy-pf-check"]').length`)) === 3 && (await ev(`[...document.querySelectorAll('[data-s="cy-pf-check"]')].every(c => !c.checked)`)) && await pfSaveDisabled());
  await pfTick();
  check('ticking all three enables Save when nothing looks like a secret', !(await pfSaveDisabled()) && !(await exists('[data-cy-pf-problem]')));
  await fill('[data-s="cy-pf-evidence"]', 'I tried to log in with password=hunter2 on my lab machine.');
  check('evidence with a password written out shows a warning and disables Save', (await pfProblem()) === 'This looks like a password or key written out. Remove or redact it first.' && await pfSaveDisabled() && (await ev(`document.querySelector('[data-cy-pf-problem]').getAttribute('role')`)) === 'alert', await pfProblem());
  await fill('[data-s="cy-pf-evidence"]', 'I tried to log in with password=<redacted> on my lab machine.');
  check('redacting it clears the warning and Save works again', !(await exists('[data-cy-pf-problem]')) && !(await pfSaveDisabled()));
  await fill('[data-s="cy-pf-note"]', '  Revisit after the scope lesson.  ');
  await click('[data-action="cy-pf-save"]'); await sleep(300);
  let pf = await pfList();
  check('saving adds one portfolio entry from the attempt, with the edited evidence, a trimmed note and today\'s date', pf.length === 1 && /^pf/.test(pf[0].id) && pf[0].attemptId === pfAttempt.id && pf[0].activityId === pfAct && pf[0].title === `${pfTitle}: Second recall`
    && pf[0].evidence === 'I tried to log in with password=<redacted> on my lab machine.' && pf[0].note === 'Revisit after the scope lesson.' && pf[0].reviewedOn === '2026-10-05' && !('fileIds' in pf[0]) , pf);
  check('the form closes and the card says where it is, offering to add it again', !(await exists('[data-cy-pf-form]')) && (await text('[data-cy-pf-from="1"]')).includes(`In your portfolio: ${pf[0].title}.`) && (await text('[data-action="cy-pf-open"]')) === 'Add it to your portfolio again', await text('[data-cy-pf-from]'));

  await click('nav[aria-label="Cybersecurity"] a[href="#study/cybersecurity/portfolio"]'); await sleep(300);
  check('the Cybersecurity nav has a Portfolio link, marked as the current page there', (await ev('location.hash')) === '#study/cybersecurity/portfolio'
    && (await ev(`document.querySelector('nav[aria-label="Cybersecurity"] a[aria-current="page"]')?.textContent`)) === 'Portfolio');
  check('the page counts "1 entry." and offers Export portfolio', (await text('[data-cy-portfolio="1"]')).includes('1 entry.') && (await text('[data-action="cy-pf-export"]')).includes('Export portfolio'));
  check('the entry sits under its module (h3) and its lesson (h4, a link to the lesson)', (await text('main h3, #app h3')).includes('Learning method, scope and lab setup')
    && (await ev(`document.querySelector('#app h4 a')?.getAttribute('href')`)) === '#study/cybersecurity/lesson.learning-evidence' && (await text('#app h4 a')) === 'Learning through evidence');
  const entrySel = `[data-cy-pf-entry="${pf[0].id}"]`;
  check('the entry shows its title, review date, evidence and note', (await text(entrySel + ' h5')) === pf[0].title && /^Reviewed .*5.* · self-study evidence/.test(await text(entrySel + ' p'))
    && (await text(entrySel + ' [data-cy-pf-evidence]')) === pf[0].evidence && (await text(entrySel)).includes('Note: Revisit after the scope lesson.'), await text(entrySel));

  await click('[data-action="cy-pf-edit"]'); await sleep(150);
  check('Edit opens the form filled in, with the privacy checks unticked and Save disabled', (await ev(`document.querySelector('[data-s="cy-pf-title"]').value`)) === pf[0].title && (await ev(`[...document.querySelectorAll('[data-s="cy-pf-check"]')].every(c => !c.checked)`)) && await pfSaveDisabled());
  await fill('[data-s="cy-pf-title"]', 'Reading versus observable output'); await pfTick();
  await click('[data-action="cy-pf-save"]'); await sleep(300);
  pf = await pfList();
  check('saving the edit changes the title in place, keeping today\'s review date', pf.length === 1 && pf[0].title === 'Reading versus observable output' && pf[0].reviewedOn === '2026-10-05' && (await text(entrySel + ' h5')) === 'Reading versus observable output' && !(await exists('[data-cy-pf-form]')));

  const dl = require('path').join(__dirname, 'dl');
  for (const f of fs.readdirSync(dl)) fs.unlinkSync(require('path').join(dl, f));
  let pfErrors = 0; T.setHandler(m => { if (m.method === 'Runtime.exceptionThrown') pfErrors++; });
  await click('[data-action="cy-pf-export"]');
  let zipName = ''; for (let i = 0; i < 40 && !zipName; i++) { await sleep(150); zipName = fs.readdirSync(dl).find(f => f.endsWith('.zip')) || ''; }
  check('Export portfolio downloads "MyDay Cybersecurity portfolio <date>.zip" without a page error', zipName === 'MyDay Cybersecurity portfolio 2026-10-05.zip' && pfErrors === 0, [zipName, pfErrors]);
  await sleep(200);
  const zipBytes = zipName ? fs.readFileSync(require('path').join(dl, zipName)) : Buffer.alloc(0);
  check('…and it is a zip holding the portfolio page with the entry', zipBytes.subarray(0, 2).toString() === 'PK' && zipBytes.includes('portfolio/index.html') && zipBytes.toString('latin1').includes('Reading versus observable output'), zipBytes.length);
  T.setHandler(null);
  for (const f of fs.readdirSync(dl)) fs.unlinkSync(require('path').join(dl, f));

  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await go('study/cybersecurity/portfolio');
  check('on a phone the portfolio page has no sideways scrolling', await ev('document.documentElement.scrollWidth <= innerWidth'));
  await go(pfHash); await until(() => exists('[data-action="cy-pf-open"]'), 'Add to portfolio on a phone');
  await click('[data-action="cy-pf-open"]'); await sleep(150);
  check('on a phone the privacy tick rows are at least 44 px tall and the page does not scroll sideways', await ev(`[...document.querySelectorAll('[data-s="cy-pf-check"]')].every(c => c.closest('label').getBoundingClientRect().height >= 44)`) && await ev('document.documentElement.scrollWidth <= innerWidth'));
  await T.send('Emulation.clearDeviceMetricsOverride');

  await go('study/cybersecurity/portfolio'); await until(() => exists('[data-action="cy-pf-remove"]'), 'the entry again');
  await click('[data-action="cy-pf-remove"]'); await sleep(250);
  check('Remove asks first, and cancelling keeps the entry', await exists('[data-action="dialog-confirm"]') && (await pfList()).length === 1);
  await click('[data-action="dialog-cancel"]'); await sleep(250);
  check('…keeping the entry after "Keep it"', (await pfList()).length === 1 && await exists(entrySel));
  await click('[data-action="cy-pf-remove"]'); await sleep(250); await click('[data-action="dialog-confirm"]'); await sleep(300);
  const pfAfter = await data();
  check('confirming removes the entry but leaves the attempt in the notebook', !(pfAfter.cybersecurity.portfolio ?? []).length && pfAfter.cybersecurity.attempts.some(a => a.id === pfAttempt.id && a.submittedAt));
  check('an empty portfolio says "Nothing yet." with a link to the lab notebook', (await text('[data-cy-portfolio="0"]')).includes('Nothing yet.') && await exists('[data-cy-portfolio="0"] a[href="#study/cybersecurity/notebook"]') && !(await exists('[data-action="cy-pf-export"]')));

  await go('study/cybersecurity/project.lab-notebook');
  await until(() => exists('[data-cy-skill-evidence]'), 'the project\'s required skills');
  const skillRows = await ev(`[...document.querySelectorAll('[data-cy-skill-evidence] li')].map(li => li.textContent)`);
  check('a project page lists each required skill as "no evidence yet" or "evidence in your notebook", never as a score', skillRows.length === 5 && skillRows.every(r => /— (no evidence yet|evidence in your notebook)$/.test(r)) && !(await text('[data-cy-skill-evidence]')).includes('/100'), skillRows);

  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
