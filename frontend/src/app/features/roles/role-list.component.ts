import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RoleService } from '../../core/services/role.service';
import {
  PermissionFeature,
  Role,
  ROLE_LABELS,
  RoleCode,
} from '../../core/models/role.model';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

interface MatrixRow {
  feature: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

const MATRIX_FEATURES: { key: PermissionFeature; label: string }[] = [
  { key: 'configuration', label: 'Configuration' },
  { key: 'environment', label: 'Environments' },
  { key: 'user', label: 'Users' },
  { key: 'role', label: 'Roles' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'settings', label: 'Settings' },
];

@Component({
  selector: 'app-role-list',
  imports: [
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MatProgressBarModule,
    StatusChipComponent,
  ],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent {
  private readonly service = inject(RoleService);

  readonly roleLabels = ROLE_LABELS;
  readonly roleColumns = ['name', 'description', 'permissions', 'users', 'status'];
  readonly matrixColumns = ['feature', 'view', 'create', 'edit', 'delete'];

  readonly loading = signal(true);
  readonly roles = signal<Role[]>([]);

  readonly matrices = computed(() => {
    const result: { role: Role; rows: MatrixRow[] }[] = [];
    for (const role of this.roles()) {
      const held = new Set(role.permissions);
      const rows = MATRIX_FEATURES.map((f) => ({
        feature: f.label,
        view: held.has(`${f.key}:view`),
        // "manage" implies create/edit/delete for admin-style features.
        create: held.has(`${f.key}:create`) || held.has(`${f.key}:manage`),
        edit: held.has(`${f.key}:edit`) || held.has(`${f.key}:manage`),
        delete: held.has(`${f.key}:delete`) || held.has(`${f.key}:manage`),
      }));
      result.push({ role, rows });
    }
    return result;
  });

  constructor() {
    this.service.list().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  roleLabel(code: RoleCode): string {
    return ROLE_LABELS[code];
  }
}
