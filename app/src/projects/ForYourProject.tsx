import { Fragment } from 'react';
import { InlineLink } from '../components/parts';
import { linkedFrom, type LinkKind } from '../data/studyLinks';
import type { MyDayData } from '../data/types';

// Study's side of a project's Learning links (specs/projects-study-links.md §7): "For your project: Shop Wi-Fi" on a
// course's page, a book in Reading and a Cybersecurity lesson's page, each name opening its project. Nothing when no
// project links it.
export function ForYourProject({ data, kind, id, className = '' }: { data: MyDayData; kind: LinkKind; id: string; className?: string }) {
  const list = linkedFrom(data, kind, id);
  if (!list.length) return null;
  return (
    <p className={`text-[15px] text-fg-2 m-0 break-words ${className}`} data-s="for-project">
      For your project{list.length > 1 ? 's' : ''}: {list.map((p, i) => <Fragment key={p.id}>{i ? ', ' : ''}<InlineLink href={`#projects/p/${encodeURIComponent(p.id)}`}>{p.title}</InlineLink></Fragment>)}
    </p>
  );
}
