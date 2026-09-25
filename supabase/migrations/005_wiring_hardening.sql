-- MarketLink wiring hardening (run after 001–004)
-- Date: 2026-09-25
-- Product visibility, farmer approval locks, notifications, contact, newsletter,
-- accept_order RPC, order → notification triggers.

-- ---------------------------------------------------------------------------
-- 1) Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts happen via security definer helpers / triggers (not direct client insert)
drop policy if exists "Admins insert notifications" on public.notifications;
create policy "Admins insert notifications"
  on public.notifications for insert to authenticated
  with check (public.current_role() = 'admin');

create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_body text default null,
  p_link text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nid uuid;
begin
  if p_user_id is null or coalesce(trim(p_title), '') = '' then
    return null;
  end if;
  insert into public.notifications (user_id, title, body, link)
  values (p_user_id, trim(p_title), nullif(trim(coalesce(p_body, '')), ''), nullif(trim(coalesce(p_link, '')), ''))
  returning id into nid;
  return nid;
end;
$$;

grant execute on function public.create_notification(uuid, text, text, text) to postgres;
-- Direct client calls use admin INSERT policy; triggers call this as definer.
revoke all on function public.create_notification(uuid, text, text, text) from public;
revoke all on function public.create_notification(uuid, text, text, text) from anon;
revoke all on function public.create_notification(uuid, text, text, text) from authenticated;

-- ---------------------------------------------------------------------------
-- 2) Contact messages + newsletter
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_created on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can submit contact" on public.contact_messages;
create policy "Anyone can submit contact"
  on public.contact_messages for insert
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 0
    and length(trim(message)) > 0
  );

drop policy if exists "Admins read contact messages" on public.contact_messages;
create policy "Admins read contact messages"
  on public.contact_messages for select to authenticated
  using (public.current_role() = 'admin');

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Anyone can subscribe newsletter" on public.newsletter_subscribers;
create policy "Anyone can subscribe newsletter"
  on public.newsletter_subscribers for insert
  with check (length(trim(email)) > 0);

drop policy if exists "Admins read newsletter" on public.newsletter_subscribers;
create policy "Admins read newsletter"
  on public.newsletter_subscribers for select to authenticated
  using (public.current_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 3) Lock farmer_profiles.approved (farmers cannot self-approve)
-- ---------------------------------------------------------------------------
create or replace function public.guard_farmer_profile_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and new.approved is distinct from old.approved
    and coalesce(public.current_role(), 'customer') <> 'admin'
  then
    raise exception 'Only admins can change farmer approval status.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_farmer_approved on public.farmer_profiles;
create trigger trg_guard_farmer_approved
  before update on public.farmer_profiles
  for each row execute function public.guard_farmer_profile_approved();

-- ---------------------------------------------------------------------------
-- 4) Product visibility + pending farmer cannot publish
-- ---------------------------------------------------------------------------
drop policy if exists "Products public read" on public.products;
drop policy if exists "Products catalog read" on public.products;
drop policy if exists "Farmers manage own products" on public.products;
drop policy if exists "Farmers select own or catalog products" on public.products;
drop policy if exists "Approved farmers insert products" on public.products;
drop policy if exists "Approved farmers update products" on public.products;
drop policy if exists "Farmers delete own products" on public.products;

create policy "Products catalog read"
  on public.products for select
  using (
    public.current_role() = 'admin'
    or farmer_id = auth.uid()
    or exists (
      select 1
      from public.farmer_profiles fp
      join public.profiles p on p.id = fp.user_id
      where fp.user_id = products.farmer_id
        and fp.approved = true
        and p.status = 'active'
    )
  );

create policy "Approved farmers insert products"
  on public.products for insert to authenticated
  with check (
    public.current_role() = 'admin'
    or (
      farmer_id = auth.uid()
      and exists (
        select 1 from public.farmer_profiles fp
        where fp.user_id = auth.uid() and fp.approved = true
      )
    )
  );

create policy "Approved farmers update products"
  on public.products for update to authenticated
  using (
    public.current_role() = 'admin'
    or farmer_id = auth.uid()
  )
  with check (
    public.current_role() = 'admin'
    or (
      farmer_id = auth.uid()
      and exists (
        select 1 from public.farmer_profiles fp
        where fp.user_id = auth.uid() and fp.approved = true
      )
    )
  );

create policy "Farmers delete own products"
  on public.products for delete to authenticated
  using (
    public.current_role() = 'admin'
    or farmer_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 5) accept_order RPC (atomic stock decrement + accept)
-- ---------------------------------------------------------------------------
create or replace function public.accept_order(p_order_id bigint)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  stock int;
  role public.app_role;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into o from public.orders where order_id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if o.order_status <> 'placed' then
    raise exception 'Only placed orders can be accepted';
  end if;

  role := public.current_role();
  if o.farmer_id <> auth.uid() and coalesce(role::text, '') not in ('admin', 'manager') then
    raise exception 'Not allowed to accept this order';
  end if;

  select stock_quantity into stock
  from public.products
  where product_id = o.product_id
  for update;

  if stock is null then
    raise exception 'Product not found';
  end if;
  if stock < o.quantity then
    raise exception 'Not enough stock to accept this order';
  end if;

  update public.products
  set
    stock_quantity = stock - o.quantity,
    is_available = case when (stock - o.quantity) = 0 then false else is_available end,
    updated_at = now()
  where product_id = o.product_id;

  update public.orders
  set order_status = 'accepted', updated_at = now()
  where order_id = p_order_id
  returning * into o;

  return o;
end;
$$;

grant execute on function public.accept_order(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Order status → notification triggers
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_order_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pname text;
begin
  select coalesce(name, 'item') into pname from public.products where product_id = new.product_id;

  if tg_op = 'INSERT' and new.order_status = 'placed' then
    perform public.create_notification(
      new.farmer_id,
      'New pre-order #' || new.order_id,
      'Customer ordered ' || coalesce(new.quantity::text, '?') || ' × ' || coalesce(pname, 'product') || '.',
      '/dashboard/farmer/pre-orders'
    );
  elsif tg_op = 'UPDATE' and new.order_status is distinct from old.order_status then
    if new.order_status = 'accepted' then
      perform public.create_notification(
        new.customer_id,
        'Order #' || new.order_id || ' accepted',
        'Your pre-order for ' || coalesce(pname, 'produce') || ' was accepted by the farmer.',
        '/orders'
      );
    elsif new.order_status = 'ready_for_pickup' then
      perform public.create_notification(
        new.customer_id,
        'Order #' || new.order_id || ' ready for pickup',
        'Your order is ready. Please pick up at the agreed slot.',
        '/orders'
      );
    elsif new.order_status = 'declined' then
      perform public.create_notification(
        new.customer_id,
        'Order #' || new.order_id || ' declined',
        'The farmer declined this pre-order. You can browse other produce.',
        '/products'
      );
    elsif new.order_status = 'cancelled' then
      perform public.create_notification(
        new.farmer_id,
        'Order #' || new.order_id || ' cancelled',
        'A customer cancelled their pre-order for ' || coalesce(pname, 'produce') || '.',
        '/dashboard/farmer/pre-orders'
      );
      if old.order_status <> 'cancelled' then
        perform public.create_notification(
          new.customer_id,
          'Order #' || new.order_id || ' cancelled',
          'Your pre-order was cancelled.',
          '/orders'
        );
      end if;
    elsif new.order_status = 'completed' then
      perform public.create_notification(
        new.customer_id,
        'Order #' || new.order_id || ' completed',
        'Thanks for picking up with MarketLink. Leave a review if you like!',
        '/orders'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_order_insert on public.orders;
create trigger trg_notify_order_insert
  after insert on public.orders
  for each row execute function public.notify_on_order_event();

drop trigger if exists trg_notify_order_update on public.orders;
create trigger trg_notify_order_update
  after update of order_status on public.orders
  for each row execute function public.notify_on_order_event();
