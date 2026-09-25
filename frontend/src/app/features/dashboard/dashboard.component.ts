import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { ConfigurationService } from '../../core/services/configuration.service';
import { EnvironmentService } from '../../core/services/environment.service';
import { UserService } from '../../core/services/user.service';
import { AuditService } from '../../core/services/audit.service';
import { Configuration } from '../../core/models/configuration.model';
import { Environment } from '../../core/models/environment.model';
import { AuditEvent } from '../../core/models/audit.model';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

interface SummaryCard {
  label: string;
  value: number;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatButtonModule,
    StatusChipComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly configurations = inject(ConfigurationService);
  private readonly environments = inject(EnvironmentService);
  private readonly users = inject(UserService);
  private readonly audit = inject(AuditService);

  readonly loading = signal(true);
  readonly error = signal(false);

  private readonly configs = signal<Configuration[]>([]);
  private readonly envs = signal<Environment[]>([]);
  private readonly userCount = signal(0);
  readonly recentChanges = signal<AuditEvent[]>([]);
  readonly recentActivity = signal<AuditEvent[]>([]);

  readonly environmentName = computed(() => {
    const map = new Map(this.envs().map((e) => [e.id, e.name]));
    return (id: string | null): string => (id ? (map.get(id) ?? '—') : '—');
  });

  readonly cards = computed<SummaryCard[]>(() => {
    const configs = this.configs();
    const active = configs.filter((c) => c.status === 'ACTIVE').length;
    return [
      { label: 'Total Configurations', value: configs.length, icon: 'tune', route: '/configuration' },
      { label: 'Active', value: active, icon: 'check_circle' },
      { label: 'Disabled', value: configs.length - active, icon: 'remove_circle_outline' },
      { label: 'Environments', value: this.envs().length, icon: 'dns', route: '/environments' },
      { label: 'Users', value: this.userCount(), icon: 'group', route: '/users' },
      { label: 'Recent Changes', value: this.recentChanges().length, icon: 'history', route: '/audit-log' },
    ];
  });

  readonly changeColumns = ['description', 'environment', 'user', 'action', 'date', 'result'];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      configs: this.configurations.list({ page: 1, pageSize: 1000 }),
      envs: this.environments.list(),
      users: this.users.list({ page: 1, pageSize: 1000 }),
      audit: this.audit.list({ page: 1, pageSize: 50 }),
    }).subscribe({
      next: ({ configs, envs, users, audit }) => {
        this.configs.set(configs.items);
        this.envs.set(envs);
        this.userCount.set(users.total);
        const changeActions = new Set(['CREATE', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE']);
        this.recentChanges.set(
          audit.items.filter((e) => e.entity === 'CONFIGURATION' && changeActions.has(e.action)).slice(0, 8),
        );
        this.recentActivity.set(audit.items.slice(0, 8));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
