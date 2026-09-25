import { ForbiddenException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { UsageService } from './usage.service';
import { PrismaService } from '../database/prisma.service';

describe('UsageService (subscription limits)', () => {
  let service: UsageService;
  const prisma = {
    subscription: { findFirst: jest.fn() },
    user: { count: jest.fn() },
    environment: { count: jest.fn() },
    application: { count: jest.fn() },
    configuration: { count: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsageService(prisma as unknown as PrismaService);
  });

  it('throws when a resource limit is reached', async () => {
    prisma.subscription.findFirst.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE,
      userLimit: 5,
      environmentLimit: 3,
      applicationLimit: 2,
      configurationLimit: 500,
    });
    prisma.user.count.mockResolvedValue(5); // at the limit
    await expect(service.assertWithinLimit('tenant-a', 'user')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows creation below the limit', async () => {
    prisma.subscription.findFirst.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE,
      userLimit: 5,
      environmentLimit: 3,
      applicationLimit: 2,
      configurationLimit: 500,
    });
    prisma.configuration.count.mockResolvedValue(10);
    await expect(service.assertWithinLimit('tenant-a', 'configuration')).resolves.toBeUndefined();
  });

  it('treats a null limit as unlimited', async () => {
    prisma.subscription.findFirst.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE,
      userLimit: null,
      environmentLimit: null,
      applicationLimit: null,
      configurationLimit: null,
    });
    await expect(service.assertWithinLimit('tenant-a', 'user')).resolves.toBeUndefined();
    expect(prisma.user.count).not.toHaveBeenCalled();
  });
});
