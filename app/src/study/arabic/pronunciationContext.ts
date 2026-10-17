import { createContext } from 'react';
import type { Reading } from './transliterate';

export const PronunciationContext = createContext({
  enabled: false,
  toggle: () => {},
  read: (_text: string): Reading | null => null,
});
