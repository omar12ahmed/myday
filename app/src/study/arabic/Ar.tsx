import type { ReactNode } from 'react';

// Arabic on its own: marked as Arabic, right to left, in the Arabic typeface.
export function Ar({ children, block = false, className = '' }: { children: ReactNode; block?: boolean; className?: string }) {
  return block
    ? <p lang="ar" dir="rtl" className={`ar ar-block ${className}`}>{children}</p>
    : <span lang="ar" dir="rtl" className={`ar ${className}`}>{children}</span>;
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
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
