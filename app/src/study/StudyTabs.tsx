import { Card } from '../components/Card';

// Study's two tabs: Courses (the roadmap home) and Reading (your books). Shown on those two screens;
// focused flows (a session, revision) stay without it. Same pattern as Health's Workout / Food / Goal.
export function StudyTabs({ on }: { on: 'courses' | 'reading' }) {
  const cls = (active: boolean) => `seg-link flex-1 inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-[15px] font-semibold no-underline ${active ? 'on bg-primary-container text-on-primary-container' : 'text-fg-2'}`;
  return (
    <Card className="study-tabs !p-2.5">
      <div className="seg flex gap-1.5" role="tablist" aria-label="Study sections">
        <a className={cls(on === 'courses')} href="#study" role="tab" aria-selected={on === 'courses'}>Courses</a>
        <a className={cls(on === 'reading')} href="#study/reading" role="tab" aria-selected={on === 'reading'}>Reading</a>
      </div>
    </Card>
  );
}
