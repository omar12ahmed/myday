import { useEffect, useState } from 'react';

// Explainers (specs/arabic-explainers.md): MyDay's own content (content/teaching/arabic/explainers.json), checked at
// every build by app/scripts/validate-explainers.mjs and loaded on demand, like the teaching. Shown by Explainers.tsx.
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
export type Explainers = Record<string, Explainer[]>; // by lesson id
let book: Promise<Explainers> | null = null;
const load = () => (book ??= import('../../../../content/teaching/arabic/explainers.json')
  .then(m => m.default.lessons as unknown as Explainers, e => { book = null; throw e; }));

// Every lesson's explainers, once loaded (null until then, and if they can't be: they're extra, so nothing shows).
export function useExplainers(): Explainers | null {
  const [b, setB] = useState<Explainers | null>(null);
  useEffect(() => {
    let live = true;
    load().then(x => { if (live) setB(x); }, () => {});
    return () => { live = false; };
  }, []);
  return b;
}
// An explainer by its id, with the lesson it's in.
export const findExplainer = (b: Explainers | null, id: string) => {
  for (const [lessonId, list] of Object.entries(b ?? {})) for (const e of list) if (e.id === id) return { lessonId, e };
  return null;
};
// The explainer for a course word, with the lesson it's in.
export const explainerFor = (b: Explainers | null, wordId: string) => {
  for (const [lessonId, list] of Object.entries(b ?? {})) for (const e of list) if (e.course_words?.includes(wordId)) return { lessonId, e };
  return null;
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
