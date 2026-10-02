import { CookingPot } from 'lucide-react';
import { recipeFacts } from '../../data/food/recipes';
import type { Recipe } from '../../data/types';

// What a recipe lists — and, plainly, what it doesn't (nothing is guessed).
export function Facts({ r }: { r: Recipe }) {
  const { bits, missing } = recipeFacts(r);
  return (
    <>
      {bits.length > 0 && <div className="rfacts text-[13px] text-fg-2 mt-1">{bits.join(' · ')}</div>}
      {missing && <div className="meta text-[13px] text-fg-3">{missing}</div>}
    </>
  );
}

// A recipe as a card: photo (from TheMealDB, never saved as an image), name, where it's from, and what's listed.
export function RecipeCard({ r }: { r: Recipe }) {
  return (
    <article className="rcard bg-surface-2 border border-outline rounded-tile overflow-hidden min-h-28">
      <a className="rcard-link grid grid-cols-[112px_minmax(0,1fr)] h-full text-inherit no-underline hover:bg-surface-3 transition-colors" href={`#health/food/recipe/${encodeURIComponent(r.id)}`}>
        {r.thumb
          ? <img src={`${r.thumb}/small`} alt="" loading="lazy" decoding="async" className="w-28 h-full min-h-28 object-cover block bg-surface-3" />
          : <div className="rcard-noimg w-28 h-full min-h-28 grid place-items-center bg-surface-3 text-fg-3" aria-hidden="true"><CookingPot size={34} /></div>}
        <div className="rcard-body px-3 py-2.5 min-w-0">
          <h3 className="!text-base !normal-case !tracking-normal !text-fg !m-0 !mb-1 font-bold">{r.title}</h3>
          <div className="meta text-[13px] text-fg-3">{[r.category, r.area].filter(Boolean).join(' · ') || (r.source === 'manual' ? 'Your recipe' : '')}</div>
          <Facts r={r} />
        </div>
      </a>
    </article>
  );
}
export const Skeleton = () => <div className="rcard skeleton min-h-28 rounded-tile border border-outline" aria-hidden="true" />;
export const Grid = ({ children }: { children: React.ReactNode }) => <div className="rgrid grid grid-cols-1 min-[600px]:grid-cols-2 gap-3 mt-2.5">{children}</div>;
