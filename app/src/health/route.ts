// Health's screens live under #health/… in the address, as in the current MyDay:
//   #health · #health/workout · #health/workout/session · #health/workout/log/<id>
//   #health/workout/template/<id> · #health/workout/history · #health/workout/exercises
//   #health/workout/exercise/<id> · #health/workout/schedule · #health/food/… (not in the new app yet)
export { go } from '../study/route';

export function healthRoute(hash: string): { tab: 'workout' | 'food'; view: string; id: string } {
  const parts = hash.replace('#', '').split('/').map(decodeURIComponent);
  return { tab: parts[1] === 'food' ? 'food' : 'workout', view: parts[2] || 'home', id: parts[3] || '' };
}
