-- MyDay AI planning prototype: request, token and spending limits, per account.
--
-- The ai-plan Edge Function calls ai_begin() before every model request and ai_finish() after it. ai_begin()
-- refuses (and nothing is sent to the model) when the account has reached its requests for the day, asked again
-- too quickly, or would go over its monthly budget. The budget is charged up front with the most the request could
-- cost (the whole input plus the longest reply allowed) and never refunded, so real spending is always lower.
-- The limits themselves come from the Edge Function's settings, not from the app.
--
-- Security: Row Level Security is on and nobody can read or write the table directly. The two functions only ever
-- touch the signed-in account's own rows (auth.uid()). Calling them directly can only use up your own allowance:
-- the AI key lives only in the Edge Function. No request content (tasks, notes, sleep) is stored here — only counts.

create table public.ai_usage (
  user_id         uuid not null references auth.users (id) on delete cascade,
  day             date not null,                      -- UTC date
  requests        integer not null default 0,
  reserved_usd    numeric(12, 6) not null default 0,  -- the most this day's requests could have cost
  input_tokens    bigint not null default 0,          -- as reported by the model provider
  output_tokens   bigint not null default 0,
  last_request_at timestamptz,
  primary key (user_id, day)
);
comment on table public.ai_usage is 'MyDay: AI requests, tokens and the spending reserved per account and day (counts only, no content).';

alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from anon, authenticated;

-- Before a model request. Returns {"ok": true} or {"ok": false, "reason": "daily" | "too-fast" | "budget"}.
create function public.ai_begin(per_day integer, monthly_usd numeric, reserve_usd numeric, min_seconds integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me    uuid := auth.uid();
  v_day   date := (now() at time zone 'utc')::date;
  v_row   public.ai_usage;
  v_month numeric;
begin
  if v_me is null then
    raise exception 'Sign in to use AI help.' using errcode = '42501';
  end if;
  if per_day is null or per_day < 1 or per_day > 500
     or monthly_usd is null or monthly_usd < 0 or monthly_usd > 100
     or reserve_usd is null or reserve_usd < 0 or reserve_usd > 1
     or min_seconds is null or min_seconds < 0 or min_seconds > 3600 then
    raise exception 'Limits out of range.' using errcode = '22023';
  end if;

  -- One request at a time per account, so two requests can't both slip under a limit: a lock on the account (held
  -- until this transaction ends) — not just on today's row, which would let two requests either side of midnight
  -- both read the month's total without the other's reservation.
  perform pg_advisory_xact_lock(hashtextextended('myday-ai:' || v_me::text, 0));
  insert into public.ai_usage (user_id, day) values (v_me, v_day) on conflict (user_id, day) do nothing;
  select * into v_row from public.ai_usage where user_id = v_me and day = v_day for update;

  if v_row.requests >= per_day then
    return jsonb_build_object('ok', false, 'reason', 'daily');
  end if;
  if v_row.last_request_at is not null and v_row.last_request_at > now() - make_interval(secs => min_seconds) then
    return jsonb_build_object('ok', false, 'reason', 'too-fast');
  end if;
  select coalesce(sum(u.reserved_usd), 0) into v_month
    from public.ai_usage u where u.user_id = v_me and u.day >= date_trunc('month', v_day)::date;
  if v_month + reserve_usd > monthly_usd then
    return jsonb_build_object('ok', false, 'reason', 'budget');
  end if;

  update public.ai_usage
     set requests = requests + 1, reserved_usd = reserved_usd + reserve_usd, last_request_at = now()
   where user_id = v_me and day = v_day;
  return jsonb_build_object('ok', true, 'requests_today', v_row.requests + 1);
end;
$$;

-- After a model request: the tokens the provider reported (for your own records; it can only add).
create function public.ai_finish(input_tokens integer, output_tokens integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me  uuid := auth.uid();
  v_day date := (now() at time zone 'utc')::date;
begin
  if v_me is null then
    raise exception 'Sign in to use AI help.' using errcode = '42501';
  end if;
  update public.ai_usage u
     set input_tokens  = u.input_tokens  + least(greatest(coalesce(ai_finish.input_tokens, 0), 0), 200000),
         output_tokens = u.output_tokens + least(greatest(coalesce(ai_finish.output_tokens, 0), 0), 200000)
   where u.user_id = v_me and u.day = v_day;
end;
$$;

revoke all on function public.ai_begin(integer, numeric, numeric, integer) from public, anon, authenticated;
revoke all on function public.ai_finish(integer, integer) from public, anon, authenticated;
grant execute on function public.ai_begin(integer, numeric, numeric, integer) to authenticated;
grant execute on function public.ai_finish(integer, integer) to authenticated;
