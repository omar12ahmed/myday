-- Arabic Fuṣḥā: your chosen path (one record) and one record per lesson session. The course itself ships with the
-- app. Only the two lists of allowed kinds change: existing rows, the RPC version checks, grants and per-user RLS
-- are unchanged.
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records
  add constraint sync_records_known_kind check (kind in (
    'settings', 'rota', 'pay', 'holidays', 'finance', 'study', 'workout', 'food', 'fitness',
    'notes', 'tasks', 'patterns', 'commitment', 'note', 'task', 'session', 'review',
    'wsession', 'recipe', 'project', 'cybersecurity', 'cyber_attempt', 'arabic', 'arabic_attempt')),
  add constraint sync_records_deletable_kind check (not deleted or kind in (
    'commitment', 'note', 'task', 'session', 'review', 'wsession', 'recipe', 'project', 'cyber_attempt', 'arabic_attempt'));
