-- Public read policies for visitor catalog (approved farmers + profile names on products)
-- Safe to run after 001_marketlink_schema.sql

drop policy if exists "Approved farmer profiles public read" on public.farmer_profiles;
create policy "Approved farmer profiles public read"
  on public.farmer_profiles for select
  using (approved = true);

drop policy if exists "Public can read farmer display names" on public.profiles;
create policy "Public can read farmer display names"
  on public.profiles for select
  using (
    role = 'farmer'
    or id = auth.uid()
    or public.current_role() = 'admin'
    or exists (
      select 1 from public.farmer_profiles fp
      where fp.user_id = profiles.id and fp.approved = true
    )
  );
