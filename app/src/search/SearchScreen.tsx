import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { Note } from '../components/parts';
import { todayKey } from '../data/dates';
import { openOnArrival } from '../data/projectSections';
import { foundCount, searchEverywhere, type CourseIndex, type Found } from '../data/searchAll';
import type { MyDayData } from '../data/types';

// "#search?q=…" → what was typed (Back from a result brings it back).
function queryOf(hash: string): string {
  const m = /^#search\?q=(.*)$/.exec(hash);
  if (!m) return '';
  try { return decodeURIComponent(m[1]); } catch { return ''; }
}

// For things with no page of their own (a kept word, a Finance card): once their screen is open, bring them into view
// and focus them, waiting a little for the screen to draw.
function focusWhenThere(selector: string) {
  let tries = 0;
  const look = () => {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      if (!el.matches('a, button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
      el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true });
    } else if (++tries < 40) setTimeout(look, 100);
  };
  setTimeout(look, 50);
}

// Search everywhere (specs/search-everywhere.md): one field, and what was found in each section, in a fixed order, each
// a link that opens it. Only what's on this device is searched; nothing is saved but the words in the address.
export function SearchScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const [q, setQ] = useState(() => queryOf(hash));
  const [courses, setCourses] = useState<CourseIndex | null>(null);
  const [coursesFailed, setCoursesFailed] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => { field.current?.focus(); }, []);
  // Going to Search again while it's open (the header's button, or Back to a search's address) takes that address's
  // words — App's own hash doesn't change for it, since typing only replaces the address.
  useEffect(() => {
    const onHash = () => { if (location.hash.startsWith('#search')) { setQ(queryOf(location.hash)); field.current?.focus(); } };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // The course lessons' titles come from the two course catalogues, which are only loaded now.
  useEffect(() => {
    let live = true;
    import('./courseIndex').then(m => { if (live) setCourses(m.courseIndex()); }).catch(() => { if (live) setCoursesFailed(true); });
    return () => { live = false; };
  }, []);
  // What you typed is kept in the address (replacing, so Back leaves Search rather than undoing letters).
  useEffect(() => {
    const want = q.trim() ? `#search?q=${encodeURIComponent(q)}` : '#search';
    if (location.hash !== want) history.replaceState(history.state, '', want);
  }, [q]);
  // The field keeps up with your typing; the search follows when it can (a big account can take a moment).
  const asked = useDeferredValue(q);
  const result = useMemo(() => searchEverywhere(data, asked, courses, todayKey()), [data, asked, courses]);
  const typed = asked.trim().length > 0;

  return (
    <div className="max-w-[720px] mx-auto" id="search">
      <Card aria-labelledby="searchH">
        <h2 id="searchH" className="sr-only">Search MyDay</h2>
        <Field label="Search MyDay" htmlFor="searchAll">
          <TextInput ref={field} id="searchAll" type="search" value={q} autoComplete="off" spellCheck={false}
            onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Escape' && q) { e.preventDefault(); setQ(''); } }} />
        </Field>
        <p role="status" className={`m-0 mt-2 ${typed ? 'font-semibold text-fg' : 'text-[15px] text-fg-2'}`} id="searchCount">
          {typed ? foundCount(result.total, asked) : 'Your tasks, projects, notes, calendar, study, finance and health. Every word you type has to be there, in any order.'}
        </p>
        {result.leftOut && <div data-s="search-private"><Note className="mb-0 mt-2">Private projects and notes aren’t searched here. Search inside them on their own pages.</Note></div>}
        {typed && !courses && !coursesFailed && <p className="text-sm text-fg-2 m-0 mt-1" data-s="search-courses-loading">Still looking in the course lessons…</p>}
        {coursesFailed && <p className="text-sm text-fg-2 m-0 mt-1" data-s="search-courses-failed">The course lessons couldn’t be searched just now — everything else was.</p>}
      </Card>
      {result.sections.map(s => (
        <Card key={s.section} aria-labelledby={`searchH-${s.section}`} data-s="search-section" data-section={s.section}>
          <h3 id={`searchH-${s.section}`} className="m-0">{s.label} <span className="text-fg-2 font-normal">· {s.items.length + s.more}</span></h3>
          <ul className="list-none p-0 m-0 mt-2">{s.items.map(f => <Hit key={`${f.kind}:${f.id}`} f={f} />)}</ul>
          {s.more > 0 && <div data-s="search-more"><Note className="mb-0 mt-2">And {s.more} more — add a word to narrow it down.</Note></div>}
        </Card>
      ))}
    </div>
  );
}

function Hit({ f }: { f: Found }) {
  const meta = [f.kind, f.where, ...f.tags].filter(Boolean).join(' · ');
  const excerpt = f.excerpt && f.excerpt !== f.where ? f.excerpt : ''; // (a kept word's meaning is already its "where")
  return (
    <li className="border-t border-outline first:border-t-0" data-s="search-hit" data-kind={f.kind}>
      <a href={f.href} onClick={e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // (opening it elsewhere: just the link)
        if (f.opens) openOnArrival(f.opens.projectId, f.opens.section); // a link in a folded or hidden Resources card
        if (f.focus) focusWhenThere(f.focus);
      }}
        className="block min-h-11 py-2.5 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2">
        <span className="block text-sm text-fg-2 break-words" dir="auto">{meta}</span>
        {/* An Arabic word reads right to left but sits where every other title starts. */}
        <span className="block font-medium break-words">{f.lang ? <bdi lang={f.lang} dir="rtl" className="ar-inline">{f.title}</bdi> : f.title}</span>
        {excerpt && <span className="block text-sm text-fg-2 break-words mt-0.5" data-s="search-excerpt" dir="auto">{excerpt}</span>}
      </a>
    </li>
  );
}
