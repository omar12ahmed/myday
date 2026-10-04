import { obsidianUrl } from '../data/study/common';
import type { completion } from '../data/study/roadmap';
import type { StudyData } from '../data/types';
import { InlineLink, TextLink } from '../components/parts';

// The shared pieces (links, rows, chips, choices…) live in components/parts.tsx.
export { BackLink, Choice, Choices, Chip, Eyebrow, ExternalLink, InlineLink, LinkButton, Meta, Note, NotFound, Row, Summary, TextLink } from '../components/parts';

// An Obsidian note: a link that opens it in Obsidian (MyDay never reads the vault), or, with no vault
// name yet, the path and where to add the name.
export function NoteLink({ study, path, onOpen }: { study: StudyData; path: string; onOpen?: () => void }) {
  if (!path) return null;
  const url = obsidianUrl(study, path);
  return url ? <TextLink href={url} onClick={onOpen}>Open “{path}” in Obsidian</TextLink>
    : <p className="text-[15px] text-fg-2">Note: {path} — add your vault name in <InlineLink href="#study/settings">Study settings</InlineLink> to open it from here.</p>;
}

// The thin completion bar (decoration: the text beside it gives the numbers).
export function Bar({ c }: { c: ReturnType<typeof completion> }) {
  if (!c.total) return null;
  return <div className="st-bar h-2 rounded-full bg-track overflow-hidden mt-2 mb-1" aria-hidden="true"><span className="block h-full bg-done rounded-full" style={{ width: `${c.pct}%` }} /></div>;
}

