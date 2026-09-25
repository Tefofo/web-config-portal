# Configuration Management SaaS Platform

A multi-tenant Configuration Management platform: an Angular web app, a NestJS
REST API, PostgreSQL via Prisma, JWT auth, role-based access control, tenant
isolation, application API keys with a runtime configuration API, audit logging,
and subscription usage limits.

This is a monorepo with an independently buildable **frontend** and **backend**.

```
configuration-platform/
├── frontend/        # Angular 22 web application
├── backend/         # NestJS 11 + Prisma + PostgreSQL API
├── docs/
├── docker/
├── docker-compose.yml
└── README.md
```

## Prerequisites

- **Node.js >= 22.22.3** (repo targets 22.23.3; use `nvm use` in `frontend/`).
- **npm** (bundled with Node).
- **PostgreSQL 16** — via Docker (compose file provided) or a local install.
- Everything installs from the **public npm registry** (project-local `.npmrc`
  files override any corporate/global registry).

> **Note on Docker:** the provided `docker-compose.yml` runs PostgreSQL for
> local development. If Docker isn't installed, install
> [Docker Desktop](https://www.docker.com/products/docker-desktop/) or point
> `DATABASE_URL` at any reachable PostgreSQL 16 instance.

## Quick start

### 1. Start the database

```bash
docker compose up -d          # starts PostgreSQL 16 on localhost:5432
```

(Or run your own PostgreSQL and update `backend/.env`'s `DATABASE_URL`.)

### 2. Backend

```bash
cd backend
cp .env.example .env          # then edit secrets for anything non-local
npm install
npx prisma generate
npx prisma migrate dev        # creates the schema (first run names the migration)
npm run seed                  # loads demo tenant, users, configs, etc.
npm run start:dev             # API on http://localhost:3000, docs at /api/docs
```

### 3. Frontend

```bash
cd frontend
npm install
# To use the real backend instead of the in-memory mock, set
# useMockApi: false in src/environments/environment.ts
npm start                     # app on http://localhost:4200
```

## Demo accounts

Seeded by `backend/prisma/seed.ts` (password from `SEED_DEMO_PASSWORD`,
default `Password123!`):

| Email                    | Role                  |
| ------------------------ | --------------------- |
| `platform@example.local` | Platform Admin        |
| `admin@example.local`    | Admin (tenant)        |
| `manager@example.local`  | Configuration Manager |
| `viewer@example.local`   | Viewer                |

The frontend also ships with its own mock accounts (`admin@portal.dev` etc.,
password `password123`) used when `useMockApi: true`.

## Architecture

```
Angular Web App  ──HTTPS/REST──▶  NestJS API  ──Prisma──▶  PostgreSQL
```

- The Angular app never talks to PostgreSQL directly.
- Every tenant-owned query is scoped by `tenantId`; the backend enforces tenant
  isolation and authorization. The frontend only shapes the UX.
- Application-to-application configuration access uses **API keys** (not user
  JWTs) via `GET /api/v1/runtime/config`.

See `frontend/README.md` and `backend/README.md` for details specific to each.

## Security highlights

- Passwords hashed with bcrypt; never stored or logged in plaintext.
- API keys stored as hashes; the raw key is shown exactly once at creation.
- JWT access + refresh tokens; secrets come from environment variables only.
- Helmet security headers, configurable CORS, rate limiting on auth endpoints.
- Consistent error responses (`{ statusCode, code, message }`) with no stack
  traces leaked to clients.

## Commercial model

Subscription plans (`STARTER`, `BUSINESS`, `ENTERPRISE`) define usage limits,
kept separate from business logic in `backend/src/subscriptions/plan-limits.ts`.
No prices are hard-coded. Billing is behind a `BillingService` abstraction so a
payment provider can be added later without touching subscription logic.

## What is not included (by design, MVP scope)

- Real payment processing (the upgrade flow returns a "contact sales" status).
- SSO/SAML/OAuth, webhooks, and other enterprise integrations — the schema and
  service boundaries leave room to add them later.
