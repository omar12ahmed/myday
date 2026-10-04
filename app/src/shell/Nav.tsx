import { SECTIONS, type SectionId } from './sections';

// Phones: a bar along the bottom. Wide screens: across the top, beside the date.
export function Nav({ current }: { current: SectionId }) {
  return (
    <nav id="nav" aria-label="Sections" className="nav">
      {SECTIONS.map(({ id, label, icon: Icon, moved }) => (
        <a key={id} href={`#${id}`} aria-current={id === current ? 'page' : undefined} className="nav-item" title={label}
          aria-label={moved ? label : `${label} (not in the new app yet)`}>
          <span className="nav-icon relative">
            <Icon size={22} aria-hidden="true" />
            {/* A small dot marks sections that still live in the current MyDay. */}
            {!moved && <span aria-hidden="true" className="absolute top-0.5 right-3 size-2 rounded-full border-2 border-fg-3" />}
          </span>
          <span className={`nav-label ${moved ? '' : 'text-fg-3'}`}>{label}</span>
        </a>
      ))}
    </nav>
  );
}
