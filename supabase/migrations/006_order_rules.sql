-- MarketLink order rules (run after 001–005)
-- Date: 2026-09-25
-- Farmer cutoff minutes; customer modify/cancel only while placed + before cutoff.

-- ---------------------------------------------------------------------------
-- 1) Schema additions
-- ---------------------------------------------------------------------------
alter table public.farmer_profiles
  add column if not exists order_cutoff_minutes int not null default 120;

alter table public.farmer_profiles
  drop constraint if exists farmer_profiles_order_cutoff_minutes_check;

alter table public.farmer_profiles
  add constraint farmer_profiles_order_cutoff_minutes_check
  check (order_cutoff_minutes >= 0 and order_cutoff_minutes <= 10080);

alter table public.orders
  add column if not exists updated_by_customer_at timestamptz;

comment on column public.farmer_profiles.order_cutoff_minutes is
  'Minutes before pickup slot start when customer edits/cancels stop.';
comment on column public.orders.updated_by_customer_at is
  'Last customer-driven modify/cancel timestamp (audit).';

-- ---------------------------------------------------------------------------
-- 2) Cutoff helpers
-- ---------------------------------------------------------------------------
create or replace function public.order_slot_start_time(p_pickup_slot text)
returns time
language plpgsql
immutable
as $$
declare
  m text[];
begin
  if coalesce(trim(p_pickup_slot), '') = '' then
    return time '00:00';
  end if;
  m := regexp_match(p_pickup_slot, '([01]?\d|2[0-3]):([0-5]\d)');
  if m is not null then
    return make_time(m[1]::int, m[2]::int, 0);
  end if;
  return time '00:00';
end;
$$;

create or replace function public.order_edit_cutoff_at(
  p_pickup_date date,
  p_pickup_slot text,
  p_cutoff_minutes int
)
returns timestamptz
language plpgsql
immutable
as $$
declare
  slot_start time;
  pickup_ts timestamptz;
begin
  if p_pickup_date is null then
    return null;
  end if;
  slot_start := public.order_slot_start_time(p_pickup_slot);
  -- Interpret pickup wall-clock in Asia/Karachi (MarketLink default market TZ).
  pickup_ts := ((p_pickup_date + slot_start) at time zone 'Asia/Karachi');
  return pickup_ts - make_interval(mins => greatest(coalesce(p_cutoff_minutes, 120), 0));
end;
$$;

create or replace function public.assert_order_editable_by_customer(p_order_id bigint)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  cutoff_mins int;
  cutoff_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into o from public.orders where order_id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if o.customer_id <> auth.uid() then
    raise exception 'Not allowed to change this order';
  end if;

  if o.order_status <> 'placed' then
    raise exception 'Only placed orders can be changed before cutoff';
  end if;

  select coalesce(fp.order_cutoff_minutes, 120)
  into cutoff_mins
  from public.farmer_profiles fp
  where fp.user_id = o.farmer_id;

  cutoff_mins := coalesce(cutoff_mins, 120);
  cutoff_at := public.order_edit_cutoff_at(o.pickup_date, o.pickup_slot, cutoff_mins);

  if cutoff_at is null then
    raise exception 'Pickup date is required to edit this order';
  end if;

  if now() >= cutoff_at then
    raise exception 'Order changes are closed (past farmer cutoff)';
  end if;

  return o;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Customer RPCs (security definer; ownership + cutoff enforced)
-- ---------------------------------------------------------------------------
create or replace function public.modify_order_items(
  p_order_id bigint,
  p_quantity int
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  unit_price numeric(10, 2);
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  o := public.assert_order_editable_by_customer(p_order_id);

  select price into unit_price
  from public.products
  where product_id = o.product_id;

  if unit_price is null then
    raise exception 'Product not found';
  end if;

  update public.orders
  set
    quantity = p_quantity,
    total_amount = round(unit_price * p_quantity, 2),
    updated_at = now(),
    updated_by_customer_at = now()
  where order_id = p_order_id
  returning * into o;

  return o;
end;
$$;

create or replace function public.update_order_before_cutoff(
  p_order_id bigint,
  p_quantity int default null,
  p_cancel boolean default false
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
begin
  if coalesce(p_cancel, false) then
    o := public.assert_order_editable_by_customer(p_order_id);
    update public.orders
    set
      order_status = 'cancelled',
      updated_at = now(),
      updated_by_customer_at = now()
    where order_id = p_order_id
    returning * into o;
    return o;
  end if;

  if p_quantity is null then
    raise exception 'Provide p_quantity or set p_cancel true';
  end if;

  return public.modify_order_items(p_order_id, p_quantity);
end;
$$;

grant execute on function public.order_slot_start_time(text) to authenticated;
grant execute on function public.order_edit_cutoff_at(date, text, int) to authenticated;
grant execute on function public.modify_order_items(bigint, int) to authenticated;
grant execute on function public.update_order_before_cutoff(bigint, int, boolean) to authenticated;

revoke all on function public.assert_order_editable_by_customer(bigint) from public;
revoke all on function public.assert_order_editable_by_customer(bigint) from anon;
revoke all on function public.assert_order_editable_by_customer(bigint) from authenticated;
