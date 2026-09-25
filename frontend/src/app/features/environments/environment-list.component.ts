import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { EnvironmentService } from '../../core/services/environment.service';
import { ConfigurationService } from '../../core/services/configuration.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { AuthService } from '../../core/auth/auth.service';
import { Environment } from '../../core/models/environment.model';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  EnvironmentDialogResult,
  EnvironmentFormDialogComponent,
} from './environment-form-dialog.component';

@Component({
  selector: 'app-environment-list',
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './environment-list.component.html',
  styleUrl: './environment-list.component.scss',
})
export class EnvironmentListComponent {
  private readonly service = inject(EnvironmentService);
  private readonly configurations = inject(ConfigurationService);
  private readonly reference = inject(ReferenceDataService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);

  readonly columns = ['name', 'code', 'description', 'status', 'count', 'actions'];
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly rows = signal<Environment[]>([]);
  readonly counts = signal<Record<string, number>>({});

  readonly canManage = this.auth.hasPermission('environment:manage');

  constructor() {
    this.fetch();
  }

  configCount(id: string): number {
    return this.counts()[id] ?? 0;
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      environments: this.service.list(),
      configs: this.configurations.list({ page: 1, pageSize: 1000 }),
    }).subscribe({
      next: ({ environments, configs }) => {
        this.rows.set(environments);
        const counts: Record<string, number> = {};
        for (const cfg of configs.items) {
          counts[cfg.environmentId] = (counts[cfg.environmentId] ?? 0) + 1;
        }
        this.counts.set(counts);
        this.reference.invalidate();
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  create(): void {
    this.dialog
      .open<EnvironmentFormDialogComponent, unknown, EnvironmentDialogResult>(
        EnvironmentFormDialogComponent,
        { width: '480px', data: {} },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.service.create(result).subscribe({
          next: () => {
            this.notifications.success('Environment created successfully.');
            this.fetch();
          },
        });
      });
  }

  edit(row: Environment): void {
    this.dialog
      .open<EnvironmentFormDialogComponent, unknown, EnvironmentDialogResult>(
        EnvironmentFormDialogComponent,
        { width: '480px', data: { environment: row } },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.service.update(row.id, result).subscribe({
          next: () => {
            this.notifications.success('Environment updated successfully.');
            this.fetch();
          },
        });
      });
  }

  remove(row: Environment): void {
    if (this.configCount(row.id) > 0) {
      this.notifications.warning('Cannot delete an environment that still has configurations.');
      return;
    }
    this.confirm
      .confirm({
        title: 'Delete Environment',
        message: `Are you sure you want to delete "${row.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.delete(row.id).subscribe({
          next: () => {
            this.notifications.success('Environment deleted successfully.');
            this.fetch();
          },
        });
      });
  }
}
