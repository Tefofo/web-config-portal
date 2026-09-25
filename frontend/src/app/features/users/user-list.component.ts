import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';
import { RoleCode, ROLE_LABELS } from '../../core/models/role.model';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import {
  UserDialogResult,
  UserFormDialogComponent,
} from './user-form-dialog.component';

@Component({
  selector: 'app-user-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent {
  private readonly service = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);

  readonly roleLabels = ROLE_LABELS;
  readonly roles: RoleCode[] = ['ADMINISTRATOR', 'CONFIGURATION_MANAGER', 'VIEWER'];
  readonly columns = ['name', 'email', 'role', 'status', 'lastLogin', 'created', 'actions'];

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly rows = signal<User[]>([]);
  readonly total = signal(0);
  readonly pageSize = signal(10);

  readonly canManage = this.auth.hasPermission('user:manage');

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly roleControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl('', { nonNullable: true });

  private page = 1;

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page = 1;
        this.fetch();
      });
    [this.roleControl, this.statusControl].forEach((c) =>
      c.valueChanges.subscribe(() => {
        this.page = 1;
        this.fetch();
      }),
    );
    this.fetch();
  }

  roleLabel(role: RoleCode): string {
    return ROLE_LABELS[role];
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service
      .list({
        page: this.page,
        pageSize: this.pageSize(),
        search: this.searchControl.value || undefined,
        role: this.roleControl.value || undefined,
        status: this.statusControl.value || undefined,
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

  create(): void {
    this.dialog
      .open<UserFormDialogComponent, unknown, UserDialogResult>(UserFormDialogComponent, {
        width: '480px',
        data: {},
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.service.create(result).subscribe({
          next: () => {
            this.notifications.success('User created successfully.');
            this.fetch();
          },
        });
      });
  }

  edit(row: User): void {
    this.dialog
      .open<UserFormDialogComponent, unknown, UserDialogResult>(UserFormDialogComponent, {
        width: '480px',
        data: { user: row },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.service.update(row.id, result).subscribe({
          next: () => {
            this.notifications.success('User updated successfully.');
            this.fetch();
          },
        });
      });
  }

  setActive(row: User, active: boolean): void {
    this.confirm
      .confirm({
        title: active ? 'Activate User' : 'Deactivate User',
        message: `Are you sure you want to ${active ? 'activate' : 'deactivate'} ${row.firstName} ${row.lastName}?`,
        confirmLabel: active ? 'Activate' : 'Deactivate',
        danger: !active,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const request = active ? this.service.activate(row.id) : this.service.deactivate(row.id);
        request.subscribe({
          next: () => {
            this.notifications.success(`User ${active ? 'activated' : 'deactivated'}.`);
            this.fetch();
          },
        });
      });
  }
}
