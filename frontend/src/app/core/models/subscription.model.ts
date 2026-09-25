export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' | string;

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | string;

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  userLimit: number;
  environmentLimit: number;
  applicationLimit: number;
  /** Null means unlimited. */
  configurationLimit: number | null;
  startDate: string;
  endDate: string;
}

/** A single usage counter. A null `limit` means unlimited. */
export interface UsageMetric {
  used: number;
  limit: number | null;
}

/** Snapshot of usage across all metered resources. */
export interface UsageSnapshot {
  users: UsageMetric;
  environments: UsageMetric;
  applications: UsageMetric;
  configurations: UsageMetric;
}

export interface PlanOption {
  plan: SubscriptionPlan;
  limits: {
    userLimit: number;
    environmentLimit: number;
    applicationLimit: number;
    configurationLimit: number | null;
  };
}

/** Aggregate response from GET /subscriptions/current. */
export interface SubscriptionView {
  subscription: Subscription;
  usage: UsageSnapshot;
  availablePlans: PlanOption[];
}

export interface UpgradeSubscriptionRequest {
  targetPlan: SubscriptionPlan;
}

export interface UpgradeSubscriptionResult {
  status: string;
}
