import type { ReactNode } from 'react';
import { Mixed } from './Ar';
import { Root } from './WordFamilies';

// A word's note: English with Arabic in it, each Arabic piece isolated (and, with `voice`, playable), and a root written
// like ك-ت-ب (or a four-letter one) kept whole, in its own right-to-left run, so its letters stay in order.
const ROOT_IN_NOTE = /[ء-ي](?:-[ء-ي]){2,3}/g;
export function WordNote({ text, voice }: { text: string; voice?: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(ROOT_IN_NOTE)) {
    if (m.index > last) out.push(<Mixed key={last} text={text.slice(last, m.index)} voice={voice && `${voice}:${last}`} />);
    out.push(<Root key={'r' + m.index} f={{ root_ar: m[0], root_reading: '' }} reading={false} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Mixed key={last} text={text.slice(last)} voice={voice && `${voice}:${last}`} />);
  return <>{out}</>;
}
