import { Card } from '../components/Card';
import { Meta, Row, TextLink } from '../components/parts';
import type { DateKey, MyDayData } from '../data/types';
import { healthReminders } from './reminders';

// Health on Today: only what's waiting — a workout, a recipe being cooked, the shopping list. Nothing is
// added to the day's task list.
export function HealthTodayCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const items = healthReminders(data, k);
  if (!items.length) return null;
  return (
    <Card aria-labelledby="health-card-h">
      <h2 id="health-card-h">Health</h2>
      {items.map(x => (
        <Row key={x.key}>
          <div className="min-w-0"><strong>{x.title}</strong><div><Meta>{x.meta}</Meta></div></div>
          <TextLink href={x.href} className="flex-none">{x.link}</TextLink>
        </Row>
      ))}
    </Card>
  );
}
