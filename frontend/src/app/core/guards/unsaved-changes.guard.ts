import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmService } from '../../shared/services/confirm.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Prompts the user before leaving a component with unsaved changes.
 * The component must implement HasUnsavedChanges.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component,
): Observable<boolean> | boolean => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return inject(ConfirmService).confirm({
    title: 'Discard unsaved changes?',
    message: 'You have unsaved changes. Are you sure you want to leave this page?',
    confirmLabel: 'Discard',
    cancelLabel: 'Stay',
    danger: true,
  });
};
