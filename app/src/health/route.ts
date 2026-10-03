// Health's screens live under #health/… in the address, as in the current MyDay:
//   #health · #health/workout · #health/workout/session · #health/workout/log/<id>
//   #health/workout/template/<id> · #health/workout/history · #health/workout/exercises
//   #health/workout/exercise/<id> · #health/workout/schedule
//   #health/food · #health/food/search · #health/food/recipe/<id> · #health/food/want/<id>
//   #health/food/shopping · #health/food/cook · #health/food/prefs · #health/food/new · #health/food/edit/<id>
//   #health/goal (new app only: your goal and plan)
export { go } from '../study/route';

export function healthRoute(hash: string): { tab: 'workout' | 'food' | 'goal'; view: string; id: string } {
  const parts = hash.replace('#', '').split('/').map(decodeURIComponent);
  return { tab: parts[1] === 'food' ? 'food' : parts[1] === 'goal' ? 'goal' : 'workout', view: parts[2] || 'home', id: parts[3] || '' };
}
