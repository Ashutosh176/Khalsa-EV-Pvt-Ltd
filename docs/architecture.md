# Architecture

The customer storefront and admin portal are separate Next.js applications. Both communicate only with the NestJS REST API. The API is the system of record gateway to PostgreSQL and owns authorization, inventory, pricing, order, payment, and webhook logic. Redis is used only for cache/rate-limit/session-adjacent needs; PostgreSQL remains authoritative.
