-- Issue #1 — schema shape and CHECK constraints
-- AC 1.3, 1.4, 1.5, 2.2, 2.5, 3.2, 3.5, 5.2
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------
select has_table('public', 'users', 'users table exists');
select has_table('public', 'seasons', 'seasons table exists');
select has_table('public', 'cafes', 'cafes table exists');
select has_table('public', 'reviews', 'reviews table exists');

select enum_has_labels('public', 'app_role', array['USER', 'ADMIN'], 'app_role is USER | ADMIN');
select enum_has_labels('public', 'season_status', array['DRAFT', 'ACTIVE', 'ARCHIVED'],
  'AC 1.5/1.6: season_status is DRAFT | ACTIVE | ARCHIVED');

select col_type_is('public', 'users', 'id', 'uuid', 'users.id is an internal uuid');
select col_type_is('public', 'users', 'auth_subject', 'text', 'users.auth_subject holds the OAuth sub as text');
select col_type_is('public', 'seasons', 'pool_snapshot', 'jsonb', 'AC 3.5: seasons.pool_snapshot is jsonb');
select col_type_is('public', 'seasons', 'winners', 'jsonb', 'AC 3.5: seasons.winners is jsonb');
select has_column('public', 'seasons', 'public_seed', 'AC 3.2: seasons.public_seed exists');
select has_column('public', 'seasons', 'raffle_drawn_at', 'AC 3.5: seasons.raffle_drawn_at exists');
select col_type_is('public', 'cafes', 'tags', 'text[]', 'cafes.tags is text[]');
select col_is_null('public', 'cafes', 'deleted_at', 'AC 2.5: cafes.deleted_at is nullable (soft delete)');
select has_index('public', 'seasons', 'seasons_single_active', 'AC 1.6: partial unique index on ACTIVE');

-- ---------------------------------------------------------------------------
-- Fixtures (run as postgres, RLS bypassed)
-- ---------------------------------------------------------------------------
update public.seasons set status = 'ARCHIVED' where status = 'ACTIVE';

insert into public.users (id, auth_subject, display_name)
values ('00000000-0000-0000-0000-0000000000a1', 'test-schema-user', 'Schema Tester');

insert into public.seasons (id, name, min_checkins, winner_count, public_seed)
values
  ('00000000-0000-0000-0000-0000000000b1', 'Schema Season', 3, 2, 'SCHEMA-SEASON-2026'),
  ('00000000-0000-0000-0000-0000000000b2', 'Other Season', 3, 2, 'OTHER-SEASON-2026');

insert into public.cafes (id, season_id, name, address, latitude, longitude, tags, sort_order)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1',
        'Moka Test', '1 Test St', 42.34, -71.09, array['quiet'], 0);

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
select throws_ok($$
  insert into public.users (auth_subject, display_name) values ('test-schema-user', 'Dup')
$$, '23505', null, 'auth_subject is unique');

select throws_ok($$
  insert into public.users (auth_subject, display_name) values ('x-1', '<b>Mal</b>')
$$, '23514', null, 'display_name rejects < and >');

-- ---------------------------------------------------------------------------
-- seasons (AC 1.3, 1.4, 1.5, 3.5)
-- ---------------------------------------------------------------------------
select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('ab', 1, 1, 'AB-2026')
$$, '23514', null, 'AC 1.3: season name shorter than 3 chars is rejected');

select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('  ab  ', 1, 1, 'AB-2026')
$$, '23514', null, 'AC 1.3: season name length is measured after trim');

select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('<i>Fall</i>', 1, 1, 'FALL-2026')
$$, '23514', null, 'A03: season name rejects < and >');

select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('Fall', 0, 1, 'FALL-2026')
$$, '23514', null, 'AC 1.4: min_checkins < 1 is rejected');

select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('Fall', 1, 0, 'FALL-2026')
$$, '23514', null, 'AC 1.4: winner_count < 1 is rejected');

select throws_ok($$
  insert into public.seasons (name, status, min_checkins, winner_count, public_seed) values ('Fall', 'LIVE', 1, 1, 'FALL-2026')
$$, '22P02', null, 'AC 1.5: status outside the enum is rejected');

select lives_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed)
  values ('Autumn Crawl Extended', 3, 2, 'AUTUMN-CRAWL-EXT-2026')
$$, 'AC 1.5: public_seed stores <NAME-SLUG(<=16)>-<YEAR>');

select is(
  (select status::text from public.seasons where public_seed = 'AUTUMN-CRAWL-EXT-2026'),
  'DRAFT', 'AC 1.5: new seasons default to DRAFT');

select throws_ok($$
  insert into public.seasons (name, min_checkins, winner_count, public_seed) values ('Fall', 1, 1, '')
$$, '23514', null, 'public_seed cannot be empty');

select throws_ok($$
  update public.seasons set pool_snapshot = '{"a":1}', winners = '[]', raffle_drawn_at = now()
  where id = '00000000-0000-0000-0000-0000000000b1'
$$, '23514', null, 'AC 3.5: pool_snapshot must be a JSON array');

select throws_ok($$
  update public.seasons set raffle_drawn_at = now()
  where id = '00000000-0000-0000-0000-0000000000b1'
$$, '23514', null, 'AC 3.5: raffle_drawn_at, pool_snapshot and winners are set together');

-- ---------------------------------------------------------------------------
-- cafes (AC 2.2)
-- ---------------------------------------------------------------------------
select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', repeat('x', 81), '1 St', 0, 0, array['a'], 1)
$$, '23514', null, 'AC 2.2: café name longer than 80 chars is rejected');

select lives_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', repeat('x', 80), '1 St', 0, 0, array['a'], 2)
$$, 'AC 2.2: café name of exactly 80 chars is accepted');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', '   ', '1 St', 0, 0, array['a'], 3)
$$, '23514', null, 'AC 2.2: blank café name is rejected');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Cafe', '   ', 0, 0, array['a'], 3)
$$, '23514', null, 'AC 2.2: blank address is rejected');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Cafe', '1 St', 90.5, 0, array['a'], 3)
$$, '23514', null, 'AC 2.2: latitude > 90 is rejected');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Cafe', '1 St', -91, 0, array['a'], 3)
$$, '23514', null, 'AC 2.2: latitude < -90 is rejected');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Cafe', '1 St', 0, 180.5, array['a'], 3)
$$, '23514', null, 'AC 2.2: longitude > 180 is rejected');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Cafe', '1 St', 0, -181, array['a'], 3)
$$, '23514', null, 'AC 2.2: longitude < -180 is rejected');

select lives_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Edge Cafe', '1 St', -90, 180, array['a'], 4)
$$, 'AC 2.2: boundary coordinates are accepted');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Cafe', '1 St', 0, 0, array[]::text[], 3)
$$, '23514', null, 'AC 2.2: at least one tag is required');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Cafe', '1 St', 0, 0, array[''], 3)
$$, '23514', null, 'AC 2.2: empty tag is rejected');

select throws_ok($$
  insert into public.cafes (season_id, name, address, latitude, longitude, tags, sort_order)
  values ('00000000-0000-0000-0000-0000000000b1', 'Cafe', '1 St', 0, 0, array['<script>'], 3)
$$, '23514', null, 'A03: tags reject < and >');

-- ---------------------------------------------------------------------------
-- reviews (AC 5.2)
-- ---------------------------------------------------------------------------
select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 0, 3, 3, 'Perfectly fine cup.')
$$, '23514', null, 'AC 5.2: coffee_quality 0 is rejected');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 3, 6, 3, 'Perfectly fine cup.')
$$, '23514', null, 'AC 5.2: ambiance 6 is rejected');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 3, 3, 0, 'Perfectly fine cup.')
$$, '23514', null, 'AC 5.2: workspace_friendliness 0 is rejected');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 3, 3, 3, repeat('n', 9))
$$, '23514', null, 'AC 5.2: 9-char note is rejected');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 3, 3, 3, repeat('n', 501))
$$, '23514', null, 'AC 5.2: 501-char note is rejected');

select lives_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 1, 5, 3, repeat('n', 10))
$$, 'AC 5.2: 10-char note and boundary scores are accepted');

select lives_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 5, 1, 3, repeat('n', 500))
$$, 'AC 5.2: 500-char note is accepted');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 3, 3, 3, '  padded tasting note  ')
$$, '23514', null, 'AC 5.2: note must already be trimmed');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b1', 3, 3, 3, '<script>alert(1)</script>')
$$, '23514', null, 'AC 5.2 / A03: note rejects < and >');

select throws_ok($$
  insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000b2', 3, 3, 3, 'Season does not match café.')
$$, '23503', null, 'a review''s season must match its café''s season');

select * from finish();
rollback;
