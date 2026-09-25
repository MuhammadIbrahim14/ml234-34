# MarketLink documentation index

Dated **25 September 2026**. Sourced from `MarketLink End-to-End Web Solutions_SRS.pdf`.

| Document | Purpose |
|----------|---------|
| [SRS_ALIGNMENT.md](./SRS_ALIGNMENT.md) | UI vs SRS audit and gap analysis |
| [SETUP.md](./SETUP.md) | Install, env vars, Supabase Auth/DB |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Structure, roles, extensibility |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Netlify production deploy |

## Assumptions (ReadMe for submission)

1. Frontend is React + Vite; backend services for this phase are Supabase Auth + Postgres (SRS allows multiple stacks).
2. Existing UI visual design is intentionally preserved; only splash + smooth scroll were added as UI extras.
3. Catalog and dashboard tables remain sample/preview until feature wiring against migrations.
4. Manager role is an extension beyond the SRS admin/customer/farmer set.
5. Demo auth exists only when Supabase env vars are absent — not for production evaluation of live auth.
