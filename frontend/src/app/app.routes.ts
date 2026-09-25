import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Sign in',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        canActivate: [permissionGuard('dashboard:view')],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard',
      },
      {
        path: 'configuration',
        canActivate: [permissionGuard('configuration:view')],
        loadChildren: () =>
          import('./features/configuration/configuration.routes').then((m) => m.configurationRoutes),
      },
      {
        path: 'environments',
        canActivate: [permissionGuard('environment:view')],
        loadComponent: () =>
          import('./features/environments/environment-list.component').then(
            (m) => m.EnvironmentListComponent,
          ),
        title: 'Environments',
      },
      {
        path: 'applications',
        canActivate: [permissionGuard('application:view')],
        loadChildren: () =>
          import('./features/applications/applications.routes').then((m) => m.applicationsRoutes),
      },
      {
        path: 'subscription',
        canActivate: [permissionGuard('subscription:view')],
        loadComponent: () =>
          import('./features/subscriptions/subscription-usage.component').then(
            (m) => m.SubscriptionUsageComponent,
          ),
        title: 'Subscription & Usage',
      },
      {
        path: 'users',
        canActivate: [permissionGuard('user:view', 'user:manage')],
        loadChildren: () => import('./features/users/users.routes').then((m) => m.usersRoutes),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard('role:view', 'role:manage')],
        loadComponent: () =>
          import('./features/roles/role-list.component').then((m) => m.RoleListComponent),
        title: 'Roles & Permissions',
      },
      {
        path: 'audit-log',
        canActivate: [permissionGuard('audit:view')],
        loadComponent: () =>
          import('./features/audit-log/audit-log.component').then((m) => m.AuditLogComponent),
        title: 'Audit Log',
      },
      {
        path: 'settings',
        canActivate: [permissionGuard('settings:view', 'settings:manage')],
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'System Settings',
      },
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./features/errors/forbidden.component').then((m) => m.ForbiddenComponent),
        title: 'Access denied',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
