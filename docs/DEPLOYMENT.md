# MarketLink — Netlify Deployment

**Date:** 25 September 2026

Steps to put MarketLink live on Netlify as a static SPA backed by Supabase.

---

## 1. Why Netlify fits

- Vite builds a static `dist/` folder (HTML/CSS/JS).
- `netlify.toml` sets build command, publish directory, Node 20, SPA redirects, and basic security headers.
- `public/_redirects` duplicates the SPA rule for robustness.
- Auth and data live on Supabase (not on Netlify Functions in this phase).

---

## 2. One-time Netlify setup

1. Push the `marketlink` repo to GitHub/GitLab/Bitbucket (or use Netlify CLI drag-and-drop of `dist/` after `npm run build`).
2. Netlify → **Add new site** → Import from Git.
3. Build settings (auto-read from `netlify.toml`):
   - **Base directory:** leave **empty** (app is at repo root — not `client`)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `20`
4. **Environment variables** (Site configuration → Environment variables):

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_SITE_URL` | `https://YOUR-SITE.netlify.app` (or custom domain) |

5. Deploy the site.
6. In Supabase Auth → URL configuration, add:
   - Site URL: your Netlify URL
   - Redirect URLs: `https://YOUR-SITE.netlify.app/**` and localhost for dev

---

## 3. SPA routing

Client routes (`/login`, `/dashboard/farmer`, `/markets`, …) must not 404 on refresh.

Configured as:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

and `public/_redirects`:

```
/*    /index.html   200
```

---

## 4. CLI deploy (optional)

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

Ensure env vars exist in the Netlify UI so production builds inline the correct `VITE_*` values (Vite bakes them at **build** time).

---

## 5. Post-deploy checklist

- [ ] Home page loads; splash appears once per session; smooth scroll works
- [ ] `/markets`, `/products`, `/about`, `/contact` work and survive refresh
- [ ] Register / login against Supabase
- [ ] Customer, farmer, and admin dashboards open for the correct role
- [ ] Unauthenticated `/dashboard/admin` redirects to login
- [ ] Theme toggle still works

---

## 6. Custom domain (optional)

Netlify → Domain management → Add domain → follow DNS instructions. Update `VITE_SITE_URL` and Supabase Auth allow-list to the custom domain, then trigger a new deploy.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Base directory does not exist: .../client` | Netlify UI Base directory = `client` | Site configuration → Build & deploy → Build settings → Edit → clear **Base directory** (empty) → Save → Trigger deploy |
| Blank routes on refresh | Redirects missing | Confirm `netlify.toml` / `_redirects` in repo |
| Auth always demo mode | Env vars missing at build | Set `VITE_*` in Netlify and redeploy |
| Login works but no profile | Migration not applied | Run `001_marketlink_schema.sql` then `002_public_catalog_reads.sql` |
| Empty public farmers / no farmer names on products | Migration `002` missing | Run `supabase/migrations/002_public_catalog_reads.sql` |
| CORS / redirect errors | Auth URL config | Add Netlify URL in Supabase Auth settings |
| Demo empty states everywhere | Env vars missing | Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` and redeploy |
