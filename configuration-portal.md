# Angular Configuration Management Portal

## 1. Project Overview

Build a modern, responsive web-based Configuration Management Portal using Angular.

The portal will allow authenticated users to manage application/system configuration values, users, roles, environments, and audit history through a centralized administrative interface.

The application should be designed as a production-ready frontend with a clean architecture that can integrate with a REST API backend.

---

## 2. Technology Stack

Use the following technologies:

- Angular - latest stable version
- TypeScript
- Angular Material
- SCSS
- Angular Reactive Forms
- Angular Router
- Angular HttpClient
- RxJS
- ESLint
- Unit testing framework supported by the selected Angular version

Use Angular standalone components.

Use strict TypeScript configuration.

Use lazy-loaded feature routes where appropriate.

---

## 3. Primary Goals

The application must provide:

1. Secure user authentication
2. Role-based authorization
3. Configuration management
4. Environment management
5. User management
6. Role and permission management
7. Audit logging
8. System settings
9. Dashboard and reporting
10. Search, filtering, sorting, and pagination
11. Responsive UI
12. Consistent error handling
13. Form validation
14. Loading and empty states
15. Mock API support for development

---

## 4. User Roles

### Administrator
Full access. Permissions: view dashboard, view/create/edit/delete/enable-disable configurations, manage environments, manage users, manage roles, view audit logs, manage system settings.

### Configuration Manager
Permissions: view dashboard, view/create/edit/enable-disable configurations, view environments, view audit logs. Cannot: delete users, manage roles, change system-level settings.

### Viewer
Read-only: view dashboard, configurations, environments, audit logs. Cannot modify data.

---

## 5-6. Layout & Navigation
Reusable app shell: left sidebar (collapsible; mobile drawer), top bar, logo/name, user profile menu, logout, breadcrumbs, main content area, responsive mobile nav.
Navigation: Dashboard, Configuration (All Configurations, Environments), Users, Roles & Permissions, Audit Log, System Settings. Hide items by permission.

---

## 7. Authentication
Login page (email, password, remember me) with validation, invalid-credentials state, loading state, error message, password visibility toggle.
Provide: AuthService, AuthGuard, RoleGuard, AuthInterceptor. Redirect unauthenticated users to /login; on success go to /dashboard. Logout clears session. Use mock auth, structured for real backend.

---

## 8. Dashboard
Summary cards: Total/Active/Disabled Configurations, Environments, Users, Recent Changes. Recent Configuration Changes table (Configuration, Environment, Changed By, Change Type, Date, Status). Recent activity/audit section. Mock data. Responsive.

---

## 9-19. Configuration Management
List page (/configuration) with title, description, create button, search, filters, table, pagination, loading/empty/error states.
Table columns: Name, Key, Category, Environment, Type, Value, Status, Owner, Last Updated, Actions (View, Edit, Duplicate, Enable/Disable, Delete) — permission-controlled.
Search/filters: free text, category, environment, status, type, owner; combinable; Clear Filters; live update.
Model: Configuration { id, name, key, description?, category, environmentId, type, value, defaultValue?, status, ownerId, createdAt, updatedAt, createdBy, updatedBy }. Enums: ConfigurationType (String, Number, Boolean, Select, Date, JSON), ConfigurationStatus (Active, Disabled), EnvironmentType.
Create form (Reactive Forms) with validation (required, key format, duplicate key, type-based value validation).
Dynamic value input by type (text/number/toggle/dropdown/date picker/JSON editor) — reusable, single form.
Edit: modify name/description/category/value/defaultValue/owner/status; key & environment immutable; unsaved-changes guard.
View: full details + Edit/Duplicate/Enable-Disable/Delete (permission-controlled).
Delete: confirmation dialog, feedback.
Enable/Disable: confirmation dialog, status update.
Duplicate: copy props, new ID, unique key, editable before save.

---

## 20. Environments
Feature for Development/Testing/Staging/Production. Model: Environment { id, name, code, description?, status: ACTIVE|INACTIVE, createdAt, updatedAt }. Table: Name, Code, Description, Status, Configuration Count, Actions.

---

## 21-22. Users
/users page: Name, Email, Role, Status, Last Login, Created Date, Actions (View, Edit, Activate, Deactivate). Only admins modify. Form: First/Last Name, Email, Role, Status; validate required, email format, unique email, valid role. No passwords in admin screens.

---

## 23. Roles & Permissions
Role page: Role, Description, #permissions, #users, Status, Actions. Permission matrix (Feature x View/Create/Edit/Delete). Enforce in UI AND route guards. Never rely only on hiding UI.

---

## 24. Audit Log
/audit-log: Timestamp, User, Action, Entity, Entity ID, Environment, Description, Result. Actions: CREATE, UPDATE, DELETE, ENABLE, DISABLE, LOGIN, LOGOUT. Filters: date range, user, action, entity, environment. Pagination.

---

## 25. System Settings
Application name, default environment, session timeout, date/time format, default page size, enable audit logging, enable notifications. Admin-only edit.

---

## 26-28. API Architecture & Mock Backend
Service layer: AuthService, ConfigurationService, EnvironmentService, UserService, RoleService, AuditService, SettingsService. Use HttpClient; typed models; no HttpClient in components. REST endpoints per spec. No hard-coded URLs — use environment config.
Mock: interceptor/services returning realistic data; app works without backend. >=15 configurations, >=4 environments, >=8 users, all roles, >=20 audit events. Replaceable mock layer.

---

## 29-33. Cross-cutting UI
Centralized HTTP error handling (400/401/403/404/409/422/500/network) with friendly messages, no stack traces.
Loading states (initial/refresh/save/delete), prevent duplicate submissions.
Reusable empty-state components with action button.
Notification service (snackbar): success/error/warning/info.
Reusable confirmation dialog: title, message, confirm/cancel, loading, danger mode.

---

## 34-36. Design, Responsive, Accessibility
Angular Material, clean enterprise UI, status chips (ACTIVE/DISABLED/PENDING/ERROR), semantic colors, not color-only.
Responsive: desktop/laptop/tablet/mobile; tables to cards on mobile; sidebar to drawer; stacked forms.
WCAG: keyboard nav, labels, ARIA, focus indicators, contrast, accessible dialogs, screen-reader status.

---

## 37. Routing
/login, /dashboard, /configuration, /configuration/new, /configuration/:id, /configuration/:id/edit, /environments, /users, /users/new, /users/:id, /users/:id/edit, /roles, /audit-log, /settings. Guards + lazy loading.

---

## 38. Project Structure
src/app/{core/{auth,guards,interceptors,services,models}, shared/{components,dialogs,directives,pipes,utils}, layout/{shell,sidebar,topbar,breadcrumbs}, features/{dashboard,configuration,environments,users,roles,audit-log,settings}, app.component.ts, app.routes.ts}, assets/, environments/, styles.scss.

---

## 39. State Management
No large state library unless justified. Prefer Signals, RxJS, injectable services. Signals for UI state; server state in services; avoid unnecessary global state.

---

## 40. Security
No passwords in localStorage; no secrets in source; no hard-coded credentials; validate input; don't trust frontend authz; handle expired sessions; centralize 401 handling; avoid unsafe HTML; sanitize dynamic content. Backend enforces all permissions.

---

## 41. Testing
Unit tests: auth/config/user/role services, guards, HTTP interceptor, config form, config list, dashboard, permission handling, confirmation dialog. Scenarios: login works, invalid login rejected, unauthenticated blocked, viewer cannot edit, config manager can edit, admin manages users, config validation, duplicate keys rejected, delete confirmation, HTTP errors handled.

---

## 42-44. Performance, Code Quality, Env Config
Lazy routes, avoid leaks, async pipe, signals, trackBy, avoid redundant calls, debounce search, paginate, minimize CD.
Strong typing, small reusable components, SRP, clear names, no dup logic, no magic strings, avoid any, logic in services, typed API contracts.
Environments: development & production; environment.apiUrl; no hard-coded URLs.

---

## 45-46. Documentation & Commands
README: overview, stack, prerequisites, install, dev/build/test/lint commands, structure, env config, auth, mock API usage, API integration.
Commands: npm install, npm start, npm run build, npm test, npm run lint (or Angular CLI equivalents).

---

## 47. Implementation Strategy (Phases)
1: setup, Material, routing, shell, auth (mock).
2: dashboard, config list/details/create/edit.
3: environments, users, roles & permissions.
4: audit log, settings, notifications, confirmation dialogs.
5: testing, accessibility, responsive, performance, error handling, docs.

---

## 48-51. Acceptance / Rules / Deliverable
App starts; mock login works; protected routes; RBAC; dashboard data; full config CRUD + duplicate + enable/disable + delete-with-confirm; search/filters/pagination; environments; users (admin); roles/permissions; audit log filterable; settings (admin); loading/empty/error states; responsive; accessible; unit tests; builds clean; lint passes; README.
Rules: standalone components, TS strict, Material, Reactive Forms, small components, API in services, typed responses, avoid any, route guards, real authz not just hidden buttons, mock data replaceable, handle all states, responsive, a11y, tests, no unnecessary deps, document extras, REST-ready.
