import { ArrowUpRight, BookOpen, FlaskConical, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/Card';
import { topicPath, type TopicGlance } from '../../data/study/topics';

export function CyberCard({ roadmaps = [] }: { roadmaps?: TopicGlance[] }) {
  return <Card className="cyber-entry" aria-labelledby="cyber-card-title">
    <div className="flex items-center justify-between gap-3 mb-5"><span className="size-11 rounded-tile bg-primary-container text-primary grid place-items-center"><ShieldCheck size={24} strokeWidth={1.6} aria-hidden="true" /></span><span className="text-xs font-medium text-fg-3">Guided learning path</span></div>
    <h2 id="cyber-card-title" className="text-[26px]">Cybersecurity</h2>
    <p className="text-[15px] text-fg-2">From first principles to hands-on practice. Your lessons, experiments and discoveries, in one place.</p>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2 mt-5 mb-5"><span className="inline-flex gap-2 items-center"><BookOpen size={16} aria-hidden="true" />27 modules</span><span className="inline-flex gap-2 items-center"><FlaskConical size={16} aria-hidden="true" />146 lessons</span></div>
    <a href="#study/cybersecurity" className="flex items-center justify-between gap-3 min-h-12 text-primary font-semibold text-sm no-underline border-t border-outline pt-4">Open cybersecurity <ArrowUpRight size={19} aria-hidden="true" /></a>
    {roadmaps.map(g => <a key={g.topic.id || 'main'} href={'#' + topicPath(g.topic.id)} data-cyber-saved-courses={g.topic.id || 'main'} className="block min-h-11 py-3 mt-2 text-primary text-sm no-underline border-t border-outline">
      <span className="block font-semibold">Your saved courses</span>
      <span className="block text-fg-2 mt-1">{g.comp.total > 0 ? `${g.comp.done} of ${g.comp.total} tasks · ` : ''}{g.courses.length + g.setAside} course{g.courses.length + g.setAside === 1 ? '' : 's'}{g.setAside > 0 ? ` (${g.setAside} set aside)` : ''}</span>
    </a>)}
  </Card>;
}
