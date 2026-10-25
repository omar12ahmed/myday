import { sameWord } from '../../data/arabic/words';
import { allWords } from './courseWords';

// One of the course's words (a starter word or a lesson's), when a word you keep is one (vowel marks aside): its meaning
// and example are offered.
export const starterFor = (ar: string) => allWords.find(w => sameWord(w.form_ar, ar)) ?? null;
