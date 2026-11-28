-- Issue #1 — identity helpers, raffle lock (ADR-4) and activate_season (ADR-2).
--
-- Token contract (Issue #2): Supabase receives a JWT with
--   role = "authenticated" and sub = users.auth_subject.
-- Authorization never trusts a role claim from the token; it reads users.role.

-- ---------------------------------------------------------------------------
-- Identity helpers (schema `private` is not exposed through the Data API)
-- ---------------------------------------------------------------------------
create function private.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from public.users u
  where u.auth_subject = (select auth.jwt() ->> 'sub');
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.role = 'ADMIN'
     from public.users u
     where u.auth_subject = (select auth.jwt() ->> 'sub')),
    false
  );
$$;

grant usage on schema private to anon, authenticated, service_role;
revoke execute on function private.current_user_id() from public;
revoke execute on function private.is_admin() from public;
grant execute on function private.current_user_id() to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- New check-ins belong to the caller unless the server sets user_id explicitly.
alter table public.reviews
  alter column user_id set default private.current_user_id();

-- ---------------------------------------------------------------------------
-- ADR-4 / AC 3.2, 3.6: once raffle_drawn_at is set, draw inputs and results
-- are immutable. SQLSTATE PT409 is returned by PostgREST as HTTP 409.
-- ---------------------------------------------------------------------------
create function private.enforce_raffle_lock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.raffle_drawn_at is not null and (
       new.min_checkins    is distinct from old.min_checkins
    or new.winner_count    is distinct from old.winner_count
    or new.public_seed     is distinct from old.public_seed
    or new.pool_snapshot   is distinct from old.pool_snapshot
    or new.winners         is distinct from old.winners
    or new.raffle_drawn_at is distinct from old.raffle_drawn_at
  ) then
    raise exception 'raffle for season % was drawn at %; draw inputs and results are locked',
      old.id, old.raffle_drawn_at
      using errcode = 'PT409';
  end if;
  return new;
end;
$$;

create trigger seasons_raffle_lock
  before update on public.seasons
  for each row execute function private.enforce_raffle_lock();

-- ---------------------------------------------------------------------------
-- ADR-2 / AC 1.6: activate one season and archive the previous ACTIVE one in a
-- single transaction. Called via supabase.rpc('activate_season') by Issue #9.
-- SECURITY INVOKER: RLS and grants of the caller still apply.
-- ---------------------------------------------------------------------------
create function public.activate_season(p_season_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'service_role' and not (select private.is_admin()) then
    raise exception 'only organizers can activate a season'
      using errcode = 'PT403';
  end if;

  if not exists (select 1 from public.seasons s where s.id = p_season_id) then
    raise exception 'season % not found', p_season_id
      using errcode = 'PT404';
  end if;

  -- Archive first so the partial unique index never sees two ACTIVE rows.
  update public.seasons
  set status = 'ARCHIVED'
  where status = 'ACTIVE' and id <> p_season_id;

  update public.seasons
  set status = 'ACTIVE'
  where id = p_season_id;
end;
$$;

revoke execute on function public.activate_season(uuid) from public, anon;
grant execute on function public.activate_season(uuid) to authenticated, service_role;
