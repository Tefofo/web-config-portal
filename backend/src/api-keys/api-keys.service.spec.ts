import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ApiKeysService (security)', () => {
  let service: ApiKeysService;
  const prisma = {
    apiKey: { findMany: jest.fn(), update: jest.fn() },
    application: { findFirst: jest.fn() },
  };
  const audit = { record: jest.fn() };

  const rawKey = 'cfg_abcd1234.secretpart';

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new ApiKeysService(prisma as unknown as PrismaService, audit as unknown as AuditService);
  });

  async function keyRecord(overrides: Record<string, unknown> = {}) {
    return {
      id: 'key-1',
      tenantId: 'tenant-a',
      applicationId: 'app-1',
      prefix: 'cfg_abcd1234',
      keyHash: await bcrypt.hash(rawKey, 10),
      revokedAt: null,
      expiresAt: null,
      ...overrides,
    };
  }

  it('rejects an unknown key', async () => {
    prisma.apiKey.findMany.mockResolvedValue([]);
    await expect(service.resolve(rawKey)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a revoked key', async () => {
    prisma.apiKey.findMany.mockResolvedValue([await keyRecord({ revokedAt: new Date() })]);
    await expect(service.resolve(rawKey)).rejects.toThrow(/revoked/i);
  });

  it('rejects an expired key', async () => {
    prisma.apiKey.findMany.mockResolvedValue([
      await keyRecord({ expiresAt: new Date(Date.now() - 1000) }),
    ]);
    await expect(service.resolve(rawKey)).rejects.toThrow(/expired/i);
  });

  it('resolves a valid key to its tenant/app/environment context', async () => {
    prisma.apiKey.findMany.mockResolvedValue([await keyRecord()]);
    prisma.application.findFirst.mockResolvedValue({
      id: 'app-1',
      tenantId: 'tenant-a',
      environmentId: 'env-prod',
    });
    prisma.apiKey.update.mockResolvedValue(undefined);
    const ctx = await service.resolve(rawKey);
    expect(ctx).toEqual({
      tenantId: 'tenant-a',
      applicationId: 'app-1',
      environmentId: 'env-prod',
      apiKeyId: 'key-1',
    });
  });
});
