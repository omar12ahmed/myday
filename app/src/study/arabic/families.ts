import families from '../../../../content/teaching/arabic/word-families.json';

// Word families (1.38.0): the authored file (content/teaching/arabic/word-families.json), and which family a word is in.
export type Family = (typeof families.families)[number];
export const FAMILIES = families;
export const familyOf = (id: string): Family | null => families.families.find(f => f.members.includes(id)) ?? null;
