import { ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { BackLink, LinkButton } from '../components/parts';
import { sendsFor } from '../ai/askContext';
import { AI_MODE } from '../ai/request';
import type { AskPage } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { CATEGORIES } from '../data/patterns/saved';
import { CAT_LABEL } from '../data/plan';
import type { MyDayData } from '../data/types';
import { AiNotesCard } from '../notes/AiNotesCard';
import { AI_CONNECT_PER_DAY } from '../shell/aiConnect';

// What MyDay knows (#knows): where your things are kept, exactly what each kind of AI help sends and when, which model
// does which job, and what's never sent. Linked from Ask MyDay's preview and the footer. Ask's lines come from the same
// words as its "Sent to the AI" preview (askContext.ts SENDS), so the two can't drift apart.

// Pages, grouped where they send the same.
const PAGES: { label: string; page: AskPage }[] = [
  { label: 'Today', page: 'today' }, { label: 'A task', page: 'task' }, { label: 'Calendar', page: 'calendar' },
  { label: 'A project', page: 'project' }, { label: 'A note', page: 'note' }, { label: 'Study', page: 'study' },
  { label: 'A course on your roadmap', page: 'course' }, { label: 'Tasks, Projects, Notes and other pages', page: 'projects' },
  { label: 'Health and Finance', page: 'finance' }, { label: 'Your week (the weekly review)', page: 'review' },
];
// The other AI help, each only when you tap it (the request shapes are in supabase/functions/_shared/ai/).
const OTHER: [string, string][] = [
  ['Help me adjust today', 'today’s plan (task titles — a private project’s task only as “a private task” — lengths, times), your energy and sleep, busy times from your calendar (as “appointment” or “work”, without titles), your free time, how much revision is due, and what you write'],
  ['Add what’s on my mind', 'only what you write, and the date'],
  ['AI help with notes', `a few notes MyDay can’t place by itself (never the one you have open, or one changed in the last few minutes), and your open projects’ names and summaries (projects you’ve made private included — their name and summary only) — only once you switch it on, at most ${AI_CONNECT_PER_DAY} times a day on each device`],
  ['Make revision cards (on a note)', 'that one note (lines you’ve left out replaced by a placeholder), and the questions already in your revision from it — never a private note, or a note in a private project'],
  ['Ask the tutor (Cybersecurity)', 'which lesson you’re on and your question'],
  ['More practice (Cybersecurity)', 'which lesson, and the questions already in your revision for it'],
  ['Explain it another way', 'the question, its answer and the explanation you’ve seen, your own answer and how it went — and, for a Cybersecurity check, which lesson — never for a card made from a private note, or a note in a private project'],
];
// Which model does which job — set on the server (AI_ROUTES); keep this list aligned with the server configuration.
const MODELS: [string, string][] = [
  ['GLM-5.3-Flash (Z.ai)', 'Ask MyDay, Help me adjust today, Add what’s on my mind, AI help with notes, the Cybersecurity tutor, explaining Cybersecurity and your own concepts another way, writing cards from your notes, and checking Cybersecurity lesson cards'],
  ['Gemini 3.8 Flash (Google)', 'writing Cybersecurity lesson cards, checking a note before cards are made from it, checking cards from your notes, and explaining Arabic another way'],
];

export function KnowsScreen({ data }: { data: MyDayData }) {
  const privateNotes = data.notes.items.filter(n => n.private).length, privateProjects = data.projects.items.filter(p => p.private).length;
  const aiNotes = !!data.patterns.prefs.aiNotes;
  // Your own preferences and answers (What MyDay has noticed), in words.
  const pr = data.patterns.prefs, name = typeof pr.name === 'string' ? pr.name.trim() : '';
  const yes = Object.values(data.patterns.answers).filter(a => a.said === 'yes').length;
  const kept = [
    name ? `What to call you: ${name}` : 'No name saved',
    pr.maxTasks ? `At most ${pr.maxTasks.value} task${pr.maxTasks.value === 1 ? '' : 's'} a day` : null,
    ...CATEGORIES.map(c => (pr.maxMinutes[c] ? `${CAT_LABEL[c]} tasks up to ${pr.maxMinutes[c]!.value} minutes` : null)),
    yes ? `${yes} pattern${yes === 1 ? '' : 's'} you said ${yes === 1 ? 'is' : 'are'} right` : null,
    `AI help with notes: ${aiNotes ? 'on' : 'off'}`,
  ].filter((x): x is string => !!x);
  return (
    <div className="max-w-[720px] mx-auto" id="knows">
      <BackLink to="today" label="Today" />
      <Card aria-labelledby="knows-h">
        <h2 id="knows-h" className="flex items-center gap-2"><ShieldCheck size={22} aria-hidden="true" className="text-primary" /> What MyDay knows</h2>
        <p className="text-[15px] m-0">Everything you enter is kept in this browser, and in your account when you’re signed in (only your sign-in can read it). MyDay’s own suggestions, links and patterns are worked out on this device.</p>
        <p className="text-[15px] text-fg-2 mb-0 mt-2" data-s="knows-mode">{AI_MODE === 'off' ? 'AI help isn’t set up in this copy of MyDay, so nothing is ever sent to an AI.'
          : AI_MODE === 'mock' ? 'This copy of MyDay uses the practice helper: nothing is sent anywhere.'
          : 'An AI sees something only when you tap for its help (or switch on AI help with notes), and only what’s listed here.'}</p>
      </Card>

      <Card aria-labelledby="knows-keeps-h" id="knowsKeeps">
        <h3 id="knows-keeps-h">What MyDay keeps about how you work</h3>
        <ul className="m-0 pl-5 grid gap-1.5 text-[15px]" data-s="knows-prefs">
          {kept.map(x => <li key={x}>{x}</li>)}
        </ul>
        <p className="text-sm text-fg-3 m-0 mt-2">Yours to change — MyDay never adds to these by itself, and none of them is sent to the AI. <LinkButton data-action="knows-noticed" className="text-sm" onClick={() => { location.hash = 'noticed'; window.scrollTo(0, 0); }}>See or change them in What MyDay has noticed</LinkButton></p>
      </Card>

      <Card aria-labelledby="knows-ask-h" id="knowsAsk">
        <h3 id="knows-ask-h">When you tap Ask MyDay</h3>
        <p className="text-[15px] text-fg-2 m-0">It sends what you typed and the page you’re on, with that page’s small slice of your data. You see the slice itself before every request, under “Sent to the AI with what you type”.</p>
        <dl className="m-0 mt-3 grid gap-2.5">
          {PAGES.map(p => (
            <div key={p.page} data-page={p.page}>
              <dt className="font-semibold text-[15px]">{p.label}</dt>
              <dd className="m-0 text-[15px] text-fg-2">{cap(sendsFor(p.page, aiNotes))}.</dd>
            </div>))}
        </dl>
        <p className="text-[15px] m-0 mt-3" data-s="knows-lookup"><strong>If your question needs your notes</strong> (“what did I write about the van hire?”), Ask MyDay looks in them on this device and sends up to 8 that match: their titles and projects{aiNotes ? ' and, as AI help with notes is on, a short snippet' : ' only, as AI help with notes is off (a short snippet once it’s on)'}. Never a private note, or a note in a private project — not even whether one matched. It says what it looked for above the answer, and that second request counts towards the day’s limit. <strong>If it needs a day</strong> (“am I free on Thursday?”), it looks at that one day the same way: its plan’s tasks, what’s due, busy times by kind only (never an appointment’s name), free time and energy — never a private project’s tasks (its appointments only as busy time, so the day isn’t shown free when it isn’t). <strong>If it needs one of your projects</strong> (“what’s next on the flat move?”), it looks at that open project the same way and sends what its own page sends: its name, summary, stage, tasks, milestones and note titles{aiNotes ? ' and text' : ''} — never a private project, and never its outcome, what counts as finished or where you left off. <strong>If it needs your open decisions</strong> (“which decisions am I putting off?”), it looks at the ones with nothing chosen yet and sends each one’s question, its options with how many pros and cons each has (not what they say) and the day it was opened, plus what a business idea still has to check — never a private project’s, and never your reasons, earlier choices or what you found. It never picks an option for you.</p>
        <p className="text-sm text-fg-3 m-0 mt-3">On a project, “Suggest milestones” sends the same; on a decision, “What am I missing?” also sends that one decision — its question, options, pros and cons. Suggestions never choose an option for you. On a business idea’s Model tab, Ask also sends its one page — your three answers, and what must be true with how each is turning out (never what you found) — and from nowhere else; “Suggest what must be true” sends the same, and never says whether the idea will work. A project’s notes’ text goes only with AI help with notes switched on. Nothing changes until you tick it and tap Add or Apply, and Ask never deletes anything or ticks anything off.</p>
      </Card>

      <Card aria-labelledby="knows-other-h" id="knowsOther">
        <h3 id="knows-other-h">The other AI help — only when you tap it</h3>
        <dl className="m-0 grid gap-2.5">
          {OTHER.map(([what, sends]) => (
            <div key={what}><dt className="font-semibold text-[15px]">{what}</dt><dd className="m-0 text-[15px] text-fg-2">{cap(sends)}.</dd></div>))}
        </dl>
      </Card>

      <AiNotesCard data={data} />

      <Card aria-labelledby="knows-never-h" id="knowsNever">
        <h3 id="knows-never-h">Never sent</h3>
        <ul className="m-0 pl-5 grid gap-1.5 text-[15px]">
          <li data-s="knows-private">Notes you’ve marked private — by any AI help, ever.{privateNotes > 0 && ` You have ${privateNotes === 1 ? 'one' : privateNotes} at the moment.`}</li>
          <li data-s="knows-private-projects">Projects you’ve made private — by any AI help: not their name, summary, milestones, decisions, one page, tasks, notes or appointments. Help me adjust today sends one of their tasks on today’s plan only as “a private task”, and no revision cards are made from their notes. (AI help with notes can still suggest one as a place for a note, by its name and summary — your choice.) A case’s timeline, evidence and issues are never sent, private or not.{privateProjects > 0 && ` You have ${privateProjects === 1 ? 'one' : privateProjects} at the moment.`}</li>
          <li>Your name, your account’s email address, and your preferences and patterns (What MyDay has noticed works on this device).</li>
          <li>Your Finance records, and your Health records — Help me adjust today sees only when you’re working out, as busy time.</li>
        </ul>
      </Card>

      <Card aria-labelledby="knows-memory-h" id="knowsMemory">
        <h3 id="knows-memory-h">The AI remembers nothing</h3>
        <p className="text-[15px] m-0">The AI has no memory of you: each request stands on its own, sent by MyDay’s server without your name or account details. MyDay keeps your history itself, on your devices and in your account. Ask MyDay allows one follow-up, which sends its earlier answer back with it; nothing of the conversation is kept after you close it. MyDay’s server records how many requests you’ve made and what they cost — never what was in them.</p>
      </Card>

      <Card aria-labelledby="knows-models-h" id="knowsModels">
        <h3 id="knows-models-h">Which AI does which job</h3>
        <dl className="m-0 grid gap-2.5">
          {MODELS.map(([model, jobs]) => (
            <div key={model}><dt className="font-semibold text-[15px]">{model}</dt><dd className="m-0 text-[15px] text-fg-2">{cap(jobs)}.</dd></div>))}
        </dl>
        <p className="text-sm text-fg-3 m-0 mt-3">Chosen by testing on made-up material, judged on accuracy and teaching quality. Everything an AI writes is labelled as AI-written and is only a suggestion.</p>
      </Card>

      <Card aria-labelledby="knows-limits-h" id="knowsLimits">
        <h3 id="knows-limits-h">Limits</h3>
        <p className="text-[15px] m-0">At most 20 AI requests a day for your account, a short pause between them, and a small monthly spending cap, all kept on MyDay’s server. Only signed-in accounts can use AI help.</p>
      </Card>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
