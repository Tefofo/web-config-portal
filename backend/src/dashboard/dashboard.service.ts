import { Injectable } from '@nestjs/common';
import { AuditLog, ConfigurationStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface DashboardSummary {
  totalConfigurations: number;
  activeConfigurations: number;
  disabledConfigurations: number;
  totalEnvironments: number;
  totalApplications: number;
  totalUsers: number;
  recentChanges: AuditLog[];
  recentActivity: AuditLog[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(tenantId: string): Promise<DashboardSummary> {
    const [
      totalConfigurations,
      activeConfigurations,
      totalEnvironments,
      totalApplications,
      totalUsers,
      recentActivity,
    ] = await Promise.all([
      this.prisma.configuration.count({ where: { tenantId } }),
      this.prisma.configuration.count({ where: { tenantId, status: ConfigurationStatus.ACTIVE } }),
      this.prisma.environment.count({ where: { tenantId } }),
      this.prisma.application.count({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const recentChanges = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entity: 'CONFIGURATION',
        action: { in: ['CREATE', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return {
      totalConfigurations,
      activeConfigurations,
      disabledConfigurations: totalConfigurations - activeConfigurations,
      totalEnvironments,
      totalApplications,
      totalUsers,
      recentChanges,
      recentActivity,
    };
  }
}
