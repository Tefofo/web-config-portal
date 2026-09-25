import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Environment } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/types/request-context';
import { requireTenant } from '../common/guards/tenant.guard';
import { CreateEnvironmentDto, UpdateEnvironmentDto } from './dto/environment.dto';

@Injectable()
export class EnvironmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(user: RequestUser): Promise<Environment[]> {
    const tenantId = requireTenant(user);
    return this.prisma.environment.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async get(user: RequestUser, id: string): Promise<Environment> {
    const tenantId = requireTenant(user);
    // Scoped by tenantId — never look up by id alone.
    const env = await this.prisma.environment.findFirst({ where: { id, tenantId } });
    if (!env) {
      throw new NotFoundException('Environment not found.');
    }
    return env;
  }

  async create(user: RequestUser, dto: CreateEnvironmentDto): Promise<Environment> {
    const tenantId = requireTenant(user);
    const clash = await this.prisma.environment.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (clash) {
      throw new ConflictException('An environment with this code already exists.');
    }
    const created = await this.prisma.environment.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        type: dto.type,
        description: dto.description,
        status: dto.status ?? undefined,
      },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'ENVIRONMENT',
      entityId: created.id,
      description: `Created environment ${created.name}.`,
    });
    return created;
  }

  async update(user: RequestUser, id: string, dto: UpdateEnvironmentDto): Promise<Environment> {
    const tenantId = requireTenant(user);
    await this.get(user, id); // tenant-scoped existence check
    const updated = await this.prisma.environment.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        status: dto.status,
      },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'UPDATE',
      entity: 'ENVIRONMENT',
      entityId: id,
      description: `Updated environment ${updated.name}.`,
    });
    return updated;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const tenantId = requireTenant(user);
    await this.get(user, id);
    const activeConfigs = await this.prisma.configuration.count({
      where: { tenantId, environmentId: id, status: 'ACTIVE' },
    });
    if (activeConfigs > 0) {
      throw new ConflictException(
        'Cannot delete an environment that still has active configurations.',
      );
    }
    await this.prisma.environment.delete({ where: { id } });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'DELETE',
      entity: 'ENVIRONMENT',
      entityId: id,
      description: 'Deleted environment.',
    });
  }
}
