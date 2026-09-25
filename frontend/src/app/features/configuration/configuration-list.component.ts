import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ConfigurationService } from '../../core/services/configuration.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import {
  Configuration,
  CONFIGURATION_TYPE_LABELS,
  ConfigurationStatus,
  ConfigurationType,
} from '../../core/models/configuration.model';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ConfigValuePipe } from '../../shared/pipes/config-value.pipe';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-configuration-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    StatusChipComponent,
    EmptyStateComponent,
    ConfigValuePipe,
    HasPermissionDirective,
  ],
  templateUrl: './configuration-list.component.html',
  styleUrl: './configuration-list.component.scss',
})
export class ConfigurationListComponent {
  private readonly service = inject(ConfigurationService);
  private readonly reference = inject(ReferenceDataService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  readonly typeLabels = CONFIGURATION_TYPE_LABELS;
  readonly types: ConfigurationType[] = ['STRING', 'NUMBER', 'BOOLEAN', 'SELECT', 'DATE', 'JSON'];
  readonly statuses: ConfigurationStatus[] = ['ACTIVE', 'DISABLED'];

  readonly columns = [
    'name',
    'key',
    'category',
    'environment',
    'type',
    'value',
    'status',
    'owner',
    'updatedAt',
    'actions',
  ];

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly rows = signal<Configuration[]>([]);
  readonly total = signal(0);
  readonly categories = signal<string[]>([]);

  readonly environments = this.reference.environments;
  readonly users = this.reference.users;

  readonly canCreate = this.auth.hasPermission('configuration:create');

  // Filter controls.
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly categoryControl = new FormControl('', { nonNullable: true });
  readonly environmentControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl('', { nonNullable: true });
  readonly typeControl = new FormControl('', { nonNullable: true });
  readonly ownerControl = new FormControl('', { nonNullable: true });

  readonly pageSize = signal(10);
  private page = 1;
  private sortBy = 'name';
  private sortDir: 'asc' | 'desc' = 'asc';

  constructor() {
    this.reference.ensureLoaded().subscribe();
    // Re-fetch on any filter change (search is already debounced via signal).
    [
      this.categoryControl,
      this.environmentControl,
      this.statusControl,
      this.typeControl,
      this.ownerControl,
    ].forEach((control) =>
      control.valueChanges.subscribe(() => {
        this.page = 1;
        this.fetch();
      }),
    );
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.fetch();
    });
    this.fetch();
  }

  typeLabel(type: ConfigurationType): string {
    return CONFIGURATION_TYPE_LABELS[type];
  }

  environmentName(id: string): string {
    return this.reference.environmentName(id);
  }
  ownerName(id: string): string {
    return this.reference.userName(id);
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service
      .list({
        page: this.page,
        pageSize: this.pageSize(),
        search: this.searchControl.value || undefined,
        category: this.categoryControl.value || undefined,
        environmentId: this.environmentControl.value || undefined,
        status: this.statusControl.value || undefined,
        type: this.typeControl.value || undefined,
        ownerId: this.ownerControl.value || undefined,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.total.set(result.total);
          this.categories.set([...new Set(result.items.map((c) => c.category))]);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  onSort(sort: Sort): void {
    this.sortBy = sort.active || 'name';
    this.sortDir = sort.direction === 'desc' ? 'desc' : 'asc';
    this.fetch();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize.set(event.pageSize);
    this.fetch();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.categoryControl.value ||
      this.environmentControl.value ||
      this.statusControl.value ||
      this.typeControl.value ||
      this.ownerControl.value
    );
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.environmentControl.setValue('');
    this.statusControl.setValue('');
    this.typeControl.setValue('');
    this.ownerControl.setValue('');
    this.page = 1;
    this.fetch();
  }

  view(row: Configuration): void {
    void this.router.navigate(['/configuration', row.id]);
  }
  edit(row: Configuration): void {
    void this.router.navigate(['/configuration', row.id, 'edit']);
  }
  duplicate(row: Configuration): void {
    void this.router.navigate(['/configuration', 'new'], { queryParams: { from: row.id } });
  }

  toggle(row: Configuration): void {
    const disabling = row.status === 'ACTIVE';
    this.confirm
      .confirm({
        title: disabling ? 'Disable Configuration' : 'Enable Configuration',
        message: `Are you sure you want to ${disabling ? 'disable' : 'enable'} "${row.name}"?`,
        confirmLabel: disabling ? 'Disable' : 'Enable',
        danger: disabling,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const request = disabling ? this.service.disable(row.id) : this.service.enable(row.id);
        request.subscribe({
          next: () => {
            this.notifications.success(`Configuration ${disabling ? 'disabled' : 'enabled'}.`);
            this.fetch();
          },
        });
      });
  }

  remove(row: Configuration): void {
    this.confirm
      .confirm({
        title: 'Delete Configuration',
        message: `Are you sure you want to delete "${row.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.delete(row.id).subscribe({
          next: () => {
            this.notifications.success('Configuration deleted successfully.');
            this.fetch();
          },
        });
      });
  }
}
