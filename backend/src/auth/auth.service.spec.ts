import { UnauthorizedException } from '@nestjs/common';
import { TenantStatus, User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'admin@example.local',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    firstName: 'Ada',
    lastName: 'Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1', status: TenantStatus.ACTIVE }),
    },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.token'), verifyAsync: jest.fn() };
  const config = {
    get: (key: string) =>
      ({
        'jwt.accessSecret': 'a',
        'jwt.refreshSecret': 'r',
        'jwt.accessTtl': '900s',
        'jwt.refreshTtl': '7d',
      })[key],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('logs in with valid credentials and returns tokens', async () => {
    prisma.user.findFirst.mockResolvedValue(buildUser());
    const result = await service.validateAndLogin('admin@example.local', 'Password123!');
    expect(result.accessToken).toBe('signed.token');
    expect(result.refreshToken).toBe('signed.token');
    expect(result.user.email).toBe('admin@example.local');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('rejects an unknown email without revealing existence', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.validateAndLogin('nobody@example.local', 'x')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a wrong password', async () => {
    prisma.user.findFirst.mockResolvedValue(buildUser());
    await expect(service.validateAndLogin('admin@example.local', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an inactive account', async () => {
    prisma.user.findFirst.mockResolvedValue(buildUser({ status: UserStatus.INACTIVE }));
    await expect(service.validateAndLogin('admin@example.local', 'Password123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects login when the tenant is suspended', async () => {
    prisma.user.findFirst.mockResolvedValue(buildUser());
    prisma.tenant.findUnique.mockResolvedValueOnce({ id: 'tenant-1', status: TenantStatus.SUSPENDED });
    await expect(service.validateAndLogin('admin@example.local', 'Password123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
