# MarketLink — SRS Alignment & Gap Analysis

**Document date:** 25 September 2026 (DB wiring Phases 0–6)  
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
| Supabase schema + RLS + auth profiles | **`001`–`005` (wiring hardening)** |
| Netlify SPA deploy | **Configured** |
| Real map (OSM/Leaflet) | **Implemented on Explore + Markets** |
| Payments, AI chatbot | **Out of scope / optional gap** |

---

## 3. Roles (SRS vs UI)

| Role | In SRS? | In UI? | Auth readiness |
|------|---------|--------|----------------|
| Visitor (unauthenticated) | Implied | Yes — public pages | Yes |
| Customer | Yes | Public website shop (no dashboard) | Register/login → home/products/cart/orders/favorites/notifications |
| Farmer | Yes | Yes — `/dashboard/farmer` | Register as farmer + admin approval |
| Admin | Yes | Yes — `/dashboard/admin` | Promote via SQL after signup |
| Manager | **No (extension)** | Yes — `/dashboard/manager` | Enum + guard reserved |

> **Product decision:** Customer dashboard removed by design. Customers shop on the public site (`/cart`, `/orders`, `/favorites`, `/notifications`).

---

## 4. Feature matrix — Customer (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Register / login | Yes | Supabase Auth + `profiles` | Email confirm depends on project settings |
| Customer dashboard | **Removed** | — | Use public site |
| Forgot password | Yes | EmailJS OTP + `004` RPC | Needs EmailJS + migration 004 |
| Browse markets & farmers | Yes | Live + **Leaflet OSM** | — |
| Search / filter products | Yes | Live + Hero/Nav `?q=` | — |
| Cart + pre-order + pickup slot | Yes | `orders` insert | Default slots if farmer windows empty |
| Order status / cancel | Yes `/orders` | Cancel when `placed` | In-app notifications on status |
| Favorites | Yes `/favorites` + heart | Product + farmer hearts | — |
| Reviews after completed | Yes on `/orders` | `reviews` insert | — |
| AI assistant | No | — | Optional / out of scope |
| Notifications | Yes `/notifications` + bell | `notifications` table + triggers | — |
| Contact | Yes | `contact_messages` + EmailJS | — |

---

## 5. Feature matrix — Farmer (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Farmer registration | Yes | Auth + `farmer_profiles` | Pending until admin approve |
| Profile (days, pickup windows, map, avatar) | Yes | `farmer_profiles` + `profiles.avatar_url` | — |
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

---

## 8. Remaining gaps

1. Optional AI chatbot (SRS optional) — **not in scope**.  
2. Payment gateway / delivery — **not in scope**.  
3. Evaluation video + credentials sheet (SRS §1.9) — submission package.  
4. Apply migrations `001`–`005` + `seed.sql` on the live Supabase project (manual).  

---

## 9. Assumptions

- Stack: **React (Vite) + Supabase** on Netlify.  
- Manager role is an extension.  
- Without env vars, **demo mode** shows empty states + clear message.  
- Seed SQL inserts markets only — no fake auth passwords in git.
