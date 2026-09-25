import { Permission } from '../core/models/role.model';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** User needs at least one of these permissions to see the item. */
  permissions: Permission[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', icon: 'dashboard', route: '/dashboard', permissions: ['dashboard:view'] }],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'All Configurations', icon: 'tune', route: '/configuration', permissions: ['configuration:view'] },
      { label: 'Environments', icon: 'dns', route: '/environments', permissions: ['environment:view'] },
      { label: 'Applications', icon: 'apps', route: '/applications', permissions: ['application:view', 'application:manage'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', icon: 'group', route: '/users', permissions: ['user:view', 'user:manage'] },
      { label: 'Roles & Permissions', icon: 'admin_panel_settings', route: '/roles', permissions: ['role:view', 'role:manage'] },
      { label: 'Audit Log', icon: 'history', route: '/audit-log', permissions: ['audit:view'] },
      { label: 'Subscription', icon: 'workspace_premium', route: '/subscription', permissions: ['subscription:view'] },
      { label: 'System Settings', icon: 'settings', route: '/settings', permissions: ['settings:view', 'settings:manage'] },
    ],
  },
];
