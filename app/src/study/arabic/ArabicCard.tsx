import { ArrowUpRight, BookOpen, Languages, Library } from 'lucide-react';
import { Card } from '../../components/Card';
import type { MyDayData } from '../../data/types';
import { Ar } from './Ar';

// On Study's home page, beside Cybersecurity: the way into Arabic Fuṣḥā (the numbers are the package's), and a
// way back into a session you left open.
export function ArabicCard({ data }: { data: MyDayData }) {
  const open = data.arabic.attempts.filter(a => !a.finishedAt).pop();
  return <Card className="arabic-entry" aria-labelledby="arabic-card-title">
    <div className="flex items-center justify-between gap-3 mb-5"><span className="size-11 rounded-tile bg-primary-container text-primary grid place-items-center"><Languages size={24} strokeWidth={1.6} aria-hidden="true" /></span><span className="text-xs font-medium text-fg-3">Guided learning path</span></div>
    <h2 id="arabic-card-title" className="text-[26px] mb-0">Arabic Fuṣḥā</h2>
    <Ar block className="text-[20px] text-fg-2 mt-0">العربية الفصحى</Ar>
    <p className="text-[15px] text-fg-2">From the script and its sounds to reading and writing, one short session at a time.</p>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2 mt-5 mb-5"><span className="inline-flex gap-2 items-center"><BookOpen size={16} aria-hidden="true" />30 modules</span><span className="inline-flex gap-2 items-center"><Library size={16} aria-hidden="true" />152 lessons</span></div>
    {open && <a href={'#study/arabic/' + open.lessonId} data-ar-resume="" className="flex items-center justify-between gap-3 min-h-12 text-primary font-semibold text-sm no-underline border-t border-outline pt-4">A session is open: pick up where you left off <ArrowUpRight size={19} aria-hidden="true" /></a>}
    <a href="#study/arabic" className="flex items-center justify-between gap-3 min-h-12 text-primary font-semibold text-sm no-underline border-t border-outline pt-4">Open Arabic <ArrowUpRight size={19} aria-hidden="true" /></a>
  </Card>;
}
