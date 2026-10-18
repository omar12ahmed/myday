import { CalendarHeart } from 'lucide-react';
import { Card } from '../components/Card';
import { LinkButton } from '../components/parts';
import type { DateKey, MyDayData } from '../data/types';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import { putOffReview, reviewDue } from '../data/weekReview';

// The weekly review's card on Today (1.37.0): only on your review day (Sunday unless you choose another) and the day
// after, until you've done it or said "Not this week". Never a notification.
export function ReviewCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const day = reviewDue(data, k);
  if (!day) return null;
  return (
    <Card aria-labelledby="review-card-h" id="reviewCard">
      <h3 id="review-card-h" className="flex items-center gap-2"><CalendarHeart size={18} aria-hidden="true" className="text-primary" /> Look back at your week</h3>
      <p className="text-[15px] text-fg-2 m-0">About five minutes: what moved, what’s waiting, and next week’s focus.</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
        <a href="#review" className="inline-flex items-center min-h-11 px-4 rounded-btn bg-primary text-on-primary font-semibold no-underline hover:opacity-90" data-action="review-start">Start</a>
        <LinkButton data-action="review-later" onClick={() => { if (update(d => (putOffReview(d, day) ? undefined : false))) toast('Not this week — it’ll be back next time.'); }}>Not this week</LinkButton>
      </div>
    </Card>
  );
}
