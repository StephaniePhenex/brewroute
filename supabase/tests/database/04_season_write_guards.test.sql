-- Issue #1 — PR #20 review: season status and raffle results are not writable
-- by clients; activation is a scoped SECURITY DEFINER function that serialises
-- callers; only the server (service_role) records a draw, once.
-- AC 1.1, 1.6, 3.2, 3.5, 3.6 · ADR-2, ADR-4
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Fixtures (as postgres) -------------------------------------------------------
-- e1 ADMIN, e2 USER
-- f1 ACTIVE, f2 DRAFT, f3 DRAFT (raffle target)
update public.seasons set status = 'ARCHIVED' where status = 'ACTIVE';

insert into public.users (id, auth_subject, display_name, role)
values
  ('00000000-0000-0000-0000-0000000000e1', 'test-guard-admin', 'Guard Admin', 'ADMIN'),
  ('00000000-0000-0000-0000-0000000000e2', 'test-guard-user', 'Guard User', 'USER');

insert into public.seasons (id, name, status, min_checkins, winner_count, public_seed)
values
  ('00000000-0000-0000-0000-0000000000f1', 'Guard Active', 'ACTIVE', 3, 2, 'GUARD-ACTIVE-2026'),
  ('00000000-0000-0000-0000-0000000000f2', 'Guard Next', 'DRAFT', 3, 2, 'GUARD-NEXT-2026'),
  ('00000000-0000-0000-0000-0000000000f3', 'Guard Raffle', 'DRAFT', 2, 1, 'GUARD-RAFFLE-2026');

-- =============================================================================
-- Privileges (catalog checks, independent of RLS)
-- =============================================================================
select ok(not has_column_privilege('authenticated', 'public.seasons', 'status', 'UPDATE'),
  'authenticated has no UPDATE on seasons.status');
select ok(not has_column_privilege('authenticated', 'public.seasons', 'pool_snapshot', 'UPDATE'),
  'authenticated has no UPDATE on seasons.pool_snapshot');
select ok(not has_column_privilege('authenticated', 'public.seasons', 'winners', 'UPDATE'),
  'authenticated has no UPDATE on seasons.winners');
select ok(not has_column_privilege('authenticated', 'public.seasons', 'raffle_drawn_at', 'UPDATE'),
  'authenticated has no UPDATE on seasons.raffle_drawn_at');
select ok(has_column_privilege('authenticated', 'public.seasons', 'theme', 'UPDATE'),
  'authenticated keeps UPDATE on editable season fields');

select ok(has_column_privilege('service_role', 'public.seasons', 'pool_snapshot', 'UPDATE')
      and has_column_privilege('service_role', 'public.seasons', 'winners', 'UPDATE')
      and has_column_privilege('service_role', 'public.seasons', 'raffle_drawn_at', 'UPDATE'),
  'service_role is explicitly granted UPDATE on the raffle result columns');

select is_definer('public', 'activate_season', array['uuid'],
  'activate_season is SECURITY DEFINER');
select is(
  (select proconfig from pg_proc where oid = 'public.activate_season(uuid)'::regprocedure),
  array['search_path=""'],
  'activate_season pins search_path to empty');
select ok(not has_function_privilege('anon', 'public.activate_season(uuid)', 'EXECUTE'),
  'anon cannot execute activate_season');
select ok(not has_function_privilege('public', 'public.activate_season(uuid)', 'EXECUTE'),
  'PUBLIC cannot execute activate_season');

-- =============================================================================
-- Authenticated ADMIN: no direct status or raffle-result writes
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"test-guard-admin","role":"authenticated","app_role":"ADMIN"}', true);

select ok(private.is_admin(), 'fixture: e1 is an admin by users.role');

select throws_ok($$
  update public.seasons set status = 'ARCHIVED' where id = '00000000-0000-0000-0000-0000000000f1'
$$, '42501', null, 'ADR-2: ADMIN cannot archive the only ACTIVE season directly');

select throws_ok($$
  update public.seasons set status = 'DRAFT' where id = '00000000-0000-0000-0000-0000000000f1'
$$, '42501', null, 'ADR-2: ADMIN cannot move a season back to DRAFT directly');

select throws_ok($$
  update public.seasons set winners = '["x"]' where id = '00000000-0000-0000-0000-0000000000f3'
$$, '42501', null, 'ADR-4: ADMIN client cannot write winners');

select throws_ok($$
  update public.seasons set pool_snapshot = '["x"]' where id = '00000000-0000-0000-0000-0000000000f3'
$$, '42501', null, 'ADR-4: ADMIN client cannot write pool_snapshot');

select throws_ok($$
  update public.seasons set raffle_drawn_at = now() where id = '00000000-0000-0000-0000-0000000000f3'
$$, '42501', null, 'ADR-4: ADMIN client cannot write raffle_drawn_at');

with u as (
  update public.seasons set theme = 'Guard theme'
  where id = '00000000-0000-0000-0000-0000000000f2' returning 1
)
select is(count(*)::int, 1, 'ADMIN can still edit non-sensitive season fields') from u;

-- =============================================================================
-- activate_season: authorised path, invariant and serialisation
-- =============================================================================
select lives_ok($$
  select public.activate_season('00000000-0000-0000-0000-0000000000f2')
$$, 'AC 1.6: ADMIN can activate a season through the function');

select ok(
  exists (
    select 1 from pg_locks
    where locktype = 'advisory' and pid = pg_backend_pid() and granted
  ),
  'ADR-2: activate_season takes a transaction-scoped advisory lock (serialises concurrent activations)');

select lives_ok($$
  select public.activate_season('00000000-0000-0000-0000-0000000000f2')
$$, 'activating the already-ACTIVE season is a no-op, not an error');

reset role;

select is(
  (select status::text from public.seasons where id = '00000000-0000-0000-0000-0000000000f2'),
  'ACTIVE', 'AC 1.6: target season is ACTIVE');
select is(
  (select status::text from public.seasons where id = '00000000-0000-0000-0000-0000000000f1'),
  'ARCHIVED', 'AC 1.6: previous ACTIVE season is ARCHIVED');
select is(
  (select count(*)::int from public.seasons where status = 'ACTIVE'),
  1, 'ADR-2: exactly one ACTIVE season after repeated activation');

-- =============================================================================
-- Forged claims: authorization comes from users.role, never the token
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"test-guard-user","role":"authenticated","app_role":"ADMIN","user_role":"ADMIN"}', true);

select ok(not private.is_admin(), 'forged app_role ADMIN does not make a USER an admin');

select throws_ok($$
  select public.activate_season('00000000-0000-0000-0000-0000000000f3')
$$, 'PT403', null, 'AC 1.1: forged app_role ADMIN cannot activate a season (HTTP 403)');

select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed)
  values ('Forged Guard', 1, 1, 'FORGED-GUARD-2026')
$$, '42501', null, 'AC 1.1: forged app_role ADMIN cannot create seasons');

with u as (
  update public.seasons set theme = 'forged'
  where id = '00000000-0000-0000-0000-0000000000f2' returning 1
)
select is(count(*)::int, 0, 'AC 1.1: forged app_role ADMIN cannot edit seasons') from u;

-- A role claim that does not match the Postgres role grants nothing: the
-- function only trusts users.role, not auth.role() or the role claim.
select set_config('request.jwt.claims',
  '{"sub":"test-guard-user","role":"service_role"}', true);

select throws_ok($$
  select public.activate_season('00000000-0000-0000-0000-0000000000f3')
$$, 'PT403', null, 'a forged service_role claim cannot activate a season');

-- Unknown subject (signed in with Clerk, no users row yet).
select set_config('request.jwt.claims',
  '{"sub":"user_not_in_db","role":"authenticated","app_role":"ADMIN"}', true);

select throws_ok($$
  select public.activate_season('00000000-0000-0000-0000-0000000000f3')
$$, 'PT403', null, 'a subject without a users row cannot activate a season');

reset role;

-- =============================================================================
-- service_role records the draw once; the PT409 lock blocks a second write
-- =============================================================================
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

select lives_ok($$
  update public.seasons
  set pool_snapshot = '["u1","u2"]', winners = '["u2"]', raffle_drawn_at = now()
  where id = '00000000-0000-0000-0000-0000000000f3'
$$, 'AC 3.5: service_role can persist the first draw');

select throws_ok($$
  update public.seasons
  set pool_snapshot = '["u1","u2","u3"]', winners = '["u3"]', raffle_drawn_at = now()
  where id = '00000000-0000-0000-0000-0000000000f3'
$$, 'PT409', null, 'AC 3.6: a second draw write is rejected (HTTP 409)');

reset role;

select is(
  (select winners::text from public.seasons where id = '00000000-0000-0000-0000-0000000000f3'),
  '["u2"]', 'AC 3.6: published winners are unchanged');

select * from finish();
rollback;
