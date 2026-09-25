import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiKeyMetadata, CreatedApiKey } from '../../core/models/api-key.model';
import { Application } from '../../core/models/application.model';
import { AuthService } from '../../core/auth/auth.service';
import { ApplicationService } from '../../core/services/application.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

export interface ApiKeysDialogData {
  application: Application;
}

@Component({
  selector: 'app-api-keys-dialog',
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './api-keys-dialog.component.html',
  styleUrl: './api-keys-dialog.component.scss',
})
export class ApiKeysDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ApplicationService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly clipboard = inject(Clipboard);
  private readonly auth = inject(AuthService);
  readonly data = inject<ApiKeysDialogData>(MAT_DIALOG_DATA);

  readonly columns = ['name', 'prefix', 'created', 'lastUsed', 'expires', 'status', 'actions'];
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly rows = signal<ApiKeyMetadata[]>([]);
  readonly creating = signal(false);

  /** The most recently created key, shown once with its raw secret. */
  readonly revealedKey = signal<CreatedApiKey | null>(null);

  readonly canManage = this.auth.hasPermission('apikey:manage');
  readonly hasKeys = computed(() => this.rows().length > 0);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    expiresAt: this.fb.control<Date | null>(null),
  });

  constructor() {
    this.fetch();
  }

  keyStatus(row: ApiKeyMetadata): string {
    if (row.revokedAt) {
      return 'REVOKED';
    }
    if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
      return 'EXPIRED';
    }
    return 'ACTIVE';
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.listKeys(this.data.application.id).subscribe({
      next: (keys) => {
        this.rows.set(keys);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  create(): void {
    if (this.form.invalid || this.creating()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.creating.set(true);
    this.service
      .createKey(this.data.application.id, {
        name: raw.name,
        expiresAt: raw.expiresAt ? raw.expiresAt.toISOString() : undefined,
      })
      .subscribe({
        next: (created) => {
          this.revealedKey.set(created);
          this.notifications.success('API key created. Copy it now — it will not be shown again.');
          this.form.reset({ name: '', expiresAt: null });
          this.creating.set(false);
          this.fetch();
        },
        error: () => this.creating.set(false),
      });
  }

  copyKey(): void {
    const key = this.revealedKey()?.key;
    if (key && this.clipboard.copy(key)) {
      this.notifications.success('API key copied to clipboard.');
    }
  }

  dismissRevealed(): void {
    this.revealedKey.set(null);
  }

  revoke(row: ApiKeyMetadata): void {
    this.confirm
      .confirm({
        title: 'Revoke API key',
        message: `Revoke "${row.name}"? Applications using this key will immediately lose access. This cannot be undone.`,
        confirmLabel: 'Revoke',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.revokeKey(this.data.application.id, row.id).subscribe({
          next: () => {
            this.notifications.success('API key revoked.');
            this.fetch();
          },
        });
      });
  }
}
