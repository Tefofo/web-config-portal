import { Injectable, NotFoundException } from '@nestjs/common';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsageService, UsageSnapshot } from '../usage/usage.service';
import { BillingService } from './billing.service';
import { PLAN_LIMITS } from './plan-limits';

export interface SubscriptionView {
  subscription: Subscription;
  usage: UsageSnapshot;
  availablePlans: { plan: SubscriptionPlan; limits: (typeof PLAN_LIMITS)[SubscriptionPlan] }[];
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly billing: BillingService,
    private readonly audit: AuditService,
  ) {}

  async current(tenantId: string): Promise<SubscriptionView> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) {
      throw new NotFoundException('No active subscription found.');
    }
    const usage = await this.usage.snapshot(tenantId);
    const availablePlans = (Object.keys(PLAN_LIMITS) as SubscriptionPlan[]).map((plan) => ({
      plan,
      limits: PLAN_LIMITS[plan],
    }));
    return { subscription, usage, availablePlans };
  }

  /** MVP upgrade path: routes through the billing abstraction (no payment). */
  async requestUpgrade(
    tenantId: string,
    userId: string,
    targetPlan: SubscriptionPlan,
  ): Promise<{ status: string }> {
    const result = await this.billing.requestPlanChange(tenantId, targetPlan);
    await this.audit.record({
      tenantId,
      userId,
      action: 'SUBSCRIPTION_CHANGED',
      entity: 'SUBSCRIPTION',
      description: `Requested upgrade to ${targetPlan}.`,
    });
    return result;
  }
}
