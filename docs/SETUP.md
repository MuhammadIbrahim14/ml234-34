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

If env vars are missing, **demo auth** keeps login and dashboards usable (session in `localStorage`). On the login screen, choose Customer / Farmer / Admin for the demo portal.

---

## 3. Environment variables

Use `.env.example` as the template. Do not commit `.env` or `.env.local`.

| Variable | Required for live auth | Description |
|----------|------------------------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_SITE_URL` | No | Canonical URL (local or Netlify) |

Vite only exposes `VITE_*` variables to the browser.

Set the same keys in Netlify → Site settings → Environment variables.

---

## 4. Supabase setup

### 4.1 Create the project

1. Create a Supabase project and wait for the database to be ready.
2. Copy **Project URL** and **anon public** key into `.env.local`.

### 4.2 Apply the schema

1. Open Supabase → **SQL Editor**.
2. Run `supabase/migrations/001_marketlink_schema.sql`.
3. Optionally run `supabase/seed.sql` (sample market + commented role helpers).

Schema covers SRS-style entities: users/profiles, farmer profiles, markets, categories, products, orders, reviews, favorites, announcements, reports — with RLS and a signup trigger that inserts `profiles` (and `farmer_profiles` when role is farmer).

### 4.3 Auth provider settings

Authentication → Providers → Email: enabled.

For local development:

- Site URL: `http://localhost:5173`
- Redirect allow-list: localhost + your Netlify URL
- Confirm-email: disable temporarily for easier testing, or confirm via email link

### 4.4 Role users (required for evaluation)

Register through the UI, then promote in SQL:

**Admin**

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'YOUR_ADMIN_EMAIL';
```

**Approve farmer**

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

**Customer** — default on register (`role = customer`, `status = active`).

### 4.5 Credentials template (fill privately)

| Role | Email | Password | How to create |
|------|-------|----------|---------------|
| Customer | | | Register as Customer |
| Farmer | | | Register as Farmer → approve in SQL |
| Admin | | | Register → set `role = 'admin'` in SQL |

SRS §1.9 requires user credentials for all user types in the submission package — keep passwords out of git.

---

## 5. Optional Supabase CLI

`supabase/config.toml` is provided for teams using the CLI. You can still apply SQL only via the Dashboard Editor without the CLI.

---

## 6. Verify auth quickly

1. Start `npm run dev` with env vars set.
2. Register a customer → land on `/dashboard/customer`.
3. Sign out → register a farmer → profile `pending` until approved.
4. Promote an admin in SQL → login → `/dashboard/admin`.
5. Unauthenticated visit to `/dashboard/*` → redirect to `/login`.

---

## 7. Related docs

- [SRS alignment / gaps](./SRS_ALIGNMENT.md)
- [Architecture & roles](./ARCHITECTURE.md)
- [Netlify deploy](./DEPLOYMENT.md)
