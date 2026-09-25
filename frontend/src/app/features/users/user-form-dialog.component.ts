import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { User, UserStatus } from '../../core/models/user.model';
import { RoleCode, ROLE_LABELS } from '../../core/models/role.model';

export interface UserDialogData {
  user?: User;
}

export interface UserDialogResult {
  firstName: string;
  lastName: string;
  email: string;
  role: RoleCode;
  status: UserStatus;
}

@Component({
  selector: 'app-user-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './user-form-dialog.component.html',
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef =
    inject<MatDialogRef<UserFormDialogComponent, UserDialogResult>>(MatDialogRef);
  readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = signal(!!this.data.user);
  readonly roleLabels = ROLE_LABELS;
  readonly roles: RoleCode[] = ['ADMINISTRATOR', 'CONFIGURATION_MANAGER', 'VIEWER'];

  readonly form = this.fb.nonNullable.group({
    firstName: [this.data.user?.firstName ?? '', [Validators.required]],
    lastName: [this.data.user?.lastName ?? '', [Validators.required]],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    role: [this.data.user?.role ?? ('VIEWER' as RoleCode), [Validators.required]],
    status: [this.data.user?.status ?? ('ACTIVE' as UserStatus), [Validators.required]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
