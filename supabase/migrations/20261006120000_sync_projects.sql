-- MyDay 1.12.0: projects sync with your account.
--
-- What this changes
--   sync_records accepts one more kind of record: project:<id> (one per project; it can be deleted, like a note or a
--   task, so the deletion reaches your other devices). That's all: no table, column, function, grant or security
--   setting is touched, and every existing row stays exactly as it is (each already meets the wider checks).
--
-- How
--   The two checks that list the kinds were created without names in 20261005120000_sync_everything.sql, so they're
--   found by what they contain (they're the only checks on sync_records that name 'recipe') and replaced by named
--   checks with 'project' added. Run the whole file at once (the Supabase CLI and the SQL editor run it as one
--   transaction), so the table is never left without its checks.

do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.sync_records'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) like '%''recipe''%'
  loop
    execute format('alter table public.sync_records drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.sync_records
  add constraint sync_records_known_kind check (kind in (
    'settings', 'rota', 'pay', 'holidays', 'finance', 'study', 'workout', 'food', 'fitness',
    'notes', 'tasks', 'patterns', 'commitment', 'note', 'task', 'session', 'review',
    'wsession', 'recipe', 'project')),
  -- Only items can be deleted; the one-record kinds always exist.
  add constraint sync_records_deletable_kind check (not deleted or kind in (
    'commitment', 'note', 'task', 'session', 'review', 'wsession', 'recipe', 'project'));
