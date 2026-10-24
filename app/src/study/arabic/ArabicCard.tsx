import { ArrowUpRight, BookOpen, Languages, Library } from 'lucide-react';
import { Card } from '../../components/Card';
import { Ar } from './Ar';

// On Study's home page, beside Cybersecurity: the way into Arabic Fuṣḥā (the course's numbers are the package's),
// with your places on your path in counts once they've loaded (never a percentage). A session you left open is
// offered under "Worth a look".
export function ArabicCard({ counts }: { counts?: { ready: number; needs: unknown[] } }) {
  return <Card className="arabic-entry" aria-labelledby="arabic-card-title">
    <div className="course-title-row">
      <h2 id="arabic-card-title"><Languages size={18} strokeWidth={1.6} aria-hidden="true" />Arabic Fuṣḥā</h2>
      <span className="text-xs text-fg-3">Guided learning path</span>
    </div>
    <Ar block className="text-[20px] text-fg-2 mt-0">العربية الفصحى</Ar>
    <p className="text-[15px] text-fg-2">From the script and its sounds to reading and writing, one short session at a time.</p>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2 mt-5 mb-5"><span className="inline-flex gap-2 items-center"><BookOpen size={16} aria-hidden="true" />30 modules</span><span className="inline-flex gap-2 items-center"><Library size={16} aria-hidden="true" />152 lessons{counts?.ready ? ` · ${counts.ready} ready` : ''}{counts?.needs.length ? ` · ${counts.needs.length} ${counts.needs.length === 1 ? 'needs' : 'need'} revision` : ''}</span></div>
    <a href="#study/arabic" className="flex items-center justify-between gap-3 min-h-12 text-primary font-semibold text-sm no-underline border-t border-outline pt-4">Open Arabic <ArrowUpRight size={19} aria-hidden="true" /></a>
  </Card>;
}
