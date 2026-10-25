import { Search } from 'lucide-react';
import { useEffect } from 'react';

// The header's way into Search everywhere, beside +. On a computer the / key opens it too — never while you're typing
// in a field or a dialog is open; on the Search page it goes back to the field.
export function SearchButton({ current }: { current: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      if (location.hash.startsWith('#search')) document.getElementById('searchAll')?.focus();
      else location.hash = '#search';
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <a href="#search" data-action="search-open" aria-label="Search MyDay" title="Search MyDay (/)" {...(current ? { 'aria-current': 'page' as const } : {})}
      className="flex-none size-11 rounded-[10px] grid place-items-center bg-transparent text-fg-2 border border-outline hover:bg-surface no-underline">
      <Search size={20} aria-hidden="true" />
    </a>
  );
}
