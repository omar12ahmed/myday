import { useConfirm } from '../components/confirm';
import { getSnapshot } from '../data/storage';
import { stFind, stIndex, tasksUnder } from '../data/study/roadmap';
import { removeItem } from './actions';

// Removing part of the roadmap asks first, saying how many tasks go with it.
export function useRemove() {
  const confirm = useConfirm();
  return async (id: string, after?: () => void) => {
    const e = stFind(stIndex(getSnapshot().data.study), id);
    if (!e) return;
    const n = e.level === 'task' ? 0 : tasksUnder(e.level, e.node).length;
    const yes = await confirm({ title: `Remove “${e.node.title}”${n ? ` and the ${n} task${n === 1 ? '' : 's'} in it` : ''}?`, confirmLabel: 'Remove', cancelLabel: 'Keep it' });
    if (yes && removeItem(id) && after) after();
  };
}
