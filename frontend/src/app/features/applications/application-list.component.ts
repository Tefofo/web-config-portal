import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ApplicationService } from '../../core/services/application.service';
import { EnvironmentService } from '../../core/services/environment.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { AuthService } from '../../core/auth/auth.service';
import { Application } from '../../core/models/application.model';
import { Environment } from '../../core/models/environment.model';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  ApplicationDialogResult,
  ApplicationFormDialogComponent,
} from './application-form-dialog.component';
import { ApiKeysDialogComponent, ApiKeysDialogData } from './api-keys-dialog.component';

@Component({
  selector: 'app-application-list',
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
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss',
})
export class ApplicationListComponent {
  private readonly service = inject(ApplicationService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);

  readonly columns = ['name', 'code', 'environment', 'status', 'actions'];
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly rows = signal<Application[]>([]);
  private readonly environments = signal<Environment[]>([]);

  readonly canManage = this.auth.hasPermission('application:manage');
  readonly canManageKeys = this.auth.hasPermission('apikey:manage');

  constructor() {
    this.fetch();
  }

  environmentName(id: string): string {
    return this.environments().find((e) => e.id === id)?.name ?? '—';
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      applications: this.service.list(),
      environments: this.environmentService.list(),
    }).subscribe({
      next: ({ applications, environments }) => {
        this.rows.set(applications);
        this.environments.set(environments);
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
      .open<ApplicationFormDialogComponent, ApiKeysDialogData | object, ApplicationDialogResult>(
        ApplicationFormDialogComponent,
        { width: '480px', data: { environments: this.environments() } },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.service
          .create({
            name: result.name,
            code: result.code,
            environmentId: result.environmentId,
            description: result.description || undefined,
            status: result.status,
          })
          .subscribe({
            next: () => {
              this.notifications.success('Application created successfully.');
              this.fetch();
            },
          });
      });
  }

  edit(row: Application): void {
    this.dialog
      .open<ApplicationFormDialogComponent, object, ApplicationDialogResult>(
        ApplicationFormDialogComponent,
        { width: '480px', data: { application: row, environments: this.environments() } },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.service
          .update(row.id, {
            name: result.name,
            description: result.description || undefined,
            status: result.status,
          })
          .subscribe({
            next: () => {
              this.notifications.success('Application updated successfully.');
              this.fetch();
            },
          });
      });
  }

  remove(row: Application): void {
    this.confirm
      .confirm({
        title: 'Delete Application',
        message: `Are you sure you want to delete "${row.name}"? This also revokes its API keys and cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.delete(row.id).subscribe({
          next: () => {
            this.notifications.success('Application deleted successfully.');
            this.fetch();
          },
        });
      });
  }

  manageKeys(row: Application): void {
    this.dialog.open<ApiKeysDialogComponent, ApiKeysDialogData>(ApiKeysDialogComponent, {
      width: '640px',
      data: { application: row },
    });
  }
}
