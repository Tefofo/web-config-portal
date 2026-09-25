import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type Tone = 'success' | 'neutral' | 'warn' | 'error' | 'info';

const TONE_BY_STATUS: Record<string, Tone> = {
  ACTIVE: 'success',
  DISABLED: 'neutral',
  INACTIVE: 'neutral',
  PENDING: 'warn',
  ERROR: 'error',
  FAILURE: 'error',
  SUCCESS: 'success',
  REVOKED: 'error',
  EXPIRED: 'warn',
};

const ICON_BY_TONE: Record<Tone, string> = {
  success: 'check_circle',
  neutral: 'remove_circle_outline',
  warn: 'schedule',
  error: 'error',
  info: 'info',
};

/**
 * Status chip that conveys state via icon + text + colour (never colour alone),
 * satisfying the accessibility requirement.
 */
@Component({
  selector: 'app-status-chip',
  imports: [MatIconModule],
  template: `
    <span class="status-chip" [class]="'status-chip--' + tone()">
      <mat-icon class="status-chip__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <span>{{ label() }}</span>
    </span>
  `,
  styleUrl: './status-chip.component.scss',
})
export class StatusChipComponent {
  readonly status = input.required<string>();
  readonly label = computed(() => this.status());
  readonly tone = computed<Tone>(() => TONE_BY_STATUS[this.status()] ?? 'info');
  readonly icon = computed(() => ICON_BY_TONE[this.tone()]);
}
