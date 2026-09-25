import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Permission } from '../models/role.model';

/**
 * Route guard factory enforcing that the user holds at least one of the
 * required permissions. Use on protected feature routes.
 *
 * Example: `canActivate: [permissionGuard('user:manage')]`
 */
export function permissionGuard(...required: Permission[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    if (auth.hasAnyPermission(required)) {
      return true;
    }
    return router.createUrlTree(['/forbidden']);
  };
}
