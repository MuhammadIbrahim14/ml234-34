# MarketLink — Setup Guide

**Date:** 25 September 2026

Local setup for environment variables, Supabase (Auth + database), and development run. This file contains no application source code.

---

## 1. Prerequisites

- Node.js **18+** (20 LTS recommended; Netlify uses Node 20)
- npm 9+
- A [Supabase](https://supabase.com) project for live auth and Postgres
- Optional: Netlify account for hosting

---

## 2. Install and run

```bash
cd marketlink
npm install
cp .env.example .env.local
# Edit .env.local with Supabase URL + anon key
npm run dev
```

Open `http://localhost:5173`.

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Local preview of `dist/` |

If env vars are missing, **demo auth** allows a customer-style session only (no role pickers on login). For farmer/admin testing, configure live Supabase.

---

## 3. Environment variables

Use `.env.example` as the template. Do not commit `.env` or `.env.local`.

| Variable | Required for live auth | Description |
|----------|------------------------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_SITE_URL` | No | Canonical URL (local or Netlify) |
| `VITE_EMAILJS_SERVICE_ID` | For OTP / order mail | EmailJS service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | For OTP / order mail | One shared template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | For OTP / order mail | EmailJS public key |
| `VITE_CLOUDINARY_CLOUD_NAME` | For image upload | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | For image upload | Unsigned upload preset |
| `VITE_CLOUDINARY_FOLDER` | No | Optional folder (default `marketlink`) |

See [EMAIL_CLOUDINARY.md](./EMAIL_CLOUDINARY.md) for template variables and dashboard steps.

Set the same keys in Netlify → Site settings → Environment variables.

---

## 4. Supabase setup

### 4.1 Create the project

1. Create a Supabase project and wait for the database to be ready.
2. Copy **Project URL** and **anon public** key into `.env.local`.

### 4.2 Apply the schema

1. Open Supabase → **SQL Editor**.
2. Run `supabase/migrations/001_marketlink_schema.sql`.
3. Run `supabase/migrations/002_public_catalog_reads.sql`.
4. Run `supabase/migrations/003_single_session.sql` (one active login per account).
5. Run `supabase/migrations/004_password_otp.sql` (EmailJS OTP password reset).
6. Run `supabase/migrations/005_wiring_hardening.sql` (approval RLS, notifications, contact, `accept_order` RPC).
7. Run `supabase/migrations/006_order_rules.sql` (farmer cutoff minutes; customer modify/cancel RPCs before cutoff).
8. Run `supabase/migrations/007_restock_alerts.sql` (Phase 3 — restock alerts + preferred markets + restock notify trigger).
9. Run `supabase/migrations/008_weekly_stock_template.sql` (Phase 4 — farmer weekly stock template + apply RPC).
10. Run `supabase/migrations/009_review_moderation.sql` (review `is_hidden` + RLS; admin hide/delete) when using Phase 5.
11. Optionally run `supabase/seed.sql` (Lahore markets + commented role helpers).

Schema covers SRS-style entities: users/profiles, farmer profiles, markets, categories, products, orders, reviews, favorites, announcements, reports, notifications, contact messages, newsletter subscribers — with RLS and a signup trigger that inserts `profiles` (and `farmer_profiles` when role is farmer).

### 4.2.1 Phase 0 — Verify migrations 001–004 (run in SQL Editor)

You cannot rely on the Dashboard alone: run these checks after applying 001–004 (before or after 005). Tick each item in your private notes; if a check fails, re-run the matching migration section.

**1) Core tables from 001 exist**

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles', 'farmer_profiles', 'markets', 'product_categories',
    'products', 'orders', 'reviews', 'favorites', 'announcements', 'reports'
  )
order by table_name;
-- Expect 10 rows.
```

**2) Enums from 001 exist**

```sql
select t.typname
from pg_type t
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname in ('app_role', 'order_status', 'account_status')
order by t.typname;
-- Expect 3 rows.
```

**3) Signup trigger + helpers from 001**

```sql
select tgname from pg_trigger
where tgname = 'on_auth_user_created';
-- Expect 1 row.

select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('handle_new_user', 'current_role')
order by proname;
-- Expect 2 rows.
```

**4) Categories seeded (001)**

```sql
select category_id, name from public.product_categories order by category_id;
-- Expect 5 names: Vegetables, Fruits, Dairy, Baked Goods, Other.
-- If empty, re-run the insert block at the end of 001_marketlink_schema.sql.
```

**5) Migration 002 — public catalog policies**

```sql
select polname, tablename
from pg_policies
where schemaname = 'public'
  and polname in (
    'Approved farmer profiles public read',
    'Public can read farmer display names'
  )
order by tablename, polname;
-- Expect 2 rows.
```

**6) Migration 003 — single session column**

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'active_session_id';
-- Expect 1 row (text).
```

**7) Migration 004 — password OTP table + RPCs**

```sql
select to_regclass('public.password_reset_otps') as otp_table;
-- Expect non-null.

select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('request_password_otp', 'complete_password_reset')
order by proname;
-- Expect 2 rows.
```

**8) Live data smoke (after at least one register)**

```sql
-- Profiles for registered Auth users
select id, email, role, status from public.profiles order by created_at desc limit 20;

-- Farmer signups should have farmer_profiles with approved = false until admin approves
select p.email, p.status, fp.stall_name, fp.approved
from public.profiles p
join public.farmer_profiles fp on fp.user_id = p.id
where p.role = 'farmer'
order by fp.created_at desc;
```

**Checklist (tick when SQL above passes)**

| Check | Pass? |
|-------|-------|
| [ ] 001 tables (10) present | |
| [ ] 001 enums (3) present | |
| [ ] 001 trigger + `handle_new_user` / `current_role` | |
| [ ] `product_categories` has 5 seed rows | |
| [ ] 002 public read policies present | |
| [ ] 003 `profiles.active_session_id` present | |
| [ ] 004 OTP table + RPCs present | |
| [ ] Profiles exist for registered users | |
| [ ] Farmer signups have `farmer_profiles.approved = false` | |

**After 005** (optional quick confirm):

```sql
select to_regclass('public.notifications') as notifications,
       to_regclass('public.contact_messages') as contact_messages,
       to_regclass('public.newsletter_subscribers') as newsletter;

select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'accept_order';
-- Expect 1 row.
```

### 4.3 Auth provider settings

Authentication → Providers → Email: enabled.

For local development:

- Site URL: `http://localhost:5173`
- Redirect allow-list: localhost + your Netlify URL
- Confirm-email: disable temporarily for easier testing, or confirm via email link

### 4.4 Create the private Admin account (`foraptech080@gmail.com`)

Admin is **not** created from the public signup form. Add it in Supabase, then promote the profile.

1. Supabase → **Authentication** → **Users** → **Add user** → **Create new user**
2. Email: `foraptech080@gmail.com`
3. Set a strong password (save it privately)
4. Turn **Auto Confirm User** ON (so you can log in immediately)
5. Click **Create user**
6. Open **SQL Editor** and run:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'foraptech080@gmail.com';
```

7. If no profile row exists yet (rare), create one with the Auth user UUID from Authentication → Users:

```sql
insert into public.profiles (id, email, full_name, role, status)
values (
  'PASTE_AUTH_USER_UUID_HERE',
  'foraptech080@gmail.com',
  'MarketLink Admin',
  'admin',
  'active'
)
on conflict (id) do update
set role = 'admin', status = 'active', email = excluded.email;
```

8. Log in on the website with the **same Login form** (`/login`) using that email + password → you land on `/dashboard/admin`.

**Approve farmer** (after they register as Farmer on the site):

```sql
update public.profiles
set status = 'active'
where email = 'YOUR_FARMER_EMAIL';

update public.farmer_profiles
set approved = true
where user_id = (
  select id from public.profiles where email = 'YOUR_FARMER_EMAIL'
);
```

**Customer** — default on register (`role = customer`, `status = active`); shops on the public site (no customer dashboard).

### 4.5 Credentials template (fill privately)

| Role | Email | Password | How to create |
|------|-------|----------|---------------|
| Customer | | | Register as Customer on `/register` |
| Farmer | | | Register as Farmer → approve in SQL |
| Admin | foraptech080@gmail.com | (private) | Supabase Auth → Add user → SQL promote |

SRS §1.9 requires user credentials for all user types in the submission package — keep passwords out of git.

**Session rule:** Different users/roles can stay logged in at the same time in **separate browser tabs** (per-tab `sessionStorage` + isolated auth BroadcastChannel). Open 3 tabs → login as customer / farmer / admin — each keeps its own session. The **same account** on two devices/browsers still replaces the previous session (single active device via `active_session_id`).

---

## 5. Optional Supabase CLI

`supabase/config.toml` is provided for teams using the CLI. You can still apply SQL only via the Dashboard Editor without the CLI.

---

## 6. Verify auth quickly

1. Start `npm run dev` with env vars set.
2. Register a customer → land on `/` (public shop). Farmer/admin → their dashboard.
3. On login, use **Forgot password?** to send OTP (live auth + EmailJS + migration 004).
4. Sign out → register a farmer → profile `pending` until approved (pending banner; cannot publish products until 005 RLS).
5. Promote an admin in SQL → login → `/dashboard/admin`.
6. Unauthenticated visit to `/dashboard/*` → redirect to `/login`.

---

## 7. End-to-end checklist (after 005 + seed)

Run these after applying `005_wiring_hardening.sql` and `seed.sql`:

| # | Step | Expected |
|---|------|----------|
| 1 | Run 005 + seed in SQL Editor | No errors; 5 Lahore markets |
| 2 | Admin login → Markets | Seeded markets visible (+ OSM pins) |
| 3 | Farmer register | Pending banner; product create blocked |
| 4 | Admin approve farmer | Welcome notification; farmer can add product (Cloudinary) |
| 5 | Public `/products` + `/farmers` | Approved data only |
| 6 | Customer favorite + cart checkout | `orders` rows + EmailJS + farmer notification |
| 7 | Farmer accept order | Stock decrements via `accept_order`; customer notified |
| 8 | Contact form | `contact_messages` row + EmailJS to admin |
| 9 | Settings save profile | `profiles` updated (avatar optional) |
| 10 | Home / Markets map | Seeded market pins on Leaflet OSM |

**E2E results (code complete 2026-09-25):** Implementation and `npm run build` verified in repo. Live Supabase checks (rows 1–10 against a project) remain a **manual** step for the team after running SQL in the Dashboard.

### 7.1 Phase 1 — Order rules (after 006)

| # | Step | Expected |
|---|------|----------|
| 1 | Run `006_order_rules.sql` | Columns + RPCs created |
| 2 | Farmer profile → set cutoff minutes | Saves next to pickup windows |
| 3 | Customer place order → `/orders` edit qty | Works while `placed` and before cutoff |
| 4 | Cancel same order before cutoff | Status `cancelled` |
| 5 | Farmer accept order → customer edit | Blocked (not placed) |
| 6 | Past cutoff → edit/cancel | Clear error: changes closed |

### 7.2 Phase 2 — Discovery UX

| # | Step | Expected |
|---|------|----------|
| 1 | `/products` Filters → price min/max | List narrows by price |
| 2 | Filters → operating day (e.g. Sat) | Only markets/farmers open that day |
| 3 | Open a product (name/image) | Drawer shows read-only reviews (or clean empty state) |
| 4 | `/farmers` → Reviews | Stars + text; empty state if none |
| 5 | `/markets` or home Explore map | Directions (Google/OSM) + farmer pins when lat/lng set |

### 7.3 Phase 3 — Customer hub (after 007)

| # | Step | Expected |
|---|------|----------|
| 1 | Run `007_restock_alerts.sql` | `restock_alerts` + `preferred_markets` + trigger |
| 2 | Completed `/orders` → Order again | Cart preloads → `/cart` |
| 3 | Out-of-stock favorite/product → Notify when back | Alert row; notification when stock returns |
| 4 | Markets → Prefer | Appears under `/favorites` Preferred markets |
| 5 | Home while signed in as customer | Optional “Your markets” if prefs exist |

**Quick SQL confirm after 007:**

```sql
select to_regclass('public.restock_alerts') as restock_alerts,
       to_regclass('public.preferred_markets') as preferred_markets;

select tgname from pg_trigger where tgname = 'trg_notify_restock';
-- Expect 1 row.
```

### 7.4 Phase 4 — Farmer tools (after 008)

| # | Step | Expected |
|---|------|----------|
| 1 | Run `008_weekly_stock_template.sql` | `farmer_profiles.weekly_stock_template` + `apply_weekly_stock_template` RPC |
| 2 | Farmer → My Products → Weekly stock template | Set qty per weekday; Save template |
| 3 | Apply today’s template (approved farmer) | Products `stock_quantity` / `is_available` update |
| 4 | Unapproved farmer → Apply | Blocked by product RLS (no privilege bypass) |
| 5 | Sales & Insights / Overview | Bestsellers list (qty + revenue bars/rows) |

### 7.5 Phase 5 — Admin insight + review moderation (after 009)

| # | Step | Expected |
|---|------|----------|
| 1 | Run `009_review_moderation.sql` (after 001–007; and 008 if Phase 4 applied) | `reviews.is_hidden` + public select excludes hidden |
| 2 | Admin → Reviews (or Moderation) | List reviews; Hide / Unhide / Delete |
| 3 | Public product/farmer reviews | Hidden reviews not shown |
| 4 | Admin → Reports → date range | Snapshot stats + revenue by market + top farmers |
| 5 | Save snapshot | Row in `reports` with payload including `byMarket` / `topFarmers` |

### 7.6 Phase 6 — Optional FAQ chatbot (no migration)

Offline FAQ helper on **public / visitor routes only** (home, catalog pages, cart/orders, login/register). Hidden on farmer/admin dashboards. Answers come from a local knowledge base — no paid LLM required.

| # | Step | Expected |
|---|------|----------|
| 1 | Open `/` (or `/markets`, `/products`, …) | Floating help button bottom-right |
| 2 | Open chat → tap a quick topic | Answer + optional deep links (markets, cart, register, …) |
| 3 | Type e.g. “how does pickup work?” | Offline FAQ answer about pre-order + pay at stall |
| 4 | Visit `/dashboard/farmer` or `/dashboard/admin` | Help widget **not** shown |
| 5 | Optional: set `VITE_FAQ_LLM_API_KEY` later | Same UI can call an LLM; until wired, offline FAQ still works |

---

## 8. Related docs

- [SRS alignment / gaps](./SRS_ALIGNMENT.md)
- [Architecture & roles](./ARCHITECTURE.md)
- [Netlify deploy](./DEPLOYMENT.md)
- [EmailJS + Cloudinary](./EMAIL_CLOUDINARY.md)
