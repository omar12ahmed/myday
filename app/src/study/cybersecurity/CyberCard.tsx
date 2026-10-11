import { ArrowUpRight, BookOpen, FlaskConical, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/Card';

export function CyberCard() {
  return <Card className="cyber-entry" aria-labelledby="cyber-card-title">
    <div className="flex items-center justify-between gap-3 mb-5"><span className="size-11 rounded-tile bg-primary-container text-primary grid place-items-center"><ShieldCheck size={24} strokeWidth={1.6} aria-hidden="true" /></span><span className="text-xs font-medium text-fg-3">Guided learning path</span></div>
    <h2 id="cyber-card-title" className="text-[26px]">Cybersecurity</h2>
    <p className="text-[15px] text-fg-2">From first principles to hands-on practice. Your lessons, experiments and discoveries, in one place.</p>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2 mt-5 mb-5"><span className="inline-flex gap-2 items-center"><BookOpen size={16} aria-hidden="true" />27 modules</span><span className="inline-flex gap-2 items-center"><FlaskConical size={16} aria-hidden="true" />146 lessons</span></div>
    <a href="#study/cybersecurity" className="flex items-center justify-between gap-3 min-h-12 text-primary font-semibold text-sm no-underline border-t border-outline pt-4">Open cybersecurity <ArrowUpRight size={19} aria-hidden="true" /></a>
  </Card>;
}
