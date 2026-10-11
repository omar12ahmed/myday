import { SECTIONS, type SectionId } from './sections';

// Phones: a bar along the bottom. Wide screens: a rail down the left side, with MyDay's name at the top.
export function Nav({ current }: { current: SectionId }) {
  return (
    <nav id="nav" aria-label="Sections" className="nav">
      {/* Wide screens: MyDay's name and icon at the top of the side menu. */}
      <a href="#today" className="nav-logo" aria-label="MyDay — Today"><img src="./icon.svg" alt="" width="40" height="40" /><span>MyDay</span></a>
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
    </nav>
  );
}
