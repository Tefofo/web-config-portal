import { AuditEvent } from '../models/audit.model';
import { Configuration } from '../models/configuration.model';
import { Environment } from '../models/environment.model';
import { Role, ROLE_LABELS, ROLE_PERMISSIONS } from '../models/role.model';
import { SystemSettings } from '../models/settings.model';
import { User } from '../models/user.model';

/**
 * In-memory seed data for the mock backend. All data is fictional.
 * Passwords are intentionally NOT stored here; mock auth accepts any of the
 * seeded emails with the shared demo password (see MockAuthCredentials).
 */

export const MOCK_DEMO_PASSWORD = 'password123';

export const MOCK_ENVIRONMENTS: Environment[] = [
  {
    id: 'env-dev',
    name: 'Development',
    code: 'DEV',
    type: 'DEVELOPMENT',
    description: 'Local and shared development environment.',
    status: 'ACTIVE',
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-06-01T08:00:00.000Z',
  },
  {
    id: 'env-test',
    name: 'Testing',
    code: 'TEST',
    type: 'TESTING',
    description: 'Automated and QA testing environment.',
    status: 'ACTIVE',
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-06-01T08:00:00.000Z',
  },
  {
    id: 'env-stage',
    name: 'Staging',
    code: 'STG',
    type: 'STAGING',
    description: 'Pre-production staging environment.',
    status: 'ACTIVE',
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-06-01T08:00:00.000Z',
  },
  {
    id: 'env-prod',
    name: 'Production',
    code: 'PROD',
    type: 'PRODUCTION',
    description: 'Live production environment.',
    status: 'ACTIVE',
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-06-01T08:00:00.000Z',
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    firstName: 'Amara',
    lastName: 'Okafor',
    email: 'admin@portal.dev',
    role: 'ADMINISTRATOR',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-24T07:30:00.000Z',
    createdAt: '2025-01-10T09:00:00.000Z',
  },
  {
    id: 'user-2',
    firstName: 'Lerato',
    lastName: 'Molefe',
    email: 'manager@portal.dev',
    role: 'CONFIGURATION_MANAGER',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-23T14:12:00.000Z',
    createdAt: '2025-02-14T09:00:00.000Z',
  },
  {
    id: 'user-3',
    firstName: 'Sipho',
    lastName: 'Ndlovu',
    email: 'viewer@portal.dev',
    role: 'VIEWER',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-20T11:05:00.000Z',
    createdAt: '2025-03-01T09:00:00.000Z',
  },
  {
    id: 'user-4',
    firstName: 'Chloe',
    lastName: 'Bennett',
    email: 'chloe.bennett@portal.dev',
    role: 'CONFIGURATION_MANAGER',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-19T16:45:00.000Z',
    createdAt: '2025-03-18T09:00:00.000Z',
  },
  {
    id: 'user-5',
    firstName: 'Rajesh',
    lastName: 'Iyer',
    email: 'rajesh.iyer@portal.dev',
    role: 'VIEWER',
    status: 'INACTIVE',
    lastLoginAt: '2026-05-02T10:00:00.000Z',
    createdAt: '2025-04-22T09:00:00.000Z',
  },
  {
    id: 'user-6',
    firstName: 'Fatima',
    lastName: 'Al-Sayed',
    email: 'fatima.alsayed@portal.dev',
    role: 'ADMINISTRATOR',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-25T06:15:00.000Z',
    createdAt: '2025-05-30T09:00:00.000Z',
  },
  {
    id: 'user-7',
    firstName: 'Diego',
    lastName: 'Fernandez',
    email: 'diego.fernandez@portal.dev',
    role: 'CONFIGURATION_MANAGER',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-18T13:30:00.000Z',
    createdAt: '2025-06-11T09:00:00.000Z',
  },
  {
    id: 'user-8',
    firstName: 'Mei',
    lastName: 'Tanaka',
    email: 'mei.tanaka@portal.dev',
    role: 'VIEWER',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-22T08:50:00.000Z',
    createdAt: '2025-07-07T09:00:00.000Z',
  },
];

export const MOCK_ROLES: Role[] = (
  ['ADMINISTRATOR', 'CONFIGURATION_MANAGER', 'VIEWER'] as const
).map((code, index) => ({
  id: `role-${index + 1}`,
  code,
  name: ROLE_LABELS[code],
  description:
    code === 'ADMINISTRATOR'
      ? 'Full access to all portal features and administration.'
      : code === 'CONFIGURATION_MANAGER'
        ? 'Manage configurations and view operational data.'
        : 'Read-only access to portal data.',
  permissions: ROLE_PERMISSIONS[code],
  status: 'ACTIVE',
  userCount: MOCK_USERS.filter((u) => u.role === code).length,
}));

function config(partial: Omit<Configuration, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Configuration {
  return {
    ...partial,
    createdAt: '2025-08-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    createdBy: 'user-1',
    updatedBy: 'user-2',
  };
}

export const MOCK_CONFIGURATIONS: Configuration[] = [
  config({ id: 'cfg-1', name: 'Feature: New Dashboard', key: 'feature.new_dashboard', description: 'Enables the redesigned dashboard.', category: 'Features', environmentId: 'env-prod', type: 'BOOLEAN', value: true, defaultValue: false, status: 'ACTIVE', ownerId: 'user-1' }),
  config({ id: 'cfg-2', name: 'Max Upload Size (MB)', key: 'upload.max_size_mb', description: 'Maximum allowed upload size.', category: 'Limits', environmentId: 'env-prod', type: 'NUMBER', value: 50, defaultValue: 25, status: 'ACTIVE', ownerId: 'user-2' }),
  config({ id: 'cfg-3', name: 'Support Email', key: 'support.email', description: 'Public support contact address.', category: 'General', environmentId: 'env-prod', type: 'STRING', value: 'support@portal.dev', defaultValue: 'help@portal.dev', status: 'ACTIVE', ownerId: 'user-1' }),
  config({ id: 'cfg-4', name: 'Default Theme', key: 'ui.default_theme', description: 'Default UI theme for new users.', category: 'UI', environmentId: 'env-prod', type: 'SELECT', value: 'light', defaultValue: 'light', status: 'ACTIVE', ownerId: 'user-4' }),
  config({ id: 'cfg-5', name: 'Maintenance Window', key: 'ops.maintenance_window', description: 'Next scheduled maintenance.', category: 'Operations', environmentId: 'env-prod', type: 'DATE', value: '2026-10-15', status: 'DISABLED', ownerId: 'user-6' }),
  config({ id: 'cfg-6', name: 'Rate Limit Rules', key: 'api.rate_limits', description: 'Per-tier API rate limits.', category: 'API', environmentId: 'env-prod', type: 'JSON', value: { free: 60, pro: 600, enterprise: 6000 }, status: 'ACTIVE', ownerId: 'user-2' }),
  config({ id: 'cfg-7', name: 'Feature: Beta Search', key: 'feature.beta_search', description: 'Experimental search engine.', category: 'Features', environmentId: 'env-stage', type: 'BOOLEAN', value: true, defaultValue: false, status: 'ACTIVE', ownerId: 'user-7' }),
  config({ id: 'cfg-8', name: 'Session Timeout (min)', key: 'security.session_timeout', description: 'Idle session timeout.', category: 'Security', environmentId: 'env-stage', type: 'NUMBER', value: 30, defaultValue: 15, status: 'ACTIVE', ownerId: 'user-1' }),
  config({ id: 'cfg-9', name: 'Welcome Message', key: 'ui.welcome_message', description: 'Login page banner text.', category: 'UI', environmentId: 'env-stage', type: 'STRING', value: 'Welcome to the staging portal', status: 'ACTIVE', ownerId: 'user-4' }),
  config({ id: 'cfg-10', name: 'Log Level', key: 'ops.log_level', description: 'Application log verbosity.', category: 'Operations', environmentId: 'env-test', type: 'SELECT', value: 'debug', defaultValue: 'info', status: 'ACTIVE', ownerId: 'user-7' }),
  config({ id: 'cfg-11', name: 'Feature: Bulk Export', key: 'feature.bulk_export', description: 'Allow bulk data export.', category: 'Features', environmentId: 'env-test', type: 'BOOLEAN', value: false, defaultValue: false, status: 'DISABLED', ownerId: 'user-2' }),
  config({ id: 'cfg-12', name: 'Cache TTL (s)', key: 'perf.cache_ttl', description: 'Cache time-to-live seconds.', category: 'Performance', environmentId: 'env-test', type: 'NUMBER', value: 120, defaultValue: 60, status: 'ACTIVE', ownerId: 'user-1' }),
  config({ id: 'cfg-13', name: 'Feature: New Dashboard', key: 'feature.new_dashboard', description: 'Enables the redesigned dashboard.', category: 'Features', environmentId: 'env-dev', type: 'BOOLEAN', value: true, defaultValue: false, status: 'ACTIVE', ownerId: 'user-4' }),
  config({ id: 'cfg-14', name: 'Sandbox API Base', key: 'api.sandbox_base_url', description: 'Sandbox API endpoint.', category: 'API', environmentId: 'env-dev', type: 'STRING', value: 'https://sandbox.api.portal.dev', status: 'ACTIVE', ownerId: 'user-7' }),
  config({ id: 'cfg-15', name: 'Retry Policy', key: 'api.retry_policy', description: 'HTTP retry configuration.', category: 'API', environmentId: 'env-dev', type: 'JSON', value: { retries: 3, backoffMs: 250 }, status: 'ACTIVE', ownerId: 'user-2' }),
  config({ id: 'cfg-16', name: 'Feature: Dark Mode', key: 'feature.dark_mode', description: 'Enable dark mode option.', category: 'Features', environmentId: 'env-dev', type: 'BOOLEAN', value: true, defaultValue: true, status: 'ACTIVE', ownerId: 'user-6' }),
];

function audit(
  id: number,
  daysAgo: number,
  userId: string,
  userName: string,
  action: AuditEvent['action'],
  entity: AuditEvent['entity'],
  entityId: string | null,
  environmentId: string | null,
  description: string,
  result: AuditEvent['result'] = 'SUCCESS',
): AuditEvent {
  const ts = new Date('2026-09-25T09:00:00.000Z');
  ts.setDate(ts.getDate() - daysAgo);
  return { id: `audit-${id}`, timestamp: ts.toISOString(), userId, userName, action, entity, entityId, environmentId, description, result };
}

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  audit(1, 0, 'user-1', 'Amara Okafor', 'LOGIN', 'AUTH', null, null, 'Administrator signed in.'),
  audit(2, 0, 'user-1', 'Amara Okafor', 'UPDATE', 'CONFIGURATION', 'cfg-2', 'env-prod', 'Changed upload.max_size_mb from 25 to 50.'),
  audit(3, 1, 'user-2', 'Lerato Molefe', 'CREATE', 'CONFIGURATION', 'cfg-16', 'env-dev', 'Created feature.dark_mode.'),
  audit(4, 1, 'user-2', 'Lerato Molefe', 'ENABLE', 'CONFIGURATION', 'cfg-1', 'env-prod', 'Enabled feature.new_dashboard.'),
  audit(5, 2, 'user-6', 'Fatima Al-Sayed', 'DISABLE', 'CONFIGURATION', 'cfg-5', 'env-prod', 'Disabled ops.maintenance_window.'),
  audit(6, 2, 'user-4', 'Chloe Bennett', 'UPDATE', 'CONFIGURATION', 'cfg-4', 'env-prod', 'Updated ui.default_theme.'),
  audit(7, 3, 'user-7', 'Diego Fernandez', 'CREATE', 'CONFIGURATION', 'cfg-7', 'env-stage', 'Created feature.beta_search.'),
  audit(8, 3, 'user-3', 'Sipho Ndlovu', 'LOGIN', 'AUTH', null, null, 'Viewer signed in.'),
  audit(9, 4, 'user-1', 'Amara Okafor', 'CREATE', 'USER', 'user-8', null, 'Created user Mei Tanaka.'),
  audit(10, 4, 'user-6', 'Fatima Al-Sayed', 'UPDATE', 'SETTINGS', null, null, 'Updated session timeout setting.'),
  audit(11, 5, 'user-2', 'Lerato Molefe', 'UPDATE', 'CONFIGURATION', 'cfg-8', 'env-stage', 'Updated security.session_timeout.'),
  audit(12, 5, 'user-5', 'Rajesh Iyer', 'LOGIN', 'AUTH', null, null, 'Failed login attempt.', 'FAILURE'),
  audit(13, 6, 'user-1', 'Amara Okafor', 'DELETE', 'CONFIGURATION', 'cfg-old-1', 'env-dev', 'Deleted deprecated flag legacy.enabled.'),
  audit(14, 6, 'user-4', 'Chloe Bennett', 'CREATE', 'CONFIGURATION', 'cfg-15', 'env-dev', 'Created api.retry_policy.'),
  audit(15, 7, 'user-7', 'Diego Fernandez', 'UPDATE', 'ENVIRONMENT', 'env-test', null, 'Updated Testing environment description.'),
  audit(16, 7, 'user-6', 'Fatima Al-Sayed', 'ENABLE', 'USER', 'user-3', null, 'Activated user Sipho Ndlovu.'),
  audit(17, 8, 'user-1', 'Amara Okafor', 'DISABLE', 'USER', 'user-5', null, 'Deactivated user Rajesh Iyer.'),
  audit(18, 8, 'user-2', 'Lerato Molefe', 'LOGOUT', 'AUTH', null, null, 'Configuration manager signed out.'),
  audit(19, 9, 'user-4', 'Chloe Bennett', 'UPDATE', 'CONFIGURATION', 'cfg-12', 'env-test', 'Updated perf.cache_ttl.'),
  audit(20, 9, 'user-7', 'Diego Fernandez', 'CREATE', 'CONFIGURATION', 'cfg-14', 'env-dev', 'Created api.sandbox_base_url.'),
  audit(21, 10, 'user-6', 'Fatima Al-Sayed', 'UPDATE', 'ROLE', 'role-2', null, 'Reviewed Configuration Manager permissions.'),
  audit(22, 10, 'user-1', 'Amara Okafor', 'LOGIN', 'AUTH', null, null, 'Administrator signed in.'),
];

export const MOCK_SETTINGS: SystemSettings = {
  applicationName: 'Configuration Management Portal',
  defaultEnvironmentId: 'env-dev',
  sessionTimeoutMinutes: 30,
  dateTimeFormat: 'yyyy-MM-dd HH:mm',
  defaultPageSize: 10,
  enableAuditLogging: true,
  enableNotifications: true,
};
