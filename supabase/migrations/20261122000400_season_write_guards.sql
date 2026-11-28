-- Issue #1 — PR #20 review: season status and raffle results are server- or
-- function-only writes (ADR-2, ADR-4, AC 1.1, 1.6, 3.5, 3.6).
--
--   seasons column        | authenticated (ADMIN via RLS) | service_role | activate_season()
--   name, theme, counts,  | UPDATE                        | UPDATE       | —
--   public_seed           |                               |              |
--   status                | —                             | UPDATE       | sets ACTIVE / ARCHIVED
--   pool_snapshot,        | —                             | UPDATE once  | —
--   winners,              |                               | (PT409 lock) |
--   raffle_drawn_at       |                               |              |

-- ---------------------------------------------------------------------------
-- Clients cannot change status (that would skip activate_season and could
-- leave zero ACTIVE seasons) or write raffle results (only runRaffle, on the
-- server with the secret key, records a draw). authenticated holds only
-- column-level UPDATE grants (see 20261122000300_rls.sql), so revoking these
-- columns removes the privilege.
-- ---------------------------------------------------------------------------
revoke update (status, pool_snapshot, winners, raffle_drawn_at)
  on public.seasons from authenticated;

-- Explicit, instead of relying on Supabase's default privileges for
-- service_role. The PT409 trigger still makes the first draw the only one.
grant select on public.seasons to service_role;
grant update (status, pool_snapshot, winners, raffle_drawn_at)
  on public.seasons to service_role;

-- ---------------------------------------------------------------------------
-- ADR-2 / AC 1.6: activation is the only client path to change status.
--
-- SECURITY DEFINER so it can write status without a client grant. That makes
-- the owner (postgres) the current user inside the body, so:
--   * authorization is private.is_admin() only: users.role looked up by the
--     JWT sub. The role claim, app_role and auth.role() are never trusted,
--     because a definer function cannot see the caller's Postgres role.
--   * search_path is pinned to '' and every object is schema-qualified.
--   * EXECUTE is granted to authenticated only.
-- The server activates with the organizer's own token (Issue #9).
-- ---------------------------------------------------------------------------
create or replace function public.activate_season(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'only organizers can activate a season'
      using errcode = 'PT403';
  end if;

  -- Serialise activations: a second caller waits here until the first
  -- transaction commits, then sees its result, instead of failing on the
  -- one-ACTIVE partial unique index (23505). Released at transaction end.
  perform pg_advisory_xact_lock(hashtextextended('public.activate_season', 0));

  perform 1 from public.seasons s where s.id = p_season_id for update;
  if not found then
    raise exception 'season % not found', p_season_id
      using errcode = 'PT404';
  end if;

  -- Archive first so the partial unique index never sees two ACTIVE rows.
  update public.seasons
  set status = 'ARCHIVED'
  where status = 'ACTIVE' and id <> p_season_id;

  update public.seasons
  set status = 'ACTIVE'
  where id = p_season_id and status <> 'ACTIVE';
end;
$$;

revoke all on function public.activate_season(uuid) from public, anon, service_role;
grant execute on function public.activate_season(uuid) to authenticated;
