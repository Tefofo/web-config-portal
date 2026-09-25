import { Component, computed, effect, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ConfigurationService } from '../../core/services/configuration.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  Configuration,
  CONFIGURATION_TYPE_LABELS,
  ConfigurationType,
} from '../../core/models/configuration.model';
import { ValueEditorComponent } from './value-editor/value-editor.component';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';

const KEY_PATTERN = /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/;

@Component({
  selector: 'app-configuration-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    ValueEditorComponent,
  ],
  templateUrl: './configuration-form.component.html',
  styleUrl: './configuration-form.component.scss',
})
export class ConfigurationFormComponent implements HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ConfigurationService);
  private readonly reference = inject(ReferenceDataService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  /** Route param — present in edit mode. Bound via withComponentInputBinding. */
  readonly id = input<string>();
  /** Query param — source id when duplicating. */
  readonly from = input<string>();

  readonly typeLabels = CONFIGURATION_TYPE_LABELS;
  readonly types: ConfigurationType[] = ['STRING', 'NUMBER', 'BOOLEAN', 'SELECT', 'DATE', 'JSON'];

  readonly environments = this.reference.environments;
  readonly users = this.reference.users;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly mode = signal<'create' | 'edit' | 'duplicate'>('create');
  private saved = false;
  private existingKeys: { key: string; environmentId: string }[] = [];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    key: ['', [Validators.required, Validators.pattern(KEY_PATTERN)]],
    description: [''],
    category: ['', [Validators.required]],
    environmentId: ['', [Validators.required]],
    type: ['STRING' as ConfigurationType, [Validators.required]],
    value: [null as unknown, [Validators.required]],
    defaultValue: [null as unknown],
    ownerId: ['', [Validators.required]],
    status: ['ACTIVE' as Configuration['status'], [Validators.required]],
  });

  readonly currentType = signal<ConfigurationType>('STRING');

  readonly title = computed(() => {
    switch (this.mode()) {
      case 'edit':
        return 'Edit Configuration';
      case 'duplicate':
        return 'Duplicate Configuration';
      default:
        return 'Create Configuration';
    }
  });

  constructor() {
    this.reference.ensureLoaded().subscribe();
    // Keep the value editor in sync with the selected type; reset value when
    // the type changes so we don't carry an incompatible value.
    this.form.controls.type.valueChanges.subscribe((type) => {
      if (type !== this.currentType()) {
        this.currentType.set(type);
        this.form.controls.value.reset(defaultForType(type));
      }
    });
    // Add async-ish duplicate key validator using the loaded key list.
    this.form.controls.key.addValidators((control) => this.duplicateKeyValidator(control));

    // React to route inputs (edit id / duplicate from).
    effect(() => {
      const editId = this.id();
      const fromId = this.from();
      if (editId) {
        this.mode.set('edit');
        this.loadForEdit(editId);
      } else if (fromId) {
        this.mode.set('duplicate');
        this.loadForDuplicate(fromId);
      } else {
        this.mode.set('create');
      }
    });

    // Cache all keys for duplicate detection.
    this.service.list({ page: 1, pageSize: 1000 }).subscribe((result) => {
      this.existingKeys = result.items.map((c) => ({ key: c.key, environmentId: c.environmentId }));
      this.form.controls.key.updateValueAndValidity();
    });
  }

  get isEdit(): boolean {
    return this.mode() === 'edit';
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving() && !this.saved;
  }

  private duplicateKeyValidator(control: AbstractControl): ValidationErrors | null {
    const key = control.value as string;
    if (!key) return null;
    const environmentId = this.form?.controls.environmentId.value;
    const currentId = this.id();
    const clash = this.existingKeys.some(
      (entry) =>
        entry.key === key &&
        (!environmentId || entry.environmentId === environmentId) &&
        // In edit mode the record keeps its own key; ignore self.
        !(this.isEdit && currentId),
    );
    return clash ? { duplicateKey: true } : null;
  }

  private loadForEdit(id: string): void {
    this.loading.set(true);
    this.service.get(id).subscribe({
      next: (cfg) => {
        this.currentType.set(cfg.type);
        this.form.patchValue({
          name: cfg.name,
          key: cfg.key,
          description: cfg.description ?? '',
          category: cfg.category,
          environmentId: cfg.environmentId,
          type: cfg.type,
          value: cfg.value,
          defaultValue: cfg.defaultValue ?? null,
          ownerId: cfg.ownerId,
          status: cfg.status,
        });
        // Key and environment are immutable in edit mode.
        this.form.controls.key.disable();
        this.form.controls.environmentId.disable();
        this.form.controls.type.disable();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadForDuplicate(id: string): void {
    this.loading.set(true);
    this.service.get(id).subscribe({
      next: (cfg) => {
        this.currentType.set(cfg.type);
        this.form.patchValue({
          name: `${cfg.name} (copy)`,
          key: `${cfg.key}_copy`,
          description: cfg.description ?? '',
          category: cfg.category,
          environmentId: cfg.environmentId,
          type: cfg.type,
          value: cfg.value,
          defaultValue: cfg.defaultValue ?? null,
          ownerId: cfg.ownerId,
          status: cfg.status,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();

    if (this.isEdit) {
      const id = this.id() as string;
      this.service
        .update(id, {
          name: raw.name,
          description: raw.description,
          category: raw.category,
          type: raw.type,
          value: raw.value,
          defaultValue: raw.defaultValue,
          ownerId: raw.ownerId,
          status: raw.status,
        })
        .subscribe({
          next: () => this.onSaved('Configuration updated successfully.'),
          error: () => this.saving.set(false),
        });
      return;
    }

    this.service
      .create({
        name: raw.name,
        key: raw.key,
        description: raw.description,
        category: raw.category,
        environmentId: raw.environmentId,
        type: raw.type,
        value: raw.value,
        defaultValue: raw.defaultValue,
        ownerId: raw.ownerId,
        status: raw.status,
      })
      .subscribe({
        next: () => this.onSaved('Configuration created successfully.'),
        error: () => this.saving.set(false),
      });
  }

  private onSaved(message: string): void {
    this.saved = true;
    this.saving.set(false);
    this.notifications.success(message);
    void this.router.navigate(['/configuration']);
  }
}

function defaultForType(type: ConfigurationType): unknown {
  switch (type) {
    case 'BOOLEAN':
      return false;
    case 'NUMBER':
      return null;
    case 'JSON':
      return null;
    default:
      return null;
  }
}
