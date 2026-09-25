import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService } from '../../core/services/settings.service';
import { EnvironmentService } from '../../core/services/environment.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import { Environment } from '../../core/models/environment.model';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SettingsService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly environments = signal<Environment[]>([]);

  readonly canManage = this.auth.hasPermission('settings:manage');

  readonly dateFormats = ['yyyy-MM-dd HH:mm', 'dd/MM/yyyy HH:mm', 'MM/dd/yyyy hh:mm a', 'medium', 'short'];

  readonly form = this.fb.nonNullable.group({
    applicationName: ['', [Validators.required]],
    defaultEnvironmentId: ['', [Validators.required]],
    sessionTimeoutMinutes: [30, [Validators.required, Validators.min(1), Validators.max(480)]],
    dateTimeFormat: ['yyyy-MM-dd HH:mm', [Validators.required]],
    defaultPageSize: [10, [Validators.required, Validators.min(5), Validators.max(100)]],
    enableAuditLogging: [true],
    enableNotifications: [true],
  });

  constructor() {
    this.environmentService.list().subscribe((envs) => this.environments.set(envs));
    this.service.get().subscribe({
      next: (settings) => {
        this.form.patchValue(settings);
        if (!this.canManage) {
          this.form.disable();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    if (this.form.invalid || this.saving() || !this.canManage) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.service.update(this.form.getRawValue()).subscribe({
      next: () => {
        this.notifications.success('Settings saved successfully.');
        this.form.markAsPristine();
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
