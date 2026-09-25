import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ConfigurationService } from '../../core/services/configuration.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { AuthService } from '../../core/auth/auth.service';
import {
  Configuration,
  CONFIGURATION_TYPE_LABELS,
} from '../../core/models/configuration.model';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { ConfigValuePipe } from '../../shared/pipes/config-value.pipe';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-configuration-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    StatusChipComponent,
    ConfigValuePipe,
    HasPermissionDirective,
  ],
  templateUrl: './configuration-detail.component.html',
  styleUrl: './configuration-detail.component.scss',
})
export class ConfigurationDetailComponent {
  private readonly service = inject(ConfigurationService);
  private readonly reference = inject(ReferenceDataService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly typeLabels = CONFIGURATION_TYPE_LABELS;

  readonly loading = signal(true);
  readonly config = signal<Configuration | null>(null);

  readonly environmentName = computed(() =>
    this.reference.environmentName(this.config()?.environmentId),
  );
  readonly ownerName = computed(() => this.reference.userName(this.config()?.ownerId));
  readonly createdByName = computed(() => this.reference.userName(this.config()?.createdBy));
  readonly updatedByName = computed(() => this.reference.userName(this.config()?.updatedBy));

  constructor() {
    this.reference.ensureLoaded().subscribe();
    effect(() => {
      const id = this.id();
      if (id) {
        this.load(id);
      }
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.service.get(id).subscribe({
      next: (cfg) => {
        this.config.set(cfg);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  edit(): void {
    void this.router.navigate(['/configuration', this.id(), 'edit']);
  }
  duplicate(): void {
    void this.router.navigate(['/configuration', 'new'], { queryParams: { from: this.id() } });
  }

  toggle(): void {
    const cfg = this.config();
    if (!cfg) return;
    const disabling = cfg.status === 'ACTIVE';
    this.confirm
      .confirm({
        title: disabling ? 'Disable Configuration' : 'Enable Configuration',
        message: `Are you sure you want to ${disabling ? 'disable' : 'enable'} "${cfg.name}"?`,
        confirmLabel: disabling ? 'Disable' : 'Enable',
        danger: disabling,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const request = disabling ? this.service.disable(cfg.id) : this.service.enable(cfg.id);
        request.subscribe({
          next: (updated) => {
            this.config.set(updated);
            this.notifications.success(`Configuration ${disabling ? 'disabled' : 'enabled'}.`);
          },
        });
      });
  }

  remove(): void {
    const cfg = this.config();
    if (!cfg) return;
    this.confirm
      .confirm({
        title: 'Delete Configuration',
        message: `Are you sure you want to delete "${cfg.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.delete(cfg.id).subscribe({
          next: () => {
            this.notifications.success('Configuration deleted successfully.');
            void this.router.navigate(['/configuration']);
          },
        });
      });
  }

  get canToggle(): boolean {
    return this.auth.hasPermission('configuration:toggle');
  }
}
