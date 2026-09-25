import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';

/**
 * Billing provider abstraction. Business logic depends on this interface, not
 * on any concrete payment provider, so a provider (Stripe, etc.) can be added
 * later without touching subscription logic. The MVP implementation is a no-op
 * placeholder — no real payment processing.
 */
export interface BillingProvider {
  requestPlanChange(tenantId: string, targetPlan: SubscriptionPlan): Promise<{ status: string }>;
}

@Injectable()
export class BillingService implements BillingProvider {
  private readonly logger = new Logger('Billing');

  async requestPlanChange(
    tenantId: string,
    targetPlan: SubscriptionPlan,
  ): Promise<{ status: string }> {
    // MVP: record intent only. A real provider integration would create a
    // checkout session / invoice here.
    this.logger.log(`Plan change requested for tenant ${tenantId} -> ${targetPlan}`);
    return { status: 'CONTACT_SALES' };
  }
}
