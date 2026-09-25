import { SubscriptionPlan } from '@prisma/client';

/**
 * Plan limits kept SEPARATE from subscription/business logic so pricing/limits
 * can change without touching enforcement code. A null value means unlimited.
 * No commercial prices are encoded here — only capability limits.
 */
export interface PlanLimits {
  userLimit: number | null;
  environmentLimit: number | null;
  applicationLimit: number | null;
  configurationLimit: number | null;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  STARTER: {
    userLimit: 5,
    environmentLimit: 3,
    applicationLimit: 2,
    configurationLimit: 500,
  },
  BUSINESS: {
    userLimit: 25,
    environmentLimit: 10,
    applicationLimit: 10,
    configurationLimit: 5000,
  },
  ENTERPRISE: {
    userLimit: null,
    environmentLimit: null,
    applicationLimit: null,
    configurationLimit: null,
  },
};
