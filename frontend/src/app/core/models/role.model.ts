/**
 * Role and permission model.
 *
 * Permissions are expressed as `feature:action` tuples so they can be checked
 * uniformly in the UI and in route guards. Frontend authorization is NOT a
 * security boundary — the backend must enforce all permissions. These checks
 * exist purely to shape the UX.
 */

export type RoleCode = 'ADMINISTRATOR' | 'CONFIGURATION_MANAGER' | 'VIEWER';

export type PermissionFeature =
  | 'dashboard'
  | 'configuration'
  | 'environment'
  | 'user'
  | 'role'
  | 'audit'
  | 'settings'
  | 'application'
  | 'apikey'
  | 'subscription';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'toggle' // enable/disable
  | 'manage';

/** A permission string in the form `feature:action`, e.g. `configuration:edit`. */
export type Permission = `${PermissionFeature}:${PermissionAction}`;

export interface Role {
  id: string;
  code: RoleCode;
  name: string;
  description: string;
  permissions: Permission[];
  status: 'ACTIVE' | 'INACTIVE';
  userCount: number;
}

/**
 * Canonical permission sets per role, derived directly from the specification.
 * Kept as a single source of truth so UI and guards agree.
 */
export const ROLE_PERMISSIONS: Record<RoleCode, Permission[]> = {
  ADMINISTRATOR: [
    'dashboard:view',
    'configuration:view',
    'configuration:create',
    'configuration:edit',
    'configuration:delete',
    'configuration:toggle',
    'environment:view',
    'environment:manage',
    'user:view',
    'user:manage',
    'role:view',
    'role:manage',
    'audit:view',
    'settings:view',
    'settings:manage',
    'application:view',
    'application:manage',
    'apikey:manage',
    'subscription:view',
  ],
  CONFIGURATION_MANAGER: [
    'dashboard:view',
    'configuration:view',
    'configuration:create',
    'configuration:edit',
    'configuration:toggle',
    'environment:view',
    'audit:view',
    'application:view',
    'subscription:view',
  ],
  VIEWER: [
    'dashboard:view',
    'configuration:view',
    'environment:view',
    'audit:view',
    'application:view',
    'subscription:view',
  ],
};

export const ROLE_LABELS: Record<RoleCode, string> = {
  ADMINISTRATOR: 'Administrator',
  CONFIGURATION_MANAGER: 'Configuration Manager',
  VIEWER: 'Viewer',
};

/**
 * Normalizes a role string from any source (the real backend uses `ADMIN` and
 * `PLATFORM_ADMIN`; the mock/legacy data uses `ADMINISTRATOR`) to the frontend
 * RoleCode used for permission lookups. Unknown roles fall back to VIEWER
 * (least privilege) so a malformed role never grants elevated access.
 */
export function normalizeRole(role: string): RoleCode {
  switch (role) {
    case 'ADMINISTRATOR':
    case 'ADMIN':
    case 'PLATFORM_ADMIN':
      return 'ADMINISTRATOR';
    case 'CONFIGURATION_MANAGER':
      return 'CONFIGURATION_MANAGER';
    case 'VIEWER':
      return 'VIEWER';
    default:
      return 'VIEWER';
  }
}
