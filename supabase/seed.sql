-- Optional seed / demo helpers for MarketLink (2026-09-25)
-- Safe to re-run. Do NOT store real production passwords in this file.
-- No fake auth users with passwords in git.

-- ---------------------------------------------------------------------------
-- Categories (same as 001 — safe upsert)
-- ---------------------------------------------------------------------------
insert into public.product_categories (name)
values ('Vegetables'), ('Fruits'), ('Dairy'), ('Baked Goods'), ('Other')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Lahore demo markets (lat/lng for OSM map)
-- ---------------------------------------------------------------------------
insert into public.markets (market_name, address, operating_days, timings, latitude, longitude, map_provider, is_active)
select v.market_name, v.address, v.operating_days, v.timings, v.latitude, v.longitude, 'openstreetmap', true
from (
  values
    (
      'Model Town Farmers Market',
      'Model Town Park, Lahore',
      array['Sat','Sun']::text[],
      '08:00–14:00',
      31.48310000::numeric,
      74.31520000::numeric
    ),
    (
      'Gulberg Fresh Market',
      'Main Boulevard Gulberg, Lahore',
      array['Fri','Sat','Sun']::text[],
      '07:30–13:00',
      31.52040000::numeric,
      74.35870000::numeric
    ),
    (
      'Johar Town Weekend Bazaar',
      'Near Emporium Mall, Johar Town, Lahore',
      array['Sat','Sun']::text[],
      '09:00–15:00',
      31.46970000::numeric,
      74.27280000::numeric
    ),
    (
      'DHA Phase 5 Produce Hub',
      'Y Block Market, DHA Phase 5, Lahore',
      array['Thu','Fri','Sat']::text[],
      '08:00–12:30',
      31.46720000::numeric,
      74.41890000::numeric
    ),
    (
      'Green Valley Farmers Market',
      'Lahore Canal Road near Cavalry Ground',
      array['Sat','Sun']::text[],
      '08:00–14:00',
      31.50080000::numeric,
      74.35010000::numeric
    )
) as v(market_name, address, operating_days, timings, latitude, longitude)
where not exists (
  select 1 from public.markets m where m.market_name = v.market_name
);

-- ---------------------------------------------------------------------------
-- Promote admin (run AFTER creating Auth user in Dashboard)
-- Email used in project docs: foraptech080@gmail.com
-- ---------------------------------------------------------------------------
-- update public.profiles
-- set role = 'admin', status = 'active'
-- where email = 'foraptech080@gmail.com';

-- If profile row is missing, paste the Auth user UUID:
-- insert into public.profiles (id, email, full_name, role, status)
-- values (
--   'PASTE_AUTH_USER_UUID_HERE',
--   'foraptech080@gmail.com',
--   'MarketLink Admin',
--   'admin',
--   'active'
-- )
-- on conflict (id) do update
-- set role = 'admin', status = 'active', email = excluded.email;

-- ---------------------------------------------------------------------------
-- Approve a farmer by email (after they register on the site)
-- ---------------------------------------------------------------------------
-- update public.profiles
-- set status = 'active'
-- where email = 'YOUR_FARMER_EMAIL';
--
-- update public.farmer_profiles
-- set approved = true
-- where user_id = (
--   select id from public.profiles where email = 'YOUR_FARMER_EMAIL'
-- );
--
-- Optional welcome notification (requires migration 005):
-- select public.create_notification(
--   (select id from public.profiles where email = 'YOUR_FARMER_EMAIL'),
--   'Welcome to MarketLink',
--   'Your farmer account is approved. You can now publish products.',
--   '/dashboard/farmer/add-product'
-- );
