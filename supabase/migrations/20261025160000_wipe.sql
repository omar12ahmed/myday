-- Delete everything (specs/delete-everything.md): the true wipe of one account's synced data, and a guard so an
-- older MyDay can't write the wiped account back from its own copy.
--   sync_accounts  gains epoch (how many times this account was wiped), wiped_at and wiped_seq (last_seq at the wipe).
--                  last_seq itself is kept, so change numbers keep rising and every device's cursor stays meaningful.
--   sync_state     the signed-in account's epoch, wiped_at, wiped_seq and last_seq (zeros with no row).
--   sync_wipe      deletes the account's rows from sync_records (data and deletion markers), sync_changes, task_lists,
--                  task_queue, day_plans, day_context and sync_project_legacy, and moves the epoch on. ai_usage (counts
--                  only, no content) stays, so the limits keep working.
--   sync_push_v3   sync_push_v2 for a MyDay that knows the epoch: refuses ('wiped') when the epoch it was given isn't
--                  the account's, otherwise sets a transaction-local flag and calls sync_push_v2 unchanged.
--   the guard      BEFORE INSERT OR UPDATE triggers on sync_records and the four task/day tables: for an account with
--                  epoch > 0, a write must come with that flag. An account never wiped behaves exactly as before, so
--                  every released MyDay keeps working; after a wipe only a MyDay that knows its epoch can write.
-- Nothing else changes: existing rows, sync_push_v2/sync_pull_v2, the project triggers, grants and RLS.
-- For later work on the database: (1) a migration that rewrites rows (as the split-project one did) must, for an
-- account with epoch > 0, set myday.epoch to that account's epoch (or disable the guard) for its writes; (2) when
-- restoring from a backup, never lower sync_accounts.epoch: devices that heard of a wipe would otherwise stop syncing
-- ("restored from before Delete everything") until it's raised back.
begin;

alter table public.sync_accounts
  add column epoch integer not null default 0,
  add column wiped_at timestamptz,
  add column wiped_seq bigint;

create function public.sync_state(account uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_row public.sync_accounts%rowtype;
begin
  if v_me is null then
    raise exception 'Sign in to sync.' using errcode = '42501';
  end if;
  if account is distinct from v_me then
    raise exception 'That is a different account from the one signed in.' using errcode = '42501';
  end if;
  select * into v_row from public.sync_accounts where user_id = v_me;
  return jsonb_build_object('epoch', coalesce(v_row.epoch, 0), 'wiped_at', v_row.wiped_at,
    'wiped_seq', coalesce(v_row.wiped_seq, 0), 'last_seq', coalesce(v_row.last_seq, 0));
end;
$$;

create function public.sync_wipe(account uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_row public.sync_accounts%rowtype;
begin
  if v_me is null then
    raise exception 'Sign in to sync.' using errcode = '42501';
  end if;
  if account is distinct from v_me then
    raise exception 'That is a different account from the one signed in.' using errcode = '42501';
  end if;
  -- One save at a time per account (as sync_push_v2): no push lands half-way through the wipe.
  insert into public.sync_accounts (user_id) values (v_me) on conflict (user_id) do nothing;
  perform 1 from public.sync_accounts where user_id = v_me for update;
  delete from public.sync_records where user_id = v_me;
  delete from public.sync_changes where user_id = v_me;
  delete from public.task_lists where user_id = v_me;
  delete from public.task_queue where user_id = v_me;
  delete from public.day_plans where user_id = v_me;
  delete from public.day_context where user_id = v_me;
  delete from public.sync_project_legacy where user_id = v_me;
  update public.sync_accounts set epoch = epoch + 1, wiped_at = now(), wiped_seq = last_seq where user_id = v_me
    returning * into v_row;
  return jsonb_build_object('epoch', v_row.epoch, 'wiped_at', v_row.wiped_at, 'wiped_seq', v_row.wiped_seq, 'last_seq', v_row.last_seq);
end;
$$;

create function public.sync_push_v3(account uuid, changes jsonb, device text default null, epoch integer default 0)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_epoch integer;
begin
  if v_me is null then
    raise exception 'Sign in to sync.' using errcode = '42501';
  end if;
  if account is distinct from v_me then
    raise exception 'These changes belong to a different account from the one signed in.' using errcode = '42501';
  end if;
  -- The account's lock first (as sync_push_v2 and sync_wipe take it), so a wipe can't land between reading the epoch
  -- and saving; sync_push_v2 taking it again in this transaction is a no-op.
  insert into public.sync_accounts (user_id) values (v_me) on conflict (user_id) do nothing;
  select a.epoch into v_epoch from public.sync_accounts a where a.user_id = v_me for update;
  if coalesce(v_epoch, 0) <> coalesce(sync_push_v3.epoch, -1) then
    return jsonb_build_object('error', 'wiped', 'epoch', coalesce(v_epoch, 0));
  end if;
  perform set_config('myday.epoch', coalesce(v_epoch, 0)::text, true);
  return public.sync_push_v2(account, changes, device);
end;
$$;

-- The guard. (A wipe deletes; deleting isn't guarded.)
create function public.sync_epoch_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_epoch integer;
begin
  select a.epoch into v_epoch from public.sync_accounts a where a.user_id = new.user_id;
  if coalesce(v_epoch, 0) > 0 and coalesce(current_setting('myday.epoch', true), '') <> v_epoch::text then
    -- (An ordinary error, not 42501: older releases treat 42501 as "sign in again"; this way they show the message.)
    raise exception 'This account was cleared with Delete everything. Update MyDay to sync it.' using hint = 'update-required';
  end if;
  return new;
end;
$$;
create trigger sync_epoch_guard before insert or update on public.sync_records for each row execute function public.sync_epoch_guard();
create trigger sync_epoch_guard before insert or update on public.task_lists for each row execute function public.sync_epoch_guard();
create trigger sync_epoch_guard before insert or update on public.task_queue for each row execute function public.sync_epoch_guard();
create trigger sync_epoch_guard before insert or update on public.day_plans for each row execute function public.sync_epoch_guard();
create trigger sync_epoch_guard before insert or update on public.day_context for each row execute function public.sync_epoch_guard();

revoke all on function public.sync_state(uuid) from public, anon, authenticated;
revoke all on function public.sync_wipe(uuid) from public, anon, authenticated;
revoke all on function public.sync_push_v3(uuid, jsonb, text, integer) from public, anon, authenticated;
revoke all on function public.sync_epoch_guard() from public, anon, authenticated;
grant execute on function public.sync_state(uuid) to authenticated;
grant execute on function public.sync_wipe(uuid) to authenticated;
grant execute on function public.sync_push_v3(uuid, jsonb, text, integer) to authenticated;

commit;
