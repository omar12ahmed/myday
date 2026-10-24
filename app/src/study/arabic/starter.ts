import { sameWord } from '../../data/arabic/words';
import texts from './data/texts.json';

// One of the course's starter words, when a word you keep is one (vowel marks aside): its meaning and example are
// offered.
export const starterFor = (ar: string) => texts.lexicon.find(w => sameWord(w.form_ar, ar)) ?? null;
