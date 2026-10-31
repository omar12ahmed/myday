import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { BackLink } from '../components/parts';
import { compareView, exploringAWhile, exploringWords } from '../data/exploring';
import { hasResearch, optionEvidenceCounts } from '../data/research';
import type { MyDayData, Project } from '../data/types';
import { tabHref } from './planText';

// "You've been exploring a while" and comparing the options (specs/projects-exploring.md). The rules are in
// data/exploring.ts. Never a score, a ranking or a pick: the choice stays yours.
const enc = encodeURIComponent;
const compareHref = (p: Project) => `#projects/p/${enc(p.id)}/compare`;

// Asked once per spell at a step, on this device (`myday.projects.compareAsked`: project id → the day it moved there).
const ASKED_KEY = 'myday.projects.compareAsked';
const asked = (): Record<string, string> => { try { const v = JSON.parse(localStorage.getItem(ASKED_KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; } };
const answer = (id: string, since: string) => { try { localStorage.setItem(ASKED_KEY, JSON.stringify({ ...asked(), [id]: since })); } catch { /* asked again next visit */ } };

// The Overview's card: three weeks or more in Explore or Decide, asked once.
export function ExploringCard({ p }: { p: Project }) {
  const x = exploringAWhile(p), [gone, setGone] = useState(false);
  if (!x || gone || asked()[p.id] === x.since) return null;
  function notNow() { answer(p.id, x!.since); setGone(true); requestAnimationFrame(() => document.getElementById('projectTitle')?.focus()); }
  return (
    <Card aria-labelledby="exploringH" id="projectExploring" data-s="exploring">
      <h3 id="exploringH" className="m-0">{exploringWords(x)}</h3>
      <p className="m-0 mt-1 text-[15px]">Would it help to compare the strongest options and see what’s still missing?</p>
      <div className="flex flex-wrap gap-2.5 mt-3">
        <Button inline variant="primary" data-action="explore-compare" onClick={() => { answer(p.id, x.since); location.hash = compareHref(p); }}>Compare them</Button>
        <Button inline variant="ghost" data-action="explore-not-now" onClick={notNow}>Not now</Button>
      </div>
    </Card>
  );
}

// "Compare side by side" on the Decisions tab, whenever an open decision has two options or more.
export const CompareLink = ({ p }: { p: Project }) => (
  <a href={compareHref(p)} className="inline-flex items-center min-h-11 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4" data-action="dc-compare">Compare side by side</a>
);

// Comparing the options: each open decision's options side by side with their evidence, then what's still unknown.
export function CompareView({ data, p }: { data: MyDayData; p: Project }) {
  const c = compareView(data, p);
  useEffect(() => { requestAnimationFrame(() => document.getElementById('compareH')?.focus()); }, [p.id]);
  // (An option with nothing found opens Research when the project has it; otherwise its decision.)
  const decisions = tabHref(p, 'decisions'), research = hasResearch(p) ? tabHref(p, 'research') : decisions, model = tabHref(p, 'model');
  return (
    <div className="grid gap-3" data-s="compare">
      <BackLink to={`projects/p/${enc(p.id)}`} label="Overview" />
      <Card aria-labelledby="compareH">
        <h2 id="compareH" tabIndex={-1} className="m-0">Compare the options</h2>
        <p className="m-0 mt-1 text-[15px] text-fg-2">Side by side, in the order you added them — what each has going for it, and what you’ve found. The choice stays yours.</p>
      </Card>
      {c.decisions.length === 0 && (
        <Card data-s="compare-none">
          <p className="m-0 text-[15px]">There’s no open decision yet — what are you choosing between?</p>
          <a href={decisions} className="inline-flex items-center min-h-11 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4" data-action="compare-add-decision">Open Decisions</a>
        </Card>
      )}
      {c.decisions.map(({ decision, options }) => (
        <Card key={decision.id} aria-labelledby={`cmp-${decision.id}`} data-s="compare-decision" data-id={decision.id}>
          <h3 id={`cmp-${decision.id}`} className="m-0 break-words">{decision.question}</h3>
          {options.length === 0 ? <p className="m-0 mt-2 text-[15px] text-fg-2">No options yet — add two or three in Decisions.</p> : (
            <ul className={`list-none p-0 m-0 mt-3 grid gap-3 ${options.length > 1 ? 'sm:grid-cols-2' : ''} ${options.length > 2 ? 'lg:grid-cols-3' : ''}`}>
              {options.map(({ option, evidence, none }) => (
                <li key={option.id} className="rounded-tile border border-outline bg-surface-2 p-3 min-w-0" data-s="compare-option" data-id={option.id}>
                  <p className="m-0 font-semibold break-words">{option.text}</p>
                  {c.research && <p className="m-0 mt-1 text-sm text-fg-2" data-s="compare-evidence">{none ? 'Nothing found yet' : optionEvidenceCounts(evidence)}</p>}
                  {option.pros.length > 0 && <><p className="m-0 mt-2 text-sm font-semibold">For it</p><ul className="m-0 pl-5 text-[15px]">{option.pros.map((x, i) => <li key={i} className="break-words">{x}</li>)}</ul></>}
                  {option.cons.length > 0 && <><p className="m-0 mt-2 text-sm font-semibold">Against it</p><ul className="m-0 pl-5 text-[15px]">{option.cons.map((x, i) => <li key={i} className="break-words">{x}</li>)}</ul></>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
      <Card aria-labelledby="unknownH" data-s="compare-unknown">
        <h3 id="unknownH" className="m-0">What’s still unknown</h3>
        {!c.questions.length && !c.assumptions.length && !c.unknownOptions.length ? <p className="m-0 mt-2 text-[15px] text-fg-2">{c.research ? 'Nothing open that MyDay can see — every question answered, every option with something found.' : 'Nothing open that MyDay can see.'}</p> : (
          <ul className="list-none p-0 m-0 mt-2">
            {c.questions.map(q => <li key={q.id} className="border-t border-outline first:border-t-0" data-s="unknown" data-kind="question"><a href={research} className="block min-h-11 py-2 text-fg no-underline hover:underline underline-offset-4 break-words"><span className="text-sm text-fg-2">Question · </span>{q.text}</a></li>)}
            {c.assumptions.map(a => <li key={a.id} className="border-t border-outline first:border-t-0" data-s="unknown" data-kind="assumption"><a href={model} className="block min-h-11 py-2 text-fg no-underline hover:underline underline-offset-4 break-words"><span className="text-sm text-fg-2">Not checked yet · </span>{a.text}</a></li>)}
            {c.unknownOptions.map(o => <li key={o.option.id} className="border-t border-outline first:border-t-0" data-s="unknown" data-kind="option"><a href={research} className="block min-h-11 py-2 text-fg no-underline hover:underline underline-offset-4 break-words"><span className="text-sm text-fg-2">No findings yet about </span>{o.option.text}</a></li>)}
          </ul>
        )}
      </Card>
      {c.decisions.length > 0 && <p className="m-0 text-[15px]">When you’re ready, <a href={decisions} className="text-primary font-semibold" data-action="compare-decide">choose in Decisions</a> — it can change later.</p>}
    </div>
  );
}
