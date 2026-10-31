import { useEffect, useState } from 'react';

// Explainers (specs/arabic-explainers.md): MyDay's own content, authored in content/teaching/arabic/explainers.json and
// checked at every build by app/scripts/validate-explainers.mjs. The build splits it for loading
// (scripts/prepare-explainers.mjs): one file per module, loaded when a lesson in it opens, and a small index of where
// each card lives, its title and the course words that link to it. Shown by Explainers.tsx.
export interface Explainer {
  id: string; title_en: string; family_en: string; root_ar?: string; root_reading?: string; course_words?: string[];
  table: { form_en: string; ar: string; en: string }[];
  steps: string[];
  examples: { ar: string; en: string; words: { ar: string; en: string }[] }[];
  why: { q_en: string; a_en: string };
  // A hint shown after a first wrong choice, before the answer (optional: without one, the card asks for another go).
  selftest: { q_en: string; choices: string[]; answer: string; why_en: string; hint_en?: string }[];
  // Where this leads: a later explainer that builds on this one, and how (the owner's choice, 31 October 2026).
  leads_to?: { id: string; en: string }[];
}
// What a link needs to know about a card without loading it: its id and title.
export interface ExplainerRef { id: string; title_en: string }
// The index: each lesson's module file; each card's lesson and title; each course word's card.
export interface ExplainerIndex { chunks: Record<string, string>; cards: Record<string, [string, string]>; words: Record<string, string> }

let index: Promise<ExplainerIndex> | null = null;
const loadIndex = () => (index ??= import('./explainer-data/explainers-index.json')
  .then(m => m.default as unknown as ExplainerIndex, e => { index = null; throw e; }));
const files = import.meta.glob<{ lessons: Record<string, Explainer[]> }>('./explainer-data/explainers-arabic-*.json', { import: 'default' });
const modules = new Map<string, Promise<Record<string, Explainer[]>>>();
const loadModule = (m: string) => {
  let p = modules.get(m);
  if (!p) {
    const load = files[`./explainer-data/explainers-${m}.json`];
    p = load ? load().then(x => x.lessons, e => { modules.delete(m); throw e; }) : Promise.resolve({});
    modules.set(m, p);
  }
  return p;
};

// The index, once loaded (null until then, and if it can't be: explainers are extra, so nothing shows).
export function useExplainers(): ExplainerIndex | null {
  const [b, setB] = useState<ExplainerIndex | null>(null);
  useEffect(() => {
    let live = true;
    loadIndex().then(x => { if (live) setB(x); }, () => {});
    return () => { live = false; };
  }, []);
  return b;
}
// A lesson's explainers, once its module's file has loaded (an empty list if it has none, or can't load); kept with
// the lesson they're for, so another lesson never shows them while its own load.
export function useLessonExplainers(lessonId: string): Explainer[] | null {
  const [got, setGot] = useState<{ lessonId: string; list: Explainer[] } | null>(null);
  useEffect(() => {
    let live = true;
    loadIndex().then(i => i.chunks[lessonId] ? loadModule(i.chunks[lessonId]).then(m => m[lessonId] ?? []) : [])
      .then(list => { if (live) setGot({ lessonId, list }); }, () => { if (live) setGot({ lessonId, list: [] }); });
    return () => { live = false; };
  }, [lessonId]);
  return got?.lessonId === lessonId ? got.list : null;
}
// An explainer by its id, with the lesson it's in.
export const findExplainer = (b: ExplainerIndex | null, id: string): { lessonId: string; e: ExplainerRef } | null => {
  const c = b?.cards[id];
  return c ? { lessonId: c[0], e: { id, title_en: c[1] } } : null;
};
// The explainer for a course word, with the lesson it's in.
export const explainerFor = (b: ExplainerIndex | null, wordId: string) => {
  const id = b?.words[wordId];
  return id ? findExplainer(b, id) : null;
};

// An explainer a link asked to open (from another page): kept in memory only, used once by the next page for that lesson,
// and only within a few seconds of the tap, exactly like a step a link asks for (journey/pending.ts).
let pending: { lessonId: string; id: string; at: number } | null = null;
export const askExplainer = (lessonId: string, id: string) => { pending = { lessonId, id, at: Date.now() }; };
export function takeExplainer(lessonId: string): string | null {
  const id = pending?.lessonId === lessonId && Date.now() - pending.at < 5000 ? pending.id : null;
  pending = null;
  return id;
}
