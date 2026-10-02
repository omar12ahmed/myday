-- MyDay cloud sync, first milestone: task lists, the queue, daily plans and each day's context.
--
-- What this creates
--   Four record tables, one per kind of record. Every row belongs to one account (user_id) and has a stable
--   id chosen by the app, so the same record is never stored twice:
--     task_lists   id 'learning' | 'admin' | 'health'   data { "items": [ { id, title, minutes }, … ] }
--     task_queue   id 'queue'                          data { "items": [ { qid, taskId, category, title, … }, … ] }
--     day_plans    id 'YYYY-MM-DD'                     data { energy, rest, builtAt, checkedIn, tasks: [ … ] }
--     day_context  id 'YYYY-MM-DD'                     data { energy, sleep: { start, end, estimatedHours } }
--   Each row also has a version (1, 2, 3 … one more for every change), a deleted flag (a deleted day plan
--   is kept as a "tombstone" with no data, so other devices learn it was deleted and it never comes back),
--   and a seq number: the account's changes are numbered in the order they were saved, so a device can
--   ask "what changed since number N?" without relying on any device's clock.
--
--   sync_accounts  one row per account: the last seq number given out.
--   sync_changes   every change applied, by the id the device gave it, so a retried request is never
--                  applied twice. Kept for 90 days.
--
--   sync_push(account, changes, device)  the only way to write. Each change says which version it was based
--                               on. It's applied only if that is still the latest version; otherwise nothing is
--                               written and the latest version is sent back as a conflict for you to decide.
--   sync_pull(account, since, max_rows)  the records changed after seq `since`, deletions included, oldest first.
--   Both are given the account the device's records belong to, and refuse to run if that isn't the account
--   signed in, so one account's changes can never be sent to, or mixed with, another's.
--
-- Security
--   Row Level Security is on for every table. A signed-in user can read only their own rows and can't write
--   to any table directly (there are no insert, update or delete grants). All writes go through sync_push,
--   which only ever touches rows of the signed-in account (auth.uid()). Signed-out visitors (anon) get
--   nothing. Deleting an account in Supabase deletes its rows (on delete cascade).

-- ---------- Tables ----------

create table public.sync_accounts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  last_seq   bigint not null default 0,
  created_at timestamptz not null default now()
);

create table public.task_lists (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null check (id in ('learning', 'admin', 'health')),
  data       jsonb check (data is null or (coalesce(jsonb_typeof(data -> 'items'), '') = 'array' and octet_length(data::text) <= 262144)),
  version    integer not null check (version >= 1),
  deleted    boolean not null default false check (not deleted), -- the three lists always exist
  seq        bigint not null,
  updated_at timestamptz not null default now(),
  updated_by text,                                               -- the device that saved it (a random id)
  primary key (user_id, id),
  check (deleted = (data is null))
);

create table public.task_queue (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null check (id = 'queue'),
  data       jsonb check (data is null or (coalesce(jsonb_typeof(data -> 'items'), '') = 'array' and octet_length(data::text) <= 262144)),
  version    integer not null check (version >= 1),
  deleted    boolean not null default false check (not deleted), -- the queue always exists (it may be empty)
  seq        bigint not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (user_id, id),
  check (deleted = (data is null))
);

create table public.day_plans (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null check (id ~ '^\d{4}-\d{2}-\d{2}$'),
  data       jsonb check (data is null or (coalesce(jsonb_typeof(data -> 'tasks'), '') = 'array' and octet_length(data::text) <= 262144)),
  version    integer not null check (version >= 1),
  deleted    boolean not null default false,
  seq        bigint not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (user_id, id),
  check (deleted = (data is null))
);

create table public.day_context (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null check (id ~ '^\d{4}-\d{2}-\d{2}$'),
  data       jsonb check (data is null or (coalesce(jsonb_typeof(data), '') = 'object' and octet_length(data::text) <= 65536)),
  version    integer not null check (version >= 1),
  deleted    boolean not null default false,
  seq        bigint not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (user_id, id),
  check (deleted = (data is null))
);

create table public.sync_changes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  change_id  uuid not null,
  kind       text not null,
  record_id  text not null,
  version    integer not null,
  applied_at timestamptz not null default now(),
  primary key (user_id, change_id)
);

create index task_lists_user_seq  on public.task_lists  (user_id, seq);
create index task_queue_user_seq  on public.task_queue  (user_id, seq);
create index day_plans_user_seq   on public.day_plans   (user_id, seq);
create index day_context_user_seq on public.day_context (user_id, seq);
create index sync_changes_user_applied on public.sync_changes (user_id, applied_at);

comment on table public.task_lists  is 'MyDay: the three task lists (Learning, Admin, Health), one row per list, in order.';
comment on table public.task_queue  is 'MyDay: tasks waiting for a later day, one row per account.';
comment on table public.day_plans   is 'MyDay: each day''s plan (energy, rest day, tasks, evening check-in). Deleted plans are kept as tombstones.';
comment on table public.day_context is 'MyDay: each day''s context (energy and sleep).';
comment on table public.sync_changes is 'MyDay: changes already applied, by the device''s change id, so retries are never applied twice.';

-- ---------- Who can see what ----------

alter table public.sync_accounts enable row level security;
alter table public.task_lists    enable row level security;
alter table public.task_queue    enable row level security;
alter table public.day_plans     enable row level security;
alter table public.day_context   enable row level security;
alter table public.sync_changes  enable row level security;

-- Supabase grants new tables to anon and authenticated by default. Take that back, then allow only reading.
revoke all on table public.sync_accounts, public.task_lists, public.task_queue, public.day_plans,
  public.day_context, public.sync_changes from anon, authenticated;
grant select on table public.task_lists, public.task_queue, public.day_plans, public.day_context to authenticated;

create policy "Read own task lists"  on public.task_lists  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own queue"       on public.task_queue  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own day plans"   on public.day_plans   for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own day context" on public.day_context for select to authenticated using ((select auth.uid()) = user_id);
-- sync_accounts and sync_changes have no policies: only sync_push uses them.

-- ---------- Saving changes ----------
-- `changes` is a list of up to 100 changes:
--   { "change_id": "<uuid made by the device>", "kind": "list" | "queue" | "day" | "context",
--     "record_id": "learning" | "queue" | "2026-10-02" …, "base_version": <the version the device last had; 0 = new>,
--     "deleted": false, "data": { … } }
-- One result per change, in order:
--   { "change_id", "status": "applied", "version", "seq" }          saved (or, with "repeat": true, saved by an earlier try)
--   { "change_id", "status": "conflict", "version", "deleted", "data" }  not saved: this is the latest version
--   { "change_id", "status": "rejected", "reason" }                not saved: the change isn't valid
-- Runs with the owner's rights (security definer) because users can't write to the tables themselves, so every
-- statement below is limited to the signed-in account (v_me).
create function public.sync_push(account uuid, changes jsonb, device text default null)
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
                                when 'day' then 'day_plans' when 'context' then 'day_context' end;
      if v_id is null or v_table is null or v_record is null or length(v_record) > 64 or v_base is null or v_base < 0
         or (not v_deleted and (v_data is null or jsonb_typeof(v_data) <> 'object')) then
        raise exception 'Not a valid change.' using errcode = '22023';
      end if;

      -- Already applied (the device didn't hear back last time and tried again): report it, don't apply it twice.
      select c.version into v_done from public.sync_changes c where c.user_id = v_me and c.change_id = v_id;
      if found then
        v_results := v_results || jsonb_build_object('change_id', v_id, 'status', 'applied', 'version', v_done, 'repeat', true);
        continue;
      end if;

      execute format('select version, deleted, data from public.%I where user_id = $1 and id = $2 for update', v_table)
        into v_current, v_cur_del, v_cur_data using v_me, v_record;
      v_current := coalesce(v_current, 0);

      -- Changed by another device since this device last saw it: don't overwrite, send the latest back.
      if v_base <> v_current then
        v_results := v_results || jsonb_build_object('change_id', v_id, 'status', 'conflict', 'version', v_current,
          'deleted', coalesce(v_cur_del, false), 'data', v_cur_data);
        continue;
      end if;

      update public.sync_accounts set last_seq = last_seq + 1 where user_id = v_me returning last_seq into v_seq;
      if v_current = 0 then
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
      -- A change that isn't valid is reported and skipped (nothing of it is saved); the others still go ahead.
      when check_violation or invalid_text_representation or invalid_parameter_value or not_null_violation
        or string_data_right_truncation or numeric_value_out_of_range or datetime_field_overflow then
        v_results := v_results || jsonb_build_object('change_id', v_change ->> 'change_id', 'status', 'rejected', 'reason', sqlerrm);
    end;
  end loop;

  delete from public.sync_changes where user_id = v_me and applied_at < now() - interval '90 days';
  return v_results;
end;
$$;

-- ---------- Reading changes ----------
-- Runs with the caller's rights, so Row Level Security applies as well as the user_id filter.
create function public.sync_pull(account uuid, since bigint default 0, max_rows integer default 500)
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
    ) r
    order by 6
    limit least(greatest(coalesce(max_rows, 500), 1), 1000);
end;
$$;

-- Only signed-in users may call these (Supabase grants new functions to everyone by default).
revoke all on function public.sync_push(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.sync_pull(uuid, bigint, integer) from public, anon, authenticated;
grant execute on function public.sync_push(uuid, jsonb, text) to authenticated;
grant execute on function public.sync_pull(uuid, bigint, integer) to authenticated;
