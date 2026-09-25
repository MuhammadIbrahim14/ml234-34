-- MarketLink Phase 3 — restock alerts + preferred markets (run after 001–006)
-- Date: 2026-09-25
-- Do not edit 001–006 in place. P4/P5 use 008/009 separately.

-- ---------------------------------------------------------------------------
-- 1) Restock alerts
-- ---------------------------------------------------------------------------
create table if not exists public.restock_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id bigint not null references public.products (product_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_restock_alerts_product on public.restock_alerts (product_id);
create index if not exists idx_restock_alerts_user on public.restock_alerts (user_id);

alter table public.restock_alerts enable row level security;

drop policy if exists "Users read own restock alerts" on public.restock_alerts;
create policy "Users read own restock alerts"
  on public.restock_alerts for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own restock alerts" on public.restock_alerts;
create policy "Users insert own restock alerts"
  on public.restock_alerts for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users delete own restock alerts" on public.restock_alerts;
create policy "Users delete own restock alerts"
  on public.restock_alerts for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2) Preferred markets (customer hub — not favorites check-constraint)
-- ---------------------------------------------------------------------------
create table if not exists public.preferred_markets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  market_id bigint not null references public.markets (market_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, market_id)
);

create index if not exists idx_preferred_markets_user on public.preferred_markets (user_id);

alter table public.preferred_markets enable row level security;

drop policy if exists "Users read own preferred markets" on public.preferred_markets;
create policy "Users read own preferred markets"
  on public.preferred_markets for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own preferred markets" on public.preferred_markets;
create policy "Users insert own preferred markets"
  on public.preferred_markets for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users delete own preferred markets" on public.preferred_markets;
create policy "Users delete own preferred markets"
  on public.preferred_markets for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3) Notify subscribers when stock becomes available / increases
--    Extends create_notification pattern from 005_wiring_hardening.sql
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_restock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  pname text;
  should_notify boolean := false;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  should_notify :=
    (coalesce(old.stock_quantity, 0) = 0 and coalesce(new.stock_quantity, 0) > 0)
    or (coalesce(old.is_available, false) is distinct from true and new.is_available is true)
    or (
      coalesce(new.stock_quantity, 0) > coalesce(old.stock_quantity, 0)
      and coalesce(new.stock_quantity, 0) > 0
      and new.is_available is true
    );

  if not should_notify then
    return new;
  end if;

  pname := coalesce(new.name, 'Product');

  for r in
    select a.id, a.user_id
    from public.restock_alerts a
    where a.product_id = new.product_id
  loop
    perform public.create_notification(
      r.user_id,
      'Back in stock',
      pname || ' is available again. Open products or favorites to order.',
      '/products'
    );
    delete from public.restock_alerts where id = r.id;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_restock on public.products;
create trigger trg_notify_restock
  after update of stock_quantity, is_available on public.products
  for each row execute function public.notify_on_restock();

comment on table public.restock_alerts is
  'Customer opt-in alerts when a product restocks; cleared after one notification.';
comment on table public.preferred_markets is
  'Customer preferred / saved markets for hub favorites + home shortcuts.';
