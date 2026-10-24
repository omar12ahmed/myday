import { todayKey } from '../data/dates';
import { byLine, sayingFor, type SayingPlace } from '../data/sayings';
import type { DateKey } from '../data/types';
import { useSayings } from '../shell/sayingsMode';
import { Ar } from '../study/arabic/Ar';

// One quiet saying for this place and day (see data/sayings.ts): the Arabic verse when there is one, the English, who
// said it, and a small fold-out for a lesson's meaning or a note on the Arabic. Nothing when switched off in the footer.
export function Saying({ place, day = todayKey(), className = '' }: { place: SayingPlace; day?: DateKey; className?: string }) {
  const on = useSayings();
  const s = on ? sayingFor(place, day) : null;
  if (!s) return null;
  const by = byLine(s);
  // A quotation (the Arabic verse with its English) is a blockquote; a lesson isn't a quotation. The fold-out sits
  // after the figure, since a figure's caption must be its first or last child.
  const Quote = by ? 'blockquote' : 'div';
  return (
    <div className={`saying ${className}`} data-s="saying" data-saying={s.id}>
      <figure className="m-0">
        <Quote className="m-0">
          {s.ar && <div className="saying-ar mb-1">{s.ar.map(half => <Ar key={half} block showReading={false} className="text-[19px] leading-[1.9] m-0">{half}</Ar>)}</div>}
          <p className="m-0 text-[15px] leading-relaxed text-fg-2">{by ? `“${s.text}”` : s.text}</p>
        </Quote>
        <figcaption className="text-[13px] text-fg-3 mt-1">{by ? `— ${by}` : 'Lesson'}</figcaption>
      </figure>
      {(s.meaning || s.ar) && <details className="saying-more text-[13px] text-fg-2" data-s="saying-more">
        <summary className="inline-flex items-center min-h-11 cursor-pointer text-primary font-semibold">{s.meaning ? 'Meaning' : 'About the Arabic'}</summary>
        <p className="m-0 mb-2">{s.meaning ?? 'The original verse, fully vowelled. It hasn’t yet been checked by a fluent reader.'}</p>
      </details>}
    </div>
  );
}
