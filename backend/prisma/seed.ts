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
      prisma.siteConfig.deleteMany({ where: { tenantId: existing.id } }),
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

  // --- Site config (Bread4Soul marketing website) ---
  await prisma.siteConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      template: 'marketing-v1',
      published: true,
      content: {
        template: 'marketing-v1',
        branding: {
          siteName: 'Bread4Soul',
          logoUrl: '',
          primaryColor: '#1a1a2e',
          secondaryColor: '#e94560',
          fontFamily: 'Poppins',
        },
        hero: {
          headline: 'Bread4Soul',
          subheadline: 'A premium bi-monthly musical experience for the soul.',
          backgroundImageUrl:
            'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80',
          ctaLabel: 'Get Tickets',
          ctaUrl: '#events',
        },
        about: {
          heading: 'About Bread4Soul',
          body: 'Bread4Soul is a premium bi-monthly musical event bringing together soulful sounds, great people, and unforgettable nights. Join a growing community that celebrates music, connection, and culture.',
          imageUrl:
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
        },
        events: [
          {
            title: 'Bread4Soul Sessions — Winter Edition',
            date: '2026-07-25T19:00:00.000Z',
            venue: 'Johannesburg, South Africa',
            description: 'An intimate evening of live soul, jazz, and house.',
            ticketUrl: '#',
          },
          {
            title: 'Bread4Soul Sessions — Spring Edition',
            date: '2026-09-26T19:00:00.000Z',
            venue: 'Cape Town, South Africa',
            description: 'The soul sessions come to the Mother City.',
            ticketUrl: '#',
          },
        ],
        gallery: [
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        ],
        contact: {
          email: 'hello@bread4soul.co.za',
          phone: '',
          address: 'Johannesburg, South Africa',
          instagram: 'https://instagram.com/bread4soul',
          facebook: '',
          twitter: '',
        },
        sections: { hero: true, about: true, events: true, gallery: true, contact: true },
      },
    },
  });

  // ===========================================================================
  // Second tenant: Traditional Cafe (restaurant-v1 template)
  // ===========================================================================
  const cafeExisting = await prisma.tenant.findUnique({ where: { slug: 'traditional-cafe' } });
  if (cafeExisting) {
    await prisma.$transaction([
      prisma.siteConfig.deleteMany({ where: { tenantId: cafeExisting.id } }),
      prisma.subscription.deleteMany({ where: { tenantId: cafeExisting.id } }),
      prisma.user.deleteMany({ where: { tenantId: cafeExisting.id } }),
      prisma.tenant.delete({ where: { id: cafeExisting.id } }),
    ]);
  }

  const cafe = await prisma.tenant.create({
    data: { name: 'Traditional Cafe', slug: 'traditional-cafe' },
  });

  await prisma.user.create({
    data: {
      tenantId: cafe.id,
      email: 'admin@traditionalcafe.local',
      passwordHash,
      firstName: 'Cafe',
      lastName: 'Owner',
      role: UserRole.ADMIN,
    },
  });

  const cafeStarter = PLAN_LIMITS[SubscriptionPlan.STARTER];
  await prisma.subscription.create({
    data: {
      tenantId: cafe.id,
      plan: SubscriptionPlan.STARTER,
      status: SubscriptionStatus.ACTIVE,
      userLimit: cafeStarter.userLimit,
      environmentLimit: cafeStarter.environmentLimit,
      applicationLimit: cafeStarter.applicationLimit,
      configurationLimit: cafeStarter.configurationLimit,
    },
  });

  await prisma.siteConfig.create({
    data: {
      tenantId: cafe.id,
      template: 'restaurant-v1',
      published: true,
      content: {
        template: 'restaurant-v1',
        branding: {
          siteName: 'Traditional Cafe',
          logoUrl: '',
          primaryColor: '#3e2723',
          secondaryColor: '#c98a3a',
          fontFamily: 'Poppins',
        },
        hero: {
          headline: 'Traditional Cafe',
          subheadline: 'Authentic African cuisine, comfort food & good vibes in Riverside View.',
          backgroundImageUrl:
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
          ctaLabel: 'View Menu',
          ctaUrl: '#menu',
        },
        about: {
          heading: 'About Traditional Cafe',
          body: 'A neighbourhood spot serving slow-cooked African classics, hearty comfort food, and crafted drinks. Great food, warm hospitality, and a laid-back atmosphere — all week long.',
          imageUrl:
            'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
        },
        menuCategories: ['African Cuisine', 'Comfort Food', 'Drinks'],
        menu: [
          { name: 'Mogodu', description: 'Slow-cooked tripe in a rich traditional sauce', price: 89, category: 'African Cuisine', tag: 'signature' },
          { name: 'Ox Tongue', description: 'Tender braised ox tongue with chakalaka', price: 109, category: 'African Cuisine', tag: 'signature' },
          { name: 'Dombe', description: 'Steamed bread served with stew', price: 45, category: 'African Cuisine', tag: '' },
          { name: 'Oxtail Stew', description: 'Fall-off-the-bone oxtail in tomato gravy', price: 139, category: 'African Cuisine', tag: 'special' },
          { name: 'Pap & Vleis', description: 'Grilled meat with creamy pap and sauce', price: 95, category: 'Comfort Food', tag: '' },
          { name: 'Burger & Chips', description: 'Classic beef burger with seasoned fries', price: 85, category: 'Comfort Food', tag: '' },
          { name: 'Wings Platter', description: '12 crispy wings with dipping sauces', price: 99, category: 'Comfort Food', tag: '' },
          { name: 'Signature Cocktail', description: 'House-blend African-inspired cocktail', price: 75, category: 'Drinks', tag: 'signature' },
          { name: 'Craft Beer', description: 'Locally brewed craft on tap', price: 55, category: 'Drinks', tag: '' },
          { name: 'Soft Drinks', description: 'Assorted cold beverages', price: 30, category: 'Drinks', tag: '' },
        ],
        hours: [
          { days: 'Monday - Thursday', time: '10:00 AM - 12:00 AM' },
          { days: 'Friday - Saturday', time: '10:00 AM - 02:00 AM' },
          { days: 'Sunday', time: '10:00 AM - 01:00 AM' },
        ],
        amenities: ['On-site security', 'Free parking', 'Wheelchair accessible', 'Free Wi-Fi'],
        orderUrl:
          'https://www.ubereats.com/za/store/traditional-cafe-riverside-view/E8u-y9TyVnO6z25QP6_KnA',
        events: [
          { title: 'Mogodu Mondays', date: '', venue: 'Traditional Cafe', description: 'Local food and music kickoff to start your week', ticketUrl: '' },
          { title: 'Throwback Thursdays', date: '', venue: 'Traditional Cafe', description: 'Retro-themed music nights with classic hits', ticketUrl: '' },
          { title: 'Soul Sundays', date: '', venue: 'Traditional Cafe', description: 'Laid-back afternoon vibes with soulful tunes', ticketUrl: '' },
        ],
        gallery: [
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
        ],
        contact: {
          email: '',
          phone: '+27 73 616 8909',
          address: '1218 Francolin Crescent, Riverside View Ext 30, Johannesburg, 2191',
          instagram: '',
          facebook: '',
          twitter: '',
        },
        sections: {
          hero: true,
          about: true,
          menu: true,
          hours: true,
          amenities: true,
          events: true,
          gallery: true,
          contact: true,
        },
      },
    },
  });

  console.log('Seed complete. Demo tenant: demo-co');
  console.log('Accounts (password from SEED_DEMO_PASSWORD):');
  console.log('  platform@example.local  (PLATFORM_ADMIN)');
  console.log('  admin@example.local     (ADMIN)');
  console.log('  manager@example.local   (CONFIGURATION_MANAGER)');
  console.log('  viewer@example.local    (VIEWER)');
  console.log('Second tenant: traditional-cafe (restaurant-v1)');
  console.log('  admin@traditionalcafe.local (ADMIN)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
