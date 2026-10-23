-- Split project wire records. The browser/export shape stays nested and unchanged.
-- Apply only with the matching client release, after backups on every device. Legacy sync endpoints
-- refuse all traffic after this migration so an older client cannot overwrite a converted project.
-- Conversion is atomic. Original live project rows remain in an account-isolated recovery table.
begin;
lock table public.sync_accounts in access exclusive mode;
lock table public.sync_records in access exclusive mode;

create table public.sync_project_legacy (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  version integer not null,
  core_version integer not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.sync_project_legacy enable row level security;
revoke all on public.sync_project_legacy from public, anon, authenticated;
grant select on public.sync_project_legacy to authenticated;
create policy "Read own original projects" on public.sync_project_legacy for select to authenticated
  using ((select auth.uid()) = user_id);

alter table public.sync_records drop constraint sync_records_known_kind;
alter table public.sync_records drop constraint sync_records_deletable_kind;
alter table public.sync_records add constraint sync_records_known_kind check (kind in (
  'settings','rota','pay','holidays','finance','study','workout','food','fitness','notes','tasks','patterns',
  'commitment','note','task','session','review','wsession','recipe','project','cybersecurity','cyber_attempt',
  'arabic','arabic_attempt','arabic_card','cyber_card','daily','book',
  'project_milestone','project_decision','project_choice','project_model','project_case',
  'project_issue','project_evidence','project_timeline'));
alter table public.sync_records add constraint sync_records_deletable_kind check (not deleted or kind in (
  'commitment','note','task','session','review','wsession','recipe','project','cyber_attempt','arabic_attempt',
  'arabic_card','cyber_card','book','project_milestone','project_decision','project_choice','project_model',
  'project_case','project_issue','project_evidence','project_timeline'));
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid = 'public.sync_records'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) like '%id ~%'
  loop execute format('alter table public.sync_records drop constraint %I', c.conname); end loop;
end $$;
alter table public.sync_records add constraint sync_records_record_id check (
  (kind not like 'project\_%' escape '\' and id ~ '^[A-Za-z0-9_.:-]{1,64}$') or
  (kind like 'project\_%' escape '\' and length(id) <= 2048 and id ~ '^[0-9a-f]+(\.[0-9a-f]+){0,2}$'));

create function public.sync_project_key(parts text[]) returns text
language sql immutable strict set search_path = '' as $$
  select string_agg(encode(convert_to(part, 'UTF8'), 'hex'), '.' order by n)
  from unnest(parts) with ordinality as t(part,n)
$$;
revoke all on function public.sync_project_key(text[]) from public, anon, authenticated;

create function public.sync_project_parts(p jsonb)
returns table(kind text, id text, data jsonb)
language plpgsql set search_path = '' as $$
declare x jsonb; d jsonb; h jsonb; n bigint; j bigint; k text; pid text := p->>'id';
begin
  if jsonb_typeof(p) is distinct from 'object' or pid is null then
    raise exception 'An original project cannot be converted. Export a backup and inspect it first.';
  end if;
  foreach k in array array['milestones','decisions'] loop
    if p ? k and jsonb_typeof(p->k) is distinct from 'array' then
      raise exception 'An original project has an unreadable % list. Export a backup and inspect it first.', k;
    end if;
  end loop;
  kind := 'project'; id := pid;
  data := jsonb_build_object('projectId',pid,'value',p - array['milestones','decisions','model','case']); return next;
  for x,n in select value, ordinality-1 from jsonb_array_elements(coalesce(p->'milestones','[]')) with ordinality loop
    kind := 'project_milestone'; id := public.sync_project_key(array[pid,x->>'id']);
    data := jsonb_build_object('projectId',pid,'index',n,'value',x); return next;
  end loop;
  for d,n in select value, ordinality-1 from jsonb_array_elements(coalesce(p->'decisions','[]')) with ordinality loop
    kind := 'project_decision'; id := public.sync_project_key(array[pid,d->>'id']);
    data := jsonb_build_object('projectId',pid,'index',n,'value',d-'history'); return next;
    if d ? 'history' and jsonb_typeof(d->'history') is distinct from 'array' then
      raise exception 'An original decision has unreadable history. Export a backup and inspect it first.';
    end if;
    for h,j in select value, ordinality-1 from jsonb_array_elements(coalesce(d->'history','[]')) with ordinality loop
      kind := 'project_choice'; id := public.sync_project_key(array[pid,d->>'id',h->>'id']);
      data := jsonb_build_object('projectId',pid,'decisionId',d->>'id','index',j,'value',h); return next;
    end loop;
  end loop;
  if p ? 'model' then
    if jsonb_typeof(p->'model') is distinct from 'object' then raise exception 'An original Model is unreadable.'; end if;
    kind := 'project_model'; id := public.sync_project_key(array[pid]);
    data := jsonb_build_object('projectId',pid,'value',p->'model'); return next;
  end if;
  if p ? 'case' then
    if jsonb_typeof(p->'case') is distinct from 'object' then raise exception 'An original Case is unreadable.'; end if;
    kind := 'project_case'; id := public.sync_project_key(array[pid]);
    data := jsonb_build_object('projectId',pid,'value',(p->'case')-array['timeline','evidence','issues']); return next;
    foreach k in array array['issues','evidence','timeline'] loop
      if p->'case' ? k and jsonb_typeof(p->'case'->k) is distinct from 'array' then
        raise exception 'An original Case has an unreadable % list.', k;
      end if;
      for x,n in select value, ordinality-1 from jsonb_array_elements(coalesce(p->'case'->k,'[]')) with ordinality loop
        kind := case k when 'issues' then 'project_issue' when 'evidence' then 'project_evidence' else 'project_timeline' end;
        id := public.sync_project_key(array[pid,x->>'id']);
        data := jsonb_build_object('projectId',pid,'index',n,'value',x); return next;
      end loop;
    end loop;
  end if;
end $$;
revoke all on function public.sync_project_parts(jsonb) from public, anon, authenticated;

-- Convert only the cloud representation. No browser data is rewritten and no field or history is pruned.
do $$ declare p record; r record; v_seq bigint; begin
  for p in select * from public.sync_records where kind='project' and not deleted order by user_id,id loop
    insert into public.sync_project_legacy(user_id,id,version,core_version,data)
      values(p.user_id,p.id,p.version,p.version+1,p.data);
    for r in select * from public.sync_project_parts(p.data) loop
      update public.sync_accounts set last_seq=last_seq+1 where user_id=p.user_id returning last_seq into v_seq;
      if r.kind='project' then
        update public.sync_records set data=r.data,version=version+1,seq=v_seq where user_id=p.user_id and kind='project' and id=p.id;
      else
        insert into public.sync_records(user_id,kind,id,data,version,seq,updated_at,updated_by)
          values(p.user_id,r.kind,r.id,r.data,1,v_seq,p.updated_at,p.updated_by);
      end if;
    end loop;
  end loop;
end $$;

create function public.sync_project_validate() returns trigger language plpgsql set search_path = '' as $$
declare ids text[]; pid text; did text; item text; needed integer;
begin
  if new.kind <> 'project' and new.kind not like 'project\_%' escape '\' then return new; end if;
  if new.deleted then return new; end if;
  if jsonb_typeof(new.data->'value') is distinct from 'object' then raise exception 'Not a valid project record.' using errcode='22023'; end if;
  if new.kind='project' then
    if new.data->>'projectId' is distinct from new.id or new.data->'value'->>'id' is distinct from new.id
      or (new.data->'value') ?| array['milestones','decisions','model','case'] then
      raise exception 'Project details must use the split storage format.' using errcode='22023';
    end if;
    return new;
  end if;
  ids := string_to_array(new.id,'.');
  needed := case new.kind when 'project_choice' then 3 when 'project_model' then 1 when 'project_case' then 1 else 2 end;
  if cardinality(ids)<>needed or exists(select 1 from unnest(ids) x where x !~ '^([0-9a-f]{2})+$') then
    raise exception 'Not a valid project record identifier.' using errcode='22023';
  end if;
  pid := convert_from(decode(ids[1],'hex'),'UTF8');
  if new.data->>'projectId' is distinct from pid then raise exception 'Project ownership does not match.' using errcode='22023'; end if;
  if not exists(select 1 from public.sync_records r where r.user_id=new.user_id and r.kind='project' and r.id=pid and not r.deleted) then
    raise exception 'The project was removed. Resolve its change before saving this item.' using errcode='22023';
  end if;
  if needed>1 then
    item := convert_from(decode(ids[needed],'hex'),'UTF8');
    if new.data->'value'->>'id' is distinct from item or jsonb_typeof(new.data->'index') is distinct from 'number'
      or (new.data->>'index')::numeric>9007199254740991 or (new.data->>'index')::numeric<0 or (new.data->>'index')::numeric<>trunc((new.data->>'index')::numeric) then
      raise exception 'Not a valid ordered project item.' using errcode='22023';
    end if;
  end if;
  if new.kind='project_choice' then
    did := convert_from(decode(ids[2],'hex'),'UTF8');
    if new.data->>'decisionId' is distinct from did or not exists(select 1 from public.sync_records r
      where r.user_id=new.user_id and r.kind='project_decision' and r.id=ids[1]||'.'||ids[2] and not r.deleted) then
      raise exception 'The decision was removed. Resolve its change before saving this choice.' using errcode='22023';
    end if;
  elsif new.kind in ('project_issue','project_evidence','project_timeline') and not exists(select 1 from public.sync_records r
    where r.user_id=new.user_id and r.kind='project_case' and r.id=ids[1] and not r.deleted) then
    raise exception 'The Case was removed. Resolve its change before saving this item.' using errcode='22023';
  end if;
  if new.kind='project_decision' and new.data->'value' ? 'history' then
    raise exception 'Each previous choice must be saved separately.' using errcode='22023';
  end if;
  if new.kind='project_case' and (new.data->'value') ?| array['timeline','evidence','issues'] then
    raise exception 'Each Case item must be saved separately.' using errcode='22023';
  end if;
  return new;
end $$;
revoke all on function public.sync_project_validate() from public,anon,authenticated;
create trigger sync_project_validate before insert or update on public.sync_records for each row execute function public.sync_project_validate();

-- Check every converted row before installing revision propagation. A malformed nested item must abort
-- the entire conversion, never leave an unreadable child behind or change the archived baseline versions.
update public.sync_records set data=data where (kind='project' or kind like 'project\_%' escape '\') and not deleted;

-- Parent versions also cover their descendants. A stale project/decision deletion therefore conflicts
-- with a newer child edit. Individual child records still have independent content and version checks.
create function public.sync_project_changed() returns trigger language plpgsql set search_path = '' as $$
declare r record; n bigint; parent_kind text; parent_id text; ids text[]; prefix text;
begin
  if new.kind <> 'project' and new.kind not like 'project\_%' escape '\' then return new; end if;
  ids:=string_to_array(new.id,'.');
  if new.deleted and new.kind in ('project','project_decision','project_case') then
    prefix:=case when new.kind='project' then public.sync_project_key(array[new.id]) else new.id end;
    for r in select kind,id from public.sync_records t where t.user_id=new.user_id and not t.deleted and (
      (new.kind='project' and t.kind like 'project\_%' escape '\' and (t.id=prefix or t.id like prefix||'.%')) or
      (new.kind='project_decision' and t.kind='project_choice' and t.id like prefix||'.%') or
      (new.kind='project_case' and t.kind in ('project_issue','project_evidence','project_timeline') and t.id like prefix||'.%')) order by kind,id
    loop
      if not exists(select 1 from public.sync_records t where t.user_id=new.user_id and t.kind=r.kind and t.id=r.id and not t.deleted) then continue; end if;
      update public.sync_accounts set last_seq=last_seq+1 where user_id=new.user_id returning last_seq into n;
      update public.sync_records set deleted=true,data=null,version=version+1,seq=n,updated_at=now(),updated_by=new.updated_by
        where user_id=new.user_id and kind=r.kind and id=r.id and not deleted;
    end loop;
  end if;
  if new.kind='project' then return new; end if;
  -- During a project cascade some intermediate parents are still live. Do not revise/validate those
  -- parents against a project that has already become a tombstone.
  if not exists(select 1 from public.sync_records t where t.user_id=new.user_id and t.kind='project'
    and t.id=convert_from(decode(ids[1],'hex'),'UTF8') and not t.deleted) then return new; end if;
  if new.kind='project_choice' then parent_kind:='project_decision'; parent_id:=ids[1]||'.'||ids[2];
  elsif new.kind in ('project_issue','project_evidence','project_timeline') then parent_kind:='project_case'; parent_id:=ids[1];
  else parent_kind:='project'; parent_id:=convert_from(decode(ids[1],'hex'),'UTF8'); end if;
  if exists(select 1 from public.sync_records t where t.user_id=new.user_id and t.kind=parent_kind and t.id=parent_id and not t.deleted) then
    update public.sync_accounts set last_seq=last_seq+1 where user_id=new.user_id returning last_seq into n;
    update public.sync_records set version=version+1,seq=n,updated_at=now(),updated_by=new.updated_by
      where user_id=new.user_id and kind=parent_kind and id=parent_id and not deleted;
  end if;
  return new;
end $$;
revoke all on function public.sync_project_changed() from public,anon,authenticated;
create trigger sync_project_changed after insert or update on public.sync_records for each row execute function public.sync_project_changed();

create function public.sync_project_upgrade_rows(account uuid)
returns table(id text,version integer,core_version integer,data jsonb)
language plpgsql stable security invoker set search_path='' as $$
begin
  if auth.uid() is null or account is distinct from auth.uid() then raise exception 'Sign in to the matching account.' using errcode='42501'; end if;
  return query select p.id,p.version,p.core_version,p.data from public.sync_project_legacy p where p.user_id=auth.uid();
end $$;
revoke all on function public.sync_project_upgrade_rows(uuid) from public,anon,authenticated;
grant execute on function public.sync_project_upgrade_rows(uuid) to authenticated;

-- The established CAS/retry protocol, with the split record id allowance.
create or replace function public.sync_push_v2(account uuid, changes jsonb, device text default null)
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
      if v_id is null or v_kind is null or v_record is null or length(v_record) > (case when v_kind like 'project\_%' escape '\' then 2048 else 64 end) or v_base is null or v_base < 0
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
        or string_data_right_truncation or numeric_value_out_of_range or datetime_field_overflow or character_not_in_repertoire then
        v_results := v_results || jsonb_build_object('change_id', v_change ->> 'change_id', 'status', 'rejected', 'reason', sqlerrm);
    end;
  end loop;

  delete from public.sync_changes where user_id = v_me and applied_at < now() - interval '90 days';
  return v_results;
end;
$$;

-- ---------- Reading changes (replaces the first milestone's sync_pull) ----------
create or replace function public.sync_pull_v2(account uuid, since bigint default 0, max_rows integer default 500)
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


revoke all on function public.sync_push_v2(uuid,jsonb,text) from public,anon,authenticated;
revoke all on function public.sync_pull_v2(uuid,bigint,integer) from public,anon,authenticated;
grant execute on function public.sync_push_v2(uuid,jsonb,text) to authenticated;
grant execute on function public.sync_pull_v2(uuid,bigint,integer) to authenticated;

-- Retain the old signatures with a clear refusal. They cannot save or download a partial project.
create or replace function public.sync_push(account uuid, changes jsonb, device text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to sync.' using errcode='42501'; end if;
  if account is distinct from auth.uid() then raise exception 'These changes belong to a different account.' using errcode='42501'; end if;
  raise exception 'Update MyDay on this device to continue syncing. Project storage has changed; your local data is still here.' using errcode='0A000';
end $$;
create or replace function public.sync_pull(account uuid, since bigint default 0, max_rows integer default 500)
returns table(kind text,record_id text,version integer,deleted boolean,data jsonb,seq bigint,updated_at timestamptz,updated_by text)
language plpgsql stable security invoker set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to sync.' using errcode='42501'; end if;
  if account is distinct from auth.uid() then raise exception 'This device syncs with a different account.' using errcode='42501'; end if;
  raise exception 'Update MyDay on this device to continue syncing. Project storage has changed; your local data is still here.' using errcode='0A000';
end $$;
commit;
