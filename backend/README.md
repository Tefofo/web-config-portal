# Configuration Platform — Backend

NestJS 11 + Prisma 6 + PostgreSQL REST API for the multi-tenant Configuration
Management SaaS.

## Prerequisites

- Node.js >= 22.22.3
- PostgreSQL 16 (via the repo's `docker-compose.yml` or a local instance)

## Setup

```bash
cp .env.example .env      # edit secrets for non-local use
npm install
npx prisma generate
npx prisma migrate dev    # apply schema to the database
npm run seed              # demo data (development only)
```

## Commands

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run start:dev`     | Watch-mode dev server (port 3000)    |
| `npm run build`         | Compile to `dist/`                   |
| `npm run start:prod`    | Run the compiled server              |
| `npm test`              | Unit tests (Jest)                    |
| `npm run lint`          | Lint (ESLint)                        |
| `npm run seed`          | Seed demo data                       |
| `npx prisma migrate dev`| Create/apply a dev migration         |
| `npx prisma migrate deploy` | Apply migrations in production   |
| `npx prisma studio`     | Browse the database                  |

## API

- Base path: `/api/v1`
- Swagger UI (non-production): `http://localhost:3000/api/docs`
- Health: `GET /api/v1/health` (includes a database connectivity check)

### Endpoint groups

`auth`, `configurations`, `environments`, `applications` (+ nested
`api-keys`), `runtime` (API-key authenticated), `users`, `roles`,
`audit-logs`, `subscriptions`, `dashboard`, `health`.

### Runtime configuration API

Customer applications read their configuration with an application API key:

```bash
curl -H "Authorization: Bearer <APPLICATION_API_KEY>" \
  http://localhost:3000/api/v1/runtime/config
```

Returns only the active configurations for the tenant + environment tied to the
key.

## Architecture notes

- **Modules:** auth, tenants (via users/tenant context), users, roles,
  configurations, environments, applications, api-keys, audit, subscriptions,
  usage, dashboard, health.
- **Tenant isolation:** every tenant-owned query filters by `tenantId`
  (`findFirst({ where: { id, tenantId } })`), never by id alone. Requests for
  another tenant's resource return `404`.
- **Auth:** global `JwtAuthGuard` (opt out with `@Public()`), `RolesGuard`
  (`@Roles(...)`), and `ThrottlerGuard`. API keys use a separate `ApiKeyGuard`.
- **Secrets:** loaded from environment variables (`src/config/configuration.ts`).
  Never commit `.env`.

## Environment variables

See `.env.example`. Key ones: `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `FRONTEND_URL` (CORS), `SEED_DEMO_PASSWORD`.

## Tests

Unit tests cover authentication, tenant isolation (cross-tenant access returns
404), subscription limit enforcement, and API-key security (revoked/expired
keys rejected, only hashes stored). Run `npm test`.
