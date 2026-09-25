import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';

export interface AuditQuery {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
}

export interface AuditRecordInput {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  description?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Central audit writer. Every important mutation should call record().
 * Never pass passwords or secrets in metadata.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          description: input.description,
          metadata: input.metadata,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (error) {
      // Auditing must never break the primary operation; log and continue.
      this.logger.error('Failed to write audit log', error as Error);
    }
  }

  async list(tenantId: string, query: AuditQuery): Promise<PaginatedResult<AuditLog>> {
    const where: Prisma.AuditLogWhereInput = { tenantId };
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.entity) where.entity = query.entity;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async getById(tenantId: string, id: string): Promise<AuditLog> {
    const log = await this.prisma.auditLog.findFirst({ where: { id, tenantId } });
    if (!log) {
      throw new NotFoundException('Audit event not found.');
    }
    return log;
  }
}
