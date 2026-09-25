import { ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PLAN_LIMITS, PlanLimits } from '../subscriptions/plan-limits';

export type LimitedResource = 'user' | 'environment' | 'application' | 'configuration';

export interface UsageSnapshot {
  users: { used: number; limit: number | null };
  environments: { used: number; limit: number | null };
  applications: { used: number; limit: number | null };
  configurations: { used: number; limit: number | null };
}

const RESOURCE_TO_LIMIT: Record<LimitedResource, keyof PlanLimits> = {
  user: 'userLimit',
  environment: 'environmentLimit',
  application: 'applicationLimit',
  configuration: 'configurationLimit',
};

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Current effective limits for a tenant, from its active subscription. */
  async limitsFor(tenantId: string): Promise<PlanLimits> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) {
      // No active subscription -> fall back to the most restrictive plan.
      return PLAN_LIMITS.STARTER;
    }
    return {
      userLimit: subscription.userLimit,
      environmentLimit: subscription.environmentLimit,
      applicationLimit: subscription.applicationLimit,
      configurationLimit: subscription.configurationLimit,
    };
  }

  async snapshot(tenantId: string): Promise<UsageSnapshot> {
    const limits = await this.limitsFor(tenantId);
    const [users, environments, applications, configurations] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.environment.count({ where: { tenantId } }),
      this.prisma.application.count({ where: { tenantId } }),
      this.prisma.configuration.count({ where: { tenantId } }),
    ]);
    return {
      users: { used: users, limit: limits.userLimit },
      environments: { used: environments, limit: limits.environmentLimit },
      applications: { used: applications, limit: limits.applicationLimit },
      configurations: { used: configurations, limit: limits.configurationLimit },
    };
  }

  /** Throws ForbiddenException if creating one more of `resource` exceeds the limit. */
  async assertWithinLimit(tenantId: string, resource: LimitedResource): Promise<void> {
    const limits = await this.limitsFor(tenantId);
    const limit = limits[RESOURCE_TO_LIMIT[resource]];
    if (limit === null) {
      return; // unlimited
    }
    const used = await this.countResource(tenantId, resource);
    if (used >= limit) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        message: `Your subscription has reached its ${resource} limit.`,
      });
    }
  }

  private countResource(tenantId: string, resource: LimitedResource): Promise<number> {
    switch (resource) {
      case 'user':
        return this.prisma.user.count({ where: { tenantId } });
      case 'environment':
        return this.prisma.environment.count({ where: { tenantId } });
      case 'application':
        return this.prisma.application.count({ where: { tenantId } });
      case 'configuration':
        return this.prisma.configuration.count({ where: { tenantId } });
    }
  }
}
