-- Local development seed (applied by `supabase db reset`). Fake data only:
-- no real people, accounts or credentials. auth_subject values are
-- placeholders that no identity provider will ever issue.

insert into public.users (id, auth_subject, display_name, role)
values
  ('11111111-1111-4111-8111-000000000001', 'seed-organizer', 'Olive (Organizer)', 'ADMIN'),
  ('11111111-1111-4111-8111-000000000002', 'seed-explorer-mara', 'Mara', 'USER'),
  ('11111111-1111-4111-8111-000000000003', 'seed-explorer-theo', 'Theo', 'USER');

-- One archived and one active season (raffles not yet drawn).
insert into public.seasons (id, name, theme, status, min_checkins, winner_count, public_seed)
values
  ('22222222-2222-4222-8222-000000000001', 'Summer Pour-Over Trail', 'Light roasts and cold brew',
   'ARCHIVED', 2, 1, 'SUMMER-POUR-OVER-2026'),
  ('22222222-2222-4222-8222-000000000002', 'Autumn Crawl', 'Cozy corners and spiced pours',
   'ACTIVE', 3, 2, 'AUTUMN-CRAWL-2026');

-- Fictional cafés around Boston's Fenway / Back Bay. One active café is retired.
insert into public.cafes (id, season_id, name, address, latitude, longitude, tags, sort_order, deleted_at)
values
  ('33333333-3333-4333-8333-000000000001', '22222222-2222-4222-8222-000000000002',
   'Moka & Marigold', '101 Example Ave, Boston, MA', 42.3467, -71.0972,
   array['Quiet / Reading', 'Fruity / floral'], 0, null),
  ('33333333-3333-4333-8333-000000000002', '22222222-2222-4222-8222-000000000002',
   'The Velvet Kettle', '202 Sample St, Boston, MA', 42.3489, -71.0826,
   array['Jazz', 'Chocolatey'], 1, null),
  ('33333333-3333-4333-8333-000000000003', '22222222-2222-4222-8222-000000000002',
   'Sage Street Roasters', '303 Placeholder Rd, Boston, MA', 42.3421, -71.0870,
   array['Quiet / Reading', 'Workspace'], 2, null),
  ('33333333-3333-4333-8333-000000000004', '22222222-2222-4222-8222-000000000002',
   'Ochre Hour Coffee', '404 Demo Blvd, Boston, MA', 42.3505, -71.0759,
   array['Fruity / floral', 'Workspace'], 3, null),
  ('33333333-3333-4333-8333-000000000005', '22222222-2222-4222-8222-000000000002',
   'Pastel Press Café', '505 Mock Ln, Boston, MA', 42.3448, -71.1003,
   array['Jazz'], 4, now() - interval '3 days'),
  ('33333333-3333-4333-8333-000000000006', '22222222-2222-4222-8222-000000000001',
   'Cold Brew Cabana', '606 Summer St, Boston, MA', 42.3519, -71.0552,
   array['Cold brew'], 0, null),
  ('33333333-3333-4333-8333-000000000007', '22222222-2222-4222-8222-000000000001',
   'Lemon Rind Roastery', '707 Sunny Way, Boston, MA', 42.3601, -71.0589,
   array['Fruity / floral'], 1, null);

-- Mara: 3 unique cafés (eligible, min 3) plus a repeat visit (AC 3.1, 5.5).
-- Theo: 1 live café + 1 now-retired café (1 short; archive shows "(retired)").
insert into public.reviews (user_id, cafe_id, season_id, coffee_quality, ambiance, workspace_friendliness, note, created_at)
values
  ('11111111-1111-4111-8111-000000000002', '33333333-3333-4333-8333-000000000001',
   '22222222-2222-4222-8222-000000000002', 5, 5, 4,
   'Jasmine-bright Ethiopian pour-over and a silent reading nook by the window.', now() - interval '9 days'),
  ('11111111-1111-4111-8111-000000000002', '33333333-3333-4333-8333-000000000002',
   '22222222-2222-4222-8222-000000000002', 4, 5, 2,
   'Cocoa-heavy espresso, live trio on Thursday nights. Too loud to work.', now() - interval '7 days'),
  ('11111111-1111-4111-8111-000000000002', '33333333-3333-4333-8333-000000000003',
   '22222222-2222-4222-8222-000000000002', 4, 4, 5,
   'Plenty of outlets and long tables. Balanced house blend.', now() - interval '5 days'),
  ('11111111-1111-4111-8111-000000000002', '33333333-3333-4333-8333-000000000001',
   '22222222-2222-4222-8222-000000000002', 5, 4, 4,
   'Second visit: the Kenyan filter was even fruitier than the Ethiopian.', now() - interval '2 days'),
  ('11111111-1111-4111-8111-000000000003', '33333333-3333-4333-8333-000000000004',
   '22222222-2222-4222-8222-000000000002', 3, 4, 5,
   'Quiet weekday mornings, decent cortado, great light for laptop work.', now() - interval '6 days'),
  ('11111111-1111-4111-8111-000000000003', '33333333-3333-4333-8333-000000000005',
   '22222222-2222-4222-8222-000000000002', 4, 5, 3,
   'Vinyl jazz and a honey latte. Sad to hear it is closing.', now() - interval '4 days'),
  ('11111111-1111-4111-8111-000000000002', '33333333-3333-4333-8333-000000000006',
   '22222222-2222-4222-8222-000000000001', 4, 3, 3,
   'Nitro cold brew on tap, patio seating in the sun.', now() - interval '120 days');
