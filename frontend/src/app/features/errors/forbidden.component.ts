import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="forbidden">
      <mat-icon aria-hidden="true">block</mat-icon>
      <h1>Access denied</h1>
      <p>You do not have permission to view this page.</p>
      <a mat-flat-button color="primary" routerLink="/dashboard">Back to dashboard</a>
    </div>
  `,
  styles: [
    `
      .forbidden {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 4rem 1rem;
        text-align: center;
        mat-icon {
          font-size: 3rem;
          width: 3rem;
          height: 3rem;
          color: var(--mat-sys-error);
        }
      }
    `,
  ],
})
export class ForbiddenComponent {}
