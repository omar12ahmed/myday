import { useContext, type ReactNode } from 'react';
import { PronunciationContext } from './pronunciationContext';

export function Reading({ text, block = false, prepared }: { text: string; block?: boolean; prepared?: string }) {
  const { enabled, read } = useContext(PronunciationContext);
  const reading = enabled ? prepared ? { text: prepared, incomplete: false, note: undefined } : read(text) : null;
  if (!reading || !/[ء-ي]/.test(text)) return null;
  return <span className={`ar-transliteration${block ? ' ar-transliteration-block' : ''}`} data-ar-transliteration="" dir="ltr" lang="ar-Latn">
    {block ? '' : ' ('}{reading.text}{block ? '' : ')'}
    {reading.note && <span className="sr-only" lang="en"> — {reading.note}</span>}
  </span>;
}

// Arabic on its own: marked as Arabic, right to left, in the Arabic typeface.
export function Ar({ children, block = false, className = '', reading, showReading = true }: { children: ReactNode; block?: boolean; className?: string; reading?: string; showReading?: boolean }) {
  return <>{block
    ? <p lang="ar" dir="rtl" className={`ar ar-block ${className}`}>{children}</p>
    : <span lang="ar" dir="rtl" className={`ar ${className}`}>{children}</span>}
    {showReading && typeof children === 'string' && <Reading text={children} block={block} prepared={reading} />}
  </>;
}

// English with Arabic words inside it ("How do مِن and في differ?"): each Arabic run is isolated, so it
// reads right to left without reordering the English around it.
const ARABIC_RUN = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+(?:[\s،؛؟]+[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+)*/g;
export function Mixed({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(ARABIC_RUN)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<bdi key={m.index} lang="ar" className="ar-inline">{m[0]}</bdi>);
    parts.push(<Reading key={'reading-' + m.index} text={m[0]} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
