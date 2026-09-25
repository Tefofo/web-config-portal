import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';

/** Maps HTTP status codes to user-friendly messages (no stack traces). */
function messageForStatus(error: HttpErrorResponse): string {
  const serverMessage =
    error.error && typeof error.error === 'object' && 'message' in error.error
      ? String((error.error as { message: unknown }).message)
      : null;

  switch (error.status) {
    case 0:
      return 'Network error. Please check your connection and try again.';
    case 400:
      return serverMessage ?? 'The request was invalid. Please review your input.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return serverMessage ?? 'The requested resource was not found.';
    case 409:
      return serverMessage ?? 'This action conflicts with the current state of the data.';
    case 422:
      return serverMessage ?? 'Validation failed. Please correct the highlighted fields.';
    case 500:
      return 'An unexpected server error occurred. Please try again later.';
    default:
      return serverMessage ?? 'Something went wrong. Please try again.';
  }
}

/**
 * Centralized HTTP error handling. Surfaces friendly messages via snackbar and
 * forces logout + redirect on 401. Errors are re-thrown so callers can still
 * react (e.g. keep a form in an error state).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = messageForStatus(error);

      if (error.status === 401) {
        auth.clearSession();
        // Avoid redirect loops on the login call itself.
        if (!req.url.endsWith('/auth/login')) {
          void router.navigate(['/login']);
        }
      }

      // Let the login form present its own inline error for bad credentials.
      const isLoginAttempt = req.url.endsWith('/auth/login') && error.status === 401;
      if (!isLoginAttempt) {
        notifications.error(message);
      }

      return throwError(() => error);
    }),
  );
};
