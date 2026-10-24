// Sayings (owner's request, 24 Oct 2026): one quiet line per screen, chosen for where you are. This is authored content,
// not saved data. Attributions stay honest: a well-known rendering says "paraphrase", an uncertain one says "attributed",
// and the two lessons are the owner's own takeaways, shown with their meaning. A quotation that leaves words out shows "…".
// Gentle by context: the demanding lines (systems, "conceive and believe") appear only in planning and building places,
// never on a rest day or a low-energy day, where they could read as blame.
import type { DateKey } from './types';

export type SayingPlace = 'today' | 'today-gentle' | 'study' | 'money' | 'projects' | 'review';
export interface Saying {
  id: string;
  text: string;            // the English
  ar?: [string, string];   // the vowelled Arabic verse, as its two halves
  by?: string;             // absent for the owner's own lessons
  source?: string;         // the work, where known
  attributed?: true;       // commonly attributed, not certain
  paraphrase?: true;       // a well-known rendering, not word for word
  meaning?: string;        // the lessons' "Meaning"
  places: SayingPlace[];
}

export const SAYINGS: Saying[] = [
  { id: 'shafii-days', text: 'Let the days do as they will, and keep your heart at peace when destiny has decreed.',
    ar: ['دَعِ الْأَيَّامَ تَفْعَلُ مَا تَشَاءُ', 'وَطِبْ نَفْسًا إِذَا حَكَمَ الْقَضَاءُ'], by: 'al-Shāfiʿī', places: ['today-gentle'] },
  { id: 'shafii-learn', text: 'Learn, for a person is not born knowledgeable, and the person of knowledge is not like the ignorant.',
    ar: ['تَعَلَّمْ فَلَيْسَ الْمَرْءُ يُولَدُ عَالِمًا', 'وَلَيْسَ أَخُو عِلْمٍ كَمَنْ هُوَ جَاهِلُ'], by: 'al-Shāfiʿī', attributed: true, places: ['study'] },
  { id: 'shabbi-life', text: 'If a people one day desire life, then fate must surely respond.',
    ar: ['إِذَا الشَّعْبُ يَوْمًا أَرَادَ الْحَيَاةَ', 'فَلَا بُدَّ أَنْ يَسْتَجِيبَ الْقَدَرْ'], by: 'Abū al-Qāsim al-Shābbī', source: 'The Will to Live',
    places: ['projects', 'review'] },
  // Not in any translation of the Meditations: a modern rendering, perhaps of iv.3, so "attributed" as well as "paraphrase".
  { id: 'aurelius-mind', text: 'You have power over your mind — not outside events. Realise this, and you will find strength.',
    by: 'Marcus Aurelius', source: 'Meditations', attributed: true, paraphrase: true, places: ['today-gentle'] },
  { id: 'frankl-change', text: 'When we are no longer able to change a situation … we are challenged to change ourselves.',
    by: 'Viktor Frankl', source: "Man's Search for Meaning", places: ['today-gentle'] },
  { id: 'housel-money', text: 'Doing well with money has a little to do with how smart you are and a lot to do with how you behave.',
    by: 'Morgan Housel', source: 'The Psychology of Money', places: ['money'] },
  { id: 'hill-conceive', text: 'Whatever the mind can conceive and believe, it can achieve.',
    by: 'Napoleon Hill', attributed: true, places: ['projects'] },
  { id: 'clear-systems', text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    by: 'James Clear', source: 'Atomic Habits', places: ['today', 'study', 'money'] },
  { id: 'clear-vote', text: 'Every action you take is a vote for the type of person you wish to become.',
    by: 'James Clear', source: 'Atomic Habits', places: ['today', 'review'] },
  { id: 'covey-end', text: 'Begin with the end in mind.',
    by: 'Stephen R. Covey', source: 'The 7 Habits of Highly Effective People', places: ['projects', 'review', 'money'] },
  { id: 'lesson-business', text: 'Building a business involves uncertainty, persistence, risk and learning through experience.',
    meaning: 'You do not need to have every answer before you begin, but you do need to keep learning and adapting.', places: ['projects'] },
  { id: 'lesson-resistance', text: 'Resistance often appears when you are about to do meaningful creative work.',
    meaning: 'Waiting until you feel motivated can prevent you from starting. Establishing a routine can help you work even when motivation is low.',
    places: ['today'] },
];

// One saying per place per day: the same all day (no flicker between visits), a different one most days.
export function sayingFor(place: SayingPlace, day: DateKey): Saying | null {
  const options = SAYINGS.filter(s => s.places.includes(place));
  if (!options.length) return null;
  let h = 5381;
  for (const ch of place + ':' + day) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return options[h % options.length];
}

// Today is gentle on a rest day or a low-energy day (1 or 2).
export const todayPlace = (rest: boolean, energy: number | null | undefined): SayingPlace =>
  rest || (energy != null && energy <= 2) ? 'today-gentle' : 'today';

// "— al-Shāfiʿī", "— attributed to Napoleon Hill", "— Marcus Aurelius, Meditations (paraphrase)"; a lesson has no author.
export function byLine(s: Saying): string | null {
  if (!s.by) return null;
  return `${s.attributed ? 'attributed to ' : ''}${s.by}${s.source ? `, ${s.source}` : ''}${s.paraphrase ? ' (paraphrase)' : ''}`;
}
