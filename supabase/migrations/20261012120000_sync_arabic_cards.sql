-- Arabic in revision (part 3): one record per revision card (`arabic_card`): a starter word one way round, or a
-- lesson check, by the course's own id, with the day it was added and its schedule. The words and questions ship
-- with the app; answers go in the existing `review` records. A card can be taken out of revision, so it can be
-- deleted. Only the two lists of allowed kinds change: existing rows, the RPC version checks, grants and per-user
-- RLS are unchanged.
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records
  add constraint sync_records_known_kind check (kind in (
    'settings', 'rota', 'pay', 'holidays', 'finance', 'study', 'workout', 'food', 'fitness',
    'notes', 'tasks', 'patterns', 'commitment', 'note', 'task', 'session', 'review',
    'wsession', 'recipe', 'project', 'cybersecurity', 'cyber_attempt', 'arabic', 'arabic_attempt', 'arabic_card')),
  add constraint sync_records_deletable_kind check (not deleted or kind in (
    'commitment', 'note', 'task', 'session', 'review', 'wsession', 'recipe', 'project', 'cyber_attempt', 'arabic_attempt',
    'arabic_card'));
