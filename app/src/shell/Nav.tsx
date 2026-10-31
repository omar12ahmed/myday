import { SECTIONS, type SectionId } from './sections';
import { Lightbulb, ListTodo, NotebookPen, ShieldCheck } from 'lucide-react';

// Phones: a bar along the bottom. Wide screens: a rail down the left side, with MyDay's name at the top. `current`: the
// section you're in, or null on a page of its own (Search, your account, What MyDay knows…), which marks no section —
// only its own link, where the menu has one.
export function Nav({ current }: { current: SectionId | 'noticed' | 'knows' | null }) {
  return (
    <nav id="nav" aria-label="Sections" className="nav">
      {/* Wide screens: MyDay's name and icon at the top of the side menu. */}
      <a href="#today" className="nav-logo" aria-label="MyDay — Today">
        <svg className="day-mark" viewBox="0 0 36 36" width="36" height="36" fill="none" aria-hidden="true">
          <path d="M28.5 16.5a11 11 0 1 1-8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="m13 17 5 5L30 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg><span>MyDay<span className="nav-wordmark-dot">.</span></span>
      </a>
      <span className="nav-caption">Your workspace</span>
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <a key={id} href={`#${id}`} aria-current={id === current ? 'page' : undefined} className="nav-item" title={label}
          aria-label={label}>
          <span className="nav-icon relative">
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="nav-label">{label}</span>
        </a>
      ))}
      <div className="nav-shortcuts">
        <span className="nav-caption">Keep things close</span>
        <a href="#today/tasks"><ListTodo size={18} aria-hidden="true" />Your tasks</a>
        <a href="#projects/notes"><NotebookPen size={18} aria-hidden="true" />Your notes</a>
      </div>
      <div className="nav-utilities">
        <a href="#noticed" aria-current={current === 'noticed' ? 'page' : undefined}><Lightbulb size={18} aria-hidden="true" />What MyDay has noticed</a>
        <a href="#knows" aria-current={current === 'knows' ? 'page' : undefined}><ShieldCheck size={18} aria-hidden="true" />What MyDay knows</a>
        <p>One step at a time.</p>
      </div>
    </nav>
  );
}
