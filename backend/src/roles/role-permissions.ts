import { UserRole } from '@prisma/client';

/**
 * Canonical permission sets per customer role. PLATFORM_ADMIN is intentionally
 * excluded — it operates on platform endpoints, not tenant resources.
 * The backend enforces authorization via guards/@Roles; this map documents and
 * powers the roles API + frontend UX shaping.
 */
export type Permission = string;

export const ROLE_PERMISSIONS: Record<
  Exclude<UserRole, 'PLATFORM_ADMIN'>,
  Permission[]
> = {
  ADMIN: [
    'dashboard:view',
    'configuration:view',
    'configuration:create',
    'configuration:edit',
    'configuration:delete',
    'configuration:toggle',
    'environment:view',
    'environment:manage',
    'application:view',
    'application:manage',
    'apikey:manage',
    'user:view',
    'user:manage',
    'role:view',
    'audit:view',
    'subscription:view',
    'settings:manage',
  ],
  CONFIGURATION_MANAGER: [
    'dashboard:view',
    'configuration:view',
    'configuration:create',
    'configuration:edit',
    'configuration:toggle',
    'environment:view',
    'application:view',
    'audit:view',
    'subscription:view',
  ],
  VIEWER: [
    'dashboard:view',
    'configuration:view',
    'environment:view',
    'application:view',
    'audit:view',
    'subscription:view',
  ],
};

export interface RoleDefinition {
  code: UserRole;
  name: string;
  description: string;
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    code: UserRole.ADMIN,
    name: 'Administrator',
    description: 'Full access within the tenant.',
    permissions: ROLE_PERMISSIONS.ADMIN,
  },
  {
    code: UserRole.CONFIGURATION_MANAGER,
    name: 'Configuration Manager',
    description: 'Manage configurations and view operational data.',
    permissions: ROLE_PERMISSIONS.CONFIGURATION_MANAGER,
  },
  {
    code: UserRole.VIEWER,
    name: 'Viewer',
    description: 'Read-only access.',
    permissions: ROLE_PERMISSIONS.VIEWER,
  },
];
