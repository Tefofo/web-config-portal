import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AuditService } from '../../core/services/audit.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { AuditAction, AuditEntity, AuditEvent } from '../../core/models/audit.model';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-audit-log',
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent {
  private readonly service = inject(AuditService);
  private readonly reference = inject(ReferenceDataService);

  readonly columns = [
    'timestamp',
    'user',
    'action',
    'entity',
    'entityId',
    'environment',
    'description',
    'result',
  ];

  readonly actions: AuditAction[] = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'ENABLE',
    'DISABLE',
    'LOGIN',
    'LOGOUT',
  ];
  readonly entities: AuditEntity[] = ['CONFIGURATION', 'ENVIRONMENT', 'USER', 'ROLE', 'SETTINGS', 'AUTH'];

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly rows = signal<AuditEvent[]>([]);
  readonly total = signal(0);
  readonly pageSize = signal(10);

  readonly users = this.reference.users;
  readonly environments = this.reference.environments;

  readonly filters = new FormGroup({
    userId: new FormControl('', { nonNullable: true }),
    action: new FormControl('', { nonNullable: true }),
    entity: new FormControl('', { nonNullable: true }),
    environmentId: new FormControl('', { nonNullable: true }),
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  private page = 1;

  constructor() {
    this.reference.ensureLoaded().subscribe();
    this.filters.valueChanges.subscribe(() => {
      this.page = 1;
      this.fetch();
    });
    this.fetch();
  }

  environmentName(id: string | null): string {
    return id ? this.reference.environmentName(id) : '—';
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(false);
    const { userId, action, entity, environmentId, from, to } = this.filters.getRawValue();
    this.service
      .list({
        page: this.page,
        pageSize: this.pageSize(),
        userId: userId || undefined,
        action: action || undefined,
        entity: entity || undefined,
        environmentId: environmentId || undefined,
        from: from ? from.toISOString() : undefined,
        to: to ? to.toISOString() : undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize.set(event.pageSize);
    this.fetch();
  }

  hasActiveFilters(): boolean {
    const v = this.filters.getRawValue();
    return !!(v.userId || v.action || v.entity || v.environmentId || v.from || v.to);
  }

  clearFilters(): void {
    this.filters.reset({
      userId: '',
      action: '',
      entity: '',
      environmentId: '',
      from: null,
      to: null,
    });
  }
}
