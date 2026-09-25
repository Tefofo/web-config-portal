import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Configuration, ConfigurationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/types/request-context';
import { requireTenant } from '../common/guards/tenant.guard';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { UsageService } from '../usage/usage.service';
import {
  ConfigurationQueryDto,
  CreateConfigurationDto,
  DuplicateConfigurationDto,
  UpdateConfigurationDto,
} from './dto/configuration.dto';
import { validateConfigurationValue } from './value-validation';

@Injectable()
export class ConfigurationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
  ) {}

  async list(user: RequestUser, query: ConfigurationQueryDto): Promise<PaginatedResult<Configuration>> {
    const tenantId = requireTenant(user);
    const where: Prisma.ConfigurationWhereInput = { tenantId };
    if (query.environmentId) where.environmentId = query.environmentId;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { key: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ConfigurationOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortDir === 'desc' ? 'desc' : 'asc' }
      : { name: 'asc' };

    const [items, total] = await Promise.all([
      this.prisma.configuration.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.configuration.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async get(user: RequestUser, id: string): Promise<Configuration> {
    const tenantId = requireTenant(user);
    const config = await this.prisma.configuration.findFirst({ where: { id, tenantId } });
    if (!config) {
      throw new NotFoundException('Configuration not found.');
    }
    return config;
  }

  async create(user: RequestUser, dto: CreateConfigurationDto): Promise<Configuration> {
    const tenantId = requireTenant(user);

    // Environment must belong to the tenant.
    const env = await this.prisma.environment.findFirst({
      where: { id: dto.environmentId, tenantId },
    });
    if (!env) {
      throw new NotFoundException('Environment not found.');
    }

    await this.assertUniqueKey(tenantId, dto.environmentId, dto.key);
    const value = validateConfigurationValue(dto.type, dto.value);

    await this.usage.assertWithinLimit(tenantId, 'configuration');

    const created = await this.prisma.configuration.create({
      data: {
        tenantId,
        environmentId: dto.environmentId,
        name: dto.name,
        key: dto.key,
        description: dto.description,
        category: dto.category,
        type: dto.type,
        value: value as Prisma.InputJsonValue,
        defaultValue: dto.defaultValue as Prisma.InputJsonValue | undefined,
        status: dto.status ?? ConfigurationStatus.ACTIVE,
        ownerId: dto.ownerId ?? user.userId,
        createdById: user.userId,
        updatedById: user.userId,
      },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'CONFIGURATION',
      entityId: created.id,
      description: `Created ${created.key}.`,
    });
    return created;
  }

  async update(user: RequestUser, id: string, dto: UpdateConfigurationDto): Promise<Configuration> {
    const tenantId = requireTenant(user);
    const existing = await this.get(user, id);

    const type = dto.type ?? existing.type;
    const value =
      dto.value !== undefined ? validateConfigurationValue(type, dto.value) : undefined;

    const updated = await this.prisma.configuration.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        type: dto.type,
        value: value as Prisma.InputJsonValue | undefined,
        defaultValue: dto.defaultValue as Prisma.InputJsonValue | undefined,
        ownerId: dto.ownerId,
        status: dto.status,
        updatedById: user.userId,
      },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'UPDATE',
      entity: 'CONFIGURATION',
      entityId: id,
      description: `Updated ${updated.key}.`,
    });
    return updated;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const tenantId = requireTenant(user);
    await this.get(user, id);
    await this.prisma.configuration.delete({ where: { id } });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'DELETE',
      entity: 'CONFIGURATION',
      entityId: id,
      description: 'Deleted configuration.',
    });
  }

  async setStatus(user: RequestUser, id: string, status: ConfigurationStatus): Promise<Configuration> {
    const tenantId = requireTenant(user);
    await this.get(user, id);
    const updated = await this.prisma.configuration.update({
      where: { id },
      data: { status, updatedById: user.userId },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: status === ConfigurationStatus.ACTIVE ? 'ENABLE' : 'DISABLE',
      entity: 'CONFIGURATION',
      entityId: id,
      description: `${status === ConfigurationStatus.ACTIVE ? 'Enabled' : 'Disabled'} ${updated.key}.`,
    });
    return updated;
  }

  async duplicate(user: RequestUser, id: string, dto: DuplicateConfigurationDto): Promise<Configuration> {
    const tenantId = requireTenant(user);
    const source = await this.get(user, id);
    await this.assertUniqueKey(tenantId, source.environmentId, dto.key);
    await this.usage.assertWithinLimit(tenantId, 'configuration');

    const created = await this.prisma.configuration.create({
      data: {
        tenantId,
        environmentId: source.environmentId,
        name: dto.name ?? `${source.name} (copy)`,
        key: dto.key,
        description: source.description,
        category: source.category,
        type: source.type,
        value: source.value as Prisma.InputJsonValue,
        defaultValue: (source.defaultValue ?? undefined) as Prisma.InputJsonValue | undefined,
        status: source.status,
        ownerId: source.ownerId,
        createdById: user.userId,
        updatedById: user.userId,
      },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'CONFIGURATION',
      entityId: created.id,
      description: `Duplicated ${source.key} to ${created.key}.`,
    });
    return created;
  }

  private async assertUniqueKey(tenantId: string, environmentId: string, key: string): Promise<void> {
    const clash = await this.prisma.configuration.findFirst({
      where: { tenantId, environmentId, key },
    });
    if (clash) {
      throw new ConflictException(
        'A configuration with this key already exists in the environment.',
      );
    }
  }
}
