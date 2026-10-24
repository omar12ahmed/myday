// Ask MyDay's lookups (specs/ai-tools.md §3): when an answer needs something from your notes, the app looks on this
// device — read-only, through the privacy rules (reach.ts) — and sends only what it found the second time round.
// "Search your notes": every word must appear, in any order, as in project search (capitals, accents and the kind of
// apostrophe don't matter). A note's text is searched, and a short snippet of it sent, only with "AI help with notes" on;
// otherwise only titles. Private notes, and notes in a private project, are never sent — not even how many matched: that
// count (`leftOut`) stays on this device, for the panel's "1 private note left out".
import { ASK_LIMITS as L, type AskLookup } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { noteName } from '../data/notes';
import { excerptOf, fold, wordsOf } from '../data/projectSearch';
import type { MyDayData } from '../data/types';
import { aiReach } from './reach';

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export function notesLookup(data: MyDayData, query: string): { lookup: AskLookup; leftOut: number } {
  const reach = aiReach(data), withText = !!data.patterns.prefs.aiNotes;
  const q = cut(query.trim().replace(/\s+/g, ' '), L.lookupQueryChars), words = wordsOf(q);
  const matches = (title: string, text: string) => words.length > 0 && words.every(w => fold(withText ? `${title}\n${text}` : title).includes(w));
  const all = data.notes.items.filter(n => matches(noteName(n), n.text));
  const shown = all.filter(n => reach.note(n)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const projectName = (id?: string | null) => { const p = id ? data.projects.items.find(x => x.id === id) : undefined; return p && reach.project(p) ? cut(p.title, L.titleChars) : null; };
  return {
    lookup: {
      tool: 'notes', query: q,
      notes: shown.slice(0, L.lookupNotes).map(n => ({
        id: n.id, title: cut(noteName(n), L.titleChars), project: projectName(n.projectId),
        snippet: withText ? (cut(excerptOf([n.text], words), L.lookupSnippetChars) || null) : null,
      })),
      found: shown.length, titlesOnly: !withText,
    },
    leftOut: all.length - shown.length,
  };
}

// "Looked in your notes for “van hire”: 3 notes (1 private left out)", for the panel.
export function lookupLine(l: AskLookup, held: number): string {
  const n = l.found;
  const found = n ? `${n === 1 ? 'one note' : `${n} notes`}${n > l.notes.length ? ` (the newest ${l.notes.length} sent)` : ''}` : 'nothing matched';
  const extra = [held ? `${held === 1 ? 'one private note' : `${held} private notes`} left out` : '', l.titlesOnly ? 'titles only, as AI help with notes is off' : ''].filter(Boolean);
  return `Looked in your notes for “${l.query}”: ${found}${extra.length ? ` — ${extra.join('; ')}` : ''}.`;
}
