# Khalsa EV

Production-oriented e-commerce platform for EV spare parts, built as a pnpm monorepo.

## Applications

- `apps/web` - customer storefront, port 3000
- `apps/admin` - protected admin portal, port 3001
- `apps/api` - NestJS REST API, port 4000

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

See `docs/setup.md` for the Phase 1 setup guide.
