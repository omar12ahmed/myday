// Direct check of Ask MyDay's conversation on the live ai-plan Edge Function (tests/live/run.py ask-conversation-api.mjs),
// before and after deploying instructions v25, on one disposable account. Refusals first (no model call): a conversation
// together with the older single follow-up, a lookup "made for an earlier message" with no lookup, 13 exchanges, a day's
// free time below zero. Then one real request with a conversation (one of the account's 20 a day): accepted, with a
// "left" count and a reply the app can read. Straight after it, the older single follow-up (as the published app sends
// it) is held only by the pause between requests, never refused as a bad request. `--expect v24` checks the old server
// instead (it refuses every conversation). `MYDAY_EXPECT=v26` also sends "how you work" with the conversation. `MYDAY_EXPECT=v27-before` (the v26 server, before
// deploying v27) shows a request carrying "thinking" is refused, so the app must follow the deploy; `MYDAY_EXPECT=v27` sends
// "thinking" with the conversation and asks one open question, whose choices must be ones the app can read.
// `MYDAY_EXPECT=v28-before` (the v27 server, before deploying v28) shows a request offering the look at your ambitions is
// refused, so the app must follow the deploy; `MYDAY_EXPECT=v28` offers it with the conversation, asks "what am I working
// towards?" (it should ask to look) and then answers from made-up ambitions' titles (three model calls). Never prints
// the account's details or tokens. Only with the owner's yes.
const env = process.env, URL_ = (env.SUPABASE_URL || '').replace(/\/+$/, ''), KEY = env.SUPABASE_PUBLISHABLE_KEY || '', SITE = 'https://omar12ahmed.github.io';
if (!process.argv.includes('--live') || !env.MYDAY_LIVE_EMAIL?.endsWith('@example.com') || !KEY.startsWith('sb_publishable_')) {
  console.log('Refused: run it through tests/live/run.py (a disposable account and the publishable key).'); process.exit(2);
}
const OLD = (process.argv[process.argv.indexOf('--expect') + 1] || '') === 'v24' || env.MYDAY_EXPECT === 'v24';
process.on('unhandledRejection', e => { let m = String(e?.message || e); for (const v of [env.MYDAY_LIVE_EMAIL, env.MYDAY_LIVE_PASSWORD]) if (v) m = m.split(v).join('[redacted]'); console.log('HARNESS ' + m); process.exit(1); });
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !extra ? '' : '  — ' + extra}`); };

const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: env.MYDAY_LIVE_EMAIL, password: env.MYDAY_LIVE_PASSWORD }) });
const token = (await r.json()).access_token;
if (!token) { console.log('HARNESS sign-in failed ' + r.status); process.exit(1); }
const ask = async context => {
  const res = await fetch(`${URL_}/functions/v1/ai-plan`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Origin: SITE }, body: JSON.stringify({ context }) });
  let j = {}; try { j = await res.json(); } catch { /* not JSON */ }
  return { status: res.status, j };
};
const now = new Date(), pad = n => String(n).padStart(2, '0');
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
const base = { version: 1, action: 'ask', date, weekday, time: `${pad(now.getHours())}:${pad(now.getMinutes())}`, page: 'other', context: {}, can: ['day', 'search'] };
const EX = { asked: 'What does a good weekly review look like? (made up)', answered: 'Look back at what moved, what you’re waiting on and what matters next week, in about 20 minutes.' };
const V27 = env.MYDAY_EXPECT === 'v27', BEFORE27 = env.MYDAY_EXPECT === 'v27-before', THINK = { asked: 0, most: 5 };
const V28 = env.MYDAY_EXPECT === 'v28', BEFORE28 = env.MYDAY_EXPECT === 'v28-before', CANG = [...base.can, 'goals'];
const GOALS = { tool: 'goals', query: 'all', found: 2, ambitions: ['Learn to sail (made up)', 'Write a short book (made up)'] };
const conv = { ...base, text: 'and how long should it take?', conversation: { earlier: [EX], leftOut: 0 }, ...(['v26', 'v27', 'v28'].includes(env.MYDAY_EXPECT) ? { howYouWork: ['Learning tasks: 20 min at most'] } : {}), ...(V27 || V28 ? { thinking: THINK } : {}), ...(V28 ? { can: CANG } : {}) };
const day = { tool: 'day', query: date, weekday, planned: false, rest: false, energy: null, tasks: [], minutesLeft: 0, due: [], busy: [], free: [{ start: '09:00', end: '17:00' }] };

const bad = [
  ['a conversation with the older single follow-up too', { ...conv, followUp: { previous: 'x', text: 'y' } }],
  ['a lookup "made for an earlier message" without a lookup', { ...conv, conversation: { ...conv.conversation, lookupFromEarlier: true } }],
  ['13 exchanges', { ...conv, conversation: { earlier: Array.from({ length: 13 }, () => EX), leftOut: 0 } }],
  ['a day\'s free time below zero', { ...base, text: 'Am I free today?', lookup: { ...day, freeMinutes: -1 } }],
  ['how you work: more than 8 lines (v26)', { ...base, text: 'x', howYouWork: Array.from({ length: 9 }, (_, i) => `Line ${i}`) }],
  ['how you work: a line over 120 characters (v26)', { ...base, text: 'x', howYouWork: ['x'.repeat(121)] }],
  ['thinking: a limit over 5 (v27)', { ...base, text: 'x', thinking: { asked: 0, most: 6 } }],
  ['thinking: a field it doesn\'t know (v27)', { ...base, text: 'x', thinking: { ...THINK, why: 'x' } }],
  ['your ambitions: 13 titles in the look (v28)', { ...base, text: 'x', can: CANG, lookup: { ...GOALS, found: 13, ambitions: Array.from({ length: 13 }, (_, i) => `Ambition ${i}`) } }],
  ['your ambitions: an ambition\'s why in the look (v28)', { ...base, text: 'x', can: CANG, lookup: { ...GOALS, why: 'x' } }],
];
for (const [why, c] of bad) { const x = await ask(c); check(`refused as a bad request: ${why}`, x.status === 400, `${x.status} ${JSON.stringify(x.j).slice(0, 120)}`); }

if (BEFORE27) {
  const t = await ask({ ...base, text: 'x', thinking: THINK });
  check('the v26 server refuses a request carrying "thinking" (so publish the app only after deploying v27)', t.status === 400, `${t.status}`);
}
if (BEFORE28) {
  const g = await ask({ ...base, text: 'x', can: CANG });
  check('the v27 server refuses a request offering the look at your ambitions (so publish the app only after deploying v28)', g.status === 400, `${g.status}`);
}
const ok = await ask(conv);
if (OLD) check('the v24 server refuses a conversation (so publish the app only after deploying)', ok.status === 400, `${ok.status}`);
else {
  let reply = null; try { reply = JSON.parse(ok.j.output); } catch { /* checked below */ }
  check('a conversation is accepted and answered (one model call)', ok.status === 200 && ok.j.ok === true && !!reply && typeof reply.message === 'string' && reply.message.length > 0, `${ok.status} ${JSON.stringify(ok.j).slice(0, 160)}`);
  check('…with how many of the day\'s requests are left', Number.isInteger(ok.j.left) && ok.j.left >= 0 && ok.j.left < 20, `left: ${ok.j.left}`);
  const older = await ask({ ...base, text: 'What does a good weekly review look like? (made up)', followUp: { previous: EX.answered, text: 'and how long should it take?' } });
  check('the older single follow-up (the published app) is still accepted: held only by the pause between requests', older.status === 429 || older.status === 200, `${older.status} ${JSON.stringify(older.j).slice(0, 120)}`);
  if (V27) {
    // An open question (made up), after the pause between requests: an answer, and any choices as the app reads them.
    await new Promise(res => setTimeout(res, 7000));
    const open = await ask({ ...base, text: 'I want to start a small side project but I am not sure what (made up)', thinking: THINK });
    let q = null; try { q = JSON.parse(open.j.output); } catch { /* checked below */ }
    check('v27: an open question with "thinking" is accepted and answered', open.status === 200 && open.j.ok === true && !!q && typeof q.message === 'string', `${open.status} ${JSON.stringify(open.j).slice(0, 160)}`);
    check('…its choices, if any, are on an answer with no action: 1 to 4, each 1–40 characters', !q?.choices || (q.kind === 'answer' && !q.action && Array.isArray(q.choices) && q.choices.length >= 1 && q.choices.length <= 4 && q.choices.every(c => typeof c === 'string' && c.length > 0 && c.length <= 40)), JSON.stringify(q).slice(0, 240));
    console.log(`(the open question was answered as "${q?.kind}"${q?.choices ? ` with ${q.choices.length} choices` : ' without choices'})`);
  }
  if (V28) {
    // Asked about their goals with the look on offer, then answered from made-up titles, each after the pause.
    await new Promise(res => setTimeout(res, 7000));
    const want = await ask({ ...base, text: 'What am I working towards?', can: CANG, thinking: THINK });
    let w = null; try { w = JSON.parse(want.j.output); } catch { /* checked below */ }
    check('v28: "What am I working towards?" with the look on offer asks to look at your ambitions', want.status === 200 && w?.kind === 'lookup' && w.lookup?.tool === 'goals', `${want.status} ${JSON.stringify(want.j).slice(0, 200)}`);
    await new Promise(res => setTimeout(res, 7000));
    const got = await ask({ ...base, text: 'What am I working towards?', can: CANG, thinking: THINK, lookup: GOALS });
    let a = null; try { a = JSON.parse(got.j.output); } catch { /* checked below */ }
    check('…and with the look, answers from the titles it was sent', got.status === 200 && a?.kind === 'answer' && /sail/i.test(a.message) && /book/i.test(a.message), `${got.status} ${JSON.stringify(got.j).slice(0, 240)}`);
    console.log(`(the answer: "${String(a?.message ?? '').slice(0, 200)}")`);
  }
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
