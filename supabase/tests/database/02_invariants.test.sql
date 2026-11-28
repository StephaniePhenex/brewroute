-- Issue #1 — invariants: single ACTIVE season (ADR-2), soft delete (ADR-3),
-- raffle lock (ADR-4). AC 1.6, 2.5, 2.7, 3.2, 3.6
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Fixtures -------------------------------------------------------------------
update public.seasons set status = 'ARCHIVED' where status = 'ACTIVE';

insert into public.users (id, auth_subject, display_name, role)
values
  ('00000000-0000-0000-0000-0000000000a1', 'test-inv-admin', 'Inv Admin', 'ADMIN'),
  ('00000000-0000-0000-0000-0000000000a2', 'test-inv-user', 'Inv User', 'USER');

insert into public.seasons (id, name, status, min_checkins, winner_count, public_seed)
values
  ('00000000-0000-0000-0000-0000000000b1', 'Current Season', 'ACTIVE', 3, 2, 'CURRENT-2026'),
  ('00000000-0000-0000-0000-0000000000b2', 'Next Season', 'DRAFT', 3, 2, 'NEXT-2026');

insert into public.cafes (id, season_id, name, address, latitude, longitude, tags, sort_order)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1',
        'Moka Test', '1 Test St', 42.34, -71.09, array['quiet'], 0);

-- AC 1.6: at most one ACTIVE ----------------------------------------------------
select throws_ok($$
  insert into public.seasons (name, status, min_checkins, winner_count, public_seed)
  values ('Second Active', 'ACTIVE', 1, 1, 'SECOND-2026')
$$, '23505', null, 'AC 1.6: inserting a second ACTIVE season is rejected');

select throws_ok($$
  update public.seasons set status = 'ACTIVE' where id = '00000000-0000-0000-0000-0000000000b2'
$$, '23505', null, 'AC 1.6: promoting a second season directly is rejected');

-- AC 1.6: activate_season is the transactional path ---------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"test-inv-user","role":"authenticated"}', true);

select throws_ok($$
  select public.activate_season('00000000-0000-0000-0000-0000000000b2')
$$, 'PT403', null, 'AC 1.1: a USER cannot activate a season (HTTP 403)');

select set_config('request.jwt.claims', '{"sub":"test-inv-admin","role":"authenticated"}', true);

select throws_ok($$
  select public.activate_season('00000000-0000-0000-0000-00000000ffff')
$$, 'PT404', null, 'activating a missing season fails (HTTP 404)');

select lives_ok($$
  select public.activate_season('00000000-0000-0000-0000-0000000000b2')
$$, 'AC 1.6: ADMIN can activate a season');

reset role;

select is(
  (select status::text from public.seasons where id = '00000000-0000-0000-0000-0000000000b2'),
  'ACTIVE', 'AC 1.6: target season is ACTIVE');
select is(
  (select status::text from public.seasons where id = '00000000-0000-0000-0000-0000000000b1'),
  'ARCHIVED', 'AC 1.6: previous ACTIVE season is ARCHIVED');
select is(
  (select count(*)::int from public.seasons where status = 'ACTIVE'),
  1, 'AC 1.6: exactly one ACTIVE season remains');

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$
  select public.activate_season('00000000-0000-0000-0000-0000000000b1')
$$, '42501', null, 'anon cannot execute activate_season');
reset role;

-- ADR-3 / AC 2.5, 2.7: soft delete only -----------------------------------------
select throws_ok($$
  delete from public.cafes where id = '00000000-0000-0000-0000-0000000000c1'
$$, 'P0001', null, 'ADR-3: hard DELETE of a café is blocked even for privileged roles');

select lives_ok($$
  update public.cafes set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000c1'
$$, 'AC 2.5: soft delete sets deleted_at');

select lives_ok($$
  update public.cafes set deleted_at = null where id = '00000000-0000-0000-0000-0000000000c1'
$$, 'AC 2.7: restore clears deleted_at');

select is(
  (select count(*)::int from public.cafes where id = '00000000-0000-0000-0000-0000000000c1'),
  1, 'ADR-3: café row still exists');

-- ADR-4 / AC 3.2, 3.6: raffle lock ------------------------------------------------
select lives_ok($$
  update public.seasons
  set pool_snapshot = '["u1","u2","u3"]', winners = '["u2","u1"]', raffle_drawn_at = now()
  where id = '00000000-0000-0000-0000-0000000000b1'
$$, 'AC 3.5: the first draw can be persisted');

select throws_ok($$
  update public.seasons set public_seed = 'CHANGED-2026' where id = '00000000-0000-0000-0000-0000000000b1'
$$, 'PT409', null, 'AC 3.2: public_seed is locked after the draw (HTTP 409)');

select throws_ok($$
  update public.seasons set winner_count = 5 where id = '00000000-0000-0000-0000-0000000000b1'
$$, 'PT409', null, 'AC 3.2: winner_count is locked after the draw');

select throws_ok($$
  update public.seasons set min_checkins = 1 where id = '00000000-0000-0000-0000-0000000000b1'
$$, 'PT409', null, 'AC 3.2: min_checkins is locked after the draw');

select throws_ok($$
  update public.seasons set winners = '["u3"]' where id = '00000000-0000-0000-0000-0000000000b1'
$$, 'PT409', null, 'AC 3.6: re-draw cannot overwrite published winners');

select throws_ok($$
  update public.seasons set pool_snapshot = '["u9"]' where id = '00000000-0000-0000-0000-0000000000b1'
$$, 'PT409', null, 'AC 3.6: pool_snapshot is immutable after the draw');

select throws_ok($$
  update public.seasons set raffle_drawn_at = now() + interval '1 day'
  where id = '00000000-0000-0000-0000-0000000000b1'
$$, 'PT409', null, 'AC 3.6: raffle_drawn_at cannot be moved after the draw');

select lives_ok($$
  update public.seasons set theme = 'Retitled theme' where id = '00000000-0000-0000-0000-0000000000b1'
$$, 'non-raffle fields stay editable after the draw');

select * from finish();
rollback;
