# Local setup

1. Install Node.js 22 or newer and enable Corepack.
2. Run `corepack pnpm install` in the repository root.
3. Copy `.env.example` to `.env`; never commit `.env`.
4. Install and start Docker Desktop, then run `docker compose up -d`.
5. Start the API, web, and admin applications using the scripts in `README.md`.

The Prisma schema and database migration commands are added in Phase 2, when the data model is implemented.
