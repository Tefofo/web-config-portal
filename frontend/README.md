# Configuration Management Portal

A responsive, enterprise-style Angular frontend for managing application/system
configuration values, environments, applications, API keys, users, roles, audit
history, and subscription usage. It runs against an in-memory **mock API** out
of the box, and switches to the real NestJS backend with a single flag.

## Mock vs. real backend

`src/environments/environment.ts` controls the data source:

- `useMockApi: true` (default) — the in-memory mock interceptor serves all
  `/api/*` calls. No backend needed.
- `useMockApi: false` — real HTTP requests go to `apiUrl`
  (`http://localhost:3000/api/v1`). Start the backend first (see the root
  `README.md`). Auth uses the backend's `{ accessToken, refreshToken, user }`
  response and the token-refresh flow.

Backend role codes (`ADMIN`, `PLATFORM_ADMIN`) are normalized to the frontend's
`RoleCode` for permission lookups, so RBAC works against either data source.

---

## Technology stack

- **Angular 22** (standalone components, signals, new control flow)
- **TypeScript** (strict mode + strict templates)
- **Angular Material** (Material 3 theming)
- **SCSS**
- **Angular Reactive Forms**, **Router**, **HttpClient**, **RxJS**
- **ESLint** (angular-eslint)
- **Vitest** unit testing (Angular CLI default runner)

## Prerequisites

- **Node.js >= 22.22.3** (or 24.15+). The repo pins a version in `.nvmrc`:
  ```bash
  nvm use
  ```
- **npm** (bundled with Node).

### Package registry

This project uses the **public npm registry**. A project-local `.npmrc` pins:

```
registry=https://registry.npmjs.org/
strict-ssl=true
```

This overrides any user/global registry so all dependencies come from public npm.

## Installation

```bash
nvm use          # switch to the pinned Node version
npm install      # installs from the public registry
```

## Development commands

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm start`         | Run the dev server at http://localhost:4200/ |
| `npm run build`     | Production build to `dist/`                  |
| `npm test`          | Run unit tests (Vitest)                      |
| `npm run lint`      | Lint TypeScript and templates                |

Run tests once (no watch):

```bash
npm test -- --watch=false
```

## Authentication (mock)

Mock authentication accepts the seeded demo accounts with the shared password
**`password123`**:

| Email                | Role                  | Access                          |
| -------------------- | --------------------- | ------------------------------- |
| `admin@portal.dev`   | Administrator         | Full access                     |
| `manager@portal.dev` | Configuration Manager | Configurations + read-only ops  |
| `viewer@portal.dev`  | Viewer                | Read-only                       |

Sessions store a token and the (non-sensitive) user profile in `localStorage`
(when "Remember me" is checked) or `sessionStorage` otherwise. Passwords are
never stored client-side.

## Mock API usage

- A development-only HTTP interceptor (`core/mock/mock-backend.interceptor.ts`)
  intercepts all `/api/*` calls and serves data from an in-memory store
  (`core/mock/mock-store.ts`), seeded from `core/mock/mock-data.ts`.
- It supports full CRUD, enable/disable/duplicate, filtering, sorting, and
  pagination, with simulated latency.
- Seed data includes 16 configurations, 4 environments, 8 users, all 3 roles,
  and 20+ audit events.
- The mock is toggled by `useMockApi` in `src/environments/environment.ts`.
  State resets on a full page reload.

## API integration

To connect a real backend:

1. Set `useMockApi: false` in `src/environments/environment.ts` (and
   `environment.production.ts`).
2. Point `apiUrl` at your API base (e.g. `https://api.example.com`).
3. Remove `mockBackendInterceptor` from the interceptor list in
   `src/app/app.config.ts` (optional once `useMockApi` is false — it no-ops).

The feature services in `core/services/` already target REST endpoints:

```
POST   /api/auth/login            GET    /api/configurations
POST   /api/auth/logout           POST   /api/configurations
GET    /api/configurations/:id    PUT    /api/configurations/:id
DELETE /api/configurations/:id    POST   /api/configurations/:id/duplicate
POST   /api/configurations/:id/enable   POST /api/configurations/:id/disable
GET/POST/PUT/DELETE /api/environments
GET/POST/PUT /api/users           POST /api/users/:id/activate|deactivate
GET    /api/roles                 GET  /api/audit-logs
GET/PUT /api/settings
```

Components never call `HttpClient` directly — they go through services.

## Environment configuration

`src/environments/environment.ts` (development) and `environment.production.ts`
hold `production`, `apiUrl`, and `useMockApi`. The production build swaps files
via `fileReplacements` in `angular.json`. No URLs are hard-coded in services.

## Project structure

```
src/app/
├── core/            # auth, guards, interceptors, services, models, mock backend
├── shared/          # reusable components, dialogs, directives, pipes, services
├── layout/          # app shell, sidebar, topbar, breadcrumbs, navigation
└── features/        # dashboard, configuration, environments, users, roles,
                     # audit-log, settings, auth (login)
```

## Authorization model

Roles map to a set of `feature:action` permissions
(`core/models/role.model.ts`). Authorization is enforced in two places:

1. **Route guards** — `authGuard` and `permissionGuard(...)` protect routes.
2. **UI** — the `*appHasPermission` directive and `@if` checks hide controls.

> Frontend authorization is **not** a security boundary. A real backend must
> enforce all permissions independently.

## Accessibility

- Keyboard-navigable Material components, visible focus, ARIA labels on icon
  buttons and dialogs.
- Status is conveyed by icon + text + colour (never colour alone).
- Respects `prefers-reduced-motion`.

Full WCAG conformance requires manual testing with assistive technologies and
expert review; this project follows the principles above but has not been
formally audited.

## Testing

Unit tests cover authentication, the configuration service, route/permission
guards, the HTTP error interceptor, configuration form validation (including
duplicate-key rejection), the confirmation dialog, and the value pipe. Run:

```bash
npm test -- --watch=false
```
