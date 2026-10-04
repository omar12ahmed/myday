-- MyDay cloud sync, second milestone: everything else you enter, so your data follows your account on every device.
--
-- What this adds
--   One more record table, sync_records, for every other part of MyDay. Each row is one record, named by its kind
--   and an id chosen by the app (kind + id are stable, so the same record is never stored twice):
--     one record each      settings:planning · rota:rota · pay:pay · holidays:region · finance:finance ·
--                          study:roadmap · workout:setup · food:kitchen · food:shopping · fitness:goal ·
--                          notes:collections · tasks:lists · patterns:patterns (the Study roadmap includes concepts)
--     one record per item  commitment:<id> (appointments, work) · note:<id> · task:<id> ·
--                          session:<id> (study) · review:<id> (revision answers) · wsession:<id> (workouts) ·
--                          recipe:<id>
--   Items can be deleted (kept as a tombstone with no data, so the deletion reaches other devices); the one-record
--   kinds can't. Rows work exactly like the first milestone's: a version (one more per change), a seq number from
--   the account's own counter (so "what changed since N?" covers both milestones' records in one order), and who
--   saved it.
--
--   sync_push and sync_pull are replaced (same names, same arguments, same results) so they also handle these
--   kinds. The first milestone's four tables, and everything in them, are unchanged.
--
-- Security (as before)
--   Row Level Security is on: a signed-in user can read only their own rows and can't write to the table
--   directly. All writes go through sync_push, which only touches the signed-in account's rows and applies a change
--   only if it was based on the latest version. Signed-out visitors get nothing. Deleting an account deletes its rows.

create table public.sync_records (
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('settings', 'rota', 'pay', 'holidays', 'finance', 'study', 'workout', 'food', 'fitness',
                                           'notes', 'tasks', 'patterns', 'commitment', 'note', 'task', 'session', 'review',
                                           'wsession', 'recipe')),
  id         text not null check (id ~ '^[A-Za-z0-9_.:-]{1,64}$'),
  data       jsonb check (data is null or (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 524288)),
  version    integer not null check (version >= 1),
  deleted    boolean not null default false,
  seq        bigint not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (user_id, kind, id),
  check (deleted = (data is null)),
  -- Only items can be deleted; the one-record kinds always exist.
  check (not deleted or kind in ('commitment', 'note', 'task', 'session', 'review', 'wsession', 'recipe'))
);
create index sync_records_by_seq on public.sync_records (user_id, seq);

alter table public.sync_records enable row level security;
revoke all on table public.sync_records from anon, authenticated;
grant select on table public.sync_records to authenticated;
create policy "Read own records" on public.sync_records for select to authenticated using ((select auth.uid()) = user_id);

-- ---------- Saving changes (replaces the first milestone's sync_push) ----------
-- As before, plus the kinds above (saved in sync_records). An unknown kind, a bad id, data that's too big or the
-- deletion of a one-record kind is "rejected" (nothing of it saved); the other changes still go ahead.
create or replace function public.sync_push(account uuid, changes jsonb, device text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me       uuid := auth.uid();
  v_results  jsonb := '[]'::jsonb;
  v_change   jsonb;
  v_id       uuid;
  v_kind     text;
  v_table    text;
  v_record   text;
  v_base     integer;
  v_deleted  boolean;
  v_data     jsonb;
  v_done     integer;
  v_current  integer;
  v_cur_del  boolean;
  v_cur_data jsonb;
  v_seq      bigint;
begin
  if v_me is null then
    raise exception 'Sign in to sync.' using errcode = '42501';
  end if;
  if account is distinct from v_me then
    raise exception 'These changes belong to a different account from the one signed in.' using errcode = '42501';
  end if;
  if changes is null or jsonb_typeof(changes) <> 'array' then
    raise exception 'changes must be a list.' using errcode = '22023';
  end if;
  if jsonb_array_length(changes) > 100 then
    raise exception 'At most 100 changes at a time.' using errcode = '22023';
  end if;
  device := left(device, 64);

  -- One save at a time per account, so changes are numbered in the order they're saved.
  insert into public.sync_accounts (user_id) values (v_me) on conflict (user_id) do nothing;
  perform 1 from public.sync_accounts where user_id = v_me for update;

  for v_change in select value from jsonb_array_elements(changes) loop
    begin
      v_id      := (v_change ->> 'change_id')::uuid;
      v_kind    := v_change ->> 'kind';
      v_record  := v_change ->> 'record_id';
      v_base    := (v_change ->> 'base_version')::integer;
      v_deleted := coalesce((v_change ->> 'deleted')::boolean, false);
      v_data    := case when v_deleted then null else v_change -> 'data' end;
      v_table   := case v_kind when 'list' then 'task_lists' when 'queue' then 'task_queue'
                                when 'day' then 'day_plans' when 'context' then 'day_context'
                                else 'sync_records' end;
      if v_id is null or v_kind is null or v_record is null or length(v_record) > 64 or v_base is null or v_base < 0
         or (not v_deleted and (v_data is null or jsonb_typeof(v_data) <> 'object')) then
        raise exception 'Not a valid change.' using errcode = '22023';
      end if;

      -- Already applied (the device didn't hear back last time and tried again): report it, don't apply it twice.
      select c.version into v_done from public.sync_changes c where c.user_id = v_me and c.change_id = v_id;
      if found then
        v_results := v_results || jsonb_build_object('change_id', v_id, 'status', 'applied', 'version', v_done, 'repeat', true);
        continue;
      end if;

      v_current := null; v_cur_del := null; v_cur_data := null;
      if v_table = 'sync_records' then
        select r.version, r.deleted, r.data into v_current, v_cur_del, v_cur_data
          from public.sync_records r where r.user_id = v_me and r.kind = v_kind and r.id = v_record for update;
      else
        execute format('select version, deleted, data from public.%I where user_id = $1 and id = $2 for update', v_table)
          into v_current, v_cur_del, v_cur_data using v_me, v_record;
      end if;
      v_current := coalesce(v_current, 0);

      -- Changed by another device since this device last saw it: don't overwrite, send the latest back.
      if v_base <> v_current then
        v_results := v_results || jsonb_build_object('change_id', v_id, 'status', 'conflict', 'version', v_current,
          'deleted', coalesce(v_cur_del, false), 'data', v_cur_data);
        continue;
      end if;

      update public.sync_accounts set last_seq = last_seq + 1 where user_id = v_me returning last_seq into v_seq;
      if v_table = 'sync_records' then
        if v_current = 0 then
          insert into public.sync_records (user_id, kind, id, data, deleted, version, seq, updated_by)
            values (v_me, v_kind, v_record, v_data, v_deleted, 1, v_seq, device);
        else
          update public.sync_records set data = v_data, deleted = v_deleted, version = version + 1, seq = v_seq, updated_at = now(), updated_by = device
            where user_id = v_me and kind = v_kind and id = v_record;
        end if;
      elsif v_current = 0 then
        execute format('insert into public.%I (user_id, id, data, deleted, version, seq, updated_by) values ($1, $2, $3, $4, 1, $5, $6)', v_table)
          using v_me, v_record, v_data, v_deleted, v_seq, device;
      else
        execute format('update public.%I set data = $3, deleted = $4, version = version + 1, seq = $5, updated_at = now(), updated_by = $6
                        where user_id = $1 and id = $2', v_table)
          using v_me, v_record, v_data, v_deleted, v_seq, device;
      end if;
      insert into public.sync_changes (user_id, change_id, kind, record_id, version)
        values (v_me, v_id, v_kind, v_record, v_current + 1);
      v_results := v_results || jsonb_build_object('change_id', v_id, 'status', 'applied', 'version', v_current + 1, 'seq', v_seq);
    exception
      -- A change that isn't valid is reported and skipped (nothing of it is saved, and the seq number it took is
      -- given back with the rest of this change); the others still go ahead.
      when check_violation or invalid_text_representation or invalid_parameter_value or not_null_violation
        or string_data_right_truncation or numeric_value_out_of_range or datetime_field_overflow then
        v_results := v_results || jsonb_build_object('change_id', v_change ->> 'change_id', 'status', 'rejected', 'reason', sqlerrm);
    end;
  end loop;

  delete from public.sync_changes where user_id = v_me and applied_at < now() - interval '90 days';
  return v_results;
end;
$$;

-- ---------- Reading changes (replaces the first milestone's sync_pull) ----------
create or replace function public.sync_pull(account uuid, since bigint default 0, max_rows integer default 500)
returns table (kind text, record_id text, version integer, deleted boolean, data jsonb, seq bigint, updated_at timestamptz, updated_by text)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'Sign in to sync.' using errcode = '42501';
  end if;
  if account is distinct from v_me then
    raise exception 'This device syncs with a different account from the one signed in.' using errcode = '42501';
  end if;
  return query
    select r.* from (
      select 'list'::text, t.id, t.version, t.deleted, t.data, t.seq, t.updated_at, t.updated_by
        from public.task_lists t where t.user_id = v_me and t.seq > since
      union all
      select 'queue'::text, t.id, t.version, t.deleted, t.data, t.seq, t.updated_at, t.updated_by
        from public.task_queue t where t.user_id = v_me and t.seq > since
      union all
      select 'day'::text, t.id, t.version, t.deleted, t.data, t.seq, t.updated_at, t.updated_by
        from public.day_plans t where t.user_id = v_me and t.seq > since
      union all
      select 'context'::text, t.id, t.version, t.deleted, t.data, t.seq, t.updated_at, t.updated_by
        from public.day_context t where t.user_id = v_me and t.seq > since
      union all
      select t.kind, t.id, t.version, t.deleted, t.data, t.seq, t.updated_at, t.updated_by
        from public.sync_records t where t.user_id = v_me and t.seq > since
    ) r
    order by 6
    limit least(greatest(coalesce(max_rows, 500), 1), 1000);
end;
$$;

-- Only signed-in users may call these (replacing a function keeps its grants; they're set again to be sure).
revoke all on function public.sync_push(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.sync_pull(uuid, bigint, integer) from public, anon, authenticated;
grant execute on function public.sync_push(uuid, jsonb, text) to authenticated;
grant execute on function public.sync_pull(uuid, bigint, integer) to authenticated;
