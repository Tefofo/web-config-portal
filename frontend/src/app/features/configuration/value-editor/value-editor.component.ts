import { Component, forwardRef, input } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ConfigurationType } from '../../../core/models/configuration.model';

/**
 * Reusable, type-aware value editor. Renders a single input appropriate to the
 * configuration `type` and participates in reactive forms via
 * ControlValueAccessor. No per-type pages — the same component adapts.
 */
@Component({
  selector: 'app-value-editor',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDatepickerModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ValueEditorComponent),
      multi: true,
    },
  ],
  templateUrl: './value-editor.component.html',
  styleUrl: './value-editor.component.scss',
})
export class ValueEditorComponent implements ControlValueAccessor {
  readonly type = input.required<ConfigurationType>();
  readonly label = input('Value');
  /** Options for SELECT type. */
  readonly options = input<string[]>(['light', 'dark', 'system']);

  value: unknown = null;
  disabled = false;
  jsonError: string | null = null;

  private onChange: (value: unknown) => void = () => {
    /* replaced by registerOnChange */
  };
  private onTouched: () => void = () => {
    /* replaced by registerOnTouched */
  };

  writeValue(value: unknown): void {
    this.value = value;
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** JSON is edited as text; kept as the parsed object in the form value. */
  get jsonText(): string {
    if (this.value === null || this.value === undefined) return '';
    return typeof this.value === 'string' ? this.value : JSON.stringify(this.value, null, 2);
  }

  update(value: unknown): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  updateNumber(raw: string): void {
    this.update(raw === '' ? null : Number(raw));
  }

  updateJson(text: string): void {
    if (text.trim() === '') {
      this.jsonError = null;
      this.update(null);
      return;
    }
    try {
      const parsed: unknown = JSON.parse(text);
      this.jsonError = null;
      this.update(parsed);
    } catch {
      this.jsonError = 'Invalid JSON';
      // Keep the raw text so the user can fix it; store as string until valid.
      this.value = text;
      this.onChange(text);
      this.onTouched();
    }
  }
}
