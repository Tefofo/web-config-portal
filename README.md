# Configuration Management SaaS Platform

A multi-tenant SaaS platform where each customer (tenant) logs into a portal to
**configure and publish their own marketing website** from a shared template,
alongside full configuration management: JWT auth, role-based access control,
tenant isolation, application API keys with a runtime configuration API, audit
logging, and subscription usage limits.

This is a monorepo with three independently buildable apps:

```
configuration-platform/
├── frontend/        # Angular 22 admin portal (Material) — manage config + edit your website
├── backend/         # NestJS 11 + Prisma + PostgreSQL API
├── site-renderer/   # Angular 22 + Tailwind public site renderer — displays each tenant's website
├── docs/
├── docker/
├── docker-compose.yml
└── README.md
```

## The website builder (marketing-v1 template)

A tenant customises their site's **content + branding** in the portal
(`Website` section): branding (name, logo, colours, font), a hero, about,
events (with a live countdown), a gallery, contact/social links, and per-section
show/hide toggles. They **publish**, and the public site renderer displays it at
`/site/<tenant-slug>` styled by their branding. One template, many tenants — no
per-customer codebase.

- Editor: portal → **Website** (`/website`)
- Rendered site: `http://localhost:4300/site/<slug>` (e.g. `/site/demo-co` for the seeded Bread4Soul demo)
- Public API the renderer reads: `GET /api/v1/public/sites/:slug` (only published sites)

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

### 3. Frontend (admin portal)

```bash
cd frontend
npm install
# To use the real backend instead of the in-memory mock, set
# useMockApi: false in src/environments/environment.ts
npm start                     # portal on http://localhost:4200
```

### 4. Site renderer (public websites)

```bash
cd site-renderer
npm install
npm start -- --port 4300      # renderer on http://localhost:4300
```

Then open `http://localhost:4300/site/demo-co` to see the seeded Bread4Soul
site. Edit it in the portal under **Website**, publish, and refresh the renderer
to see changes.

> The backend allows browser requests from both the portal and renderer origins
> via a comma-separated `FRONTEND_URL` in `backend/.env`
> (`http://localhost:4200,http://localhost:4300`).

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
Admin Portal (Angular)   ──auth'd REST──▶
                                          NestJS API ──Prisma──▶ PostgreSQL
Site Renderer (Angular)  ──public REST──▶
```

- The Angular apps never talk to PostgreSQL directly.
- The portal uses authenticated, tenant-scoped endpoints. The renderer uses only
  the public `GET /public/sites/:slug` endpoint (published sites of active tenants).
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
