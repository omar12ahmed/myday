-- A small stand-in for the parts of Supabase that MyDay's database migrations rely on, so the migrations
-- (supabase/migrations/*.sql) can be tested in an ordinary PostgreSQL (PGlite) without a Supabase project.
-- It is only for tests: a real Supabase project already has all of this.
--
-- Roles: anon (signed out), authenticated (signed in) and service_role (server-side only; bypasses RLS).
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

-- Accounts, and auth.uid(): the signed-in user's id, read from the request's token claims as Supabase does.
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id                 uuid primary key,
  email              text unique,
  encrypted_password text,
  created_at         timestamptz not null default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

-- Supabase's defaults for the public schema: the API roles can use it, and new tables, functions and
-- sequences are granted to them. (The migrations must take back whatever they don't want to allow.)
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
