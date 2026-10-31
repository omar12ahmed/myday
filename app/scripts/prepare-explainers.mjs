// Explainers for the app (specs/arabic-explainers.md §5): the authored file stays one file,
// content/teaching/arabic/explainers.json (checked by validate-explainers.mjs). Here it's split for loading, like the
// course itself (prepare-arabic.mjs): one file per module, loaded when a lesson in it opens, and a small index of where
// each card lives, its title and the course words that link to it, for Vocabulary's links and a card's
// "where this leads". Written to src/study/arabic/explainer-data/, which this script empties and rewrites (so a module
// that loses its explainers loses its file) — kept out of src/study/arabic/data/, which prepare-arabic.mjs empties.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = p => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8'));
const target = fileURLToPath(new URL('../src/study/arabic/explainer-data/', import.meta.url));
const course = read('../../content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json');
const { lessons } = read('../../content/teaching/arabic/explainers.json');
const short = id => id.split('.').pop();
const moduleOf = new Map(course.lessons.map(l => [l.id, short(l.module_id)]));

const index = { chunks: {}, cards: {}, words: {} }, byModule = {};
for (const [lessonId, list] of Object.entries(lessons)) {
  const m = moduleOf.get(lessonId);
  if (!m) throw new Error(`Explainers: ${lessonId} isn't a lesson in the course`);
  index.chunks[lessonId] = m;
  (byModule[m] ??= {})[lessonId] = list;
  for (const e of list) {
    index.cards[e.id] = [lessonId, e.title_en];
    for (const w of e.course_words ?? []) index.words[w] = e.id;
  }
}
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
// Named "explainers-…" so each loads as a chunk of its own name (explainers-arabic-verb-expansion-….js), apart from
// the course's module of the same name.
writeFileSync(target + 'explainers-index.json', JSON.stringify(index));
for (const [m, byLesson] of Object.entries(byModule)) writeFileSync(target + `explainers-${m}.json`, JSON.stringify({ lessons: byLesson }));
