# MarketLink

Farm fresh, just a click away — React + Vite frontend with Supabase Auth readiness and Netlify deploy support.

Theme: **eGreen Basket** (MarketLink SRS). Light and dark UI preserved; additive splash + smooth scrolling only.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173

Without Supabase env vars the app runs in **demo auth** (Customer / Farmer / Admin toggle on login).

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/SRS_ALIGNMENT.md](docs/SRS_ALIGNMENT.md) | SRS vs UI gap analysis |
| [docs/SETUP.md](docs/SETUP.md) | Env, Supabase, auth users |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Roles, structure, extensibility |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Netlify go-live |

SRS PDF: `MarketLink End-to-End Web Solutions_SRS.pdf`

## Scripts

- `npm run dev` — development
- `npm run build` — production → `dist/`
- `npm run preview` — preview build

## Stack

- React 18 + Vite 5
- Lucide icons
- Supabase JS (`@supabase/supabase-js`) for Auth + future data
- Netlify (`netlify.toml`, SPA redirects)

## Folder highlights

- `src/components/sections/` — home sections
- `src/components/Dashboard.jsx` — role dashboards
- `src/context/AuthContext.jsx` — auth + roles
- `supabase/migrations/` — Postgres schema + RLS
- `public/_redirects` — Netlify SPA fallback

## Notes

- Payment gateways and delivery are out of scope per SRS (pickup only).
- Catalog pages still use sample data in `src/data/data.js` until wired to Supabase tables.
- Do not commit `.env.local` secrets.
