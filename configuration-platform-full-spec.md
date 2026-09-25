# Configuration Management SaaS Platform

## 1. Project Overview

Build a production-ready Configuration Management SaaS platform.

The platform consists of:

1. Angular web application
2. Node.js/NestJS REST API
3. PostgreSQL database
4. Prisma ORM
5. JWT-based authentication
6. Role-based access control
7. Multi-tenant architecture
8. Configuration management
9. Environment management
10. User management
11. Audit logging
12. Application/API key management
13. Subscription and usage-limit architecture
14. Mock/demo data for development

The platform should be designed so that a small technology company can use it to acquire customers, onboard multiple companies, charge recurring subscription fees, provide implementation services, and maintain the platform centrally.

The architecture must avoid creating a separate codebase for every customer.

---

# 2. Business Objective

The product should be designed as a SaaS product rather than a one-off application.

Multiple customer companies must be able to use the same platform while their data remains isolated.

Example:

Customer A:

```text
Customer A
├── Users
├── Applications
├── Environments
├── Configurations
└── Audit Logs
````

 Customer B:

```
Customer B
├── Users
├── Applications
├── Environments
├── Configurations
└── Audit Logs
```

 Customer A must never be able to access Customer B's data.

 The platform owner must be able to manage tenants and subscriptions.

---

 # 3\. Technology Stack

 ## Frontend

 Use:

 - Angular latest stable version
- TypeScript
- Angular Material
- SCSS
- Angular Reactive Forms
- Angular Router
- Angular HttpClient
- RxJS
- Angular Signals where appropriate

 Use standalone Angular components.

 Use strict TypeScript configuration.

---

 ## Backend

 Use:

 - Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt or equivalent password hashing
- class-validator
- class-transformer

 Use a modular NestJS architecture.

---

 ## Database

 Use PostgreSQL.

 Use Prisma for:

 - Schema management
- Migrations
- Database access
- Type-safe queries

---

 # 4\. High-Level Architecture

 Implement the following architecture:

```
                         INTERNET
                             |
                             | HTTPS
                             |
                    +-------------------+
                    |   Angular Web App |
                    +---------+---------+
                              |
                              | REST API
                              |
                    +---------v---------+
                    |   NestJS API      |
                    +-------------------+
                    | Authentication    |
                    | Authorization      |
                    | Tenants           |
                    | Users             |
                    | Roles             |
                    | Configurations    |
                    | Environments      |
                    | Applications      |
                    | API Keys          |
                    | Audit Logs        |
                    | Subscriptions     |
                    +---------+---------+
                              |
                              | Prisma
                              |
                    +---------v---------+
                    |    PostgreSQL     |
                    +-------------------+
```

 The Angular application must never communicate directly with PostgreSQL.

 Only the backend may communicate with the database.

---

 # 5\. Repository Structure

 Use a monorepo-style structure:

```
configuration-platform/
│
├── frontend/
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── README.md
│
├── docs/
│
├── docker/
│
├── docker-compose.yml
│
├── .gitignore
├── README.md
└── .env.example
```

 Keep frontend and backend independently buildable.

---

 # 6\. Multi-Tenant Architecture

 This is a critical requirement.

 The platform must support multiple customer organizations.

 Create a `Tenant` entity.

 Most tenant-owned database entities must contain:

```
tenantId
```

 Examples:

```
User
Environment
Configuration
Application
ApiKey
AuditLog
Subscription
```

 Every authenticated user must belong to exactly one tenant unless they are a platform administrator.

 The authenticated request context should contain:

```
{
  userId: string;
  tenantId: string;
  role: string;
}
```

 All tenant-owned database queries must be scoped by `tenantId`.

 Example:

```
await prisma.configuration.findMany({
  where: {
    tenantId: currentUser.tenantId
  }
});
```

 Never retrieve a record using only its ID when the record belongs to a tenant.

 Incorrect:

```
findUnique({
  where: {
    id
  }
});
```

 Preferred:

```
findFirst({
  where: {
    id,
    tenantId
  }
});
```

 The backend must prevent cross-tenant access.

---

 # 7\. Platform Administrator

 Create a platform-level administrator concept.

 Platform administrators manage the SaaS platform itself.

 They may:

 - View tenants
- Create tenants
- Disable tenants
- View tenant usage
- Manage subscriptions
- View platform audit logs
- View platform metrics
- Manage customer accounts
- Impersonate users only if explicitly implemented and heavily audited

 Tenant administrators must not automatically have platform administrator privileges.

---

 # 8\. Customer Roles

 Implement these roles.

 ## ADMIN

 Full access within the customer's tenant.

 Permissions:

 - Manage users
- Manage roles
- Manage configurations
- Manage environments
- Manage applications
- Manage API keys
- View audit logs
- Manage tenant settings

---

 ## CONFIGURATION\_MANAGER

 Permissions:

 - View configurations
- Create configurations
- Edit configurations
- Enable/disable configurations
- View environments
- View applications
- View audit logs

 Cannot:

 - Manage users
- Manage roles
- Manage subscription
- Delete the tenant

---

 ## VIEWER

 Read-only access.

 Permissions:

 - View dashboard
- View configurations
- View environments
- View applications
- View audit logs

 Cannot modify data.

---

 # 9\. Frontend Navigation

 Create:

```
Dashboard

Configuration
    All Configurations
    Create Configuration

Environments

Applications

Users

Roles & Permissions

Audit Log

Subscription

Settings
```

 Platform administrators should have a separate administration section:

```
Platform Administration
    Tenants
    Subscriptions
    Usage
    Platform Audit
```

 Hide navigation items according to permissions.

---

 # 10\. Authentication

 Create a login page.

 Fields:

 - Email
- Password
- Remember me

 Implement:

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/refresh
```

 Use JWT authentication.

 Implement:

 - AuthService
- AuthGuard
- RoleGuard
- JWT strategy
- Authentication interceptor
- Refresh token mechanism if appropriate

 Passwords must never be stored as plaintext.

 Use bcrypt or an equivalent password hashing algorithm.

---

 # 11\. Security

 Implement the following:

 - Password hashing
- JWT authentication
- Role-based authorization
- Tenant isolation
- Request validation
- HTTP security headers
- CORS configuration
- Rate limiting on authentication endpoints
- Secure error responses
- No passwords in logs
- No secrets in source code
- No secrets in frontend code
- Environment variables for secrets
- Audit logging for security-sensitive actions

 Never trust authorization decisions made by the frontend.

 The backend must enforce permissions.

---

 # 12\. Database Schema

 Create the following Prisma models.

 ## Tenant

```
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  status    TenantStatus @default(ACTIVE)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users          User[]
  environments   Environment[]
  configurations Configuration[]
  applications   Application[]
  apiKeys        ApiKey[]
  auditLogs      AuditLog[]
  subscriptions  Subscription[]
}
```

---

 # 13\. Tenant Status

 Create:

```
ACTIVE
SUSPENDED
INACTIVE
```

 A suspended tenant must not be able to use the application.

---

 # 14\. User Model

 Create:

```
model User {
  id           String     @id @default(cuid())
  tenantId     String
  email        String
  passwordHash String

  firstName String
  lastName  String

  role   UserRole
  status UserStatus @default(ACTIVE)

  lastLoginAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, email])
  @@index([tenantId])
}
```

---

 # 15\. User Roles

 Create:

```
PLATFORM_ADMIN
ADMIN
CONFIGURATION_MANAGER
VIEWER
```

---

 # 16\. User Status

 Create:

```
ACTIVE
INACTIVE
LOCKED
```

---

 # 17\. Environment

 Create:

```
model Environment {
  id          String   @id @default(cuid())
  tenantId    String

  name        String
  code        String
  description String?

  status EnvironmentStatus @default(ACTIVE)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])

  configurations Configuration[]
  applications   Application[]

  @@unique([tenantId, code])
  @@index([tenantId])
}
```

 Supported environment types:

```
DEVELOPMENT
TEST
STAGING
PRODUCTION
```

---

 # 18\. Configuration

 Create:

```
model Configuration {
  id            String @id @default(cuid())

  tenantId      String
  environmentId String

  name        String
  key         String
  description String?

  category String

  type ConfigurationType

  value        Json
  defaultValue Json?

  status ConfigurationStatus @default(ACTIVE)

  ownerId String?

  createdById String
  updatedById String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  environment Environment @relation(fields: [environmentId], references: [id])

  @@unique([tenantId, environmentId, key])
  @@index([tenantId])
  @@index([environmentId])
}
```

---

 # 19\. Configuration Types

 Support:

```
STRING
NUMBER
BOOLEAN
SELECT
DATE
JSON
```

---

 # 20\. Configuration Status

 Support:

```
ACTIVE
DISABLED
```

---

 # 21\. Configuration API

 Implement:

```
GET    /api/configurations
GET    /api/configurations/:id
POST   /api/configurations
PATCH  /api/configurations/:id
DELETE /api/configurations/:id

POST   /api/configurations/:id/enable
POST   /api/configurations/:id/disable
POST   /api/configurations/:id/duplicate
```

 Support:

 - Pagination
- Sorting
- Searching
- Filtering
- Environment filtering
- Status filtering
- Category filtering

 Example:

```
GET /api/configurations?page=1&limit=20&search=api&environment=production
```

---

 # 22\. Configuration Validation

 Validate:

 - Required fields
- Key format
- Configuration type
- Value type
- Environment
- Duplicate keys

 A configuration key must be unique within:

```
Tenant + Environment
```

 Example:

```
Customer A + Production + API_URL
```

 is different from:

```
Customer A + Development + API_URL
```

---

 # 23\. Configuration Form

 The Angular frontend must use Reactive Forms.

 Fields:

 - Name
- Key
- Description
- Category
- Environment
- Type
- Value
- Default Value
- Owner
- Status

 The value field must dynamically change based on configuration type.

---

 # 24\. Application Management

 Create an Application entity.

 An application represents a system that consumes configuration.

 Example:

```
Customer
    |
    +-- Payment API
    |
    +-- Customer Portal
    |
    +-- Mobile App
```

 Create:

```
model Application {
  id            String @id @default(cuid())
  tenantId      String
  environmentId String

  name        String
  code        String
  description String?

  status ApplicationStatus @default(ACTIVE)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  environment Environment @relation(fields: [environmentId], references: [id])

  apiKeys ApiKey[]

  @@unique([tenantId, code])
  @@index([tenantId])
}
```

---

 # 25\. Application API

 Implement:

```
GET    /api/applications
GET    /api/applications/:id
POST   /api/applications
PATCH  /api/applications/:id
DELETE /api/applications/:id
```

---

 # 26\. API Keys

 Applications need their own API credentials.

 Do NOT use normal user JWT tokens for application-to-application configuration access.

 Create:

```
model ApiKey {
  id            String @id @default(cuid())

  tenantId      String
  applicationId String

  name String

  keyHash String

  lastUsedAt DateTime?

  expiresAt DateTime?

  revokedAt DateTime?

  createdAt DateTime @default(now())

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  application Application @relation(fields: [applicationId], references: [id])

  @@index([tenantId])
  @@index([applicationId])
}
```

 Store only a hash of the API key.

 Never store the raw API key after creation.

 Display the full key only once.

---

 # 27\. Runtime Configuration API

 Implement an API for customer applications to retrieve configuration.

 Example:

```
GET /api/runtime/config
```

 Authentication:

```
Authorization: Bearer <APPLICATION_API_KEY>
```

 The API key must identify:

 - Tenant
- Application
- Environment

 Return only configuration data the application is authorized to access.

 Example response:

```
{
  "environment": "production",
  "application": "customer-portal",
  "configurations": {
    "API_URL": "https://api.example.com",
    "FEATURE_X_ENABLED": true,
    "MAX_RETRIES": 5
  }
}
```

---

 # 28\. API Key Management

 Support:

```
Create API key
Revoke API key
View API key metadata
Set expiration date
View last-used timestamp
```

 Never display a previously generated raw API key.

---

 # 29\. Audit Logging

 Create:

```
model AuditLog {
  id String @id @default(cuid())

  tenantId String
  userId   String?

  action String

  entity   String
  entityId String?

  description String?

  metadata Json?

  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@index([userId])
  @@index([createdAt])
}
```

 Log important events:

```
LOGIN
LOGOUT
CREATE
UPDATE
DELETE
ENABLE
DISABLE
API_KEY_CREATED
API_KEY_REVOKED
USER_CREATED
USER_UPDATED
USER_DISABLED
ROLE_CHANGED
SUBSCRIPTION_CHANGED
```

 Do not store passwords or secrets in audit metadata.

---

 # 30\. Audit API

 Implement:

```
GET /api/audit-logs
GET /api/audit-logs/:id
```

 Support:

 - Pagination
- Date filtering
- User filtering
- Action filtering
- Entity filtering
- Environment filtering

---

 # 31\. Dashboard

 Create an Angular dashboard displaying:

 - Total configurations
- Active configurations
- Disabled configurations
- Total environments
- Total applications
- Total users
- Recent changes
- Recent audit events

 Use API data.

 Do not hard-code dashboard statistics.

---

 # 32\. User Management

 Implement:

```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
POST   /api/users/:id/activate
POST   /api/users/:id/deactivate
```

 Only authorized administrators may manage users.

---

 # 33\. Environment Management

 Implement:

```
GET    /api/environments
GET    /api/environments/:id
POST   /api/environments
PATCH  /api/environments/:id
DELETE /api/environments/:id
```

 Prevent deletion of environments containing active configurations unless explicitly confirmed and handled.

---

 # 34\. Subscription Architecture

 The platform must support subscriptions.

 Create:

```
model Subscription {
  id       String @id @default(cuid())
  tenantId String

  plan   SubscriptionPlan
  status SubscriptionStatus

  userLimit          Int
  environmentLimit   Int
  applicationLimit   Int
  configurationLimit Int

  startDate DateTime
  endDate   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
}
```

---

 # 35\. Subscription Plans

 Initially support:

```
STARTER
BUSINESS
ENTERPRISE
```

 Do not hard-code prices into business logic.

 Store plan limits separately from subscription logic.

 Example:

```
STARTER
users: 5
environments: 3
applications: 2
configurations: 500

BUSINESS
users: 25
environments: 10
applications: 10
configurations: 5000

ENTERPRISE
users: unlimited
environments: unlimited
applications: unlimited
configurations: unlimited
```

 Use appropriate nullable values or a separate plan configuration table for unlimited values.

---

 # 36\. Usage Limits

 Before creating:

 - User
- Environment
- Application
- Configuration

 check the tenant's subscription limits.

 Example:

```
if (usage >= subscription.userLimit) {
  throw new ForbiddenException(
    'Subscription user limit reached.'
  );
}
```

 Return a clear API error when limits are exceeded.

---

 # 37\. Usage Dashboard

 Create a subscription/usage page.

 Display:

```
Users
8 / 25

Environments
4 / 10

Applications
5 / 10

Configurations
850 / 5000
```

 Use progress indicators.

 Warn users when usage reaches approximately 80% of the allowed limit.

---

 # 38\. Billing Architecture

 Do not implement real payment processing in the first MVP unless explicitly requested.

 However, design the application so a payment provider can be integrated later.

 Create a service abstraction:

```
BillingService
```

 Possible future integration:

```
Payment Provider
       |
       v
BillingService
       |
       v
Subscription
```

 Do not couple business logic directly to a specific payment provider.

---

 # 39\. Commercial Model

 The software should support:

 1. Monthly subscription
2. Annual subscription
3. Initial implementation/setup fee
4. Custom integration fees
5. Managed support
6. Custom development
7. Enterprise plans

 The software itself should not contain hard-coded commercial pricing.

---

 # 40\. Frontend Subscription Page

 Create a subscription page displaying:

 - Current plan
- Subscription status
- Usage
- Limits
- Renewal date
- Upgrade option
- Contact/support option

 For the initial MVP, the upgrade button can display a placeholder/contact workflow.

---

 # 41\. Backend Modules

 Create NestJS modules:

```
AuthModule
UsersModule
TenantsModule
RolesModule
ConfigurationsModule
EnvironmentsModule
ApplicationsModule
ApiKeysModule
AuditModule
SubscriptionsModule
UsageModule
DashboardModule
```

 Use separate controllers, services, DTOs, and modules.

---

 # 42\. Backend Folder Structure

 Use:

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── guards/
│   │   ├── strategies/
│   │   └── dto/
│   │
│   ├── tenants/
│   ├── users/
│   ├── roles/
│   ├── configurations/
│   ├── environments/
│   ├── applications/
│   ├── api-keys/
│   ├── audit/
│   ├── subscriptions/
│   ├── usage/
│   ├── dashboard/
│   │
│   ├── database/
│   │   ├── prisma.service.ts
│   │   └── database.module.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   └── types/
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── .env.example
└── package.json
```

---

 # 43\. Angular Folder Structure

 Use:

```
frontend/
└── src/
    └── app/
        ├── core/
        │   ├── auth/
        │   ├── guards/
        │   ├── interceptors/
        │   ├── services/
        │   └── models/
        │
        ├── shared/
        │   ├── components/
        │   ├── dialogs/
        │   ├── forms/
        │   └── utilities/
        │
        ├── layout/
        │   ├── shell/
        │   ├── sidebar/
        │   ├── topbar/
        │   └── breadcrumbs/
        │
        └── features/
            ├── dashboard/
            ├── configurations/
            ├── environments/
            ├── applications/
            ├── users/
            ├── roles/
            ├── audit/
            ├── subscriptions/
            └── settings/
```

---

 # 44\. API Client

 The Angular application must communicate with the backend using typed services.

 Examples:

```
AuthService
ConfigurationService
EnvironmentService
ApplicationService
ApiKeyService
UserService
AuditService
SubscriptionService
DashboardService
```

 Do not call HttpClient directly from components.

---

 # 45\. API URL

 Use environment configuration.

 Example:

```
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

 Production:

```
https://api.yourcompany.com/api
```

 Never hard-code API URLs in components or services.

---

 # 46\. Frontend Authentication

 Store authentication securely.

 Do not store sensitive information unnecessarily in localStorage.

 Use a secure authentication architecture.

 Handle:

 - Login
- Logout
- Session expiry
- 401 responses
- 403 responses
- Token refresh if implemented

---

 # 47\. Error Handling

 Backend must return consistent errors.

 Example:

```
{
  "statusCode": 403,
  "code": "SUBSCRIPTION_LIMIT_REACHED",
  "message": "Your subscription has reached its user limit."
}
```

 Angular should display user-friendly messages.

 Do not expose stack traces.

---

 # 48\. Validation

 Use DTO validation in NestJS.

 Enable:

```
new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true
})
```

 Validate all API inputs.

 Never rely only on frontend validation.

---

 # 49\. CORS

 Configure CORS using environment variables.

 Example:

```
FRONTEND_URL=http://localhost:4200
```

 Do not use unrestricted CORS in production.

---

 # 50\. Configuration Secrets

 Never place:

 - Database passwords
- JWT secrets
- API secrets
- Payment provider secrets
- Private credentials

 in source code.

 Use environment variables.

 Provide:

```
.env.example
```

 but never commit the real `.env`.

---

 # 51\. Database Migrations

 Use Prisma migrations.

 Development:

```
npx prisma migrate dev
```

 Production:

```
npx prisma migrate deploy
```

 Never modify the production database schema manually.

---

 # 52\. Database Seed

 Create:

```
prisma/seed.ts
```

 Seed:

 - One demo tenant
- One administrator
- One configuration manager
- One viewer
- Development environment
- Testing environment
- Staging environment
- Production environment
- Sample configurations
- Sample applications
- Sample audit logs
- Starter subscription

 Use fictional data only.

 Never seed real passwords or secrets.

---

 # 53\. Docker Development

 Create a Docker Compose environment for local development.

 Example:

```
services:

  postgres:
    image: postgres:16
    container_name: configuration-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: configuration_portal
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

 The backend can run locally while PostgreSQL runs in Docker.

---

 # 54\. Backend Commands

 Provide:

```
npm install
npm run start:dev
npm run build
npm run start:prod
npm test
npm run test:e2e
npm run lint
```

 Prisma:

```
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
```

---

 # 55\. Frontend Commands

 Provide:

```
npm install
npm start
npm run build
npm test
npm run lint
```

 Use Angular CLI conventions where appropriate.

---

 # 56\. API Documentation

 Add Swagger/OpenAPI documentation to NestJS.

 Expose documentation during development at:

```
/api/docs
```

 Document:

 - Authentication
- Configurations
- Environments
- Applications
- API keys
- Users
- Audit logs
- Subscriptions

 Document request and response DTOs.

---

 # 57\. API Versioning

 Use API versioning.

 Preferred structure:

```
/api/v1/auth
/api/v1/configurations
/api/v1/users
/api/v1/environments
```

 Keep the architecture ready for future versions.

---

 # 58\. Pagination

 All potentially large collections must support pagination.

 Example:

```
GET /api/v1/configurations?page=1&limit=25
```

 Response:

```
{
  "data": [],
  "page": 1,
  "limit": 25,
  "total": 150,
  "totalPages": 6
}
```

---

 # 59\. Search

 Implement backend search rather than downloading all records to the browser.

 Example:

```
GET /api/v1/configurations?search=payment
```

 Search:

 - Name
- Key
- Description
- Category

---

 # 60\. Frontend UI

 Use Angular Material.

 Create:

 - Responsive sidebar
- Top navigation
- Breadcrumbs
- Cards
- Tables
- Forms
- Dialogs
- Snackbar notifications
- Loading indicators
- Empty states
- Error states
- Status chips

 The design should look like a professional enterprise SaaS product.

---

 # 61\. Responsive Design

 Support:

 - Desktop
- Laptop
- Tablet
- Mobile

 On mobile:

 - Sidebar becomes drawer
- Forms stack vertically
- Tables adapt or scroll
- Actions remain accessible

---

 # 62\. Accessibility

 Follow WCAG principles.

 Implement:

 - Keyboard navigation
- Accessible labels
- Focus states
- ARIA attributes where appropriate
- Accessible dialogs
- Color contrast
- Screen-reader-friendly messages

 Do not communicate status using color alone.

---

 # 63\. Testing

 Create backend tests for:

 - Authentication
- Authorization
- Tenant isolation
- Configuration CRUD
- Environment CRUD
- User management
- API key creation
- API key revocation
- Runtime configuration API
- Subscription limits
- Audit logging

 Create frontend tests for:

 - Login
- Route guards
- Configuration form
- Configuration list
- Configuration editing
- Permission handling
- Dashboard
- Subscription usage

---

 # 64\. Critical Security Tests

 Explicitly test:

 ## Cross-Tenant Access

 Create:

```
Tenant A
Tenant B
```

 Create configuration:

```
Tenant A -> Configuration A
Tenant B -> Configuration B
```

 Attempt to access Configuration B using Tenant A credentials.

 The API must return:

```
404 Not Found
```

 or an appropriate authorization response.

 Do not reveal whether another tenant's resource exists.

---

 # 65\. API Key Security Tests

 Verify:

 - API key is generated securely
- Only hash is stored
- Raw key is shown once
- Revoked keys cannot authenticate
- Expired keys cannot authenticate
- API keys cannot access another tenant
- API keys are restricted to their application/environment

---

 # 66\. Audit Requirements

 Every important mutation must generate an audit record.

 Example:

```
User:
admin@customer.com

Action:
UPDATE

Entity:
Configuration

Entity ID:
abc123

Description:
Updated API timeout

Timestamp:
2026-09-25T12:00:00Z
```

---

 # 67\. Observability

 Prepare the application for:

 - Structured logging
- Health checks
- Error monitoring
- Database monitoring
- API response monitoring

 Implement:

```
GET /api/v1/health
```

 Response:

```
{
  "status": "ok"
}
```

 If possible, also check database connectivity.

---

 # 68\. Production Readiness

 The backend must:

 - Run without development-only features
- Use production environment variables
- Use secure CORS
- Use secure headers
- Use database migrations
- Handle errors consistently
- Log important events
- Support health checks
- Avoid exposing secrets
- Avoid exposing stack traces

---

 # 69\. Deployment Architecture

 Design for:

```
                    Internet
                       |
                       v
                 Reverse Proxy
                       |
             +---------+---------+
             |                   |
             v                   v
        Angular App          NestJS API
                                  |
                                  v
                            PostgreSQL
```

 The frontend and backend should be independently deployable.

---

 # 70\. Backup Strategy

 Design the platform so PostgreSQL can be backed up.

 The application itself must not assume that database backups are implemented in application code.

 Document:

 - Backup frequency
- Retention
- Restoration procedure
- Disaster recovery considerations

 These should be configurable based on deployment environment.

---

 # 71\. Customer Branding

 Prepare the platform for tenant-specific branding.

 Tenant settings may eventually include:

```
Company Name
Logo
Primary Color
Secondary Color
Support Email
Custom Domain
```

 Do not hard-code customer branding into the application.

---

 # 72\. Customer Isolation

 Every tenant should have:

```
Users
Applications
Environments
Configurations
API Keys
Audit Logs
Subscription
Settings
```

 Tenant A cannot access Tenant B.

 The frontend must not determine tenant isolation.

 The backend/database access layer must enforce it.

---

 # 73\. Customization Strategy

 The core platform must remain generic.

 Do not create customer-specific code directly inside core modules.

 For future customer customization use:

```
Core Platform
    +
Tenant Settings
    +
Feature Flags
    +
Optional Modules
```

 Avoid creating:

```
if customer === "ABC"
```

 throughout the codebase.

---

 # 74\. Feature Flags

 Prepare a basic feature flag architecture.

 Example:

```
ADVANCED_AUDIT
API_ACCESS
CUSTOM_BRANDING
SSO
ADVANCED_ANALYTICS
```

 Feature flags should be tenant-aware.

 Example:

```
Tenant A:
API_ACCESS = true

Tenant B:
API_ACCESS = false
```

---

 # 75\. Future Enterprise Features

 Do not implement these unless requested, but design the architecture so they can be added later:

 - SSO
- SAML
- OAuth
- Microsoft Entra ID
- Google Workspace
- SCIM
- Advanced audit retention
- Custom domains
- Dedicated deployments
- Private cloud deployment
- On-premises deployment
- Advanced analytics
- Webhooks
- Integrations
- Billing automation

---

 # 76\. Commercial Architecture

 Do not hard-code prices throughout the application.

 Use subscription plans.

 Example:

```
STARTER
BUSINESS
ENTERPRISE
```

 Store limits/configuration separately.

 The system should be able to determine:

```
tenant
subscription
plan
limits
current usage
```

 This allows future pricing changes without modifying application logic.

---

 # 77\. Example Commercial Model

 The platform should support the concept of:

```
Subscription
+
Implementation Fee
+
Custom Integration
+
Support
+
Managed Services
```

 Do not implement these as hard-coded prices.

 Instead, expose the necessary entities and services so billing can be integrated later.

---

 # 78\. MVP Scope

 Do NOT attempt to implement every possible enterprise feature initially.

 The MVP should include:

 ### Frontend

 - Login
- Dashboard
- Configurations
- Environments
- Applications
- Users
- Roles
- Audit Logs
- Subscription/usage
- Settings

 ### Backend

 - Authentication
- Multi-tenancy
- RBAC
- Configuration CRUD
- Environment CRUD
- Application CRUD
- API key management
- Runtime configuration API
- User management
- Audit logging
- Subscription limits
- Health endpoint

 ### Database

 - PostgreSQL
- Prisma
- Migrations
- Seed data

---

 # 79\. Implementation Phases

 ## Phase 1 - Foundation

 Create:

 - Monorepo
- Angular application
- NestJS application
- PostgreSQL
- Prisma
- Docker Compose
- Environment configuration

 Verify:

```
Frontend starts
Backend starts
Database starts
Backend connects to database
```

---

 ## Phase 2 - Database

 Implement:

 - Tenant
- User
- Role
- Environment
- Configuration
- Application
- API Key
- Audit Log
- Subscription

 Run migrations.

 Create seed data.

---

 ## Phase 3 - Authentication

 Implement:

 - Login
- JWT
- Auth guard
- Role guard
- Password hashing
- Session handling
- Logout

 Test authentication.

---

 ## Phase 4 - Multi-Tenancy

 Implement:

 - Tenant context
- Tenant isolation
- Tenant-aware database queries
- Tenant guards

 Create automated cross-tenant security tests.

---

 ## Phase 5 - Configuration Management

 Implement:

 - Configuration list
- Search
- Filters
- Pagination
- Create
- Edit
- View
- Delete
- Enable
- Disable
- Duplicate

---

 ## Phase 6 - Environments

 Implement:

 - Environment CRUD
- Environment filtering
- Environment configuration relationships

---

 ## Phase 7 - Applications and API Keys

 Implement:

 - Applications
- API keys
- Key rotation/revocation
- Runtime configuration API

---

 ## Phase 8 - Users and Roles

 Implement:

 - User management
- Role management
- Permission enforcement

---

 ## Phase 9 - Audit

 Implement:

 - Audit service
- Audit interceptor/service
- Audit UI
- Filtering
- Pagination

---

 ## Phase 10 - Subscription and Usage

 Implement:

 - Subscription model
- Plan limits
- Usage calculations
- Usage dashboard
- Limit enforcement

 Do not implement payment processing yet.

---

 ## Phase 11 - Quality

 Perform:

 - Unit tests
- Integration tests
- E2E tests
- Security tests
- Tenant isolation tests
- Accessibility testing
- Responsive testing
- API testing

---

 # 80\. Development Seed Accounts

 Create development-only accounts.

 Example:

```
admin@example.local
manager@example.local
viewer@example.local
```

 Use a development password documented only for local development.

 Never use these credentials in production.

---

 # 81\. Definition of Done

 The project is considered complete when:

 - Frontend builds successfully
- Backend builds successfully
- PostgreSQL works
- Prisma migrations work
- Seed data works
- Authentication works
- JWT authentication works
- RBAC works
- Multi-tenancy works
- Cross-tenant access is prevented
- Configuration CRUD works
- Environment management works
- Application management works
- API keys work
- Runtime configuration API works
- Audit logs work
- User management works
- Subscription limits work
- Dashboard works
- Responsive UI works
- API documentation works
- Health endpoint works
- Tests pass
- Linting passes
- Documentation is complete

---

 # 82\. Important Development Rules

 Follow these rules throughout the project.

 1. Do not use `any` unless absolutely unavoidable.
2. Use strong TypeScript types.
3. Use DTOs for API input.
4. Validate all API input.
5. Never trust frontend authorization.
6. Always enforce authorization on the backend.
7. Always enforce tenant isolation on the backend.
8. Never expose passwords.
9. Never store plaintext passwords.
10. Never store raw API keys.
11. Never commit secrets.
12. Never hard-code production credentials.
13. Never put database logic in Angular.
14. Never call HttpClient directly from Angular components.
15. Keep business logic in services.
16. Keep controllers thin.
17. Use Prisma for database access.
18. Use migrations.
19. Add audit logging for important mutations.
20. Write tests for security-critical functionality.
21. Do not create customer-specific hard-coded logic.
22. Keep subscription logic configurable.
23. Keep billing provider integration abstract.
24. Keep the API versioned.
25. Keep frontend and backend independently deployable.

---

 # 83\. Kiro Execution Instructions

 Do not immediately generate the entire application in one step.

 Work incrementally.

 First:

 1. Analyze this specification.
2. Identify contradictions or missing requirements.
3. Produce a requirements document.
4. Produce the technical design.
5. Produce an implementation task list.

 Then implement the project phase by phase.

 After each phase:

 1. Compile the frontend.
2. Compile the backend.
3. Run tests.
4. Run linting.
5. Fix errors.
6. Review the implementation against this specification.

 Do not mark a feature complete if it is only a static UI.

 Interactive requirements must have working frontend and backend functionality.

 Use realistic mock/seed data.

---

 # 84\. Kiro Quality Gate

 Before declaring the project complete, perform a complete review.

 Check:

 ## Frontend

 - Routing
- Authentication
- Authorization
- Responsive design
- Accessibility
- Forms
- Validation
- Loading states
- Error states
- Empty states
- API integration

 ## Backend

 - Authentication
- Authorization
- Tenant isolation
- DTO validation
- Error handling
- API versioning
- Logging
- Health check
- Security
- API documentation

 ## Database

 - Relationships
- Indexes
- Unique constraints
- Foreign keys
- Migrations
- Seed data
- Tenant isolation

 ## Security

 Explicitly test:

 - Invalid JWT
- Expired JWT
- Missing JWT
- Insufficient role
- Cross-tenant access
- Revoked API key
- Expired API key
- Invalid input
- SQL injection attempts
- Unauthorized configuration access

 ## Commercial

 Verify:

 - Tenant plans exist
- Usage limits work
- Limits are enforced server-side
- Usage is displayed
- Pricing is not hard-coded
- Billing integration can be added later
- Customer-specific customization does not require modifying core business logic

---

 # 85\. Final Product Vision

 The final platform should allow the company to offer:

```
                    CONFIGURATION PLATFORM
                              |
            +-----------------+----------------+
            |                 |                |
            v                 v                v
        Customer A        Customer B       Customer C
            |                 |                |
       Configurations     Configurations    Configurations
       Applications       Applications      Applications
       Users              Users             Users
       Environments       Environments      Environments
       API Keys           API Keys          API Keys
            |                 |                |
            +-----------------+----------------+
                              |
                         SaaS Platform
```

 The same core application should support many customers.

 The platform should allow the company to generate revenue through:

 - Recurring subscriptions
- Initial implementation
- Configuration migration
- Integration projects
- Custom development
- Managed services
- Enterprise support

 The technical architecture must support these commercial opportunities without requiring a separate application for every customer.

---

 # 86\. Final Instruction to Kiro

 Build this as a real SaaS product, not as a collection of static demo screens.

 Prioritize:

 1. Security
2. Tenant isolation
3. Maintainability
4. Clean architecture
5. Testability
6. Customer scalability
7. Low operational complexity
8. Commercial extensibility

 Start with the MVP architecture and progressively add functionality.

 Do not over-engineer the initial implementation.

 Every architectural decision should consider that the platform may eventually have hundreds or thousands of customer organizations.

 The first version should remain inexpensive and simple to operate while maintaining a clear upgrade path toward enterprise functionality.

````

### One important recommendation

For your first version, I would **not** have Kiro implement a payment provider, Kubernetes, microservices, Redis, Kafka, or a complicated cloud architecture. Start with:

```text
Angular
   ↓
NestJS
   ↓
Prisma
   ↓
PostgreSQL
````

 That is enough to get a **real MVP in front of prospective clients**. The multi-tenant structure, subscriptions, API keys, audit logs, and usage limits in the specification give you the foundation to turn it into a commercial product later without rebuilding the whole system.