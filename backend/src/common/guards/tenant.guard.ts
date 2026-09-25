import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { RequestUser } from '../types/request-context';

/**
 * Ensures the authenticated user has a tenant context for tenant-scoped routes.
 * PLATFORM_ADMIN users have no tenant and must not hit tenant-scoped endpoints
 * directly — they use the platform administration endpoints instead.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }
    if (user.role === UserRole.PLATFORM_ADMIN || !user.tenantId) {
      throw new ForbiddenException('This resource requires a tenant context.');
    }
    return true;
  }
}

/** Narrows a RequestUser to one guaranteed to have a tenantId. */
export function requireTenant(user: RequestUser): string {
  if (!user.tenantId) {
    throw new ForbiddenException('This resource requires a tenant context.');
  }
  return user.tenantId;
}
