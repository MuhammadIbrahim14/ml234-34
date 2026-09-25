-- MarketLink review moderation (run after 001–006; 007/008 may exist from other phases)
-- Date: 2026-09-25
-- Admin hide/delete reviews; hidden rows excluded from public catalog reads.

-- ---------------------------------------------------------------------------
-- 1) Schema
-- ---------------------------------------------------------------------------
alter table public.reviews
  add column if not exists is_hidden boolean not null default false;

comment on column public.reviews.is_hidden is
  'When true, review is hidden from public product/farmer listings; admin/owner/farmer may still read.';

-- ---------------------------------------------------------------------------
-- 2) RLS — public select excludes hidden; parties + staff still see
-- ---------------------------------------------------------------------------
drop policy if exists "Reviews public read" on public.reviews;

create policy "Reviews public read"
  on public.reviews for select
  using (
    (not is_hidden)
    or customer_id = auth.uid()
    or farmer_id = auth.uid()
    or public.current_role() in ('admin', 'manager')
  );

-- Admins may hard-delete abusive reviews
drop policy if exists "Admins delete reviews" on public.reviews;

create policy "Admins delete reviews"
  on public.reviews for delete to authenticated
  using (public.current_role() = 'admin');
