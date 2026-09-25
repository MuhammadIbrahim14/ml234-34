# MarketLink — SRS Alignment & Gap Analysis

**Document date:** 25 September 2026  
**SRS source:** `MarketLink End-to-End Web Solutions_SRS.pdf` (Version 1.0, Theme: eGreen Basket)  
**Codebase reviewed:** React + Vite frontend under `src/`

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
| Marketing / visitor website (home, markets, products, farmers, about, contact, cart) | **Implemented (UI + sample data)** |
| Light / dark theme, responsive layout | **Implemented** |
| Login / Register screens | **Implemented (now wired to Supabase Auth + demo fallback)** |
| Customer / Farmer / Admin / Manager dashboards | **UI shells implemented; live CRUD against DB still pending** |
| Supabase schema + RLS + auth profiles | **Configured (migrations ready to run)** |
| Netlify SPA deploy | **Configured (`netlify.toml`, `public/_redirects`)** |
| Real map (Google Maps / OSM), payments, AI chatbot | **Not in scope of current backend wiring / still gaps** |

---

## 3. Roles (SRS vs UI)

| Role | In SRS? | In UI? | Auth readiness |
|------|---------|--------|----------------|
| Visitor (unauthenticated) | Implied | Yes — public pages | Yes |
| Customer | Yes | Yes — `/dashboard/customer` | Register/login + `RoleGuard` |
| Farmer | Yes | Yes — `/dashboard/farmer` | Register as farmer + pending approval field in DB |
| Admin | Yes | Yes — `/dashboard/admin` | Promote via SQL after signup (see Setup) |
| Manager | **No (extension)** | Yes — `/dashboard/manager` | Enum + guard reserved for future |

Role-based access: `src/context/AuthContext.jsx` + `src/components/RoleGuard.jsx`. Admins may open any dashboard for support; other roles are restricted to their own portal.

---

## 4. Feature matrix — Customer (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Register / login with name, contact, email, address | Yes | Supabase Auth + `profiles` | Confirm email flow depends on Supabase project settings |
| Customer dashboard | Yes (sections) | Session + profile name | Section panels still frontend preview |
| Browse markets & farmers | Yes (`/markets`, `/farmers`, home map UI) | Sample data in `src/data/data.js` | Persist markets/farmers from DB; real geolocation |
| Embedded map + directions | Stylized map UI | — | Integrate Google Maps or OpenStreetMap |
| Search / filter products | Partial (search on products page) | Sample products | Full filters: price, category, market, day |
| Cart + pre-order + pickup slot | Cart page + dashboard Orders UI | `orders` table ready | Wire cart → order insert; pickup slots |
| Order status / modify / cancel | Dashboard labels | Schema supports statuses | Implement mutations + cut-off rules |
| Order history & reorder | Dashboard | Schema ready | Wire queries |
| Favorites (farmers/products) | Heart UI + Favorites section | `favorites` table | Wire toggle + list |
| Reviews & ratings | Dashboard Reviews section | `reviews` table | Wire after completed orders |
| AI assistant (optional) | No | — | Optional per SRS |
| Notifications | Bell UI | — | Email/in-app later |

---

## 5. Feature matrix — Farmer (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Farmer registration (stall, contact, email, address) | Yes | Auth metadata + `farmer_profiles` | Admin approval (`approved` / `status`) |
| Profile: markets, days, pickup windows, map pin | Dashboard Profile/Markets UI | Columns in schema | Forms → update `farmer_profiles` |
| CRUD weekly stock & pricing | Products / Add Product UI | `products` table | Wire create/update/delete |
| Sold out / unavailable | Preview controls | `is_available` | Wire toggle |
| Manage pre-orders (accept/decline/ready) | Pre-Orders UI | `orders.order_status` | Wire status updates |
| Cut-off times & pickup slots | UI mentions | `pickup_windows` jsonb | Full UX still preview |
| Sales insights (totals, pending, revenue) | Stats cards (sample numbers) | Aggregate queries | Replace sample with SQL aggregates |
| Respond to reviews | Reviews section | `farmer_response` | Wire update |

---

## 6. Feature matrix — Admin (SRS §1.6)

| Requirement | UI present? | Backend / data | Gap notes |
|-------------|-------------|----------------|-----------|
| Separate admin dashboard + metrics | Yes | Counts via queries TBD | Replace sample stats |
| Approve / suspend farmers | Farmers section UI | `profiles.status`, `farmer_profiles.approved` | Wire actions |
| Activate / deactivate customers | Customers section UI | `profiles.status` | Wire actions |
| Manage markets | Markets section UI | `markets` table | Wire CRUD |
| Content moderation | Moderation section UI | products / reviews | Soft-delete or remove flags |
| Reports & analytics | Reports section UI | `reports` table | Generate real reports |
| Categories & announcements | Announcements / Settings UI | `product_categories`, `announcements` | Wire publish |

---

## 7. Other SRS items

| Item | Status |
|------|--------|
| About Us | Page present (`/about`) |
| Contact Us | Page present (`/contact`); map note says backend phase |
| Responsive design | Present |
| No payment gateway | Respected (UI says pay at pickup) |
| No delivery / courier | Respected (pickup-focused copy) |
| Role-based access | Structure in place; deepen with RLS as features go live |
| Non-functional (security, performance, a11y) | Auth + Netlify headers started; continue as features land |

---

## 8. UI vs SRS — intentional non-changes

Per project instructions, existing visual design was **not** restyled. Only allowed additive UI:

1. **Smooth scrolling** site-wide (`html { scroll-behavior: smooth }` + reduced-motion respect).
2. **Agriculture-themed splash screen** once per browser session.

Dashboard chrome, marketing sections, colors, and layouts remain as previously built.

---

## 9. Remaining gaps (priority for next sprints)

1. Connect dashboards/catalog to Supabase tables (replace `data.js` sample where appropriate).  
2. Real map provider (OSM/Leaflet or Google Maps).  
3. Full order lifecycle + stock decrement.  
4. Email/in-app notifications.  
5. Optional AI chatbot.  
6. Evaluation video + credentials sheet (SRS §1.9 deliverables).  

---

## 10. Assumptions

- Stack choice: **React (Vite) + Supabase (Auth/Postgres)** for hosting on Netlify is acceptable for this delivery phase; SRS lists several backend options including MERN — Supabase provides the database + auth services without inventing unrelated schemas.  
- Manager role is an **extension** beyond SRS, kept for future market-manager workflows.  
- Until env vars are set, **demo auth** keeps UI flows usable for local preview.
