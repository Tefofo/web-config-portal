import {
  ApplicationStatus,
  ConfigurationStatus,
  ConfigurationType,
  EnvironmentType,
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PLAN_LIMITS } from '../src/subscriptions/plan-limits';

const prisma = new PrismaClient();

/**
 * Seeds development/demo data. All data is fictional. Passwords are hashed;
 * the raw demo password comes from SEED_DEMO_PASSWORD (documented for local
 * use only). Never run against production.
 */
async function main(): Promise<void> {
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'Password123!';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // Idempotent-ish: clear demo tenant data if re-seeding.
  const existing = await prisma.tenant.findUnique({ where: { slug: 'demo-co' } });
  if (existing) {
    await prisma.$transaction([
      prisma.apiKey.deleteMany({ where: { tenantId: existing.id } }),
      prisma.configuration.deleteMany({ where: { tenantId: existing.id } }),
      prisma.application.deleteMany({ where: { tenantId: existing.id } }),
      prisma.auditLog.deleteMany({ where: { tenantId: existing.id } }),
      prisma.featureFlag.deleteMany({ where: { tenantId: existing.id } }),
      prisma.subscription.deleteMany({ where: { tenantId: existing.id } }),
      prisma.environment.deleteMany({ where: { tenantId: existing.id } }),
      prisma.user.deleteMany({ where: { tenantId: existing.id } }),
      prisma.tenant.delete({ where: { id: existing.id } }),
    ]);
  }

  // --- Platform admin (no tenant) ---
  // Composite unique [tenantId, email] treats NULL tenantId as distinct, so we
  // check-then-create rather than upsert.
  const existingPlatformAdmin = await prisma.user.findFirst({
    where: { email: 'platform@example.local', tenantId: null },
  });
  if (!existingPlatformAdmin) {
    await prisma.user.create({
      data: {
        tenantId: null,
        email: 'platform@example.local',
        passwordHash,
        firstName: 'Platform',
        lastName: 'Admin',
        role: UserRole.PLATFORM_ADMIN,
      },
    });
  }

  // --- Demo tenant ---
  const tenant = await prisma.tenant.create({
    data: { name: 'Demo Company', slug: 'demo-co' },
  });

  // --- Users ---
  const [admin] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@example.local',
        passwordHash,
        firstName: 'Ada',
        lastName: 'Admin',
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'manager@example.local',
        passwordHash,
        firstName: 'Max',
        lastName: 'Manager',
        role: UserRole.CONFIGURATION_MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'viewer@example.local',
        passwordHash,
        firstName: 'Vera',
        lastName: 'Viewer',
        role: UserRole.VIEWER,
      },
    }),
  ]);

  // --- Environments ---
  const envDefs: { name: string; code: string; type: EnvironmentType }[] = [
    { name: 'Development', code: 'DEV', type: EnvironmentType.DEVELOPMENT },
    { name: 'Testing', code: 'TEST', type: EnvironmentType.TEST },
    { name: 'Staging', code: 'STG', type: EnvironmentType.STAGING },
    { name: 'Production', code: 'PROD', type: EnvironmentType.PRODUCTION },
  ];
  const environments = await Promise.all(
    envDefs.map((e) =>
      prisma.environment.create({
        data: { tenantId: tenant.id, name: e.name, code: e.code, type: e.type },
      }),
    ),
  );
  const prod = environments.find((e) => e.code === 'PROD')!;
  const dev = environments.find((e) => e.code === 'DEV')!;

  // --- Applications ---
  const portalApp = await prisma.application.create({
    data: {
      tenantId: tenant.id,
      environmentId: prod.id,
      name: 'Customer Portal',
      code: 'customer-portal',
      description: 'Public-facing customer portal.',
      status: ApplicationStatus.ACTIVE,
    },
  });
  await prisma.application.create({
    data: {
      tenantId: tenant.id,
      environmentId: prod.id,
      name: 'Payment API',
      code: 'payment-api',
      description: 'Payment processing service.',
      status: ApplicationStatus.ACTIVE,
    },
  });

  // --- Configurations ---
  const configs: {
    envId: string;
    name: string;
    key: string;
    category: string;
    type: ConfigurationType;
    value: unknown;
    status?: ConfigurationStatus;
  }[] = [
    { envId: prod.id, name: 'API URL', key: 'api.url', category: 'API', type: ConfigurationType.STRING, value: 'https://api.example.com' },
    { envId: prod.id, name: 'Feature X Enabled', key: 'feature.x_enabled', category: 'Features', type: ConfigurationType.BOOLEAN, value: true },
    { envId: prod.id, name: 'Max Retries', key: 'api.max_retries', category: 'API', type: ConfigurationType.NUMBER, value: 5 },
    { envId: prod.id, name: 'Rate Limits', key: 'api.rate_limits', category: 'API', type: ConfigurationType.JSON, value: { free: 60, pro: 600 } },
    { envId: prod.id, name: 'Maintenance Date', key: 'ops.maintenance_date', category: 'Operations', type: ConfigurationType.DATE, value: '2026-11-01', status: ConfigurationStatus.DISABLED },
    { envId: dev.id, name: 'API URL', key: 'api.url', category: 'API', type: ConfigurationType.STRING, value: 'https://dev.api.example.com' },
    { envId: dev.id, name: 'Log Level', key: 'ops.log_level', category: 'Operations', type: ConfigurationType.SELECT, value: 'debug' },
  ];
  for (const c of configs) {
    await prisma.configuration.create({
      data: {
        tenantId: tenant.id,
        environmentId: c.envId,
        name: c.name,
        key: c.key,
        category: c.category,
        type: c.type,
        value: c.value as object,
        status: c.status ?? ConfigurationStatus.ACTIVE,
        ownerId: admin.id,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }

  // --- Audit logs ---
  const actions = ['LOGIN', 'CREATE', 'UPDATE', 'ENABLE', 'DISABLE'];
  for (let i = 0; i < 20; i++) {
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: admin.id,
        action: actions[i % actions.length],
        entity: i % 2 === 0 ? 'CONFIGURATION' : 'AUTH',
        entityId: i % 2 === 0 ? `cfg-${i}` : null,
        description: `Seed audit event ${i + 1}`,
      },
    });
  }

  // --- Subscription (STARTER) ---
  const starter = PLAN_LIMITS[SubscriptionPlan.STARTER];
  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      plan: SubscriptionPlan.STARTER,
      status: SubscriptionStatus.ACTIVE,
      userLimit: starter.userLimit,
      environmentLimit: starter.environmentLimit,
      applicationLimit: starter.applicationLimit,
      configurationLimit: starter.configurationLimit,
    },
  });

  // --- Feature flags ---
  await prisma.featureFlag.createMany({
    data: [
      { tenantId: tenant.id, key: 'API_ACCESS', enabled: true },
      { tenantId: tenant.id, key: 'ADVANCED_AUDIT', enabled: false },
      { tenantId: tenant.id, key: 'CUSTOM_BRANDING', enabled: false },
    ],
  });

  // Reference the seeded app so linters see it used.
  void portalApp;

  console.log('Seed complete. Demo tenant: demo-co');
  console.log('Accounts (password from SEED_DEMO_PASSWORD):');
  console.log('  platform@example.local  (PLATFORM_ADMIN)');
  console.log('  admin@example.local     (ADMIN)');
  console.log('  manager@example.local   (CONFIGURATION_MANAGER)');
  console.log('  viewer@example.local    (VIEWER)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
