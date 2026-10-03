# Khalsa EV

Production-oriented e-commerce platform for EV spare parts, built as a pnpm monorepo.

## Applications

- `apps/web` - customer storefront, port 3000 - **the one URL everyone uses**
- `apps/admin` - protected admin portal, runs on port 3001 but is served through the storefront at `/admin`
- `apps/api` - NestJS REST API, port 4000 (also proxied by the storefront at `/api`)

Customers and admins share a single address and a single login page (`/login`). Signing in with the
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` opens the admin panel; the API creates or updates that
account from `.env` on every start. All three dev servers must be running for `/admin` to load.

## Prerequisites

Node.js 22+, Corepack, pnpm 11+, and Docker Desktop for local PostgreSQL/Redis.

```powershell
corepack pnpm install
Copy-Item .env.example .env
docker compose up -d
corepack pnpm dev:api
corepack pnpm dev:web
corepack pnpm dev:admin
```

Open https://dev.khalsaev.local:3000 - one link for customers and admins. `dev:web` serves HTTPS
using the mkcert certificates in `apps/web/.certs` (needs `127.0.0.1 dev.khalsaev.local` in the
hosts file); `dev:web:http` is the plain-HTTP fallback.

See `docs/setup.md` for the Phase 1 setup guide.
