-- Issue #1 — RLS and grants for anon, USER and ADMIN.
-- AC 1.1, 2.5, 2.6, 5.3, 6.3, 6.4 at the database layer.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Fixtures (as postgres) -------------------------------------------------------
-- a1 admin, a2 alice (USER), a3 bob (USER)
-- b1 ACTIVE, b2 ARCHIVED, b3 DRAFT
-- c1 live (b1), c2 soft-deleted (b1), c3 archived season (b2), c4 draft season (b3)
update public.seasons set status = 'ARCHIVED' where status = 'ACTIVE';

insert into public.users (id, auth_subject, display_name, role)
values
  ('00000000-0000-0000-0000-0000000000a1', 'test-admin', 'Test Admin', 'ADMIN'),
  ('00000000-0000-0000-0000-0000000000a2', 'test-alice', 'Alice', 'USER'),
  ('00000000-0000-0000-0000-0000000000a3', 'test-bob', 'Bob', 'USER');

insert into public.seasons (id, name, status, min_checkins, winner_count, public_seed)
values
  ('00000000-0000-0000-0000-0000000000b1', 'Active Season', 'ACTIVE', 3, 2, 'ACTIVE-2026'),
  ('00000000-0000-0000-0000-0000000000b2', 'Archived Season', 'ARCHIVED', 3, 2, 'ARCHIVED-2025'),
  ('00000000-0000-0000-0000-0000000000b3', 'Draft Season', 'DRAFT', 3, 2, 'DRAFT-2027');

insert into public.cafes (id, season_id, name, address, latitude, longitude, tags, sort_order, deleted_at)
values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'Live Cafe', '1 St', 42.3, -71.1, array['quiet'], 0, null),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1', 'Retired Cafe', '2 St', 42.3, -71.1, array['jazz'], 1, now()),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b2', 'Old Cafe', '3 St', 42.3, -71.1, array['quiet'], 0, null),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000b3', 'Future Cafe', '4 St', 42.3, -71.1, array['quiet'], 0, null);

insert into public.reviews (id, user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 4, 4, 4, 'Alice first visit note.'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 3, 3, 3, 'Bob first visit note.'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1', 5, 5, 5, 'Bob note at retired cafe.');

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.users'::regclass, 'public.seasons'::regclass,
                 'public.cafes'::regclass, 'public.reviews'::regclass)),
  'RLS is enabled on users, seasons, cafes, reviews');

-- =============================================================================
-- anon
-- =============================================================================
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::int from public.seasons where id in (
    '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-0000000000b3')),
  2, 'anon sees ACTIVE and ARCHIVED seasons, not DRAFT');

select is(
  (select count(*)::int from public.cafes where id in (
    '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2',
    '00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000c4')),
  3, 'AC 2.6: anon sees published cafés incl. retired ones (archive), not draft-season cafés');

select is(
  (select array_agg(id order by id)::text from public.active_cafes where id in (
    '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2',
    '00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000c4')),
  '{00000000-0000-0000-0000-0000000000c1}',
  'AC 2.5: active_cafes shows only live cafés in the ACTIVE season');

select is(
  (select count(*)::int from public.reviews where id in (
    '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2',
    '00000000-0000-0000-0000-0000000000d3')),
  3, 'AC 2.6: anon can read the review archive, including reviews of retired cafés');

select lives_ok($$ select id, display_name from public.users $$,
  'anon can read public author fields');
select throws_ok($$ select auth_subject from public.users $$, '42501', null,
  'anon cannot read users.auth_subject');
select throws_ok($$ select role from public.users $$, '42501', null,
  'anon cannot read users.role');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 3, 3, 3, 'Anonymous check-in.')
$$, '42501', null, 'AC 5.1: anon cannot check in');

select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('Anon Season', 1, 1, 'ANON-2026')
$$, '42501', null, 'AC 1.1: anon cannot create seasons');

select throws_ok($$
  update public.cafes set name = 'Hacked' where id = '00000000-0000-0000-0000-0000000000c1'
$$, '42501', null, 'AC 1.1: anon cannot edit cafés');

select throws_ok($$
  delete from public.reviews where id = '00000000-0000-0000-0000-0000000000d1'
$$, '42501', null, 'AC 6.4: anon cannot delete reviews');

reset role;

-- =============================================================================
-- USER (alice)
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"test-alice","role":"authenticated"}', true);

select ok(not private.is_admin(), 'alice is not an admin');
select is(private.current_user_id(), '00000000-0000-0000-0000-0000000000a2'::uuid,
  'current_user_id maps the JWT sub to users.id');

select is(
  (select count(*)::int from public.seasons where id = '00000000-0000-0000-0000-0000000000b3'),
  0, 'USER cannot see DRAFT seasons');

select lives_ok($$
  insert into public.reviews (cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1',
          5, 4, 3, 'Alice repeat visit, fruity pour-over.')
$$, 'AC 5.3 / 5.5: USER can check in (again) at a live café in the ACTIVE season');

select is(
  (select user_id from public.reviews where note = 'Alice repeat visit, fruity pour-over.'),
  '00000000-0000-0000-0000-0000000000a2'::uuid,
  'user_id defaults to the caller');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 1, 1, 1, 'Posting as Bob.')
$$, '42501', null, 'USER cannot insert a review as another user');

select throws_ok($$
  insert into public.reviews (cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1',
          3, 3, 3, 'Checking in at a retired cafe.')
$$, '42501', null, 'AC 2.5: USER cannot check in at a soft-deleted café');

select throws_ok($$
  insert into public.reviews (cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b2',
          3, 3, 3, 'Checking in at last season.')
$$, '42501', null, 'USER cannot check in to an ARCHIVED season');

select throws_ok($$
  update public.reviews set note = 'Edited after the fact.' where id = '00000000-0000-0000-0000-0000000000d1'
$$, '42501', null, 'reviews are immutable (no UPDATE grant)');

with d as (
  delete from public.reviews where id = '00000000-0000-0000-0000-0000000000d2' returning 1
)
select is(count(*)::int, 0, 'AC 6.4: USER deleting another user''s review affects 0 rows') from d;

select is(
  (select count(*)::int from public.reviews where id = '00000000-0000-0000-0000-0000000000d2'),
  1, 'AC 6.4: the other user''s review still exists');

with d as (
  delete from public.reviews where id = '00000000-0000-0000-0000-0000000000d1' returning 1
)
select is(count(*)::int, 1, 'AC 6.3: USER can delete their own review') from d;

select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('User Season', 1, 1, 'USER-2026')
$$, '42501', null, 'AC 1.1: USER cannot create seasons');

with u as (
  update public.seasons set theme = 'hijacked' where id = '00000000-0000-0000-0000-0000000000b1' returning 1
)
select is(count(*)::int, 0, 'AC 1.1: USER cannot update seasons') from u;

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'User Cafe', '9 St', 0, 0, array['a'], 9)
$$, '42501', null, 'AC 1.1: USER cannot create cafés');

with u as (
  update public.cafes set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000c1' returning 1
)
select is(count(*)::int, 0, 'AC 1.1: USER cannot soft-delete cafés') from u;

select throws_ok($$
  update public.users set role = 'ADMIN' where id = '00000000-0000-0000-0000-0000000000a2'
$$, '42501', null, 'USER cannot promote themselves to ADMIN');

select throws_ok($$
  insert into public.users (auth_subject, display_name) values ('self-signup', 'Self')
$$, '42501', null, 'clients cannot create users rows (server-side only)');

reset role;

-- =============================================================================
-- Forged role claim: role comes from the DB, never from the token
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"test-bob","role":"authenticated","user_role":"ADMIN","app_metadata":{"role":"ADMIN"}}', true);

select ok(not private.is_admin(), 'a forged ADMIN claim does not make bob an admin');
select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('Forged', 1, 1, 'FORGED-2026')
$$, '42501', null, 'AC 1.1: forged ADMIN claim cannot create seasons');

reset role;

-- =============================================================================
-- ADMIN
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"test-admin","role":"authenticated"}', true);

select ok(private.is_admin(), 'admin role is read from users.role');

select is(
  (select count(*)::int from public.seasons where id = '00000000-0000-0000-0000-0000000000b3'),
  1, 'ADMIN sees DRAFT seasons');
select is(
  (select count(*)::int from public.cafes where id = '00000000-0000-0000-0000-0000000000c4'),
  1, 'ADMIN sees draft-season cafés');

select lives_ok($$
  insert into public.seasons (name, theme, min_checkins, winner_count, public_seed)
  values ('Winter Warmers', 'Spiced lattes', 2, 1, 'WINTER-WARMERS-2026')
$$, 'AC 1.5: ADMIN can create a season');

select is(
  (select status::text from public.seasons where public_seed = 'WINTER-WARMERS-2026'),
  'DRAFT', 'AC 1.5: created season is DRAFT');

select throws_ok($$
  insert into public.seasons (name, status, min_checkins, winner_count, public_seed)
  values ('Sneaky Active', 'ACTIVE', 1, 1, 'SNEAKY-2026')
$$, '42501', null, 'status cannot be set on insert; activation goes through activate_season');

with u as (
  update public.seasons set theme = 'Crisp leaves' where id = '00000000-0000-0000-0000-0000000000b1' returning 1
)
select is(count(*)::int, 1, 'ADMIN can update a season') from u;

select lives_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'New Admin Cafe', '5 St', 42.35, -71.08, array['jazz', 'quiet'], 5)
$$, 'AC 2.3: ADMIN can create a café');

with u as (
  update public.cafes set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000c1' returning 1
)
select is(count(*)::int, 1, 'AC 2.5: ADMIN can soft-delete a café') from u;

with u as (
  update public.cafes set deleted_at = null where id = '00000000-0000-0000-0000-0000000000c2' returning 1
)
select is(count(*)::int, 1, 'AC 2.7: ADMIN can restore a café') from u;

select throws_ok($$
  delete from public.cafes where id = '00000000-0000-0000-0000-0000000000c3'
$$, '42501', null, 'ADR-3: ADMIN cannot hard-delete cafés');

select throws_ok($$
  delete from public.seasons where id = '00000000-0000-0000-0000-0000000000b3'
$$, '42501', null, 'ADMIN cannot delete seasons');

select throws_ok($$
  update public.users set role = 'USER' where id = '00000000-0000-0000-0000-0000000000a3'
$$, '42501', null, 'role changes are server-side only, even for ADMIN');

reset role;

select * from finish();
rollback;
