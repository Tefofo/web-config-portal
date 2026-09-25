import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/auth/auth.service';
import {
  SubscriptionPlan,
  SubscriptionView,
  UsageMetric,
} from '../../core/models/subscription.model';
import { NotificationService } from '../../core/services/notification.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

interface UsageRow {
  label: string;
  used: number;
  limit: number | null;
  /** null limit -> unlimited (percent treated as 0 for the bar). */
  percent: number;
  unlimited: boolean;
  /** true when at/above the 80% warning threshold. */
  warn: boolean;
}

const WARN_THRESHOLD = 80;

@Component({
  selector: 'app-subscription-usage',
  imports: [
    DatePipe,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './subscription-usage.component.html',
  styleUrl: './subscription-usage.component.scss',
})
export class SubscriptionUsageComponent {
  private readonly service = inject(SubscriptionService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly upgrading = signal(false);
  readonly view = signal<SubscriptionView | null>(null);
  readonly usageRows = signal<UsageRow[]>([]);

  readonly canManage = this.auth.hasPermission('subscription:view') && this.auth.hasPermission('application:manage');

  constructor() {
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.current().subscribe({
      next: (view) => {
        this.view.set(view);
        this.usageRows.set(this.toRows(view));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  upgrade(): void {
    const current = this.view();
    if (!current || this.upgrading()) {
      return;
    }
    const next = this.nextPlan(current.subscription.plan);
    if (!next) {
      this.notifications.info('You are already on the highest available plan.');
      return;
    }
    this.upgrading.set(true);
    this.service.upgrade(next).subscribe({
      next: (result) => {
        this.notifications.info(`Upgrade request status: ${result.status}.`);
        this.upgrading.set(false);
      },
      error: () => this.upgrading.set(false),
    });
  }

  private nextPlan(current: SubscriptionPlan): SubscriptionPlan | null {
    const plans = this.view()?.availablePlans ?? [];
    const idx = plans.findIndex((p) => p.plan === current);
    if (idx === -1 || idx + 1 >= plans.length) {
      return null;
    }
    return plans[idx + 1].plan;
  }

  private toRows(view: SubscriptionView): UsageRow[] {
    const { usage } = view;
    return [
      this.metricRow('Users', usage.users),
      this.metricRow('Environments', usage.environments),
      this.metricRow('Applications', usage.applications),
      this.metricRow('Configurations', usage.configurations),
    ];
  }

  private metricRow(label: string, metric: UsageMetric): UsageRow {
    const unlimited = metric.limit === null;
    const percent = unlimited || metric.limit === 0
      ? 0
      : Math.min(100, Math.round((metric.used / (metric.limit as number)) * 100));
    return {
      label,
      used: metric.used,
      limit: metric.limit,
      percent,
      unlimited,
      warn: !unlimited && percent >= WARN_THRESHOLD,
    };
  }
}
