import { NotFoundException } from '@nestjs/common';
import { ConfigurationsService } from './configurations.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { RequestUser } from '../common/types/request-context';
import { UserRole } from '@prisma/client';

const tenantAUser: RequestUser = {
  userId: 'u-a',
  tenantId: 'tenant-a',
  role: UserRole.ADMIN,
  email: 'a@a.local',
};

describe('ConfigurationsService (tenant isolation)', () => {
  let service: ConfigurationsService;
  const prisma = {
    configuration: { findFirst: jest.fn() },
  };
  const audit = { record: jest.fn() };
  const usage = { assertWithinLimit: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConfigurationsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      usage as unknown as UsageService,
    );
  });

  it('scopes lookups by tenantId (never by id alone)', async () => {
    prisma.configuration.findFirst.mockResolvedValue({ id: 'cfg-a', tenantId: 'tenant-a' });
    await service.get(tenantAUser, 'cfg-a');
    expect(prisma.configuration.findFirst).toHaveBeenCalledWith({
      where: { id: 'cfg-a', tenantId: 'tenant-a' },
    });
  });

  it("returns 404 when accessing another tenant's configuration", async () => {
    // Tenant A asks for Tenant B's config id; the tenant-scoped query finds nothing.
    prisma.configuration.findFirst.mockResolvedValue(null);
    await expect(service.get(tenantAUser, 'cfg-b')).rejects.toBeInstanceOf(NotFoundException);
  });
});
