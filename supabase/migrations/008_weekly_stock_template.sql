-- MarketLink weekly stock template (run after 001–006; 007 may exist from other phases)
-- Date: 2026-09-25
-- jsonb map: weekday → product_id (text) → qty. Apply via client updates (approved RLS).

-- ---------------------------------------------------------------------------
-- 1) Schema
-- ---------------------------------------------------------------------------
alter table public.farmer_profiles
  add column if not exists weekly_stock_template jsonb not null default '{}'::jsonb;

comment on column public.farmer_profiles.weekly_stock_template is
  'Weekday → product_id → stock qty. Keys: Mon..Sun; product ids as text. Apply does not bypass approved product RLS.';

-- ---------------------------------------------------------------------------
-- 2) Optional RPC: apply template for a weekday (security invoker = caller RLS)
--    Prefer client bulk updateProduct; RPC available for atomicity without elevating privileges.
-- ---------------------------------------------------------------------------
create or replace function public.apply_weekly_stock_template(p_weekday text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  day_key text;
  template jsonb;
  day_map jsonb;
  product_key text;
  qty int;
  updated_count int := 0;
  skipped int := 0;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  day_key := coalesce(
    nullif(trim(p_weekday), ''),
    case extract(isodow from (timezone('Asia/Karachi', now()))::date)::int
      when 1 then 'Mon'
      when 2 then 'Tue'
      when 3 then 'Wed'
      when 4 then 'Thu'
      when 5 then 'Fri'
      when 6 then 'Sat'
      else 'Sun'
    end
  );

  if day_key not in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') then
    raise exception 'Invalid weekday: % (use Mon..Sun)', day_key;
  end if;

  select fp.weekly_stock_template
    into template
  from public.farmer_profiles fp
  where fp.user_id = uid;

  if template is null then
    raise exception 'Farmer profile not found';
  end if;

  day_map := coalesce(template -> day_key, '{}'::jsonb);

  for product_key in select jsonb_object_keys(day_map)
  loop
    begin
      qty := greatest(coalesce((day_map ->> product_key)::int, 0), 0);
      update public.products p
         set stock_quantity = qty,
             is_available = (qty > 0),
             updated_at = now()
       where p.product_id = product_key::bigint
         and p.farmer_id = uid;
      if found then
        updated_count := updated_count + 1;
      else
        skipped := skipped + 1;
      end if;
    exception
      when others then
        -- RLS / type errors: count as skipped; do not elevate privileges
        skipped := skipped + 1;
    end;
  end loop;

  return jsonb_build_object(
    'weekday', day_key,
    'updated', updated_count,
    'skipped', skipped
  );
end;
$$;

revoke all on function public.apply_weekly_stock_template(text) from public;
grant execute on function public.apply_weekly_stock_template(text) to authenticated;

comment on function public.apply_weekly_stock_template(text) is
  'Apply farmer weekly_stock_template for a weekday. Runs as caller (security invoker); approved product RLS still applies.';
