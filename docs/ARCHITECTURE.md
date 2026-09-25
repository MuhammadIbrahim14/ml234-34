# MarketLink — Architecture & Roles Readiness

**Date:** 25 September 2026

High-level architecture for the current React + Vite frontend with Supabase Auth/Postgres, prepared for Netlify hosting and upcoming role-based features.

---

## 1. System context

```
[ Browser ]
    |  HTTPS
    v
[ Netlify CDN ]  -- static assets from Vite `dist/`
    |
    |  Supabase JS (anon key)
    v
[ Supabase ]
    ├── Auth (email/password sessions)
    └── Postgres + RLS (profiles, markets, products, orders, …)
```

Public marketing pages work without a session. Dashboards require authentication and role checks in the client, enforced again by RLS when live data queries are added.

---

## 2. Frontend structure

| Path | Responsibility |
|------|----------------|
| `src/main.jsx` | Mounts app inside `AuthProvider` |
| `src/App.jsx` | Hashless path routing, theme, cart toast, splash shell |
| `src/router.js` | `pushState` navigation + smooth scroll helpers |
| `src/context/AuthContext.jsx` | Session, profile, signIn/signUp/signOut, role helpers |
| `src/lib/supabase.js` | Client factory, role constants, config detection |
| `src/components/RoleGuard.jsx` | Dashboard access gate |
| `src/components/Auth.jsx` | Login / register UI wired to auth |
| `src/components/Dashboard.jsx` | Role workspaces (customer, farmer, admin, manager) |
| `src/components/SitePages.jsx` | Markets, products, farmers, about, contact, cart |
| `src/components/sections/*` | Home page sections (unchanged visually) |
| `src/data/data.js` | Sample catalog data until DB wiring |
| `src/styles/marketlink.css` | Themes + splash + smooth scroll |
| `supabase/migrations/*` | Database definition |
| `netlify.toml` / `public/_redirects` | SPA deploy |

Routing is lightweight (no React Router dependency): pathnames like `/`, `/markets`, `/login`, `/dashboard/farmer/...`.

---

## 3. Role model

| Role | Audience | Default entry |
|------|----------|---------------|
| Visitor | Anyone | Public site |
| `customer` | Shoppers | `/dashboard/customer` |
| `farmer` | Stall owners | `/dashboard/farmer` |
| `admin` | Platform operators | `/dashboard/admin` |
| `manager` | Future market ops (extension) | `/dashboard/manager` |

Stored on `public.profiles.role` (`app_role` enum). Signup metadata may include `role`, `full_name`, `contact_number`, `address`, `stall_name`, `education_level` — consumed by the `handle_new_user` trigger.

### Guards

- `RoleGuard` blocks unauthenticated access to `/dashboard/*`.
- Non-matching roles redirect to their own dashboard path.
- Admins may open any role dashboard (support / moderation convenience).
- `AuthContext.hasRole` / `canAccessDashboard` are the extension points for future feature flags.

### Farmer approval

SRS requires admin approval before farmers list products. Schema fields:

- `profiles.status` (`pending` for new farmers)
- `farmer_profiles.approved` (boolean)

UI approval actions are still preview panels; SQL helpers are in `supabase/seed.sql`.

---

## 4. Auth flows

### Live (Supabase configured)

1. Register → `auth.signUp` with metadata → trigger inserts profile.
2. Login → `auth.signInWithPassword` → load `profiles` row → navigate by role.
3. Session persisted (`marketlink-auth` storage key); `onAuthStateChange` keeps React state fresh.
4. Sign out clears Supabase session and local demo key.

### Demo (env missing)

1. Login/Register creates a local demo session.
2. Login portal toggle: Customer / Farmer / Admin.
3. Useful for UI demos without a cloud project; not for production.

---

## 5. Data readiness (SRS entities)

| Entity | Table | Ready for app queries |
|--------|-------|------------------------|
| Users | `auth.users` + `profiles` | Yes |
| Farmer extras | `farmer_profiles` | Yes |
| Markets | `markets` | Yes |
| Categories | `product_categories` | Yes (seeded names) |
| Products | `products` | Yes |
| Orders | `orders` | Yes |
| Reviews | `reviews` | Yes |
| Favorites | `favorites` | Yes |
| Announcements | `announcements` | Yes |
| Reports | `reports` | Yes |

Next implementation step: replace sample reads in `data.js` / dashboard panels with Supabase queries using the existing RLS policies — without changing the visual layout.

---

## 6. Extensibility checklist

When adding a feature:

1. Prefer a column/table already in the migration; avoid inventing parallel schemas.
2. Add RLS policy for the role that owns the action.
3. Gate UI with `hasRole('farmer')` (etc.) rather than hard-coding paths only.
4. Keep visitor pages public; keep dashboards behind `RoleGuard`.
5. Do not put service-role keys in the frontend.

---

## 7. Non-goals of this architecture pass

- No payment gateway (SRS out of scope).
- No courier/delivery module.
- No full AI chatbot yet (optional in SRS).
- No restyle of existing marketing or dashboard chrome.
