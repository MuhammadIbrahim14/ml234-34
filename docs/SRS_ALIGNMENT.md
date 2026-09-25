# MarketLink — SRS Alignment & Gap Analysis

**Document date:** 25 September 2026 (SRS gaps Phases 1–3 on public hub; later phases may add 008+)  
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
| Marketing / visitor website (home, markets, products, farmers, about, contact, cart, orders, favorites, notifications) | **Live against Supabase when env set** |
| Light / dark theme, responsive layout | **Implemented** |
| Login / Register screens | **Wired to Supabase Auth + demo fallback** |
| Farmer / Admin / Manager dashboards | **CRUD + notifications + settings wired** |
| Supabase schema + RLS + auth profiles | **`001`–`007` (+ optional 008/009 from later phases)** |
| Netlify SPA deploy | **Configured** |
| Real map (OSM/Leaflet) + directions + farmer pins | **Implemented on Explore + Markets** |
| Payments, AI chatbot | **Out of scope / optional gap** |

---

## 3. Roles (SRS vs UI)

| Role | In SRS? | In UI? | Auth readiness |
|------|---------|--------|----------------|
| Visitor (unauthenticated) | Implied | Yes — public pages | Yes |
| Customer | Yes | **Public website shop / customer hub** (no separate dashboard rebuild) | Register/login → home/products/cart/orders/favorites/notifications |
| Farmer | Yes | Yes — `/dashboard/farmer` | Register as farmer + admin approval |
| Admin | Yes | Yes — `/dashboard/admin` | Promote via SQL after signup |
| Manager | **No (extension)** | Yes — `/dashboard/manager` | Enum + guard reserved |

> **Product decision (intentional):** There is **no** `/dashboard/customer` rebuild. The **customer dashboard = the public hub** (`/`, `/products`, `/markets`, `/farmers`, `/cart`, `/orders`, `/favorites`, `/notifications`). SRS customer conveniences (reorder, restock alerts, preferred markets, reviews, filters) land on those routes.

---

## 4. Feature matrix — Customer (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Register / login | Yes | Supabase Auth + `profiles` | Email confirm depends on project settings |
| Customer dashboard | **Public hub (intentional)** | — | Not a separate dashboard app |
| Forgot password | Yes | EmailJS OTP + `004` RPC | Needs EmailJS + migration 004 |
| Browse markets & farmers | Yes | Live + **Leaflet OSM** + directions + farmer pins | — |
| Search / filter products | Yes | Price min/max + market/farmer **operating day** + Hero/Nav `?q=` | — |
| Cart + pre-order + pickup slot | Yes | `orders` insert | Default slots if farmer windows empty |
| Order status / cancel / modify | Yes `/orders` | Cancel/modify when `placed` + before cutoff (`006`) | In-app notifications on status |
| Quick reorder | Yes `/orders` | Cart `preloadItems` → `/cart` | Completed rows only |
| Favorites + preferred markets | Yes `/favorites` + Prefer on markets | Product/farmer hearts + `preferred_markets` (`007`) | Home “Your markets” when signed in |
| Restock alerts | Yes product/favorites | `restock_alerts` + notify trigger (`007`) | “Notify when back” |
| Reviews after completed | Yes on `/orders`; **read-only** on product drawer + farmer profile | `reviews` + list APIs | Write path stays post-completed |
| AI assistant | No | — | Optional / out of scope |
| Notifications | Yes `/notifications` + bell | `notifications` table + triggers | Includes restock alerts |
| Contact | Yes | `contact_messages` + EmailJS | — |

---

## 5. Feature matrix — Farmer (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Farmer registration | Yes | Auth + `farmer_profiles` | Pending until admin approve |
| Profile (days, pickup windows, cutoff, map, avatar) | Yes | `farmer_profiles` + `order_cutoff_minutes` | — |
| CRUD stock & pricing | Yes | Blocked until `approved` (RLS + banner) | — |
| Sold out / unavailable | Yes | `is_available` toggle | — |
| Manage pre-orders | Yes | `accept_order` RPC (atomic stock) | — |
| Sales insights | Yes | Live order aggregates | — |
| Respond to reviews | Yes | `farmer_response` | — |
| Notifications | Yes | Dashboard list | — |

---

## 6. Feature matrix — Admin (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Dashboard metrics | Yes | Count queries | — |
| Approve / suspend farmers | Yes | `approved` + welcome notification | — |
| Activate / deactivate customers | Yes | `profiles.status` | — |
| Manage markets + categories | Yes | CRUD | Seed Lahore markets available |
| Content moderation | Yes | Hide/delete products + contact inbox | — |
| Reports | Yes | Date-range aggregates + `reports` snapshot | Lightweight |
| Announcements | Yes | `announcements` CRUD | — |
| Pickup slots (manager) | Yes | Read-only farmer `pickup_windows` | — |

---

## 7. CRUD / wiring roadmap status

| Phase | Delivered |
|-------|-----------|
| Foundation–G | Prior CRUD roadmap |
| Phase 0 | SETUP verification checklist for 001–004 |
| Phase 1 | Migration `005_wiring_hardening.sql` |
| Phase 2 | Expanded `seed.sql` (Lahore markets) |
| Phase 3 | Contact, notifications, settings, footer newsletter, hero search |
| Phase 4 | Pending banner, accept RPC, hearts, approve notify, pickup slots |
| Phase 5 | Leaflet OSM on ExploreMap + Markets |
| Phase 6 | Docs + build verify |
| **SRS gaps P1** | `006_order_rules.sql` + orders edit/cancel + farmer cutoff |
| **SRS gaps P2** | Product price/day filters; public reviews; map directions + farmer pins |
| **SRS gaps P3** | Quick reorder; `007` restock alerts + preferred markets; hub docs |

---

## 8. Remaining gaps

1. Optional AI chatbot (SRS optional) — **not in scope** (Phase 6 optional).  
2. Payment gateway / delivery — **not in scope**.  
3. Farmer weekly stock template + bestsellers — Phase 4 (`008`) when applied.  
4. Admin review moderation + stronger reports — Phase 5 (`009`) when applied.  
5. Evaluation video + credentials sheet (SRS §1.9) — submission package.  
6. Apply migrations `001`–`007` (+ later 008/009 as needed) + `seed.sql` on the live Supabase project (manual).  

---

## 9. Assumptions

- Stack: **React (Vite) + Supabase** on Netlify.  
- Manager role is an extension.  
- Without env vars, **demo mode** shows empty states + clear message.  
- Seed SQL inserts markets only — no fake auth passwords in git.  
- Customer “dashboard” requirements are satisfied by the **public hub**, not a separate customer SPA shell.
