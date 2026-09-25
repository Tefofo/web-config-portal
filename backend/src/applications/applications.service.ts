import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Application } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { RequestUser } from '../common/types/request-context';
import { requireTenant } from '../common/guards/tenant.guard';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
  ) {}

  list(user: RequestUser): Promise<Application[]> {
    const tenantId = requireTenant(user);
    return this.prisma.application.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async get(user: RequestUser, id: string): Promise<Application> {
    const tenantId = requireTenant(user);
    const app = await this.prisma.application.findFirst({ where: { id, tenantId } });
    if (!app) {
      throw new NotFoundException('Application not found.');
    }
    return app;
  }

  async create(user: RequestUser, dto: CreateApplicationDto): Promise<Application> {
    const tenantId = requireTenant(user);

    const env = await this.prisma.environment.findFirst({
      where: { id: dto.environmentId, tenantId },
    });
    if (!env) {
      throw new NotFoundException('Environment not found.');
    }

    const clash = await this.prisma.application.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (clash) {
      throw new ConflictException('An application with this code already exists.');
    }

    await this.usage.assertWithinLimit(tenantId, 'application');

    const created = await this.prisma.application.create({
      data: {
        tenantId,
        environmentId: dto.environmentId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        status: dto.status ?? undefined,
      },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'APPLICATION',
      entityId: created.id,
      description: `Created application ${created.name}.`,
    });
    return created;
  }

  async update(user: RequestUser, id: string, dto: UpdateApplicationDto): Promise<Application> {
    const tenantId = requireTenant(user);
    await this.get(user, id);
    const updated = await this.prisma.application.update({
      where: { id },
      data: { name: dto.name, description: dto.description, status: dto.status },
    });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'UPDATE',
      entity: 'APPLICATION',
      entityId: id,
      description: `Updated application ${updated.name}.`,
    });
    return updated;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const tenantId = requireTenant(user);
    await this.get(user, id);
    // Revoke API keys along with the application.
    await this.prisma.apiKey.deleteMany({ where: { applicationId: id, tenantId } });
    await this.prisma.application.delete({ where: { id } });
    await this.audit.record({
      tenantId,
      userId: user.userId,
      action: 'DELETE',
      entity: 'APPLICATION',
      entityId: id,
      description: 'Deleted application.',
    });
  }
}
