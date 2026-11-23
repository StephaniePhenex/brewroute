-- Issue #1 — Row Level Security, grants and the live-café view.
--
--             | anon                        | USER (authenticated)                 | ADMIN (private.is_admin())
-- users       | id, display_name            | id, display_name                     | id, display_name (role changes: server only)
-- seasons     | non-DRAFT                   | non-DRAFT                            | all; insert; update
-- cafes       | in non-DRAFT seasons        | in non-DRAFT seasons                 | all; insert; update (soft delete)
-- reviews     | all                         | all; insert own (live café, ACTIVE   | same as USER
--             |                             | season); delete own                  |
--
-- No role may DELETE seasons or cafés, UPDATE reviews, or write users.
-- The secret key (service_role) bypasses RLS and is used server-side only.

alter table public.users enable row level security;
alter table public.seasons enable row level security;
alter table public.cafes enable row level security;
alter table public.reviews enable row level security;

-- Start from nothing: Supabase grants ALL on new public tables to anon and
-- authenticated by default.
revoke all on table public.users, public.seasons, public.cafes, public.reviews
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- users: only public author fields are readable; auth_subject and role are not.
-- Rows are upserted at sign-in with the secret key (Issue #2).
-- ---------------------------------------------------------------------------
grant select (id, display_name) on public.users to anon, authenticated;

create policy users_select_public on public.users
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- seasons
-- ---------------------------------------------------------------------------
grant select on public.seasons to anon, authenticated;
-- status is excluded from INSERT so new seasons are always DRAFT (AC 1.5).
grant insert (name, theme, min_checkins, winner_count, public_seed)
  on public.seasons to authenticated;
grant update (name, theme, status, min_checkins, winner_count, public_seed,
              pool_snapshot, winners, raffle_drawn_at)
  on public.seasons to authenticated;

create policy seasons_select_published on public.seasons
  for select to anon, authenticated
  using (status <> 'DRAFT');

create policy seasons_select_admin on public.seasons
  for select to authenticated
  using ((select private.is_admin()));

create policy seasons_insert_admin on public.seasons
  for insert to authenticated
  with check ((select private.is_admin()));

create policy seasons_update_admin on public.seasons
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- cafes: soft-deleted rows stay readable so the archive can label them
-- "(retired)" (AC 2.6). Live views read public.active_cafes instead.
-- ---------------------------------------------------------------------------
grant select on public.cafes to anon, authenticated;
grant insert (season_id, name, address, latitude, longitude, tags, sort_order)
  on public.cafes to authenticated;
grant update (name, address, latitude, longitude, tags, sort_order, deleted_at)
  on public.cafes to authenticated;

create policy cafes_select_published on public.cafes
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.seasons s
      where s.id = cafes.season_id and s.status <> 'DRAFT'
    )
  );

create policy cafes_select_admin on public.cafes
  for select to authenticated
  using ((select private.is_admin()));

create policy cafes_insert_admin on public.cafes
  for insert to authenticated
  with check ((select private.is_admin()));

create policy cafes_update_admin on public.cafes
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- reviews: public archive; explorers insert and delete only their own rows.
-- Reviews are immutable (no UPDATE grant).
-- ---------------------------------------------------------------------------
grant select on public.reviews to anon, authenticated;
grant insert (user_id, cafe_id, season_id, coffee_quality, ambiance,
              workspace_friendliness, note)
  on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

create policy reviews_select_public on public.reviews
  for select to anon, authenticated
  using (true);

create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (
    user_id = (select private.current_user_id())
    and exists (
      select 1 from public.seasons s
      where s.id = reviews.season_id and s.status = 'ACTIVE'
    )
    and exists (
      select 1 from public.cafes c
      where c.id = reviews.cafe_id and c.deleted_at is null
    )
  );

create policy reviews_delete_own on public.reviews
  for delete to authenticated
  using (user_id = (select private.current_user_id()));

-- ---------------------------------------------------------------------------
-- Live cafés for the streetscape, map and passport (AC 2.5, 4.2).
-- security_invoker: the caller's RLS on cafes and seasons applies.
-- ---------------------------------------------------------------------------
create view public.active_cafes
  with (security_invoker = true)
as
  select c.*
  from public.cafes c
  join public.seasons s on s.id = c.season_id
  where s.status = 'ACTIVE'
    and c.deleted_at is null
  order by c.sort_order;

revoke all on public.active_cafes from anon, authenticated;
grant select on public.active_cafes to anon, authenticated;
