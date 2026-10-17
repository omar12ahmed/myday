-- Daily exercises (Health): one record (`daily:moves`) with the exercises (name, daily target, set size)
-- and the log of each day's taps. It's a singleton like `workout:setup`, so it's never deleted. Only the
-- list of allowed kinds changes: existing rows, the RPC version checks, grants and per-user RLS are unchanged.
alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records
  add constraint sync_records_known_kind check (kind in (
    'settings', 'rota', 'pay', 'holidays', 'finance', 'study', 'workout', 'food', 'fitness',
    'notes', 'tasks', 'patterns', 'commitment', 'note', 'task', 'session', 'review',
    'wsession', 'recipe', 'project', 'cybersecurity', 'cyber_attempt', 'arabic', 'arabic_attempt', 'arabic_card',
    'cyber_card', 'daily'));
