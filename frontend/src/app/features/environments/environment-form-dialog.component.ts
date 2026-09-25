import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Environment, EnvironmentType } from '../../core/models/environment.model';

export interface EnvironmentDialogData {
  environment?: Environment;
}

export interface EnvironmentDialogResult {
  name: string;
  code: string;
  type: EnvironmentType;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-environment-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './environment-form-dialog.component.html',
})
export class EnvironmentFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef =
    inject<MatDialogRef<EnvironmentFormDialogComponent, EnvironmentDialogResult>>(MatDialogRef);
  readonly data = inject<EnvironmentDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = signal(!!this.data.environment);
  readonly types: EnvironmentType[] = ['DEVELOPMENT', 'TESTING', 'STAGING', 'PRODUCTION'];

  readonly form = this.fb.nonNullable.group({
    name: [this.data.environment?.name ?? '', [Validators.required]],
    code: [this.data.environment?.code ?? '', [Validators.required, Validators.pattern(/^[A-Z0-9_]{2,10}$/)]],
    type: [this.data.environment?.type ?? ('DEVELOPMENT' as EnvironmentType), [Validators.required]],
    description: [this.data.environment?.description ?? ''],
    status: [this.data.environment?.status ?? ('ACTIVE' as 'ACTIVE' | 'INACTIVE'), [Validators.required]],
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
