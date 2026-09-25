-- MarketLink schema (aligned with SRS entities + existing frontend roles)
-- Run in Supabase SQL Editor or via CLI: supabase db push
-- Date: 2026-09-25

-- Roles used by the app (SRS: customer, farmer, admin; manager is reserved/extensible)
create type public.app_role as enum ('customer', 'farmer', 'admin', 'manager');

create type public.order_status as enum (
  'placed',
  'accepted',
  'ready_for_pickup',
  'completed',
  'cancelled',
  'declined'
);

create type public.account_status as enum ('pending', 'active', 'suspended', 'deactivated');

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  contact_number text,
  address text,
  role public.app_role not null default 'customer',
  status public.account_status not null default 'active',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Farmer-specific profile (SRS farmer registration fields)
create table public.farmer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  stall_name text not null,
  contact_person text,
  education_level text,
  operating_days text[],
  pickup_windows jsonb default '[]'::jsonb,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  map_provider text default 'openstreetmap',
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.markets (
  market_id bigserial primary key,
  market_name varchar(100) not null,
  address text,
  operating_days text[],
  timings text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  map_provider varchar(30) default 'openstreetmap',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.product_categories (
  category_id serial primary key,
  name varchar(50) not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  product_id bigserial primary key,
  farmer_id uuid not null references public.profiles (id) on delete cascade,
  market_id bigint references public.markets (market_id) on delete set null,
  category_id int references public.product_categories (category_id) on delete set null,
  name varchar(100) not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  unit varchar(30) default 'kg',
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  order_id bigserial primary key,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  farmer_id uuid not null references public.profiles (id) on delete cascade,
  product_id bigint not null references public.products (product_id) on delete restrict,
  quantity int not null check (quantity > 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  order_status public.order_status not null default 'placed',
  pickup_date date,
  pickup_slot text,
  order_date timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  review_id bigserial primary key,
  product_id bigint not null references public.products (product_id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  farmer_id uuid references public.profiles (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  farmer_response text,
  review_date timestamptz not null default now(),
  unique (product_id, customer_id)
);

create table public.favorites (
  favorite_id bigserial primary key,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  farmer_id uuid references public.profiles (id) on delete cascade,
  product_id bigint references public.products (product_id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (farmer_id is not null and product_id is null)
    or (farmer_id is null and product_id is not null)
  )
);

create table public.announcements (
  announcement_id bigserial primary key,
  title text not null,
  body text not null,
  published_by uuid references public.profiles (id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reports (
  report_id bigserial primary key,
  generated_by uuid references public.profiles (id) on delete set null,
  report_type varchar(50) not null,
  payload jsonb default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

-- Auto-create profile on signup (reads role/metadata from auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.app_role;
  farmer_status public.account_status;
begin
  begin
    selected_role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'customer');
  exception when others then
    selected_role := 'customer';
  end;

  -- Farmers start pending until admin approval (SRS)
  farmer_status := case when selected_role = 'farmer' then 'pending' else 'active' end;

  insert into public.profiles (id, email, full_name, contact_number, address, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'contact_number', ''),
    coalesce(new.raw_user_meta_data->>'address', ''),
    selected_role,
    farmer_status
  );

  if selected_role = 'farmer' then
    insert into public.farmer_profiles (user_id, stall_name, contact_person, education_level)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'stall_name', 'My Stall'),
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      coalesce(new.raw_user_meta_data->>'education_level', null)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.farmer_profiles enable row level security;
alter table public.markets enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.announcements enable row level security;
alter table public.reports enable row level security;

-- Profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated
  using (true);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins manage profiles"
  on public.profiles for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Farmer profiles
create policy "Farmer profiles readable"
  on public.farmer_profiles for select to authenticated
  using (true);

create policy "Farmers update own farmer profile"
  on public.farmer_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins manage farmer profiles"
  on public.farmer_profiles for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Markets / categories (public read; admin write)
create policy "Markets public read"
  on public.markets for select using (true);

create policy "Admins manage markets"
  on public.markets for all to authenticated
  using (public.current_role() in ('admin', 'manager'))
  with check (public.current_role() in ('admin', 'manager'));

create policy "Categories public read"
  on public.product_categories for select using (true);

create policy "Admins manage categories"
  on public.product_categories for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Products
create policy "Products public read"
  on public.products for select using (true);

create policy "Farmers manage own products"
  on public.products for all to authenticated
  using (farmer_id = auth.uid() or public.current_role() = 'admin')
  with check (farmer_id = auth.uid() or public.current_role() = 'admin');

-- Orders
create policy "Customers see own orders"
  on public.orders for select to authenticated
  using (
    customer_id = auth.uid()
    or farmer_id = auth.uid()
    or public.current_role() in ('admin', 'manager')
  );

create policy "Customers create orders"
  on public.orders for insert to authenticated
  with check (customer_id = auth.uid());

create policy "Parties update orders"
  on public.orders for update to authenticated
  using (
    customer_id = auth.uid()
    or farmer_id = auth.uid()
    or public.current_role() in ('admin', 'manager')
  );

-- Reviews / favorites / announcements / reports
create policy "Reviews public read"
  on public.reviews for select using (true);

create policy "Customers write reviews"
  on public.reviews for insert to authenticated
  with check (customer_id = auth.uid());

create policy "Review owners or farmers respond"
  on public.reviews for update to authenticated
  using (customer_id = auth.uid() or farmer_id = auth.uid() or public.current_role() = 'admin');

create policy "Favorites own only"
  on public.favorites for all to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "Announcements public read"
  on public.announcements for select using (is_published = true or public.current_role() = 'admin');

create policy "Admins manage announcements"
  on public.announcements for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "Admins manage reports"
  on public.reports for all to authenticated
  using (public.current_role() in ('admin', 'manager'))
  with check (public.current_role() in ('admin', 'manager'));

-- Seed categories (safe to re-run)
insert into public.product_categories (name)
values ('Vegetables'), ('Fruits'), ('Dairy'), ('Baked Goods'), ('Other')
on conflict (name) do nothing;

-- Helpful indexes
create index if not exists idx_products_farmer on public.products (farmer_id);
create index if not exists idx_orders_customer on public.orders (customer_id);
create index if not exists idx_orders_farmer on public.orders (farmer_id);
create index if not exists idx_favorites_customer on public.favorites (customer_id);
