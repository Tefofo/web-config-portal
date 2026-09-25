import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Application, ApplicationStatus } from '../../core/models/application.model';
import { Environment } from '../../core/models/environment.model';

export interface ApplicationDialogData {
  application?: Application;
  environments: Environment[];
}

export interface ApplicationDialogResult {
  name: string;
  code: string;
  environmentId: string;
  description: string;
  status: ApplicationStatus;
}

@Component({
  selector: 'app-application-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './application-form-dialog.component.html',
})
export class ApplicationFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef =
    inject<MatDialogRef<ApplicationFormDialogComponent, ApplicationDialogResult>>(MatDialogRef);
  readonly data = inject<ApplicationDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = signal(!!this.data.application);
  readonly environments = this.data.environments;

  readonly form = this.fb.nonNullable.group({
    name: [this.data.application?.name ?? '', [Validators.required]],
    code: [
      this.data.application?.code ?? '',
      [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)],
    ],
    environmentId: [this.data.application?.environmentId ?? '', [Validators.required]],
    description: [this.data.application?.description ?? ''],
    status: [this.data.application?.status ?? ('ACTIVE' as ApplicationStatus), [Validators.required]],
  });

  constructor() {
    if (this.isEdit()) {
      // Code and environment are immutable after creation (backend PATCH ignores them).
      this.form.controls.code.disable();
      this.form.controls.environmentId.disable();
    }
  }

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
