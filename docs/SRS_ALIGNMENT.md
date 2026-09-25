# MarketLink — SRS Alignment & Gap Analysis

**Document date:** 25 September 2026 (CRUD roadmap landed)  
**SRS source:** `MarketLink End-to-End Web Solutions_SRS.pdf` (Version 1.0, Theme: eGreen Basket)  
**Codebase reviewed:** React + Vite frontend under `src/` + Supabase schema/migrations

This document maps Software Requirements Specification (SRS) expectations to the current UI and backend readiness. It does **not** redesign the UI; it records alignment and gaps for delivery planning.

---

## 1. Product summary (from SRS)

MarketLink connects local farmers-market farmers with customers so that:

- Farmers publish weekly stock, pricing, and manage pre-orders for **pickup** (no payment gateway; no delivery).
- Customers discover markets/farmers (map), browse/filter products, place/cancel pre-orders, save favorites, and leave reviews.
- An **Admin** manages users, markets, moderation, reports, and configuration.
- Optional: basic AI assistant / chatbot.

---

## 2. Current application snapshot

| Area | Status |
|------|--------|
| Marketing / visitor website (home, markets, products, farmers, about, contact, cart, orders, favorites) | **Live against Supabase when env set; empty states + demo notice otherwise** |
| Light / dark theme, responsive layout | **Implemented** |
| Login / Register screens | **Wired to Supabase Auth + demo fallback** |
| Farmer / Admin / Manager dashboards | **CRUD sections wired (products, markets, categories, farmers, customers, orders, reviews, announcements, reports)** |
| Supabase schema + RLS + auth profiles | **Configured (`001` + `002_public_catalog_reads`)** |
| Netlify SPA deploy | **Configured (`netlify.toml`, `public/_redirects`)** |
| Real map (Google Maps / OSM), payments, AI chatbot | **Still gaps** |

---

## 3. Roles (SRS vs UI)

| Role | In SRS? | In UI? | Auth readiness |
|------|---------|--------|----------------|
| Visitor (unauthenticated) | Implied | Yes — public pages | Yes |
| Customer | Yes | Public website shop (no dashboard) | Register/login → home/products/cart/orders/favorites |
| Farmer | Yes | Yes — `/dashboard/farmer` | Register as farmer + admin approval |
| Admin | Yes | Yes — `/dashboard/admin` | Promote via SQL after signup |
| Manager | **No (extension)** | Yes — `/dashboard/manager` | Enum + guard reserved |

> **Product decision:** Customer dashboard removed by design. Customers shop on the public site (`/cart`, `/orders`, `/favorites`).

---

## 4. Feature matrix — Customer (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Register / login | Yes | Supabase Auth + `profiles` | Email confirm depends on project settings |
| Customer dashboard | **Removed** | — | Use public site |
| Forgot password | Yes | `resetPasswordForEmail` | Needs live Supabase templates |
| Browse markets & farmers | Yes | Live `markets` / approved `farmer_profiles` | OSM/Google map still decorative SVG |
| Search / filter products | Yes | Live `products` + category/market filters | — |
| Cart + pre-order + pickup slot | Yes | `orders` insert (one row per line) | Default slots if farmer windows empty |
| Order status / cancel | Yes `/orders` | Cancel when `placed` | — |
| Favorites | Yes `/favorites` + heart | `favorites` table | — |
| Reviews after completed | Yes on `/orders` | `reviews` insert | — |
| AI assistant | No | — | Optional |
| Notifications | Bell UI | — | Email/in-app later |

---

## 5. Feature matrix — Farmer (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Farmer registration | Yes | Auth + `farmer_profiles` | Admin approve |
| Profile (days, pickup windows, map) | Yes | `farmer_profiles` update | — |
| CRUD stock & pricing | Yes | Full `products` fields | — |
| Sold out / unavailable | Yes | `is_available` toggle | — |
| Manage pre-orders | Yes | Status machine + stock decrement on **accept** | — |
| Sales insights | Yes | Live order aggregates | — |
| Respond to reviews | Yes | `farmer_response` | — |

---

## 6. Feature matrix — Admin (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Dashboard metrics | Yes | Count queries | — |
| Approve / suspend farmers | Yes | `approved` + `profiles.status` | — |
| Activate / deactivate customers | Yes | `profiles.status` | — |
| Manage markets + categories | Yes | CRUD | — |
| Content moderation | Yes | Hide/delete products | — |
| Reports | Yes | Date-range aggregates + `reports` snapshot | Lightweight |
| Announcements | Yes | `announcements` CRUD | Schema uses `is_published` (not `published_at`) |

---

## 7. CRUD roadmap status

| Phase | Delivered |
|-------|-----------|
| Foundation | API modules, CartContext, empty/demo states, sample catalog removed from `data.js` |
| A — Products | Farmer product CRUD + public `/products` + FreshPicks |
| B — Markets/Categories | Admin markets/categories + public markets/map/ticker |
| C — Farmers | Approved directory + farmer profile form + admin approve/suspend |
| D — Orders | Cart → orders, `/orders`, farmer status + stock on accept |
| E — Favorites/Reviews | Heart toggle, `/favorites`, reviews + farmer response |
| F — Admin ops | Customers, moderation, announcements, live stats/reports |
| G — Hardening | Validation messages, demo notice, migration `002`, docs matrix, build verify |

---

## 8. Remaining gaps

1. Real map provider (OSM/Leaflet or Google Maps) instead of decorative SVG.  
2. Email/in-app notifications.  
3. Optional AI chatbot.  
4. Apply migration `002_public_catalog_reads.sql` on the Supabase project for public farmer directory.  
5. Evaluation video + credentials sheet (SRS §1.9).  

---

## 9. Assumptions

- Stack: **React (Vite) + Supabase** on Netlify.  
- Manager role is an extension.  
- Without env vars, **demo mode** shows empty states + clear message (no invented catalog rows).  
- Seed SQL remains optional admin helpers only — not used by the frontend.
