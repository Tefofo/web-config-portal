import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKey } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser, ApiKeyContext } from '../common/types/request-context';
import { requireTenant } from '../common/guards/tenant.guard';
import { CreateApiKeyDto } from './dto/api-key.dto';

const KEY_PREFIX = 'cfg';

export interface CreatedApiKey {
  id: string;
  name: string;
  prefix: string;
  /** Raw key — returned ONCE at creation, never stored or shown again. */
  key: string;
  applicationId: string;
  expiresAt: Date | null;
  createdAt: Date;
}

/** Metadata view (never includes the raw key or hash). */
export type ApiKeyMetadata = Omit<ApiKey, 'keyHash'>;

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listForApplication(user: RequestUser, applicationId: string): Promise<ApiKeyMetadata[]> {
    const tenantId = requireTenant(user);
    await this.assertApplication(tenantId, applicationId);
    const keys = await this.prisma.apiKey.findMany({
      where: { tenantId, applicationId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((k) => this.toMetadata(k));
  }

  async create(user: RequestUser, applicationId: string, dto: CreateApiKeyDto): Promise<CreatedApiKey> {
    const tenantId = requireTenant(user);
    await this.assertApplication(tenantId, applicationId);

    // Generate a high-entropy random key. Only its hash is persisted.
    const secret = randomBytes(24).toString('base64url');
    const prefix = `${KEY_PREFIX}_${randomBytes(4).toString('hex')}`;
    const rawKey = `${prefix}.${secret}`;
    const keyHash = await bcrypt.hash(rawKey, 10);

    const created = await this.prisma.apiKey.create({
      data: {
        tenantId,
        applicationId,
        name: dto.name,
        keyHash,
        prefix,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'API_KEY_CREATED',
      entity: 'API_KEY',
      entityId: created.id,
      description: `Created API key "${dto.name}" (${prefix}).`,
    });

    return {
      id: created.id,
      name: created.name,
      prefix: created.prefix,
      key: rawKey,
      applicationId: created.applicationId,
      expiresAt: created.expiresAt,
      createdAt: created.createdAt,
    };
  }

  async revoke(user: RequestUser, applicationId: string, keyId: string): Promise<void> {
    const tenantId = requireTenant(user);
    await this.assertApplication(tenantId, applicationId);
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId, applicationId },
    });
    if (!key) {
      throw new NotFoundException('API key not found.');
    }
    if (!key.revokedAt) {
      await this.prisma.apiKey.update({
        where: { id: keyId },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'API_KEY_REVOKED',
      entity: 'API_KEY',
      entityId: keyId,
      description: `Revoked API key ${key.prefix}.`,
    });
  }

  /**
   * Resolves a raw API key to its tenant/application/environment context.
   * Rejects revoked or expired keys. Used by the runtime guard.
   */
  async resolve(rawKey: string): Promise<ApiKeyContext> {
    const prefix = rawKey.split('.')[0];
    if (!prefix) {
      throw new UnauthorizedException('Invalid API key.');
    }
    // Look up candidate keys by (indexed) prefix, then verify the hash.
    const candidates = await this.prisma.apiKey.findMany({ where: { prefix } });
    for (const candidate of candidates) {
      const matches = await bcrypt.compare(rawKey, candidate.keyHash);
      if (!matches) {
        continue;
      }
      if (candidate.revokedAt) {
        throw new UnauthorizedException('API key has been revoked.');
      }
      if (candidate.expiresAt && candidate.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedException('API key has expired.');
      }
      const application = await this.prisma.application.findFirst({
        where: { id: candidate.applicationId, tenantId: candidate.tenantId },
      });
      if (!application) {
        throw new UnauthorizedException('Invalid API key.');
      }
      // Record last-used without blocking the request path.
      void this.prisma.apiKey
        .update({ where: { id: candidate.id }, data: { lastUsedAt: new Date() } })
        .catch(() => undefined);

      return {
        tenantId: candidate.tenantId,
        applicationId: candidate.applicationId,
        environmentId: application.environmentId,
        apiKeyId: candidate.id,
      };
    }
    throw new UnauthorizedException('Invalid API key.');
  }

  private async assertApplication(tenantId: string, applicationId: string): Promise<void> {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId },
    });
    if (!app) {
      throw new NotFoundException('Application not found.');
    }
  }

  private toMetadata(key: ApiKey): ApiKeyMetadata {
    const { keyHash: _keyHash, ...metadata } = key;
    void _keyHash;
    return metadata;
  }
}
