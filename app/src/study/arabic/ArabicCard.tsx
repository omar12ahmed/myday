import { ArrowUpRight, BookOpen, Languages, Library } from 'lucide-react';
import { useRef, useState } from 'react';
import { Card } from '../../components/Card';
import { Ar } from './Ar';
import { towardsText, type Towards } from './plan';
import { setTowardsOnHome, towardsOnHome } from './towards';

// On Study's home page, beside Cybersecurity: the way into Arabic Fuṣḥā (the course's numbers are the package's),
// with your places on your path in counts once they've loaded (never a percentage). A session you left open is
// offered under "Worth a look". What your next lesson is a step towards (your goal's route, specs/arabic-route.md), unless
// you've hidden it here; "Your route" on the Arabic map brings it back.
// Hiding moves focus to the message saying how to bring it back (focus reads it; no live region, so it isn't read twice).
export function ArabicCard({ counts, towards }: { counts?: { ready: number; needs: unknown[] }; towards?: Towards | null }) {
  const [shown, setShown] = useState(towardsOnHome), [hidden, setHidden] = useState(false), said = useRef<HTMLParagraphElement>(null);
  const hide = () => { setTowardsOnHome(false); setShown(false); setHidden(true); requestAnimationFrame(() => said.current?.focus()); };
  return <Card className="arabic-entry" aria-labelledby="arabic-card-title">
    <div className="course-title-row">
      <h3 id="arabic-card-title"><Languages size={18} strokeWidth={1.6} aria-hidden="true" />Arabic Fuṣḥā</h3>
      <span className="text-xs text-fg-3">Guided learning path</span>
    </div>
    <Ar block className="text-[20px] text-fg-2 mt-0">العربية الفصحى</Ar>
    <p className="text-[15px] text-fg-2">From the script and its sounds to reading and writing, one short session at a time.</p>
    {towards && shown && <div className="flex items-start gap-2 text-sm text-fg-2" data-ar-home-towards="">
      <p className="m-0 min-w-0 flex-1">Your next lesson is a{towardsText(towards).slice(1)}</p>
      <button type="button" data-action="ar-towards-hide" aria-label="Hide this line" onClick={hide}
        className="flex-none min-h-11 px-2 text-primary font-semibold cursor-pointer bg-transparent border-0">Hide</button>
    </div>}
    {hidden && <p ref={said} tabIndex={-1} className="text-sm text-fg-2 m-0 focus-visible:outline-2 focus-visible:outline-primary" data-ar-home-towards-hidden="">Hidden here. To show it again: Arabic, under Your route.</p>}
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2 mt-5 mb-5"><span className="inline-flex gap-2 items-center"><BookOpen size={16} aria-hidden="true" />30 modules</span><span className="inline-flex gap-2 items-center"><Library size={16} aria-hidden="true" />152 lessons{counts?.ready ? ` · ${counts.ready} ready` : ''}{counts?.needs.length ? ` · ${counts.needs.length} ${counts.needs.length === 1 ? 'needs' : 'need'} revision` : ''}</span></div>
    <a href="#study/arabic" className="flex items-center justify-between gap-3 min-h-12 text-primary font-semibold text-sm no-underline border-t border-outline pt-4">Open Arabic <ArrowUpRight size={19} aria-hidden="true" /></a>
  </Card>;
}
