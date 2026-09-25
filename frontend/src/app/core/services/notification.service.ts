import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationKind = 'success' | 'error' | 'warning' | 'info';

/**
 * Thin wrapper over MatSnackBar providing semantic notification methods and
 * consistent styling/duration. A CSS class per kind lets styles.scss colour
 * the snackbar without relying on colour alone (an icon prefix is included).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 8000);
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  private show(message: string, kind: NotificationKind, duration = 4000): void {
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`wcp-snackbar`, `wcp-snackbar--${kind}`],
    };
    this.snackBar.open(message, 'Dismiss', config);
  }
}
