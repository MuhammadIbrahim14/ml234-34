-- Optional seed / demo users helper for MarketLink (2026-09-25)
-- After creating Auth users in Supabase Dashboard (Authentication → Users),
-- run the UPDATEs below with the real emails you created.
-- Do NOT store real production passwords in this file.

-- Promote an admin (SRS Admin Features)
-- update public.profiles
-- set role = 'admin', status = 'active'
-- where email = 'admin@marketlink.local';

-- Approve a farmer so they can list products (SRS Manage Farmers)
-- update public.profiles set status = 'active' where email = 'farmer@marketlink.local';
-- update public.farmer_profiles set approved = true
-- where user_id = (select id from public.profiles where email = 'farmer@marketlink.local');

-- Sample market (safe insert)
insert into public.markets (market_name, address, operating_days, timings, latitude, longitude)
select 'Green Valley Farmers Market', 'Lahore, Pakistan', array['Sat','Sun'], '08:00–14:00', 31.52040000, 74.35870000
where not exists (
  select 1 from public.markets where market_name = 'Green Valley Farmers Market'
);
