# Contributing

Thanks for working on the Configuration Platform. This guide covers local setup,
the branching workflow, and conventions so the codebase stays maintainable as
the team grows.

## Prerequisites

- **Node.js >= 22.22.3** (the repo targets 22.23.3). Using `nvm`:
  ```bash
  nvm install 22.23.3 && nvm use 22.23.3
  ```
- **Docker Desktop** (for the local PostgreSQL database).
- All packages install from the **public npm registry** — the project-local
  `.npmrc` files handle this; don't change the registry.

## Repository layout (monorepo)

```
backend/        NestJS 11 + Prisma + PostgreSQL API
frontend/       Angular 22 admin portal (Angular Material)
site-renderer/  Angular 22 + Tailwind public website renderer
docs/           Documentation
```

We intentionally keep all three apps in **one repo**: they share API/type
contracts (e.g. the site document shape), so a change stays in a single PR and
CI checks everything together.

## First-time setup

From the repo root:

```bash
npm run install:all       # installs backend + frontend + site-renderer
npm run db:up             # starts PostgreSQL in Docker
npm run db:migrate        # applies Prisma migrations
npm run db:seed           # loads demo data (Bread4Soul tenant)
```

Then run each app (in separate terminals):

```bash
npm run dev:backend       # API on http://localhost:3000  (Swagger: /api/docs)
npm run dev:frontend      # portal on http://localhost:4200
npm run dev:renderer      # public sites on http://localhost:4300
```

Demo logins (password `Password123!`): `admin@example.local`,
`manager@example.local`, `viewer@example.local`.

## Branching workflow

- **`develop`** is the integration branch. **All work is merged into `develop`
  via pull request.** It is the default branch.
- **`main`** is the production branch. It only receives changes from `develop`,
  via a PR that the repository owner approves.

```
feature branch  ──PR──▶  develop  ──PR (owner approves)──▶  main (prod)
```

Day-to-day:

```bash
git checkout develop && git pull
git checkout -b feat/short-description      # or fix/…, chore/…
# ...make changes...
git push -u origin feat/short-description
# open a PR into develop
```

- Branch names: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Commit messages: short imperative summary, e.g. `feat: add gallery reordering`.
- **Do not push directly to `develop` or `main`.** Use PRs.
- CI (build + lint + test for all three apps) must pass before merge.

## Before you open a PR

Run the checks locally:

```bash
npm run lint:all
npm run test:all
npm run build:all
```

## Conventions

- **TypeScript strict**; do not use `any`.
- **Angular:** standalone components, signals, `inject()` (not constructor
  injection), and the new control flow (`@if`/`@for`).
- **Backend:** thin controllers, logic in services, DTO validation with
  `class-validator`. Every tenant-scoped query must be filtered by `tenantId`.
- **Authorization is enforced on the backend.** Frontend permission checks only
  shape the UI — keep `frontend` `ROLE_PERMISSIONS` in sync with the backend
  `@Roles(...)` guards.
- **Never commit secrets.** Use `.env` (gitignored); update `.env.example` when
  adding config.

## Security-sensitive areas (review carefully)

- Tenant isolation (cross-tenant access must return 404).
- API key handling (store hashes only; raw key shown once).
- Auth guards and role checks.
